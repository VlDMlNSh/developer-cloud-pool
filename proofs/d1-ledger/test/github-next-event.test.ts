import { describe, expect, it } from "vitest";
import { env } from "cloudflare:workers";
import { bindGitHubNextEvent } from "../src/github-next-event.mjs";

const sha = "a".repeat(40);
const workflowSha = "b".repeat(40);
const valid = {
  githubActions: "true", serverUrl: "https://github.com",
  eventName: "issue_comment", eventAction: "created",
  repository: "VlDMlNSh/developer-cloud-pool", repositoryId: "1445644538",
  ownerNumericId: "157891068", ownerLogin: "VlDMlNSh",
  actorId: "157891068", actorLogin: "VlDMlNSh",
  ref: "refs/heads/Основной", sha,
  workflowRef: "VlDMlNSh/developer-cloud-pool/.github/workflows/next-event-controller.yml@refs/heads/Основной",
  workflowSha, runId: 123456, runAttempt: 1,
  issueNumber: 96, isPullRequest: false, commentId: 987654,
  commentBody: "/next", commentUserId: "157891068",
  commentUserLogin: "VlDMlNSh", commentAuthorAssociation: "OWNER"
};

describe("GitHub owner /next event context", () => {
  it("binds the exact owner-created issue_comment event to trusted workflow code", async () => {
    const result = await bindGitHubNextEvent(valid);
    expect(result).toMatchObject({
      decision: "BOUND", dispatch: false, executionAuthorized: false,
      context: {
        sourceCommentId: "987654", repositoryId: "1445644538",
        ownerNumericId: "157891068", issueNumber: 96,
        eventName: "issue_comment", eventAction: "created",
        actorNumericId: "157891068", authorAssociation: "OWNER",
        ref: "refs/heads/Основной", targetSha: sha, workflowSha,
        profile: "jarvis-code-sandbox-v1"
      }
    });
    expect(result.context.eventDigest).toMatch(/^[a-f0-9]{64}$/);
  });

  it("keeps event target SHA and workflow-code SHA as distinct provenance fields", async () => {
    const result = await bindGitHubNextEvent({ ...valid, sha: "c".repeat(40), workflowSha: "d".repeat(40) });
    expect(result).toMatchObject({ decision: "BOUND", context: { targetSha: "c".repeat(40), workflowSha: "d".repeat(40) }, dispatch: false, executionAuthorized: false });
  });

  it("keeps source-comment identity stable across run retries while retaining run provenance", async () => {
    const first = await bindGitHubNextEvent(valid);
    const retry = await bindGitHubNextEvent({ ...valid, runId: 654321, runAttempt: 2 });
    expect(retry.context.eventDigest).toBe(first.context.eventDigest);
    expect(retry.context.runId).toBe(654321);
    expect(retry.context.runAttempt).toBe(2);
  });

  it.each(["/next\n", "/next\r\n", " /next", "/next ", "prefix /next", "/next\nextra"])(
    "rejects non-exact command body %j", async commentBody => {
      await expect(bindGitHubNextEvent({ ...valid, commentBody })).resolves.toMatchObject({
        decision: "DENY", reason: "GITHUB_COMMAND_BODY_NOT_EXACT", dispatch: false
      });
    }
  );

  it.each([
    ["non-owner numeric identity", { commentUserId: "999" }],
    ["triggering actor numeric identity mismatch", { actorId: "999" }],
    ["triggering actor login mismatch", { actorLogin: "other" }],
    ["triggering actor differs from comment author", { actorId: "999", commentUserId: "999" }],
    ["non-owner login", { commentUserLogin: "other" }],
    ["non-owner association", { commentAuthorAssociation: "COLLABORATOR" }],
    ["wrong repository id", { repositoryId: "1" }],
    ["wrong repository", { repository: "other/repo" }],
    ["wrong issue", { issueNumber: 97 }],
    ["PR conversation", { isPullRequest: true }],
    ["wrong event type", { eventName: "pull_request" }],
    ["edited comment", { eventAction: "edited" }],
    ["wrong default ref", { ref: "refs/heads/feature" }],
    ["malformed target SHA", { sha: "not-a-sha" }],
    ["wrong workflow identity", { workflowRef: "other/workflow.yml@refs/heads/Основной" }],
    ["malformed workflow SHA", { workflowSha: "not-a-sha" }],
    ["missing Actions context", { githubActions: "false" }],
    ["invalid run attempt", { runAttempt: 0 }],
    ["invalid comment id", { commentId: 0 }]
  ])("fails closed for %s", async (_name, patch) => {
    await expect(bindGitHubNextEvent({ ...valid, ...patch })).resolves.toMatchObject({
      decision: "DENY", dispatch: false, executionAuthorized: false
    });
  });

  it("creates one append-only receipt table with source-comment uniqueness", async () => {
    const table = await env.POOL_DB.prepare(
      "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'pool_source_comment_receipts'"
    ).first();
    expect(table?.sql).toContain("UNIQUE (repository_id, source_comment_id)");
    const triggers = await env.POOL_DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'trigger' AND name IN ('pool_source_comment_receipt_full_binding_guard', 'pool_source_comment_receipts_no_update', 'pool_source_comment_receipts_no_delete')"
    ).all();
    expect(new Set((triggers.results ?? []).map(row => row.name))).toEqual(new Set([
      "pool_source_comment_receipt_full_binding_guard",
      "pool_source_comment_receipts_no_update",
      "pool_source_comment_receipts_no_delete"
    ]));
  });
});


