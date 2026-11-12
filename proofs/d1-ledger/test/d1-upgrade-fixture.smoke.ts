import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { claimLogicalTask } from "../src/claim-outbox.mjs";
import {
  acquireAttemptLease,
  createTaskAttempt,
  finalizeTaskAttempt,
  markAttemptIndeterminate
} from "../src/task-attempts.mjs";
import {
  acquireProjectionDelivery,
  markProjectionCommentVerified,
  markProjectionRetryable,
  reserveProjectionCommentPost
} from "../src/projection-outbox.mjs";

const BASE = 1_810_000_000;
const DIGESTS = {
  succeeded: { result: "1".repeat(64), provenance: "a".repeat(64) },
  failed: { result: "2".repeat(64), provenance: "b".repeat(64) },
  abandoned: { result: "3".repeat(64), provenance: "c".repeat(64) }
};

const TABLES = [
  ["pool_tasks", "task_key, repository_id, issue_number, target_sha, profile, state, lease_owner, lease_generation, lease_expires_at, attempt_count, created_at, updated_at, current_attempt_id, attempt_number, lease_attempt_id", "task_key"],
  ["pool_attempts", "attempt_id, task_key, attempt_number, status, input_digest, execution_idempotency_key, lease_generation, terminal_reason, result_digest, provenance_digest, created_at, started_at, completed_at, indeterminate_at", "attempt_id"],
  ["pool_attempt_events", "event_id, task_key, attempt_id, event_type, event_digest, actor_id, lease_generation, created_at", "event_id"],
  ["pool_attempt_projection_outbox", "outbox_id, task_key, attempt_id, repository_id, issue_number, target_sha, profile, lease_generation, terminal_status, event_digest, status, lease_owner, lease_generation_delivery, lease_expires_at, delivery_attempts, created_at, updated_at, delivered_at, retry_after_at, last_error_code, dead_lettered_at, dead_letter_reason, comment_post_state, comment_post_attempted_at, comment_post_attempt_generation", "outbox_id"],
  ["pool_attempt_projection_events", "delivery_event_id, outbox_id, event_type, lease_generation, actor_id, created_at, reason_code", "delivery_event_id"],
  ["pool_attempt_projection_comment_events", "comment_event_id, outbox_id, event_type, delivery_generation, post_attempt_generation, actor_id, created_at", "comment_event_id"],
  ["pool_attempt_reconciliations", "reconciliation_id, task_key, attempt_id, status, input_digest, lease_generation, expired_lease_owner, created_at", "reconciliation_id"]
];

async function createTask(db, suffix, now) {
  const approval = {
    approvalId: `frozen-v1-${suffix}`,
    ownerNumericId: "10001",
    repositoryId: "20002",
    issueNumber: 2100 + ["succeeded", "failed", "abandoned", "indeterminate"].indexOf(suffix),
    targetSha: String((["succeeded", "failed", "abandoned", "indeterminate"].indexOf(suffix) + 1).toString(16)).padStart(40, "0"),
    profile: "dsh-headless-probe",
    envelopeDigest: String((["succeeded", "failed", "abandoned", "indeterminate"].indexOf(suffix) + 10).toString(16)).padStart(64, "0")
  };
  await db.prepare(`
    INSERT INTO pool_approval_ledger (
      approval_id, owner_numeric_id, repository_id, issue_number,
      target_sha, profile, envelope_digest, expires_at, state, consumed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ready', NULL)
  `).bind(
    approval.approvalId, approval.ownerNumericId, approval.repositoryId,
    approval.issueNumber, approval.targetSha, approval.profile,
    approval.envelopeDigest, now + 3600
  ).run();
  const claimed = await claimLogicalTask(db, approval, now);
  expect(claimed.decision).toBe("TASK_CREATED_OR_ATTACHED");
  return { ...approval, taskKey: claimed.taskKey };
}

