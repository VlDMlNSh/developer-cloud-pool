-- Forward-only executor identity binding for the CODE-profile D1 proof.
-- Existing rows are intentionally not backfilled: their executor identity is unknown.
-- Such rows cannot be newly consumed through the guarded task-creation path.
ALTER TABLE pool_approval_ledger
  ADD COLUMN executor_id TEXT;

ALTER TABLE pool_tasks
  ADD COLUMN executor_id TEXT;

CREATE INDEX pool_approval_executor_lookup
  ON pool_approval_ledger(executor_id, state, expires_at);

CREATE INDEX pool_tasks_executor_lookup
  ON pool_tasks(executor_id, state, created_at);

-- New approvals must carry an immutable executor instance identity.
CREATE TRIGGER pool_approval_executor_required_insert
BEFORE INSERT ON pool_approval_ledger
WHEN NEW.executor_id IS NULL
  OR length(NEW.executor_id) NOT BETWEEN 1 AND 128
  OR NEW.executor_id GLOB '*[^A-Za-z0-9._:-]*'
BEGIN
  SELECT RAISE(ABORT, 'EXECUTOR_ID_REQUIRED');
END;

CREATE TRIGGER pool_approval_executor_immutable
BEFORE UPDATE OF executor_id ON pool_approval_ledger
WHEN NEW.executor_id IS NOT OLD.executor_id
BEGIN
  SELECT RAISE(ABORT, 'EXECUTOR_ID_IMMUTABLE');
END;

CREATE TRIGGER pool_tasks_executor_required_insert
BEFORE INSERT ON pool_tasks
WHEN NEW.executor_id IS NULL
  OR length(NEW.executor_id) NOT BETWEEN 1 AND 128
  OR NEW.executor_id GLOB '*[^A-Za-z0-9._:-]*'
BEGIN
  SELECT RAISE(ABORT, 'EXECUTOR_ID_REQUIRED');
END;

CREATE TRIGGER pool_tasks_executor_immutable
BEFORE UPDATE OF executor_id ON pool_tasks
WHEN NEW.executor_id IS NOT OLD.executor_id
BEGIN
  SELECT RAISE(ABORT, 'EXECUTOR_ID_IMMUTABLE');
END;

-- Replace the pre-identity trigger. The executor ID is part of the immutable
-- logical task binding and must match across approval, task and replay.
DROP TRIGGER IF EXISTS pool_approval_consumed_creates_claim_outbox;

CREATE TRIGGER pool_approval_consumed_creates_claim_outbox
AFTER UPDATE OF state ON pool_approval_ledger
WHEN OLD.state = 'ready'
 AND NEW.state = 'consumed'
 AND OLD.consumed_at IS NULL
 AND NEW.consumed_at IS NOT NULL
 AND NEW.task_key IS NOT NULL
BEGIN
  SELECT CASE WHEN NEW.executor_id IS NULL
    OR length(NEW.executor_id) NOT BETWEEN 1 AND 128
    THEN RAISE(ABORT, 'EXECUTOR_ID_REQUIRED') END;

  INSERT INTO pool_tasks (
    task_key, repository_id, issue_number, target_sha, profile, executor_id,
    state, created_at, updated_at
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

-- Do not allow a legacy/null-task-key approval to enter the old claim/outbox path.
DROP TRIGGER IF EXISTS pool_approval_consumed_legacy_claim_outbox;
