import { createHash } from "node:crypto";

const OWNER_REPO = "VlDMlNSh/developer-cloud-pool";
const CONTROL_ISSUE = 96;
const OWNER_LOGIN = "VlDMlNSh";
const DEFAULT_BRANCH = "Основной";

function deny(reason) {
  return Object.freeze({ admitted: false, reason });
}

/**
 * Pure, fail-closed admission predicate for the Cloud Pool /next control issue.
 * This function does not dispatch workflows, access secrets, or mutate state.
 */
export function evaluateNextAdmission({ eventName, event, repository, ref, sha }) {
  if (eventName !== "issue_comment") return deny("EVENT_NOT_ISSUE_COMMENT");
  if (!event || event.action !== "created") return deny("COMMENT_NOT_NEW");
  if (!repository || repository.full_name !== OWNER_REPO) return deny("WRONG_REPOSITORY");
  if (repository.owner?.login !== OWNER_LOGIN) return deny("WRONG_REPOSITORY_OWNER");
  if (repository.default_branch !== DEFAULT_BRANCH) return deny("UNEXPECTED_DEFAULT_BRANCH");
  if (ref !== "refs/heads/" + DEFAULT_BRANCH) return deny("UNTRUSTED_WORKFLOW_REF");

  if (!/^[0-9a-f]{40}$/.test(String(sha || ""))) return deny("INVALID_TARGET_SHA");

  const issue = event.issue;
  if (!issue || issue.pull_request || issue.number !== CONTROL_ISSUE) {
    return deny("WRONG_CONTROL_ISSUE");
  }
  if (issue.state !== "open") return deny("CONTROL_ISSUE_NOT_OPEN");

  const comment = event.comment;
  if (!comment || !Number.isSafeInteger(comment.id) || comment.id <= 0) {
    return deny("INVALID_SOURCE_COMMENT_ID");
  }
  if (comment.body !== "/next") return deny("COMMENT_BODY_NOT_EXACT");
  if (comment.user?.login !== OWNER_LOGIN || comment.author_association !== "OWNER") {
    return deny("COMMENT_AUTHOR_NOT_OWNER");
  }

  const dispatchId = createHash("sha256")
    .update(OWNER_REPO + ":" + CONTROL_ISSUE + ":" + String(comment.id))
    .digest("hex");

  return Object.freeze({
    admitted: true,
    sourceCommentId: comment.id,
    targetSha: sha,
    dispatchId
  });
}