import { mapGitHubActionsContext } from "../src/github-actions-context.mjs";

describe("GitHub Actions context adapter", () => {
  const github = {
    event_name: "issue_comment",
    event: {
      action: "created",
      issue: { number: 96 },
      comment: {
        id: 987654,
        body: "/next",
        user: { id: 157891068, login: "VlDMlNSh", author_association: "OWNER" }
      }
    },
    repository: "VlDMlNSh/developer-cloud-pool",
    repository_id: "1445644538",
    repository_owner: "VlDMlNSh",
    repository_owner_id: "157891068",
    actor: "VlDMlNSh",
    actor_id: "157891068",
    ref: "refs/heads/Основной",
    sha: "a".repeat(40),
    workflow_ref: "VlDMlNSh/developer-cloud-pool/.github/workflows/next-event-controller.yml@refs/heads/Основной",
    workflow_sha: "b".repeat(40),
    run_id: "123456",
    run_attempt: "2"
  };
  const runnerEnv = { GITHUB_ACTIONS: "true", GITHUB_SERVER_URL: "https://github.com" };

  it("maps trusted runner context fields without conflating event and workflow SHAs", async () => {
    const mapped = mapGitHubActionsContext(github, runnerEnv);
    expect(mapped).toMatchObject({
      githubActions: "true",
      serverUrl: "https://github.com",
      eventName: "issue_comment",
      eventAction: "created",
      repository: "VlDMlNSh/developer-cloud-pool",
      repositoryId: "1445644538",
      ownerNumericId: "157891068",
      ownerLogin: "VlDMlNSh",
      actorId: "157891068",
      actorLogin: "VlDMlNSh",
      issueNumber: 96,
      isPullRequest: false,
      commentId: 987654,
      commentBody: "/next",
      commentUserId: 157891068,
      commentUserLogin: "VlDMlNSh",
      commentAuthorAssociation: "OWNER",
      ref: "refs/heads/Основной",
      sha: "a".repeat(40),
      workflowSha: "b".repeat(40),
      runId: 123456,
      runAttempt: 2
    });
    expect(mapped.sha).not.toBe(mapped.workflowSha);
    await expect(bindGitHubNextEvent(mapped)).resolves.toMatchObject({
      decision: "BOUND", dispatch: false, executionAuthorized: false
    });
  });

  it("marks pull-request conversation comments from the trusted issue payload", () => {
    const mapped = mapGitHubActionsContext({
      ...github,
      event: { ...github.event, issue: { number: 96, pull_request: { url: "https://api.github.com/pulls/1" } } }
    }, runnerEnv);
    expect(mapped.isPullRequest).toBe(true);
  });

  it("does not fill missing trusted context from event text or repository metadata", () => {
    const mapped = mapGitHubActionsContext({
      event_name: "issue_comment",
      event: { action: "created", issue: { number: 96 }, comment: { body: "/next" } }
    }, {});
    expect(mapped).toMatchObject({
      githubActions: undefined, serverUrl: undefined,
      actorId: undefined, repositoryId: undefined,
      ownerNumericId: undefined, sha: undefined,
      workflowRef: undefined, workflowSha: undefined
    });
    expect(mapped.runId).toBeNaN();
    expect(mapped.runAttempt).toBeNaN();
  });

  it("does not let an issue body replace the comment body", () => {
    const mapped = mapGitHubActionsContext({
      ...github,
      event: { ...github.event, issue: { number: 96, body: "/next" }, comment: { ...github.event.comment, body: "not-next" } }
    }, runnerEnv);
    expect(mapped.commentBody).toBe("not-next");
  });
});
