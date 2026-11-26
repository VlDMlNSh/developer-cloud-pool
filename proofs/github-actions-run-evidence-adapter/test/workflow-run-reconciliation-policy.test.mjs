import test from "node:test";
import assert from "node:assert/strict";
import { classifyWorkflowRunReconciliation } from "../src/workflow-run-reconciliation-policy.mjs";

test("active workflow evidence preserves the claim and forbids dispatch/retry", () => {
  assert.deepEqual(classifyWorkflowRunReconciliation({ decision: "STILL_ACTIVE" }), {
    action: "KEEP_CLAIMED",
    claimDisposition: "CLAIMED",
    dispatch: false,
    retryAuthorized: false
  });
});

test("terminal executor evidence still requires separate effect reconciliation", () => {
  assert.deepEqual(classifyWorkflowRunReconciliation({
    decision: "TERMINAL_EXECUTOR_ONLY",
    sideEffects: "UNKNOWN",
    retryAuthorized: false
  }), {
    action: "HOLD_FOR_EFFECT_RECONCILIATION",
    claimDisposition: "CLAIMED",
    dispatch: false,
    retryAuthorized: false
  });
});

test("unresolved, malformed and unknown evidence never releases a claim", () => {
  for (const evidence of [
    { decision: "UNRESOLVED" },
    null,
    undefined,
    {},
    { decision: "READY" },
    { decision: "FAILED" }
  ]) {
    const result = classifyWorkflowRunReconciliation(evidence);
    assert.equal(result.claimDisposition, "CLAIMED");
    assert.equal(result.dispatch, false);
    assert.equal(result.retryAuthorized, false);
    assert.notEqual(result.action, "RELEASE_TO_READY");
  }
});

test("policy result is immutable", () => {
  assert.equal(Object.isFrozen(classifyWorkflowRunReconciliation({ decision: "UNRESOLVED" })), true);
});
