import test from "node:test";
import assert from "node:assert/strict";
import { createBoundedGitHubApiGet, collectOwnerNextEnvelope, mapGitHubActionsContext } from "./owner-next-api-envelope.mjs";

const sha = "a".repeat(40);
const blobSha = "fef12251141e871adcbc3bbf627f163f3518a548";
const env = {
  GITHUB_REPOSITORY: "VlDMlNSh/developer-cloud-pool",
  GITHUB_EVENT_NAME: "issue_comment",
  GITHUB_REF: "refs/heads/Основной",
  GITHUB_SHA: sha,
  GITHUB_WORKFLOW_SHA: "b".repeat(40),
  GITHUB_WORKFLOW_REF: "VlDMlNSh/developer-cloud-pool/.github/workflows/next-event-controller.yml@refs/heads/Основной",
  GITHUB_RUN_ID: "400", GITHUB_RUN_ATTEMPT: "1", GITHUB_SERVER_URL: "https://github.com"
};
const event = {
  action: "created",
  issue: { number: 96, node_id: "I_kwDOTestIssue" },
  comment: { id: 300, node_id: "IC_kwDOTestComment", body: "/next",
    user: { id: 157891068 }, author_association: "OWNER" },
  sender: { id: 157891068 }
};
const workflowBytes = new TextEncoder().encode("name: controller\n");
async function gitBlobSha(bytes) {
  const header = new TextEncoder().encode("blob " + bytes.byteLength + "\0");
  const all = new Uint8Array(header.length + bytes.length); all.set(header); all.set(bytes, header.length);
  return [...new Uint8Array(await crypto.subtle.digest("SHA-1", all))].map(x => x.toString(16).padStart(2, "0")).join("");
}
const b64 = btoa(String.fromCharCode(...workflowBytes));

function apiFixture(overrides = {}) {
  const repo = { id: 1445644538, full_name: env.GITHUB_REPOSITORY, default_branch: "Основной",
    owner: { id: 157891068, login: "VlDMlNSh" } };
  const issue = { number: 96, node_id: "I_kwDOTestIssue",
    url: "https://api.github.com/repos/VlDMlNSh/developer-cloud-pool/issues/96" };
  const comment = { id: 300, node_id: "IC_kwDOTestComment", issue_url: issue.url,
    body: "/next", author_association: "OWNER", user: { id: 157891068 } };
  const run = { id: 400, run_attempt: 1, event: "issue_comment",
    path: ".github/workflows/next-event-controller.yml@Основной", workflow_id: 500,
    repository: { id: 1445644538 }, actor: { id: 157891068 },
    head_branch: "Основной", head_sha: sha };
  const workflow = { id: 500, path: ".github/workflows/next-event-controller.yml", state: "active" };
  const ref = { object: { sha } };
  const file = { path: ".github/workflows/next-event-controller.yml", encoding: "base64",
    content: b64, sha: blobSha };
  const fileResult = overrides.fileSha ? { ...file, sha: overrides.fileSha } : file;
  const refResult = overrides.refSha ? { object: { sha: overrides.refSha } } : ref;
  const runResult = overrides.run ? { ...run, ...overrides.run } : run;
  return async path => {
    if (path === "/repos/VlDMlNSh/developer-cloud-pool") return repo;
    if (path === "/repos/VlDMlNSh/developer-cloud-pool/issues/96") return issue;
    if (path === "/repos/VlDMlNSh/developer-cloud-pool/issues/comments/300") return comment;
    if (path === "/repos/VlDMlNSh/developer-cloud-pool/actions/runs/400") return runResult;
    if (path === "/repos/VlDMlNSh/developer-cloud-pool/actions/workflows/500") return workflow;
    if (path.includes("/git/ref/heads/")) return refResult;
    if (path.includes("/contents/.github/workflows/next-event-controller.yml?ref=" + sha)) return fileResult;
    throw new Error("unexpected API path: " + path);
  };
}

test("collects one canonical API-attested envelope with distinct target and workflow SHAs", async () => {
  const result = await collectOwnerNextEnvelope({ event, env, apiGet: apiFixture() });
  assert.equal(result.envelope.run.headSha, sha);
  assert.equal(result.envelope.run.workflowCommitSha, "b".repeat(40));
  assert.equal(result.envelope.run.workflowFileBlobSha, blobSha);
  assert.equal(result.envelope.run.workflowFileRefSha, sha);
  assert.equal(result.envelope.event.issueNodeId, "I_kwDOTestIssue");
  assert.equal(result.envelope.event.commentNodeId, "IC_kwDOTestComment");
  assert.equal(result.dispatch, false);
  assert.equal(result.executionAuthorized, false);
  const context = mapGitHubActionsContext({ event, env, envelope: result.envelope });
  assert.equal(context.workflowSha, "b".repeat(40));
});

test("rejects a default-ref race", async () => {
  await assert.rejects(
    collectOwnerNextEnvelope({ event, env, apiGet: apiFixture({ refSha: "d".repeat(40) }) }),
    /DEFAULT_REF_MOVED_DURING_RUN/
  );
});

test("rejects a workflow file blob digest mismatch", async () => {
  await assert.rejects(
    collectOwnerNextEnvelope({ event, env, apiGet: apiFixture({ fileSha: "d".repeat(40) }) }),
    /WORKFLOW_FILE_BLOB_DIGEST_MISMATCH/
  );
});

test("rejects a non-first workflow attempt", async () => {
  await assert.rejects(
    collectOwnerNextEnvelope({ event, env: { ...env, GITHUB_RUN_ATTEMPT: "2" }, apiGet: apiFixture() }),
    /RERUN_REQUIRES_DURABLE_RECONCILIATION/
  );
});

test("API transport pins origin and rejects paths outside the repository", async () => {
  const calls = [];
  const apiGet = createBoundedGitHubApiGet({
    token: "synthetic-test-token",
    fetchImpl: async url => {
      calls.push(String(url));
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
  });
  await apiGet("/repos/VlDMlNSh/developer-cloud-pool");
  assert.equal(new URL(calls[0]).origin, "https://api.github.com");
  await assert.rejects(apiGet("https://attacker.invalid/"), /GITHUB_API_PATH_NOT_ALLOWED/);
  await assert.rejects(apiGet("/repos/other/repo/issues/96"), /GITHUB_API_PATH_NOT_ALLOWED/);
  await assert.rejects(apiGet("/repos/VlDMlNSh/developer-cloud-pool/%2e%2e/other"), /GITHUB_API_PATH_NOT_ALLOWED/);
});

test("API transport rejects oversized bodies", async () => {
  const apiGet = createBoundedGitHubApiGet({
    token: "synthetic-test-token",
    fetchImpl: async () => new Response("x".repeat(256 * 1024 + 1), { status: 200 })
  });
  await assert.rejects(apiGet("/repos/VlDMlNSh/developer-cloud-pool"), /GITHUB_API_BODY_TOO_LARGE/);
});

test("API transport aborts a stalled request", async () => {
  const apiGet = createBoundedGitHubApiGet({
    token: "synthetic-test-token", timeoutMs: 5,
    fetchImpl: (_url, options) => new Promise((_resolve, reject) =>
      options.signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true }))
  });
  await assert.rejects(apiGet("/repos/VlDMlNSh/developer-cloud-pool"), /GITHUB_API_TIMEOUT/);
});

test("rejects duplicate/invalid source identities before API reads", async () => {
  await assert.rejects(
    collectOwnerNextEnvelope({ event: { ...event, comment: { ...event.comment, body: "/next " } }, env, apiGet: apiFixture() }),
    /SOURCE_EVENT_NOT_ALLOWED/
  );
});
