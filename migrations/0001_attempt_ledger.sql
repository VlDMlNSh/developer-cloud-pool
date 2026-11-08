CREATE TABLE IF NOT EXISTS pool_attempts (
  attempt_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  lease_generation INTEGER NOT NULL CHECK (lease_generation > 0),
  status TEXT NOT NULL CHECK (status IN ('claimed', 'completed', 'needs_review')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pool_attempt_receipts (
  attempt_id TEXT NOT NULL,
  lease_generation INTEGER NOT NULL CHECK (lease_generation > 0),
  receipt_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (attempt_id, lease_generation),
  FOREIGN KEY (attempt_id) REFERENCES pool_attempts(attempt_id)
);
