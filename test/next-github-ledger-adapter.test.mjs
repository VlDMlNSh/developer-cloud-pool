import test from "node:test";
import assert from "node:assert/strict";
import { makeLedgerRecord, parseLedgerComments } from "../scripts/next-dispatch-ledger.mjs";
import { reconcileNextLedgerEvent, deterministicControllerRunName, matchExactControllerRuns } from "../scripts/next-github-ledger-adapter.mjs";

const sourceCommentId = 123456789;
const targetSha = "9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc";
const trusted = body => ({ body, user: { login: "VlDMlNSh" }, author_association: "OWNER", issue_url: "https://api.github.com/repos/VlDMlNSh/developer-cloud-pool/issues/96" });
function fakeApi(seed = []) {
  const comments = seed.map(record => trusted("<!-- cloud-pool-next-ledger:v1 " + JSON.stringify(record) + " -->"));
  let runs = [];
  return {
    comments,
    setRuns(value) { runs = value; },
    async listIssueComments(issue) { assert.equal(issue, 96); return [...comments]; },
    async createIssueComment(issue, body) { assert.equal(issue, 96); comments.push(trusted(body)); },
    async listWorkflowRuns() { return [...runs]; }
  };
}
const record = state => makeLedgerRecord({ sourceCommentId, targetSha, state });
const expectedController = dispatchId => ({
  workflowId: 12345,
  path: ".github/workflows/cloud-pool-next-controller.yml",
  event: "issue_comment",
  repository: "VlDMlNSh/developer-cloud-pool",
  branch: "Основной",
  targetSha,
  displayTitle: deterministicControllerRunName(dispatchId)
});

test("requires repository-wide serialization lock", async () => {
  const result = await reconcileNextLedgerEvent({ sourceCommentId, targetSha, api: fakeApi(), lockHeld: false });
  assert.equal(result.action, "DENY");
});

test("first pass persists admission and stops before dispatch", async () => {
  const api = fakeApi();
  const result = await reconcileNextLedgerEvent({ sourceCommentId, targetSha, api, lockHeld: true });
  assert.equal(result.action, "ADMITTED");
  assert.equal(parseLedgerComments(api.comments).length, 1);
});

test("second pass persists intent but never dispatches", async () => {
  const api = fakeApi([record("ADMITTED")]);
  const result = await reconcileNextLedgerEvent({ sourceCommentId, targetSha, api, lockHeld: true });
  assert.equal(result.action, "DISPATCH_INTENT_RECORDED");
  assert.equal(result.dispatch, "NOT_PERFORMED");
  assert.equal(parseLedgerComments(api.comments).at(-1).state, "DISPATCH_INTENT");
});

test("append timeout reconciles a committed comment before returning", async () => {
  const api = fakeApi();
  const original = api.createIssueComment;
  api.createIssueComment = async (...args) => { await original(...args); throw new Error("timeout after commit"); };
  const result = await reconcileNextLedgerEvent({ sourceCommentId, targetSha, api, lockHeld: true });
  assert.equal(result.action, "ADMITTED");
});

test("append timeout without visible commit is ambiguous and never retried", async () => {
  const api = fakeApi();
  api.createIssueComment = async () => { throw new Error("timeout before commit"); };
  const result = await reconcileNextLedgerEvent({ sourceCommentId, targetSha, api, lockHeld: true });
  assert.equal(result.action, "AMBIGUOUS_APPEND");
});

test("intent with delayed run visibility returns no-retry ambiguity", async () => {
  const api = fakeApi([record("DISPATCH_INTENT")]);
  api.setRuns([]);
  const result = await reconcileNextLedgerEvent({ sourceCommentId, targetSha, api, lockHeld: true, expectedController: expectedController(record("DISPATCH_INTENT").dispatchId) });
  assert.equal(result.action, "AMBIGUOUS_NO_RETRY");
});

test("reconciles one visible deterministic controller run", async () => {
  const intent = record("DISPATCH_INTENT");
  const api = fakeApi([intent]);
  api.setRuns([{ id: 555, workflow_id: 12345, path: ".github/workflows/cloud-pool-next-controller.yml", event: "issue_comment", repository: { full_name: "VlDMlNSh/developer-cloud-pool" }, head_repository: { full_name: "VlDMlNSh/developer-cloud-pool" }, head_branch: "Основной", display_title: deterministicControllerRunName(intent.dispatchId), head_sha: targetSha }]);
  const result = await reconcileNextLedgerEvent({ sourceCommentId, targetSha, api, lockHeld: true, expectedController: expectedController(intent.dispatchId) });
  assert.equal(result.action, "RECONCILED");
  assert.equal(result.controllerRunId, 555);
});

test("duplicate visible controller runs are an incident", async () => {
  const intent = record("DISPATCH_INTENT");
  const run = { workflow_id: 12345, path: ".github/workflows/cloud-pool-next-controller.yml", event: "issue_comment", repository: { full_name: "VlDMlNSh/developer-cloud-pool" }, head_repository: { full_name: "VlDMlNSh/developer-cloud-pool" }, head_branch: "Основной", display_title: deterministicControllerRunName(intent.dispatchId), head_sha: targetSha };
  const api = fakeApi([intent]);
  api.setRuns([{ ...run, id: 555 }, { ...run, id: 556 }]);
  const result = await reconcileNextLedgerEvent({ sourceCommentId, targetSha, api, lockHeld: true, expectedController: expectedController(intent.dispatchId) });
  assert.equal(result.action, "INCIDENT");
});

test("run listing failure blocks without dispatch", async () => {
  const api = fakeApi([record("DISPATCH_INTENT")]);
  api.listWorkflowRuns = async () => { throw new Error("API unavailable"); };
  const result = await reconcileNextLedgerEvent({ sourceCommentId, targetSha, api, lockHeld: true });
  assert.equal(result.action, "BLOCKED");
});

test("requires complete approved workflow identity before reconciling a run", async () => {
  const intent = record("DISPATCH_INTENT");
  const api = fakeApi([intent]);
  api.setRuns([]);
  const result = await reconcileNextLedgerEvent({ sourceCommentId, targetSha, api, lockHeld: true });
  assert.equal(result.action, "BLOCKED");
  assert.equal(result.reason, "EXACT_CONTROLLER_IDENTITY_REQUIRED");
});

test("exact run matcher rejects same-title and same-SHA runs from the wrong workflow identity", () => {
  const expected = expectedController(record("DISPATCH_INTENT").dispatchId);
  const valid = {
    id: 555, workflow_id: expected.workflowId, path: expected.path, event: expected.event,
    repository: { full_name: expected.repository }, head_repository: { full_name: expected.repository },
    head_branch: expected.branch, head_sha: expected.targetSha, display_title: expected.displayTitle
  };
  assert.deepEqual(matchExactControllerRuns([valid], expected), [valid]);
  const mutations = [
    { workflow_id: expected.workflowId + 1 },
    { path: ".github/workflows/other.yml" },
    { event: "workflow_dispatch" },
    { repository: { full_name: "attacker/repo" } },
    { head_repository: { full_name: "attacker/repo" } },
    { head_branch: "attacker-branch" },
    { head_sha: "a".repeat(40) },
    { display_title: "forged title" }
  ];
  for (const patch of mutations) {
    const candidate = { ...valid, ...patch };
    assert.deepEqual(matchExactControllerRuns([candidate], expected), []);
  }
});

test("exact run matcher rejects incomplete or noncanonical expected identity", () => {
  assert.throws(() => matchExactControllerRuns([], null), /identity/);
  assert.throws(() => matchExactControllerRuns([], { workflowId: 1 }), /identity/);
});
