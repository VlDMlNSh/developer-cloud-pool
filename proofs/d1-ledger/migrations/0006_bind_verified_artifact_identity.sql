-- Persist the verified object identity with both the accepted result and outbox intent.
ALTER TABLE pool_task_results ADD COLUMN artifact_object_key TEXT;
ALTER TABLE pool_task_results ADD COLUMN artifact_object_version TEXT;
ALTER TABLE pool_task_results ADD COLUMN artifact_byte_length INTEGER;

ALTER TABLE pool_task_result_outbox ADD COLUMN artifact_object_key TEXT;
ALTER TABLE pool_task_result_outbox ADD COLUMN artifact_object_version TEXT;
ALTER TABLE pool_task_result_outbox ADD COLUMN artifact_byte_length INTEGER;

DROP TRIGGER IF EXISTS pool_task_result_fences_completion_and_outbox;

CREATE TRIGGER pool_task_result_requires_verified_artifact
BEFORE INSERT ON pool_task_results
BEGIN
  SELECT CASE WHEN NEW.artifact_object_key IS NULL OR
    length(NEW.artifact_object_key) NOT BETWEEN 1 AND 256
    THEN RAISE(ABORT,'VERIFIED_ARTIFACT_KEY_REQUIRED') END;
  SELECT CASE WHEN NEW.artifact_object_version IS NULL OR
    length(NEW.artifact_object_version) NOT BETWEEN 1 AND 128
    THEN RAISE(ABORT,'VERIFIED_ARTIFACT_VERSION_REQUIRED') END;
  SELECT CASE WHEN NEW.artifact_byte_length IS NULL OR
    NEW.artifact_byte_length < 0
    THEN RAISE(ABORT,'VERIFIED_ARTIFACT_LENGTH_REQUIRED') END;
END;

CREATE TRIGGER pool_task_result_fences_completion_and_outbox
AFTER INSERT ON pool_task_results
BEGIN
  UPDATE pool_tasks SET state='completed', lease_owner=NULL, lease_attempt_id=NULL,
    lease_expires_at=NULL, updated_at=NEW.committed_at
   WHERE task_key=NEW.task_key AND state='leased' AND lease_owner=NEW.worker_id
     AND lease_generation=NEW.lease_generation AND lease_attempt_id=NEW.lease_attempt_id
     AND lease_expires_at>NEW.committed_at;
  SELECT CASE WHEN changes()<>1 THEN RAISE(ABORT,'RESULT_LEASE_FENCE_LOST') END;
  INSERT INTO pool_task_result_outbox(
    effect_id,task_key,event_type,result_digest,status,created_at,
    artifact_object_key,artifact_object_version,artifact_byte_length
  )
  VALUES(
    'pool-result:'||NEW.task_key,NEW.task_key,'pool.task.result',NEW.result_digest,'pending',NEW.committed_at,
    NEW.artifact_object_key,NEW.artifact_object_version,NEW.artifact_byte_length
  );
END;