async function createTerminal(db, status) {
  const data = DIGESTS[status];
  const task = await createTask(db, status, BASE);
  const attemptId = `frozen-attempt-${status}`;
  const created = await createTaskAttempt(db, {
    taskKey: task.taskKey, attemptId, attemptNumber: 1,
    inputDigest: "d".repeat(64), executionIdempotencyKey: `frozen-exec-${status}`,
    now: BASE + 1
  });
  expect(created.decision).toBe("ATTEMPT_CREATED");
  const workerId = `frozen-worker-${status}`;
  const lease = await acquireAttemptLease(db, task.taskKey, workerId, BASE + 2, 60);
  expect(lease.decision).toBe("ATTEMPT_LEASE_ACQUIRED");
  const finalized = await finalizeTaskAttempt(db, {
    taskKey: task.taskKey, attemptId, workerId, generation: lease.generation,
    status, resultDigest: data.result, provenanceDigest: data.provenance,
    terminalReason: `frozen-${status}`, now: BASE + 3
  });
  expect(finalized.decision).toBe("ATTEMPT_FINALIZED");
  return `attempt-finalized:${attemptId}`;
}

async function buildFrozenFixture(db, migrations) {
  const expectedNames = [
    "0001_create_pool_approval_ledger",
    "0002_create_task_claim_outbox",
    "0003_create_logical_task_identity",
    "0004_create_immutable_task_attempts",
    "0005_create_attempt_reconciliation_queue",
    "0006_create_attempt_projection_outbox",
    "0007_bound_projection_delivery_retries",
    "0008_enforce_projection_attempt_monotonicity",
    "0009_projection_outbox_identity_immutable",
    "0010_projection_comment_at_most_once"
  ];
  expect(migrations.slice(0, 10).map(migration => migration.name.replace(/\.sql$/, ""))).toEqual(expectedNames);
  await applyD1Migrations(db, migrations.slice(0, 10));

  const succeededId = await createTerminal(db, "succeeded");
  const failedId = await createTerminal(db, "failed");
  const abandonedId = await createTerminal(db, "abandoned");

  // The failed event traverses retry generations 1..5 and ends in dead-letter.
  let now = BASE + 10;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const lease = await acquireProjectionDelivery(db, failedId, `frozen-delivery-${attempt}`, now, 20);
    expect(lease.decision).toBe("PROJECTION_LEASE_ACQUIRED");
    if (attempt === 1) {
      expect((await reserveProjectionCommentPost(db, failedId, lease.lease_owner, lease.lease_generation_delivery, now)).decision)
        .toBe("PROJECTION_COMMENT_POST_RESERVED");
    }
    const retried = await markProjectionRetryable(
      db, failedId, lease.lease_owner, lease.lease_generation_delivery, now + 1,
      attempt === 5 ? "FROZEN_DEAD_LETTER" : "FROZEN_RETRY"
    );
    expect(retried.decision).toBe(attempt === 5 ? "PROJECTION_DEAD_LETTERED" : "PROJECTION_RETRYABLE");
    now += [32, 62, 122, 242, 1][attempt - 1];
  }

  // The abandoned event has a reserved and verified fake marker, but no real POST.
  const verifiedLease = await acquireProjectionDelivery(db, abandonedId, "frozen-verified-worker", BASE + 10, 60);
  expect(verifiedLease.decision).toBe("PROJECTION_LEASE_ACQUIRED");
  expect((await reserveProjectionCommentPost(
    db, abandonedId, verifiedLease.lease_owner, verifiedLease.lease_generation_delivery, BASE + 10
  )).decision).toBe("PROJECTION_COMMENT_POST_RESERVED");
  expect((await markProjectionCommentVerified(
    db, abandonedId, verifiedLease.lease_owner, verifiedLease.lease_generation_delivery, BASE + 11
  )).decision).toBe("PROJECTION_COMMENT_VERIFIED");

  // Keep one nonterminal execution and its expired indeterminate reconciliation row.
  const pendingTask = await createTask(db, "indeterminate", BASE + 20);
  const pendingAttemptId = "frozen-attempt-indeterminate";
  expect((await createTaskAttempt(db, {
    taskKey: pendingTask.taskKey, attemptId: pendingAttemptId, attemptNumber: 1,
    inputDigest: "e".repeat(64), executionIdempotencyKey: "frozen-exec-indeterminate",
    now: BASE + 21
  })).decision).toBe("ATTEMPT_CREATED");
  const pendingLease = await acquireAttemptLease(
    db, pendingTask.taskKey, "frozen-worker-indeterminate", BASE + 22, 20
  );
  expect(pendingLease.decision).toBe("ATTEMPT_LEASE_ACQUIRED");
  expect((await markAttemptIndeterminate(db, pendingTask.taskKey, pendingAttemptId, BASE + 43)).decision)
    .toBe("ATTEMPT_INDETERMINATE");

  const tables = {};
  for (const [table, columns, orderBy] of TABLES) {
    const result = await db.prepare(`SELECT ${columns} FROM ${table} ORDER BY ${orderBy}`).all();
    tables[table] = result.results;
  }
  const markerBodies = [];
  for (const outboxId of [succeededId, failedId, abandonedId]) {
    const row = await db.prepare(
      "SELECT outbox_id, event_digest FROM pool_attempt_projection_outbox WHERE outbox_id = ?"
    ).bind(outboxId).first();
    markerBodies.push({
      outboxId,
      body: `<!-- pool-projection:${row.outbox_id}:${row.event_digest} -->`
    });
  }
  return { tables, markerBodies };
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]));
  }
  return value;
}

