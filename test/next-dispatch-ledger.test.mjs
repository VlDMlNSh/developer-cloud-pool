import test from "node:test";
import assert from "node:assert/strict";
import {
  makeLedgerRecord, encodeLedgerComment, parseLedgerComments,
  planNextDispatch, authorizeSingleDispatch
} from "../scripts/next-dispatch-ledger.mjs";

const sourceCommentId = 987654321;
const targetSha = "9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc";
const admitted = makeLedgerRecord({ sourceCommentId, targetSha, state: "ADMITTED" });
const intent = makeLedgerRecord({ sourceCommentId, targetSha, state: "DISPATCH_INTENT" });

test("ledger comment round-trips a digest-checked write-ahead record", () => {
  const body = encodeLedgerComment(admitted);
  const records = parseLedgerComments([{ body }]);
  assert.deepEqual(records, [admitted]);
});

test("rejects tampered ledger data", () => {
  const body = encodeLedgerComment(admitted).replace(targetSha, "3d84f04bbc28385fe4da0cbdf47535a01eb9be1b");
  assert.throws(() => parseLedgerComments([{ body }]), /integrity|corrupted/i);
});

test("requires serialized controller lock", () => {
  assert.equal(planNextDispatch({ sourceCommentId, targetSha, records: [], lockHeld: false }).action, "DENY");
});

test("first event requires durable admission before any dispatch", () => {
  const plan = planNextDispatch({ sourceCommentId, targetSha, records: [], lockHeld: true });
  assert.equal(plan.action, "PERSIST_ADMISSION");
  assert.equal(plan.record.state, "ADMITTED");
});

test("admitted event requires a persisted dispatch-intent marker", () => {
  const plan = planNextDispatch({ sourceCommentId, targetSha, records: [admitted], lockHeld: true });
  assert.equal(plan.action, "PERSIST_DISPATCH_INTENT");
  assert.equal(plan.record.state, "DISPATCH_INTENT");
});

test("only the same invocation that persisted intent can dispatch once", () => {
  assert.deepEqual(
    authorizeSingleDispatch({ record: intent, appendConfirmed: true, sameInvocation: true }),
    { allowed: true, dispatchId: intent.dispatchId, targetSha, maxAttempts: 1 }
  );
  assert.equal(authorizeSingleDispatch({ record: intent, appendConfirmed: true, sameInvocation: false }).allowed, false);
  assert.equal(authorizeSingleDispatch({ record: intent, appendConfirmed: false, sameInvocation: true }).allowed, false);
});

test("recovery reconciles a visible run and never dispatches again", () => {
  const result = planNextDispatch({
    sourceCommentId, targetSha, records: [intent], lockHeld: true,
    observedRuns: [{ dispatchId: intent.dispatchId, targetSha, runId: 444 }]
  });
  assert.equal(result.action, "RECONCILED");
  assert.equal(result.controllerRunId, 444);
});

test("recovery with an intent but no visible run is ambiguous and must not retry", () => {
  const result = planNextDispatch({ sourceCommentId, targetSha, records: [intent], lockHeld: true });
  assert.equal(result.action, "AMBIGUOUS_NO_RETRY");
});

test("duplicate ledger rows and duplicate matching runs fail closed", () => {
  assert.equal(planNextDispatch({ sourceCommentId, targetSha, records: [intent, intent], lockHeld: true }).action, "DENY");
  assert.equal(planNextDispatch({
    sourceCommentId, targetSha, records: [intent], lockHeld: true,
    observedRuns: [
      { dispatchId: intent.dispatchId, targetSha, runId: 444 },
      { dispatchId: intent.dispatchId, targetSha, runId: 445 }
    ]
  }).action, "INCIDENT");
});

test("source comment cannot be rebound to another target SHA", () => {
  const result = planNextDispatch({
    sourceCommentId, targetSha: "3d84f04bbc28385fe4da0cbdf47535a01eb9be1b",
    records: [intent], lockHeld: true
  });
  assert.equal(result.action, "DENY");
  assert.equal(result.reason, "SOURCE_COMMENT_BINDING_CONFLICT");
});
