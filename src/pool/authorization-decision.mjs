/**
 * Pure authorization decision boundary.
 * This module does not perform GitHub API calls or consume approvals.
 * A caller may dispatch only after an external, durable consume operation
 * returns an unambiguous first-writer success.
 */
export function decidePoolAuthorization(input) {
  const deny = (reason) => ({ decision: "DENY", state: "pool:needs-review", dispatch: false, reason });
  if (!input || typeof input !== "object") return deny("INVALID_INPUT");
  const { caller, task, consume } = input;
  if (!caller || caller.repositoryId !== task?.repositoryId) return deny("CALLER_REPOSITORY_MISMATCH");
  if (caller.workflowRef !== task?.approvedWorkflowRef) return deny("CALLER_WORKFLOW_MISMATCH");
  if (caller.workflowSha !== task?.approvedWorkflowSha) return deny("CALLER_WORKFLOW_SHA_MISMATCH");
  if (!/^[0-9a-f]{40}$/.test(task?.targetSha || "")) return deny("INVALID_TARGET_SHA");
  if (!task?.approvalEventId || typeof task.approvalEventId !== "string") return deny("MISSING_APPROVAL_EVENT_ID");
  if (task.state !== "pool:ready") return deny("TASK_NOT_READY");
  if (task.profile !== "dsh-headless-probe") return deny("PROFILE_NOT_ALLOWLISTED");
  if (!consume || typeof consume.status !== "string") return deny("CONSUME_RESULT_MISSING");
  if (consume.status === "created" && consume.markerApprovalEventId === task.approvalEventId) {
    return { decision: "ALLOW_ONCE", state: "pool:claimed", dispatch: true, reason: "FIRST_CONSUME_CONFIRMED" };
  }
  if (consume.status === "exists") return deny("APPROVAL_ALREADY_CONSUMED");
  if (consume.status === "denied") return deny("CONSUME_DENIED");
  return deny("CONSUME_OUTCOME_AMBIGUOUS");
}
