import { createHash } from "node:crypto";

const OWNER_REPO = "VlDMlNSh/developer-cloud-pool";
const OWNER_LOGIN = "VlDMlNSh";
const CONTROL_ISSUE = 96;
const DEFAULT_BRANCH = "Основной";

function deny(reason) {
  return Object.freeze({ admitted: false, mode: "READ_ONLY_NO_DISPATCH", reason });
}

/**
 * Validates the trusted GitHub issue_comment event envelope only.
 * This is deliberately read-only: it does not call GitHub APIs, persist state,
 * inspect secrets, dispatch workflows, or authorize a child execution.
 */
export function evaluateNextEvent({ eventName, event, repository, ref, sha }) {
  if (eventName !== "issue_comment") return deny("EVENT_NOT_ISSUE_COMMENT");
  if (!event || event.action !== "created") return deny("COMMENT_NOT_NEW");
  if (!repository || repository.full_name !== OWNER_REPO) return deny("WRONG_REPOSITORY");
  if (repository.owner?.login !== OWNER_LOGIN) return deny("WRONG_REPOSITORY_OWNER");
  if (repository.default_branch !== DEFAULT_BRANCH) return deny("UNEXPECTED_DEFAULT_BRANCH");
  if (ref !== "refs/heads/" + DEFAULT_BRANCH) return deny("UNTRUSTED_WORKFLOW_REF");
  if (!/^[0-9a-f]{40}$/.test(String(sha || ""))) return deny("INVALID_EVENT_TARGET_SHA");

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
    mode: "READ_ONLY_NO_DISPATCH",
    sourceCommentId: comment.id,
    targetSha: sha,
    dispatchId,
    executionAuthorized: false
  });
}

if (process.env.GITHUB_EVENT_PATH) {
  const fs = await import("node:fs");
  const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
  const result = evaluateNextEvent({
    eventName: process.env.GITHUB_EVENT_NAME,
    event,
    repository: event.repository,
    ref: process.env.GITHUB_REF,
    sha: process.env.GITHUB_SHA
  });
  console.log(JSON.stringify(result));
  if (!result.admitted) process.exitCode = 0;
}
