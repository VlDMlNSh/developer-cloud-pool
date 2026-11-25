-- Bounded terminal-projection retries and durable dead-letter evidence.
-- Local proof migration only; it does not authorize live GitHub writes or dispatch.
ALTER TABLE pool_attempt_projection_outbox
  ADD COLUMN retry_after_at INTEGER NOT NULL DEFAULT 0;
ALTER TABLE pool_attempt_projection_outbox
  ADD COLUMN last_error_code TEXT;
ALTER TABLE pool_attempt_projection_outbox
  ADD COLUMN dead_lettered_at INTEGER;
ALTER TABLE pool_attempt_projection_outbox
  ADD COLUMN dead_letter_reason TEXT;

ALTER TABLE pool_attempt_projection_events
  ADD COLUMN reason_code TEXT;

DROP TRIGGER pool_attempt_projection_status_event;
CREATE TRIGGER pool_attempt_projection_status_event
AFTER UPDATE OF status ON pool_attempt_projection_outbox
WHEN NEW.status <> OLD.status AND NEW.status <> 'leased'
BEGIN
  INSERT INTO pool_attempt_projection_events (
    delivery_event_id, outbox_id, event_type, lease_generation,
    actor_id, created_at, reason_code
  ) VALUES (
    'delivery-' || NEW.status || ':' || NEW.outbox_id || ':' || NEW.lease_generation_delivery,
    NEW.outbox_id,
    CASE NEW.status
      WHEN 'retryable' THEN 'delivery.retryable'
      WHEN 'delivered' THEN 'delivery.delivered'
      WHEN 'dead_letter' THEN 'delivery.dead_letter'
      ELSE 'delivery.leased'
    END,
    NEW.lease_generation_delivery,
    COALESCE(NEW.lease_owner, OLD.lease_owner),
    NEW.updated_at,
    NEW.last_error_code
  );
END;

CREATE INDEX pool_attempt_projection_retry_due
  ON pool_attempt_projection_outbox(status, retry_after_at, created_at);

-- Database-level guardrails make dead-letter terminal even if a caller bypasses
-- the adapter. No silent requeue or attempt-budget inflation is permitted.
CREATE TRIGGER pool_attempt_projection_attempt_budget_guard
BEFORE UPDATE OF delivery_attempts ON pool_attempt_projection_outbox
WHEN NEW.delivery_attempts > 5
BEGIN SELECT RAISE(ABORT, 'PROJECTION_DELIVERY_ATTEMPT_LIMIT'); END;

CREATE TRIGGER pool_attempt_projection_dead_letter_budget_guard
BEFORE UPDATE OF status ON pool_attempt_projection_outbox
WHEN NEW.status = 'dead_letter' AND (
  NEW.delivery_attempts < 5 OR NEW.dead_lettered_at IS NULL OR
  NEW.dead_letter_reason IS NULL OR NEW.lease_owner IS NOT NULL OR
  NEW.lease_expires_at IS NOT NULL
)
BEGIN SELECT RAISE(ABORT, 'PROJECTION_DEAD_LETTER_EVIDENCE_REQUIRED'); END;

CREATE TRIGGER pool_attempt_projection_dead_letter_terminal
BEFORE UPDATE ON pool_attempt_projection_outbox
WHEN OLD.status = 'dead_letter'
BEGIN SELECT RAISE(ABORT, 'PROJECTION_DEAD_LETTER_TERMINAL'); END;
