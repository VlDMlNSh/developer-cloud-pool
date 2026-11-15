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
      comments.push({ body: JSON.parse(options.body).body });
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

test("verified event admits only exact owner /next on open control issue at current default SHA", async () => {
  const { api } = apiFor();
  const result = await reconcileVerifiedOwnerNextEvent({ sourceCommentId, targetSha: sha, api, lockHeld: true });
  assert.equal(result.action, "ADMITTED");
  const records = parseLedgerComments(await api.listIssueComments(96));
  assert.equal(records.length, 1);
  assert.equal(records[0].sourceCommentId, sourceCommentId);
});

test("rejects non-owner source comment", async () => {
  const { api } = apiFor({ commentValue: { ...comment, author_association: "CONTRIBUTOR" } });
  const result = await reconcileVerifiedOwnerNextEvent({ sourceCommentId, targetSha: sha, api, lockHeld: true });
  assert.equal(result.reason, "COMMENT_AUTHOR_NOT_OWNER");
});

test("rejects comment whose body is not exact /next", async () => {
  const { api } = apiFor({ commentValue: { ...comment, body: "/next now" } });
  const result = await reconcileVerifiedOwnerNextEvent({ sourceCommentId, targetSha: sha, api, lockHeld: true });
  assert.equal(result.reason, "COMMENT_BODY_NOT_EXACT");
});

test("rejects comment bound to another issue", async () => {
  const { api } = apiFor({ commentValue: { ...comment, issue_url: "https://api.github.com/repos/VlDMlNSh/developer-cloud-pool/issues/95" } });
  const result = await reconcileVerifiedOwnerNextEvent({ sourceCommentId, targetSha: sha, api, lockHeld: true });
  assert.equal(result.reason, "SOURCE_COMMENT_NOT_BOUND_TO_CONTROL_ISSUE");
});

test("rejects stale target SHA", async () => {
  const { api } = apiFor({ defaultSha: "a".repeat(40) });
  const result = await reconcileVerifiedOwnerNextEvent({ sourceCommentId, targetSha: sha, api, lockHeld: true });
  assert.equal(result.reason, "TARGET_SHA_NOT_CURRENT_DEFAULT_HEAD");
});

test("rejects closed control issue", async () => {
  const { api } = apiFor({ issueValue: { ...issue, state: "closed" } });
  const result = await reconcileVerifiedOwnerNextEvent({ sourceCommentId, targetSha: sha, api, lockHeld: true });
  assert.equal(result.reason, "CONTROL_ISSUE_NOT_OPEN_OR_NOT_ISSUE");
});

test("API failures fail closed before ledger mutation", async () => {
  const fetchImpl = mockFetch(async () => response({ message: "forbidden" }, 403));
  const api = createGithubLedgerApi({ token: "test-token", fetchImpl });
  const result = await reconcileVerifiedOwnerNextEvent({ sourceCommentId, targetSha: sha, api, lockHeld: true });
  assert.equal(result.reason, "SOURCE_AUTHORITY_LOOKUP_FAILED");
  assert.equal(fetchImpl.calls.some(call => call.options.method === "POST"), false);
});

test("requires serialized lock before any API lookup", async () => {
  const { api, fetchImpl } = apiFor();
  const result = await reconcileVerifiedOwnerNextEvent({ sourceCommentId, targetSha: sha, api, lockHeld: false });
  assert.equal(result.reason, "SERIAL_CONTROLLER_LOCK_REQUIRED");
  assert.equal(fetchImpl.calls.length, 0);
});

test("refuses a source ID outside the positive safe integer range", async () => {
  const { api } = apiFor();
  assert.throws(() => api.getSourceComment(Number.MAX_SAFE_INTEGER + 1), /Invalid source comment ID/);
});

test("ledger records returned from the real adapter remain parseable", async () => {
  const { api } = apiFor();
  await api.createIssueComment(96, "<!-- cloud-pool-next-ledger:v1 " + JSON.stringify(makeLedgerRecord({ sourceCommentId, targetSha: sha, state: "ADMITTED" })) + " -->");
  assert.equal(parseLedgerComments(await api.listIssueComments(96)).length, 1);
});
