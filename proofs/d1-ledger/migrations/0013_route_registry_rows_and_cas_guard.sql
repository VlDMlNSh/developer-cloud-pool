-- Durable, verifier-backed route registry rows and a database-enforced CAS gate.
-- The caller must execute CAS assertion, snapshot/child inserts and watermark
-- movement in one D1 batch. A failed assertion raises SQLITE_CONSTRAINT and
-- therefore rolls the batch back; the Workers-runtime proof verifies this.
CREATE TABLE pool_route_registry_cas_guard (
  assertion INTEGER PRIMARY KEY NOT NULL CHECK (assertion = 1)
);

CREATE TABLE pool_route_registry_issuer_keys (
  registry_epoch INTEGER NOT NULL,
  issuer_id TEXT NOT NULL CHECK (length(issuer_id) BETWEEN 1 AND 160),
  key_id TEXT NOT NULL CHECK (length(key_id) BETWEEN 1 AND 160),
  registry_version TEXT NOT NULL CHECK (length(registry_version) BETWEEN 1 AND 160),
  status TEXT NOT NULL CHECK (status IN ('active', 'revoked')),
  revoked_at INTEGER,
  valid_from INTEGER NOT NULL CHECK (valid_from > 0),
  valid_until INTEGER NOT NULL CHECK (valid_until > valid_from),
  public_key_jwk_json TEXT NOT NULL CHECK (length(public_key_jwk_json) BETWEEN 2 AND 2048),
  PRIMARY KEY (registry_epoch, issuer_id, key_id),
  FOREIGN KEY (registry_epoch) REFERENCES pool_route_registry_snapshots(registry_epoch)
);

CREATE TABLE pool_route_registry_routes (
  registry_epoch INTEGER NOT NULL,
  qualification_id TEXT NOT NULL CHECK (length(qualification_id) BETWEEN 1 AND 160),
  route_id TEXT NOT NULL CHECK (length(route_id) BETWEEN 1 AND 160),
  issuer_id TEXT NOT NULL,
  key_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  model_id TEXT NOT NULL,
  account_ref TEXT NOT NULL,
  credential_handle_ref TEXT NOT NULL,
  quota_domain_id TEXT NOT NULL,
  cost_class TEXT NOT NULL,
  capability_id TEXT NOT NULL,
  capability_profile TEXT NOT NULL,
  evidence_digest TEXT NOT NULL CHECK (length(evidence_digest) = 64 AND evidence_digest NOT GLOB '*[^0-9a-f]*'),
  observed_at INTEGER NOT NULL CHECK (observed_at > 0),
  valid_until INTEGER NOT NULL CHECK (valid_until > observed_at),
  revocation_version INTEGER NOT NULL CHECK (revocation_version >= 0),
  status TEXT NOT NULL CHECK (status = 'qualified'),
  evidence_json TEXT NOT NULL,
  issuer_signature TEXT NOT NULL,
  PRIMARY KEY (registry_epoch, qualification_id),
  FOREIGN KEY (registry_epoch, issuer_id, key_id)
    REFERENCES pool_route_registry_issuer_keys(registry_epoch, issuer_id, key_id)
);

CREATE TRIGGER pool_route_registry_issuer_no_update
BEFORE UPDATE ON pool_route_registry_issuer_keys
BEGIN
  SELECT RAISE(ABORT, 'ROUTE_REGISTRY_ISSUER_APPEND_ONLY');
END;
CREATE TRIGGER pool_route_registry_issuer_no_delete
BEFORE DELETE ON pool_route_registry_issuer_keys
BEGIN
  SELECT RAISE(ABORT, 'ROUTE_REGISTRY_ISSUER_APPEND_ONLY');
END;
CREATE TRIGGER pool_route_registry_route_no_update
BEFORE UPDATE ON pool_route_registry_routes
BEGIN
  SELECT RAISE(ABORT, 'ROUTE_REGISTRY_ROUTE_APPEND_ONLY');
END;
CREATE TRIGGER pool_route_registry_route_no_delete
BEFORE DELETE ON pool_route_registry_routes
BEGIN
  SELECT RAISE(ABORT, 'ROUTE_REGISTRY_ROUTE_APPEND_ONLY');
END;

-- Child rows may only be appended while their snapshot is newer than the
-- active watermark. This prevents late mutation-by-insertion after acceptance.
CREATE TRIGGER pool_route_registry_issuer_insert_before_acceptance
BEFORE INSERT ON pool_route_registry_issuer_keys
WHEN EXISTS (
  SELECT 1 FROM pool_route_registry_state
   WHERE current_epoch >= NEW.registry_epoch
)
BEGIN
  SELECT RAISE(ABORT, 'ROUTE_REGISTRY_ISSUER_SNAPSHOT_ALREADY_ACCEPTED');
END;
CREATE TRIGGER pool_route_registry_route_insert_before_acceptance
BEFORE INSERT ON pool_route_registry_routes
WHEN EXISTS (
  SELECT 1 FROM pool_route_registry_state
   WHERE current_epoch >= NEW.registry_epoch
)
BEGIN
  SELECT RAISE(ABORT, 'ROUTE_REGISTRY_ROUTE_SNAPSHOT_ALREADY_ACCEPTED');
END;
