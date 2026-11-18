CREATE TABLE pool_approval_ledger (
  approval_id TEXT PRIMARY KEY NOT NULL,
  owner_numeric_id TEXT NOT NULL CHECK (owner_numeric_id NOT GLOB '*[^0-9]*'),
  repository_id TEXT NOT NULL CHECK (repository_id NOT GLOB '*[^0-9]*'),
  issue_number INTEGER NOT NULL CHECK (issue_number > 0),
  target_sha TEXT NOT NULL CHECK (length(target_sha) = 40 AND target_sha NOT GLOB '*[^0-9a-f]*'),
  profile TEXT NOT NULL,
  envelope_digest TEXT NOT NULL CHECK (length(envelope_digest) = 64),
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER,
  task_key TEXT,
  state TEXT NOT NULL DEFAULT 'ready' CHECK (state IN ('ready', 'consumed', 'revoked')),
  CHECK ((state = 'ready' AND consumed_at IS NULL AND task_key IS NULL)
      OR (state = 'consumed' AND consumed_at IS NOT NULL AND task_key IS NOT NULL)
      OR (state = 'revoked' AND consumed_at IS NULL AND task_key IS NULL))
);

CREATE TABLE pool_admission_receipts (
  source_comment_id TEXT PRIMARY KEY NOT NULL,
  admission_id TEXT NOT NULL UNIQUE,
  repository_id TEXT NOT NULL,
  issue_number INTEGER NOT NULL,
  actor_id TEXT NOT NULL,
  owner_association TEXT NOT NULL CHECK (owner_association = 'OWNER'),
  controller_run_id TEXT NOT NULL,
  controller_run_attempt INTEGER NOT NULL CHECK (controller_run_attempt > 0),
  controller_code_sha TEXT NOT NULL CHECK (length(controller_code_sha) = 40),
  target_sha TEXT NOT NULL CHECK (length(target_sha) = 40),
  profile TEXT NOT NULL,
  wave_id TEXT NOT NULL,
  envelope_digest TEXT NOT NULL CHECK (length(envelope_digest) = 64),
  task_key TEXT NOT NULL,
  approval_id TEXT NOT NULL REFERENCES pool_approval_ledger(approval_id),
  admitted_at INTEGER NOT NULL
);

CREATE TABLE pool_tasks (
  task_key TEXT PRIMARY KEY NOT NULL,
  repository_id TEXT NOT NULL,
  issue_number INTEGER NOT NULL,
  target_sha TEXT NOT NULL,
  profile TEXT NOT NULL,
  wave_id TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'completed', 'dead')),
  created_at INTEGER NOT NULL
);

CREATE TABLE pool_task_approvals (
  task_key TEXT NOT NULL REFERENCES pool_tasks(task_key),
  approval_id TEXT NOT NULL UNIQUE REFERENCES pool_approval_ledger(approval_id),
  envelope_digest TEXT NOT NULL,
  attached_at INTEGER NOT NULL,
  PRIMARY KEY (task_key, approval_id)
);

CREATE TABLE pool_task_outbox (
  outbox_id TEXT PRIMARY KEY NOT NULL,
  task_key TEXT NOT NULL UNIQUE REFERENCES pool_tasks(task_key),
  event_type TEXT NOT NULL CHECK (event_type = 'pool.task.ready'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'dead')),
  created_at INTEGER NOT NULL
);

