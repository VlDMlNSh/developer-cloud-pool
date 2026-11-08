import { beforeEach, describe, expect, it } from "vitest";
import { env } from "cloudflare:workers";
import { claimAndEnqueue, claimLogicalTask } from "../src/claim-outbox.mjs";
import { acquireTaskLease, renewTaskLease, finalizeTaskLease } from "../src/task-lease.mjs";

const NOW = 1_800_000_000;
const approval = {
  approvalId: "approval-outbox-001",
  ownerNumericId: "10001",
  repositoryId: "20002",
  issueNumber: 42,
  targetSha: "a".repeat(40),
  profile: "dsh-headless-probe",
  envelopeDigest: "b".repeat(64)
};

async function seed(overrides = {}) {
  const row = { ...approval, expiresAt: NOW + 3600, state: "ready", consumedAt: null, ...overrides };
  await env.POOL_DB.prepare(`
    INSERT INTO pool_approval_ledger (
      approval_id, owner_numeric_id, repository_id, issue_number,
      target_sha, profile, envelope_digest, expires_at, state, consumed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    row.approvalId, row.ownerNumericId, row.repositoryId, row.issueNumber,
    row.targetSha, row.profile, row.envelopeDigest, row.expiresAt, row.state, row.consumedAt
  ).run();
}

beforeEach(async () => {
  await env.POOL_DB.prepare("DROP TRIGGER IF EXISTS test_abort_outbox_insert").run();
  await env.POOL_DB.prepare("DELETE FROM pool_task_delivery_outbox").run();
  await env.POOL_DB.prepare("DELETE FROM pool_task_approvals").run();
  await env.POOL_DB.prepare("DELETE FROM pool_tasks").run();
  await env.POOL_DB.prepare("DELETE FROM pool_task_outbox").run();
  await env.POOL_DB.prepare("DELETE FROM pool_task_claims").run();
  await env.POOL_DB.prepare("DELETE FROM pool_approval_ledger").run();
  await seed();
});

describe("atomic D1 claim and transactional outbox", () => {
  it("commits one claim and one outbox event under 12 concurrent attempts", async () => {
    const results = await Promise.all(
      Array.from({ length: 12 }, () => claimAndEnqueue(env.POOL_DB, approval, NOW))
    );
    expect(results.filter((r) => r.decision === "CLAIMED_ONCE")).toHaveLength(1);
    expect(results.filter((r) => r.decision === "ALREADY_ENQUEUED")).toHaveLength(11);
    expect(results.every((r) => r.dispatch === false)).toBe(true);

    const claims = await env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_task_claims").first();
    const outbox = await env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_task_outbox").first();
    const ledger = await env.POOL_DB.prepare(
      "SELECT state FROM pool_approval_ledger WHERE approval_id = ?"
    ).bind(approval.approvalId).first();
    expect(claims.n).toBe(1);
    expect(outbox.n).toBe(1);
    expect(ledger.state).toBe("consumed");
  });

  it("returns the same deterministic claim and outbox IDs on retry", async () => {
    const first = await claimAndEnqueue(env.POOL_DB, approval, NOW);
    const retry = await claimAndEnqueue(env.POOL_DB, approval, NOW);
    expect(first).toMatchObject({
      decision: "CLAIMED_ONCE",
      claimId: approval.approvalId,
      outboxId: `pool-task:${approval.approvalId}`
    });
    expect(retry).toMatchObject({
      decision: "ALREADY_ENQUEUED",
      claimId: approval.approvalId,
      outboxId: `pool-task:${approval.approvalId}`,
      dispatch: false
    });
  });

  it("denies retries whose immutable binding differs from the existing claim", async () => {
    const first = await claimAndEnqueue(env.POOL_DB, approval, NOW);
    expect(first.decision).toBe("CLAIMED_ONCE");

    const mismatchedRetry = await claimAndEnqueue(
      env.POOL_DB, { ...approval, ownerNumericId: "99999" }, NOW
    );
    expect(mismatchedRetry).toMatchObject({
      decision: "DENY",
      dispatch: false,
      reason: "CLAIM_NOT_CREATED_OR_ALREADY_CONSUMED"
    });
  });

  it("does not create a claim for a binding mismatch", async () => {
    const result = await claimAndEnqueue(
      env.POOL_DB, { ...approval, targetSha: "c".repeat(40) }, NOW
    );
    expect(result.decision).toBe("DENY");
    const count = await env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_task_claims").first();
    expect(count.n).toBe(0);
  });

  it("does not create a claim from a pre-consumed approval with the same timestamp", async () => {
    const alreadyConsumed = { ...approval, approvalId: "approval-preconsumed-001" };
    await seed({ ...alreadyConsumed, state: "consumed", consumedAt: NOW });

    const result = await claimAndEnqueue(env.POOL_DB, alreadyConsumed, NOW);
    expect(result).toMatchObject({
      decision: "DENY",
      dispatch: false,
      reason: "CLAIM_NOT_CREATED_OR_ALREADY_CONSUMED"
    });
    const count = await env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_task_claims WHERE approval_id = ?")
      .bind(alreadyConsumed.approvalId).first();
    expect(count.n).toBe(0);
  });

  it("rolls back approval consumption and claim when outbox insertion fails", async () => {
    await env.POOL_DB.prepare(`
      CREATE TRIGGER test_abort_outbox_insert
      BEFORE INSERT ON pool_task_outbox
      BEGIN SELECT RAISE(ABORT, 'synthetic outbox failure'); END
    `).run();

    const result = await claimAndEnqueue(env.POOL_DB, approval, NOW);
    expect(result).toMatchObject({
      decision: "DENY",
      dispatch: false,
      reason: "CLAIM_TRANSACTION_AMBIGUOUS"
    });

    const ledger = await env.POOL_DB.prepare(
      "SELECT state, consumed_at FROM pool_approval_ledger WHERE approval_id = ?"
    ).bind(approval.approvalId).first();
    const claims = await env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_task_claims").first();
    expect(ledger.state).toBe("ready");
    expect(ledger.consumed_at).toBeNull();
    expect(claims.n).toBe(0);
  });
});


describe("canonical task identity across independent approvals", () => {
  const approvalFor = (approvalId: string, digest: string) => ({
    ...approval, approvalId, envelopeDigest: digest.repeat(64)
  });

  it("attaches two independently consumed approvals to one task and one task-level outbox", async () => {
    const first = approvalFor("approval-task-a", "c");
    const second = approvalFor("approval-task-b", "d");
    await seed(first);
    await seed(second);

    const results = await Promise.all([
      claimLogicalTask(env.POOL_DB, first, NOW),
      claimLogicalTask(env.POOL_DB, second, NOW)
    ]);

    expect(results.every((r) => r.decision === "TASK_CREATED_OR_ATTACHED")).toBe(true);
    expect(results[0].taskKey).toBe(results[1].taskKey);
    expect(results[0].outboxId).toBe(results[1].outboxId);
    expect(results.every((r) => r.dispatch === false)).toBe(true);

    const tasks = await env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_tasks").first();
    const approvals = await env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_task_approvals").first();
    const outbox = await env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_task_delivery_outbox").first();
    expect(tasks.n).toBe(1);
    expect(approvals.n).toBe(2);
    expect(outbox.n).toBe(1);
  });

  it("preserves distinct task identities for a different target SHA", async () => {
    const first = approvalFor("approval-task-sha-a", "e");
    const second = { ...approvalFor("approval-task-sha-b", "f"), targetSha: "c".repeat(40) };
    await seed(first);
    await seed(second);

    const [a, b] = await Promise.all([
      claimLogicalTask(env.POOL_DB, first, NOW),
      claimLogicalTask(env.POOL_DB, second, NOW)
    ]);
    expect(a.taskKey).not.toBe(b.taskKey);
    const tasks = await env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_tasks").first();
    expect(tasks.n).toBe(2);
  });

  it("returns the same task identity on an exact retry without creating another outbox", async () => {
    const item = approvalFor("approval-task-retry", "a");
    await seed(item);
    const first = await claimLogicalTask(env.POOL_DB, item, NOW);
    const retry = await claimLogicalTask(env.POOL_DB, item, NOW);
    expect(first.taskKey).toBe(retry.taskKey);
    expect(retry.decision).toBe("TASK_ALREADY_ATTACHED");
    const outbox = await env.POOL_DB.prepare("SELECT COUNT(*) AS n FROM pool_task_delivery_outbox").first();
    expect(outbox.n).toBe(1);
  });
});


describe("generation-fenced logical task leases", () => {
  async function createTask() {
    const item = { ...approval, approvalId: "approval-lease-test", envelopeDigest: "9".repeat(64) };
    await seed(item);
    const claimed = await claimLogicalTask(env.POOL_DB, item, NOW);
    expect(claimed.decision).toBe("TASK_CREATED_OR_ATTACHED");
    return claimed.taskKey;
  }

  it("increments generation on reclaim and rejects stale renewals and finalizers", async () => {
    const taskKey = await createTask();
    const first = await acquireTaskLease(env.POOL_DB, taskKey, "worker-a", NOW, 30);
    expect(first.decision).toBe("LEASE_ACQUIRED");
    expect(first.generation).toBe(1);

    const second = await acquireTaskLease(env.POOL_DB, taskKey, "worker-b", NOW + 31, 30);
    expect(second.decision).toBe("LEASE_ACQUIRED");
    expect(second.generation).toBe(2);

    const staleRenew = await renewTaskLease(env.POOL_DB, taskKey, "worker-a", 1, NOW + 32, 30);
    const staleFinish = await finalizeTaskLease(env.POOL_DB, taskKey, "worker-a", 1, NOW + 32);
    expect(staleRenew).toMatchObject({ decision: "DENY", reason: "STALE_OR_EXPIRED_LEASE" });
    expect(staleFinish).toMatchObject({ decision: "DENY", reason: "STALE_OR_EXPIRED_FINALIZER" });

    const currentRenew = await renewTaskLease(env.POOL_DB, taskKey, "worker-b", 2, NOW + 32, 30);
    expect(currentRenew.decision).toBe("LEASE_RENEWED");
    const currentFinish = await finalizeTaskLease(env.POOL_DB, taskKey, "worker-b", 2, NOW + 33);
    expect(currentFinish.decision).toBe("TASK_COMPLETED");
    const row = await env.POOL_DB.prepare("SELECT state, lease_generation FROM pool_tasks WHERE task_key = ?")
      .bind(taskKey).first();
    expect(row).toMatchObject({ state: "completed", lease_generation: 2 });
  });

  it("does not allow a second worker to steal a live lease", async () => {
    const taskKey = await createTask();
    const first = await acquireTaskLease(env.POOL_DB, taskKey, "worker-a", NOW, 60);
    const second = await acquireTaskLease(env.POOL_DB, taskKey, "worker-b", NOW + 1, 60);
    expect(first.generation).toBe(1);
    expect(second).toMatchObject({ decision: "DENY", reason: "TASK_NOT_LEASEABLE" });
  });

  it("rejects renewal after lease expiry even when owner and generation match", async () => {
    const taskKey = await createTask();
    const lease = await acquireTaskLease(env.POOL_DB, taskKey, "worker-a", NOW, 10);
    const result = await renewTaskLease(env.POOL_DB, taskKey, "worker-a", lease.generation, NOW + 10, 10);
    expect(result).toMatchObject({ decision: "DENY", reason: "STALE_OR_EXPIRED_LEASE" });
  });
});


describe("task identity conflict rollback and bounded delivery attempts", () => {
  it("rolls back approval consumption when an existing task key has conflicting immutable bindings", async () => {
    const item = { ...approval, approvalId: "approval-conflict", envelopeDigest: "b".repeat(64) };
    await seed(item);
    const canonical = JSON.stringify([
      "pool-task-v1", item.repositoryId, item.issueNumber,
      item.targetSha, item.profile, 1
    ]);
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
    const taskKey = [...new Uint8Array(digest)].map((v) => v.toString(16).padStart(2, "0")).join("");

    await env.POOL_DB.prepare(`
      INSERT INTO pool_tasks (
        task_key, repository_id, issue_number, target_sha, profile,
        state, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
    `).bind(taskKey, "999999", item.issueNumber, item.targetSha, item.profile, NOW, NOW).run();

    const result = await claimLogicalTask(env.POOL_DB, item, NOW);
    expect(result).toMatchObject({ decision: "DENY", reason: "TASK_KEY_BINDING_CONFLICT" });
    const ledger = await env.POOL_DB.prepare(
      "SELECT state, consumed_at FROM pool_approval_ledger WHERE approval_id = ?"
    ).bind(item.approvalId).first();
    expect(ledger).toMatchObject({ state: "ready", consumed_at: null });
    const attached = await env.POOL_DB.prepare(
      "SELECT COUNT(*) AS n FROM pool_task_approvals WHERE approval_id = ?"
    ).bind(item.approvalId).first();
    expect(attached.n).toBe(0);
  });

  it("dead-letters a task after the fixed maximum of five lease attempts", async () => {
    const item = { ...approval, approvalId: "approval-attempt-cap", envelopeDigest: "8".repeat(64) };
    await seed(item);
    const claimed = await claimLogicalTask(env.POOL_DB, item, NOW);
    expect(claimed.decision).toBe("TASK_CREATED_OR_ATTACHED");

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const lease = await acquireTaskLease(env.POOL_DB, claimed.taskKey, `worker-${attempt}`, NOW + attempt * 2, 1);
      expect(lease.decision).toBe("LEASE_ACQUIRED");
    }
    const denied = await acquireTaskLease(env.POOL_DB, claimed.taskKey, "worker-final", NOW + 20, 1);
    expect(denied).toMatchObject({ decision: "DENY", reason: "ATTEMPT_LIMIT_REACHED" });
    const row = await env.POOL_DB.prepare(
      "SELECT state, attempt_count FROM pool_tasks WHERE task_key = ?"
    ).bind(claimed.taskKey).first();
    expect(row).toMatchObject({ state: "dead", attempt_count: 5 });
    const outbox = await env.POOL_DB.prepare(
      "SELECT status FROM pool_task_delivery_outbox WHERE task_key = ?"
    ).bind(claimed.taskKey).first();
    expect(outbox).toMatchObject({ status: "dead" });
  });
});
