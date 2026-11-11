import { describe, expect, it } from "vitest";
import { env } from "cloudflare:workers";
import { claimLogicalTask } from "../src/claim-outbox.mjs";
import { createTaskAttempt, acquireAttemptLease, finalizeTaskAttempt } from "../src/task-attempts.mjs";
import { createProjectionDeliveryOrchestrator } from "../src/projection-delivery.mjs";
import * as projectionOutbox from "../src/projection-outbox.mjs";

const NOW = 1_810_000_000;
let sequence = 0;

const apiFactory = () => ({
  comments: [],
  labels: ["triage", "pool:claimed"],
  async listComments() { return this.comments.map(x => ({ ...x })); },
  async createComment(_repo, _issue, body) { this.comments.push({ body }); },
  async listLabels() { return [...this.labels]; },
  async addLabels(_repo, _issue, labels) {
    for (const label of labels) if (!this.labels.includes(label)) this.labels.push(label);
  },
  async removeLabel(_repo, _issue, label) {
    this.labels = this.labels.filter(value => value !== label);
  }
});

async function createOutbox() {
  sequence += 1;
  const n = sequence;
  const approval = {
    approvalId: `approval-projection-orch-${n}`,
    ownerNumericId: "10001",
    repositoryId: "20002",
    issueNumber: 1000 + n,
    targetSha: String(n.toString(16)).padStart(40, "0"),
    profile: "dsh-headless-probe",
    envelopeDigest: String((n + 1).toString(16)).padStart(64, "0")
  };
  await env.POOL_DB.prepare(`
    INSERT INTO pool_approval_ledger (
      approval_id, owner_numeric_id, repository_id, issue_number,
      target_sha, profile, envelope_digest, expires_at, state, consumed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ready', NULL)
  `).bind(
    approval.approvalId, approval.ownerNumericId, approval.repositoryId,
    approval.issueNumber, approval.targetSha, approval.profile,
    approval.envelopeDigest, NOW + 3600
  ).run();

  const claimed = await claimLogicalTask(env.POOL_DB, approval, NOW);
  expect(claimed.decision).toBe("TASK_CREATED_OR_ATTACHED");
  const attemptId = `attempt-projection-orch-${n}`;
  const created = await createTaskAttempt(env.POOL_DB, {
    taskKey: claimed.taskKey, attemptId, attemptNumber: 1,
    inputDigest: "d".repeat(64), executionIdempotencyKey: `exec-${n}`, now: NOW + 1
  });
  expect(created.decision).toBe("ATTEMPT_CREATED");
  const lease = await acquireAttemptLease(
    env.POOL_DB, claimed.taskKey, `terminal-worker-${n}`, NOW + 2, 60
  );
  expect(lease.decision).toBe("LEASE_ACQUIRED");
  const finalized = await finalizeTaskAttempt(env.POOL_DB, {
    taskKey: claimed.taskKey, attemptId, workerId: `terminal-worker-${n}`,
    generation: lease.generation, status: "succeeded",
    resultDigest: "9".repeat(64), provenanceDigest: "8".repeat(64),
    terminalReason: "completed", now: NOW + 3
  });
  expect(finalized.decision).toBe("ATTEMPT_FINALIZED");
  return `attempt-finalized:${attemptId}`;
}

describe("receipt-bound projection orchestration", () => {
  it("does not export a receipt-free delivery acknowledgement primitive", () => {
    expect("acknowledgeProjectionDelivered" in projectionOutbox).toBe(false);
  });
  it("ACKs only after matching marker and managed-label read-back, then verifies D1 read-back", async () => {
    const outboxId = await createOutbox();
    let now = NOW + 10;
    const api = apiFactory();
    const orchestrator = createProjectionDeliveryOrchestrator({
      db: env.POOL_DB, api, workerId: "projection-runtime", clock: { now: () => now }
    });
    const result = await orchestrator.deliver(outboxId, {
      projection_verified: true, eventId: outboxId, payloadDigest: "f".repeat(64)
    });
    expect(result).toMatchObject({
      decision: "PROJECTION_DELIVERED",
      dispatch: false,
      projection_verified: true,
      outboxId
    });
    expect(api.comments).toHaveLength(1);
    const row = await env.POOL_DB.prepare(
      "SELECT status, event_digest, lease_owner, lease_expires_at, lease_generation_delivery FROM pool_attempt_projection_outbox WHERE outbox_id = ?"
    ).bind(outboxId).first();
    expect(row.status).toBe("delivered");
    expect(row.event_digest).toBe(result.eventDigest);
    expect(row.lease_owner).toBeNull();
    expect(row.lease_expires_at).toBeNull();
    expect(row.lease_generation_delivery).toBe(result.deliveryGeneration);
  });

  it("does not ACK when reconciliation cannot verify the projection", async () => {
    const outboxId = await createOutbox();
    const api = apiFactory();
    api.listComments = async () => { throw new Error("read unavailable"); };
    const orchestrator = createProjectionDeliveryOrchestrator({
      db: env.POOL_DB, api, workerId: "projection-runtime", clock: { now: () => NOW + 10 }
    });
    const result = await orchestrator.deliver(outboxId);
    expect(result.decision).toBe("PROJECTION_RETRYABLE");
    const row = await env.POOL_DB.prepare(
      "SELECT status, delivered_at FROM pool_attempt_projection_outbox WHERE outbox_id = ?"
    ).bind(outboxId).first();
    expect(row.status).toBe("retryable");
    expect(row.delivered_at).toBeNull();
  });

  it("rejects a reconciler result with a mismatched event digest", async () => {
    const outboxId = await createOutbox();
    const orchestrator = createProjectionDeliveryOrchestrator({
      db: env.POOL_DB, api: apiFactory(), workerId: "projection-runtime",
      clock: { now: () => NOW + 10 },
      reconcile: async (_api, envelope) => ({
        decision: "PROJECTION_VERIFIED", projection_verified: true,
        eventId: envelope.eventId, payloadDigest: "f".repeat(64)
      })
    });
    const result = await orchestrator.deliver(outboxId);
    expect(result).toMatchObject({ decision: "DENY", reason: "PROJECTION_RECEIPT_MISMATCH" });
    const row = await env.POOL_DB.prepare(
      "SELECT status, delivered_at FROM pool_attempt_projection_outbox WHERE outbox_id = ?"
    ).bind(outboxId).first();
    expect(row.status).toBe("leased");
    expect(row.delivered_at).toBeNull();
  });

  it("rejects expired leases even when the projection was verified", async () => {
    const outboxId = await createOutbox();
    let now = NOW + 10;
    const api = apiFactory();
    api.listLabels = async () => {
      now = NOW + 100;
      return [...api.labels];
    };
    const orchestrator = createProjectionDeliveryOrchestrator({
      db: env.POOL_DB, api, workerId: "projection-runtime",
      clock: { now: () => now }, leaseSeconds: 30
    });
    const result = await orchestrator.deliver(outboxId);
    expect(result).toMatchObject({ decision: "DENY" });
    const row = await env.POOL_DB.prepare(
      "SELECT status, delivered_at FROM pool_attempt_projection_outbox WHERE outbox_id = ?"
    ).bind(outboxId).first();
    expect(row.status).toBe("leased");
    expect(row.delivered_at).toBeNull();
  });
});