-- This trigger is the transaction boundary: the receipt insert and all
-- approval/task/outbox writes commit or roll back as one D1 statement.
CREATE TRIGGER pool_admission_consumes_approval_and_creates_task
AFTER INSERT ON pool_admission_receipts
BEGIN
  UPDATE pool_approval_ledger
     SET state = 'consumed', consumed_at = NEW.admitted_at, task_key = NEW.task_key
   WHERE approval_id = NEW.approval_id
     AND owner_numeric_id = NEW.actor_id
     AND repository_id = NEW.repository_id
     AND issue_number = NEW.issue_number
     AND target_sha = NEW.target_sha
     AND profile = NEW.profile
     AND envelope_digest = NEW.envelope_digest
     AND state = 'ready'
     AND consumed_at IS NULL
     AND expires_at > NEW.admitted_at;

  -- Verify the UPDATE itself consumed exactly one ready approval. A prior
  -- consumed row with matching timestamps/task binding must never authorize
  -- a new receipt (same-second pre-consumption/replay attack).
  SELECT CASE WHEN changes() <> 1
    THEN RAISE(ABORT, 'APPROVAL_CONSUME_NOT_ATOMIC') END;

  INSERT INTO pool_tasks (
    task_key, repository_id, issue_number, target_sha, profile, wave_id, state, created_at
  ) VALUES (
    NEW.task_key, NEW.repository_id, NEW.issue_number, NEW.target_sha,
    NEW.profile, NEW.wave_id, 'pending', NEW.admitted_at
  );

  INSERT INTO pool_task_approvals (task_key, approval_id, envelope_digest, attached_at)
  VALUES (NEW.task_key, NEW.approval_id, NEW.envelope_digest, NEW.admitted_at);

  INSERT INTO pool_task_outbox (outbox_id, task_key, event_type, status, created_at)
  VALUES ('pool-task-ready:' || NEW.task_key, NEW.task_key, 'pool.task.ready', 'pending', NEW.admitted_at);
END;

-- Admission receipts and logical task identity are append-only/immutable.
CREATE TRIGGER pool_admission_receipts_immutable_update
BEFORE UPDATE ON pool_admission_receipts
BEGIN
  SELECT RAISE(ABORT, 'ADMISSION_RECEIPT_IMMUTABLE');
END;

CREATE TRIGGER pool_admission_receipts_immutable_delete
BEFORE DELETE ON pool_admission_receipts
BEGIN
  SELECT RAISE(ABORT, 'ADMISSION_RECEIPT_APPEND_ONLY');
END;

CREATE TRIGGER pool_tasks_immutable_binding
BEFORE UPDATE OF task_key, repository_id, issue_number, target_sha, profile, wave_id ON pool_tasks
BEGIN
  SELECT RAISE(ABORT, 'LOGICAL_TASK_BINDING_IMMUTABLE');
END;

CREATE TRIGGER pool_tasks_no_delete
BEFORE DELETE ON pool_tasks
BEGIN
  SELECT RAISE(ABORT, 'LOGICAL_TASK_APPEND_ONLY');
END;

CREATE TRIGGER pool_approval_binding_immutable
BEFORE UPDATE OF approval_id, owner_numeric_id, repository_id, issue_number, target_sha,
                 profile, envelope_digest, expires_at ON pool_approval_ledger
BEGIN
  SELECT RAISE(ABORT, 'APPROVAL_BINDING_IMMUTABLE');
END;

-- Approval consumption is one-way. A consumed approval can never be reset
-- to ready/revoked, and the append-only ledger cannot be deleted.
CREATE TRIGGER pool_approval_state_monotonic
BEFORE UPDATE OF state, consumed_at, task_key ON pool_approval_ledger
WHEN NOT (
  (OLD.state = 'ready' AND NEW.state = 'consumed'
    AND OLD.consumed_at IS NULL AND OLD.task_key IS NULL
    AND NEW.consumed_at IS NOT NULL AND NEW.task_key IS NOT NULL)
  OR
  (OLD.state = 'ready' AND NEW.state = 'revoked'
    AND OLD.consumed_at IS NULL AND OLD.task_key IS NULL
    AND NEW.consumed_at IS NULL AND NEW.task_key IS NULL)
  OR
  (OLD.state = NEW.state
    AND OLD.consumed_at IS NEW.consumed_at
    AND OLD.task_key IS NEW.task_key)
)
BEGIN
  SELECT RAISE(ABORT, 'APPROVAL_STATE_NOT_MONOTONIC');
END;

CREATE TRIGGER pool_approval_ledger_no_delete
BEFORE DELETE ON pool_approval_ledger
BEGIN
  SELECT RAISE(ABORT, 'APPROVAL_LEDGER_APPEND_ONLY');
END;
