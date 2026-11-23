import { describe, expect, it } from "vitest";
import { bindGitHubNextEvent } from "../src/github-next-event.mjs";

const sha = "a".repeat(40);
const valid = {
  githubActions: "true", serverUrl: "https://github.com",
  eventName: "issue_comment", eventAction: "created",
  repository: "VlDMlNSh/developer-cloud-pool", repositoryId: "1445644538",
  ownerNumericId: "157891068", ownerLogin: "VlDMlNSh",
  ref: "refs/heads/Основной", sha,
  workflowRef: "VlDMlNSh/developer-cloud-pool/.github/workflows/next-event-controller.yml@refs/heads/Основной",
  workflowSha: sha, runId: 123456, runAttempt: 1,
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
        ref: "refs/heads/Основной", targetSha: sha, workflowSha: sha,
        profile: "jarvis-code-sandbox-v1"
      }
    });
    expect(result.context.eventDigest).toMatch(/^[a-f0-9]{64}$/);
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
    ["stale workflow SHA", { workflowSha: "b".repeat(40) }],
    ["missing Actions context", { githubActions: "false" }],
    ["invalid run attempt", { runAttempt: 0 }],
    ["invalid comment id", { commentId: 0 }]
  ])("fails closed for %s", async (_name, patch) => {
    await expect(bindGitHubNextEvent({ ...valid, ...patch })).resolves.toMatchObject({
      decision: "DENY", dispatch: false, executionAuthorized: false
    });
  });
});
