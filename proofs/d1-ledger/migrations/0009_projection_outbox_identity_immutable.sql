-- Outbox identity is the immutable source for projection receipts.
-- Delivery state/lease columns remain mutable through fenced adapters.
CREATE TRIGGER pool_attempt_projection_identity_immutable
BEFORE UPDATE OF
  outbox_id, task_key, attempt_id, repository_id, issue_number,
  target_sha, profile, lease_generation, terminal_status, event_digest
ON pool_attempt_projection_outbox
WHEN NEW.outbox_id IS NOT OLD.outbox_id
  OR NEW.task_key IS NOT OLD.task_key
  OR NEW.attempt_id IS NOT OLD.attempt_id
  OR NEW.repository_id IS NOT OLD.repository_id
  OR NEW.issue_number IS NOT OLD.issue_number
  OR NEW.target_sha IS NOT OLD.target_sha
  OR NEW.profile IS NOT OLD.profile
  OR NEW.lease_generation IS NOT OLD.lease_generation
  OR NEW.terminal_status IS NOT OLD.terminal_status
  OR NEW.event_digest IS NOT OLD.event_digest
BEGIN
  SELECT RAISE(ABORT, 'PROJECTION_EVENT_IDENTITY_IMMUTABLE');
END;
