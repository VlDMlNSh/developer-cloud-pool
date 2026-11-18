import test from "node:test";
import assert from "node:assert/strict";
import { Octokit } from "@octokit/rest";
import { createWorkflowRunAttemptReader } from "../src/octokit-run-attempt-reader.mjs";

const payload = Object.freeze({
  id: 123456,
  run_attempt: 2,
  workflow_id: 654321,
  path: ".github/workflows/worker.yml@refs/heads/main",
  event: "workflow_dispatch",
  head_sha: "a".repeat(40),
  status: "completed",
  conclusion: "success",
  referenced_workflows: [],
  repository: { id: 987654, full_name: "acme/pool" }
});

function makeOctokit(fetchImpl) {
  return new Octokit({ request: { fetch: fetchImpl } });
}

test("real Octokit uses exactly one fixed attempt-specific GET with synthetic fetch", async () => {
  const requests = [];
  const fetchImpl = async (url, options = {}) => {
    requests.push({ url: String(url), method: options.method });
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };
  const reader = createWorkflowRunAttemptReader(makeOctokit(fetchImpl));
  const result = await reader({ owner: "acme", repo: "pool", runId: 123456, runAttempt: 2 });

  assert.equal(requests.length, 1);
  assert.equal(requests[0].method, "GET");
  assert.equal(requests[0].url, "https://api.github.com/repos/acme/pool/actions/runs/123456/attempts/2");
  assert.equal(result.httpStatus, 200);
  assert.deepEqual(result.response, payload);
});

test("HTTP authorization and missing-run errors preserve status without retry", async () => {
  for (const status of [403, 404, 429, 500]) {
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      return new Response(JSON.stringify({ message: "synthetic failure" }), {
        status,
        headers: { "content-type": "application/json" }
      });
    };
    const reader = createWorkflowRunAttemptReader(makeOctokit(fetchImpl));
    const result = await reader({ owner: "acme", repo: "pool", runId: 123456, runAttempt: 2 });
    assert.equal(result.httpStatus, status);
    assert.equal(calls, 1);
  }
});

test("network failure is propagated after one synthetic fetch; no retry occurs", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    throw new TypeError("synthetic network failure");
  };
  const reader = createWorkflowRunAttemptReader(makeOctokit(fetchImpl));
  await assert.rejects(
    reader({ owner: "acme", repo: "pool", runId: 123456, runAttempt: 2 }),
    /synthetic network failure/
  );
  assert.equal(calls, 1);
});

test("caller cannot override the fixed route, method, auth or request options", async () => {
  const requests = [];
  const reader = createWorkflowRunAttemptReader(makeOctokit(async (url, options = {}) => {
    requests.push({ url: String(url), method: options.method });
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  }));
  await assert.rejects(
    reader({ owner: "acme", repo: "pool", runId: 0, runAttempt: 2 }),
    /Invalid immutable workflow run identity/
  );
  const result = await reader({
    owner: "acme", repo: "pool", runId: 123456, runAttempt: 2,
    url: "https://attacker.invalid", method: "POST", auth: "untrusted"
  });
  assert.equal(result.httpStatus, 200);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].method, "GET");
  assert.equal(requests[0].url, "https://api.github.com/repos/acme/pool/actions/runs/123456/attempts/2");
});

test("reader requires an Octokit request client", () => {
  assert.throws(() => createWorkflowRunAttemptReader(null), /Octokit request client/);
  assert.throws(() => createWorkflowRunAttemptReader({ request: true }), /Octokit request client/);
});
