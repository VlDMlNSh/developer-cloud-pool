const SHA40 = /^[a-f0-9]{40}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const NUMERIC_ID = /^[0-9]+$/;
const SAFE_ID = /^[A-Za-z0-9._:-]{1,160}$/;
const COST_CLASSES = new Set(["local", "free_quota"]);

const deny = (reason) => ({ decision: "DENY", dispatch: false, reason });

function valid(input) {
  const a = input?.approval;
  const r = input?.route;
  const t = input?.attempt;
  return Boolean(
    input && Number.isSafeInteger(input.now) && input.now > 0 &&
    SAFE_ID.test(input.admissionId || "") &&
    SHA256.test(input.taskKey || "") &&
    a && SAFE_ID.test(a.approvalId || "") &&
    NUMERIC_ID.test(a.ownerNumericId || "") &&
    NUMERIC_ID.test(a.repositoryId || "") &&
    Number.isSafeInteger(a.issueNumber) && a.issueNumber > 0 &&
    SHA40.test(a.targetSha || "") && a.profile === "dsh-headless-probe" &&
    SHA256.test(a.envelopeDigest || "") &&
    r && SAFE_ID.test(r.qualificationId || "") &&
    SAFE_ID.test(r.routeId || "") && SAFE_ID.test(r.providerId || "") &&
    SAFE_ID.test(r.modelId || "") && SAFE_ID.test(r.issuerId || "") &&
    SAFE_ID.test(r.accountRef || "") && SAFE_ID.test(r.credentialHandleRef || "") &&
    SAFE_ID.test(r.capabilityId || "") && SAFE_ID.test(r.registryVersion || "") &&
    SHA256.test(r.evidenceDigest || "") && COST_CLASSES.has(r.costClass) &&
    (r.costClass !== "free_quota" || SAFE_ID.test(r.quotaDomainId || "")) &&
    (r.quotaDomainId == null || SAFE_ID.test(r.quotaDomainId)) &&
    t && SAFE_ID.test(t.attemptId || "") && SHA256.test(t.inputDigest || "") &&
    SAFE_ID.test(t.executionIdempotencyKey || "")
  );
}

function same(row, input) {
  const a = input.approval, r = input.route, t = input.attempt;
  return row &&
    row.admission_id === input.admissionId &&
    row.approval_id === a.approvalId &&
    row.qualification_id === r.qualificationId &&
    row.evidence_digest === r.evidenceDigest &&
    row.requested_attempt_id === t.attemptId &&
    row.input_digest === t.inputDigest &&
    row.execution_idempotency_key === t.executionIdempotencyKey;
}

