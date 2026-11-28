-- Pass 34: make lease acquisition, renewal, attempt transitions and fencing
-- database-enforced. The adapter is not the sole enforcement boundary.

-- A lease may be acquired only for the current prepared attempt, with exactly
-- one generation increment. A live lease can only be extended by the same
-- owner/attempt/generation. Release is owned by the attempt terminal trigger.
CREATE TRIGGER pool_tasks_lease_fence_guard
BEFORE UPDATE OF state, lease_owner, lease_generation, lease_expires_at, lease_attempt_id
ON pool_tasks
WHEN NOT (
  (
    OLD.state = 'pending' AND NEW.state = 'leased'
    AND OLD.lease_owner IS NULL AND OLD.lease_expires_at IS NULL
    AND NEW.lease_owner IS NOT NULL
    AND length(NEW.lease_owner) BETWEEN 1 AND 128
    AND NEW.lease_owner NOT GLOB '*[^A-Za-z0-9._:-]*'
    AND NEW.lease_generation = OLD.lease_generation + 1
    AND NEW.lease_generation BETWEEN 1 AND 9007199254740991
    AND NEW.lease_expires_at > NEW.updated_at
    AND NEW.lease_expires_at <= NEW.updated_at + 900
    AND NEW.lease_attempt_id = NEW.current_attempt_id
    AND NEW.current_attempt_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM pool_attempts a
       WHERE a.attempt_id = NEW.current_attempt_id
         AND a.task_key = NEW.task_key
         AND a.attempt_number = NEW.attempt_number
         AND a.status = 'prepared'
         AND a.lease_generation = 0
    )
  )
  OR
  (
    OLD.state = 'leased' AND NEW.state = 'leased'
    AND NEW.lease_owner = OLD.lease_owner
    AND NEW.lease_generation = OLD.lease_generation
    AND NEW.current_attempt_id = OLD.current_attempt_id
    AND NEW.lease_attempt_id = OLD.lease_attempt_id
    AND NEW.lease_expires_at > OLD.lease_expires_at
    AND OLD.lease_expires_at > NEW.updated_at
    AND NEW.lease_expires_at > NEW.updated_at
    AND NEW.lease_expires_at <= NEW.updated_at + 900
    AND NEW.updated_at >= OLD.updated_at
  )
  OR
  (
    OLD.state = 'leased' AND NEW.state IN ('pending', 'completed')
    AND NEW.lease_owner IS NULL
    AND NEW.lease_expires_at IS NULL
    AND NEW.lease_attempt_id IS NULL
    AND NEW.lease_generation = OLD.lease_generation
    AND NEW.current_attempt_id = OLD.current_attempt_id
    AND NEW.attempt_number = OLD.attempt_number
    AND NEW.updated_at >= OLD.updated_at
    AND EXISTS (
      SELECT 1 FROM pool_attempts a
       WHERE a.attempt_id = OLD.current_attempt_id
         AND a.task_key = OLD.task_key
         AND a.status IN ('succeeded', 'failed', 'abandoned')
         AND a.completed_at = NEW.updated_at
         AND (
           (a.status = 'succeeded' AND NEW.state = 'completed')
           OR (a.status IN ('failed', 'abandoned') AND NEW.state = 'pending')
         )
         AND a.lease_generation = OLD.lease_generation
    )
  )
)
BEGIN
  SELECT RAISE(ABORT, 'TASK_LEASE_FENCE_TRANSITION_INVALID');
END;

-- A pointer can move only as the AFTER INSERT effect of a new prepared attempt:
-- attempt number is monotonic and the previous attempt must be terminal-failed.
DROP TRIGGER IF EXISTS pool_tasks_attempt_pointer_guard;
CREATE TRIGGER pool_tasks_attempt_pointer_guard
BEFORE UPDATE OF current_attempt_id, attempt_number ON pool_tasks
WHEN NEW.current_attempt_id IS NOT OLD.current_attempt_id
  OR NEW.attempt_number <> OLD.attempt_number
