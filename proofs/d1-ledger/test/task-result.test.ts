import { describe, expect, it, vi } from "vitest";
import { env } from "cloudflare:workers";
import { claimLogicalTask } from "../src/claim-outbox.mjs";
import { acquireTaskLease } from "../src/task-lease.mjs";
import { commitTaskResult } from "../src/task-result.mjs";
import { ingestArtifact } from "../src/artifact-ingest.mjs";

let seq = 0;
async function createTask() {
  const now = Math.floor(Date.now() / 1000);
  const n = ++seq;
  const approval = {
    approvalId: `result-${n}`, ownerNumericId: "10001", repositoryId: "20002",
    issueNumber: 1000 + n, targetSha: "a".repeat(40), profile: "dsh-headless-probe",
    envelopeDigest: "b".repeat(64)
  };
  await env.POOL_DB.prepare(
    "INSERT INTO pool_approval_ledger(approval_id,owner_numeric_id,repository_id,issue_number,target_sha,profile,envelope_digest,expires_at,state,consumed_at) VALUES(?,?,?,?,?,?,?,?,'ready',NULL)"
  ).bind(approval.approvalId, approval.ownerNumericId, approval.repositoryId, approval.issueNumber,
    approval.targetSha, approval.profile, approval.envelopeDigest, now + 3600).run();
  const claim = await claimLogicalTask(env.POOL_DB, approval, now);
  expect(claim.decision).toBe("TASK_CREATED_OR_ATTACHED");
  return claim.taskKey;
}

let artifactSeq = 0;
async function createVerifiedArtifact(taskKey, text = "verified result bytes") {
  artifactSeq += 1;
  const uploadId = `artifact_d1_${String(artifactSeq).padStart(16, "0")}`;
  const bytes = new TextEncoder().encode(text);
  const result = await ingestArtifact(env.ARTIFACTS, {
    taskKey, uploadId, body: new ReadableStream({ start(controller) { controller.enqueue(bytes); controller.close(); } }),
    declaredSize: bytes.byteLength
  });
  expect(result.decision).toBe("ARTIFACT_STORED");
  return result.artifact;
}

