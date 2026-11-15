-- Admission-time trust assertion. Its guard executes inside the same D1 batch
-- as approval consumption, task/outbox binding, attempt creation and receipt.
-- The registry writer is the only intended producer of snapshot/key/route rows.

CREATE TABLE pool_admission_registry_assertions (
  admission_id TEXT PRIMARY KEY NOT NULL
    CHECK (length(admission_id) BETWEEN 1 AND 160),
  qualification_id TEXT NOT NULL
    REFERENCES pool_route_qualifications(qualification_id),
  issuer_id TEXT NOT NULL CHECK (length(issuer_id) BETWEEN 1 AND 160),
  issuer_key_id TEXT NOT NULL CHECK (length(issuer_key_id) BETWEEN 1 AND 160),
  registry_epoch INTEGER NOT NULL CHECK (registry_epoch > 0),
  registry_bundle_digest TEXT NOT NULL
    CHECK (length(registry_bundle_digest) = 64 AND registry_bundle_digest NOT GLOB '*[^0-9a-f]*'),
  registry_version TEXT NOT NULL CHECK (length(registry_version) BETWEEN 1 AND 160),
  evidence_digest TEXT NOT NULL
    CHECK (length(evidence_digest) = 64 AND evidence_digest NOT GLOB '*[^0-9a-f]*'),
  checked_at INTEGER NOT NULL CHECK (checked_at > 0)
);

CREATE TRIGGER pool_admission_registry_assertion_guard
BEFORE INSERT ON pool_admission_registry_assertions
WHEN NOT EXISTS (
  SELECT 1
    FROM pool_route_qualifications q
    JOIN pool_route_registry_state s
      ON s.state_id = 1
    JOIN pool_route_registry_snapshots rs
      ON rs.registry_epoch = s.current_epoch
     AND rs.bundle_digest = s.current_bundle_digest
     AND rs.registry_version = s.current_registry_version
    JOIN pool_route_registry_issuer_keys k
      ON k.registry_epoch = rs.registry_epoch
     AND k.bundle_digest = rs.bundle_digest
   WHERE q.qualification_id = NEW.qualification_id
     AND q.issuer_id = NEW.issuer_id
     AND q.issuer_key_id = NEW.issuer_key_id
     AND q.registry_epoch = NEW.registry_epoch
     AND q.registry_bundle_digest = NEW.registry_bundle_digest
     AND q.registry_version = NEW.registry_version
     AND q.evidence_digest = NEW.evidence_digest
     AND q.qualification_status = 'qualified'
     AND q.revoked_at IS NULL
     AND q.observed_at <= NEW.checked_at
     AND q.observed_at >= NEW.checked_at - 300
     AND q.valid_until > NEW.checked_at
     AND s.current_epoch = NEW.registry_epoch
     AND s.current_bundle_digest = NEW.registry_bundle_digest
     AND rs.accepted_at <= NEW.checked_at
     AND rs.valid_until > NEW.checked_at
     AND k.issuer_id = NEW.issuer_id
     AND k.key_id = NEW.issuer_key_id
     AND k.registry_version = NEW.registry_version
     AND k.status = 'active'
     AND k.revoked_at IS NULL
     AND k.valid_from <= NEW.checked_at
     AND k.valid_until > NEW.checked_at
)
BEGIN
  SELECT RAISE(ABORT, 'ADMISSION_TRUSTED_REGISTRY_ASSERTION_FAILED');
END;

CREATE TRIGGER pool_admission_registry_assertions_no_update
BEFORE UPDATE ON pool_admission_registry_assertions
BEGIN SELECT RAISE(ABORT, 'ADMISSION_REGISTRY_ASSERTION_IMMUTABLE'); END;

CREATE TRIGGER pool_admission_registry_assertions_no_delete
BEFORE DELETE ON pool_admission_registry_assertions
BEGIN SELECT RAISE(ABORT, 'ADMISSION_REGISTRY_ASSERTION_APPEND_ONLY'); END;