BEGIN
  SELECT CASE WHEN NOT (
    NEW.state = 'pending'
    AND NEW.lease_owner IS NULL
    AND NEW.lease_expires_at IS NULL
    AND NEW.lease_attempt_id IS NULL
    AND NEW.attempt_number = OLD.attempt_number + 1
    AND NEW.updated_at >= OLD.updated_at
    AND EXISTS (
      SELECT 1 FROM pool_attempts a
       WHERE a.attempt_id = NEW.current_attempt_id
         AND a.task_key = NEW.task_key
         AND a.attempt_number = NEW.attempt_number
         AND a.status = 'prepared'
         AND a.created_at = NEW.updated_at
    )
    AND (
      (OLD.current_attempt_id IS NULL AND OLD.attempt_number = 0)
      OR EXISTS (
        SELECT 1 FROM pool_attempts prior
         WHERE prior.attempt_id = OLD.current_attempt_id
           AND prior.task_key = OLD.task_key
           AND prior.attempt_number = OLD.attempt_number
           AND prior.status IN ('failed', 'abandoned')
      )
    )
  ) THEN RAISE(ABORT, 'TASK_ATTEMPT_POINTER_NOT_MONOTONIC') END;
END;

-- Attempt generation can be assigned only by the matching task lease
-- acquisition trigger, and a prepared attempt cannot become running directly.
CREATE TRIGGER pool_attempts_lease_generation_guard
BEFORE UPDATE OF lease_generation ON pool_attempts
WHEN NEW.lease_generation IS NOT OLD.lease_generation
BEGIN
  SELECT CASE WHEN NOT (
    OLD.status = 'prepared'
    AND NEW.status = 'running'
    AND OLD.lease_generation = 0
    AND NEW.lease_generation > 0
    AND EXISTS (
      SELECT 1 FROM pool_tasks t
       WHERE t.task_key = NEW.task_key
         AND t.current_attempt_id = NEW.attempt_id
         AND t.lease_attempt_id = NEW.attempt_id
         AND t.state = 'leased'
         AND t.lease_owner IS NOT NULL
         AND t.lease_generation = NEW.lease_generation
         AND t.lease_expires_at > NEW.started_at
         AND t.updated_at = NEW.started_at
    )
  ) THEN RAISE(ABORT, 'ATTEMPT_LEASE_GENERATION_NOT_AUTHORIZED') END;
END;

CREATE TRIGGER pool_attempts_running_requires_current_lease
BEFORE UPDATE OF status ON pool_attempts
WHEN NEW.status = 'running' AND OLD.status <> 'running'
BEGIN
  SELECT CASE WHEN NOT (
    OLD.status = 'prepared'
    AND OLD.started_at IS NULL
    AND NEW.started_at IS NOT NULL
    AND NEW.lease_generation > 0
    AND EXISTS (
      SELECT 1 FROM pool_tasks t
       WHERE t.task_key = NEW.task_key
         AND t.current_attempt_id = NEW.attempt_id
         AND t.lease_attempt_id = NEW.attempt_id
         AND t.state = 'leased'
         AND t.lease_owner IS NOT NULL
         AND t.lease_generation = NEW.lease_generation
         AND t.lease_expires_at > NEW.started_at
         AND t.updated_at = NEW.started_at
    )
  ) THEN RAISE(ABORT, 'ATTEMPT_RUNNING_REQUIRES_CURRENT_LEASE') END;
END;

-- Indeterminate is a quarantine state: it can be entered only by the current
-- running attempt after its matching lease has expired. It is never auto-reclaimed.
DROP TRIGGER IF EXISTS pool_attempts_guard_indeterminate;
CREATE TRIGGER pool_attempts_guard_indeterminate
BEFORE UPDATE OF status ON pool_attempts
WHEN NEW.status = 'indeterminate'
BEGIN
  SELECT CASE WHEN NOT (
    OLD.status = 'running'
    AND NEW.indeterminate_at IS NOT NULL
    AND NEW.indeterminate_at >= COALESCE(NEW.started_at, NEW.created_at)
    AND NEW.lease_generation > 0
    AND EXISTS (
      SELECT 1 FROM pool_tasks t
       WHERE t.task_key = NEW.task_key
         AND t.current_attempt_id = NEW.attempt_id
         AND t.lease_attempt_id = NEW.attempt_id
         AND t.state = 'leased'
         AND t.lease_owner IS NOT NULL
         AND t.lease_generation = NEW.lease_generation
         AND t.lease_expires_at <= NEW.indeterminate_at
    )
  ) THEN RAISE(ABORT, 'ATTEMPT_INDETERMINATE_REQUIRES_EXPIRED_CURRENT_LEASE') END;
