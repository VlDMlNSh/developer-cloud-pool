import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { recordAttemptReconciliation } from "../src/record-attempt-reconciliation.mjs";

const NOW = 1_800_100_000;
const ISSUER = "https://reconciliation.example.test";
const AUDIENCE = "cloud-pool-reconciliation-v1";

async function seedIndeterminate(suffix) {
  const taskKey = suffix.repeat(64).slice(0, 64);
  const attemptId = "reconcile-attempt-" + suffix;
  const now = NOW - Number.parseInt(suffix, 16) * 100;
  await env.POOL_DB.prepare(`
    INSERT INTO pool_tasks (
      task_key, repository_id, issue_number, target_sha, profile, executor_id,
      state, created_at, updated_at
    ) VALUES (?, '20002', 51, ?, 'jarvis-code-sandbox-v1', 'executor-alpha',
      'pending', ?, ?)
  `).bind(taskKey, "b".repeat(40), now - 200, now - 200).run();
  await env.POOL_DB.prepare(`
    INSERT INTO pool_attempts (
      attempt_id, task_key, attempt_number, status, input_digest,
      execution_idempotency_key, created_at
    ) VALUES (?, ?, 1, 'prepared', ?, ?, ?)
  `).bind(attemptId, taskKey, "c".repeat(64), "reconcile-idem-" + suffix, now - 150).run();
  await env.POOL_DB.prepare(`
    UPDATE pool_tasks
       SET state = 'leased', lease_owner = 'worker-alpha',
           lease_generation = 1, lease_expires_at = ?,
           lease_attempt_id = current_attempt_id, updated_at = ?
     WHERE task_key = ? AND state = 'pending'
  `).bind(now - 10, now - 100, taskKey).run();
  await env.POOL_DB.prepare(`
    UPDATE pool_attempts SET status = 'indeterminate', indeterminate_at = ?
     WHERE attempt_id = ? AND status = 'running'
  `).bind(now - 5, attemptId).run();
  return { taskKey, attemptId, indeterminateAt: now - 5 };
}

function evidence(target, overrides = {}) {
  return {
    issuer: ISSUER,
    audience: AUDIENCE,
    capability: "pool.attempt.reconcile",
    subject: "reconciliation-authority:reviewer-1",
    jti: "evidence-jti-" + target.attemptId,
    taskKey: target.taskKey,
    attemptId: target.attemptId,
    leaseGeneration: 1,
    evidenceDigest: "d".repeat(64),
    decision: "safe_to_retry",
    executorStopped: true,
    externalEffects: "absent",
    resultDigest: null,
    provenanceDigest: null,
    issuedAt: NOW - 4,
    expiresAt: NOW + 120,
    observedAt: NOW - 4,
    verified: true,
    ...overrides
  };
}

function verifier(claimOverrides = {}) {
  return async (_opaqueEvidence, expected) => ({
    ...evidence(expected, claimOverrides),
    ...claimOverrides
  });
}