function statements(db, input) {
  const { approval: a, route: r, attempt: t, now, admissionId } = input;
  const routeMatch = `
    q.qualification_id = ? AND q.route_id = ? AND q.provider_id = ?
    AND q.model_id = ? AND q.issuer_id = ? AND q.account_ref = ?
    AND q.credential_handle_ref = ? AND q.quota_domain_id IS ?
    AND q.cost_class = ? AND q.capability_id = ? AND q.evidence_digest = ?
    AND q.registry_version = ? AND q.qualification_status = 'qualified'
    AND q.revoked_at IS NULL AND q.issued_at <= ? AND q.expires_at > ?
  `;
  const routeValues = [
    r.qualificationId, r.routeId, r.providerId, r.modelId, r.issuerId,
    r.accountRef, r.credentialHandleRef, r.quotaDomainId ?? null,
    r.costClass, r.capabilityId, r.evidenceDigest, r.registryVersion, now, now
  ];
  return [
    db.prepare(`
      UPDATE pool_approval_ledger
         SET state = 'consumed', consumed_at = ?, task_key = ?, admission_id = ?
       WHERE approval_id = ? AND owner_numeric_id = ? AND repository_id = ?
         AND issue_number = ? AND target_sha = ? AND profile = ?
         AND envelope_digest = ? AND state = 'ready' AND consumed_at IS NULL
         AND expires_at > ?
         AND EXISTS (SELECT 1 FROM pool_route_qualifications q WHERE ${routeMatch})
    `).bind(
      now, input.taskKey, admissionId, a.approvalId, a.ownerNumericId,
      a.repositoryId, a.issueNumber, a.targetSha, a.profile, a.envelopeDigest,
      now, ...routeValues
    ),
    db.prepare(`
      INSERT INTO pool_admissions (
        admission_id, approval_id, task_key, attempt_id, attempt_number,
        qualification_id, evidence_digest, admitted_at, dispatch_enabled
      )
      SELECT ?, l.approval_id, t.task_key,
        CASE WHEN t.current_attempt_id IS NULL OR EXISTS (
          SELECT 1 FROM pool_attempts p WHERE p.attempt_id = t.current_attempt_id
            AND p.status IN ('failed', 'abandoned')
        ) THEN ? ELSE t.current_attempt_id END,
        CASE WHEN t.current_attempt_id IS NULL OR EXISTS (
          SELECT 1 FROM pool_attempts p WHERE p.attempt_id = t.current_attempt_id
            AND p.status IN ('failed', 'abandoned')
        ) THEN t.attempt_number + 1 ELSE t.attempt_number END,
        q.qualification_id, q.evidence_digest, ?, 0
      FROM pool_approval_ledger l
      JOIN pool_tasks t ON t.task_key = l.task_key
      JOIN pool_task_approvals ta ON ta.approval_id = l.approval_id AND ta.task_key = t.task_key
      JOIN pool_route_qualifications q ON ${routeMatch}
      WHERE l.approval_id = ? AND l.admission_id = ? AND l.state = 'consumed'
        AND l.consumed_at = ? AND t.state = 'pending'
    `).bind(admissionId, t.attemptId, now, ...routeValues, a.approvalId, admissionId, now),
    db.prepare(`
      INSERT INTO pool_attempts (
        attempt_id, task_key, attempt_number, status, input_digest,
        execution_idempotency_key, created_at
      )
      SELECT a.attempt_id, a.task_key, a.attempt_number, 'prepared', ?, ?, ?
        FROM pool_admissions a
        JOIN pool_tasks t ON t.task_key = a.task_key
       WHERE a.admission_id = ? AND a.attempt_id = ?
         AND a.attempt_number = t.attempt_number + 1
         AND (t.current_attempt_id IS NULL OR EXISTS (
           SELECT 1 FROM pool_attempts p WHERE p.attempt_id = t.current_attempt_id
             AND p.status IN ('failed', 'abandoned')
         ))
    `).bind(t.inputDigest, t.executionIdempotencyKey, now, admissionId, t.attemptId),
    db.prepare(`
      INSERT INTO pool_admission_commit_receipts (
        admission_id, approval_id, task_key, attempt_id, qualification_id,
        evidence_digest, committed_at, assertion, dispatch_enabled
      )
      VALUES (?, ?, ?, ?, ?, ?, ?,
        CASE WHEN EXISTS (
          SELECT 1
            FROM pool_admissions a
            JOIN pool_approval_ledger l ON l.approval_id = a.approval_id
            JOIN pool_tasks t ON t.task_key = a.task_key
            JOIN pool_task_approvals ta ON ta.approval_id = a.approval_id AND ta.task_key = a.task_key
            JOIN pool_task_delivery_outbox o ON o.task_key = a.task_key
            JOIN pool_attempts p ON p.attempt_id = a.attempt_id AND p.task_key = a.task_key
            JOIN pool_route_qualifications q ON q.qualification_id = a.qualification_id
           WHERE a.admission_id = ? AND a.approval_id = ?
             AND a.task_key = ? AND a.attempt_id = ?
             AND a.qualification_id = ? AND a.evidence_digest = ?
             AND a.admitted_at = ? AND a.dispatch_enabled = 0
             AND l.state = 'consumed' AND l.admission_id = a.admission_id
             AND l.consumed_at = a.admitted_at
             AND o.status = 'pending'
             AND p.attempt_number = a.attempt_number
             AND p.input_digest = ? AND p.execution_idempotency_key = ?
             AND q.qualification_status = 'qualified' AND q.revoked_at IS NULL
             AND q.evidence_digest = a.evidence_digest
             AND q.issued_at <= ? AND q.expires_at > ?
        ) THEN 1 ELSE 0 END, 0)
    `).bind(
      admissionId, a.approvalId, input.taskKey, t.attemptId,
      r.qualificationId, r.evidenceDigest, now,
      admissionId, a.approvalId, input.taskKey, t.attemptId,
      r.qualificationId, r.evidenceDigest, now, t.inputDigest,
      t.executionIdempotencyKey, now, now
    )
  ];
}

