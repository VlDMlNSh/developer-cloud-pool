const SAFE_ID = /^[A-Za-z0-9._:-]{1,128}$/;
const SAFE_REASON = /^[A-Z0-9_]{1,64}$/;
export const MAX_PROJECTION_DELIVERY_ATTEMPTS = 5;

function deny(reason) {
  return { decision: "DENY", dispatch: false, reason };
}

/** Local-only outbox lease proof. It never calls GitHub or dispatches work. */
export async function acquireProjectionDelivery(db, outboxId, workerId, now, leaseSeconds) {
  if (!db || typeof db.prepare !== "function") return deny("STORAGE_UNAVAILABLE");
  if (!SAFE_ID.test(outboxId || "") || !SAFE_ID.test(workerId || "") ||
      !Number.isSafeInteger(now) || now <= 0 ||
      !Number.isSafeInteger(leaseSeconds) || leaseSeconds < 1 || leaseSeconds > 900) {
    return deny("INVALID_PROJECTION_LEASE");
  }
  try {
    const result = await db.prepare(`
      UPDATE pool_attempt_projection_outbox
         SET status = 'leased', lease_owner = ?,
             lease_generation_delivery = lease_generation_delivery + 1,
             lease_expires_at = ?, delivery_attempts = delivery_attempts + 1,
             updated_at = ?
       WHERE outbox_id = ? AND delivery_attempts < ?
         AND (
           (status = 'pending' AND retry_after_at <= ?)
           OR (status = 'retryable' AND retry_after_at <= ?)
           OR (status = 'leased' AND lease_expires_at <= ?)
         )
    `).bind(
      workerId, now + leaseSeconds, now, outboxId,
      MAX_PROJECTION_DELIVERY_ATTEMPTS, now, now, now
    ).run();
    if (result?.success !== true || !(result?.meta?.changes >= 1)) {
      return deny("PROJECTION_NOT_LEASEABLE");
    }
    const row = await db.prepare(`
      SELECT outbox_id, task_key, attempt_id, repository_id, issue_number,
             target_sha, profile, lease_generation, terminal_status,
             event_digest, lease_owner, lease_generation_delivery, lease_expires_at,
             delivery_attempts
        FROM pool_attempt_projection_outbox
       WHERE outbox_id = ? AND status = 'leased' AND lease_owner = ?
    `).bind(outboxId, workerId).first();
    if (!row) return deny("PROJECTION_LEASE_READBACK_MISMATCH");
    return { decision: "PROJECTION_LEASE_ACQUIRED", ...row, dispatch: false };
  } catch {
    return deny("PROJECTION_LEASE_AMBIGUOUS");
  }
}

/**
 * Records a transient projection failure. Retry delays are deterministic
 * (30/60/120/240 seconds); the fifth failed delivery is dead-lettered.
 * Error details are deliberately limited to a short non-sensitive reason code.
 */
