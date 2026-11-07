/**
 * Pure planning/reconciliation helpers for the proposed Environment + immutable
 * consume-marker flow. These helpers do not call GitHub or authorize production
 * execution. The caller must obtain all booleans/outcomes from trusted evidence.
 */

export function planGatedDispatch({
  ownerApprovalAuthorized,
  environmentApproved,
  envelopeRevalidated,
  markerOutcome,
  dispatchAttempted = false
}) {
  const deny = reason => ({
    state: "needs-review",
    createMarkerAllowed: false,
    dispatchAllowed: false,
    reason
  });

  if (ownerApprovalAuthorized !== true) return deny("owner-approval-not-authorized");
  if (environmentApproved !== true) {
    return {
      state: "awaiting-owner-approval",
      createMarkerAllowed: false,
      dispatchAllowed: false,
      reason: "environment-approval-not-confirmed"
    };
  }
  if (envelopeRevalidated !== true) return deny("task-envelope-not-revalidated");
  if (dispatchAttempted === true) return deny("dispatch-attempt-already-recorded");

  if (markerOutcome === "not-attempted") {
    return {
      state: "ready-for-marker",
      createMarkerAllowed: true,
      dispatchAllowed: false,
      reason: "validated-and-gated"
    };
  }
  if (markerOutcome === "created") {
    return {
      state: "claimed",
      createMarkerAllowed: false,
      dispatchAllowed: true,
      reason: "single-use-marker-created-in-this-attempt"
    };
  }
  if (markerOutcome === "already-exists") {
    return deny("approval-marker-already-consumed");
  }
  if (markerOutcome === "ambiguous") {
    return deny("marker-creation-outcome-ambiguous");
  }
  if (markerOutcome === "denied") {
    return deny("marker-creation-denied");
  }
  return deny("marker-outcome-invalid");
}

/**
 * Reconcile a dispatch result after the consume marker has been created.
 * Any uncertain outcome is terminal for this approval: never replay it.
 */
export function reconcileGatedDispatch({ dispatchAttempted, outcome, workerRunId }) {
  if (dispatchAttempted !== true) {
    return { state: "needs-review", retryAllowed: false, reason: "dispatch-not-proven-attempted" };
  }
  if (outcome === "accepted" && Number.isSafeInteger(workerRunId) && workerRunId > 0) {
    return {
      state: "running",
      retryAllowed: false,
      workerRunId,
      reason: "worker-run-identified"
    };
  }
  if (outcome === "rejected") {
    return { state: "needs-review", retryAllowed: false, reason: "dispatch-rejected-after-consumption" };
  }
  return { state: "needs-review", retryAllowed: false, reason: "dispatch-outcome-ambiguous" };
}
