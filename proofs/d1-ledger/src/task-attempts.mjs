const SAFE_ID = /^[A-Za-z0-9._:-]{1,128}$/;
const SHA256 = /^[a-f0-9]{64}$/;

function deny(reason) {
  return { decision: "DENY", dispatch: false, reason };
}

function validCommon(db, taskKey, now) {
  return Boolean(db && typeof db.prepare === "function" &&
    SHA256.test(taskKey) && Number.isSafeInteger(now) && now > 0);
}

export async function createTaskAttempt(db, {
  taskKey, attemptId, attemptNumber, inputDigest, executionIdempotencyKey, now
}) {
  if (!validCommon(db, taskKey, now) || !SAFE_ID.test(attemptId || "") ||
      !Number.isSafeInteger(attemptNumber) || attemptNumber < 1 ||
      !SHA256.test(inputDigest || "") || !SAFE_ID.test(executionIdempotencyKey || "")) {
    return deny("INVALID_ATTEMPT_REQUEST");
  }
  try {
    const prior = await db.prepare(
      "SELECT task_key, attempt_number, input_digest, execution_idempotency_key FROM pool_attempts WHERE attempt_id = ?"
    ).bind(attemptId).first();
    if (prior) {
      const same = prior.task_key === taskKey &&
        prior.attempt_number === attemptNumber &&
        prior.input_digest === inputDigest &&
        prior.execution_idempotency_key === executionIdempotencyKey;
      return same
        ? { decision: "ATTEMPT_ALREADY_CREATED", attemptId, attemptNumber, dispatch: false }
        : deny("ATTEMPT_IDENTITY_CONFLICT");
    }

    await db.prepare(`
      INSERT INTO pool_attempts (
        attempt_id, task_key, attempt_number, status, input_digest,
        execution_idempotency_key, created_at
      )
      VALUES (?, ?, ?, 'prepared', ?, ?, ?)
    `).bind(attemptId, taskKey, attemptNumber, inputDigest, executionIdempotencyKey, now).run();

    const row = await db.prepare(`
      SELECT task_key, attempt_number, input_digest, execution_idempotency_key, status
        FROM pool_attempts WHERE attempt_id = ?
    `).bind(attemptId).first();
    const current = await db.prepare(
      "SELECT current_attempt_id, attempt_number FROM pool_tasks WHERE task_key = ?"
    ).bind(taskKey).first();
    if (!row || row.task_key !== taskKey || row.attempt_number !== attemptNumber ||
        row.input_digest !== inputDigest || row.execution_idempotency_key !== executionIdempotencyKey ||
        row.status !== "prepared") return deny("ATTEMPT_INSERT_READBACK_MISMATCH");
    if (current?.current_attempt_id !== attemptId || current?.attempt_number !== attemptNumber) {
      return deny("ATTEMPT_POINTER_READBACK_MISMATCH");
    }
    return { decision: "ATTEMPT_CREATED", attemptId, attemptNumber, dispatch: false };
  } catch {
    return deny("ATTEMPT_CREATE_AMBIGUOUS");
  }
}

/**
 * Acquire a lease only for a prepared attempt on a pending task.
 * Expired/running/indeterminate attempts are never reclaimed by this API:
 * expiry is not proof that the prior executor stopped or that side effects are fenced.
 */
