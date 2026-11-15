-- Durable root-signed route registry snapshot ledger.
-- This migration adds persistence primitives only. It does not make registry
-- acceptance authoritative until the typed verifier adapter and admission CAS
-- are wired in a subsequent change.

CREATE TABLE pool_route_registry_snapshots (
  registry_epoch INTEGER PRIMARY KEY NOT NULL CHECK (registry_epoch > 0),
  registry_version TEXT NOT NULL CHECK (length(registry_version) BETWEEN 1 AND 160),
  root_key_id TEXT NOT NULL CHECK (length(root_key_id) BETWEEN 1 AND 160),
  bundle_digest TEXT NOT NULL UNIQUE
    CHECK (length(bundle_digest) = 64 AND bundle_digest NOT GLOB '*[^0-9a-f]*'),
  issued_at INTEGER NOT NULL CHECK (issued_at > 0),
  valid_until INTEGER NOT NULL CHECK (valid_until > issued_at),
  accepted_at INTEGER NOT NULL CHECK (accepted_at >= issued_at AND accepted_at < valid_until),
  issuer_key_count INTEGER NOT NULL CHECK (issuer_key_count BETWEEN 1 AND 64),
  route_count INTEGER NOT NULL CHECK (route_count BETWEEN 1 AND 256),
  UNIQUE (registry_epoch, bundle_digest)
);

CREATE TABLE pool_route_registry_state (
  state_id INTEGER PRIMARY KEY NOT NULL CHECK (state_id = 1),
  current_epoch INTEGER NOT NULL,
  current_bundle_digest TEXT NOT NULL,
  current_registry_version TEXT NOT NULL,
  updated_at INTEGER NOT NULL CHECK (updated_at > 0),
  FOREIGN KEY (current_epoch, current_bundle_digest)
    REFERENCES pool_route_registry_snapshots(registry_epoch, bundle_digest)
);

-- Compare against the highest persisted epoch, not only the active pointer.
-- Otherwise a future snapshot can be inserted first and a lower, unseen epoch
-- can still be appended while the singleton pointer remains unchanged.
CREATE TRIGGER pool_route_registry_snapshot_epoch_monotonic
BEFORE INSERT ON pool_route_registry_snapshots
WHEN NEW.registry_epoch <= COALESCE(
  (SELECT MAX(registry_epoch) FROM pool_route_registry_snapshots),
  0
)
BEGIN
  SELECT RAISE(ABORT, 'ROUTE_REGISTRY_EPOCH_NOT_MONOTONIC');
END;

CREATE TRIGGER pool_route_registry_snapshot_no_update
BEFORE UPDATE ON pool_route_registry_snapshots
BEGIN
  SELECT RAISE(ABORT, 'ROUTE_REGISTRY_SNAPSHOT_APPEND_ONLY');
END;

CREATE TRIGGER pool_route_registry_snapshot_no_delete
BEFORE DELETE ON pool_route_registry_snapshots
BEGIN
  SELECT RAISE(ABORT, 'ROUTE_REGISTRY_SNAPSHOT_APPEND_ONLY');
END;

CREATE TRIGGER pool_route_registry_state_insert_guard
BEFORE INSERT ON pool_route_registry_state
WHEN NEW.state_id <> 1 OR NOT EXISTS (
  SELECT 1 FROM pool_route_registry_snapshots s
   WHERE s.registry_epoch = NEW.current_epoch
     AND s.bundle_digest = NEW.current_bundle_digest
     AND s.registry_version = NEW.current_registry_version
     AND s.accepted_at = NEW.updated_at
)
BEGIN
  SELECT RAISE(ABORT, 'ROUTE_REGISTRY_INITIAL_STATE_UNBOUND');
END;

CREATE TRIGGER pool_route_registry_state_update_guard
BEFORE UPDATE ON pool_route_registry_state
WHEN OLD.state_id <> 1
  OR NEW.state_id <> OLD.state_id
  OR NEW.current_epoch <= OLD.current_epoch
  OR NEW.updated_at <= OLD.updated_at
  OR NOT EXISTS (
    SELECT 1 FROM pool_route_registry_snapshots s
     WHERE s.registry_epoch = NEW.current_epoch
       AND s.bundle_digest = NEW.current_bundle_digest
       AND s.registry_version = NEW.current_registry_version
       AND s.accepted_at = NEW.updated_at
  )
BEGIN
  SELECT RAISE(ABORT, 'ROUTE_REGISTRY_STATE_ADVANCE_INVALID');
END;

CREATE TRIGGER pool_route_registry_state_no_delete
BEFORE DELETE ON pool_route_registry_state
BEGIN
  SELECT RAISE(ABORT, 'ROUTE_REGISTRY_STATE_CANNOT_RESET');
END;
