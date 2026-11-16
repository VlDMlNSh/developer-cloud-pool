import { createHash } from "node:crypto";

const OWNER_REPO = "VlDMlNSh/developer-cloud-pool";
const OWNER_LOGIN = "VlDMlNSh";
const OWNER_NUMERIC_ID = 157891068;
const REPOSITORY_NUMERIC_ID = 1445644538;
const CONTROL_ISSUE = 96;
const CONTROL_ISSUE_API_URL = "https://api.github.com/repos/" + OWNER_REPO + "/issues/" + CONTROL_ISSUE;
const DEFAULT_BRANCH = "Основной";

function deny(reason) {
  return Object.freeze({ admitted: false, mode: "READ_ONLY_NO_DISPATCH", executionAuthorized: false, reason });
}

/**
 * Read-only validation of GitHub's issue_comment webhook envelope.
 * Numeric repository/user IDs supplement login checks so a renamed or
 * lookalike account/repository cannot satisfy the owner boundary.
 * No storage, secret access, API mutation, or workflow dispatch occurs here.
 */
export function evaluateNextEvent({ eventName, event, repository, ref, sha }) {
  if (eventName !== "issue_comment") return deny("EVENT_NOT_ISSUE_COMMENT");
  if (!event || event.action !== "created") return deny("COMMENT_NOT_NEW");
  if (!repository || repository.full_name !== OWNER_REPO) return deny("WRONG_REPOSITORY");
  if (repository.id !== REPOSITORY_NUMERIC_ID) return deny("WRONG_REPOSITORY_ID");
  if (repository.owner?.login !== OWNER_LOGIN || repository.owner?.id !== OWNER_NUMERIC_ID) {
    return deny("WRONG_REPOSITORY_OWNER");
  }
  if (repository.default_branch !== DEFAULT_BRANCH) return deny("UNEXPECTED_DEFAULT_BRANCH");
  if (ref !== "refs/heads/" + DEFAULT_BRANCH) return deny("UNTRUSTED_WORKFLOW_REF");
  if (!/^[0-9a-f]{40}$/.test(String(sha || ""))) return deny("INVALID_EVENT_TARGET_SHA");

  const issue = event.issue;
  if (!issue || issue.pull_request || issue.number !== CONTROL_ISSUE) return deny("WRONG_CONTROL_ISSUE");
  if (issue.state !== "open") return deny("CONTROL_ISSUE_NOT_OPEN");
  if (issue.repository_url !== CONTROL_ISSUE_API_URL) return deny("WRONG_CONTROL_ISSUE_REPOSITORY");

  const comment = event.comment;
  if (!comment || !Number.isSafeInteger(comment.id) || comment.id <= 0) {
    return deny("INVALID_SOURCE_COMMENT_ID");
  }
  if (comment.body !== "/next") return deny("COMMENT_BODY_NOT_EXACT");
  if (comment.user?.login !== OWNER_LOGIN || comment.user?.id !== OWNER_NUMERIC_ID ||
      comment.author_association !== "OWNER") return deny("COMMENT_AUTHOR_NOT_OWNER");

  const dispatchId = createHash("sha256")
    .update(OWNER_REPO + ":" + CONTROL_ISSUE + ":" + String(comment.id))
    .digest("hex");

  return Object.freeze({
    admitted: true,
    mode: "READ_ONLY_NO_DISPATCH",
    executionAuthorized: false,
    sourceCommentId: comment.id,
    targetSha: sha,
    dispatchId
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
