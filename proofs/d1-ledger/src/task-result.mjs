const SAFE_ID = /^[A-Za-z0-9._:-]{1,128}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const RESULT_REF = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/;

function deny(reason) {
  return { decision: "DENY", dispatch: false, reason };
}

/**
 * Commits one immutable task result only for the exact live lease attempt.
 * The migration trigger atomically completes the task and creates a single
 * durable outbox intent. No external delivery is performed here.
 */
export async function commitTaskResult(db, input) {
  if (!db || typeof db.prepare !== "function") return deny("STORAGE_UNAVAILABLE");
  if (!input || typeof input.taskKey !== "string" || !/^[a-f0-9]{64}$/.test(input.taskKey) ||
      typeof input.workerId !== "string" || !SAFE_ID.test(input.workerId) ||
      !Number.isSafeInteger(input.generation) || input.generation < 1 ||
      typeof input.leaseAttemptId !== "string" || !UUID.test(input.leaseAttemptId) ||
      typeof input.resultDigest !== "string" || !SHA256.test(input.resultDigest) ||
      typeof input.resultRef !== "string" || !RESULT_REF.test(input.resultRef) ||
      !Number.isSafeInteger(input.now) || input.now <= 0) {
    return deny("INVALID_RESULT_COMMIT");
  }

  try {
    const inserted = await db.prepare(`
      INSERT INTO pool_task_results (
        task_key, worker_id, lease_generation, lease_attempt_id,
        result_digest, result_ref, committed_at
      )
      SELECT ?, ?, ?, ?, ?, ?, ?
       WHERE EXISTS (
         SELECT 1 FROM pool_tasks
          WHERE task_key = ?
            AND state = 'leased'
            AND lease_owner = ?
            AND lease_generation = ?
            AND lease_attempt_id = ?
            AND lease_expires_at > ?
       )
      ON CONFLICT(task_key) DO NOTHING
    `).bind(
      input.taskKey, input.workerId, input.generation, input.leaseAttemptId,
      input.resultDigest, input.resultRef, input.now,
      input.taskKey, input.workerId, input.generation,
      input.leaseAttemptId, input.now
    ).run();

    if (inserted?.success !== true) return deny("RESULT_COMMIT_AMBIGUOUS");
    if (inserted?.meta?.changes === 1) {
      return {
        decision: "RESULT_COMMITTED",
        taskKey: input.taskKey,
        effectId: `pool-result:${input.taskKey}`,
        generation: input.generation,
        dispatch: false
      };
    }

    const existing = await db.prepare(`
      SELECT result_digest, result_ref
        FROM pool_task_results
       WHERE task_key = ?
    `).bind(input.taskKey).first();

    if (existing) {
      return existing.result_digest === input.resultDigest &&
        existing.result_ref === input.resultRef
        ? {
            decision: "RESULT_ALREADY_COMMITTED",
            taskKey: input.taskKey,
            effectId: `pool-result:${input.taskKey}`,
            dispatch: false
          }
        : deny("RESULT_IDENTITY_CONFLICT");
    }

    return deny("STALE_OR_EXPIRED_RESULT_WRITER");
  } catch {
    return deny("RESULT_COMMIT_AMBIGUOUS");
  }
}
