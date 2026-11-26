import { beforeEach, describe, expect, it } from "vitest";
import { env } from "cloudflare:workers";
import { acquireAttemptLease } from "../src/acquire-attempt-lease.mjs";

const NOW = 1_800_000_000;
const TASK_KEY = "a".repeat(64);
const ATTEMPT_ID = "lease-attempt-001";

async function seedAttempt() {
  await env.POOL_DB.prepare(`
    INSERT INTO pool_tasks (
      task_key, repository_id, issue_number, target_sha, profile, executor_id,
      state, created_at, updated_at
    ) VALUES (?, '20002', 42, ?, 'jarvis-code-sandbox-v1', 'executor-alpha',
      'pending', ?, ?)
  `).bind(TASK_KEY, "b".repeat(40), NOW, NOW).run();

  await env.POOL_DB.prepare(`
    INSERT INTO pool_attempts (
      attempt_id, task_key, attempt_number, status, input_digest,
      execution_idempotency_key, created_at
    ) VALUES (?, ?, 1, 'prepared', ?, 'lease-idem-001', ?)
  `).bind(ATTEMPT_ID, TASK_KEY, "c".repeat(64), NOW).run();
}

async function acquireLease(expiresAt = NOW + 60) {
  return env.POOL_DB.prepare(`
    UPDATE pool_tasks
       SET state = 'leased', lease_owner = 'worker-alpha',
           lease_generation = lease_generation + 1,
           lease_expires_at = ?, lease_attempt_id = current_attempt_id,
           updated_at = ?
     WHERE task_key = ? AND state = 'pending'
  `).bind(expiresAt, NOW, TASK_KEY).run();
}

beforeEach(async () => {
  // Temporarily remove only the append-only UPDATE/DELETE guards for fixture
  // teardown. Restore them before each test; INSERT provenance guard stays on.
  await env.POOL_DB.prepare("DROP TRIGGER IF EXISTS pool_attempt_events_no_update").run();
  await env.POOL_DB.prepare("DROP TRIGGER IF EXISTS pool_attempt_events_no_delete").run();
  await env.POOL_DB.prepare("DELETE FROM pool_attempt_projection_comment_events").run();
  await env.POOL_DB.prepare("DELETE FROM pool_attempt_projection_events").run();
  await env.POOL_DB.prepare("DELETE FROM pool_attempt_projection_outbox").run();
  await env.POOL_DB.prepare("DELETE FROM pool_admission_commit_receipts").run();
  await env.POOL_DB.prepare("DELETE FROM pool_admissions").run();
  await env.POOL_DB.prepare("DELETE FROM pool_attempt_reconciliations").run();
  await env.POOL_DB.prepare("DELETE FROM pool_attempt_events").run();
  await env.POOL_DB.prepare("DELETE FROM pool_attempts").run();
  await env.POOL_DB.prepare("DELETE FROM pool_task_delivery_outbox").run();
  await env.POOL_DB.prepare("DELETE FROM pool_task_approvals").run();
  await env.POOL_DB.prepare("DELETE FROM pool_tasks").run();
  await env.POOL_DB.prepare("DELETE FROM pool_task_outbox").run();
  await env.POOL_DB.prepare("DELETE FROM pool_task_claims").run();
  await env.POOL_DB.prepare("DELETE FROM pool_approval_ledger").run();
  await env.POOL_DB.prepare("DELETE FROM pool_route_qualifications").run();
  await env.POOL_DB.prepare(`
    CREATE TRIGGER pool_attempt_events_no_update
    BEFORE UPDATE ON pool_attempt_events
    BEGIN SELECT RAISE(ABORT, 'ATTEMPT_EVENTS_APPEND_ONLY'); END
  `).run();
  await env.POOL_DB.prepare(`
    CREATE TRIGGER pool_attempt_events_no_delete
    BEFORE DELETE ON pool_attempt_events
    BEGIN SELECT RAISE(ABORT, 'ATTEMPT_EVENTS_APPEND_ONLY'); END
  `).run();
});

