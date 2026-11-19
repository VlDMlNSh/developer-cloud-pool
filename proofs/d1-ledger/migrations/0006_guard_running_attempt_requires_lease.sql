-- Prevent callers from marking a prepared attempt as running without
-- the matching, current, unexpired task lease. The legitimate task-lease
-- acquisition trigger updates the task first and satisfies this invariant.
CREATE TRIGGER pool_attempts_running_requires_current_lease
BEFORE UPDATE OF status ON pool_attempts
WHEN NEW.status = 'running'
 AND OLD.status <> 'running'
 AND NOT EXISTS (
   SELECT 1
     FROM pool_tasks t
    WHERE t.task_key = NEW.task_key
      AND t.current_attempt_id = NEW.attempt_id
      AND t.lease_attempt_id = NEW.attempt_id
      AND t.state = 'leased'
      AND t.lease_owner IS NOT NULL
      AND t.lease_generation > 0
      AND t.lease_generation = NEW.lease_generation
      AND t.lease_expires_at > NEW.started_at
 )
BEGIN
  SELECT RAISE(ABORT, 'ATTEMPT_RUNNING_REQUIRES_CURRENT_LEASE');
END;
