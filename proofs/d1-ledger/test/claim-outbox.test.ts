import { beforeEach, describe, expect, it } from "vitest";
import { env } from "cloudflare:workers";
import { claimAndEnqueue, claimLogicalTask } from "../src/claim-outbox.mjs";
import { acquireTaskLease, renewTaskLease, finalizeTaskLease } from "../src/task-lease.mjs";
import { createTaskAttempt, acquireAttemptLease, renewAttemptLease, finalizeTaskAttempt, markAttemptIndeterminate } from "../src/task-attempts.mjs";
import { acquireProjectionDelivery, markProjectionRetryable, acknowledgeProjectionDelivered } from "../src/projection-outbox.mjs";

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
  await env.POOL_DB.prepare("DROP TRIGGER IF EXISTS pool_attempt_events_no_update").run();
  await env.POOL_DB.prepare("DROP TRIGGER IF EXISTS pool_attempt_events_no_delete").run();
  await env.POOL_DB.prepare("DELETE FROM pool_attempt_projection_events").run();
  await env.POOL_DB.prepare("DELETE FROM pool_attempt_projection_outbox").run();
  await env.POOL_DB.prepare("DELETE FROM pool_attempt_reconciliations").run();
  await env.POOL_DB.prepare("DELETE FROM pool_attempt_events").run();
  await env.POOL_DB.prepare("DELETE FROM pool_attempts").run();
  await env.POOL_DB.prepare("DELETE FROM pool_task_delivery_outbox").run();
  await env.POOL_DB.prepare("DELETE FROM pool_task_approvals").run();
  await env.POOL_DB.prepare("DELETE FROM pool_tasks").run();
  await env.POOL_DB.prepare("DELETE FROM pool_task_outbox").run();
  await env.POOL_DB.prepare("DELETE FROM pool_task_claims").run();
  await env.POOL_DB.prepare("DELETE FROM pool_approval_ledger").run();
  await env.POOL_DB.prepare("CREATE TRIGGER pool_attempt_events_no_update BEFORE UPDATE ON pool_attempt_events BEGIN SELECT RAISE(ABORT, 'ATTEMPT_EVENTS_APPEND_ONLY'); END").run();
  await env.POOL_DB.prepare("CREATE TRIGGER pool_attempt_events_no_delete BEFORE DELETE ON pool_attempt_events BEGIN SELECT RAISE(ABORT, 'ATTEMPT_EVENTS_APPEND_ONLY'); END").run();
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


