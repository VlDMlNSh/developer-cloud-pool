-- Materialize expired, indeterminate executions as durable reconciliation work.
-- This queue does NOT authorize retries or terminal decisions. A future resolver
-- must verify a separate trusted capability and immutable evidence before acting.
CREATE TABLE pool_attempt_reconciliations (
  reconciliation_id TEXT PRIMARY KEY NOT NULL,
  task_key TEXT NOT NULL REFERENCES pool_tasks(task_key),
  attempt_id TEXT NOT NULL UNIQUE REFERENCES pool_attempts(attempt_id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending')),
  input_digest TEXT NOT NULL CHECK (length(input_digest) = 64),
  lease_generation INTEGER NOT NULL CHECK (lease_generation > 0),
  expired_lease_owner TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX pool_attempt_reconciliations_pending
  ON pool_attempt_reconciliations(status, created_at);

CREATE TRIGGER pool_attempt_indeterminate_creates_reconciliation
AFTER UPDATE OF status ON pool_attempts
WHEN NEW.status = 'indeterminate' AND OLD.status = 'running'
BEGIN
  INSERT INTO pool_attempt_reconciliations (
    reconciliation_id, task_key, attempt_id, status, input_digest,
    lease_generation, expired_lease_owner, created_at
  )
  SELECT
    'reconcile:' || NEW.attempt_id, NEW.task_key, NEW.attempt_id, 'pending',
    NEW.input_digest, NEW.lease_generation, t.lease_owner, NEW.indeterminate_at
  FROM pool_tasks t
  WHERE t.task_key = NEW.task_key
    AND t.current_attempt_id = NEW.attempt_id
    AND t.lease_generation = NEW.lease_generation
  ON CONFLICT(attempt_id) DO NOTHING;
END;
