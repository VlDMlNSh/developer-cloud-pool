import { canonicalTaskKey } from "./task-identity.mjs";
const SHA40 = /^[a-f0-9]{40}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const NUMERIC_ID = /^[0-9]+$/;
const SAFE_ID = /^[A-Za-z0-9._:-]{1,160}$/;
const EXECUTOR_ID = /^[A-Za-z0-9._:-]{1,128}$/;
const COST_CLASSES = new Set(["local", "free_quota"]);

const deny = (reason) => ({ decision: "DENY", dispatch: false, reason });

function valid(input) {
  const a = input?.approval;
  const r = input?.route;
  const t = input?.attempt;
  return Boolean(
    input && Number.isSafeInteger(input.now) && input.now > 0 &&
    EXECUTOR_ID.test(input.executorId || "") &&
    SAFE_ID.test(input.admissionId || "") &&
    SHA256.test(input.taskKey || "") &&
    a && a.executorId === input.executorId && SAFE_ID.test(a.approvalId || "") &&
    NUMERIC_ID.test(a.ownerNumericId || "") &&
    NUMERIC_ID.test(a.repositoryId || "") &&
    Number.isSafeInteger(a.issueNumber) && a.issueNumber > 0 &&
    SHA40.test(a.targetSha || "") && a.profile === "jarvis-code-sandbox-v1" &&
    SHA256.test(a.envelopeDigest || "") &&
    r && SAFE_ID.test(r.qualificationId || "") &&
    SAFE_ID.test(r.routeId || "") && SAFE_ID.test(r.providerId || "") &&
    SAFE_ID.test(r.modelId || "") && SAFE_ID.test(r.issuerId || "") &&
    SAFE_ID.test(r.accountRef || "") && SAFE_ID.test(r.credentialHandleRef || "") &&
    r.schemaVersion === 1 && r.capabilityProfile === a.profile &&
    Number.isSafeInteger(r.validUntil) && r.validUntil > r.observedAt &&
    typeof r.evidenceRef === "string" && r.evidenceRef.length > 0 && r.evidenceRef.length <= 512 &&
    Number.isSafeInteger(r.observedAt) && r.observedAt > 0 &&
    Number.isSafeInteger(r.revocationVersion) && r.revocationVersion >= 0 &&
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
    row.executor_id === input.executorId &&
    row.approval_executor_id === input.executorId &&
    row.task_executor_id === input.executorId &&
    row.qualification_id === r.qualificationId &&
    row.evidence_digest === r.evidenceDigest &&
    row.task_key === input.taskKey &&
    row.requested_attempt_id === t.attemptId &&
    row.input_digest === t.inputDigest &&
    row.execution_idempotency_key === t.executionIdempotencyKey &&
    row.owner_numeric_id === a.ownerNumericId &&
    row.repository_id === a.repositoryId &&
    row.issue_number === a.issueNumber &&
    row.target_sha === a.targetSha &&
    row.profile === a.profile &&
    row.envelope_digest === a.envelopeDigest &&
    row.route_id === r.routeId &&
    row.provider_id === r.providerId &&
    row.model_id === r.modelId &&
    row.issuer_id === r.issuerId &&
    row.account_ref === r.accountRef &&
    row.credential_handle_ref === r.credentialHandleRef &&
    row.quota_domain_id === (r.quotaDomainId ?? null) &&
    row.cost_class === r.costClass &&
    row.capability_id === r.capabilityId && row.registry_version === r.registryVersion &&
    row.schema_version === r.schemaVersion && row.evidence_ref === r.evidenceRef &&
    row.observed_at === r.observedAt && row.valid_until === r.validUntil &&
    row.capability_profile === r.capabilityProfile && row.revocation_version === r.revocationVersion;
}

function statements(db, input) {
  const { approval: a, route: r, attempt: t, now, admissionId } = input;
  const routeMatch = `
    q.qualification_id = ? AND q.route_id = ? AND q.provider_id = ?
    AND q.model_id = ? AND q.issuer_id = ? AND q.account_ref = ?
    AND q.credential_handle_ref = ? AND q.quota_domain_id IS ?
    AND q.cost_class = ? AND q.capability_id = ? AND q.capability_profile = ? AND q.evidence_digest = ?
    AND q.registry_version = ? AND q.schema_version = ? AND q.evidence_ref = ?
    AND q.observed_at = ? AND q.valid_until = ? AND q.revocation_version = ?
    AND q.qualification_status = 'qualified' AND q.revoked_at IS NULL
    AND q.observed_at <= ? AND q.observed_at >= ? AND q.valid_until > ?
  `;
  const routeValues = [
    r.qualificationId, r.routeId, r.providerId, r.modelId, r.issuerId,
    r.accountRef, r.credentialHandleRef, r.quotaDomainId ?? null,
    r.costClass, r.capabilityId, r.capabilityProfile, r.evidenceDigest, r.registryVersion,
    r.schemaVersion, r.evidenceRef, r.observedAt, r.validUntil, r.revocationVersion,
    now, now - 300, now
  ];
  return [
    db.prepare(`
      UPDATE pool_approval_ledger
         SET state = 'consumed', consumed_at = ?, task_key = ?, admission_id = ?
       WHERE approval_id = ? AND owner_numeric_id = ? AND repository_id = ?
         AND issue_number = ? AND target_sha = ? AND profile = ?
         AND executor_id = ? AND envelope_digest = ? AND state = 'ready' AND consumed_at IS NULL
         AND expires_at > ?
         AND EXISTS (SELECT 1 FROM pool_route_qualifications q WHERE ${routeMatch})
    `).bind(
      now, input.taskKey, admissionId, a.approvalId, a.ownerNumericId,
      a.repositoryId, a.issueNumber, a.targetSha, a.profile, a.executorId, a.envelopeDigest,
      now, ...routeValues
    ),
    db.prepare(`
      INSERT INTO pool_admissions (
        admission_id, approval_id, task_key, executor_id, attempt_id, attempt_number,
        qualification_id, evidence_digest, admitted_at, dispatch_enabled
      )
      SELECT ?, l.approval_id, t.task_key, l.executor_id,
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
      UPDATE pool_task_delivery_outbox
         SET admission_id = ?, attempt_id = ?, evidence_digest = ?
       WHERE task_key = ? AND event_type = 'pool.task.ready' AND status = 'pending'
         AND admission_id IS NULL AND attempt_id IS NULL AND evidence_digest IS NULL
         AND EXISTS (SELECT 1 FROM pool_admissions a JOIN pool_attempts p
           ON p.attempt_id = a.attempt_id AND p.task_key = a.task_key
           WHERE a.admission_id = ? AND a.task_key = pool_task_delivery_outbox.task_key
             AND a.attempt_id = ? AND a.evidence_digest = ?)
    `).bind(admissionId, t.attemptId, r.evidenceDigest, input.taskKey,
      admissionId, t.attemptId, r.evidenceDigest),
    db.prepare(`
      INSERT INTO pool_admission_commit_receipts (
        admission_id, approval_id, task_key, executor_id, attempt_id, qualification_id,
        evidence_digest, committed_at, assertion, dispatch_enabled
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?,
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
             AND a.executor_id = l.executor_id AND a.executor_id = t.executor_id
             AND l.state = 'consumed' AND l.admission_id = a.admission_id
             AND l.consumed_at = a.admitted_at
             AND o.status = 'pending' AND o.admission_id = a.admission_id
             AND o.attempt_id = a.attempt_id AND o.evidence_digest = a.evidence_digest
             AND t.current_attempt_id = a.attempt_id AND t.attempt_number = a.attempt_number
             AND EXISTS (SELECT 1 FROM pool_attempt_events e WHERE e.attempt_id = a.attempt_id AND e.event_type = 'attempt.created')
             AND p.attempt_number = a.attempt_number
             AND p.input_digest = ? AND p.execution_idempotency_key = ?
             AND q.qualification_status = 'qualified' AND q.revoked_at IS NULL
             AND q.evidence_digest = a.evidence_digest
             AND q.schema_version = ? AND q.evidence_ref = ? AND q.observed_at = ?
             AND q.capability_profile = ? AND q.valid_until = ?
             AND q.revocation_version = ? AND q.observed_at <= ? AND q.observed_at >= ?
             AND q.valid_until > ?
        ) THEN 1 ELSE 0 END, 0)
    `).bind(
      admissionId, a.approvalId, input.taskKey, input.executorId, t.attemptId,
      r.qualificationId, r.evidenceDigest, now,
      admissionId, a.approvalId, input.taskKey, t.attemptId,
      r.qualificationId, r.evidenceDigest, now, t.inputDigest,
      t.executionIdempotencyKey, r.schemaVersion, r.evidenceRef,
      r.observedAt, r.capabilityProfile, r.validUntil, r.revocationVersion, now, now - 300, now
    ),
  ];
}

async function readPrior(readDb, input) {
  return readDb.prepare(`
      SELECT a.admission_id, a.approval_id, a.task_key, a.executor_id,
             l.state AS approval_state, p.status AS attempt_status,
             l.executor_id AS approval_executor_id, t.executor_id AS task_executor_id,
             a.qualification_id, a.evidence_digest, a.attempt_id AS requested_attempt_id,
             a.attempt_id AS admission_attempt_id,
             p.input_digest, p.execution_idempotency_key,
             l.owner_numeric_id, l.repository_id, l.issue_number,
             l.target_sha, l.profile, l.envelope_digest,
             q.route_id, q.provider_id, q.model_id, q.issuer_id, q.account_ref,
             q.credential_handle_ref, q.quota_domain_id, q.cost_class,
             q.capability_id, q.capability_profile, q.registry_version, q.schema_version,
             q.evidence_ref, q.observed_at, q.valid_until, q.revocation_version,
             a.attempt_number AS admission_attempt_number, a.dispatch_enabled,
             c.assertion AS receipt_assertion, c.executor_id AS receipt_executor_id,
             c.approval_id AS receipt_approval_id, c.task_key AS receipt_task_key,
             c.attempt_id AS receipt_attempt_id, c.qualification_id AS receipt_qualification_id,
             c.evidence_digest AS receipt_evidence_digest,
             c.dispatch_enabled AS receipt_dispatch_enabled,
             o.status AS outbox_status, o.event_type AS outbox_event_type,
             o.admission_id AS outbox_admission_id, o.attempt_id AS outbox_attempt_id,
             o.evidence_digest AS outbox_evidence_digest,
             t.current_attempt_id AS task_current_attempt_id,
             t.attempt_number AS task_attempt_number
        FROM pool_admissions a
        JOIN pool_attempts p ON p.attempt_id = a.attempt_id AND p.task_key = a.task_key
        JOIN pool_approval_ledger l ON l.approval_id = a.approval_id
        JOIN pool_tasks t ON t.task_key = a.task_key
        JOIN pool_route_qualifications q ON q.qualification_id = a.qualification_id
        LEFT JOIN pool_admission_commit_receipts c ON c.admission_id = a.admission_id
        LEFT JOIN pool_task_delivery_outbox o ON o.task_key = a.task_key
       WHERE a.admission_id = ?
    `).bind(input.admissionId).first();
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
  const expectedTaskKey = await canonicalTaskKey({ repositoryId: input.approval.repositoryId, issueNumber: input.approval.issueNumber, targetSha: input.approval.targetSha, profile: input.approval.profile, executorId: input.executorId });
  if (input.taskKey !== expectedTaskKey) return deny("TASK_KEY_BINDING_MISMATCH");
  if (!db || typeof db.prepare !== "function" || typeof db.batch !== "function") {
    return deny("STORAGE_UNAVAILABLE");
  }

  let batchAttempted = false;
  try {
    const priorReadDb = db.withSession("first-primary");
    if (!priorReadDb || typeof priorReadDb.prepare !== "function") return deny("CONSISTENT_READBACK_UNAVAILABLE");
    const prior = await readPrior(priorReadDb, input);
    if (prior) {
      if (!same(prior, input)) return deny("ADMISSION_IDENTITY_CONFLICT");
      if (prior.approval_state !== "consumed" || prior.attempt_status !== "prepared" ||
          prior.receipt_assertion !== 1 || prior.receipt_executor_id !== input.executorId ||
          prior.receipt_approval_id !== prior.approval_id || prior.receipt_task_key !== prior.task_key ||
          prior.receipt_attempt_id !== prior.admission_attempt_id ||
          prior.receipt_qualification_id !== prior.qualification_id ||
          prior.receipt_evidence_digest !== prior.evidence_digest ||
          prior.receipt_dispatch_enabled !== 0 || prior.dispatch_enabled !== 0 ||
          prior.outbox_status !== "pending" || prior.outbox_event_type !== "pool.task.ready" ||
          prior.outbox_admission_id !== prior.admission_id ||
          prior.outbox_attempt_id !== prior.admission_attempt_id ||
          prior.outbox_evidence_digest !== prior.evidence_digest ||
          prior.task_current_attempt_id !== prior.admission_attempt_id ||
          prior.task_attempt_number !== prior.admission_attempt_number) {
        return deny("ADMISSION_COMMIT_RECEIPT_MISMATCH");
      }
      const active = await priorReadDb.prepare(`
        SELECT 1 AS ok FROM pool_route_qualifications
         WHERE qualification_id = ? AND route_id = ? AND provider_id = ?
           AND model_id = ? AND issuer_id = ? AND account_ref = ?
           AND credential_handle_ref = ? AND quota_domain_id IS ?
           AND cost_class = ? AND capability_id = ? AND capability_profile = ? AND evidence_digest = ?
           AND registry_version = ? AND schema_version = ? AND evidence_ref = ?
           AND observed_at = ? AND valid_until = ? AND revocation_version = ?
           AND qualification_status = 'qualified' AND revoked_at IS NULL
           AND observed_at <= ? AND observed_at >= ? AND valid_until > ?
      `).bind(
        input.route.qualificationId, input.route.routeId, input.route.providerId,
        input.route.modelId, input.route.issuerId, input.route.accountRef,
        input.route.credentialHandleRef, input.route.quotaDomainId ?? null,
        input.route.costClass, input.route.capabilityId, input.route.capabilityProfile, input.route.evidenceDigest,
        input.route.registryVersion, input.route.schemaVersion, input.route.evidenceRef,
        input.route.observedAt, input.route.validUntil, input.route.revocationVersion, input.now,
        input.now - 300, input.now
      ).first();
      if (!active) return deny("ROUTE_EVIDENCE_REVOKED_OR_STALE");
      return {
        decision: "ADMISSION_ALREADY_COMMITTED", admissionId: input.admissionId,
        taskKey: input.taskKey, executorId: input.executorId, attemptId: prior.requested_attempt_id, dispatch: false
      };
    }

    batchAttempted = true;
    await db.batch(statements(db, input));
    const committedReadDb = db.withSession("first-primary");
    const committed = await committedReadDb.prepare(`
      SELECT a.admission_id, a.approval_id, a.task_key, a.executor_id,
             l.executor_id AS approval_executor_id, t.executor_id AS task_executor_id,
             a.attempt_id, a.attempt_number, a.qualification_id, a.evidence_digest,
             a.dispatch_enabled, r.assertion, r.committed_at,
             l.state AS approval_state, p.status AS attempt_status,
             o.status AS outbox_status, o.event_type AS outbox_event_type,
             o.admission_id AS outbox_admission_id, o.attempt_id AS outbox_attempt_id,
             o.evidence_digest AS outbox_evidence_digest,
             t.current_attempt_id AS task_current_attempt_id, t.attempt_number AS task_attempt_number,
             p.status AS attempt_status, p.input_digest, p.execution_idempotency_key
        FROM pool_admissions a
        JOIN pool_admission_commit_receipts r ON r.admission_id = a.admission_id
        JOIN pool_approval_ledger l ON l.approval_id = a.approval_id
        JOIN pool_task_delivery_outbox o ON o.task_key = a.task_key
        JOIN pool_tasks t ON t.task_key = a.task_key
        JOIN pool_attempts p ON p.attempt_id = a.attempt_id AND p.task_key = a.task_key
       WHERE a.admission_id = ?
    `).bind(input.admissionId).first();
    if (!committed || committed.assertion !== 1 ||
        committed.approval_state !== "consumed" || committed.attempt_status !== "prepared" || committed.outbox_status !== "pending" ||
        committed.outbox_event_type !== "pool.task.ready" ||
        committed.task_current_attempt_id !== committed.attempt_id ||
        committed.task_attempt_number !== committed.attempt_number ||
        committed.input_digest !== input.attempt.inputDigest ||
        committed.execution_idempotency_key !== input.attempt.executionIdempotencyKey ||
        committed.outbox_admission_id !== committed.admission_id ||
        committed.outbox_attempt_id !== committed.attempt_id ||
        committed.outbox_evidence_digest !== committed.evidence_digest ||
        committed.dispatch_enabled !== 0 || committed.executor_id !== input.executorId || committed.approval_executor_id !== input.executorId || committed.task_executor_id !== input.executorId) return deny("ADMISSION_READBACK_MISMATCH");
    return {
      decision: "ADMITTED_QUEUED", admissionId: committed.admission_id,
      taskKey: committed.task_key, executorId: committed.executor_id, attemptId: committed.attempt_id,
      attemptNumber: committed.attempt_number, dispatch: false,
      reason: "ATOMIC_A0_D1_COMMIT_CONFIRMED"
    };
  } catch {
    if (!batchAttempted) return deny("D1_PRE_ADMISSION_READ_FAILED");
    try {
      // A failed batch acknowledgement is ambiguous: read the primary before
      // allowing the caller to retry with the same immutable admission identity.
      const recoveryReadDb = db.withSession("first-primary");
      const recovered = await readPrior(recoveryReadDb, input);
      if (!recovered) return deny("ADMISSION_OUTCOME_UNCONFIRMED");
      if (!same(recovered, input)) return deny("ADMISSION_IDENTITY_CONFLICT");
      if (recovered.approval_state !== "consumed" || recovered.attempt_status !== "prepared" ||
          recovered.receipt_assertion !== 1 || recovered.receipt_executor_id !== input.executorId ||
          recovered.receipt_approval_id !== recovered.approval_id ||
          recovered.receipt_task_key !== recovered.task_key ||
          recovered.receipt_attempt_id !== recovered.admission_attempt_id ||
          recovered.receipt_qualification_id !== recovered.qualification_id ||
          recovered.receipt_evidence_digest !== recovered.evidence_digest ||
          recovered.receipt_dispatch_enabled !== 0 || recovered.dispatch_enabled !== 0 ||
          recovered.outbox_status !== "pending" || recovered.outbox_event_type !== "pool.task.ready" ||
          recovered.outbox_admission_id !== recovered.admission_id ||
          recovered.outbox_attempt_id !== recovered.admission_attempt_id ||
          recovered.outbox_evidence_digest !== recovered.evidence_digest ||
          recovered.task_current_attempt_id !== recovered.admission_attempt_id ||
          recovered.task_attempt_number !== recovered.admission_attempt_number) {
        return deny("ADMISSION_COMMIT_RECEIPT_MISMATCH");
      }
      const active = await recoveryReadDb.prepare(`
        SELECT 1 AS ok FROM pool_route_qualifications
         WHERE qualification_id = ? AND route_id = ? AND provider_id = ?
           AND model_id = ? AND issuer_id = ? AND account_ref = ?
           AND credential_handle_ref = ? AND quota_domain_id IS ?
           AND cost_class = ? AND capability_id = ? AND capability_profile = ? AND evidence_digest = ?
           AND registry_version = ? AND schema_version = ? AND evidence_ref = ?
           AND observed_at = ? AND valid_until = ? AND revocation_version = ?
           AND qualification_status = 'qualified' AND revoked_at IS NULL
           AND observed_at <= ? AND observed_at >= ? AND valid_until > ?
      `).bind(
        input.route.qualificationId, input.route.routeId, input.route.providerId,
        input.route.modelId, input.route.issuerId, input.route.accountRef,
        input.route.credentialHandleRef, input.route.quotaDomainId ?? null,
        input.route.costClass, input.route.capabilityId, input.route.capabilityProfile, input.route.evidenceDigest,
        input.route.registryVersion, input.route.schemaVersion, input.route.evidenceRef,
        input.route.observedAt, input.route.validUntil, input.route.revocationVersion,
        input.now, input.now - 300, input.now
      ).first();
      if (!active) return deny("ROUTE_EVIDENCE_REVOKED_OR_STALE");
      return {
        decision: "ADMISSION_ALREADY_COMMITTED", admissionId: input.admissionId,
        taskKey: input.taskKey, executorId: input.executorId,
        attemptId: recovered.requested_attempt_id, dispatch: false,
        reason: "AMBIGUOUS_BATCH_RESOLVED_BY_PRIMARY_READBACK"
      };
    } catch {
      return deny("ADMISSION_OUTCOME_UNCONFIRMED");
    }
  }
}
