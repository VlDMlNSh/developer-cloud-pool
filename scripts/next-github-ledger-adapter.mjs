import {
  encodeLedgerComment,
  parseLedgerComments,
  planNextDispatch
} from "./next-dispatch-ledger.mjs";

const OWNER_REPO = "VlDMlNSh/developer-cloud-pool";
const CONTROL_ISSUE = 96;

export function deterministicControllerRunName(dispatchId) {
  if (!/^[0-9a-f]{64}$/.test(String(dispatchId || ""))) {
    throw new TypeError("Invalid dispatch ID.");
  }
  return "Cloud Pool /next " + dispatchId;
}

/**
 * Executes only durable ledger operations under a caller-provided,
 * repository-wide Actions concurrency lock. It never dispatches workflows.
 *
 * api.listIssueComments(issueNumber)
 * api.createIssueComment(issueNumber, body)
 * api.listWorkflowRuns()
 */
export async function reconcileNextLedgerEvent({
  sourceCommentId,
  targetSha,
  api,
  lockHeld
}) {
  if (lockHeld !== true) {
    return Object.freeze({ action: "DENY", reason: "SERIAL_CONTROLLER_LOCK_REQUIRED" });
  }
  if (!api || typeof api.listIssueComments !== "function" ||
      typeof api.createIssueComment !== "function" ||
      typeof api.listWorkflowRuns !== "function") {
    return Object.freeze({ action: "DENY", reason: "GITHUB_ADAPTER_INCOMPLETE" });
  }

  const readRecords = async () =>
    parseLedgerComments(await api.listIssueComments(CONTROL_ISSUE));

  let records;
  try {
    records = await readRecords();
  } catch {
    return Object.freeze({ action: "BLOCKED", reason: "LEDGER_READ_FAILED" });
  }

  const append = async record => {
    const body = encodeLedgerComment(record);
    try {
      await api.createIssueComment(CONTROL_ISSUE, body);
      return Object.freeze({ confirmed: true });
    } catch {
      // A timed-out POST may have committed. Re-read before deciding.
      let after;
      try { after = await readRecords(); }
      catch {
        return Object.freeze({ confirmed: false, ambiguous: true, reason: "APPEND_OUTCOME_UNREADABLE" });
      }
      const matches = after.filter(item =>
        item.sourceCommentId === record.sourceCommentId &&
        item.targetSha === record.targetSha &&
        item.state === record.state &&
        item.recordDigest === record.recordDigest
      );
      if (matches.length === 1) return Object.freeze({ confirmed: true, recovered: true });
      if (matches.length > 1) return Object.freeze({ confirmed: false, ambiguous: true, reason: "DUPLICATE_LEDGER_APPEND" });
      return Object.freeze({ confirmed: false, ambiguous: true, reason: "APPEND_OUTCOME_UNKNOWN" });
    }
  };

  const initial = planNextDispatch({
    sourceCommentId, targetSha, records, lockHeld: true
  });

  if (initial.action === "PERSIST_ADMISSION") {
    const result = await append(initial.record);
    return result.confirmed
      ? Object.freeze({ action: "ADMITTED", dispatchId: initial.record.dispatchId, targetSha })
      : Object.freeze({ action: "AMBIGUOUS_APPEND", reason: result.reason });
  }
  if (initial.action === "DENY" || initial.action === "INCIDENT") return initial;

  if (initial.action === "PERSIST_DISPATCH_INTENT") {
    const result = await append(initial.record);
    return result.confirmed
      ? Object.freeze({
          action: "DISPATCH_INTENT_RECORDED",
          dispatchId: initial.record.dispatchId,
          targetSha,
          controllerRunName: deterministicControllerRunName(initial.record.dispatchId),
          dispatch: "NOT_PERFORMED"
        })
      : Object.freeze({ action: "AMBIGUOUS_APPEND", reason: result.reason });
  }

  if (initial.action === "RECONCILED") return initial;

  const current = records.find(item => item.sourceCommentId === sourceCommentId);
  if (!current || current.state !== "DISPATCH_INTENT") {
    return Object.freeze({ action: "BLOCKED", reason: "UNEXPECTED_LEDGER_STATE" });
  }

  let visibleRuns;
  try { visibleRuns = await api.listWorkflowRuns(); }
  catch {
    return Object.freeze({ action: "BLOCKED", reason: "WORKFLOW_RUN_LIST_FAILED" });
  }
  const expectedName = deterministicControllerRunName(current.dispatchId);
  const matches = (visibleRuns || []).filter(run =>
    run?.display_title === expectedName && run?.head_sha === current.targetSha
  );
  const plan = planNextDispatch({
    sourceCommentId, targetSha, records,
    observedRuns: matches.map(run => ({
      dispatchId: current.dispatchId,
      targetSha: current.targetSha,
      runId: run.id
    })),
    lockHeld: true
  });
  if (plan.action === "RECONCILED") return plan;
  if (plan.action === "INCIDENT") return plan;
  return Object.freeze({
    action: "AMBIGUOUS_NO_RETRY",
    reason: "DISPATCH_INTENT_WITHOUT_UNIQUE_VISIBLE_RUN",
    dispatchId: current.dispatchId,
    targetSha: current.targetSha
  });
}
