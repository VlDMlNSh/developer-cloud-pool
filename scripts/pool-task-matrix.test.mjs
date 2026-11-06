import test from "node:test";
import assert from "node:assert/strict";
import { buildTaskMatrix } from "./pool-task-matrix.mjs";

const sha = "a".repeat(40);
function candidate(number = 7, overrides = {}) {
  const issue = {
    number,
    state: "open",
    body: "### Target SHA\n" + sha + "\n\n### Worker profile\nDSH headless probe\n",
    labels: [{ name: "pool:ready" }],
    ...overrides
  };
  return { issue, approval: { issueNumber: number, targetSha: sha, profile: "DSH headless probe" } };
}

test("builds a deterministic matrix for matching owner-approved tasks", () => {
  assert.deepEqual(buildTaskMatrix([candidate(7), candidate(8)]), {
    include: [
      { task_issue: "7", target_sha: sha, profile: "dsh-headless-probe" },
      { task_issue: "8", target_sha: sha, profile: "dsh-headless-probe" }
    ]
  });
});

test("allows an empty queue", () => assert.deepEqual(buildTaskMatrix([]), { include: [] }));

test("rejects non-array input and invalid bounds", () => {
  assert.throws(() => buildTaskMatrix(null), /array/);
  for (const maxTasks of [0, -1, 21, 1.5, "20"]) assert.throws(() => buildTaskMatrix([], { maxTasks }), /maxTasks/);
});

test("rejects more candidates than the configured bound", () => {
  assert.throws(() => buildTaskMatrix([candidate(1), candidate(2)], { maxTasks: 1 }), /exceeds/);
  assert.throws(() => buildTaskMatrix(Array.from({ length: 21 }, (_, i) => candidate(i + 1))), /exceeds/);
});

test("rejects duplicate issue numbers", () => assert.throws(() => buildTaskMatrix([candidate(7), candidate(7)]), /Duplicate/));

test("rejects closed issues, pull requests and issues without pool:ready", () => {
  assert.throws(() => buildTaskMatrix([candidate(7, { state: "closed" })]), /open issue/);
  assert.throws(() => buildTaskMatrix([candidate(7, { pull_request: {} })]), /open issue/);
  assert.throws(() => buildTaskMatrix([candidate(7, { labels: [] })]), /pool:ready/);
});

test("rejects malformed SHA and non-allowlisted profiles", () => {
  assert.throws(() => buildTaskMatrix([candidate(7, { body: "### Target SHA\nbad\n\n### Worker profile\nDSH headless probe" })]), /invalid task envelope/);
  assert.throws(() => buildTaskMatrix([candidate(7, { body: "### Target SHA\n" + sha + "\n\n### Worker profile\nother" })]), /invalid task envelope/);
});

test("rejects missing or mismatched owner approval envelope", () => {
  const item = candidate();
  assert.throws(() => buildTaskMatrix([{ issue: item.issue }]), /lacks a matching/);
  assert.throws(() => buildTaskMatrix([{ ...item, approval: { ...item.approval, targetSha: "b".repeat(40) } }]), /lacks a matching/);
  assert.throws(() => buildTaskMatrix([{ ...item, approval: { ...item.approval, issueNumber: 8 } }]), /lacks a matching/);
});

test("rejects invalid issue numbers", () => {
  assert.throws(() => buildTaskMatrix([candidate(0)]), /valid issue number/);
});