describe("issuer-bound indeterminate attempt reconciliation", () => {
  it("rejects a non-canonical reconciliation ID before writing evidence", async () => {
    const target = await seedIndeterminate("7");
    const input = {
      reconciliationId: "reconcile:caller-selected-id",
      ...target,
      leaseGeneration: 1,
      evidence: { signedEnvelope: "synthetic-only" }
    };
    const result = await recordAttemptReconciliation(env.POOL_DB, input, verifier(), () => NOW);
    expect(result).toMatchObject({
      decision: "DENY",
      reason: "INVALID_RECONCILIATION_REQUEST",
      dispatch: false,
      executionAuthorized: false
    });
    const row = await env.POOL_DB.prepare(
      "SELECT reconciliation_id FROM pool_attempt_reconciliation_decisions WHERE attempt_id = ?"
    ).bind(target.attemptId).first();
    expect(row).toBeNull();
  });

  it("records a verified decision without changing task, attempt, lease, queue or execution authority", async () => {
    const target = await seedIndeterminate("1");
    const input = {
      reconciliationId: "reconcile:" + target.attemptId,
      ...target,
      leaseGeneration: 1,
      evidence: { signedEnvelope: "synthetic-only" }
    };
    const result = await recordAttemptReconciliation(env.POOL_DB, input, verifier(), () => NOW);
    expect(result).toMatchObject({
      decision: "RECONCILIATION_RECORDED",
      outcome: "safe_to_retry",
      dispatch: false,
      executionAuthorized: false,
      stateChanged: false,
      retryAuthorized: false
    });

    const task = await env.POOL_DB.prepare(
      "SELECT state, lease_owner, lease_generation, lease_expires_at FROM pool_tasks WHERE task_key = ?"
    ).bind(target.taskKey).first();
    const attempt = await env.POOL_DB.prepare(
      "SELECT status, lease_generation, indeterminate_at FROM pool_attempts WHERE attempt_id = ?"
    ).bind(target.attemptId).first();
    const queue = await env.POOL_DB.prepare(
      "SELECT status, lease_generation, expired_lease_owner FROM pool_attempt_reconciliations WHERE attempt_id = ?"
    ).bind(target.attemptId).first();
    expect(task).toMatchObject({ state: "leased", lease_owner: "worker-alpha", lease_generation: 1 });
    expect(task.lease_expires_at).toBeLessThan(NOW);
    expect(attempt).toMatchObject({ status: "indeterminate", lease_generation: 1 });
    expect(queue).toMatchObject({ status: "pending", lease_generation: 1, expired_lease_owner: "worker-alpha" });
  });

  it("fails closed when the trusted clock dependency is absent", async () => {
    const target = await seedIndeterminate("6");
    const input = {
      reconciliationId: "reconcile:" + target.attemptId,
      ...target,
      leaseGeneration: 1,
      evidence: { signedEnvelope: "synthetic-only" }
    };
    const result = await recordAttemptReconciliation(env.POOL_DB, input, verifier());
    expect(result).toMatchObject({
      decision: "DENY",
      reason: "RECONCILIATION_AUTHORITY_UNAVAILABLE",
      dispatch: false,
      executionAuthorized: false
    });
  });

  it("rejects a verifier result bound to a different task or attempt", async () => {
    const target = await seedIndeterminate("2");
    const input = {
      reconciliationId: "reconcile:" + target.attemptId,
      ...target,
      leaseGeneration: 1,
      evidence: { signedEnvelope: "synthetic-only" }
    };
    const result = await recordAttemptReconciliation(
      env.POOL_DB, input, verifier({ attemptId: "different-attempt" }), () => NOW
    );
    expect(result).toMatchObject({
      decision: "DENY",
      reason: "RECONCILIATION_EVIDENCE_CLAIMS_INVALID",
      dispatch: false,
      executionAuthorized: false
    });
    const wrongCapability = await recordAttemptReconciliation(
      env.POOL_DB, input, verifier({ capability: "pool.execute" }), () => NOW
    );
    expect(wrongCapability).toMatchObject({
      decision: "DENY",
      reason: "RECONCILIATION_EVIDENCE_CLAIMS_INVALID"
    });
  });

  it("rejects an unsafe safe_to_retry claim and expired evidence", async () => {
    const target = await seedIndeterminate("3");
    const input = {
      reconciliationId: "reconcile:" + target.attemptId,
      ...target,
      leaseGeneration: 1,
      evidence: { signedEnvelope: "synthetic-only" }
    };
    const unsafe = await recordAttemptReconciliation(
      env.POOL_DB, input, verifier({ externalEffects: "unknown" }), () => NOW
    );
    expect(unsafe).toMatchObject({ decision: "DENY", reason: "RECONCILIATION_EVIDENCE_CLAIMS_INVALID" });
    const expired = await recordAttemptReconciliation(
      env.POOL_DB, input, verifier({ expiresAt: NOW - 1 }), () => NOW
    );
    expect(expired).toMatchObject({ decision: "DENY", reason: "RECONCILIATION_EVIDENCE_CLAIMS_INVALID" });
  });

  it("accepts exact replay idempotently but rejects conflicting evidence for the canonical ID", async () => {
    const target = await seedIndeterminate("4");
    const input = {
      reconciliationId: "reconcile:" + target.attemptId,
      ...target,
      leaseGeneration: 1,
      evidence: { signedEnvelope: "synthetic-only" }
    };
    const first = await recordAttemptReconciliation(env.POOL_DB, input, verifier(), () => NOW);
    const replay = await recordAttemptReconciliation(env.POOL_DB, input, verifier(), () => NOW);
    expect(first.decision).toBe("RECONCILIATION_RECORDED");
    expect(replay).toMatchObject({
      decision: "RECONCILIATION_ALREADY_RECORDED",
      dispatch: false,
      executionAuthorized: false,
      retryAuthorized: false
    });
    const conflicting = await recordAttemptReconciliation(
      env.POOL_DB, input, verifier({ jti: "different-evidence-jti" }), () => NOW
    );
    expect(conflicting).toMatchObject({
      decision: "DENY",
      reason: "RECONCILIATION_OUTCOME_UNCONFIRMED",
      dispatch: false,
      executionAuthorized: false
    });
  });

  it("rechecks expiry after asynchronous verification and rejects trusted-clock rollback", async () => {
    const expiredTarget = await seedIndeterminate("8");
    const expiredInput = {
      reconciliationId: "reconcile:" + expiredTarget.attemptId,
      ...expiredTarget,
      leaseGeneration: 1,
      evidence: { signedEnvelope: "synthetic-only" }
    };
    let expiredClockReads = 0;
    const expired = await recordAttemptReconciliation(
      env.POOL_DB,
      expiredInput,
      async (_opaqueEvidence, expected) => {
        await Promise.resolve();
        return evidence(expected, { expiresAt: NOW + 1 });
      },
      () => (++expiredClockReads === 1 ? NOW : NOW + 1)
    );
    expect(expiredClockReads).toBe(2);
    expect(expired).toMatchObject({
      decision: "DENY",
      reason: "RECONCILIATION_EVIDENCE_CLAIMS_INVALID",
      dispatch: false,
      executionAuthorized: false
    });
    const expiredRow = await env.POOL_DB.prepare(
      "SELECT reconciliation_id FROM pool_attempt_reconciliation_decisions WHERE attempt_id = ?"
    ).bind(expiredTarget.attemptId).first();
    expect(expiredRow).toBeNull();

    const rollbackTarget = await seedIndeterminate("9");
    const rollbackInput = {
      reconciliationId: "reconcile:" + rollbackTarget.attemptId,
      ...rollbackTarget,
      leaseGeneration: 1,
      evidence: { signedEnvelope: "synthetic-only" }
    };
    let rollbackClockReads = 0;
    const rollback = await recordAttemptReconciliation(
      env.POOL_DB, rollbackInput, verifier(),
      () => (++rollbackClockReads === 1 ? NOW : NOW - 1)
    );
    expect(rollbackClockReads).toBe(2);
    expect(rollback).toMatchObject({
      decision: "DENY",
      reason: "TRUSTED_CLOCK_UNAVAILABLE",
      dispatch: false,
      executionAuthorized: false
    });
  });

  it("rechecks expiry after the asynchronous primary precondition read and before insertion", async () => {
    const target = await seedIndeterminate("a");
    const input = {
      reconciliationId: "reconcile:" + target.attemptId,
      ...target,
      leaseGeneration: 1,
      evidence: { signedEnvelope: "synthetic-only" }
    };
    let clockReads = 0;
    const delayedDb = {
      prepare: (...args) => env.POOL_DB.prepare(...args),
      withSession: (name) => {
        const session = env.POOL_DB.withSession(name);
        return {
          prepare: (sql) => {
            const statement = session.prepare(sql);
            if (!sql.includes("FROM pool_attempt_reconciliations r")) return statement;
            return {
              bind: (...values) => {
                const bound = statement.bind(...values);
                return {
                  first: async () => {
                    await Promise.resolve();
                    return bound.first();
                  }
                };
              }
            };
          }
        };
      }
    };
    const result = await recordAttemptReconciliation(
      delayedDb,
      input,
      verifier({ expiresAt: NOW + 2 }),
      () => (++clockReads < 3 ? NOW : NOW + 2)
    );
    expect(clockReads).toBe(3);
    expect(result).toMatchObject({
      decision: "DENY",
      reason: "RECONCILIATION_EVIDENCE_CLAIMS_INVALID",
      dispatch: false,
      executionAuthorized: false
    });
    const row = await env.POOL_DB.prepare(
      "SELECT reconciliation_id FROM pool_attempt_reconciliation_decisions WHERE attempt_id = ?"
    ).bind(target.attemptId).first();
    expect(row).toBeNull();
  });

  it("keeps reconciliation evidence append-only and SQL-bound to the current quarantined attempt", async () => {
    const target = await seedIndeterminate("5");
    const input = {
      reconciliationId: "reconcile:" + target.attemptId,
      ...target,
      leaseGeneration: 1,
      evidence: { signedEnvelope: "synthetic-only" }
    };
    await recordAttemptReconciliation(env.POOL_DB, input, verifier(), () => NOW);
    await expect(env.POOL_DB.prepare(
      "UPDATE pool_attempt_reconciliation_decisions SET decision = 'effects_unknown' WHERE attempt_id = ?"
    ).bind(target.attemptId).run()).rejects.toThrow(/RECONCILIATION_DECISIONS_APPEND_ONLY/);
    await expect(env.POOL_DB.prepare(
      "DELETE FROM pool_attempt_reconciliation_decisions WHERE attempt_id = ?"
    ).bind(target.attemptId).run()).rejects.toThrow(/RECONCILIATION_DECISIONS_APPEND_ONLY/);
  });
});
