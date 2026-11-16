import test from "node:test";
import assert from "node:assert/strict";
import { planWorkerMatrix } from "./pool-worker-matrix.mjs";

const sha = "a".repeat(40);
const envelope = profile => ["### Target SHA", sha, "", "### Worker profile", profile].join("\n");
const task = (number, overrides = {}) => ({
  number,
  state: "open",
  labels: [{ name: "pool:ready" }],
  body: envelope("DSH headless probe"),
  ...overrides
});

test("creates deterministic include matrix from valid ready task snapshots", () => {
  const result = planWorkerMatrix([task(7), task(8)]);
  assert.deepEqual(result.matrix.include, [
    { task_issue: "7", target_sha: sha, profile: "dsh-headless-probe" },
    { task_issue: "8", target_sha: sha, profile: "dsh-headless-probe" }
  ]);
  assert.equal(result.count, 2);
  assert.deepEqual(result.rejected, []);
});

test("rejects pull requests, closed issues, unclaimed readiness and invalid envelopes", () => {
  const result = planWorkerMatrix([
    task(1, { pull_request: { url: "https://example.invalid" } }),
    task(2, { state: "closed" }),
    task(3, { labels: [] }),
    task(4, { body: "no envelope" }),
    task(5, { body: envelope("Other profile") })
  ]);
  assert.deepEqual(result.matrix.include, []);
  assert.deepEqual(result.rejected.map(item => item.reason), [
    "pull-request-is-not-a-task",
    "task-issue-is-not-open",
    "task-is-not-ready",
    "target-sha-invalid-or-missing",
    "worker-profile-not-allowlisted"
  ]);
});

test("rejects malformed task identifiers without emitting matrix entries", () => {
  const result = planWorkerMatrix([{ ...task(0), number: 0 }, { ...task(6), number: "6" }]);
  assert.equal(result.count, 0);
  assert.equal(result.rejected.length, 2);
});

test("rejects duplicate issue IDs to avoid ambiguous fan-out", () => {
  assert.throws(() => planWorkerMatrix([task(9), task(9)]), /duplicate issue number/);
});

test("caps fan-out at twenty and reports overflow", () => {
  const result = planWorkerMatrix(Array.from({ length: 22 }, (_, index) => task(index + 1)));
  assert.equal(result.count, 20);
  assert.equal(result.rejected.length, 2);
  assert.ok(result.rejected.every(item => item.reason === "batch-capacity-exceeded"));
});

test("rejects unsafe batch limits", () => {
  for (const maxDispatch of [0, -1, 21, 1.5, "20"]) {
    assert.throws(() => planWorkerMatrix([], { maxDispatch }), /maxDispatch/);
  }
});
