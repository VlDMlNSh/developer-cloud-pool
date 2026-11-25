import fs from "node:fs";
import { pathToFileURL } from "node:url";

const EXPECTED_ISSUE = 96;
const EXPECTED_WORKFLOW_PATH = ".github/workflows/owner-next-event-audit.yml";

function fail(code) {
  return { status: "REJECTED", code, admission: "NOT_CREATED", dispatch: "NOT_AUTHORIZED" };
}

export function verifyOwnerNextEvent(input) {
  const { event, repository, issue, comment, workflowRun, workflow, defaultBranchRef, expected = {} } = input ?? {};
  const env = expected;
  if (!event || event.action !== "created" || env.eventName !== "issue_comment") return fail("EVENT_TYPE_OR_ACTION");
  if (!repository || !Number.isSafeInteger(repository.id) || !repository.owner || !Number.isSafeInteger(repository.owner.id)) return fail("REPOSITORY_IDENTITY_MISSING");
  if (event.repository?.id !== repository.id || event.repository?.owner?.id !== repository.owner.id) return fail("EVENT_REPOSITORY_IDENTITY_MISMATCH");
  if (repository.full_name !== env.repository || !repository.default_branch) return fail("REPOSITORY_NAME_OR_DEFAULT_BRANCH_MISMATCH");
  if (!issue || issue.number !== EXPECTED_ISSUE || issue.number !== event.issue?.number || issue.pull_request) return fail("ISSUE_IDENTITY_OR_PR_COMMENT");
  if (comment?.id !== event.comment?.id || !Number.isSafeInteger(comment?.id)) return fail("COMMENT_ID_MISMATCH");
  if (comment?.issue_url !== issue.url) return fail("COMMENT_PARENT_MISMATCH");
  if (comment?.body !== "/next" || event.comment?.body !== "/next") return fail("COMMENT_BODY_NOT_EXACT");
  if (comment?.user?.id !== repository.owner.id || event.comment?.user?.id !== repository.owner.id) return fail("COMMENT_AUTHOR_NOT_OWNER");
  if (comment?.author_association !== "OWNER") return fail("OWNER_ASSOCIATION_REQUIRED");
  if (event.sender?.id !== comment.user.id) return fail("EVENT_SENDER_MISMATCH");
  if (!workflowRun || workflowRun.id !== Number(env.runId) || workflowRun.run_attempt !== Number(env.runAttempt)) return fail("WORKFLOW_RUN_ID_OR_ATTEMPT_MISMATCH");
  if (workflowRun.run_attempt !== 1) return fail("RERUN_REQUIRES_DURABLE_RECONCILIATION");
  if (workflowRun.event !== "issue_comment" || workflowRun.path !== EXPECTED_WORKFLOW_PATH + "@" + repository.default_branch) return fail("WORKFLOW_EVENT_OR_PATH_MISMATCH");
  if (workflow?.path !== EXPECTED_WORKFLOW_PATH || workflow?.state !== "active" || workflow.id !== workflowRun.workflow_id) return fail("WORKFLOW_METADATA_MISMATCH");
  if (workflowRun.repository?.id !== repository.id) return fail("RUN_REPOSITORY_ID_MISMATCH");
  if (workflowRun.actor?.id !== comment.user.id) return fail("RUN_ACTOR_NOT_SOURCE_AUTHOR");
  if (workflowRun.head_branch !== repository.default_branch || env.ref !== "refs/heads/" + repository.default_branch) return fail("RUN_NOT_ON_DEFAULT_BRANCH");
  if (!/^[0-9a-f]{40}$/.test(workflowRun.head_sha ?? "") || workflowRun.head_sha !== env.sha || defaultBranchRef?.object?.sha !== env.sha) return fail("DEFAULT_BRANCH_SHA_NOT_PINNED");
  return {
    status: "OBSERVED_ONLY",
    admission: "NOT_CREATED",
    dispatch: "NOT_AUTHORIZED",
    source: { repositoryId: repository.id, ownerId: repository.owner.id, issueNumber: issue.number, commentId: comment.id },
    targetSha: workflowRun.head_sha,
    workflow: { id: workflow.id, path: workflow.path },
    run: { id: workflowRun.id, attempt: workflowRun.run_attempt }
  };
}

async function apiGet(path, token, apiUrl) {
  const response = await fetch(new URL(path, apiUrl), {
    headers: { accept: "application/vnd.github+json", authorization: "Bearer " + token, "x-github-api-version": "2022-11-28" }
  });
  if (!response.ok) throw new Error("GitHub API read failed with HTTP " + response.status);
  return response.json();
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const repositoryName = process.env.GITHUB_REPOSITORY;
  const runId = process.env.GITHUB_RUN_ID;
  const runAttempt = process.env.GITHUB_RUN_ATTEMPT;
  const eventName = process.env.GITHUB_EVENT_NAME;
  const eventPath = process.env.GITHUB_EVENT_PATH;
  const ref = process.env.GITHUB_REF;
  const sha = process.env.GITHUB_SHA;
  const apiUrl = process.env.GITHUB_API_URL || "https://api.github.com";
  if (!token || !repositoryName || !runId || !runAttempt || !eventPath || !ref || !sha) throw new Error("Required GitHub runtime metadata is missing.");
  const event = JSON.parse(fs.readFileSync(eventPath, "utf8"));
  const [repository, issue, comment, workflowRun] = await Promise.all([
    apiGet("/repos/" + repositoryName, token, apiUrl),
    apiGet("/repos/" + repositoryName + "/issues/" + EXPECTED_ISSUE, token, apiUrl),
    apiGet("/repos/" + repositoryName + "/issues/comments/" + event.comment?.id, token, apiUrl),
    apiGet("/repos/" + repositoryName + "/actions/runs/" + runId, token, apiUrl)
  ]);
  const [workflow, defaultBranchRef] = await Promise.all([
    apiGet("/repos/" + repositoryName + "/actions/workflows/" + workflowRun.workflow_id, token, apiUrl),
    apiGet("/repos/" + repositoryName + "/git/ref/heads/" + encodeURIComponent(repository.default_branch).replaceAll("%2F", "/"), token, apiUrl)
  ]);
  const result = verifyOwnerNextEvent({
    event, repository, issue, comment, workflowRun, workflow, defaultBranchRef,
    expected: { eventName, repository: repositoryName, runId, runAttempt, ref, sha }
  });
  if (result.status !== "OBSERVED_ONLY") throw new Error("Owner /next audit rejected: " + result.code);
  const summary = [
    "## Owner /next event provenance audit",
    "- Result: OBSERVED_ONLY",
    "- Source: repository ID " + result.source.repositoryId + ", owner ID " + result.source.ownerId + ", issue #" + result.source.issueNumber + ", comment ID " + result.source.commentId,
    "- Workflow: " + result.workflow.path + " (workflow ID " + result.workflow.id + ")",
    "- Run: " + result.run.id + ", attempt " + result.run.attempt,
    "- Target SHA: " + result.targetSha,
    "- Admission: NOT_CREATED",
    "- Outbox: NOT_CREATED",
    "- Dispatch: NOT_AUTHORIZED"
  ].join("\n") + "\n";
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  process.stdout.write("Owner /next event provenance verified; no admission or dispatch occurred.\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write("Owner /next audit failed closed: " + error.message + "\n");
    process.exitCode = 1;
  });
}
