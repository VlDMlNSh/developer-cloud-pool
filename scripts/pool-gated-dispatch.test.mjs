import test from "node:test";
import assert from "node:assert/strict";
import { planGatedDispatch, reconcileGatedDispatch } from "./pool-gated-dispatch.mjs";

const approved = {
  ownerApprovalAuthorized: true,
  environmentApproved: true,
  envelopeRevalidated: true,
  markerOutcome: "not-attempted",
  dispatchAttempted: false
};

test("waits for the Environment approval before creating a marker", () => {
  const result = planGatedDispatch({ ...approved, environmentApproved: false });
  assert.equal(result.state, "awaiting-owner-approval");
  assert.equal(result.createMarkerAllowed, false);
  assert.equal(result.dispatchAllowed, false);
});

test("rejects an untrusted or absent owner approval", () => {
  const result = planGatedDispatch({ ...approved, ownerApprovalAuthorized: false });
  assert.equal(result.state, "needs-review");
  assert.equal(result.reason, "owner-approval-not-authorized");
});

test("requires task envelope revalidation after Environment approval", () => {
  const result = planGatedDispatch({ ...approved, envelopeRevalidated: false });
  assert.equal(result.state, "needs-review");
  assert.equal(result.reason, "task-envelope-not-revalidated");
});

test("allows marker creation only after owner approval, Environment approval and revalidation", () => {
  const result = planGatedDispatch(approved);
  assert.equal(result.state, "ready-for-marker");
  assert.equal(result.createMarkerAllowed, true);
  assert.equal(result.dispatchAllowed, false);
});

test("allows one dispatch only when the marker was created in this attempt", () => {
  const result = planGatedDispatch({ ...approved, markerOutcome: "created" });
  assert.equal(result.state, "claimed");
  assert.equal(result.createMarkerAllowed, false);
  assert.equal(result.dispatchAllowed, true);
});

test("does not replay an approval whose marker already exists", () => {
  const result = planGatedDispatch({ ...approved, markerOutcome: "already-exists" });
  assert.equal(result.state, "needs-review");
  assert.equal(result.dispatchAllowed, false);
  assert.equal(result.reason, "approval-marker-already-consumed");
});

test("fails closed on ambiguous marker creation", () => {
  const result = planGatedDispatch({ ...approved, markerOutcome: "ambiguous" });
  assert.equal(result.state, "needs-review");
  assert.equal(result.dispatchAllowed, false);
});

test("fails closed when a dispatch attempt was already recorded", () => {
  const result = planGatedDispatch({ ...approved, markerOutcome: "created", dispatchAttempted: true });
  assert.equal(result.state, "needs-review");
  assert.equal(result.dispatchAllowed, false);
});

test("records a known Worker run after accepted dispatch", () => {
  assert.deepEqual(
    reconcileGatedDispatch({ dispatchAttempted: true, outcome: "accepted", workerRunId: 123456 }),
    { state: "running", retryAllowed: false, workerRunId: 123456, reason: "worker-run-identified" }
  );
});

test("does not retry a rejected dispatch after consuming the marker", () => {
  const result = reconcileGatedDispatch({ dispatchAttempted: true, outcome: "rejected" });
  assert.equal(result.state, "needs-review");
  assert.equal(result.retryAllowed, false);
});

test("does not retry an ambiguous dispatch outcome", () => {
  const result = reconcileGatedDispatch({ dispatchAttempted: true, outcome: "timeout" });
  assert.equal(result.state, "needs-review");
  assert.equal(result.retryAllowed, false);
});

test("does not infer success from an accepted response without a run ID", () => {
  const result = reconcileGatedDispatch({ dispatchAttempted: true, outcome: "accepted", workerRunId: null });
  assert.equal(result.state, "needs-review");
  assert.equal(result.retryAllowed, false);
});
