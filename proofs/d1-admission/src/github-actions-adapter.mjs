import { admitOwnerNextEvent } from "./admission.mjs";

const OWNER_REPO = "VlDMlNSh/developer-cloud-pool";
const OWNER_LOGIN = "VlDMlNSh";
const OWNER_ID = "157891068";
const REPOSITORY_ID = "1445644538";
const ISSUE_NUMBER = 96;
const ISSUE_URL = "https://api.github.com/repos/" + OWNER_REPO + "/issues/" + ISSUE_NUMBER;
const DEFAULT_BRANCH = "Основной";
const SHA40 = /^[a-f0-9]{40}$/;
const NUMERIC = /^[0-9]+$/;

const deny = (reason) => ({
  decision: "DENY",
  dispatch: false,
  executionAuthorized: false,
  reason
});

/**
 * Bind admission fields to the GitHub Actions event/run context.
 *
 * The caller cannot supply targetSha, trustedDefaultHeadSha, controllerRunId,
 * or controllerCodeSha independently: those values are derived from the
 * GitHub-provided context fields. This is a composition boundary for a
 * trusted default-branch workflow, not cryptographic webhook verification
 * and not proof that a live workflow has been deployed.
 */
export function bindGitHubActionsContext(context, { approvalId, profile } = {}) {
  const {
    eventName, event, ref, sha, runId, runAttempt, workflowRef, workflowSha
  } = context ?? {};
  const repository = event?.repository;

  if (eventName !== "issue_comment" || event?.action !== "created") {
    return deny("EVENT_NOT_NEW_ISSUE_COMMENT");
  }
  if (!repository || repository.full_name !== OWNER_REPO ||
      String(repository.id) !== REPOSITORY_ID) {
    return deny("WRONG_REPOSITORY");
  }
  if (repository.owner?.login !== OWNER_LOGIN ||
      String(repository.owner?.id) !== OWNER_ID ||
      repository.default_branch !== DEFAULT_BRANCH) {
    return deny("WRONG_REPOSITORY_OWNER_OR_DEFAULT_BRANCH");
  }
  if (ref !== "refs/heads/" + DEFAULT_BRANCH) {
    return deny("UNTRUSTED_WORKFLOW_REF");
  }
  if (!SHA40.test(sha ?? "") || !SHA40.test(workflowSha ?? "")) {
    return deny("INVALID_GITHUB_CONTEXT_SHA");
  }
  if (!NUMERIC.test(String(runId ?? "")) || Number(runId) <= 0 ||
      !NUMERIC.test(String(runAttempt ?? "")) || Number(runAttempt) <= 0) {
    return deny("INVALID_WORKFLOW_RUN_IDENTITY");
  }
  const workflowPrefix = OWNER_REPO + "/.github/workflows/";
  if (typeof workflowRef !== "string" ||
      !workflowRef.startsWith(workflowPrefix) ||
      !workflowRef.endsWith("@refs/heads/" + DEFAULT_BRANCH)) {
    return deny("UNTRUSTED_WORKFLOW_REF_IDENTITY");
  }
  if (typeof approvalId !== "string" || approvalId.length < 1 || approvalId.length > 128) {
    return deny("INVALID_APPROVAL_ID");
  }
  if (profile !== "dsh-headless-probe") return deny("PROFILE_NOT_ALLOWED");

  const issue = event.issue;
  if (!issue || issue.pull_request || issue.number !== ISSUE_NUMBER ||
      issue.state !== "open" || issue.repository_url !== ISSUE_URL) {
    return deny("WRONG_CONTROL_ISSUE");
  }
  const comment = event.comment;
  if (!Number.isSafeInteger(comment?.id) || comment.id <= 0 || comment.body !== "/next") {
    return deny("INVALID_SOURCE_COMMENT");
  }
  if (comment.user?.login !== OWNER_LOGIN ||
      String(comment.user?.id) !== OWNER_ID ||
      comment.author_association !== "OWNER") {
    return deny("COMMENT_AUTHOR_NOT_OWNER");
  }

  return Object.freeze({
    eventName,
    event,
    repository,
    ref,
    targetSha: sha,
    trustedDefaultHeadSha: sha,
    controllerRunId: String(runId),
    controllerCodeSha: workflowSha,
    approvalId,
    profile
  });
}

/** Compose trusted GitHub Actions context binding with the atomic D1 proof. */
export async function admitGitHubActionsEvent(db, context, approval, now) {
  const input = bindGitHubActionsContext(context, approval);
  if (input.decision === "DENY") return input;
  return admitOwnerNextEvent(db, input, now);
}
