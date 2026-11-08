-- Logical task identity is distinct from per-approval authorization identity.
ALTER TABLE pool_approval_ledger ADD COLUMN task_key TEXT;

CREATE TABLE IF NOT EXISTS pool_tasks (
  task_key TEXT PRIMARY KEY NOT NULL CHECK (length(task_key) = 64),
  repository_id TEXT NOT NULL,
  issue_number INTEGER NOT NULL CHECK (issue_number > 0),
  target_sha TEXT NOT NULL CHECK (length(target_sha) = 40),
  profile TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'leased', 'completed', 'dead')),
  lease_owner TEXT,
  lease_generation INTEGER NOT NULL DEFAULT 0 CHECK (lease_generation >= 0),
  lease_expires_at INTEGER,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  CHECK (
    (state = 'pending' AND lease_owner IS NULL AND lease_expires_at IS NULL) OR
    (state = 'leased' AND lease_owner IS NOT NULL AND lease_expires_at IS NOT NULL) OR
    state IN ('completed', 'dead')
  )
);

CREATE TABLE IF NOT EXISTS pool_task_approvals (
  task_key TEXT NOT NULL REFERENCES pool_tasks(task_key),
  approval_id TEXT NOT NULL UNIQUE REFERENCES pool_approval_ledger(approval_id),
  envelope_digest TEXT NOT NULL CHECK (length(envelope_digest) = 64),
  attached_at INTEGER NOT NULL,
  PRIMARY KEY (task_key, approval_id)
);

CREATE TABLE IF NOT EXISTS pool_task_delivery_outbox (
  outbox_id TEXT PRIMARY KEY NOT NULL,
  task_key TEXT NOT NULL UNIQUE REFERENCES pool_tasks(task_key),
  event_type TEXT NOT NULL CHECK (event_type = 'pool.task.ready'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'dead')),
  created_at INTEGER NOT NULL,
  delivered_at INTEGER
);

CREATE INDEX IF NOT EXISTS pool_tasks_pending ON pool_tasks(state, created_at);

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
    task_key, repository_id, issue_number, target_sha, profile, state, created_at, updated_at
  ) VALUES (
    NEW.task_key, NEW.repository_id, NEW.issue_number, NEW.target_sha, NEW.profile,
    'pending', NEW.consumed_at, NEW.consumed_at
  ) ON CONFLICT(task_key) DO NOTHING;

  INSERT INTO pool_task_approvals (task_key, approval_id, envelope_digest, attached_at)
  SELECT NEW.task_key, NEW.approval_id, NEW.envelope_digest, NEW.consumed_at
  WHERE EXISTS (
    SELECT 1 FROM pool_tasks
    WHERE task_key = NEW.task_key
      AND repository_id = NEW.repository_id
      AND issue_number = NEW.issue_number
      AND target_sha = NEW.target_sha
      AND profile = NEW.profile
  );

  INSERT INTO pool_task_delivery_outbox (outbox_id, task_key, event_type, status, created_at)
  SELECT 'pool-task-ready:' || NEW.task_key, NEW.task_key, 'pool.task.ready', 'pending', NEW.consumed_at
  WHERE EXISTS (SELECT 1 FROM pool_task_approvals WHERE approval_id = NEW.approval_id)
  ON CONFLICT(task_key) DO NOTHING;
END;

-- Preserve the original per-approval proof path for historical regression tests.
CREATE TRIGGER IF NOT EXISTS pool_approval_consumed_legacy_claim_outbox
AFTER UPDATE OF state ON pool_approval_ledger
WHEN OLD.state = 'ready'
 AND NEW.state = 'consumed'
 AND OLD.consumed_at IS NULL
 AND NEW.consumed_at IS NOT NULL
 AND NEW.task_key IS NULL
BEGIN
  INSERT INTO pool_task_claims (
    approval_id, claim_id, envelope_digest, status, created_at
  ) VALUES (
    NEW.approval_id, NEW.approval_id, NEW.envelope_digest, 'pending', NEW.consumed_at
  );
  INSERT INTO pool_task_outbox (
    outbox_id, approval_id, event_type, envelope_digest, status, created_at
  ) VALUES (
    'pool-task:' || NEW.approval_id, NEW.approval_id,
    'pool.task.claimed', NEW.envelope_digest, 'pending', NEW.consumed_at
  );
END;