export async function acquireAttemptLease(db, taskKey, workerId, now, leaseSeconds) {
  if (!validCommon(db, taskKey, now) || !SAFE_ID.test(workerId || "") ||
      !Number.isSafeInteger(leaseSeconds) || leaseSeconds < 1 || leaseSeconds > 900) {
    return deny("INVALID_ATTEMPT_LEASE_REQUEST");
  }
  try {
    const snapshot = await db.prepare(`
      SELECT t.state, t.current_attempt_id
        FROM pool_tasks t
       WHERE t.task_key = ?
    `).bind(taskKey).first();
    if (!snapshot?.current_attempt_id) return deny("CURRENT_ATTEMPT_MISSING");

    const result = await db.prepare(`
      UPDATE pool_tasks
         SET state = 'leased', lease_owner = ?,
             lease_generation = lease_generation + 1,
             lease_expires_at = ?, lease_attempt_id = current_attempt_id,
             updated_at = ?
       WHERE task_key = ? AND current_attempt_id IS NOT NULL
         AND state = 'pending'
         AND EXISTS (
           SELECT 1 FROM pool_attempts a
            WHERE a.attempt_id = pool_tasks.current_attempt_id
              AND a.task_key = pool_tasks.task_key AND a.status = 'prepared'
         )
    `).bind(workerId, now + leaseSeconds, now, taskKey).run();

    if (result?.success !== true || !(result?.meta?.changes >= 1)) {
      return deny("ATTEMPT_NOT_LEASEABLE");
    }
    const row = await db.prepare(`
      SELECT lease_generation, lease_expires_at, current_attempt_id, lease_attempt_id
        FROM pool_tasks
       WHERE task_key = ? AND lease_owner = ?
    `).bind(taskKey, workerId).first();
    if (!row || row.current_attempt_id !== row.lease_attempt_id) {
      return deny("ATTEMPT_LEASE_READBACK_MISMATCH");
    }
    return {
      decision: "ATTEMPT_LEASE_ACQUIRED",
      taskKey, attemptId: row.current_attempt_id, workerId,
      generation: row.lease_generation, expiresAt: row.lease_expires_at,
      dispatch: false
    };
  } catch {
    return deny("ATTEMPT_LEASE_ACQUIRE_AMBIGUOUS");
  }
}

export async function renewAttemptLease(db, taskKey, attemptId, workerId, generation, now, leaseSeconds) {
  if (!validCommon(db, taskKey, now) || !SAFE_ID.test(attemptId || "") ||
      !SAFE_ID.test(workerId || "") || !Number.isSafeInteger(generation) || generation < 1 ||
      !Number.isSafeInteger(leaseSeconds) || leaseSeconds < 1 || leaseSeconds > 900) {
    return deny("INVALID_ATTEMPT_LEASE_RENEWAL");
  }
  try {
    const result = await db.prepare(`
      UPDATE pool_tasks
         SET lease_expires_at = ?, updated_at = ?
       WHERE task_key = ? AND state = 'leased'
         AND current_attempt_id = ? AND lease_attempt_id = ?
         AND lease_owner = ? AND lease_generation = ?
         AND lease_expires_at > ?
    `).bind(now + leaseSeconds, now, taskKey, attemptId, attemptId, workerId, generation, now).run();
    return result?.success === true && result?.meta?.changes === 1
      ? { decision: "ATTEMPT_LEASE_RENEWED", attemptId, generation, expiresAt: now + leaseSeconds, dispatch: false }
      : deny("STALE_OR_EXPIRED_ATTEMPT_LEASE");
  } catch {
    return deny("ATTEMPT_LEASE_RENEWAL_AMBIGUOUS");
  }
}