END;

-- Terminal state, result and provenance become immutable together. The
-- existing terminal projection trigger releases the lease in the same txn.
DROP TRIGGER IF EXISTS pool_attempts_guard_terminal;
CREATE TRIGGER pool_attempts_guard_terminal
BEFORE UPDATE OF status ON pool_attempts
WHEN NEW.status IN ('succeeded', 'failed', 'abandoned')
BEGIN
  SELECT CASE WHEN NOT (
    OLD.status IN ('running', 'indeterminate')
    AND NEW.completed_at IS NOT NULL
    AND NEW.completed_at >= COALESCE(NEW.started_at, NEW.created_at)
    AND NEW.lease_generation > 0
    AND EXISTS (
      SELECT 1 FROM pool_tasks t
       WHERE t.task_key = NEW.task_key
         AND t.current_attempt_id = NEW.attempt_id
         AND t.lease_attempt_id = NEW.attempt_id
         AND t.state = 'leased'
         AND t.lease_generation = NEW.lease_generation
         AND t.lease_owner IS NOT NULL
         AND t.lease_expires_at > NEW.completed_at
    )
  ) THEN RAISE(ABORT, 'ATTEMPT_FINALIZATION_NOT_FENCED') END;
END;

CREATE TRIGGER pool_attempt_terminal_metadata_set_once
BEFORE UPDATE OF started_at, indeterminate_at, completed_at, result_digest,
  provenance_digest, terminal_reason ON pool_attempts
WHEN (
  NEW.started_at IS NOT OLD.started_at
  OR NEW.indeterminate_at IS NOT OLD.indeterminate_at
  OR NEW.completed_at IS NOT OLD.completed_at
  OR NEW.result_digest IS NOT OLD.result_digest
  OR NEW.provenance_digest IS NOT OLD.provenance_digest
  OR NEW.terminal_reason IS NOT OLD.terminal_reason
)
AND NOT (
  (OLD.status = 'prepared' AND NEW.status = 'running'
    AND OLD.started_at IS NULL AND NEW.started_at IS NOT NULL
    AND NEW.indeterminate_at IS OLD.indeterminate_at
    AND NEW.completed_at IS OLD.completed_at
    AND NEW.result_digest IS OLD.result_digest
    AND NEW.provenance_digest IS OLD.provenance_digest
    AND NEW.terminal_reason IS OLD.terminal_reason)
  OR
  (OLD.status = 'running' AND NEW.status = 'indeterminate'
    AND OLD.indeterminate_at IS NULL AND NEW.indeterminate_at IS NOT NULL
    AND NEW.started_at IS OLD.started_at
    AND NEW.completed_at IS OLD.completed_at
    AND NEW.result_digest IS OLD.result_digest
    AND NEW.provenance_digest IS OLD.provenance_digest
    AND NEW.terminal_reason IS OLD.terminal_reason)
  OR
  (OLD.status IN ('running', 'indeterminate')
    AND NEW.status IN ('succeeded', 'failed', 'abandoned')
    AND OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL
    AND NEW.started_at IS OLD.started_at
    AND NEW.indeterminate_at IS OLD.indeterminate_at
    AND (NEW.result_digest IS NULL OR length(NEW.result_digest) = 64)
    AND (NEW.provenance_digest IS NULL OR length(NEW.provenance_digest) = 64)
    AND NEW.terminal_reason IS NOT NULL
    AND length(NEW.terminal_reason) BETWEEN 1 AND 256)
)
BEGIN
  SELECT RAISE(ABORT, 'ATTEMPT_METADATA_TRANSITION_INVALID');
END;

CREATE TRIGGER pool_attempt_terminal_metadata_immutable
BEFORE UPDATE OF started_at, indeterminate_at, completed_at, result_digest,
  provenance_digest, terminal_reason ON pool_attempts
