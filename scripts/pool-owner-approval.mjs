const APPROVAL_COMMAND = /^\/pool approve issue=(\d+) sha=([0-9a-f]{40}) profile=(dsh-headless-probe) envelope=([0-9a-f]{64})$/;

export function parseOwnerApproval({
  comment,
  ownerId,
  issueNumber,
  targetSha,
  profile,
  envelopeSha256,
  consumedCommentIds = []
}) {
  const failures = [];
  const reject = reason => failures.push(reason);

  if (!comment || typeof comment !== "object") {
    return { authorized: false, failures: ["approval comment is missing"] };
  }
  if (!Number.isSafeInteger(ownerId) || ownerId <= 0) reject("trusted owner ID is invalid");
  if (!Number.isSafeInteger(comment.id) || comment.id <= 0) reject("comment ID is invalid");
  if (!Number.isSafeInteger(comment.user?.id) || comment.user.id <= 0) {
    reject("comment author ID is missing or invalid");
  } else if (comment.user.id !== ownerId) {
    reject("comment author is not the repository owner");
  }

  if (!Number.isSafeInteger(issueNumber) || issueNumber <= 0) reject("trusted issue number is invalid");
  if (!/^[0-9a-f]{40}$/.test(targetSha || "")) reject("expected target SHA is invalid");
  if (profile !== "dsh-headless-probe") reject("expected profile is not allowlisted");
  if (!/^[0-9a-f]{64}$/.test(envelopeSha256 || "")) reject("expected envelope digest is invalid");

  if (typeof comment.created_at !== "string" || Number.isNaN(Date.parse(comment.created_at))) {
    reject("comment creation timestamp is missing or invalid");
  }
  if (comment.updated_at !== comment.created_at) {
    reject("approval comment was edited or update timestamp is unavailable");
  }
  if (consumedCommentIds.some(id => id === comment.id)) {
    reject("approval comment ID was already consumed");
  }

  const body = typeof comment.body === "string" ? comment.body : "";
  const match = body.match(APPROVAL_COMMAND);
  if (!match) {
    reject("approval command does not match the strict format");
  } else {
    if (Number(match[1]) !== issueNumber) reject("approval issue number mismatch");
    if (match[2] !== targetSha) reject("approval target SHA mismatch");
    if (match[3] !== profile) reject("approval profile mismatch");
    if (match[4] !== envelopeSha256) reject("approval envelope digest mismatch");
  }

  if (failures.length) return { authorized: false, failures };
  return {
    authorized: true,
    approval: {
      commentId: comment.id,
      ownerId,
      issueNumber,
      targetSha,
      profile,
      envelopeSha256,
      createdAt: comment.created_at
    },
    failures: []
  };
}

/**
 * Pure fail-closed transition helper. The caller must supply a trusted consumed-ID
 * ledger and serialize updates externally. This function is not a transaction,
 * durable store, compare-and-swap, or exactly-once guarantee.
 */
export function planApprovalConsumption({ parsedApproval, taskState, dispatchAttempted }) {
  if (!parsedApproval?.authorized || !parsedApproval.approval) {
    return { state: "needs-review", dispatchAllowed: false, reason: "approval-not-authorized" };
  }
  if (dispatchAttempted === true) {
    return { state: "needs-review", dispatchAllowed: false, reason: "dispatch-outcome-may-be-ambiguous" };
  }
  if (taskState !== "submitted" && taskState !== "needs-review") {
    return { state: "needs-review", dispatchAllowed: false, reason: "task-state-not-approvable" };
  }
  return {
    state: "claimed",
    dispatchAllowed: true,
    consumeCommentId: parsedApproval.approval.commentId,
    reason: "validated-owner-approval"
  };
}