/**
 * Local-only composite D1 admission proof. Route rows must already have been
 * written by a trusted qualification authority. This adapter verifies exact
 * binding/freshness/revocation and atomically consumes approval, creates the
 * existing task/outbox, records admission, creates/reuses one immutable attempt,
 * and writes a constraint-backed commit receipt. It never dispatches.
 */
export async function admitQualifiedTask(db, input) {
  if (!valid(input)) return deny("INVALID_ADMISSION_BINDING");
  const canonicalTask = JSON.stringify(["pool-task-v1", input.approval.repositoryId, input.approval.issueNumber, input.approval.targetSha, input.approval.profile, 1]);
  const taskDigest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalTask));
  const expectedTaskKey = [...new Uint8Array(taskDigest)].map((value) => value.toString(16).padStart(2, "0")).join("");
  if (input.taskKey !== expectedTaskKey) return deny("TASK_KEY_BINDING_MISMATCH");
  if (!db || typeof db.prepare !== "function" || typeof db.batch !== "function") {
    return deny("STORAGE_UNAVAILABLE");
  }

  try {
    const prior = await db.prepare(`
      SELECT a.admission_id, a.approval_id, a.qualification_id,
             a.evidence_digest, a.attempt_id AS requested_attempt_id,
             p.input_digest, p.execution_idempotency_key
        FROM pool_admissions a
        JOIN pool_attempts p ON p.attempt_id = a.attempt_id
       WHERE a.admission_id = ?
    `).bind(input.admissionId).first();
    if (prior) {
      if (!same(prior, input)) return deny("ADMISSION_IDENTITY_CONFLICT");
      const active = await db.prepare(`
        SELECT 1 AS ok FROM pool_route_qualifications
         WHERE qualification_id = ? AND evidence_digest = ?
           AND qualification_status = 'qualified' AND revoked_at IS NULL
           AND issued_at <= ? AND expires_at > ?
      `).bind(input.route.qualificationId, input.route.evidenceDigest, input.now, input.now).first();
      if (!active) return deny("ROUTE_EVIDENCE_REVOKED_OR_STALE");
      return {
        decision: "ADMISSION_ALREADY_COMMITTED", admissionId: input.admissionId,
        taskKey: input.taskKey, attemptId: prior.requested_attempt_id, dispatch: false
      };
    }

    await db.batch(statements(db, input));
    const committed = await db.prepare(`
      SELECT a.admission_id, a.approval_id, a.task_key, a.attempt_id,
             a.attempt_number, a.qualification_id, a.evidence_digest,
             a.dispatch_enabled, r.assertion, r.committed_at,
             l.state AS approval_state, o.status AS outbox_status,
             p.status AS attempt_status, p.input_digest, p.execution_idempotency_key
        FROM pool_admissions a
        JOIN pool_admission_commit_receipts r ON r.admission_id = a.admission_id
        JOIN pool_approval_ledger l ON l.approval_id = a.approval_id
        JOIN pool_task_delivery_outbox o ON o.task_key = a.task_key
        JOIN pool_attempts p ON p.attempt_id = a.attempt_id AND p.task_key = a.task_key
       WHERE a.admission_id = ?
    `).bind(input.admissionId).first();
    if (!committed || committed.assertion !== 1 ||
        committed.approval_state !== "consumed" || committed.outbox_status !== "pending" ||
        committed.input_digest !== input.attempt.inputDigest ||
        committed.execution_idempotency_key !== input.attempt.executionIdempotencyKey ||
        committed.dispatch_enabled !== 0) return deny("ADMISSION_READBACK_MISMATCH");
    return {
      decision: "ADMITTED_QUEUED", admissionId: committed.admission_id,
      taskKey: committed.task_key, attemptId: committed.attempt_id,
      attemptNumber: committed.attempt_number, dispatch: false,
      reason: "ATOMIC_A0_D1_COMMIT_CONFIRMED"
    };
  } catch {
    return deny("ADMISSION_TRANSACTION_ROLLED_BACK_OR_AMBIGUOUS");
  }
}
