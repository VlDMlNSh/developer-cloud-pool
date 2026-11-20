-- Pass 33: close SQL-level mutation and cross-row binding gaps left by the
-- adapter-level admission checks. These triggers are additive and forward-only.

-- Approval authorization identity is immutable after insertion. The logical
-- task key and admission ID may be bound once, but never rebound.
CREATE TRIGGER pool_approval_authorization_identity_immutable
BEFORE UPDATE OF approval_id, owner_numeric_id, repository_id, issue_number, target_sha,
  profile, envelope_digest, expires_at
ON pool_approval_ledger
WHEN NEW.approval_id IS NOT OLD.approval_id
  OR NEW.owner_numeric_id IS NOT OLD.owner_numeric_id
  OR NEW.repository_id IS NOT OLD.repository_id
  OR NEW.issue_number IS NOT OLD.issue_number
  OR NEW.target_sha IS NOT OLD.target_sha
  OR NEW.profile IS NOT OLD.profile
  OR NEW.envelope_digest IS NOT OLD.envelope_digest
  OR NEW.expires_at IS NOT OLD.expires_at
BEGIN
  SELECT RAISE(ABORT, 'APPROVAL_AUTHORIZATION_IDENTITY_IMMUTABLE');
END;

CREATE TRIGGER pool_approval_task_key_immutable
BEFORE UPDATE OF task_key ON pool_approval_ledger
WHEN OLD.task_key IS NOT NULL AND NEW.task_key IS NOT OLD.task_key
BEGIN
  SELECT RAISE(ABORT, 'APPROVAL_TASK_KEY_IMMUTABLE');
END;

CREATE TRIGGER pool_approval_consumed_at_immutable
BEFORE UPDATE OF consumed_at ON pool_approval_ledger
WHEN OLD.consumed_at IS NOT NULL AND NEW.consumed_at IS NOT OLD.consumed_at
BEGIN
  SELECT RAISE(ABORT, 'APPROVAL_CONSUMED_AT_IMMUTABLE');
END;

-- A consumed or revoked approval cannot be reopened or switched to another
-- terminal state. Ready -> consumed/revoked remains the only state transition.
CREATE TRIGGER pool_approval_state_transition_guard
BEFORE UPDATE OF state ON pool_approval_ledger
WHEN NOT (
  OLD.state = NEW.state OR
  (OLD.state = 'ready' AND NEW.state = 'consumed'
    AND OLD.consumed_at IS NULL AND NEW.consumed_at IS NOT NULL) OR
  (OLD.state = 'ready' AND NEW.state = 'revoked'
    AND OLD.consumed_at IS NULL AND NEW.consumed_at IS NULL)
)
BEGIN
  SELECT RAISE(ABORT, 'APPROVAL_STATE_TRANSITION_INVALID');
END;

-- Bind consumed_at, task_key and admission_id only in the one atomic
-- ready -> consumed transition. No post-consumption late binding is allowed.
CREATE TRIGGER pool_approval_consumption_binding_guard
BEFORE UPDATE OF consumed_at, task_key, admission_id ON pool_approval_ledger
WHEN (
  NEW.consumed_at IS NOT OLD.consumed_at OR
  NEW.task_key IS NOT OLD.task_key OR
  NEW.admission_id IS NOT OLD.admission_id
)
AND NOT (
  OLD.state = 'ready' AND NEW.state = 'consumed'
  AND OLD.consumed_at IS NULL AND NEW.consumed_at IS NOT NULL
  AND (OLD.task_key IS NULL OR OLD.task_key IS NEW.task_key)
  AND (OLD.admission_id IS NULL OR OLD.admission_id IS NEW.admission_id)
  AND NEW.task_key IS NOT NULL
  AND (NEW.admission_id IS NULL OR (OLD.admission_id IS NULL AND NEW.admission_id IS NOT NULL))
)
BEGIN
  SELECT RAISE(ABORT, 'APPROVAL_CONSUMPTION_BINDING_INVALID');
