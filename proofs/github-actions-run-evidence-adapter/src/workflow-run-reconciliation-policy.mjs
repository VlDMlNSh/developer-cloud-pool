/**
 * Workflow-run lifecycle evidence is not a claim-release or retry authority.
 * Every branch deliberately preserves the existing claim. A separate,
 * authenticated side-effect reconciler must decide any later terminal state.
 */
export function classifyWorkflowRunReconciliation(evidence) {
  const decision = evidence?.decision;
  if (decision === "TERMINAL_EXECUTOR_ONLY") {
    return Object.freeze({
      action: "HOLD_FOR_EFFECT_RECONCILIATION",
      claimDisposition: "CLAIMED",
      dispatch: false,
      retryAuthorized: false
    });
  }
  if (decision === "STILL_ACTIVE") {
    return Object.freeze({
      action: "KEEP_CLAIMED",
      claimDisposition: "CLAIMED",
      dispatch: false,
      retryAuthorized: false
    });
  }
  return Object.freeze({
    action: "KEEP_CLAIMED",
    claimDisposition: "CLAIMED",
    dispatch: false,
    retryAuthorized: false
  });
}
