const SAFE_ID = /^[A-Za-z0-9._:-]{1,128}$/;

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
       WHERE outbox_id = ?
         AND (status IN ('pending', 'retryable')
           OR (status = 'leased' AND lease_expires_at <= ?))
    `).bind(workerId, now + leaseSeconds, now, outboxId, now).run();
    if (result?.success !== true || !(result?.meta?.changes >= 1)) {
      const current = await db.prepare("SELECT status, lease_owner, lease_generation_delivery, lease_expires_at FROM pool_attempt_projection_outbox WHERE outbox_id = ?").bind(outboxId).first();
      return deny("PROJECTION_NOT_LEASEABLE");
    }
    const row = await db.prepare(`
      SELECT outbox_id, task_key, attempt_id, repository_id, issue_number,
             target_sha, profile, lease_generation, terminal_status,
             event_digest, lease_owner, lease_generation_delivery, lease_expires_at
        FROM pool_attempt_projection_outbox
       WHERE outbox_id = ? AND status = 'leased' AND lease_owner = ?
    `).bind(outboxId, workerId).first();
    if (!row) return deny("PROJECTION_LEASE_READBACK_MISMATCH");
    return { decision: "PROJECTION_LEASE_ACQUIRED", ...row, dispatch: false };
  } catch {
    return deny("PROJECTION_LEASE_AMBIGUOUS");
  }
}

export async function markProjectionRetryable(db, outboxId, workerId, generation, now) {
  if (!db || typeof db.prepare !== "function" || !SAFE_ID.test(outboxId || "") ||
      !SAFE_ID.test(workerId || "") || !Number.isSafeInteger(generation) || generation < 1 ||
      !Number.isSafeInteger(now) || now <= 0) return deny("INVALID_PROJECTION_RETRY");
  try {
    const result = await db.prepare(`
      UPDATE pool_attempt_projection_outbox
         SET status = 'retryable', lease_owner = NULL, lease_expires_at = NULL, updated_at = ?
       WHERE outbox_id = ? AND status = 'leased' AND lease_owner = ?
         AND lease_generation_delivery = ? AND lease_expires_at > ?
    `).bind(now, outboxId, workerId, generation, now).run();
    if (result?.success !== true || !(result?.meta?.changes >= 1)) {
      return deny("STALE_OR_EXPIRED_PROJECTION_LEASE");
    }
    const row = await db.prepare(
      "SELECT status, lease_owner, lease_expires_at, lease_generation_delivery FROM pool_attempt_projection_outbox WHERE outbox_id = ?"
    ).bind(outboxId).first();
    return row?.status === "retryable" && row.lease_owner === null &&
      row.lease_expires_at === null && row.lease_generation_delivery === generation
      ? { decision: "PROJECTION_RETRYABLE", outboxId, generation, dispatch: false }
      : deny("PROJECTION_RETRY_READBACK_MISMATCH");
  } catch {
    return deny("PROJECTION_RETRY_AMBIGUOUS");
  }
}

export async function acknowledgeProjectionDelivered(db, outboxId, workerId, generation, now) {
  if (!db || typeof db.prepare !== "function" || !SAFE_ID.test(outboxId || "") ||
      !SAFE_ID.test(workerId || "") || !Number.isSafeInteger(generation) || generation < 1 ||
      !Number.isSafeInteger(now) || now <= 0) return deny("INVALID_PROJECTION_ACK");
  try {
    const result = await db.prepare(`
      UPDATE pool_attempt_projection_outbox
         SET status = 'delivered', lease_owner = NULL,
             lease_expires_at = NULL, delivered_at = ?, updated_at = ?
       WHERE outbox_id = ? AND status = 'leased' AND lease_owner = ?
         AND lease_generation_delivery = ? AND lease_expires_at > ?
    `).bind(now, now, outboxId, workerId, generation, now).run();
    if (result?.success !== true || !(result?.meta?.changes >= 1)) {
      return deny("STALE_OR_EXPIRED_PROJECTION_LEASE");
    }
    const row = await db.prepare(
      "SELECT status, lease_owner, lease_expires_at, lease_generation_delivery, delivered_at FROM pool_attempt_projection_outbox WHERE outbox_id = ?"
    ).bind(outboxId).first();
    return row?.status === "delivered" && row.lease_owner === null &&
      row.lease_expires_at === null && row.lease_generation_delivery === generation &&
      row.delivered_at === now
      ? { decision: "PROJECTION_DELIVERED", outboxId, generation, dispatch: false }
      : deny("PROJECTION_ACK_READBACK_MISMATCH");
  } catch {
    return deny("PROJECTION_ACK_AMBIGUOUS");
  }
}