WHEN OLD.status IN ('succeeded', 'failed', 'abandoned')
 AND (
   NEW.started_at IS NOT OLD.started_at
   OR NEW.indeterminate_at IS NOT OLD.indeterminate_at
   OR NEW.completed_at IS NOT OLD.completed_at
   OR NEW.result_digest IS NOT OLD.result_digest
   OR NEW.provenance_digest IS NOT OLD.provenance_digest
   OR NEW.terminal_reason IS NOT OLD.terminal_reason
 )
BEGIN
  SELECT RAISE(ABORT, 'ATTEMPT_TERMINAL_METADATA_IMMUTABLE');
END;

-- Event rows are append-only and their INSERT identity must be derivable from
-- the current attempt/task transition; this prevents forged audit evidence.
CREATE TRIGGER pool_attempt_events_insert_guard
BEFORE INSERT ON pool_attempt_events
WHEN NOT (
  (
    NEW.event_type = 'attempt.created'
    AND NEW.actor_id IS NULL
    AND NEW.lease_generation = 0
    AND EXISTS (
      SELECT 1 FROM pool_attempts a
       JOIN pool_tasks t ON t.task_key = a.task_key
       WHERE a.attempt_id = NEW.attempt_id AND a.task_key = NEW.task_key
         AND a.status = 'prepared'
         AND t.current_attempt_id = a.attempt_id
         AND NEW.event_digest = a.input_digest
         AND NEW.event_id = 'attempt-created:' || a.attempt_id
         AND NEW.created_at = a.created_at
    )
  )
  OR
  (
    NEW.event_type = 'lease.acquired'
    AND EXISTS (
      SELECT 1 FROM pool_attempts a
       JOIN pool_tasks t ON t.task_key = a.task_key
       WHERE a.attempt_id = NEW.attempt_id AND a.task_key = NEW.task_key
         AND a.status = 'running'
         AND t.current_attempt_id = a.attempt_id
         AND t.lease_attempt_id = a.attempt_id
         AND t.state = 'leased'
         AND t.lease_owner = NEW.actor_id
         AND t.lease_generation = NEW.lease_generation
         AND a.lease_generation = NEW.lease_generation
         AND t.lease_expires_at > NEW.created_at
         AND NEW.event_digest = a.input_digest
         AND NEW.event_id = 'lease-acquired:' || a.attempt_id || ':' || a.lease_generation
         AND NEW.created_at = t.updated_at
    )
  )
  OR
  (
    NEW.event_type = 'attempt.indeterminate'
    AND EXISTS (
      SELECT 1 FROM pool_attempts a
       JOIN pool_tasks t ON t.task_key = a.task_key
       WHERE a.attempt_id = NEW.attempt_id AND a.task_key = NEW.task_key
         AND a.status = 'indeterminate'
         AND t.current_attempt_id = a.attempt_id
         AND t.lease_attempt_id = a.attempt_id
         AND t.state = 'leased'
         AND t.lease_owner = NEW.actor_id
         AND t.lease_generation = NEW.lease_generation
         AND a.lease_generation = NEW.lease_generation
         AND t.lease_expires_at <= NEW.created_at
         AND NEW.event_digest = a.input_digest
         AND NEW.event_id = 'attempt-indeterminate:' || a.attempt_id
         AND NEW.created_at = a.indeterminate_at
    )
  )
  OR
  (
    NEW.event_type = 'attempt.finalized'
    AND EXISTS (
      SELECT 1 FROM pool_attempts a
       JOIN pool_tasks t ON t.task_key = a.task_key
       WHERE a.attempt_id = NEW.attempt_id AND a.task_key = NEW.task_key
         AND a.status IN ('succeeded', 'failed', 'abandoned')
         AND t.current_attempt_id = a.attempt_id
         AND t.lease_attempt_id = a.attempt_id
         AND t.state = 'leased'
         AND t.lease_owner = NEW.actor_id
         AND t.lease_generation = NEW.lease_generation
         AND a.lease_generation = NEW.lease_generation
         AND t.lease_expires_at > NEW.created_at
         AND NEW.event_digest = COALESCE(a.result_digest, a.provenance_digest, a.input_digest)
         AND a.completed_at = NEW.created_at
         AND NEW.event_id = 'attempt-finalized:' || a.attempt_id
    )
  )
)
BEGIN
  SELECT RAISE(ABORT, 'ATTEMPT_EVENT_INSERT_NOT_AUTHORIZED');
END;
