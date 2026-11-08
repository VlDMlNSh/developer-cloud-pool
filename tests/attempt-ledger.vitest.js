import { it, expect } from "vitest";
import { env } from "cloudflare:workers";
import { applyD1Migrations } from "cloudflare:test";
import {
  claimAttempt,
  commitAttemptReceipt,
  markAttemptNeedsReview
} from "../src/attempt-ledger.js";

async function freshDb() {
  await env.DB.exec(`CREATE TABLE IF NOT EXISTS pool_attempts (attempt_id TEXT PRIMARY KEY, task_id TEXT NOT NULL, lease_generation INTEGER NOT NULL CHECK (lease_generation > 0), status TEXT NOT NULL CHECK (status IN ('claimed', 'completed', 'needs_review')), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP); CREATE TABLE IF NOT EXISTS pool_attempt_receipts (attempt_id TEXT NOT NULL, lease_generation INTEGER NOT NULL CHECK (lease_generation > 0), receipt_json TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (attempt_id, lease_generation), FOREIGN KEY (attempt_id) REFERENCES pool_attempts(attempt_id));`);
  await env.DB.prepare("DELETE FROM pool_attempt_receipts").run();
  await env.DB.prepare("DELETE FROM pool_attempts").run();
  return env.DB;
}

it("commits a durable receipt once and replays the same receipt after an ambiguous timeout", async () => {
  const db = await freshDb();
  const identity = { taskId: "task-synthetic-1", attemptId: "attempt-synthetic-1", generation: 7 };
  expect(await claimAttempt(db, identity)).toEqual({ outcome: "ALLOW", status: "claimed" });

  const first = await commitAttemptReceipt(db, {
    ...identity,
    receipt: { sideEffectId: "synthetic-effect-1", result: "accepted" }
  });
  expect(first).toEqual({
    outcome: "COMMITTED",
    receipt: { sideEffectId: "synthetic-effect-1", result: "accepted" }
  });

  // Simulate the caller timing out after the durable commit and retrying.
  const replay = await commitAttemptReceipt(db, {
    ...identity,
    receipt: { sideEffectId: "different-retry-value", result: "must-not-replace" }
  });
  expect(replay).toEqual(first);

  const rows = await db.prepare(
    "SELECT COUNT(*) AS count FROM pool_attempt_receipts WHERE attempt_id = ?"
  ).bind(identity.attemptId).first();
  expect(rows.count).toBe(1);
});

it("rejects stale lease generations and mismatched task identities", async () => {
  const db = await freshDb();
  const identity = { taskId: "task-synthetic-2", attemptId: "attempt-synthetic-2", generation: 9 };
  expect(await claimAttempt(db, identity)).toEqual({ outcome: "ALLOW", status: "claimed" });

  expect(await claimAttempt(db, { ...identity, generation: 8 })).toEqual({
    outcome: "DENY", reason: "ATTEMPT_FENCE_MISMATCH"
  });
  expect(await claimAttempt(db, { ...identity, taskId: "other-task" })).toEqual({
    outcome: "DENY", reason: "ATTEMPT_FENCE_MISMATCH"
  });
  expect(await commitAttemptReceipt(db, {
    ...identity, generation: 8, receipt: { result: "stale" }
  })).toEqual({ outcome: "DENY", reason: "ATTEMPT_NOT_CLAIMED_OR_FENCED" });
});

it("keeps indeterminate attempts in needs_review without granting retry authority", async () => {
  const db = await freshDb();
  const identity = { taskId: "task-synthetic-3", attemptId: "attempt-synthetic-3", generation: 3 };
  expect(await claimAttempt(db, identity)).toEqual({ outcome: "ALLOW", status: "claimed" });
  expect(await markAttemptNeedsReview(db, identity)).toEqual({ outcome: "MARKED" });
  expect(await claimAttempt(db, identity)).toEqual({ outcome: "DENY", reason: "NEEDS_REVIEW" });
  expect(await commitAttemptReceipt(db, {
    ...identity, receipt: { result: "must-not-authorize" }
  })).toEqual({ outcome: "DENY", reason: "ATTEMPT_NOT_CLAIMED_OR_FENCED" });
});

it("serializes concurrent duplicate claims and commits one first-writer receipt", async () => {
  const db = await freshDb();
  const identity = { taskId: "task-synthetic-concurrent", attemptId: "attempt-synthetic-concurrent", generation: 12 };

  const claims = await Promise.all([
    claimAttempt(db, identity),
    claimAttempt(db, identity)
  ]);
  expect(claims).toEqual([
    { outcome: "ALLOW", status: "claimed" },
    { outcome: "ALLOW", status: "claimed" }
  ]);

  const results = await Promise.all([
    commitAttemptReceipt(db, {
      ...identity,
      receipt: { sideEffectId: "concurrent-effect-a", result: "writer-a" }
    }),
    commitAttemptReceipt(db, {
      ...identity,
      receipt: { sideEffectId: "concurrent-effect-b", result: "writer-b" }
    })
  ]);
  expect(results[0]).toEqual(results[1]);

  const rows = await db.prepare(
    "SELECT COUNT(*) AS count, MIN(receipt_json) AS receipt_json FROM pool_attempt_receipts WHERE attempt_id = ?"
  ).bind(identity.attemptId).first();
  expect(rows.count).toBe(1);
  expect(JSON.parse(rows.receipt_json)).toEqual(results[0].receipt);
  expect(["writer-a", "writer-b"]).toContain(results[0].receipt.result);
});
