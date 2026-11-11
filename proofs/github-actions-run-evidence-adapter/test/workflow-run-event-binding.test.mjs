import test from "node:test";
import assert from "node:assert/strict";
import { deriveCompletedWorkflowRunBinding } from "../src/workflow-run-event-binding.mjs";

const expected = Object.freeze({
  repositoryId: 1445644538,
  workflowId: 407204864,
  workflowPath: ".github/workflows/pool-worker.yml@refs/heads/Основной",
  workflowEvent: "workflow_dispatch"
});
const referenced = Object.freeze([{
  path: "VlDMlNSh/developer-cloud-pool/.github/workflows/reusable.yml",
  ref: "refs/heads/Основной",
  sha: "b".repeat(40)
}]);
const run = Object.freeze({
  id: 987654321,
  run_attempt: 3,
  workflow_id: expected.workflowId,
  path: expected.workflowPath,
  event: expected.workflowEvent,
  status: "completed",
  conclusion: "success",
  head_sha: "a".repeat(40),
  repository: { id: expected.repositoryId },
  head_repository: { id: expected.repositoryId },
  referenced_workflows: referenced
});
const eventPayload = Object.freeze({
  action: "completed",
  repository: { id: expected.repositoryId },
  workflow_run: run
});
const derive = (patch = {}) => deriveCompletedWorkflowRunBinding({
  eventName: "workflow_run",
  eventPayload: { ...eventPayload, ...patch },
  expected
});

test("derives exact immutable attempt binding from completed native event", () => {
  const binding = derive();
  assert.deepEqual(binding, {
    repositoryId: expected.repositoryId,
    runId: run.id,
    runAttempt: 3,
    workflowId: expected.workflowId,
    workflowPath: expected.workflowPath,
    event: "workflow_dispatch",
    headSha: "a".repeat(40),
    referencedWorkflows: referenced
  });
  assert.equal(Object.isFrozen(binding), true);
  assert.equal(binding.runAttempt, 3);
});

test("rejects non-native event names, non-completed action and non-completed run", () => {
  assert.equal(deriveCompletedWorkflowRunBinding({
    eventName: "workflow_dispatch", eventPayload, expected
  }), null);
  assert.equal(derive({ action: "requested" }), null);
  assert.equal(derive({ workflow_run: { ...run, status: "in_progress" } }), null);
});

test("rejects repository and forked head-repository identity mismatches", () => {
  assert.equal(derive({ repository: { id: expected.repositoryId + 1 } }), null);
  assert.equal(derive({
    workflow_run: { ...run, repository: { id: expected.repositoryId + 1 } }
  }), null);
  assert.equal(derive({
    workflow_run: { ...run, head_repository: { id: expected.repositoryId + 1 } }
  }), null);
  assert.equal(derive({
    workflow_run: { ...run, head_repository: null }
  }), null);
});

test("rejects mismatched workflow identity, trigger, run ID, attempt and SHA", () => {
  for (const patch of [
    { workflow_id: expected.workflowId + 1 },
    { path: ".github/workflows/other.yml@refs/heads/Основной" },
    { event: "push" },
    { id: 0 },
    { run_attempt: 0 },
    { head_sha: "branch-name" },
    { referenced_workflows: null }
  ]) {
    assert.equal(derive({
      workflow_run: { ...run, ...patch }
    }), null, JSON.stringify(patch));
  }
});

test("deployment-pinned expected workflow configuration is mandatory", () => {
  for (const patch of [
    { repositoryId: 0 },
    { workflowId: 0 },
    { workflowPath: "pool-worker.yml" },
    { workflowEvent: "" }
  ]) {
    assert.equal(deriveCompletedWorkflowRunBinding({
      eventName: "workflow_run",
      eventPayload,
      expected: { ...expected, ...patch }
    }), null);
  }
});

test("caller cannot substitute expected configuration through event payload fields", () => {
  const binding = derive({
    expected: { repositoryId: 1, workflowId: 2 },
    owner: "attacker",
    repo: "other",
    run_attempt: 99
  });
  assert.equal(binding.repositoryId, expected.repositoryId);
  assert.equal(binding.workflowId, expected.workflowId);
  assert.equal(binding.runAttempt, run.run_attempt);
});