describe("D1 lease and fencing SQL guards", () => {
  it("rejects a direct prepared -> running transition without a lease", async () => {
    await seedAttempt();
    await expect(env.POOL_DB.prepare(`
      UPDATE pool_attempts
         SET status = 'running', started_at = ?, lease_generation = 1
       WHERE attempt_id = ?
    `).bind(NOW, ATTEMPT_ID).run()).rejects.toThrow(/ATTEMPT_/);
    const row = await env.POOL_DB.prepare(
      "SELECT status, lease_generation, started_at FROM pool_attempts WHERE attempt_id = ?"
    ).bind(ATTEMPT_ID).first();
    expect(row).toMatchObject({ status: "prepared", lease_generation: 0, started_at: null });
  });

  it("allows one matching lease acquisition and records its fenced event", async () => {
    await seedAttempt();
    await acquireLease();
    const task = await env.POOL_DB.prepare(
      "SELECT state, lease_owner, lease_generation, lease_attempt_id FROM pool_tasks WHERE task_key = ?"
    ).bind(TASK_KEY).first();
    const attempt = await env.POOL_DB.prepare(
      "SELECT status, lease_generation, started_at FROM pool_attempts WHERE attempt_id = ?"
    ).bind(ATTEMPT_ID).first();
    const event = await env.POOL_DB.prepare(
      "SELECT event_id, actor_id, lease_generation FROM pool_attempt_events WHERE attempt_id = ? AND event_type = 'lease.acquired'"
    ).bind(ATTEMPT_ID).first();
    expect(task).toMatchObject({
      state: "leased", lease_owner: "worker-alpha", lease_generation: 1, lease_attempt_id: ATTEMPT_ID
    });
    expect(attempt).toMatchObject({ status: "running", lease_generation: 1, started_at: NOW });
    expect(event).toMatchObject({
      event_id: "lease-acquired:lease-attempt-001:1", actor_id: "worker-alpha", lease_generation: 1
    });
  });

  it("rejects owner substitution, generation jumps and takeover of a running attempt", async () => {
    await seedAttempt();
    await acquireLease();
    await expect(env.POOL_DB.prepare(`
      UPDATE pool_tasks SET lease_owner = 'worker-beta', lease_generation = 2,
        lease_expires_at = ?, updated_at = ? WHERE task_key = ?
    `).bind(NOW + 120, NOW + 1, TASK_KEY).run()).rejects.toThrow(/TASK_LEASE_FENCE_TRANSITION_INVALID/);
    await expect(env.POOL_DB.prepare(`
      UPDATE pool_tasks SET lease_generation = 3 WHERE task_key = ?
    `).bind(TASK_KEY).run()).rejects.toThrow();
    const row = await env.POOL_DB.prepare(
      "SELECT lease_owner, lease_generation FROM pool_tasks WHERE task_key = ?"
    ).bind(TASK_KEY).first();
    expect(row).toMatchObject({ lease_owner: "worker-alpha", lease_generation: 1 });
  });

  it("permits same-owner renewal only while the old lease is live and the generation is unchanged", async () => {
    await seedAttempt();
    await acquireLease(NOW + 60);
    await env.POOL_DB.prepare(`
      UPDATE pool_tasks SET lease_expires_at = ?, updated_at = ?
       WHERE task_key = ? AND state = 'leased'
    `).bind(NOW + 90, NOW + 10, TASK_KEY).run();
    const renewed = await env.POOL_DB.prepare(
      "SELECT lease_generation, lease_expires_at FROM pool_tasks WHERE task_key = ?"
    ).bind(TASK_KEY).first();
    expect(renewed).toMatchObject({ lease_generation: 1, lease_expires_at: NOW + 90 });
    await expect(env.POOL_DB.prepare(`
      UPDATE pool_tasks SET lease_expires_at = ?, updated_at = ?
       WHERE task_key = ?
    `).bind(NOW + 120, NOW + 91, TASK_KEY).run()).rejects.toThrow(/TASK_LEASE_FENCE_TRANSITION_INVALID/);
  });

  it("rejects direct lease release and stale finalization after expiry", async () => {
    await seedAttempt();
    await acquireLease(NOW + 10);
    await expect(env.POOL_DB.prepare(`
      UPDATE pool_tasks SET state = 'pending', lease_owner = NULL,
        lease_expires_at = NULL, lease_attempt_id = NULL, updated_at = ?
       WHERE task_key = ?
    `).bind(NOW + 1, TASK_KEY).run()).rejects.toThrow(/TASK_LEASE_FENCE_TRANSITION_INVALID/);
    await expect(env.POOL_DB.prepare(`
      UPDATE pool_attempts SET status = 'succeeded', completed_at = ?,
        result_digest = ?, provenance_digest = ?, terminal_reason = 'stale'
       WHERE attempt_id = ?
    `).bind(NOW + 11, "d".repeat(64), "e".repeat(64), ATTEMPT_ID).run()).rejects.toThrow(/ATTEMPT_FINALIZATION_NOT_FENCED/);
    const row = await env.POOL_DB.prepare(
      "SELECT state, lease_owner, lease_generation FROM pool_tasks WHERE task_key = ?"
    ).bind(TASK_KEY).first();
    expect(row).toMatchObject({ state: "leased", lease_owner: "worker-alpha", lease_generation: 1 });
  });

  it("releases the lease only through a current, unexpired terminal attempt transition", async () => {
    await seedAttempt();
    await acquireLease();
    await env.POOL_DB.prepare(`
      UPDATE pool_attempts SET status = 'succeeded', completed_at = ?,
        result_digest = ?, provenance_digest = ?, terminal_reason = 'verified'
       WHERE attempt_id = ?
    `).bind(NOW + 30, "d".repeat(64), "e".repeat(64), ATTEMPT_ID).run();
    const task = await env.POOL_DB.prepare(
      "SELECT state, lease_owner, lease_expires_at, lease_attempt_id, lease_generation FROM pool_tasks WHERE task_key = ?"
    ).bind(TASK_KEY).first();
    expect(task).toMatchObject({
      state: "completed", lease_owner: null, lease_expires_at: null,
      lease_attempt_id: null, lease_generation: 1
    });
    await expect(env.POOL_DB.prepare(
      "UPDATE pool_attempts SET result_digest = ? WHERE attempt_id = ?"
    ).bind("f".repeat(64), ATTEMPT_ID).run()).rejects.toThrow(/ATTEMPT_TERMINAL_METADATA_IMMUTABLE/);
    await expect(env.POOL_DB.prepare(
      "UPDATE pool_tasks SET state = 'pending' WHERE task_key = ?"
    ).bind(TASK_KEY).run()).rejects.toThrow(/TASK_LEASE_FENCE_TRANSITION_INVALID/);
  });

  it("quarantines an expired running attempt as indeterminate and forbids automatic takeover", async () => {
    await seedAttempt();
    await acquireLease(NOW + 10);
    await env.POOL_DB.prepare(`
      UPDATE pool_attempts SET status = 'indeterminate', indeterminate_at = ?
       WHERE attempt_id = ?
    `).bind(NOW + 11, ATTEMPT_ID).run();
    const event = await env.POOL_DB.prepare(
      "SELECT event_id, actor_id, lease_generation FROM pool_attempt_events WHERE attempt_id = ? AND event_type = 'attempt.indeterminate'"
    ).bind(ATTEMPT_ID).first();
    expect(event).toMatchObject({
      event_id: "attempt-indeterminate:lease-attempt-001", actor_id: "worker-alpha", lease_generation: 1
    });
    await expect(env.POOL_DB.prepare(`
      UPDATE pool_tasks SET lease_generation = lease_generation + 1,
        lease_expires_at = ?, updated_at = ? WHERE task_key = ?
    `).bind(NOW + 90, NOW + 12, TASK_KEY).run()).rejects.toThrow(/TASK_LEASE_FENCE_TRANSITION_INVALID/);
    const task = await env.POOL_DB.prepare(
      "SELECT state, lease_generation, lease_owner FROM pool_tasks WHERE task_key = ?"
    ).bind(TASK_KEY).first();
    expect(task).toMatchObject({ state: "leased", lease_generation: 1, lease_owner: "worker-alpha" });
  });

  it("rejects forged attempt audit events and non-monotonic attempt pointer changes", async () => {
    await seedAttempt();
    await expect(env.POOL_DB.prepare(`
      INSERT INTO pool_attempt_events (
        event_id, task_key, attempt_id, event_type, event_digest, actor_id, lease_generation, created_at
      ) VALUES ('forged-event', ?, ?, 'lease.acquired', ?, 'worker-beta', 9, ?)
    `).bind(TASK_KEY, ATTEMPT_ID, "c".repeat(64), NOW).run()).rejects.toThrow(/ATTEMPT_EVENT_INSERT_NOT_AUTHORIZED/);
    await expect(env.POOL_DB.prepare(
      "UPDATE pool_tasks SET attempt_number = 0 WHERE task_key = ?"
    ).bind(TASK_KEY).run()).rejects.toThrow(/TASK_ATTEMPT_POINTER_NOT_MONOTONIC/);
  });
});


