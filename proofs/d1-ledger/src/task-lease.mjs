const SAFE_ID = /^[A-Za-z0-9._:-]{1,128}$/;
const MAX_ATTEMPTS = 5;

function deny(reason) {
  return { decision: "DENY", dispatch: false, reason };
}

/**
 * Local-only task lease proof. Every mutation is fenced by task_key,
 * lease_owner and monotonically increasing lease_generation.
 */
export async function acquireTaskLease(db, taskKey, workerId, now, leaseSeconds) {
  if (!db || typeof db.prepare !== "function") return deny("STORAGE_UNAVAILABLE");
  if (!/^[a-f0-9]{64}$/.test(taskKey) || !SAFE_ID.test(workerId) ||
      !Number.isSafeInteger(now) || now <= 0 ||
      !Number.isSafeInteger(leaseSeconds) || leaseSeconds < 1 || leaseSeconds > 900) {
    return deny("INVALID_LEASE_REQUEST");
  }
  try {
    const exhausted = await db.prepare(`
      UPDATE pool_tasks
         SET state = 'dead', lease_owner = NULL,
             lease_expires_at = NULL, updated_at = ?
       WHERE task_key = ? AND attempt_count >= ?
         AND (state = 'pending' OR (state = 'leased' AND lease_expires_at <= ?))
    `).bind(now, taskKey, MAX_ATTEMPTS, now).run();
    if (exhausted?.success === true && exhausted?.meta?.changes === 1) {
      return deny("ATTEMPT_LIMIT_REACHED");
    }
    const snapshot = await db.prepare(
      "SELECT state, attempt_count, lease_expires_at FROM pool_tasks WHERE task_key = ?"
    ).bind(taskKey).first();
    if (snapshot && snapshot.attempt_count >= MAX_ATTEMPTS &&
        (snapshot.state === "pending" || (snapshot.state === "leased" && snapshot.lease_expires_at <= now))) {
      return deny("ATTEMPT_LIMIT_TRANSITION_NOT_APPLIED");
    }

    const result = await db.prepare(`
      UPDATE pool_tasks
         SET state = 'leased', lease_owner = ?,
             lease_generation = lease_generation + 1,
             lease_expires_at = ?, attempt_count = attempt_count + 1,
             updated_at = ?
       WHERE task_key = ? AND attempt_count < ?
         AND (state = 'pending' OR (state = 'leased' AND lease_expires_at <= ?))
    `).bind(workerId, now + leaseSeconds, now, taskKey, MAX_ATTEMPTS, now).run();
    if (result?.success !== true || result?.meta?.changes !== 1) {
      return deny("TASK_NOT_LEASEABLE");
    }
    const row = await db.prepare(
      "SELECT lease_generation, lease_expires_at FROM pool_tasks WHERE task_key = ? AND lease_owner = ?"
    ).bind(taskKey, workerId).first();
    if (!row) return deny("LEASE_READBACK_MISSING");
    return {
      decision: "LEASE_ACQUIRED", taskKey, workerId,
      generation: row.lease_generation, expiresAt: row.lease_expires_at,
      dispatch: false
    };
  } catch {
    return deny("LEASE_ACQUIRE_AMBIGUOUS");
  }
}

export async function renewTaskLease(db, taskKey, workerId, generation, now, leaseSeconds) {
  if (!db || typeof db.prepare !== "function") return deny("STORAGE_UNAVAILABLE");
  if (!/^[a-f0-9]{64}$/.test(taskKey) || !SAFE_ID.test(workerId) ||
      !Number.isSafeInteger(generation) || generation < 1 ||
      !Number.isSafeInteger(now) || now <= 0 ||
      !Number.isSafeInteger(leaseSeconds) || leaseSeconds < 1 || leaseSeconds > 900) {
    return deny("INVALID_LEASE_RENEWAL");
  }
  try {
    const result = await db.prepare(`
      UPDATE pool_tasks SET lease_expires_at = ?, updated_at = ?
       WHERE task_key = ? AND state = 'leased'
         AND lease_owner = ? AND lease_generation = ?
         AND lease_expires_at > ?
    `).bind(now + leaseSeconds, now, taskKey, workerId, generation, now).run();
    return result?.success === true && result?.meta?.changes === 1
      ? { decision: "LEASE_RENEWED", taskKey, generation, expiresAt: now + leaseSeconds, dispatch: false }
      : deny("STALE_OR_EXPIRED_LEASE");
  } catch {
    return deny("LEASE_RENEWAL_AMBIGUOUS");
  }
}

export async function finalizeTaskLease(db, taskKey, workerId, generation, now) {
  if (!db || typeof db.prepare !== "function") return deny("STORAGE_UNAVAILABLE");
  if (!/^[a-f0-9]{64}$/.test(taskKey) || !SAFE_ID.test(workerId) ||
      !Number.isSafeInteger(generation) || generation < 1 ||
      !Number.isSafeInteger(now) || now <= 0) return deny("INVALID_FINALIZATION");
  try {
    const result = await db.prepare(`
      UPDATE pool_tasks
         SET state = 'completed', lease_owner = NULL,
             lease_expires_at = NULL, updated_at = ?
       WHERE task_key = ? AND state = 'leased'
         AND lease_owner = ? AND lease_generation = ?
         AND lease_expires_at > ?
    `).bind(now, taskKey, workerId, generation, now).run();
    return result?.success === true && result?.meta?.changes === 1
      ? { decision: "TASK_COMPLETED", taskKey, generation, dispatch: false }
      : deny("STALE_OR_EXPIRED_FINALIZER");
  } catch {
    return deny("FINALIZATION_AMBIGUOUS");
  }
}
