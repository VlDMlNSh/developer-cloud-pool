import test from "node:test";
import assert from "node:assert/strict";
import { planClaimRecovery, planDispatchFailure } from "./pool-claim-recovery.mjs";

test("keeps a task claimed while its matching Worker run is active", () => {
  assert.equal(planClaimRecovery({ matchingRunStatus: "in_progress", ageMs: 60 * 60 * 1000 }).state, "claimed");
  assert.equal(planClaimRecovery({ matchingRunStatus: "queued", ageMs: 60 * 60 * 1000 }).action, "wait");
});

test("moves a task with a terminal Worker run to needs-review", () => {
  const result = planClaimRecovery({ matchingRunStatus: "completed", ageMs: 60 * 60 * 1000 });
  assert.equal(result.state, "needs-review");
  assert.equal(result.retryAllowed, false);
});

test("does not return an expired claim without a matching run to the ready queue", () => {
  const result = planClaimRecovery({ matchingRunStatus: null, ageMs: 16 * 60 * 1000 });
  assert.deepEqual(result, {
    state: "needs-review",
    action: "review",
    retryAllowed: false,
    reason: "claim-expired-without-provable-run"
  });
});

test("waits for a claim that is still inside its reconciliation window", () => {
  const result = planClaimRecovery({ matchingRunStatus: null, ageMs: 5 * 60 * 1000 });
  assert.equal(result.state, "claimed");
  assert.equal(result.action, "wait");
});

test("fails closed on unknown run status or invalid claim age", () => {
  assert.equal(planClaimRecovery({ matchingRunStatus: "unknown", ageMs: 1 }).state, "needs-review");
  assert.equal(planClaimRecovery({ matchingRunStatus: null, ageMs: Number.NaN }).state, "needs-review");
});

test("dispatch failure after claim requires review and never permits replay", () => {
  assert.deepEqual(planDispatchFailure(), {
    state: "needs-review",
    retryAllowed: false,
    reason: "dispatch-failed-after-claim"
  });
});
