-- Atomic A0 -> D1 admission extension. Additive to migrations 0001-0011.
-- Route qualification rows are populated only by a separately trusted qualification
-- authority. This local proof validates exact binding, freshness and revocation;
-- it does not cryptographically qualify an issuer or provider account.

ALTER TABLE pool_approval_ledger ADD COLUMN admission_id TEXT;
CREATE UNIQUE INDEX pool_approval_admission_id_unique
  ON pool_approval_ledger(admission_id) WHERE admission_id IS NOT NULL;

CREATE TABLE pool_route_qualifications (
  schema_version INTEGER NOT NULL CHECK (schema_version = 1),
  qualification_id TEXT PRIMARY KEY NOT NULL CHECK (length(qualification_id) BETWEEN 1 AND 128),
  route_id TEXT NOT NULL CHECK (length(route_id) BETWEEN 1 AND 128),
  provider_id TEXT NOT NULL CHECK (length(provider_id) BETWEEN 1 AND 128),
  model_id TEXT NOT NULL CHECK (length(model_id) BETWEEN 1 AND 128),
  issuer_id TEXT NOT NULL CHECK (length(issuer_id) BETWEEN 1 AND 128),
  account_ref TEXT NOT NULL CHECK (length(account_ref) BETWEEN 1 AND 160),
  credential_handle_ref TEXT NOT NULL CHECK (length(credential_handle_ref) BETWEEN 1 AND 160),
  quota_domain_id TEXT,
  cost_class TEXT NOT NULL CHECK (cost_class IN ('local', 'free_quota')),
  capability_id TEXT NOT NULL CHECK (length(capability_id) BETWEEN 1 AND 128),
  capability_profile TEXT NOT NULL CHECK (capability_profile = 'jarvis-code-sandbox-v1'),
  evidence_ref TEXT NOT NULL CHECK (length(evidence_ref) BETWEEN 1 AND 512),
  evidence_digest TEXT NOT NULL CHECK (length(evidence_digest) = 64 AND evidence_digest NOT GLOB '*[^0-9a-f]*'),
  observed_at INTEGER NOT NULL CHECK (observed_at > 0),
  valid_until INTEGER NOT NULL CHECK (valid_until > observed_at),
  revocation_version INTEGER NOT NULL CHECK (revocation_version >= 0),
  revoked_at INTEGER,
  registry_version TEXT NOT NULL CHECK (length(registry_version) BETWEEN 1 AND 128),
  qualification_status TEXT NOT NULL DEFAULT 'qualified'
    CHECK (qualification_status IN ('qualified', 'revoked')),
  CHECK (cost_class <> 'free_quota' OR quota_domain_id IS NOT NULL),
  CHECK ((qualification_status = 'qualified' AND revoked_at IS NULL) OR
         (qualification_status = 'revoked' AND revoked_at IS NOT NULL))
);

CREATE TRIGGER pool_route_qualification_identity_immutable
BEFORE UPDATE OF qualification_id, route_id, provider_id, model_id, issuer_id,
  account_ref, credential_handle_ref, quota_domain_id, cost_class, capability_id,
  capability_profile, evidence_ref, evidence_digest, observed_at, valid_until, registry_version
ON pool_route_qualifications
BEGIN SELECT RAISE(ABORT, 'ROUTE_QUALIFICATION_IDENTITY_IMMUTABLE'); END;

CREATE TRIGGER pool_route_qualification_revocation_monotonic
BEFORE UPDATE OF qualification_status, revoked_at, revocation_version ON pool_route_qualifications
WHEN NOT (OLD.qualification_status = 'qualified'
      AND NEW.qualification_status = 'revoked'
      AND OLD.revoked_at IS NULL AND NEW.revoked_at IS NOT NULL
      AND NEW.revoked_at > 0 AND NEW.revocation_version > OLD.revocation_version)
BEGIN SELECT RAISE(ABORT, 'ROUTE_QUALIFICATION_REVOCATION_MONOTONIC'); END;

CREATE TRIGGER pool_route_qualification_no_delete
BEFORE DELETE ON pool_route_qualifications
BEGIN SELECT RAISE(ABORT, 'ROUTE_QUALIFICATION_APPEND_ONLY'); END;

CREATE TRIGGER pool_approval_admission_binding_immutable
BEFORE UPDATE OF admission_id ON pool_approval_ledger
WHEN OLD.admission_id IS NOT NULL AND NEW.admission_id IS NOT OLD.admission_id
BEGIN SELECT RAISE(ABORT, 'APPROVAL_ADMISSION_ID_IMMUTABLE'); END;

CREATE TABLE pool_admissions (
  admission_id TEXT PRIMARY KEY NOT NULL CHECK (length(admission_id) BETWEEN 1 AND 128),
  approval_id TEXT NOT NULL UNIQUE REFERENCES pool_approval_ledger(approval_id),
  task_key TEXT NOT NULL UNIQUE REFERENCES pool_tasks(task_key),
  executor_id TEXT NOT NULL CHECK (length(executor_id) BETWEEN 1 AND 128 AND executor_id NOT GLOB '*[^A-Za-z0-9._:-]*'),
  attempt_id TEXT NOT NULL CHECK (length(attempt_id) BETWEEN 1 AND 128),
  attempt_number INTEGER NOT NULL CHECK (attempt_number > 0),
  qualification_id TEXT NOT NULL REFERENCES pool_route_qualifications(qualification_id),
  evidence_digest TEXT NOT NULL CHECK (length(evidence_digest) = 64),
  admitted_at INTEGER NOT NULL CHECK (admitted_at > 0),
  dispatch_enabled INTEGER NOT NULL DEFAULT 0 CHECK (dispatch_enabled = 0)
);

