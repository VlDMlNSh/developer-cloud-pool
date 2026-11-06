CREATE TABLE IF NOT EXISTS pool_task_claims (
  approval_id TEXT PRIMARY KEY NOT NULL REFERENCES pool_approval_ledger(approval_id),
  claim_id TEXT NOT NULL UNIQUE,
  envelope_digest TEXT NOT NULL CHECK (length(envelope_digest) = 64),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'leased', 'completed', 'dead')),
  lease_owner TEXT,
  lease_generation INTEGER NOT NULL DEFAULT 0 CHECK (lease_generation >= 0),
  lease_expires_at INTEGER,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  created_at INTEGER NOT NULL,
  completed_at INTEGER,
  CHECK (
    (status = 'pending' AND lease_owner IS NULL AND lease_expires_at IS NULL) OR
    (status = 'leased' AND lease_owner IS NOT NULL AND lease_expires_at IS NOT NULL) OR
    status IN ('completed', 'dead')
  )
);

CREATE TABLE IF NOT EXISTS pool_task_outbox (
  outbox_id TEXT PRIMARY KEY NOT NULL,
  approval_id TEXT NOT NULL UNIQUE REFERENCES pool_approval_ledger(approval_id),
  event_type TEXT NOT NULL CHECK (event_type = 'pool.task.claimed'),
  envelope_digest TEXT NOT NULL CHECK (length(envelope_digest) = 64),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'dead')),
  created_at INTEGER NOT NULL,
  delivered_at INTEGER
);

CREATE INDEX IF NOT EXISTS pool_task_claims_pending
  ON pool_task_claims (status, created_at);

CREATE INDEX IF NOT EXISTS pool_task_outbox_pending
  ON pool_task_outbox (status, created_at);
