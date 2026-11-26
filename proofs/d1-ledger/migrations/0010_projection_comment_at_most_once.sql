-- Durable at-most-once comment POST gate for local projection proof.
-- Once an external POST may have been attempted, retries are reconciliation-only.
ALTER TABLE pool_attempt_projection_outbox
  ADD COLUMN comment_post_state TEXT NOT NULL DEFAULT 'not_attempted'
  CHECK (comment_post_state IN ('not_attempted', 'indeterminate', 'verified'));
ALTER TABLE pool_attempt_projection_outbox
  ADD COLUMN comment_post_attempted_at INTEGER;
ALTER TABLE pool_attempt_projection_outbox
  ADD COLUMN comment_post_attempt_generation INTEGER;

CREATE TABLE pool_attempt_projection_comment_events (
  comment_event_id TEXT PRIMARY KEY NOT NULL,
  outbox_id TEXT NOT NULL REFERENCES pool_attempt_projection_outbox(outbox_id),
  event_type TEXT NOT NULL CHECK (event_type IN ('post_reserved', 'marker_verified')),
  delivery_generation INTEGER NOT NULL CHECK (delivery_generation > 0),
  post_attempt_generation INTEGER,
  actor_id TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX pool_attempt_projection_comment_events_by_outbox
  ON pool_attempt_projection_comment_events(outbox_id, created_at);

CREATE TRIGGER pool_attempt_projection_comment_state_guard
BEFORE UPDATE OF comment_post_state ON pool_attempt_projection_outbox
WHEN NEW.comment_post_state <> OLD.comment_post_state
BEGIN
  SELECT CASE WHEN NOT (
    (OLD.comment_post_state = 'not_attempted' AND
      NEW.comment_post_state IN ('indeterminate', 'verified')) OR
    (OLD.comment_post_state = 'indeterminate' AND
      NEW.comment_post_state = 'verified')
  ) THEN RAISE(ABORT, 'PROJECTION_COMMENT_STATE_TRANSITION_INVALID') END;

  SELECT CASE WHEN
    NEW.status <> 'leased' OR NEW.lease_owner IS NULL OR
    NEW.lease_expires_at IS NULL OR NEW.lease_expires_at <= NEW.updated_at OR
    NEW.lease_generation_delivery < 1
  THEN RAISE(ABORT, 'PROJECTION_COMMENT_STATE_REQUIRES_ACTIVE_LEASE') END;

  SELECT CASE WHEN NEW.comment_post_state = 'indeterminate' AND (
    OLD.comment_post_state <> 'not_attempted' OR
    NEW.comment_post_attempted_at IS NULL OR
    NEW.comment_post_attempted_at <= 0 OR
    NEW.comment_post_attempt_generation <> NEW.lease_generation_delivery
  ) THEN RAISE(ABORT, 'PROJECTION_COMMENT_POST_RESERVATION_INVALID') END;

  SELECT CASE WHEN NEW.comment_post_state = 'verified' AND
    OLD.comment_post_state = 'indeterminate' AND (
      NEW.comment_post_attempted_at IS NOT OLD.comment_post_attempted_at OR
      NEW.comment_post_attempt_generation IS NOT OLD.comment_post_attempt_generation
    )
  THEN RAISE(ABORT, 'PROJECTION_COMMENT_POST_EVIDENCE_IMMUTABLE') END;

  SELECT CASE WHEN NEW.comment_post_state = 'verified' AND
    OLD.comment_post_state = 'not_attempted' AND (
      NEW.comment_post_attempted_at IS NOT NULL OR
      NEW.comment_post_attempt_generation IS NOT NULL
    )
  THEN RAISE(ABORT, 'PROJECTION_COMMENT_EXTERNAL_MARKER_EVIDENCE_INVALID') END;
END;

CREATE TRIGGER pool_attempt_projection_comment_state_event
AFTER UPDATE OF comment_post_state ON pool_attempt_projection_outbox
WHEN NEW.comment_post_state <> OLD.comment_post_state
BEGIN
  INSERT INTO pool_attempt_projection_comment_events (
    comment_event_id, outbox_id, event_type, delivery_generation,
    post_attempt_generation, actor_id, created_at
  ) VALUES (
    CASE NEW.comment_post_state
      WHEN 'indeterminate' THEN 'comment-post-reserved:' || NEW.outbox_id
      ELSE 'comment-marker-verified:' || NEW.outbox_id
    END,
    NEW.outbox_id,
    CASE NEW.comment_post_state
      WHEN 'indeterminate' THEN 'post_reserved'
      ELSE 'marker_verified'
    END,
    NEW.lease_generation_delivery,
    NEW.comment_post_attempt_generation,
    NEW.lease_owner,
    NEW.updated_at
  );
END;

CREATE TRIGGER pool_attempt_projection_comment_events_no_update
BEFORE UPDATE ON pool_attempt_projection_comment_events
BEGIN SELECT RAISE(ABORT, 'PROJECTION_COMMENT_EVENTS_APPEND_ONLY'); END;

CREATE TRIGGER pool_attempt_projection_comment_events_no_delete
BEFORE DELETE ON pool_attempt_projection_comment_events
BEGIN SELECT RAISE(ABORT, 'PROJECTION_COMMENT_EVENTS_APPEND_ONLY'); END;

-- A verified ACK cannot precede durable marker verification.
CREATE TRIGGER pool_attempt_projection_ack_requires_comment_verified
BEFORE UPDATE OF status ON pool_attempt_projection_outbox
WHEN NEW.status = 'delivered' AND NEW.comment_post_state <> 'verified'
BEGIN SELECT RAISE(ABORT, 'PROJECTION_COMMENT_MARKER_NOT_VERIFIED'); END;