export async function finalizeTaskAttempt(db, {
  taskKey, attemptId, workerId, generation, status, resultDigest,
  provenanceDigest, terminalReason, now
}) {
  if (!validCommon(db, taskKey, now) || !SAFE_ID.test(attemptId || "") ||
      !SAFE_ID.test(workerId || "") || !Number.isSafeInteger(generation) || generation < 1 ||
      !["succeeded", "failed", "abandoned"].includes(status) ||
      !SHA256.test(resultDigest || "") || !SHA256.test(provenanceDigest || "") ||
      typeof terminalReason !== "string" || terminalReason.length < 1 || terminalReason.length > 256) {
    return deny("INVALID_ATTEMPT_FINALIZATION");
  }
  try {
    const result = await db.prepare(`
      UPDATE pool_attempts
         SET status = ?, result_digest = ?, provenance_digest = ?,
             terminal_reason = ?, completed_at = ?
       WHERE attempt_id = ? AND task_key = ? AND status = 'running'
         AND lease_generation = ?
         AND EXISTS (
           SELECT 1 FROM pool_tasks t
            WHERE t.task_key = pool_attempts.task_key
              AND t.current_attempt_id = pool_attempts.attempt_id
              AND t.lease_attempt_id = pool_attempts.attempt_id
              AND t.state = 'leased' AND t.lease_owner = ?
              AND t.lease_generation = ? AND t.lease_expires_at > ?
         )
    `).bind(
      status, resultDigest, provenanceDigest, terminalReason, now,
      attemptId, taskKey, generation, workerId, generation, now
    ).run();
    if (result?.success !== true || !(result?.meta?.changes >= 1)) {
      // A lost response may cause an exact terminal request to be replayed.
      // Accept only a byte-for-byte equivalent terminal projection and audit
      // actor/generation; never rewrite a terminal record or accept conflicts.
      const prior = await db.prepare(`
        SELECT status, result_digest, provenance_digest, terminal_reason,
               completed_at, lease_generation
          FROM pool_attempts
         WHERE attempt_id = ? AND task_key = ?
      `).bind(attemptId, taskKey).first();
      const event = await db.prepare(`
        SELECT actor_id, lease_generation, event_digest
          FROM pool_attempt_events
         WHERE event_id = ?
      `).bind("attempt-finalized:" + attemptId).first();
      if (prior?.status === status &&
          prior.result_digest === resultDigest &&
          prior.provenance_digest === provenanceDigest &&
          prior.terminal_reason === terminalReason &&
          Number.isSafeInteger(prior.completed_at) &&
          prior.completed_at > 0 &&
          prior.lease_generation === generation &&
          event?.actor_id === workerId &&
          event?.lease_generation === generation &&
          event?.event_digest === (resultDigest || provenanceDigest)) {
        return {
          decision: "ATTEMPT_ALREADY_FINALIZED", taskKey, attemptId, status,
          completedAt: prior.completed_at, dispatch: false
        };
      }
      return deny("STALE_OR_EXPIRED_ATTEMPT_FINALIZER");
    }
    const row = await db.prepare(
      "SELECT status, completed_at FROM pool_attempts WHERE attempt_id = ?"
    ).bind(attemptId).first();
    const task = await db.prepare(
      "SELECT state, lease_owner, lease_expires_at FROM pool_tasks WHERE task_key = ?"
    ).bind(taskKey).first();
    if (row?.status !== status || row?.completed_at !== now ||
        task?.lease_owner !== null || task?.lease_expires_at !== null ||
        task?.state !== (status === "succeeded" ? "completed" : "pending")) {
      return deny("ATTEMPT_FINALIZATION_READBACK_MISMATCH");
    }
    return { decision: "ATTEMPT_FINALIZED", taskKey, attemptId, status, dispatch: false };
  } catch {
    return deny("ATTEMPT_FINALIZATION_AMBIGUOUS");
  }
}

export async function markAttemptIndeterminate(db, taskKey, attemptId, now) {
  if (!validCommon(db, taskKey, now) || !SAFE_ID.test(attemptId || "")) {
    return deny("INVALID_INDETERMINATE_REQUEST");
  }
  try {
    const result = await db.prepare(`
      UPDATE pool_attempts
         SET status = 'indeterminate', indeterminate_at = ?
       WHERE attempt_id = ? AND task_key = ? AND status = 'running'
         AND EXISTS (
           SELECT 1 FROM pool_tasks t
            WHERE t.task_key = pool_attempts.task_key
              AND t.current_attempt_id = pool_attempts.attempt_id
              AND t.state = 'leased' AND t.lease_expires_at <= ?
              AND t.lease_generation = pool_attempts.lease_generation
         )
    `).bind(now, attemptId, taskKey, now).run();
    return result?.success === true && result?.meta?.changes >= 1
      ? { decision: "ATTEMPT_INDETERMINATE", taskKey, attemptId, dispatch: false }
      : deny("ATTEMPT_NOT_EXPIRED_OR_NOT_CURRENT");
  } catch {
    return deny("ATTEMPT_INDETERMINATE_AMBIGUOUS");
  }
}
