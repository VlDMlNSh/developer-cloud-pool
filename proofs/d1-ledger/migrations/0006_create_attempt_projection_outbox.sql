-- Local-only proof: terminal attempt audit and GitHub projection intent share one D1 transaction.
CREATE TABLE pool_attempt_projection_outbox (
  outbox_id TEXT PRIMARY KEY NOT NULL,
  task_key TEXT NOT NULL REFERENCES pool_tasks(task_key),
  attempt_id TEXT NOT NULL UNIQUE REFERENCES pool_attempts(attempt_id),
  repository_id TEXT NOT NULL,
  issue_number INTEGER NOT NULL CHECK (issue_number > 0),
  target_sha TEXT NOT NULL CHECK (length(target_sha) = 40),
  profile TEXT NOT NULL,
  lease_generation INTEGER NOT NULL CHECK (lease_generation > 0),
  terminal_status TEXT NOT NULL CHECK (terminal_status IN ('succeeded', 'failed', 'abandoned')),
  event_digest TEXT NOT NULL CHECK (length(event_digest) = 64),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'leased', 'retryable', 'delivered', 'dead_letter')),
  lease_owner TEXT,
  lease_generation_delivery INTEGER NOT NULL DEFAULT 0 CHECK (lease_generation_delivery >= 0),
  lease_expires_at INTEGER,
  delivery_attempts INTEGER NOT NULL DEFAULT 0 CHECK (delivery_attempts >= 0),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  delivered_at INTEGER,
  CHECK (
    (status = 'leased' AND lease_owner IS NOT NULL AND lease_expires_at IS NOT NULL) OR
    (status <> 'leased' AND lease_owner IS NULL AND lease_expires_at IS NULL)
  ),
  CHECK ((status = 'delivered' AND delivered_at IS NOT NULL) OR status <> 'delivered')
);

CREATE INDEX pool_attempt_projection_pending
  ON pool_attempt_projection_outbox(status, created_at);

CREATE TABLE pool_attempt_projection_events (
  delivery_event_id TEXT PRIMARY KEY NOT NULL,
  outbox_id TEXT NOT NULL REFERENCES pool_attempt_projection_outbox(outbox_id),
  event_type TEXT NOT NULL CHECK (event_type IN ('delivery.leased', 'delivery.retryable', 'delivery.delivered', 'delivery.dead_letter')),
  lease_generation INTEGER NOT NULL CHECK (lease_generation >= 0),
  actor_id TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX pool_attempt_projection_events_by_outbox
  ON pool_attempt_projection_events(outbox_id, created_at);

CREATE TRIGGER pool_attempt_finalized_creates_projection_outbox
AFTER INSERT ON pool_attempt_events
WHEN NEW.event_type = 'attempt.finalized'
BEGIN
  INSERT INTO pool_attempt_projection_outbox (
    outbox_id, task_key, attempt_id, repository_id, issue_number, target_sha,
    profile, lease_generation, terminal_status, event_digest, status, created_at
  )
  SELECT
    NEW.event_id, NEW.task_key, NEW.attempt_id, t.repository_id, t.issue_number,
    t.target_sha, t.profile, NEW.lease_generation, a.status, NEW.event_digest,
    'pending', NEW.created_at, NEW.created_at
  FROM pool_tasks t
  JOIN pool_attempts a ON a.attempt_id = NEW.attempt_id AND a.task_key = NEW.task_key
  WHERE t.task_key = NEW.task_key;
END;

CREATE TRIGGER pool_attempt_projection_lease_event
AFTER UPDATE OF lease_generation_delivery ON pool_attempt_projection_outbox
WHEN NEW.lease_generation_delivery > OLD.lease_generation_delivery
BEGIN
  INSERT INTO pool_attempt_projection_events (
    delivery_event_id, outbox_id, event_type, lease_generation, actor_id, created_at
  ) VALUES (
    'delivery-leased:' || NEW.outbox_id || ':' || NEW.lease_generation_delivery,
    NEW.outbox_id, 'delivery.leased', NEW.lease_generation_delivery,
    NEW.lease_owner, NEW.updated_at
  );
END;

CREATE TRIGGER pool_attempt_projection_status_event
AFTER UPDATE OF status ON pool_attempt_projection_outbox
WHEN NEW.status <> OLD.status AND NEW.status <> 'leased'
BEGIN
  INSERT INTO pool_attempt_projection_events (
    delivery_event_id, outbox_id, event_type, lease_generation, actor_id, created_at
  ) VALUES (
    'delivery-' || NEW.status || ':' || NEW.outbox_id || ':' || NEW.lease_generation_delivery,
    NEW.outbox_id,
    CASE NEW.status
      WHEN 'retryable' THEN 'delivery.retryable'
      WHEN 'delivered' THEN 'delivery.delivered'
      WHEN 'dead_letter' THEN 'delivery.dead_letter'
      ELSE 'delivery.leased'
    END,
    NEW.lease_generation_delivery, NEW.lease_owner, NEW.updated_at
  );
END;

CREATE TRIGGER pool_attempt_projection_events_no_update
BEFORE UPDATE ON pool_attempt_projection_events
BEGIN SELECT RAISE(ABORT, 'PROJECTION_EVENTS_APPEND_ONLY'); END;

CREATE TRIGGER pool_attempt_projection_events_no_delete
BEFORE DELETE ON pool_attempt_projection_events
BEGIN SELECT RAISE(ABORT, 'PROJECTION_EVENTS_APPEND_ONLY'); END;
