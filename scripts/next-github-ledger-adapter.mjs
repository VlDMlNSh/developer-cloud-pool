const OWNER_REPO = "VlDMlNSh/developer-cloud-pool";
const CONTROL_ISSUE = 96;
const DEFAULT_BRANCH = "Основной";


/**
 * Correlates a controller run only when all workflow identity fields match.
 * Expected identity must come from the approved workflow contract.
 */
export function matchExactControllerRuns(runs, expected) {
  if (!expected || !Number.isSafeInteger(expected.workflowId) || expected.workflowId <= 0 ||
      typeof expected.path !== "string" || !expected.path.startsWith(".github/workflows/") ||
      typeof expected.event !== "string" || !expected.event ||
      expected.repository !== OWNER_REPO || expected.branch !== DEFAULT_BRANCH ||
      !/^[0-9a-f]{40}$/.test(String(expected.targetSha || "")) ||
      typeof expected.displayTitle !== "string" || !expected.displayTitle) {
    throw new TypeError("Complete approved controller workflow identity is required.");
  }
  return (runs || []).filter(run =>
    Number.isSafeInteger(run?.id) && run.id > 0 &&
    run.workflow_id === expected.workflowId &&
    run.path === expected.path &&
    run.event === expected.event &&
    run.repository?.full_name === expected.repository &&
    run.head_repository?.full_name === expected.repository &&
    run.head_branch === expected.branch &&
    run.head_sha === expected.targetSha &&
    run.display_title === expected.displayTitle
  );
}

export function deterministicControllerRunName(dispatchId) {
  if (!/^[0-9a-f]{64}$/.test(String(dispatchId || ""))) {
    throw new TypeError("Invalid dispatch ID.");
  }
  return "Cloud Pool /next " + dispatchId;
}

/**
 * Runtime reconciliation remains disabled until a durable, owner-authenticated
 * lease with monotonic fencing and crash recovery exists. A caller-provided
 * Boolean or Actions concurrency group is not sufficient lock evidence.
 */
export async function reconcileNextLedgerEvent() {
  return Object.freeze({ action: "BLOCKED", reason: "DURABLE_LOCK_NOT_IMPLEMENTED" });
}
