const json = (value) => JSON.stringify(value);

export async function claimAttempt(db, { taskId, attemptId, generation }) {
  if (!db || typeof taskId !== "string" || !taskId ||
      typeof attemptId !== "string" || !attemptId ||
      !Number.isSafeInteger(generation) || generation < 1) {
    return { outcome: "DENY", reason: "INVALID_INPUT" };
  }

  await db.prepare(
    "INSERT INTO pool_attempts (attempt_id, task_id, lease_generation, status) VALUES (?, ?, ?, 'claimed') ON CONFLICT(attempt_id) DO NOTHING"
  ).bind(attemptId, taskId, generation).run();

  const row = await db.prepare(
    "SELECT task_id, lease_generation, status FROM pool_attempts WHERE attempt_id = ?"
  ).bind(attemptId).first();

  if (!row || row.task_id !== taskId || row.lease_generation !== generation) {
    return { outcome: "DENY", reason: "ATTEMPT_FENCE_MISMATCH" };
  }
  if (row.status === "needs_review") {
    return { outcome: "DENY", reason: "NEEDS_REVIEW" };
  }
  return { outcome: "ALLOW", status: row.status };
}

export async function commitAttemptReceipt(db, { taskId, attemptId, generation, receipt }) {
  if (!db || typeof taskId !== "string" || !taskId ||
      typeof attemptId !== "string" || !attemptId ||
      !Number.isSafeInteger(generation) || generation < 1 ||
      receipt === undefined) {
    return { outcome: "DENY", reason: "INVALID_INPUT" };
  }

  const serialized = json(receipt);
  await db.batch([
    db.prepare(
      `INSERT INTO pool_attempt_receipts (attempt_id, lease_generation, receipt_json)
       SELECT attempt_id, lease_generation, ?
       FROM pool_attempts
       WHERE attempt_id = ? AND task_id = ? AND lease_generation = ?
         AND status IN ('claimed', 'completed')
       ON CONFLICT(attempt_id, lease_generation) DO NOTHING`
    ).bind(serialized, attemptId, taskId, generation),
    db.prepare(
      `UPDATE pool_attempts SET status = 'completed'
       WHERE attempt_id = ? AND task_id = ? AND lease_generation = ?
         AND EXISTS (
           SELECT 1 FROM pool_attempt_receipts
           WHERE attempt_id = ? AND lease_generation = ?
         )`
    ).bind(attemptId, taskId, generation, attemptId, generation)
  ]);

  const row = await db.prepare(
    "SELECT receipt_json FROM pool_attempt_receipts WHERE attempt_id = ? AND lease_generation = ?"
  ).bind(attemptId, generation).first();

  if (!row) return { outcome: "DENY", reason: "ATTEMPT_NOT_CLAIMED_OR_FENCED" };
  return { outcome: "COMMITTED", receipt: JSON.parse(row.receipt_json) };
}

export async function markAttemptNeedsReview(db, { taskId, attemptId, generation }) {
  const result = await db.prepare(
    `UPDATE pool_attempts SET status = 'needs_review'
     WHERE attempt_id = ? AND task_id = ? AND lease_generation = ? AND status = 'claimed'`
  ).bind(attemptId, taskId, generation).run();
  return { outcome: result.meta?.changes === 1 ? "MARKED" : "NO_CHANGE" };
}
