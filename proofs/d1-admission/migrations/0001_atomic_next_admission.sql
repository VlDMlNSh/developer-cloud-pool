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
      OR state = 'revoked')
);

CREATE TABLE pool_admission_receipts (
  source_comment_id TEXT PRIMARY KEY NOT NULL,
  admission_id TEXT NOT NULL UNIQUE,
  repository_id TEXT NOT NULL,
  issue_number INTEGER NOT NULL,
  actor_id TEXT NOT NULL,
  owner_association TEXT NOT NULL CHECK (owner_association = 'OWNER'),
  controller_run_id TEXT NOT NULL,
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

CREATE TRIGGER pool_admission_requires_matching_approval
BEFORE INSERT ON pool_admission_receipts
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM pool_approval_ledger a
     WHERE a.approval_id = NEW.approval_id
       AND a.owner_numeric_id = NEW.actor_id
       AND a.repository_id = NEW.repository_id
       AND a.issue_number = NEW.issue_number
       AND a.target_sha = NEW.target_sha
       AND a.profile = NEW.profile
       AND a.envelope_digest = NEW.envelope_digest
       AND a.state = 'ready'
       AND a.consumed_at IS NULL
       AND a.expires_at > NEW.admitted_at
  ) THEN RAISE(ABORT, 'APPROVAL_NOT_AVAILABLE_OR_BINDING_MISMATCH') END;
END;

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
