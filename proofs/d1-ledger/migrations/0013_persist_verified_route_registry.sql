-- Persist the complete verified root-signed registry payload and normalized issuer keys.
-- This is an additive local D1 proof extension. Admission must still re-check the
-- active pointer and issuer-key row in its own batch before consuming approval.

ALTER TABLE pool_route_registry_snapshots
  ADD COLUMN bundle_json TEXT NOT NULL DEFAULT '{}'
  CHECK (json_valid(bundle_json));
ALTER TABLE pool_route_registry_snapshots
  ADD COLUMN root_signature TEXT NOT NULL DEFAULT ''
  CHECK (length(root_signature) BETWEEN 0 AND 128);

ALTER TABLE pool_route_qualifications ADD COLUMN issuer_key_id TEXT;
ALTER TABLE pool_route_qualifications ADD COLUMN registry_epoch INTEGER;
ALTER TABLE pool_route_qualifications ADD COLUMN registry_bundle_digest TEXT;

CREATE TABLE pool_route_registry_issuer_keys (
  registry_epoch INTEGER NOT NULL,
  bundle_digest TEXT NOT NULL,
  issuer_id TEXT NOT NULL CHECK (length(issuer_id) BETWEEN 1 AND 160),
  key_id TEXT NOT NULL CHECK (length(key_id) BETWEEN 1 AND 160),
  registry_version TEXT NOT NULL CHECK (length(registry_version) BETWEEN 1 AND 160),
  status TEXT NOT NULL CHECK (status IN ('active', 'revoked')),
  revoked_at INTEGER,
  valid_from INTEGER NOT NULL CHECK (valid_from > 0),
  valid_until INTEGER NOT NULL CHECK (valid_until > valid_from),
  public_key_jwk TEXT NOT NULL CHECK (json_valid(public_key_jwk)),
  PRIMARY KEY (registry_epoch, issuer_id, key_id),
  FOREIGN KEY (registry_epoch, bundle_digest)
    REFERENCES pool_route_registry_snapshots(registry_epoch, bundle_digest),
  CHECK ((status = 'active' AND revoked_at IS NULL) OR
         (status = 'revoked' AND revoked_at IS NOT NULL AND revoked_at > 0))
);

CREATE TRIGGER pool_route_registry_issuer_keys_no_update
BEFORE UPDATE ON pool_route_registry_issuer_keys
BEGIN SELECT RAISE(ABORT, 'ROUTE_REGISTRY_ISSUER_KEYS_APPEND_ONLY'); END;

CREATE TRIGGER pool_route_registry_issuer_keys_no_delete
BEFORE DELETE ON pool_route_registry_issuer_keys
BEGIN SELECT RAISE(ABORT, 'ROUTE_REGISTRY_ISSUER_KEYS_APPEND_ONLY'); END;

CREATE TRIGGER pool_route_qualification_registry_binding_guard
BEFORE INSERT ON pool_route_qualifications
WHEN NEW.issuer_key_id IS NOT NULL
  OR NEW.registry_epoch IS NOT NULL
  OR NEW.registry_bundle_digest IS NOT NULL
BEGIN
  SELECT CASE WHEN NEW.issuer_key_id IS NULL
    OR NEW.registry_epoch IS NULL
    OR NEW.registry_bundle_digest IS NULL
    THEN RAISE(ABORT, 'ROUTE_QUALIFICATION_REGISTRY_BINDING_INCOMPLETE') END;
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM pool_route_registry_snapshots s
    JOIN pool_route_registry_issuer_keys k
      ON k.registry_epoch = s.registry_epoch
     AND k.bundle_digest = s.bundle_digest
   WHERE s.registry_epoch = NEW.registry_epoch
     AND s.bundle_digest = NEW.registry_bundle_digest
     AND s.registry_version = NEW.registry_version
     AND k.issuer_id = NEW.issuer_id
     AND k.key_id = NEW.issuer_key_id
     AND k.registry_version = NEW.registry_version
  ) THEN RAISE(ABORT, 'ROUTE_QUALIFICATION_REGISTRY_BINDING_INVALID') END;
END;

CREATE TRIGGER pool_route_qualification_registry_identity_immutable
BEFORE UPDATE OF issuer_key_id, registry_epoch, registry_bundle_digest
ON pool_route_qualifications
BEGIN SELECT RAISE(ABORT, 'ROUTE_QUALIFICATION_REGISTRY_IDENTITY_IMMUTABLE'); END;
