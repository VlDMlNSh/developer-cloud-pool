import test from "node:test";
import assert from "node:assert/strict";
import { verifyWorkflowRunAttempt } from "../src/verifier.mjs";

const nowMs = 1_800_000_000_000;
const binding = Object.freeze({
  repositoryId: 1445644538,
  runId: 987654321,
  runAttempt: 2,
  workflowId: 407204864,
  workflowPath: ".github/workflows/pool-worker.yml@refs/heads/main",
  event: "workflow_dispatch",
  headSha: "a".repeat(40)
});
const base = Object.freeze({
  id: binding.runId,
  run_attempt: binding.runAttempt,
  workflow_id: binding.workflowId,
  path: binding.workflowPath,
  event: binding.event,
  head_sha: binding.headSha,
  repository: { id: binding.repositoryId, full_name: "VlDMlNSh/developer-cloud-pool" },
  referenced_workflows: [],
  status: "completed",
  conclusion: "success",
  run_started_at: "2026-11-10T10:00:00Z",
  run_completed_at: "2026-11-10T10:01:00Z"
});
const verify = (overrides = {}) => verifyWorkflowRunAttempt({
  httpStatus: 200,
  response: base,
  binding,
  observedAtMs: nowMs - 1000,
  nowMs,
  ...overrides
});

test("matching attempt yields lifecycle evidence only, never retry or dispatch", () => {
  const result = verify();
  assert.equal(result.decision, "TERMINAL_EXECUTOR_ONLY");
  assert.equal(result.dispatch, false);
  assert.equal(result.retryAuthorized, false);
  assert.equal(result.sideEffects, "UNKNOWN");
  assert.equal(result.evidence.runAttempt, 2);
});
test("exact run_attempt is mandatory even when run_id matches", () => {
  assert.equal(verify({ response: { ...base, run_attempt: 1 } }).reason, "RUN_ATTEMPT_MISMATCH");
});
test("rejects repository, run, workflow id, workflow path, event and SHA mismatches", () => {
  const cases = [
    [{ id: base.id + 1 }, "RUN_ID_MISMATCH"],
    [{ repository: { id: binding.repositoryId + 1 } }, "REPOSITORY_ID_MISMATCH"],
    [{ workflow_id: binding.workflowId + 1 }, "WORKFLOW_ID_MISMATCH"],
    [{ path: ".github/workflows/other.yml@refs/heads/main" }, "WORKFLOW_PATH_MISMATCH"],
    [{ event: "push" }, "EVENT_MISMATCH"],
    [{ head_sha: "b".repeat(40) }, "HEAD_SHA_MISMATCH"]
  ];
  for (const [patch, reason] of cases) {
    assert.equal(verify({ response: { ...base, ...patch } }).reason, reason);
  }
});
test("queued, in-progress, waiting, requested and pending are nonterminal", () => {
  for (const status of ["queued", "in_progress", "waiting", "requested", "pending"]) {
    const result = verify({ response: { ...base, status, conclusion: null } });
    assert.equal(result.decision, "STILL_ACTIVE", status);
    assert.equal(result.dispatch, false);
  }
});
test("completed conclusions are lifecycle evidence, not side-effect evidence", () => {
  for (const conclusion of ["success", "failure", "cancelled", "skipped", "neutral", "timed_out", "action_required", "stale", "startup_failure"]) {
    const result = verify({ response: { ...base, conclusion } });
    assert.equal(result.decision, "TERMINAL_EXECUTOR_ONLY", conclusion);
    assert.equal(result.sideEffects, "UNKNOWN", conclusion);
    assert.equal(result.retryAuthorized, false, conclusion);
  }
});
test("requires exact referenced workflow path, ref and SHA bindings", () => {
  const referenced = {
    path: "VlDMlNSh/developer-cloud-pool/.github/workflows/reusable.yml",
    ref: "refs/heads/main",
    sha: "c".repeat(40)
  };
  const expected = { ...binding, referencedWorkflows: [referenced] };
  const response = { ...base, referenced_workflows: [referenced] };
  assert.equal(verify({ binding: expected, response }).decision, "TERMINAL_EXECUTOR_ONLY");
  assert.equal(verify({ binding: expected, response: { ...response, referenced_workflows: [] } }).reason, "REFERENCED_WORKFLOWS_MISMATCH");
  assert.equal(verify({ binding: expected, response: { ...response, referenced_workflows: [{ ...referenced, sha: "d".repeat(40) }] } }).reason, "REFERENCED_WORKFLOWS_MISMATCH");
  assert.equal(verify({ response: { ...base, referenced_workflows: [{ ...referenced, ref: "" }] } }).reason, "INVALID_REFERENCED_WORKFLOWS");
  const shaPinned = {
    path: "VlDMlNSh/developer-cloud-pool/.github/workflows/pinned.yml@sha",
    sha: "e".repeat(40)
  };
  assert.equal(verify({
    binding: { ...binding, referencedWorkflows: [shaPinned] },
    response: { ...base, referenced_workflows: [shaPinned] }
  }).decision, "TERMINAL_EXECUTOR_ONLY");
});
test("unknown statuses and conclusions fail closed", () => {
  assert.equal(verify({ response: { ...base, status: "future_state" } }).reason, "UNKNOWN_RUN_STATUS");
  assert.equal(verify({ response: { ...base, conclusion: "future_conclusion" } }).reason, "UNKNOWN_OR_MISSING_RUN_CONCLUSION");
  assert.equal(verify({ response: { ...base, conclusion: null } }).decision, "UNRESOLVED");
});
test("API errors, rate limits, missing and incomplete payloads are unresolved", () => {
  for (const httpStatus of [0, 403, 404, 429, 500]) {
    assert.equal(verify({ httpStatus }).decision, "UNRESOLVED", String(httpStatus));
  }
  assert.equal(verify({ response: null }).decision, "UNRESOLVED");
  assert.equal(verify({ response: { ...base, repository: null } }).decision, "UNRESOLVED");
});
test("stale, future and invalid observations are unresolved", () => {
  assert.equal(verify({ observedAtMs: nowMs - 60_000 }).reason, "OBSERVATION_TIME_INVALID_OR_STALE");
  assert.equal(verify({ observedAtMs: nowMs + 1 }).reason, "OBSERVATION_TIME_INVALID_OR_STALE");
  assert.equal(verify({ nowMs: Number.NaN }).decision, "UNRESOLVED");
});
test("invalid expected bindings fail closed", () => {
  assert.equal(verify({ binding: { ...binding, runAttempt: 0 } }).decision, "UNRESOLVED");
  assert.equal(verify({ binding: { ...binding, headSha: "branch-name" } }).decision, "UNRESOLVED");
});
test("result exposes no token, raw payload, dispatch capability or mutable reference", () => {
  const result = verify();
  assert.equal(Object.hasOwn(result, "token"), false);
  assert.equal(Object.hasOwn(result, "rawResponse"), false);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.evidence), true);
});