describe("immutable task attempts and fenced lease lifecycle", () => {
  async function createLogicalTask(approvalId = "approval-attempt-ledger") {
    const item = { ...approval, approvalId, envelopeDigest: "c".repeat(64) };
    await seed(item);
    const claimed = await claimLogicalTask(env.POOL_DB, item, NOW);
    expect(claimed.decision).toBe("TASK_CREATED_OR_ATTACHED");
    return claimed.taskKey;
  }

  async function createAttempt(taskKey, attemptNumber = 1, attemptId = `attempt-${attemptNumber}`) {
    const result = await createTaskAttempt(env.POOL_DB, {
      taskKey, attemptId, attemptNumber, inputDigest: "d".repeat(64),
      executionIdempotencyKey: `exec-${attemptId}`, now: NOW + attemptNumber
    });
    if (!["ATTEMPT_CREATED", "ATTEMPT_ALREADY_CREATED"].includes(result.decision)) {
      throw new Error(`createTaskAttempt failed: ${JSON.stringify(result)}`);
    }
    return result;
  }

  it("creates one immutable attempt and makes exact create retries idempotent", async () => {
    const taskKey = await createLogicalTask();
    const first = await createAttempt(taskKey);
    const replay = await createAttempt(taskKey);
    expect(first).toMatchObject({ decision: "ATTEMPT_CREATED", attemptNumber: 1 });
    expect(replay).toMatchObject({ decision: "ATTEMPT_ALREADY_CREATED", attemptNumber: 1 });
    const attempts = await env.POOL_DB.prepare(
      "SELECT attempt_id, attempt_number, status FROM pool_attempts WHERE task_key = ?"
    ).bind(taskKey).all();
    expect(attempts.results).toHaveLength(1);
    expect(attempts.results[0]).toMatchObject({ attempt_id: "attempt-1", attempt_number: 1, status: "prepared" });
    const events = await env.POOL_DB.prepare(
      "SELECT event_type FROM pool_attempt_events WHERE task_key = ?"
    ).bind(taskKey).all();
    expect(events.results.map((x) => x.event_type)).toEqual(["attempt.created"]);
  });

  it("keeps lease takeover separate from attempt count and denies expiry-only takeover", async () => {
    const taskKey = await createLogicalTask("approval-takeover");
    await createAttempt(taskKey);
    const first = await acquireAttemptLease(env.POOL_DB, taskKey, "worker-a", NOW + 2, 10);
    if (first.decision !== "ATTEMPT_LEASE_ACQUIRED") throw new Error(`acquireAttemptLease failed: ${JSON.stringify(first)}`);
    expect(first).toMatchObject({ decision: "ATTEMPT_LEASE_ACQUIRED", generation: 1, attemptId: "attempt-1" });

    const denied = await acquireAttemptLease(env.POOL_DB, taskKey, "worker-b", NOW + 12, 10);
    expect(denied).toMatchObject({ decision: "DENY", reason: "RECONCILIATION_REQUIRED" });

    const takeover = await acquireAttemptLease(
      env.POOL_DB, taskKey, "worker-b", NOW + 12, 10, { resumable: true }
    );
    expect(takeover).toMatchObject({ decision: "ATTEMPT_LEASE_ACQUIRED", generation: 2, attemptId: "attempt-1" });
    const task = await env.POOL_DB.prepare(
      "SELECT attempt_number, attempt_count, lease_generation FROM pool_tasks WHERE task_key = ?"
    ).bind(taskKey).first();
    expect(task).toMatchObject({ attempt_number: 1, attempt_count: 0, lease_generation: 2 });
    const leaseEvents = await env.POOL_DB.prepare(
      "SELECT actor_id, lease_generation FROM pool_attempt_events WHERE task_key = ? AND event_type = 'lease.acquired' ORDER BY lease_generation"
    ).bind(taskKey).all();
    expect(leaseEvents.results).toEqual([
      { actor_id: "worker-a", lease_generation: 1 },
      { actor_id: "worker-b", lease_generation: 2 }
    ]);

    const stale = await renewAttemptLease(
      env.POOL_DB, taskKey, "attempt-1", "worker-a", 1, NOW + 13, 10
    );
    expect(stale).toMatchObject({ decision: "DENY", reason: "STALE_OR_EXPIRED_ATTEMPT_LEASE" });
  });

  it("allows only one concurrent initial lease acquisition", async () => {
    const taskKey = await createLogicalTask("approval-concurrent-attempt");
    await createAttempt(taskKey);
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        acquireAttemptLease(env.POOL_DB, taskKey, `parallel-${i}`, NOW + 2, 20)
      )
    );
    expect(results.filter((x) => x.decision === "ATTEMPT_LEASE_ACQUIRED")).toHaveLength(1);
    expect(results.filter((x) => x.decision === "DENY")).toHaveLength(9);
  });

  it("finalizes attempt and task state with one terminal audit event", async () => {
    const taskKey = await createLogicalTask("approval-finalize-attempt");
    await createAttempt(taskKey);
    const lease = await acquireAttemptLease(env.POOL_DB, taskKey, "worker-final", NOW + 2, 30);
    const finish = await finalizeTaskAttempt(env.POOL_DB, {
      taskKey, attemptId: "attempt-1", workerId: "worker-final",
      generation: lease.generation, status: "succeeded",
      resultDigest: "e".repeat(64), provenanceDigest: "f".repeat(64),
      terminalReason: "completed", now: NOW + 3
    });
    expect(finish).toMatchObject({ decision: "ATTEMPT_FINALIZED", status: "succeeded" });
    const task = await env.POOL_DB.prepare(
      "SELECT state, lease_owner, lease_expires_at FROM pool_tasks WHERE task_key = ?"
    ).bind(taskKey).first();
    expect(task).toMatchObject({ state: "completed", lease_owner: null, lease_expires_at: null });
    const events = await env.POOL_DB.prepare(
      "SELECT event_type FROM pool_attempt_events WHERE attempt_id = ? ORDER BY rowid"
    ).bind("attempt-1").all();
    expect(events.results.map((x) => x.event_type)).toEqual([
      "attempt.created", "lease.acquired", "attempt.finalized"
    ]);
    const terminalEvent = await env.POOL_DB.prepare(
      "SELECT actor_id, lease_generation FROM pool_attempt_events WHERE event_type = 'attempt.finalized' AND attempt_id = ?"
    ).bind("attempt-1").first();
    expect(terminalEvent).toEqual({ actor_id: "worker-final", lease_generation: 1 });
    const replay = await finalizeTaskAttempt(env.POOL_DB, {
      taskKey, attemptId: "attempt-1", workerId: "worker-final",
      generation: lease.generation, status: "succeeded",
      resultDigest: "e".repeat(64), provenanceDigest: "f".repeat(64),
      terminalReason: "completed", now: NOW + 30
    });
    expect(replay).toMatchObject({
      decision: "ATTEMPT_ALREADY_FINALIZED", status: "succeeded",
      completedAt: NOW + 3
    });

    const conflictingReplay = await finalizeTaskAttempt(env.POOL_DB, {
      taskKey, attemptId: "attempt-1", workerId: "worker-final",
      generation: lease.generation, status: "succeeded",
      resultDigest: "a".repeat(64), provenanceDigest: "f".repeat(64),
      terminalReason: "completed", now: NOW + 3
    });
    expect(conflictingReplay).toMatchObject({
      decision: "DENY", reason: "STALE_OR_EXPIRED_ATTEMPT_FINALIZER"
    });
    const eventCount = await env.POOL_DB.prepare(
      "SELECT COUNT(*) AS n FROM pool_attempt_events WHERE attempt_id = ? AND event_type = 'attempt.finalized'"
    ).bind("attempt-1").first();
    expect(eventCount.n).toBe(1);
  });

  it("recovers an exact finalization after commit succeeds but the caller loses the response", async () => {
    const taskKey = await createLogicalTask("approval-finalize-ambiguous-response");
    await createAttempt(taskKey);
    const lease = await acquireAttemptLease(env.POOL_DB, taskKey, "worker-ambiguous", NOW + 2, 30);
    const originalPrepare = env.POOL_DB.prepare.bind(env.POOL_DB);
    let loseResponse = true;
    const ambiguousDb = {
      prepare(sql) {
        const statement = originalPrepare(sql);
        if (loseResponse && sql.includes("UPDATE pool_attempts")) {
          return {
            bind(...values) {
              const bound = statement.bind(...values);
              return {
                async run() {
                  const committed = await bound.run();
                  loseResponse = false;
                  if (committed?.success !== true || !(committed?.meta?.changes >= 1)) {
                    throw new Error("fault injection expected committed finalization");
                  }
                  throw new Error("simulated lost response after commit");
                }
              };
            }
          };
        }
        return statement;
      }
    };

    const first = await finalizeTaskAttempt(ambiguousDb, {
      taskKey, attemptId: "attempt-1", workerId: "worker-ambiguous",
      generation: lease.generation, status: "succeeded",
      resultDigest: "9".repeat(64), provenanceDigest: "8".repeat(64),
      terminalReason: "completed", now: NOW + 3
    });
    expect(first).toMatchObject({
      decision: "DENY", reason: "ATTEMPT_FINALIZATION_AMBIGUOUS"
    });

    const recovered = await finalizeTaskAttempt(env.POOL_DB, {
      taskKey, attemptId: "attempt-1", workerId: "worker-ambiguous",
      generation: lease.generation, status: "succeeded",
      resultDigest: "9".repeat(64), provenanceDigest: "8".repeat(64),
      terminalReason: "completed", now: NOW + 30
    });
    expect(recovered).toMatchObject({
      decision: "ATTEMPT_ALREADY_FINALIZED", status: "succeeded",
      completedAt: NOW + 3
    });

    const terminalEvents = await env.POOL_DB.prepare(
      "SELECT COUNT(*) AS n FROM pool_attempt_events WHERE attempt_id = ? AND event_type = 'attempt.finalized'"
    ).bind("attempt-1").first();
    const task = await env.POOL_DB.prepare(
      "SELECT state, lease_owner, lease_expires_at FROM pool_tasks WHERE task_key = ?"
    ).bind(taskKey).first();
    expect(terminalEvents.n).toBe(1);
    expect(task).toMatchObject({
      state: "completed", lease_owner: null, lease_expires_at: null
    });
  });

  it("preserves failed attempt history and creates a distinct retry attempt", async () => {
    const taskKey = await createLogicalTask("approval-retry-attempt");
    await createAttempt(taskKey);
    const lease = await acquireAttemptLease(env.POOL_DB, taskKey, "worker-retry", NOW + 2, 30);
    const failed = await finalizeTaskAttempt(env.POOL_DB, {
      taskKey, attemptId: "attempt-1", workerId: "worker-retry",
      generation: lease.generation, status: "failed",
      resultDigest: "1".repeat(64), provenanceDigest: "2".repeat(64),
      terminalReason: "executor_failed", now: NOW + 3
    });
    expect(failed.decision).toBe("ATTEMPT_FINALIZED");
    const retry = await createTaskAttempt(env.POOL_DB, {
      taskKey, attemptId: "attempt-2", attemptNumber: 2,
      inputDigest: "3".repeat(64), executionIdempotencyKey: "exec-attempt-2",
      now: NOW + 4
    });
    expect(retry).toMatchObject({ decision: "ATTEMPT_CREATED", attemptNumber: 2 });
    const rows = await env.POOL_DB.prepare(
      "SELECT attempt_id, attempt_number, status FROM pool_attempts WHERE task_key = ? ORDER BY attempt_number"
    ).bind(taskKey).all();
    expect(rows.results).toEqual([
      { attempt_id: "attempt-1", attempt_number: 1, status: "failed" },
      { attempt_id: "attempt-2", attempt_number: 2, status: "prepared" }
    ]);
  });

  it("marks an expired execution indeterminate and blocks blind takeover/retry", async () => {
    const taskKey = await createLogicalTask("approval-indeterminate-attempt");
    await createAttempt(taskKey);
    await acquireAttemptLease(env.POOL_DB, taskKey, "worker-unknown", NOW + 2, 5);
    const indeterminate = await markAttemptIndeterminate(env.POOL_DB, taskKey, "attempt-1", NOW + 7);
    expect(indeterminate.decision).toBe("ATTEMPT_INDETERMINATE");
    const indeterminateEvent = await env.POOL_DB.prepare(
      "SELECT actor_id, lease_generation FROM pool_attempt_events WHERE event_type = 'attempt.indeterminate' AND attempt_id = ?"
    ).bind("attempt-1").first();
    expect(indeterminateEvent).toEqual({ actor_id: "worker-unknown", lease_generation: 1 });
    const deniedTakeover = await acquireAttemptLease(
      env.POOL_DB, taskKey, "worker-replay", NOW + 8, 10, { resumable: true }
    );
    expect(deniedTakeover).toMatchObject({ decision: "DENY", reason: "ATTEMPT_NOT_LEASEABLE" });
    const deniedRetry = await createTaskAttempt(env.POOL_DB, {
      taskKey, attemptId: "attempt-2", attemptNumber: 2,
      inputDigest: "4".repeat(64), executionIdempotencyKey: "exec-attempt-2",
      now: NOW + 9
    });
    expect(deniedRetry.decision).toBe("DENY");
    const row = await env.POOL_DB.prepare(
      "SELECT status FROM pool_attempts WHERE attempt_id = ?"
    ).bind("attempt-1").first();
    expect(row.status).toBe("indeterminate");

    const reconciliation = await env.POOL_DB.prepare(`
      SELECT status, task_key, attempt_id, input_digest, lease_generation, expired_lease_owner
        FROM pool_attempt_reconciliations WHERE attempt_id = ?
    `).bind("attempt-1").first();
    expect(reconciliation).toMatchObject({
      status: "pending", task_key: taskKey, attempt_id: "attempt-1",
      input_digest: "d".repeat(64), lease_generation: 1,
      expired_lease_owner: "worker-unknown"
    });
    const task = await env.POOL_DB.prepare(
      "SELECT state, lease_owner, lease_generation, lease_expires_at FROM pool_tasks WHERE task_key = ?"
    ).bind(taskKey).first();
    // Expiry creates durable reconciliation work; it does not prove that
    // the executor stopped or authorize clearing the lease / retrying.
    expect(task).toMatchObject({
      state: "leased", lease_owner: "worker-unknown",
      lease_generation: 1, lease_expires_at: NOW + 7
    });
  });

  it("rejects mutation of immutable attempt identity and cross-attempt lease renewal", async () => {
    const taskKey = await createLogicalTask("approval-immutable-attempt");
    await createAttempt(taskKey);
    await expect(env.POOL_DB.prepare(
      "UPDATE pool_attempts SET input_digest = ? WHERE attempt_id = ?"
    ).bind("5".repeat(64), "attempt-1").run()).rejects.toThrow();
    const lease = await acquireAttemptLease(env.POOL_DB, taskKey, "worker-immutable", NOW + 2, 30);
    const wrongAttempt = await renewAttemptLease(
      env.POOL_DB, taskKey, "another-attempt", "worker-immutable", lease.generation, NOW + 3, 10
    );
    expect(wrongAttempt).toMatchObject({ decision: "DENY", reason: "STALE_OR_EXPIRED_ATTEMPT_LEASE" });
  });

  it("keeps attempt audit events append-only", async () => {
    const taskKey = await createLogicalTask("approval-append-only-events");
    await createAttempt(taskKey);
    await expect(env.POOL_DB.prepare(
      "UPDATE pool_attempt_events SET event_type = 'lease.acquired' WHERE event_id = ?"
    ).bind("attempt-created:attempt-1").run()).rejects.toThrow();
    await expect(env.POOL_DB.prepare(
      "DELETE FROM pool_attempt_events WHERE event_id = ?"
    ).bind("attempt-created:attempt-1").run()).rejects.toThrow();
    const count = await env.POOL_DB.prepare(
      "SELECT COUNT(*) AS n FROM pool_attempt_events WHERE task_key = ?"
    ).bind(taskKey).first();
    expect(count.n).toBe(1);
  });

  it("attaches 50 distinct concurrent approvals to exactly one logical task and one delivery outbox", async () => {
    const contenders = Array.from({ length: 50 }, (_, index) => ({
      ...approval,
      approvalId: `approval-contention-${String(index + 1).padStart(3, "0")}`,
      envelopeDigest: (index + 1).toString(16).padStart(2, "0").repeat(32)
    }));

    await Promise.all(contenders.map((item) => seed(item)));
    const results = await Promise.all(
      contenders.map((item) => claimLogicalTask(env.POOL_DB, item, NOW))
    );

    expect(results).toHaveLength(50);
    expect(results.every((result) =>
      result.decision === "TASK_CREATED_OR_ATTACHED" ||
      result.decision === "TASK_ALREADY_ATTACHED"
    )).toBe(true);
    expect(results.every((result) => result.dispatch === false)).toBe(true);
    expect(new Set(results.map((result) => result.taskKey)).size).toBe(1);
    expect(new Set(results.map((result) => result.outboxId)).size).toBe(1);

    const tasks = await env.POOL_DB.prepare(
      "SELECT COUNT(*) AS n FROM pool_tasks"
    ).first();
    const approvals = await env.POOL_DB.prepare(
      "SELECT COUNT(*) AS n FROM pool_task_approvals"
    ).first();
    const outbox = await env.POOL_DB.prepare(
      "SELECT COUNT(*) AS n FROM pool_task_delivery_outbox"
    ).first();
    const consumed = await env.POOL_DB.prepare(
      "SELECT COUNT(*) AS n FROM pool_approval_ledger WHERE state = 'consumed'"
    ).first();

    expect(tasks.n).toBe(1);
    expect(approvals.n).toBe(50);
    expect(outbox.n).toBe(1);
    expect(consumed.n).toBe(50);
  });

  it("creates projection intent atomically with terminal audit and fences concurrent delivery leases", async () => {
    const taskKey = await createLogicalTask("approval-projection-outbox");
    await createAttempt(taskKey);
    const lease = await acquireAttemptLease(env.POOL_DB, taskKey, "worker-terminal", NOW + 2, 60);
    const finalized = await finalizeTaskAttempt(env.POOL_DB, {
      taskKey, attemptId: "attempt-1", workerId: "worker-terminal",
      generation: lease.generation, status: "succeeded",
      resultDigest: "9".repeat(64), provenanceDigest: "8".repeat(64),
      terminalReason: "completed", now: NOW + 3
    });
    expect(finalized.decision).toBe("ATTEMPT_FINALIZED");
    const outboxId = "attempt-finalized:attempt-1";
    const intent = await env.POOL_DB.prepare(
      "SELECT task_key, attempt_id, repository_id, issue_number, target_sha, profile, terminal_status, status FROM pool_attempt_projection_outbox WHERE outbox_id = ?"
    ).bind(outboxId).first();
    expect(intent).toMatchObject({
      task_key: taskKey, attempt_id: "attempt-1", repository_id: approval.repositoryId,
      issue_number: approval.issueNumber, target_sha: approval.targetSha,
      profile: approval.profile, terminal_status: "succeeded", status: "pending"
    });
    const contenders = await Promise.all(Array.from({ length: 20 }, (_, i) =>
      acquireProjectionDelivery(env.POOL_DB, outboxId, `projection-worker-${i}`, NOW + 4, 30)
    ));
    const winners = contenders.filter(x => x.decision === "PROJECTION_LEASE_ACQUIRED");
    expect(winners).toHaveLength(1);
    expect(contenders.every(x => x.dispatch === false)).toBe(true);
    const eventCount = await env.POOL_DB.prepare(
      "SELECT COUNT(*) AS n FROM pool_attempt_projection_events WHERE outbox_id = ? AND event_type = 'delivery.leased'"
    ).bind(outboxId).first();
    expect(eventCount.n).toBe(1);
  });

  it("rejects stale delivery acknowledgement after lease expiry and takeover", async () => {
    const taskKey = await createLogicalTask("approval-projection-stale-ack");
    await createAttempt(taskKey);
    const lease = await acquireAttemptLease(env.POOL_DB, taskKey, "worker-terminal-2", NOW + 2, 60);
    await finalizeTaskAttempt(env.POOL_DB, {
      taskKey, attemptId: "attempt-1", workerId: "worker-terminal-2",
      generation: lease.generation, status: "succeeded",
      resultDigest: "7".repeat(64), provenanceDigest: "6".repeat(64),
      terminalReason: "completed", now: NOW + 3
    });
    const outboxId = "attempt-finalized:attempt-1";
    const first = await acquireProjectionDelivery(env.POOL_DB, outboxId, "projection-old", NOW + 4, 5);
    const second = await acquireProjectionDelivery(env.POOL_DB, outboxId, "projection-new", NOW + 10, 20);
    expect(first).toMatchObject({ decision: "PROJECTION_LEASE_ACQUIRED", lease_generation_delivery: 1 });
    expect(second).toMatchObject({ decision: "PROJECTION_LEASE_ACQUIRED", lease_generation_delivery: 2 });
    const stale = await acknowledgeProjectionDelivered(
      env.POOL_DB, outboxId, "projection-old", first.lease_generation_delivery, NOW + 11
    );
    expect(stale).toMatchObject({ decision: "DENY", reason: "STALE_OR_EXPIRED_PROJECTION_LEASE" });
    const accepted = await acknowledgeProjectionDelivered(
      env.POOL_DB, outboxId, "projection-new", second.lease_generation_delivery, NOW + 12
    );
    expect(accepted).toMatchObject({ decision: "PROJECTION_DELIVERED", generation: 2 });
    const row = await env.POOL_DB.prepare(
      "SELECT status, lease_owner, lease_expires_at, delivered_at FROM pool_attempt_projection_outbox WHERE outbox_id = ?"
    ).bind(outboxId).first();
    expect(row).toMatchObject({ status: "delivered", lease_owner: null, lease_expires_at: null, delivered_at: NOW + 12 });
  });

  it("records retryable transitions and keeps delivery history append-only", async () => {
    const taskKey = await createLogicalTask("approval-projection-retryable");
    await createAttempt(taskKey);
    const lease = await acquireAttemptLease(env.POOL_DB, taskKey, "worker-terminal-3", NOW + 2, 60);
    await finalizeTaskAttempt(env.POOL_DB, {
      taskKey, attemptId: "attempt-1", workerId: "worker-terminal-3",
      generation: lease.generation, status: "failed",
      resultDigest: "5".repeat(64), provenanceDigest: "4".repeat(64),
      terminalReason: "failed", now: NOW + 3
    });
    const outboxId = "attempt-finalized:attempt-1";
    const delivery = await acquireProjectionDelivery(env.POOL_DB, outboxId, "projection-retry", NOW + 4, 30);
    const retryable = await markProjectionRetryable(
      env.POOL_DB, outboxId, "projection-retry", delivery.lease_generation_delivery, NOW + 5
    );
    expect(retryable.decision).toBe("PROJECTION_RETRYABLE");
    const history = await env.POOL_DB.prepare(
      "SELECT event_type FROM pool_attempt_projection_events WHERE outbox_id = ? ORDER BY created_at, delivery_event_id"
    ).bind(outboxId).all();
    expect(history.results.map(x => x.event_type)).toEqual(["delivery.leased", "delivery.retryable"]);
    await expect(env.POOL_DB.prepare(
      "DELETE FROM pool_attempt_projection_events WHERE outbox_id = ?"
    ).bind(outboxId).run()).rejects.toThrow();
  });


});
