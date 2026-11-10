import { readFileSync } from "node:fs";

const API_ROOT = "https://api.github.com";
const PROFILE = "dsh-headless-probe";

function deny(reason) {
  return Object.freeze({ decision: "DENY", dispatch: false, reason });
}
function validId(value) {
  return Number.isSafeInteger(value) && value > 0;
}
function parseCommand(body) {
  if (typeof body !== "string") return null;
  const match = /^POOL-APPROVE v1\ntarget_sha=([0-9a-f]{40})\nprofile=(dsh-headless-probe)\nnonce=([0-9a-f]{32,})$/.exec(body);
  return match ? Object.freeze({ targetSha: match[1], profile: match[2], nonce: match[3] }) : null;
}
function issueTuple(issue) {
  return { id: issue?.id, number: issue?.number, url: issue?.url, repository_url: issue?.repository_url, state: issue?.state, isPullRequest: Object.hasOwn(issue ?? {}, "pull_request") };
}
function commentTuple(comment) {
  return { id: comment?.id, url: comment?.url, html_url: comment?.html_url, body: comment?.body, user_id: comment?.user?.id, user_type: comment?.user?.type, created_at: comment?.created_at, updated_at: comment?.updated_at, issue_url: comment?.issue_url };
}
function sameTuple(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Read-only provenance verifier. No dispatch, storage, capability, provider,
 * model, or secret APIs are exposed. The caller must supply the native Actions
 * event and immutable context; the runner entrypoint should use readRunnerEvent.
 */
export async function verifyApprovalEvent({ event, context, octokit, policy }) {
  try {
    if (!event || !context || !octokit?.rest || !policy) return deny("MISSING_INPUT");
    if (context.eventName !== "issue_comment" || event.action !== "created") return deny("WRONG_EVENT");
    if (!event.repository || !event.issue || !event.comment || !event.sender) return deny("INCOMPLETE_EVENT");

    const owner = event.repository.owner?.login;
    const repo = event.repository.name;
    const fullName = event.repository.full_name;
    const issueNumber = event.issue.number;
    const commentId = event.comment.id;

    if (!owner || !repo || !validId(event.repository.id) || !validId(event.issue.id) ||
        !validId(issueNumber) || !validId(commentId) || !validId(event.sender.id) ||
        !validId(event.comment.user?.id)) return deny("INVALID_EVENT_IDENTIFIERS");
    if (Object.hasOwn(event.issue, "pull_request")) return deny("PULL_REQUEST_NOT_ALLOWED");
    if (fullName !== policy.expectedRepositoryFullName ||
        fullName !== context.repo?.owner + "/" + context.repo?.repo ||
        event.repository.id !== policy.expectedRepositoryId) return deny("REPOSITORY_MISMATCH");

    if (!validId(policy.expectedApproverNumericId) ||
        event.repository.owner?.type !== "User" ||
        event.repository.owner.id !== policy.expectedApproverNumericId ||
        event.sender.id !== policy.expectedApproverNumericId ||
        event.comment.user.id !== policy.expectedApproverNumericId ||
        event.comment.user.type !== "User") return deny("APPROVER_MISMATCH");

    if (!Array.isArray(policy.allowedIssueNumbers) ||
        !policy.allowedIssueNumbers.includes(issueNumber)) return deny("ISSUE_NOT_ALLOWLISTED");
    if (event.comment.created_at !== event.comment.updated_at ||
        typeof event.comment.body !== "string") return deny("EVENT_COMMENT_EDITED_OR_INVALID");

    const command = parseCommand(event.comment.body);
    if (!command) return deny("INVALID_APPROVAL_COMMAND");
    if (!/^[0-9a-f]{40}$/.test(policy.expectedTargetSha ?? "") ||
        command.targetSha !== policy.expectedTargetSha) return deny("TARGET_SHA_MISMATCH");
    if (command.profile !== PROFILE) return deny("PROFILE_NOT_ALLOWED");

    const responses = await Promise.all([
      octokit.rest.repos.get({ owner, repo }),
      octokit.rest.issues.get({ owner, repo, issue_number: issueNumber }),
      octokit.rest.issues.getComment({ owner, repo, comment_id: commentId })
    ]);
    const repository = responses[0]?.data;
    const issue = responses[1]?.data;
    const comment = responses[2]?.data;
    if (!repository || !issue || !comment) return deny("INCOMPLETE_API_RESPONSE");

    if (repository.id !== policy.expectedRepositoryId ||
        repository.full_name !== policy.expectedRepositoryFullName ||
        repository.owner?.id !== policy.expectedApproverNumericId ||
        repository.owner?.type !== "User") return deny("CANONICAL_REPOSITORY_MISMATCH");

    const expectedIssueUrl = API_ROOT + "/repos/" + owner + "/" + repo + "/issues/" + issueNumber;
    const expectedCommentUrl = API_ROOT + "/repos/" + owner + "/" + repo + "/issues/comments/" + commentId;
    const expectedCommentHtmlUrl = "https://github.com/" + owner + "/" + repo + "/issues/" + issueNumber + "#issuecomment-" + commentId;

    const firstIssueTuple = issueTuple(issue);
    const expectedIssue = {
      id: event.issue.id, number: issueNumber, url: expectedIssueUrl,
      repository_url: repository.url, state: "open", isPullRequest: false
    };
    if (!sameTuple(firstIssueTuple, expectedIssue)) return deny("CANONICAL_ISSUE_MISMATCH");

    const firstCommentTuple = commentTuple(comment);
    const expectedComment = {
      id: commentId, url: expectedCommentUrl, html_url: expectedCommentHtmlUrl,
      body: event.comment.body, user_id: policy.expectedApproverNumericId,
      user_type: "User", created_at: event.comment.created_at,
      updated_at: event.comment.created_at, issue_url: expectedIssueUrl
    };
    if (!sameTuple(firstCommentTuple, expectedComment)) return deny("CANONICAL_COMMENT_MISMATCH");

    const secondResponses = await Promise.all([
      octokit.rest.issues.get({ owner, repo, issue_number: issueNumber }),
      octokit.rest.issues.getComment({ owner, repo, comment_id: commentId })
    ]);
    const secondIssue = secondResponses[0]?.data;
    const secondComment = secondResponses[1]?.data;
    if (!secondIssue || !secondComment ||
        !sameTuple(issueTuple(secondIssue), firstIssueTuple) ||
        !sameTuple(commentTuple(secondComment), firstCommentTuple)) return deny("CANONICAL_RESOURCE_CHANGED");

    return Object.freeze({
      decision: "VERIFIED_EVENT_EVIDENCE",
      dispatch: false,
      evidence: Object.freeze({
        repositoryId: repository.id,
        repositoryFullName: repository.full_name,
        ownerNumericId: repository.owner.id,
        issueId: issue.id,
        issueNumber: issue.number,
        commentId: comment.id,
        commentUrl: comment.url,
        commentAuthorNumericId: comment.user.id,
        commentCreatedAt: comment.created_at,
        targetSha: command.targetSha,
        profile: command.profile,
        nonce: command.nonce
      })
    });
  } catch {
    return deny("API_READ_FAILED");
  }
}

export function readRunnerEvent(env = process.env) {
  if (env.GITHUB_EVENT_NAME !== "issue_comment" ||
      typeof env.GITHUB_EVENT_PATH !== "string" ||
      !env.GITHUB_EVENT_PATH.startsWith("/")) {
    throw new Error("Native GitHub Actions issue_comment event is unavailable");
  }
  const parsed = JSON.parse(readFileSync(env.GITHUB_EVENT_PATH, "utf8"));
  if (parsed?.action !== "created") throw new Error("Unexpected native event action");
  return parsed;
}
