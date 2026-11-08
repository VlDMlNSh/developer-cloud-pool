ALTER TABLE pool_tasks ADD COLUMN current_attempt_id TEXT;
ALTER TABLE pool_tasks ADD COLUMN attempt_number INTEGER NOT NULL DEFAULT 0 CHECK (attempt_number >= 0);
ALTER TABLE pool_tasks ADD COLUMN lease_attempt_id TEXT;

CREATE TABLE pool_attempts (
  attempt_id TEXT PRIMARY KEY NOT NULL CHECK (length(attempt_id) BETWEEN 1 AND 128),
  task_key TEXT NOT NULL REFERENCES pool_tasks(task_key),
  attempt_number INTEGER NOT NULL CHECK (attempt_number > 0),
  status TEXT NOT NULL DEFAULT 'prepared'
    CHECK (status IN ('prepared', 'running', 'indeterminate', 'succeeded', 'failed', 'abandoned')),
  input_digest TEXT NOT NULL CHECK (length(input_digest) = 64),
  execution_idempotency_key TEXT NOT NULL UNIQUE CHECK (length(execution_idempotency_key) BETWEEN 1 AND 160),
  lease_generation INTEGER NOT NULL DEFAULT 0 CHECK (lease_generation >= 0),
  terminal_reason TEXT,
  result_digest TEXT CHECK (result_digest IS NULL OR length(result_digest) = 64),
  provenance_digest TEXT CHECK (provenance_digest IS NULL OR length(provenance_digest) = 64),
  created_at INTEGER NOT NULL,
  started_at INTEGER,
  completed_at INTEGER,
  indeterminate_at INTEGER,
  UNIQUE (task_key, attempt_number),
  CHECK (
    (status IN ('succeeded', 'failed', 'abandoned') AND completed_at IS NOT NULL) OR
    (status NOT IN ('succeeded', 'failed', 'abandoned') AND completed_at IS NULL)
  ),
  CHECK ((status = 'indeterminate' AND indeterminate_at IS NOT NULL) OR status <> 'indeterminate')
);

CREATE TABLE pool_attempt_events (
  event_id TEXT PRIMARY KEY NOT NULL,
  task_key TEXT NOT NULL REFERENCES pool_tasks(task_key),
  attempt_id TEXT NOT NULL REFERENCES pool_attempts(attempt_id),
  event_type TEXT NOT NULL CHECK (event_type IN ('attempt.created', 'lease.acquired', 'attempt.indeterminate', 'attempt.finalized')),
  event_digest TEXT NOT NULL CHECK (length(event_digest) = 64),
  created_at INTEGER NOT NULL
);

CREATE INDEX pool_attempts_by_task ON pool_attempts(task_key, attempt_number);
CREATE INDEX pool_attempt_events_by_task ON pool_attempt_events(task_key, created_at);

CREATE TRIGGER pool_attempts_validate_insert
BEFORE INSERT ON pool_attempts
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM pool_tasks t
     WHERE t.task_key = NEW.task_key
       AND t.state = 'pending'
       AND NEW.attempt_number = t.attempt_number + 1
       AND (
         t.current_attempt_id IS NULL OR EXISTS (
           SELECT 1 FROM pool_attempts prior
            WHERE prior.attempt_id = t.current_attempt_id
              AND prior.status IN ('failed', 'abandoned')
         )
       )
  ) THEN RAISE(ABORT, 'ATTEMPT_NOT_ALLOWED') END;
END;

CREATE TRIGGER pool_attempts_after_insert
AFTER INSERT ON pool_attempts
BEGIN
  UPDATE pool_tasks
     SET current_attempt_id = NEW.attempt_id,
         attempt_number = NEW.attempt_number,
         updated_at = NEW.created_at
   WHERE task_key = NEW.task_key;

  INSERT INTO pool_attempt_events(event_id, task_key, attempt_id, event_type, event_digest, created_at)
  VALUES (
    'attempt-created:' || NEW.attempt_id, NEW.task_key, NEW.attempt_id,
    'attempt.created', NEW.input_digest, NEW.created_at
  );
END;

CREATE TRIGGER pool_attempts_immutable_identity
BEFORE UPDATE OF attempt_id, task_key, attempt_number, input_digest, execution_idempotency_key, created_at
ON pool_attempts
BEGIN
  SELECT RAISE(ABORT, 'ATTEMPT_IDENTITY_IMMUTABLE');