export async function markProjectionRetryable(db, outboxId, workerId, generation, now, reasonCode = "TRANSIENT_FAILURE") {
  if (!db || typeof db.prepare !== "function" || !SAFE_ID.test(outboxId || "") ||
      !SAFE_ID.test(workerId || "") || !Number.isSafeInteger(generation) || generation < 1 ||
      !Number.isSafeInteger(now) || now <= 0 || !SAFE_REASON.test(reasonCode || "")) {
    return deny("INVALID_PROJECTION_RETRY");
  }
  try {
    const result = await db.prepare(`
      UPDATE pool_attempt_projection_outbox
         SET status = CASE WHEN delivery_attempts >= ? THEN 'dead_letter' ELSE 'retryable' END,
             retry_after_at = CASE
               WHEN delivery_attempts >= ? THEN ?
               WHEN delivery_attempts = 1 THEN ? + 30
               WHEN delivery_attempts = 2 THEN ? + 60
               WHEN delivery_attempts = 3 THEN ? + 120
               ELSE ? + 240
             END,
             last_error_code = ?,
             dead_lettered_at = CASE WHEN delivery_attempts >= ? THEN ? ELSE NULL END,
             dead_letter_reason = CASE WHEN delivery_attempts >= ? THEN ? ELSE NULL END,
             lease_owner = NULL, lease_expires_at = NULL, updated_at = ?
       WHERE outbox_id = ? AND status = 'leased' AND lease_owner = ?
         AND lease_generation_delivery = ? AND lease_expires_at > ?
    `).bind(
      MAX_PROJECTION_DELIVERY_ATTEMPTS, MAX_PROJECTION_DELIVERY_ATTEMPTS, now,
      now, now, now, now, reasonCode,
      MAX_PROJECTION_DELIVERY_ATTEMPTS, now,
      MAX_PROJECTION_DELIVERY_ATTEMPTS, reasonCode,
      now, outboxId, workerId, generation, now
    ).run();
    if (result?.success !== true || !(result?.meta?.changes >= 1)) {
      return deny("STALE_OR_EXPIRED_PROJECTION_LEASE");
    }
    const row = await db.prepare(`
      SELECT status, lease_owner, lease_expires_at, lease_generation_delivery,
             delivery_attempts, retry_after_at, dead_lettered_at, dead_letter_reason
        FROM pool_attempt_projection_outbox WHERE outbox_id = ?
    `).bind(outboxId).first();
    if (!row || row.lease_owner !== null || row.lease_expires_at !== null ||
        row.lease_generation_delivery !== generation) return deny("PROJECTION_RETRY_READBACK_MISMATCH");
    if (row.status === "dead_letter" && row.delivery_attempts >= MAX_PROJECTION_DELIVERY_ATTEMPTS &&
        row.dead_lettered_at === now && row.dead_letter_reason === reasonCode) {
      return {
        decision: "PROJECTION_DEAD_LETTERED", outboxId, generation,
        attempts: row.delivery_attempts, reasonCode, dispatch: false
      };
    }
    return row.status === "retryable" && row.delivery_attempts < MAX_PROJECTION_DELIVERY_ATTEMPTS
      ? {
          decision: "PROJECTION_RETRYABLE", outboxId, generation,
          attempts: row.delivery_attempts, retryAfter: row.retry_after_at, dispatch: false
        }
      : deny("PROJECTION_RETRY_READBACK_MISMATCH");
  } catch {
    return deny("PROJECTION_RETRY_AMBIGUOUS");
  }
}

/** Dead-letters an expired fifth lease; stale workers cannot perform this transition. */
export async function deadLetterExpiredProjection(db, outboxId, workerId, generation, now) {
  if (!db || typeof db.prepare !== "function" || !SAFE_ID.test(outboxId || "") ||
      !SAFE_ID.test(workerId || "") || !Number.isSafeInteger(generation) || generation < 1 ||
      !Number.isSafeInteger(now) || now <= 0) return deny("INVALID_PROJECTION_DEAD_LETTER");
  const reasonCode = "LEASE_EXPIRED_AFTER_MAX_ATTEMPTS";
  try {
    const result = await db.prepare(`
      UPDATE pool_attempt_projection_outbox
         SET status = 'dead_letter', lease_owner = NULL, lease_expires_at = NULL,
             last_error_code = ?, dead_lettered_at = ?, dead_letter_reason = ?, updated_at = ?
       WHERE outbox_id = ? AND status = 'leased' AND lease_owner = ?
         AND lease_generation_delivery = ? AND lease_expires_at <= ?
         AND delivery_attempts >= ?
    `).bind(
      reasonCode, now, reasonCode, now, outboxId, workerId, generation,
      now, MAX_PROJECTION_DELIVERY_ATTEMPTS
    ).run();
    if (result?.success !== true || !(result?.meta?.changes >= 1)) {
      return deny("PROJECTION_DEAD_LETTER_NOT_AUTHORIZED");
    }
    const row = await db.prepare(`
      SELECT status, lease_owner, lease_expires_at, delivery_attempts,
             dead_lettered_at, dead_letter_reason
        FROM pool_attempt_projection_outbox WHERE outbox_id = ?
    `).bind(outboxId).first();
    return row?.status === "dead_letter" && row.lease_owner === null &&
      row.lease_expires_at === null && row.delivery_attempts >= MAX_PROJECTION_DELIVERY_ATTEMPTS &&
      row.dead_lettered_at === now && row.dead_letter_reason === reasonCode
      ? {
          decision: "PROJECTION_DEAD_LETTERED", outboxId, generation,
          attempts: row.delivery_attempts, reasonCode, dispatch: false
        }
      : deny("PROJECTION_DEAD_LETTER_READBACK_MISMATCH");
  } catch {
    return deny("PROJECTION_DEAD_LETTER_AMBIGUOUS");
  }
}