CREATE TRIGGER pool_admissions_executor_binding
BEFORE INSERT ON pool_admissions
WHEN NOT EXISTS (
  SELECT 1 FROM pool_approval_ledger l
  JOIN pool_tasks t ON t.task_key = l.task_key
  JOIN pool_route_qualifications q ON q.qualification_id = NEW.qualification_id
  WHERE l.approval_id = NEW.approval_id AND l.task_key = NEW.task_key
    AND l.executor_id = NEW.executor_id AND t.executor_id = NEW.executor_id
    AND l.profile = 'jarvis-code-sandbox-v1' AND q.capability_profile = l.profile
)
BEGIN SELECT RAISE(ABORT, 'ADMISSION_EXECUTOR_BINDING_INVALID'); END;

ALTER TABLE pool_task_delivery_outbox ADD COLUMN admission_id TEXT;
ALTER TABLE pool_task_delivery_outbox ADD COLUMN attempt_id TEXT;
ALTER TABLE pool_task_delivery_outbox ADD COLUMN evidence_digest TEXT;

CREATE TRIGGER pool_task_delivery_outbox_admission_binding
BEFORE UPDATE OF admission_id, attempt_id, evidence_digest ON pool_task_delivery_outbox
WHEN NOT (
  OLD.admission_id IS NULL AND OLD.attempt_id IS NULL AND OLD.evidence_digest IS NULL
  AND NEW.admission_id IS NOT NULL AND NEW.attempt_id IS NOT NULL
  AND NEW.evidence_digest IS NOT NULL
  AND EXISTS (SELECT 1 FROM pool_admissions a WHERE a.admission_id = NEW.admission_id
    AND a.task_key = NEW.task_key AND a.attempt_id = NEW.attempt_id
    AND a.evidence_digest = NEW.evidence_digest
    AND a.executor_id = (SELECT executor_id FROM pool_tasks WHERE task_key = NEW.task_key))
  AND EXISTS (SELECT 1 FROM pool_attempts p WHERE p.attempt_id = NEW.attempt_id AND p.task_key = NEW.task_key)
)
BEGIN SELECT RAISE(ABORT, 'TASK_OUTBOX_ADMISSION_BINDING_INVALID'); END;

CREATE TABLE pool_admission_commit_receipts (
  admission_id TEXT PRIMARY KEY NOT NULL REFERENCES pool_admissions(admission_id),
  approval_id TEXT NOT NULL REFERENCES pool_approval_ledger(approval_id),
  task_key TEXT NOT NULL REFERENCES pool_tasks(task_key),
  executor_id TEXT NOT NULL CHECK (length(executor_id) BETWEEN 1 AND 128 AND executor_id NOT GLOB '*[^A-Za-z0-9._:-]*'),
  attempt_id TEXT NOT NULL,
  qualification_id TEXT NOT NULL REFERENCES pool_route_qualifications(qualification_id),
  evidence_digest TEXT NOT NULL CHECK (length(evidence_digest) = 64),
  committed_at INTEGER NOT NULL CHECK (committed_at > 0),
  assertion INTEGER NOT NULL CHECK (assertion = 1),
  dispatch_enabled INTEGER NOT NULL DEFAULT 0 CHECK (dispatch_enabled = 0)
);

CREATE TRIGGER pool_admission_receipt_executor_binding
BEFORE INSERT ON pool_admission_commit_receipts
WHEN NOT EXISTS (
  SELECT 1 FROM pool_admissions a
  JOIN pool_approval_ledger l ON l.approval_id = a.approval_id
  JOIN pool_tasks t ON t.task_key = a.task_key
  WHERE a.admission_id = NEW.admission_id AND a.approval_id = NEW.approval_id
    AND a.task_key = NEW.task_key AND a.executor_id = NEW.executor_id
    AND l.executor_id = NEW.executor_id AND t.executor_id = NEW.executor_id
)
BEGIN SELECT RAISE(ABORT, 'ADMISSION_RECEIPT_EXECUTOR_BINDING_INVALID'); END;

CREATE TRIGGER pool_admissions_no_update
BEFORE UPDATE ON pool_admissions
BEGIN SELECT RAISE(ABORT, 'ADMISSIONS_APPEND_ONLY'); END;
CREATE TRIGGER pool_admissions_no_delete
BEFORE DELETE ON pool_admissions
BEGIN SELECT RAISE(ABORT, 'ADMISSIONS_APPEND_ONLY'); END;
CREATE TRIGGER pool_admission_receipts_no_update
BEFORE UPDATE ON pool_admission_commit_receipts
BEGIN SELECT RAISE(ABORT, 'ADMISSION_RECEIPTS_APPEND_ONLY'); END;
CREATE TRIGGER pool_admission_receipts_no_delete
BEFORE DELETE ON pool_admission_commit_receipts
BEGIN SELECT RAISE(ABORT, 'ADMISSION_RECEIPTS_APPEND_ONLY'); END;
