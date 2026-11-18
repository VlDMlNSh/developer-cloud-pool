-- Bind every lease acquisition to the exact conditional UPDATE that won.
-- Nullable for pre-existing rows; new acquisitions always write a fresh token.
ALTER TABLE pool_tasks ADD COLUMN lease_attempt_id TEXT;

CREATE INDEX IF NOT EXISTS pool_tasks_lease_attempt
  ON pool_tasks(task_key, lease_attempt_id);
