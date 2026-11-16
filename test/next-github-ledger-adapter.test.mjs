import test from "node:test";
import assert from "node:assert/strict";
import {
  reconcileNextLedgerEvent,
  deterministicControllerRunName,
  matchExactControllerRuns
} from "../scripts/next-github-ledger-adapter.mjs";

const targetSha = "9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc";
const dispatchId = "a".repeat(64);
const expected = {
  workflowId: 12345,
  path: ".github/workflows/cloud-pool-next-controller.yml",
  event: "issue_comment",
  repository: "VlDMlNSh/developer-cloud-pool",
  branch: "Основной",
  targetSha,
  displayTitle: deterministicControllerRunName(dispatchId)
};

test("runtime ledger reconciliation fails closed before any API access", async () => {
  let calls = 0;
  const api = {
    async listIssueComments() { calls += 1; return []; },
    async createIssueComment() { calls += 1; },
    async listWorkflowRuns() { calls += 1; return []; }
  };
  const result = await reconcileNextLedgerEvent({
    sourceCommentId: 123456789,
    targetSha,
    api,
    lockHeld: true
  });
  assert.deepEqual(result, { action: "BLOCKED", reason: "DURABLE_LOCK_NOT_IMPLEMENTED" });
  assert.equal(calls, 0);
});

test("runtime ledger reconciliation stays blocked without an API adapter", async () => {
  const result = await reconcileNextLedgerEvent({ lockHeld: true });
  assert.equal(result.reason, "DURABLE_LOCK_NOT_IMPLEMENTED");
});

test("deterministic controller run name requires a SHA-256 dispatch ID", () => {
  assert.equal(deterministicControllerRunName(dispatchId), "Cloud Pool /next " + dispatchId);
  assert.throws(() => deterministicControllerRunName("bad"), /dispatch ID/);
});

test("exact run matcher accepts only the complete expected workflow identity", () => {
  const valid = {
    id: 555,
    workflow_id: expected.workflowId,
    path: expected.path,
    event: expected.event,
    repository: { full_name: expected.repository },
    head_repository: { full_name: expected.repository },
    head_branch: expected.branch,
    head_sha: expected.targetSha,
    display_title: expected.displayTitle
  };
  assert.deepEqual(matchExactControllerRuns([valid], expected), [valid]);
  const mutations = [
    { workflow_id: expected.workflowId + 1 },
    { path: ".github/workflows/other.yml" },
    { event: "workflow_dispatch" },
    { repository: { full_name: "attacker/repo" } },
    { head_repository: { full_name: "attacker/repo" } },
    { head_branch: "attacker-branch" },
    { head_sha: "b".repeat(40) },
    { display_title: "forged title" }
  ];
  for (const patch of mutations) {
    assert.deepEqual(matchExactControllerRuns([{ ...valid, ...patch }], expected), []);
  }
});

test("exact run matcher rejects incomplete or noncanonical expected identity", () => {
  assert.throws(() => matchExactControllerRuns([], null), /identity/);
  assert.throws(() => matchExactControllerRuns([], { workflowId: 1 }), /identity/);
});
