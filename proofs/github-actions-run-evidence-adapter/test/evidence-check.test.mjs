import test from "node:test";
import assert from "node:assert/strict";
import { Octokit } from "@octokit/rest";
import { createWorkflowRunAttemptReader } from "../src/octokit-run-attempt-reader.mjs";
import { createWorkflowRunEvidenceCheck } from "../src/evidence-check.mjs";

const now = 1_800_000_000_000;
const binding = Object.freeze({
  repositoryId: 1445644538,
  runId: 987654321,
  runAttempt: 2,
  workflowId: 407204864,
  workflowPath: ".github/workflows/pool-worker.yml@refs/heads/main",
  event: "workflow_dispatch",
  headSha: "a".repeat(40),
  referencedWorkflows: []
});
const response = Object.freeze({
  id: binding.runId,
  run_attempt: binding.runAttempt,
  workflow_id: binding.workflowId,
  path: binding.workflowPath,
  event: binding.event,
  head_sha: binding.headSha,
  repository: { id: binding.repositoryId, full_name: "VlDMlNSh/developer-cloud-pool" },
  referenced_workflows: [],
  status: "completed",
  conclusion: "success"
});

function makeReader({ status = 200, payload = response, fail = false, requests = [] } = {}) {
  const octokit = new Octokit({
    request: {
      retries: 0,
      fetch: async (url, options = {}) => {
        requests.push({ url: String(url), method: options.method });
        if (fail) throw new TypeError("synthetic transport failure");
        return new Response(JSON.stringify(payload), {
          status,
          headers: { "content-type": "application/json" }
        });
      }
    }
  });
  return createWorkflowRunAttemptReader(octokit);
}

function makeCheck(options = {}) {
  const clockValues = [...(options.clockValues ?? [now - 1, now])];
  const clockCalls = [];
  const clock = options.clock ?? (() => {
    clockCalls.push(true);
    return clockValues.shift();
  });
  const requests = [];
  const reader = options.reader ?? makeReader({ ...options, requests });
  const check = createWorkflowRunEvidenceCheck({
    owner: "VlDMlNSh",
    repo: "developer-cloud-pool",
    repositoryId: binding.repositoryId,
    reader,
    clock
  });
  return { check, requests, clockCalls };
}

test("composes real Octokit response into pure verifier with host clock", async () => {
  const { check, requests, clockCalls } = makeCheck();
  const result = await check(binding);
  assert.equal(result.decision, "TERMINAL_EXECUTOR_ONLY");
  assert.equal(result.dispatch, false);
  assert.equal(result.retryAuthorized, false);
  assert.equal(result.sideEffects, "UNKNOWN");
  assert.equal(result.evidence.observedAtMs, now - 1);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].method, "GET");
  assert.equal(requests[0].url, "https://api.github.com/repos/VlDMlNSh/developer-cloud-pool/actions/runs/987654321/attempts/2");
  assert.equal(clockCalls.length, 2);
});

test("repository identity mismatch is rejected before transport or clock access", async () => {
  const { check, requests, clockCalls } = makeCheck();
  const result = await check({ ...binding, repositoryId: binding.repositoryId + 1 });
  assert.equal(result.decision, "UNRESOLVED");
  assert.equal(result.reason, "INVALID_EXPECTED_BINDING");
  assert.equal(requests.length, 0);
  assert.equal(clockCalls.length, 0);
});

test("transport failure maps to unresolved and never retries or samples caller time", async () => {
  const { check, requests, clockCalls } = makeCheck({ fail: true });
  const result = await check(binding);
  assert.equal(result.decision, "UNRESOLVED");
  assert.equal(result.reason, "TRANSPORT_FAILURE");
  assert.equal(requests.length, 1);
  assert.equal(clockCalls.length, 0);
});

test("HTTP errors are passed to verifier and fail closed", async () => {
  const { check } = makeCheck({ status: 403 });
  const result = await check(binding);
  assert.equal(result.decision, "UNRESOLVED");
  assert.equal(result.reason, "API_RESPONSE_NOT_AUTHORITATIVE");
});

test("stale or backwards trusted clock samples fail closed", async () => {
  const stale = makeCheck({ clockValues: [now - 60_000, now] });
  assert.equal((await stale.check(binding)).reason, "OBSERVATION_TIME_INVALID_OR_STALE");
  const backwards = makeCheck({ clockValues: [now + 1, now] });
  assert.equal((await backwards.check(binding)).reason, "OBSERVATION_TIME_INVALID_OR_STALE");
});

test("clock failure fails closed without local Date.now fallback", async () => {
  const { check } = makeCheck({ clock: () => { throw new Error("clock unavailable"); } });
  const result = await check(binding);
  assert.equal(result.decision, "UNRESOLVED");
  assert.equal(result.reason, "TRUSTED_CLOCK_FAILURE");
});

test("caller cannot supply an alternate repository or clock", async () => {
  let received;
  const reader = async (input) => {
    received = input;
    return { httpStatus: 200, response };
  };
  const { check } = makeCheck({ reader });
  await check({ ...binding, owner: "attacker", repo: "elsewhere", nowMs: now + 1e9, observedAtMs: now });
  assert.deepEqual(received, {
    owner: "VlDMlNSh",
    repo: "developer-cloud-pool",
    runId: binding.runId,
    runAttempt: binding.runAttempt
  });
});