describe("fenced result/outbox transaction requires verified artifact capability", () => {
  it("accepts only the current lease attempt and persists exact object identity into result and outbox", async () => {
    const key = await createTask();
    const old = await acquireTaskLease(env.POOL_DB, key, "same-worker", 10);
    expect(old.decision).toBe("LEASE_ACQUIRED");
    await env.POOL_DB.prepare("UPDATE pool_tasks SET lease_expires_at=? WHERE task_key=?")
      .bind(Math.floor(Date.now() / 1000) - 1, key).run();
    const live = await acquireTaskLease(env.POOL_DB, key, "same-worker", 60);
    expect(live.decision).toBe("LEASE_ACQUIRED");
    expect(live.generation).toBe(old.generation + 1);

    const stale = await commitTaskResult(env.POOL_DB, env.ARTIFACTS, {
      taskKey: key, workerId: old.workerId, generation: old.generation,
      leaseAttemptId: old.leaseAttemptId, artifact: await createVerifiedArtifact(key, "stale attempt")
    });
    expect(stale).toMatchObject({ decision: "DENY", reason: "STALE_OR_EXPIRED_RESULT_WRITER", dispatch: false });

    const artifact = await createVerifiedArtifact(key, "current verified result");
    const accepted = await commitTaskResult(env.POOL_DB, env.ARTIFACTS, {
      taskKey: key, workerId: live.workerId, generation: live.generation,
      leaseAttemptId: live.leaseAttemptId, artifact
    });
    expect(accepted).toMatchObject({
      decision: "RESULT_COMMITTED", effectId: `pool-result:${key}`,
      generation: live.generation, dispatch: false
    });
    const persisted = await env.POOL_DB.prepare(
      "SELECT r.result_digest,r.result_ref,r.artifact_object_key,r.artifact_object_version,r.artifact_byte_length," +
      "t.state AS task_state,o.effect_id,o.result_digest AS outbox_digest,o.artifact_object_key AS outbox_key," +
      "o.artifact_object_version AS outbox_version,o.artifact_byte_length AS outbox_length " +
      "FROM pool_task_results r JOIN pool_tasks t ON t.task_key=r.task_key " +
      "JOIN pool_task_result_outbox o ON o.task_key=r.task_key WHERE r.task_key=?"
    ).bind(key).first();
    expect(persisted).toMatchObject({
      result_digest: artifact.sha256, result_ref: artifact.resultRef,
      artifact_object_key: artifact.objectKey, artifact_object_version: artifact.objectVersion,
      artifact_byte_length: artifact.byteLength, task_state: "completed",
      effect_id: `pool-result:${key}`, outbox_digest: artifact.sha256,
      outbox_key: artifact.objectKey, outbox_version: artifact.objectVersion,
      outbox_length: artifact.byteLength
    });
  });

  it("recovers when object storage succeeds but the first D1 commit is fenced out", async () => {
    const key = await createTask();
    const firstLease = await acquireTaskLease(env.POOL_DB, key, "recovery-worker", 60);
    const artifact = await createVerifiedArtifact(key, "object survives D1 commit failure");

    await env.POOL_DB.prepare("UPDATE pool_tasks SET lease_expires_at=? WHERE task_key=?")
      .bind(Math.floor(Date.now() / 1000) - 1, key).run();
    const rejected = await commitTaskResult(env.POOL_DB, env.ARTIFACTS, {
      taskKey: key, workerId: firstLease.workerId, generation: firstLease.generation,
      leaseAttemptId: firstLease.leaseAttemptId, artifact
    });
    expect(rejected).toMatchObject({
      decision: "DENY", reason: "STALE_OR_EXPIRED_RESULT_WRITER", dispatch: false
    });
    const empty = await env.POOL_DB.prepare(
      "SELECT (SELECT count(*) FROM pool_task_results WHERE task_key=?) AS results," +
      "(SELECT count(*) FROM pool_task_result_outbox WHERE task_key=?) AS effects"
    ).bind(key, key).first();
    expect(empty).toMatchObject({ results: 0, effects: 0 });
    expect(await env.ARTIFACTS.head(artifact.objectKey)).toMatchObject({
      version: artifact.objectVersion, size: artifact.byteLength
    });

    const recoveredLease = await acquireTaskLease(env.POOL_DB, key, "recovery-worker", 60);
    expect(recoveredLease.decision).toBe("LEASE_ACQUIRED");
    expect(recoveredLease.generation).toBe(firstLease.generation + 1);
    const recovered = await commitTaskResult(env.POOL_DB, env.ARTIFACTS, {
      taskKey: key, workerId: recoveredLease.workerId, generation: recoveredLease.generation,
      leaseAttemptId: recoveredLease.leaseAttemptId, artifact
    });
    expect(recovered).toMatchObject({
      decision: "RESULT_COMMITTED", effectId: `pool-result:${key}`, dispatch: false
    });
    const counts = await env.POOL_DB.prepare(
      "SELECT (SELECT count(*) FROM pool_task_results WHERE task_key=?) AS results," +
      "(SELECT count(*) FROM pool_task_result_outbox WHERE task_key=?) AS effects"
    ).bind(key, key).first();
    expect(counts).toMatchObject({ results: 1, effects: 1 });
  });

  it("is idempotent for the exact verified record and rejects substituted artifact identity", async () => {
    const key = await createTask();
    const lease = await acquireTaskLease(env.POOL_DB, key, "retry-worker", 60);
    expect(lease.decision).toBe("LEASE_ACQUIRED");
    const artifact = await createVerifiedArtifact(key, "stable bytes");
    const input = {
      taskKey: key, workerId: lease.workerId, generation: lease.generation,
      leaseAttemptId: lease.leaseAttemptId, artifact
    };
    expect((await commitTaskResult(env.POOL_DB, env.ARTIFACTS, input)).decision).toBe("RESULT_COMMITTED");
    expect((await commitTaskResult(env.POOL_DB, env.ARTIFACTS, input)).decision).toBe("RESULT_ALREADY_COMMITTED");

    const substituted = await createVerifiedArtifact(key, "different bytes");
    expect(await commitTaskResult(env.POOL_DB, env.ARTIFACTS, { ...input, artifact: substituted }))
      .toMatchObject({ decision: "DENY", reason: "RESULT_IDENTITY_CONFLICT", dispatch: false });
    expect(await commitTaskResult(env.POOL_DB, env.ARTIFACTS, { ...input, workerId: "other-worker" }))
      .toMatchObject({ decision: "DENY", reason: "RESULT_IDENTITY_CONFLICT", dispatch: false });
  });

  it("rejects raw worker digest/reference and forged copies without publishing result or outbox", async () => {
    const key = await createTask();
    const lease = await acquireTaskLease(env.POOL_DB, key, "untrusted-worker", 60);
    const base = {
      taskKey: key, workerId: lease.workerId, generation: lease.generation,
      leaseAttemptId: lease.leaseAttemptId
    };
    expect(await commitTaskResult(env.POOL_DB, env.ARTIFACTS, {
      ...base, resultDigest: "c".repeat(64), resultRef: "worker-controlled-ref"
    })).toMatchObject({ decision: "DENY", reason: "INVALID_ARTIFACT_REFERENCE", dispatch: false });

    const verified = await createVerifiedArtifact(key, "capability bytes");
    const forgedCopy = { ...verified, sha256: "c".repeat(64) };
    expect(await commitTaskResult(env.POOL_DB, env.ARTIFACTS, { ...base, artifact: forgedCopy }))
      .toMatchObject({ decision: "DENY", reason: "UNVERIFIED_ARTIFACT", dispatch: false });

    const counts = await env.POOL_DB.prepare(
      "SELECT (SELECT count(*) FROM pool_task_results WHERE task_key=?) AS results," +
      "(SELECT count(*) FROM pool_task_result_outbox WHERE task_key=?) AS effects"
    ).bind(key, key).first();
    expect(counts).toMatchObject({ results: 0, effects: 0 });
  });

  it("rejects an object overwritten after ingest and before D1 publication", async () => {
    const key = await createTask();
    const lease = await acquireTaskLease(env.POOL_DB, key, "overwrite-worker", 60);
    const artifact = await createVerifiedArtifact(key, "original bytes");
    await env.ARTIFACTS.put(artifact.objectKey, "tampered bytes", {
      customMetadata: { taskKey: key, uploadId: artifact.uploadId }
    });
    expect(await commitTaskResult(env.POOL_DB, env.ARTIFACTS, {
      taskKey: key, workerId: lease.workerId, generation: lease.generation,
      leaseAttemptId: lease.leaseAttemptId, artifact
    })).toMatchObject({ decision: "DENY", reason: "UNVERIFIED_ARTIFACT", dispatch: false });
    const counts = await env.POOL_DB.prepare(
      "SELECT (SELECT count(*) FROM pool_task_results WHERE task_key=?) AS results," +
      "(SELECT count(*) FROM pool_task_result_outbox WHERE task_key=?) AS effects"
    ).bind(key, key).first();
    expect(counts).toMatchObject({ results: 0, effects: 0 });
  });

  it("rolls back result insertion when the SQL fencing trigger rejects an expired attempt", async () => {
    const key = await createTask();
    const lease = await acquireTaskLease(env.POOL_DB, key, "rollback-worker", 60);
    await env.POOL_DB.prepare("UPDATE pool_tasks SET lease_expires_at=? WHERE task_key=?")
      .bind(Math.floor(Date.now() / 1000) - 1, key).run();
    await expect(env.POOL_DB.prepare(
      "INSERT INTO pool_task_results(task_key,worker_id,lease_generation,lease_attempt_id,result_digest,result_ref,committed_at,artifact_object_key,artifact_object_version,artifact_byte_length) VALUES(?,?,?,?,?,?,?,?,?,?)"
    ).bind(key, lease.workerId, lease.generation, lease.leaseAttemptId, "a".repeat(64), "r2:expired",
      Math.floor(Date.now() / 1000), "ingest/expired", "version-expired", 7).run())
      .rejects.toThrow(/RESULT_LEASE_FENCE_LOST/);
    const counts = await env.POOL_DB.prepare(
      "SELECT (SELECT count(*) FROM pool_task_results WHERE task_key=?) AS results," +
      "(SELECT count(*) FROM pool_task_result_outbox WHERE task_key=?) AS effects"
    ).bind(key, key).first();
    expect(counts).toMatchObject({ results: 0, effects: 0 });
  });

  it("reclaims a lease when expiry equals the Worker clock boundary", async () => {
    const key = await createTask();
    const first = await acquireTaskLease(env.POOL_DB, key, "boundary-worker", 60);
    expect(first.decision).toBe("LEASE_ACQUIRED");
    const boundary = Math.floor(Date.now() / 1000);
    await env.POOL_DB.prepare("UPDATE pool_tasks SET lease_expires_at=? WHERE task_key=?").bind(boundary, key).run();
    const clock = vi.spyOn(Date, "now").mockReturnValue(boundary * 1000);
    try {
      const reclaimed = await acquireTaskLease(env.POOL_DB, key, "boundary-worker", 60);
      expect(reclaimed.decision).toBe("LEASE_ACQUIRED");
      expect(reclaimed.generation).toBe(first.generation + 1);
      expect(reclaimed.leaseAttemptId).not.toBe(first.leaseAttemptId);
    } finally { clock.mockRestore(); }
  });
});
