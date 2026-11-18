-- Result acceptance, task completion and outbox intent are one SQLite transaction.
CREATE TABLE IF NOT EXISTS pool_task_results (
  task_key TEXT PRIMARY KEY NOT NULL REFERENCES pool_tasks(task_key),
  worker_id TEXT NOT NULL,
  lease_generation INTEGER NOT NULL CHECK (lease_generation > 0),
  lease_attempt_id TEXT NOT NULL,
  result_digest TEXT NOT NULL CHECK (length(result_digest) = 64 AND result_digest NOT GLOB '*[^0-9a-f]*'),
  result_ref TEXT NOT NULL CHECK (length(result_ref) BETWEEN 1 AND 256),
  committed_at INTEGER NOT NULL CHECK (committed_at > 0)
);
CREATE TABLE IF NOT EXISTS pool_task_result_outbox (
  effect_id TEXT PRIMARY KEY NOT NULL,
  task_key TEXT NOT NULL UNIQUE REFERENCES pool_task_results(task_key),
  event_type TEXT NOT NULL CHECK (event_type = 'pool.task.result'),
  result_digest TEXT NOT NULL CHECK (length(result_digest) = 64 AND result_digest NOT GLOB '*[^0-9a-f]*'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'dead')),
  created_at INTEGER NOT NULL CHECK (created_at > 0),
  delivered_at INTEGER
);
CREATE INDEX IF NOT EXISTS pool_task_result_outbox_pending ON pool_task_result_outbox(status, created_at);
CREATE TRIGGER IF NOT EXISTS pool_task_result_fences_completion_and_outbox
AFTER INSERT ON pool_task_results
BEGIN
  UPDATE pool_tasks SET state='completed', lease_owner=NULL, lease_attempt_id=NULL,
    lease_expires_at=NULL, updated_at=NEW.committed_at
   WHERE task_key=NEW.task_key AND state='leased' AND lease_owner=NEW.worker_id
     AND lease_generation=NEW.lease_generation AND lease_attempt_id=NEW.lease_attempt_id
     AND lease_expires_at>NEW.committed_at;
  SELECT CASE WHEN changes()<>1 THEN RAISE(ABORT,'RESULT_LEASE_FENCE_LOST') END;
  INSERT INTO pool_task_result_outbox(effect_id,task_key,event_type,result_digest,status,created_at)
  VALUES('pool-result:'||NEW.task_key,NEW.task_key,'pool.task.result',NEW.result_digest,'pending',NEW.committed_at);
END;
