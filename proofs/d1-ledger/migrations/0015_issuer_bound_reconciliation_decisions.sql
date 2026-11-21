-- Pass 36: immutable issuer-verified reconciliation decisions.
-- Recording a decision never releases a lease, changes attempt state, retries,
-- dispatches or authorizes execution. A later owner-authorized transition is separate.
CREATE TABLE pool_attempt_reconciliation_decisions (
  reconciliation_id TEXT PRIMARY KEY NOT NULL CHECK (length(reconciliation_id) BETWEEN 1 AND 128),
  task_key TEXT NOT NULL REFERENCES pool_tasks(task_key),
  attempt_id TEXT NOT NULL REFERENCES pool_attempts(attempt_id),
  lease_generation INTEGER NOT NULL CHECK (lease_generation > 0),
  issuer_id TEXT NOT NULL CHECK (length(issuer_id) BETWEEN 1 AND 256),
  audience TEXT NOT NULL CHECK (length(audience) BETWEEN 1 AND 256),
  capability_id TEXT NOT NULL CHECK (capability_id = 'pool.attempt.reconcile'),
  principal_subject TEXT NOT NULL CHECK (length(principal_subject) BETWEEN 1 AND 256),
  evidence_jti TEXT NOT NULL CHECK (length(evidence_jti) BETWEEN 1 AND 128),
  evidence_digest TEXT NOT NULL CHECK (length(evidence_digest) = 64 AND evidence_digest NOT GLOB '*[^0-9a-f]*'),
  decision TEXT NOT NULL CHECK (decision IN ('safe_to_retry', 'result_confirmed', 'effects_unknown')),
  executor_stopped INTEGER NOT NULL CHECK (executor_stopped IN (0, 1)),
  external_effects TEXT NOT NULL CHECK (external_effects IN ('absent', 'present', 'unknown')),
  result_digest TEXT CHECK (result_digest IS NULL OR (length(result_digest) = 64 AND result_digest NOT GLOB '*[^0-9a-f]*')),
  provenance_digest TEXT CHECK (provenance_digest IS NULL OR (length(provenance_digest) = 64 AND provenance_digest NOT GLOB '*[^0-9a-f]*')),
  observed_at INTEGER NOT NULL CHECK (observed_at > 0),
  verified_at INTEGER NOT NULL CHECK (verified_at >= observed_at),
  UNIQUE (attempt_id, lease_generation),
  UNIQUE (issuer_id, evidence_jti),
  CHECK (
    (decision = 'safe_to_retry' AND executor_stopped = 1 AND external_effects = 'absent'
      AND result_digest IS NULL AND provenance_digest IS NULL)
    OR
    (decision = 'result_confirmed' AND result_digest IS NOT NULL AND provenance_digest IS NOT NULL)
    OR
    (decision = 'effects_unknown' AND external_effects = 'unknown')
  )
);

CREATE TRIGGER pool_attempt_reconciliation_decision_binding
BEFORE INSERT ON pool_attempt_reconciliation_decisions
WHEN NOT EXISTS (
  SELECT 1
    FROM pool_attempt_reconciliations r
    JOIN pool_attempts a ON a.attempt_id = r.attempt_id AND a.task_key = r.task_key
    JOIN pool_tasks t ON t.task_key = r.task_key
   WHERE r.reconciliation_id = 'reconcile:' || NEW.attempt_id
     AND NEW.reconciliation_id = r.reconciliation_id
     AND r.status = 'pending'
     AND r.task_key = NEW.task_key
     AND r.attempt_id = NEW.attempt_id
     AND r.input_digest = a.input_digest
     AND r.lease_generation = NEW.lease_generation
     AND a.status = 'indeterminate'
     AND a.lease_generation = NEW.lease_generation
     AND t.current_attempt_id = NEW.attempt_id
     AND t.lease_attempt_id = NEW.attempt_id
     AND t.state = 'leased'
     AND t.lease_generation = NEW.lease_generation
     AND t.lease_owner = r.expired_lease_owner
     AND t.lease_expires_at <= a.indeterminate_at
     AND NEW.observed_at >= a.indeterminate_at
     AND NEW.verified_at >= NEW.observed_at
)
BEGIN
  SELECT RAISE(ABORT, 'RECONCILIATION_DECISION_BINDING_INVALID');
END;

CREATE TRIGGER pool_attempt_reconciliation_decisions_no_update
BEFORE UPDATE ON pool_attempt_reconciliation_decisions
BEGIN SELECT RAISE(ABORT, 'RECONCILIATION_DECISIONS_APPEND_ONLY'); END;

CREATE TRIGGER pool_attempt_reconciliation_decisions_no_delete
BEFORE DELETE ON pool_attempt_reconciliation_decisions
BEGIN SELECT RAISE(ABORT, 'RECONCILIATION_DECISIONS_APPEND_ONLY'); END;
