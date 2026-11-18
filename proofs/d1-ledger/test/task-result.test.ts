import { describe, expect, it } from "vitest";
import { env } from "cloudflare:workers";
import { claimLogicalTask } from "../src/claim-outbox.mjs";
import { acquireTaskLease } from "../src/task-lease.mjs";
import { commitTaskResult } from "../src/task-result.mjs";

const NOW = 1_800_000_000;
let sequence = 0;

async function createTask() {
  sequence += 1;
  const suffix = String(sequence);
  const approval = {
    approvalId: `approval-result-fence-${suffix}`,
    ownerNumericId: "10001",
    repositoryId: "20002",
    issueNumber: 1000 + sequence,
    targetSha: "a".repeat(40),
    profile: "dsh-headless-probe",
    envelopeDigest: "b".repeat(64)
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
  return claimed.taskKey;
}

describe("fenced durable task result and effect intent", () => {
  it("rejects an expired worker after reclaim and accepts only the current attempt", async () => {
    const taskKey = await createTask();
    const oldLease = await acquireTaskLease(env.POOL_DB, taskKey, "worker-shared", NOW, 10);
    const currentLease = await acquireTaskLease(
      env.POOL_DB, taskKey, "worker-shared", NOW + 11, 60
    );

    expect(oldLease.generation).toBe(1);
    expect(currentLease.generation).toBe(2);

    const stale = await commitTaskResult(env.POOL_DB, {
      taskKey, workerId: oldLease.workerId, generation: oldLease.generation,
      leaseAttemptId: oldLease.leaseAttemptId,
      resultDigest: "c".repeat(64), resultRef: "artifact-old", now: NOW + 12
    });
    expect(stale).toMatchObject({
      decision: "DENY", reason: "STALE_OR_EXPIRED_RESULT_WRITER", dispatch: false
    });

    const noResult = await env.POOL_DB.prepare(
      "SELECT COUNT(*) AS n FROM pool_task_results WHERE task_key = ?"
    ).bind(taskKey).first();
    const noEffect = await env.POOL_DB.prepare(
      "SELECT COUNT(*) AS n FROM pool_task_result_outbox WHERE task_key = ?"
    ).bind(taskKey).first();
    expect(noResult.n).toBe(0);
    expect(noEffect.n).toBe(0);

    const accepted = await commitTaskResult(env.POOL_DB, {
      taskKey, workerId: currentLease.workerId, generation: currentLease.generation,
      leaseAttemptId: currentLease.leaseAttemptId,
      resultDigest: "d".repeat(64), resultRef: "artifact-current", now: NOW + 12
    });
    expect(accepted).toMatchObject({
      decision: "RESULT_COMMITTED",
      effectId: `pool-result:${taskKey}`,
      generation: 2,
      dispatch: false
    });

    const task = await env.POOL_DB.prepare(
      "SELECT state, lease_owner, lease_attempt_id, lease_expires_at FROM pool_tasks WHERE task_key = ?"
    ).bind(taskKey).first();
    expect(task).toMatchObject({
      state: "completed", lease_owner: null, lease_attempt_id: null, lease_expires_at: null
    });
  });

  it("is idempotent for the same result and rejects a different result for the same task", async () => {
    const taskKey = await createTask();
    const lease = await acquireTaskLease(env.POOL_DB, taskKey, "worker-idempotent", NOW, 60);
    const input = {
      taskKey, workerId: lease.workerId, generation: lease.generation,
      leaseAttemptId: lease.leaseAttemptId,
      resultDigest: "e".repeat(64), resultRef: "artifact-stable", now: NOW + 1
    };

    const first = await commitTaskResult(env.POOL_DB, input);
    const retry = await commitTaskResult(env.POOL_DB, input);
    const conflict = await commitTaskResult(env.POOL_DB, {
      ...input, resultDigest: "f".repeat(64), resultRef: "artifact-substituted"
    });

    expect(first.decision).toBe("RESULT_COMMITTED");
    expect(retry.decision).toBe("RESULT_ALREADY_COMMITTED");
    expect(conflict).toMatchObject({
      decision: "DENY", reason: "RESULT_IDENTITY_CONFLICT", dispatch: false
    });

    const results = await env.POOL_DB.prepare(
      "SELECT COUNT(*) AS n FROM pool_task_results WHERE task_key = ?"
    ).bind(taskKey).first();
    const effects = await env.POOL_DB.prepare(
      "SELECT COUNT(*) AS n FROM pool_task_result_outbox WHERE task_key = ?"
    ).bind(taskKey).first();
    expect(results.n).toBe(1);
    expect(effects.n).toBe(1);
  });

  it("rolls back the result and task completion if outbox insertion fails", async () => {
    const taskKey = await createTask();
    const lease = await acquireTaskLease(env.POOL_DB, taskKey, "worker-rollback", NOW, 60);
    await env.POOL_DB.prepare(`
      CREATE TRIGGER test_abort_result_outbox
      BEFORE INSERT ON pool_task_result_outbox
      BEGIN SELECT RAISE(ABORT, 'synthetic result outbox failure'); END
    `).run();

    const result = await commitTaskResult(env.POOL_DB, {
      taskKey, workerId: lease.workerId, generation: lease.generation,
      leaseAttemptId: lease.leaseAttemptId,
      resultDigest: "9".repeat(64), resultRef: "artifact-rollback", now: NOW + 1
    });
    expect(result).toMatchObject({
      decision: "DENY", reason: "RESULT_COMMIT_AMBIGUOUS", dispatch: false
    });

    const persisted = await env.POOL_DB.prepare(
      "SELECT COUNT(*) AS n FROM pool_task_results WHERE task_key = ?"
    ).bind(taskKey).first();
    const effects = await env.POOL_DB.prepare(
      "SELECT COUNT(*) AS n FROM pool_task_result_outbox WHERE task_key = ?"
    ).bind(taskKey).first();
    const task = await env.POOL_DB.prepare(
      "SELECT state, lease_generation FROM pool_tasks WHERE task_key = ?"
    ).bind(taskKey).first();
    expect(persisted.n).toBe(0);
    expect(effects.n).toBe(0);
    expect(task).toMatchObject({ state: "leased", lease_generation: 1 });
    await env.POOL_DB.prepare("DROP TRIGGER IF EXISTS test_abort_result_outbox").run();
  });
});