END;

CREATE TRIGGER pool_attempts_valid_status_transition
BEFORE UPDATE OF status ON pool_attempts
WHEN NOT (
  (OLD.status = 'prepared' AND NEW.status IN ('running', 'failed', 'indeterminate')) OR
  (OLD.status = 'running' AND NEW.status IN ('indeterminate', 'succeeded', 'failed', 'abandoned')) OR
  (OLD.status = 'indeterminate' AND NEW.status IN ('succeeded', 'failed', 'abandoned'))
)
BEGIN
  SELECT RAISE(ABORT, 'INVALID_ATTEMPT_STATUS_TRANSITION');
END;

CREATE TRIGGER pool_tasks_attempt_lease_acquired
AFTER UPDATE OF lease_generation ON pool_tasks
WHEN NEW.state = 'leased'
 AND NEW.current_attempt_id IS NOT NULL
 AND NEW.lease_attempt_id = NEW.current_attempt_id
 AND NEW.lease_generation > OLD.lease_generation
BEGIN
  UPDATE pool_attempts
     SET status = CASE WHEN status = 'prepared' THEN 'running' ELSE status END,
         started_at = COALESCE(started_at, NEW.updated_at),
         lease_generation = NEW.lease_generation
   WHERE attempt_id = NEW.current_attempt_id
     AND task_key = NEW.task_key
     AND status IN ('prepared', 'running');

  INSERT INTO pool_attempt_events(event_id, task_key, attempt_id, event_type, event_digest, created_at)
  SELECT
    'lease-acquired:' || NEW.current_attempt_id || ':' || NEW.lease_generation,
    NEW.task_key, NEW.current_attempt_id, 'lease.acquired',
    (SELECT input_digest FROM pool_attempts WHERE attempt_id = NEW.current_attempt_id), NEW.updated_at
  WHERE EXISTS (
    SELECT 1 FROM pool_attempts
     WHERE attempt_id = NEW.current_attempt_id
       AND task_key = NEW.task_key
       AND lease_generation = NEW.lease_generation
  );
END;

CREATE TRIGGER pool_attempts_terminal_projection
AFTER UPDATE OF status ON pool_attempts
WHEN NEW.status IN ('succeeded', 'failed', 'abandoned')
 AND OLD.status <> NEW.status
BEGIN
  UPDATE pool_tasks
     SET state = CASE WHEN NEW.status = 'succeeded' THEN 'completed' ELSE 'pending' END,
         lease_owner = NULL,
         lease_expires_at = NULL,
         lease_attempt_id = NULL,
         updated_at = NEW.completed_at
   WHERE task_key = NEW.task_key
     AND current_attempt_id = NEW.attempt_id;

  INSERT INTO pool_attempt_events(event_id, task_key, attempt_id, event_type, event_digest, created_at)
  VALUES (
    'attempt-finalized:' || NEW.attempt_id, NEW.task_key, NEW.attempt_id,
    'attempt.finalized',
    COALESCE(NEW.result_digest, NEW.provenance_digest, NEW.input_digest),
    NEW.completed_at
  );
END;

CREATE TRIGGER pool_attempt_events_no_update
BEFORE UPDATE ON pool_attempt_events
BEGIN
  SELECT RAISE(ABORT, 'ATTEMPT_EVENTS_APPEND_ONLY');
END;

CREATE TRIGGER pool_attempt_events_no_delete
BEFORE DELETE ON pool_attempt_events
BEGIN
  SELECT RAISE(ABORT, 'ATTEMPT_EVENTS_APPEND_ONLY');
END;

CREATE TRIGGER pool_attempts_indeterminate_event
AFTER UPDATE OF status ON pool_attempts
WHEN NEW.status = 'indeterminate' AND OLD.status = 'running'
BEGIN
  INSERT INTO pool_attempt_events(event_id, task_key, attempt_id, event_type, event_digest, created_at)
  VALUES (
    'attempt-indeterminate:' || NEW.attempt_id, NEW.task_key, NEW.attempt_id,
    'attempt.indeterminate', NEW.input_digest, NEW.indeterminate_at
  );
END;