describe("frozen schema-0010 v1 fixture baseline", () => {
  it("reproduces all historical state and fake marker bytes in two isolated local D1 databases", async () => {
    const migrations = env.UPGRADE_MIGRATIONS;
    const first = await buildFrozenFixture(env.UPGRADE_DB, migrations);
    const replay = await buildFrozenFixture(env.REPLAY_DB, migrations);
    expect(replay).toEqual(first);
    const canonical = JSON.stringify(stableValue(first));
    const digest = createHash("sha256").update(canonical, "utf8").digest("hex");
    const golden = JSON.parse(readFileSync(
      new URL("../fixtures/schema-0010-v1-golden.json", import.meta.url),
      "utf8"
    ));
    expect(digest).toBe(golden.sha256);
    expect(Buffer.byteLength(canonical, "utf8")).toBe(golden.canonicalBytes);
    console.log("FROZEN_SCHEMA_0010_GOLDEN_SHA256=" + digest);
    console.log("FROZEN_SCHEMA_0010_CANONICAL_BYTES=" + Buffer.byteLength(canonical, "utf8"));

    const outbox = first.tables.pool_attempt_projection_outbox;
    expect(outbox.map(row => row.comment_post_state).sort()).toEqual(["indeterminate", "not_attempted", "verified"]);
    expect(outbox.find(row => row.terminal_status === "failed").status).toBe("dead_letter");
    expect(first.tables.pool_attempt_reconciliations).toHaveLength(1);
    expect(first.tables.pool_attempts.some(row => row.status === "indeterminate")).toBe(true);
    expect(first.markerBodies).toHaveLength(3);
  });

  it("rolls back all statements when a D1 batch migration fails", async () => {
    const db = env.FAILURE_DB;
    const tableName = "migration_atomicity_probe";
    await expect(db.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?"
    ).bind(tableName).first()).resolves.toBeNull();

    await expect(db.batch([
      db.prepare("CREATE TABLE migration_atomicity_probe (id INTEGER PRIMARY KEY, value TEXT NOT NULL UNIQUE)"),
      db.prepare("INSERT INTO migration_atomicity_probe (id, value) VALUES (1, 'first')"),
      db.prepare("INSERT INTO migration_atomicity_probe (id, value) VALUES (2, 'first')")
    ])).rejects.toBeTruthy();

    const table = await db.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?"
    ).bind(tableName).first();
    expect(table).toBeNull();
  });
});