END;

-- Strengthen the existing INSERT guard: admission rows must reference the
-- exact consumed approval, task and currently-qualified route evidence.
CREATE TRIGGER pool_admissions_full_binding_guard
BEFORE INSERT ON pool_admissions
WHEN NOT EXISTS (
  SELECT 1
    FROM pool_approval_ledger l
    JOIN pool_tasks t ON t.task_key = l.task_key
    JOIN pool_route_qualifications q ON q.qualification_id = NEW.qualification_id
   WHERE l.approval_id = NEW.approval_id
     AND l.admission_id = NEW.admission_id
     AND l.state = 'consumed'
     AND l.consumed_at = NEW.admitted_at
     AND l.task_key = NEW.task_key
     AND l.executor_id = NEW.executor_id
     AND l.profile = 'jarvis-code-sandbox-v1'
     AND t.task_key = NEW.task_key
     AND t.executor_id = NEW.executor_id
     AND t.repository_id = l.repository_id
     AND t.issue_number = l.issue_number
     AND t.target_sha = l.target_sha
     AND t.profile = l.profile
     AND q.capability_profile = l.profile
     AND q.qualification_status = 'qualified'
     AND q.revoked_at IS NULL
     AND q.evidence_digest = NEW.evidence_digest
     AND q.observed_at <= NEW.admitted_at
     AND q.observed_at >= NEW.admitted_at - 300
     AND q.valid_until > NEW.admitted_at
)
BEGIN
  SELECT RAISE(ABORT, 'ADMISSION_FULL_BINDING_INVALID');
END;

-- The commit receipt is a database assertion, not merely an adapter payload.
-- Require all receipt identities to match the admission, prepared attempt,
-- current task pointer, consumed approval, route evidence and pending outbox.
CREATE TRIGGER pool_admission_receipt_full_binding_guard
BEFORE INSERT ON pool_admission_commit_receipts
WHEN NOT EXISTS (
  SELECT 1
    FROM pool_admissions a
    JOIN pool_approval_ledger l ON l.approval_id = a.approval_id
    JOIN pool_tasks t ON t.task_key = a.task_key
    JOIN pool_attempts p ON p.attempt_id = a.attempt_id AND p.task_key = a.task_key
    JOIN pool_route_qualifications q ON q.qualification_id = a.qualification_id
    JOIN pool_task_delivery_outbox o ON o.task_key = a.task_key
   WHERE a.admission_id = NEW.admission_id
     AND a.approval_id = NEW.approval_id
     AND a.task_key = NEW.task_key
     AND a.executor_id = NEW.executor_id
     AND a.attempt_id = NEW.attempt_id
     AND a.qualification_id = NEW.qualification_id
     AND a.evidence_digest = NEW.evidence_digest
     AND a.admitted_at = NEW.committed_at
     AND a.dispatch_enabled = 0
     AND l.state = 'consumed'
     AND l.admission_id = a.admission_id
     AND l.consumed_at = a.admitted_at
     AND l.executor_id = a.executor_id
     AND t.executor_id = a.executor_id
     AND t.current_attempt_id = a.attempt_id
     AND t.attempt_number = a.attempt_number
     AND p.attempt_number = a.attempt_number
     AND p.status = 'prepared'
     AND o.event_type = 'pool.task.ready'
     AND o.status = 'pending'
     AND o.admission_id = a.admission_id
     AND o.attempt_id = a.attempt_id
     AND o.evidence_digest = a.evidence_digest
     AND q.qualification_status = 'qualified'
     AND q.revoked_at IS NULL
     AND q.evidence_digest = a.evidence_digest
     AND q.capability_profile = l.profile
     AND q.observed_at <= a.admitted_at
     AND q.observed_at >= a.admitted_at - 300
     AND q.valid_until > a.admitted_at
)
BEGIN
  SELECT RAISE(ABORT, 'ADMISSION_RECEIPT_FULL_BINDING_INVALID');
END;
