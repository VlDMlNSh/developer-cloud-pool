-- Bind each approval, logical task, and immutable attempt to one executor instance.
-- Existing proof rows are intentionally left NULL: no historical executor is inferred.
ALTER TABLE pool_approval_ledger ADD COLUMN executor_id TEXT;
ALTER TABLE pool_tasks ADD COLUMN executor_id TEXT;
ALTER TABLE pool_attempts ADD COLUMN executor_id TEXT;

-- New approvals must name a stable executor instance. Capability profile remains separate.
CREATE TRIGGER pool_approval_executor_id_required
BEFORE INSERT ON pool_approval_ledger
WHEN NEW.executor_id IS NULL OR NOT (
  (substr(NEW.executor_id, 1, 12) = 'claude-code-' AND
   substr(NEW.executor_id, 13) <> '' AND substr(NEW.executor_id, 13) NOT GLOB '*[^0-9]*' AND substr(NEW.executor_id, 13, 1) BETWEEN '1' AND '9') OR
  (substr(NEW.executor_id, 1, 5) = 'codex' AND
   substr(NEW.executor_id, 6, 1) = '-' AND substr(NEW.executor_id, 7) <> '' AND
   substr(NEW.executor_id, 7) NOT GLOB '*[^0-9]*' AND substr(NEW.executor_id, 7, 1) BETWEEN '1' AND '9') OR
  (substr(NEW.executor_id, 1, 7) = 'gemini-' AND
   substr(NEW.executor_id, 8) <> '' AND substr(NEW.executor_id, 8) NOT GLOB '*[^0-9]*' AND substr(NEW.executor_id, 8, 1) BETWEEN '1' AND '9')
)
BEGIN
  SELECT RAISE(ABORT, 'INVALID_EXECUTOR_ID');
END;

CREATE TRIGGER pool_approval_executor_id_immutable
BEFORE UPDATE OF executor_id ON pool_approval_ledger
WHEN NEW.executor_id IS NOT OLD.executor_id
BEGIN
  SELECT RAISE(ABORT, 'APPROVAL_EXECUTOR_ID_IMMUTABLE');
END;

CREATE TRIGGER pool_task_executor_binding
BEFORE INSERT ON pool_tasks
WHEN NEW.executor_id IS NULL OR NOT EXISTS (
  SELECT 1 FROM pool_approval_ledger a
   WHERE a.task_key = NEW.task_key
     AND a.executor_id = NEW.executor_id
)
BEGIN
  SELECT RAISE(ABORT, 'TASK_EXECUTOR_BINDING_MISMATCH');
END;

CREATE TRIGGER pool_task_executor_id_immutable
BEFORE UPDATE OF executor_id ON pool_tasks
WHEN NEW.executor_id IS NOT OLD.executor_id
BEGIN
  SELECT RAISE(ABORT, 'TASK_EXECUTOR_ID_IMMUTABLE');
END;

CREATE TRIGGER pool_task_approval_executor_binding
BEFORE INSERT ON pool_task_approvals
WHEN NOT EXISTS (
  SELECT 1 FROM pool_tasks t
  JOIN pool_approval_ledger a ON a.approval_id = NEW.approval_id
   WHERE t.task_key = NEW.task_key
     AND t.executor_id = a.executor_id
)
BEGIN
  SELECT RAISE(ABORT, 'TASK_APPROVAL_EXECUTOR_MISMATCH');
END;

CREATE TRIGGER pool_attempt_executor_binding
BEFORE INSERT ON pool_attempts
WHEN NEW.executor_id IS NULL OR NOT EXISTS (
  SELECT 1 FROM pool_tasks t
   WHERE t.task_key = NEW.task_key
     AND t.executor_id = NEW.executor_id
)
BEGIN
  SELECT RAISE(ABORT, 'ATTEMPT_EXECUTOR_BINDING_MISMATCH');
END;

CREATE TRIGGER pool_attempt_executor_id_immutable
BEFORE UPDATE OF executor_id ON pool_attempts
WHEN NEW.executor_id IS NOT OLD.executor_id
BEGIN
  SELECT RAISE(ABORT, 'ATTEMPT_EXECUTOR_ID_IMMUTABLE');
END;

DROP TRIGGER IF EXISTS pool_approval_consumed_creates_claim_outbox;
CREATE TRIGGER pool_approval_consumed_creates_claim_outbox
AFTER UPDATE OF state ON pool_approval_ledger
WHEN OLD.state = 'ready'
 AND NEW.state = 'consumed'
 AND OLD.consumed_at IS NULL
 AND NEW.consumed_at IS NOT NULL
 AND NEW.task_key IS NOT NULL
BEGIN
  INSERT INTO pool_tasks (
    task_key, repository_id, issue_number, target_sha, profile, executor_id, state, created_at, updated_at
  ) VALUES (
    NEW.task_key, NEW.repository_id, NEW.issue_number, NEW.target_sha, NEW.profile,
    NEW.executor_id, 'pending', NEW.consumed_at, NEW.consumed_at
  ) ON CONFLICT(task_key) DO NOTHING;

  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM pool_tasks
    WHERE task_key = NEW.task_key
      AND repository_id = NEW.repository_id
      AND issue_number = NEW.issue_number
      AND target_sha = NEW.target_sha
      AND profile = NEW.profile
      AND executor_id = NEW.executor_id
  ) THEN RAISE(ABORT, 'TASK_KEY_BINDING_CONFLICT') END;

  INSERT INTO pool_task_approvals (task_key, approval_id, envelope_digest, attached_at)
  VALUES (NEW.task_key, NEW.approval_id, NEW.envelope_digest, NEW.consumed_at);

  INSERT INTO pool_task_delivery_outbox (outbox_id, task_key, event_type, status, created_at)
  SELECT 'pool-task-ready:' || NEW.task_key, NEW.task_key, 'pool.task.ready', 'pending', NEW.consumed_at
  WHERE EXISTS (SELECT 1 FROM pool_task_approvals WHERE approval_id = NEW.approval_id)
  ON CONFLICT(task_key) DO NOTHING;
END;
