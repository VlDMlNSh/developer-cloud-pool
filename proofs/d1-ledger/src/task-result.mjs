const SAFE_ID = /^[A-Za-z0-9._:-]{1,128}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const RESULT_REF = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/;

function deny(reason) { return { decision: "DENY", dispatch: false, reason }; }

/** Local-only result commit. Time is taken from the Worker runtime, never from request input. */
export async function commitTaskResult(db, input) {
  const now = Math.floor(Date.now() / 1000);
  if (!db || typeof db.prepare !== "function") return deny("STORAGE_UNAVAILABLE");
  if (!input || typeof input.taskKey !== "string" || !/^[a-f0-9]{64}$/.test(input.taskKey) ||
      typeof input.workerId !== "string" || !SAFE_ID.test(input.workerId) ||
      !Number.isSafeInteger(input.generation) || input.generation < 1 ||
      typeof input.leaseAttemptId !== "string" || !UUID.test(input.leaseAttemptId) ||
      typeof input.resultDigest !== "string" || !SHA256.test(input.resultDigest) ||
      typeof input.resultRef !== "string" || !RESULT_REF.test(input.resultRef) ||
      !Number.isSafeInteger(now) || now <= 0) return deny("INVALID_RESULT_COMMIT");

  try {
    const before = await db.prepare("SELECT worker_id, lease_generation, lease_attempt_id, result_digest, result_ref FROM pool_task_results WHERE task_key = ?")
      .bind(input.taskKey).first();
    if (before) return before.worker_id === input.workerId && before.lease_generation === input.generation &&
      before.lease_attempt_id === input.leaseAttemptId && before.result_digest === input.resultDigest &&
      before.result_ref === input.resultRef
      ? { decision: "RESULT_ALREADY_COMMITTED", taskKey: input.taskKey, effectId: `pool-result:${input.taskKey}`, dispatch: false }
      : deny("RESULT_IDENTITY_CONFLICT");

    const inserted = await db.prepare(`
      INSERT INTO pool_task_results (task_key, worker_id, lease_generation, lease_attempt_id, result_digest, result_ref, committed_at)
      SELECT ?, ?, ?, ?, ?, ?, ?
       WHERE EXISTS (
         SELECT 1 FROM pool_tasks WHERE task_key = ? AND state = 'leased'
           AND lease_owner = ? AND lease_generation = ? AND lease_attempt_id = ? AND lease_expires_at > ?
       )
      ON CONFLICT(task_key) DO NOTHING
    `).bind(input.taskKey, input.workerId, input.generation, input.leaseAttemptId,
      input.resultDigest, input.resultRef, now, input.taskKey, input.workerId,
      input.generation, input.leaseAttemptId, now).run();
    if (inserted?.success !== true) return deny("RESULT_COMMIT_AMBIGUOUS");

    // D1 meta.changes includes trigger writes. Verify the full atomic write set.
    const persisted = await db.prepare(`
      SELECT r.worker_id, r.lease_generation, r.lease_attempt_id, r.result_digest, r.result_ref,
             t.state AS task_state, o.effect_id, o.event_type, o.result_digest AS outbox_digest, o.status AS outbox_status
        FROM pool_task_results r
        JOIN pool_tasks t ON t.task_key = r.task_key
        JOIN pool_task_result_outbox o ON o.task_key = r.task_key
       WHERE r.task_key = ?
    `).bind(input.taskKey).first();

    const exact = persisted &&
      persisted.worker_id === input.workerId &&
      persisted.lease_generation === input.generation &&
      persisted.lease_attempt_id === input.leaseAttemptId &&
      persisted.result_digest === input.resultDigest &&
      persisted.result_ref === input.resultRef &&
      persisted.task_state === "completed" &&
      persisted.effect_id === `pool-result:${input.taskKey}` &&
      persisted.event_type === "pool.task.result" &&
      persisted.outbox_digest === input.resultDigest &&
      ["pending", "delivered"].includes(persisted.outbox_status);
    if (!exact) {
      const existing = await db.prepare("SELECT result_digest, result_ref FROM pool_task_results WHERE task_key = ?")
        .bind(input.taskKey).first();
      if (existing) return deny("RESULT_IDENTITY_CONFLICT");
      return deny("STALE_OR_EXPIRED_RESULT_WRITER");
    }
    return { decision: "RESULT_COMMITTED", taskKey: input.taskKey, effectId: persisted.effect_id,
      generation: input.generation, dispatch: false };
  } catch {
    return deny("RESULT_COMMIT_AMBIGUOUS");
  }
}
