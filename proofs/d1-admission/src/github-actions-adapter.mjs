import { admitOwnerNextEvent } from "./admission.mjs";

const OWNER_REPO = "VlDMlNSh/developer-cloud-pool";
const OWNER_LOGIN = "VlDMlNSh";
const OWNER_ID = "157891068";
const REPOSITORY_ID = "1445644538";
const ISSUE_NUMBER = 96;
const ISSUE_URL = "https://api.github.com/repos/" + OWNER_REPO + "/issues/" + ISSUE_NUMBER;
const DEFAULT_BRANCH = "Основной";
const CONTROLLER_WORKFLOW_REF =
  OWNER_REPO + "/.github/workflows/cloud-pool-next-controller.yml@refs/heads/" + DEFAULT_BRANCH;
const SHA40 = /^[a-f0-9]{40}$/;
const NUMERIC = /^[0-9]+$/;

const deny = (reason) => ({
  decision: "DENY",
  dispatch: false,
  executionAuthorized: false,
  reason
});

function positiveInteger(value) {
  return NUMERIC.test(String(value ?? "")) &&
    Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

/**
 * Bind a GitHub Actions issue_comment payload to the runner-provided
 * GITHUB_* environment. Do not pass caller-selected target/run/workflow fields.
 *
 * GitHub documents these default variables as runner-provided values. For an
 * issue_comment event, GITHUB_SHA/GITHUB_REF resolve to the default branch.
 * This remains a composition proof: it is not a deployed webhook/controller
 * and does not itself perform GitHub API reads or cryptographic verification.
 */
export function bindGitHubActionsContext(event, environment, { approvalId, profile } = {}) {
  const env = environment ?? {};
  const repository = event?.repository;

  if (env.GITHUB_ACTIONS !== "true" ||
      env.GITHUB_SERVER_URL !== "https://github.com" ||
      env.RUNNER_ENVIRONMENT !== "github-hosted") {
    return deny("NOT_GITHUB_HOSTED_ACTIONS_CONTEXT");
  }
  if (env.GITHUB_EVENT_NAME !== "issue_comment" || event?.action !== "created") {
    return deny("EVENT_NOT_NEW_ISSUE_COMMENT");
  }

  if (env.GITHUB_REPOSITORY !== OWNER_REPO ||
      env.GITHUB_REPOSITORY_ID !== REPOSITORY_ID ||
      env.GITHUB_REPOSITORY_OWNER !== OWNER_LOGIN ||
      env.GITHUB_REPOSITORY_OWNER_ID !== OWNER_ID) {
    return deny("UNTRUSTED_RUN_REPOSITORY_IDENTITY");
  }
  if (!repository || repository.full_name !== env.GITHUB_REPOSITORY ||
      String(repository.id) !== env.GITHUB_REPOSITORY_ID ||
      repository.owner?.login !== env.GITHUB_REPOSITORY_OWNER ||
      String(repository.owner?.id) !== env.GITHUB_REPOSITORY_OWNER_ID ||
      repository.default_branch !== DEFAULT_BRANCH) {
    return deny("EVENT_RUN_REPOSITORY_IDENTITY_MISMATCH");
  }

  if (env.GITHUB_REF !== "refs/heads/" + DEFAULT_BRANCH) {
    return deny("UNTRUSTED_WORKFLOW_REF");
  }
  if (!SHA40.test(env.GITHUB_SHA ?? "") || !SHA40.test(env.GITHUB_WORKFLOW_SHA ?? "")) {
    return deny("INVALID_GITHUB_CONTEXT_SHA");
  }
  if (!positiveInteger(env.GITHUB_RUN_ID) || !positiveInteger(env.GITHUB_RUN_ATTEMPT)) {
    return deny("INVALID_WORKFLOW_RUN_IDENTITY");
  }
  if (env.GITHUB_WORKFLOW_REF !== CONTROLLER_WORKFLOW_REF) {
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
    eventName: env.GITHUB_EVENT_NAME,
    event,
    repository,
    ref: env.GITHUB_REF,
    targetSha: env.GITHUB_SHA,
    trustedDefaultHeadSha: env.GITHUB_SHA,
    controllerRunId: env.GITHUB_RUN_ID,
    controllerRunAttempt: env.GITHUB_RUN_ATTEMPT,
    controllerCodeSha: env.GITHUB_WORKFLOW_SHA,
    workflowRef: env.GITHUB_WORKFLOW_REF,
    approvalId,
    profile
  });
}

/** Compose GitHub Actions context binding with the local atomic D1 proof. */
export async function admitGitHubActionsEvent(db, event, environment, approval, now) {
  const input = bindGitHubActionsContext(event, environment, approval);
  if (input.decision === "DENY") return input;
  return admitOwnerNextEvent(db, input, now);
}