describe("authenticated D1 attempt lease adapter", () => {
  const request = {
    taskKey: TASK_KEY,
    attemptId: ATTEMPT_ID,
    executorId: "executor-alpha",
    authContext: { syntheticSubject: "worker-alpha" },
    now: NOW,
    ttlSeconds: 60
  };
  const authenticate = async (context, expected) => ({
    authenticated: true,
    subject: context.syntheticSubject,
    executorId: expected.executorId,
    capabilityProfile: expected.capabilityProfile
  });

  it("acquires the prepared attempt only after trusted principal binding and primary readback", async () => {
    await seedAttempt();
    const result = await acquireAttemptLease(env.POOL_DB, request, authenticate);
    expect(result).toMatchObject({
      decision: "LEASE_ACQUIRED",
      taskKey: TASK_KEY,
      attemptId: ATTEMPT_ID,
      executorId: "executor-alpha",
      leaseOwner: "worker-alpha",
      leaseGeneration: 1,
      leaseExpiresAt: NOW + 60,
      dispatch: false,
      executionAuthorized: false
    });
  });

  it("rejects an authenticated principal for a different executor before writing", async () => {
    await seedAttempt();
    const result = await acquireAttemptLease(env.POOL_DB, request, async () => ({
      authenticated: true,
      subject: "worker-alpha",
      executorId: "executor-other",
      capabilityProfile: "jarvis-code-sandbox-v1"
    }));
    expect(result).toMatchObject({ decision: "DENY", reason: "EXECUTOR_PRINCIPAL_BINDING_INVALID", dispatch: false });
    const task = await env.POOL_DB.prepare(
      "SELECT state, lease_generation FROM pool_tasks WHERE task_key = ?"
    ).bind(TASK_KEY).first();
    expect(task).toMatchObject({ state: "pending", lease_generation: 0 });
  });

  it("fails closed when no trusted authenticator is supplied", async () => {
    await seedAttempt();
    const result = await acquireAttemptLease(env.POOL_DB, request);
    expect(result).toMatchObject({ decision: "DENY", reason: "LEASE_AUTHORITY_UNAVAILABLE", dispatch: false });
  });

  it("does not acquire a lease for a mismatched task executor", async () => {
    await seedAttempt();
    const result = await acquireAttemptLease(env.POOL_DB, {
      ...request,
      executorId: "executor-other"
    }, authenticate);
    expect(result).toMatchObject({ decision: "DENY", reason: "TASK_EXECUTOR_OR_ATTEMPT_MISMATCH", dispatch: false });
    const task = await env.POOL_DB.prepare(
      "SELECT state, lease_generation FROM pool_tasks WHERE task_key = ?"
    ).bind(TASK_KEY).first();
    expect(task).toMatchObject({ state: "pending", lease_generation: 0 });
  });
});
