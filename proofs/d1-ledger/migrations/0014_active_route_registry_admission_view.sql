-- Flatten the current-root-registry trust join into one reusable read model.
-- This avoids deeply nested correlated EXISTS expressions in the A0 admission
-- statement while preserving checks against the live singleton pointer and
-- issuer-key lifecycle. The view is read-only and does not grant admission.
CREATE VIEW pool_active_route_qualifications AS
SELECT
  q.*,
  s.current_epoch AS active_registry_epoch,
  s.current_bundle_digest AS active_registry_bundle_digest,
  s.current_registry_version AS active_registry_version,
  rs.accepted_at AS registry_accepted_at,
  rs.valid_until AS registry_valid_until,
  k.status AS registry_issuer_status,
  k.revoked_at AS registry_issuer_revoked_at,
  k.valid_from AS registry_issuer_valid_from,
  k.valid_until AS registry_issuer_valid_until
FROM pool_route_qualifications q
JOIN pool_route_registry_state s
  ON s.state_id = 1
 AND s.current_epoch = q.registry_epoch
 AND s.current_bundle_digest = q.registry_bundle_digest
 AND s.current_registry_version = q.registry_version
JOIN pool_route_registry_snapshots rs
  ON rs.registry_epoch = s.current_epoch
 AND rs.bundle_digest = s.current_bundle_digest
 AND rs.registry_version = s.current_registry_version
JOIN pool_route_registry_issuer_keys k
  ON k.registry_epoch = rs.registry_epoch
 AND k.bundle_digest = rs.bundle_digest
 AND k.issuer_id = q.issuer_id
 AND k.key_id = q.issuer_key_id
 AND k.registry_version = q.registry_version
WHERE q.qualification_status = 'qualified'
  AND q.revoked_at IS NULL
  AND k.status = 'active'
  AND k.revoked_at IS NULL;
