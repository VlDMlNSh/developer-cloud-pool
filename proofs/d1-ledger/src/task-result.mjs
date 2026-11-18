import { verifyStoredArtifact } from "./artifact-ingest.mjs";

const SAFE_ID = /^[A-Za-z0-9._:-]{1,128}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{12}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const RESULT_REF = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/;

function deny(reason) { return { decision: "DENY", dispatch: false, reason }; }

/** Local-only result commit. Re-hashes the stored object before publishing D1 result/outbox intent. */
export async function commitTaskResult(db, bucket, input) {
  const now = Math.floor(Date.now() / 1000);
  if (!db || typeof db.prepare !== "function") return deny("STORAGE_UNAVAILABLE");
  if (!input) return deny("INVALID_RESULT_COMMIT");
  if (typeof input.taskKey !== "string" || !/^[a-f0-9]{64}$/.test(input.taskKey)) return deny("INVALID_TASK_KEY");
  if (typeof input.workerId !== "string" || !SAFE_ID.test(input.workerId)) return deny("INVALID_WORKER_ID");
  if (!Number.isSafeInteger(input.generation) || input.generation < 1) return deny("INVALID_LEASE_GENERATION");
  if (typeof input.leaseAttemptId !== "string" || !SAFE_ID.test(input.leaseAttemptId)) return deny("INVALID_LEASE_ATTEMPT");
  if (!input.artifact || typeof input.artifact !== "object") return deny("INVALID_ARTIFACT_REFERENCE");

  if (!bucket || typeof bucket.head !== "function" || typeof bucket.get !== "function") {
    return deny("STORAGE_UNAVAILABLE");
  }
  let artifact;
  try {
    artifact = await verifyStoredArtifact(bucket, input.artifact, input.taskKey);
  } catch {
    return deny("ARTIFACT_VERIFICATION_FAILED");
  }
  if (!artifact) return deny("UNVERIFIED_ARTIFACT");
  const resultDigest = artifact.sha256;
  const resultRef = artifact.resultRef;
  const artifactObjectKey = artifact.objectKey;
  const artifactObjectVersion = artifact.objectVersion;
  const artifactByteLength = artifact.byteLength;
  if (typeof resultDigest !== "string" || !SHA256.test(resultDigest) ||
      typeof resultRef !== "string" || !RESULT_REF.test(resultRef) ||
      typeof artifactObjectKey !== "string" || artifactObjectKey.length < 1 || artifactObjectKey.length > 256 ||
      typeof artifactObjectVersion !== "string" || artifactObjectVersion.length < 1 || artifactObjectVersion.length > 128 ||
      !Number.isSafeInteger(artifactByteLength) || artifactByteLength < 0 ||
      !Number.isSafeInteger(now) || now <= 0) return deny("INVALID_VERIFIED_ARTIFACT_RECORD");

  try {
    const before = await db.prepare("SELECT worker_id, lease_generation, lease_attempt_id, result_digest, result_ref, artifact_object_key, artifact_object_version, artifact_byte_length FROM pool_task_results WHERE task_key = ?")
      .bind(input.taskKey).first();
    if (before) return before.worker_id === input.workerId && before.lease_generation === input.generation &&
      before.lease_attempt_id === input.leaseAttemptId && before.result_digest === resultDigest &&
      before.result_ref === resultRef && before.artifact_object_key === artifactObjectKey &&
      before.artifact_object_version === artifactObjectVersion && before.artifact_byte_length === artifactByteLength
      ? { decision: "RESULT_ALREADY_COMMITTED", taskKey: input.taskKey, effectId: "pool-result:" + input.taskKey, dispatch: false }
      : deny("RESULT_IDENTITY_CONFLICT");

    const inserted = await db.prepare(
      "INSERT INTO pool_task_results (task_key, worker_id, lease_generation, lease_attempt_id, result_digest, result_ref, committed_at, artifact_object_key, artifact_object_version, artifact_byte_length) " +
      "SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE EXISTS (" +
      "SELECT 1 FROM pool_tasks WHERE task_key = ? AND state = 'leased' AND lease_owner = ? " +
      "AND lease_generation = ? AND lease_attempt_id = ? AND lease_expires_at > ?) ON CONFLICT(task_key) DO NOTHING"
    ).bind(input.taskKey, input.workerId, input.generation, input.leaseAttemptId,
      resultDigest, resultRef, now, artifactObjectKey, artifactObjectVersion, artifactByteLength,
      input.taskKey, input.workerId, input.generation, input.leaseAttemptId, now).run();
    if (inserted?.success !== true) return deny("RESULT_COMMIT_AMBIGUOUS");

    const persisted = await db.prepare(
      "SELECT r.worker_id, r.lease_generation, r.lease_attempt_id, r.result_digest, r.result_ref, " +
      "r.artifact_object_key, r.artifact_object_version, r.artifact_byte_length, t.state AS task_state, " +
      "o.effect_id, o.event_type, o.result_digest AS outbox_digest, o.status AS outbox_status, " +
      "o.artifact_object_key AS outbox_object_key, o.artifact_object_version AS outbox_object_version, " +
      "o.artifact_byte_length AS outbox_byte_length FROM pool_task_results r " +
      "JOIN pool_tasks t ON t.task_key = r.task_key JOIN pool_task_result_outbox o ON o.task_key = r.task_key " +
      "WHERE r.task_key = ?"
    ).bind(input.taskKey).first();

    const exact = persisted &&
      persisted.worker_id === input.workerId &&
      persisted.lease_generation === input.generation &&
      persisted.lease_attempt_id === input.leaseAttemptId &&
      persisted.result_digest === resultDigest &&
      persisted.result_ref === resultRef &&
      persisted.artifact_object_key === artifactObjectKey &&
      persisted.artifact_object_version === artifactObjectVersion &&
      persisted.artifact_byte_length === artifactByteLength &&
      persisted.task_state === "completed" &&
      persisted.effect_id === "pool-result:" + input.taskKey &&
      persisted.event_type === "pool.task.result" &&
      persisted.outbox_digest === resultDigest &&
      persisted.outbox_object_key === artifactObjectKey &&
      persisted.outbox_object_version === artifactObjectVersion &&
      persisted.outbox_byte_length === artifactByteLength &&
      ["pending", "delivered"].includes(persisted.outbox_status);
    if (!exact) {
      const existing = await db.prepare("SELECT result_digest, result_ref FROM pool_task_results WHERE task_key = ?")
        .bind(input.taskKey).first();
      if (existing) return deny("RESULT_IDENTITY_CONFLICT");
      return deny("STALE_OR_EXPIRED_RESULT_WRITER");
    }
    return { decision: "RESULT_COMMITTED", taskKey: input.taskKey, effectId: persisted.effect_id,
      generation: input.generation, dispatch: false };
  } catch {
    return deny("RESULT_COMMIT_AMBIGUOUS");
  }
}
