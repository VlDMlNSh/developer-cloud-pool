import test from "node:test";
import assert from "node:assert/strict";
import { createGithubLedgerApi, reconcileVerifiedOwnerNextEvent } from "../scripts/next-github-api-adapter.mjs";
import { makeLedgerRecord, parseLedgerComments } from "../scripts/next-dispatch-ledger.mjs";

const sha = "9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc";
const sourceCommentId = 123456789;
const issue = { number: 96, state: "open" };
const comment = {
  id: sourceCommentId, body: "/next", user: { login: "VlDMlNSh" },
  author_association: "OWNER",
  issue_url: "https://api.github.com/repos/VlDMlNSh/developer-cloud-pool/issues/96"
};
function response(payload, status = 200) {
  return { ok: status >= 200 && status < 300, status, async text() { return JSON.stringify(payload); } };
}
function mockFetch(handler) {
  const calls = [];
  const fn = async (url, options = {}) => {
    calls.push({ url, options });
    return handler(url, options);
  };
  fn.calls = calls;
  return fn;
}
function apiFor({ issueValue = issue, commentValue = comment, defaultSha = sha, comments = [], runs = [] } = {}) {
  const fetchImpl = mockFetch(async (url, options) => {
    if (url.includes("/issues/96/comments?")) return response(comments);
    if (url.endsWith("/issues/96/comments") && options.method === "POST") {
      comments.push({ body: JSON.parse(options.body).body, user: { login: "VlDMlNSh" }, author_association: "OWNER", issue_url: "https://api.github.com/repos/VlDMlNSh/developer-cloud-pool/issues/96" });
      return response({ id: 987 });
    }
    if (url.includes("/actions/runs?")) return response({ workflow_runs: runs });
    if (url.endsWith("/issues/96")) return response(issueValue);
    if (url.endsWith("/issues/comments/" + sourceCommentId)) return response(commentValue);
    if (url.includes("/git/ref/heads/")) return response({ object: { sha: defaultSha } });
    return response({ message: "not found" }, 404);
  });
  return { api: createGithubLedgerApi({ token: "test-token", fetchImpl }), fetchImpl };
}

test("GitHub adapter paginates issue comments until a short page", async () => {
  const page1 = Array.from({ length: 100 }, (_, i) => ({ id: i + 1, body: "ordinary" }));
  const fetchImpl = mockFetch(async url => {
    if (url.endsWith("page=1")) return response(page1);
    return response([{ id: 101, body: "last" }]);
  });
  const api = createGithubLedgerApi({ token: "test-token", fetchImpl });
  const result = await api.listIssueComments(96);
  assert.equal(result.length, 101);
  assert.equal(fetchImpl.calls.length, 2);
  assert.match(fetchImpl.calls[1].url, /page=2$/);
});

test("GitHub adapter paginates workflow runs across pages", async () => {
  const page1 = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }));
  const fetchImpl = mockFetch(async url => url.endsWith("page=1")
    ? response({ workflow_runs: page1 })
    : response({ workflow_runs: [{ id: 101 }] }));
  const api = createGithubLedgerApi({ token: "test-token", fetchImpl });
  assert.equal((await api.listWorkflowRuns()).length, 101);
});

test("GitHub adapter refuses unexpected issue and malformed ledger writes", async () => {
  const { api } = apiFor();
  assert.throws(() => api.listIssueComments(95), /Unexpected control issue/);
  await assert.rejects(() => api.createIssueComment(96, "not a ledger"), /Invalid ledger comment/);
});

test("verified event reconciliation fails closed before any GitHub API lookup", async () => {
  const { api, fetchImpl } = apiFor();
  const result = await reconcileVerifiedOwnerNextEvent({
    sourceCommentId, targetSha: sha, api, lockHeld: true
  });
  assert.deepEqual(result, { action: "BLOCKED", reason: "DURABLE_LOCK_NOT_IMPLEMENTED" });
  assert.equal(fetchImpl.calls.length, 0);
});
