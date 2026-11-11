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
