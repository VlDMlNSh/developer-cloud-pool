/**
 * Pure fail-closed policy for reconciling a claimed task.
 *
 * A claim may only remain active while a matching Worker run is known to be
 * queued/in progress. Once an approval may have been consumed, absence of a
 * provable run is ambiguous and must require fresh owner approval.
 */
export function planClaimRecovery({ matchingRunStatus, ageMs, staleAfterMs = 15 * 60 * 1000 }) {
  if (matchingRunStatus === "queued" || matchingRunStatus === "in_progress") {
    return { state: "claimed", action: "wait", retryAllowed: false, reason: "worker-run-active" };
  }
  if (matchingRunStatus === "completed") {
    return { state: "needs-review", action: "review", retryAllowed: false, reason: "worker-run-terminal" };
  }
  if (matchingRunStatus !== null && matchingRunStatus !== undefined) {
    return { state: "needs-review", action: "review", retryAllowed: false, reason: "worker-run-status-unknown" };
  }
  if (!Number.isFinite(ageMs) || ageMs < 0) {
    return { state: "needs-review", action: "review", retryAllowed: false, reason: "claim-age-invalid" };
  }
  if (ageMs > staleAfterMs) {
    return { state: "needs-review", action: "review", retryAllowed: false, reason: "claim-expired-without-provable-run" };
  }
  return { state: "claimed", action: "wait", retryAllowed: false, reason: "claim-not-yet-stale" };
}

/** A consumed approval is never replayed after a dispatch attempt. */
export function planDispatchFailure() {
  return { state: "needs-review", retryAllowed: false, reason: "dispatch-failed-after-claim" };
}
