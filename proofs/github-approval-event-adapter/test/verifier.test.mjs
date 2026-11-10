import test from "node:test";
import assert from "node:assert/strict";
import { verifyApprovalEvent } from "../src/verifier.mjs";

const ownerId = 157891068;
const repositoryId = 1445644538;
const issueId = 6249619988;
const issueNumber = 38;
const commentId = 7788990011;
const sha = "a".repeat(40);
const createdAt = "2026-11-10T09:00:00Z";
const body = "POOL-APPROVE v1\ntarget_sha=" + sha + "\nprofile=dsh-headless-probe\nnonce=" + "b".repeat(32);

const repository = {
  id: repositoryId, name: "developer-cloud-pool",
  full_name: "VlDMlNSh/developer-cloud-pool",
  url: "https://api.github.com/repos/VlDMlNSh/developer-cloud-pool",
  owner: { id: ownerId, type: "User", login: "VlDMlNSh" }
};
const issue = {
  id: issueId, number: issueNumber,
  url: "https://api.github.com/repos/VlDMlNSh/developer-cloud-pool/issues/" + issueNumber,
  repository_url: repository.url, state: "open"
};
const comment = {
  id: commentId,
  url: "https://api.github.com/repos/VlDMlNSh/developer-cloud-pool/issues/comments/" + commentId,
  html_url: "https://github.com/VlDMlNSh/developer-cloud-pool/issues/" + issueNumber + "#issuecomment-" + commentId,
  body, user: { id: ownerId, type: "User" },
  created_at: createdAt, updated_at: createdAt, issue_url: issue.url
};
const event = {
  action: "created", repository, issue, comment: { ...comment },
  sender: { id: ownerId, type: "User" }
};
const context = { eventName: "issue_comment", repo: { owner: "VlDMlNSh", repo: "developer-cloud-pool" } };
const policy = {
  expectedRepositoryId: repositoryId,
  expectedRepositoryFullName: "VlDMlNSh/developer-cloud-pool",
  expectedApproverNumericId: ownerId,
  allowedIssueNumbers: [issueNumber],
  expectedTargetSha: sha
};

function fakeOctokit({ repo = repository, issueReads = [issue], commentReads = [comment], failAt } = {}) {
  let issueIndex = 0;
  let commentIndex = 0;
  return {
    rest: {
      repos: { get: async () => {
        if (failAt === "repo") throw new Error("synthetic API error");
        return { data: repo };
      } },
      issues: {
        get: async () => {
          if (failAt === "issue") throw new Error("synthetic API error");
          return { data: issueReads[Math.min(issueIndex++, issueReads.length - 1)] };
        },
        getComment: async () => {
          if (failAt === "comment") throw new Error("synthetic API error");
          return { data: commentReads[Math.min(commentIndex++, commentReads.length - 1)] };
        }
      }
    }
  };
}
async function verify(overrides = {}) {
  return verifyApprovalEvent({
    event: overrides.event ?? event,
    context: overrides.context ?? context,
    octokit: overrides.octokit ?? fakeOctokit(),
    policy: overrides.policy ?? policy
  });
}

test("accepts canonical evidence while dispatch remains false", async () => {
  const result = await verify();
  assert.equal(result.decision, "VERIFIED_EVENT_EVIDENCE");
  assert.equal(result.dispatch, false);
  assert.equal(result.evidence.commentId, commentId);
  assert.equal(result.evidence.targetSha, sha);
});
test("rejects wrong event and action", async () => {
  assert.equal((await verify({ context: { ...context, eventName: "workflow_dispatch" } })).reason, "WRONG_EVENT");
  assert.equal((await verify({ event: { ...event, action: "edited" } })).reason, "WRONG_EVENT");
});
test("rejects pull requests", async () => {
  const prEvent = { ...event, issue: { ...issue, pull_request: { url: "https://api.github.com/repos/x/y/pulls/38" } } };
  assert.equal((await verify({ event: prEvent })).reason, "PULL_REQUEST_NOT_ALLOWED");
});
test("rejects repository mismatch, transfer and organization owner", async () => {
  assert.equal((await verify({ event: { ...event, repository: { ...repository, id: repositoryId + 1 } } })).reason, "REPOSITORY_MISMATCH");
  assert.equal((await verify({ octokit: fakeOctokit({ repo: { ...repository, full_name: "Other/repo" } }) })).reason, "CANONICAL_REPOSITORY_MISMATCH");
  assert.equal((await verify({ octokit: fakeOctokit({ repo: { ...repository, owner: { ...repository.owner, type: "Organization" } } }) })).reason, "CANONICAL_REPOSITORY_MISMATCH");
});
test("rejects missing or mismatched protected approver", async () => {
  assert.equal((await verify({ policy: { ...policy, expectedApproverNumericId: undefined } })).reason, "APPROVER_MISMATCH");
  assert.equal((await verify({ event: { ...event, sender: { id: ownerId + 1 } } })).reason, "APPROVER_MISMATCH");
  assert.equal((await verify({ octokit: fakeOctokit({ comment: { ...comment, user: { id: ownerId + 1, type: "User" } } }) })).reason, "CANONICAL_COMMENT_MISMATCH");
});
test("rejects unapproved and closed issues", async () => {
  assert.equal((await verify({ policy: { ...policy, allowedIssueNumbers: [] } })).reason, "ISSUE_NOT_ALLOWLISTED");
  assert.equal((await verify({ octokit: fakeOctokit({ issue: { ...issue, state: "closed" } }) })).reason, "CANONICAL_ISSUE_MISMATCH");
});
test("rejects edited, reverted, deleted and mismatched comments", async () => {
  assert.equal((await verify({ event: { ...event, comment: { ...comment, updated_at: "2026-11-10T09:01:00Z" } } })).reason, "EVENT_COMMENT_EDITED_OR_INVALID");
  assert.equal((await verify({ octokit: fakeOctokit({ comment: { ...comment, updated_at: "2026-11-10T09:02:00Z" } }) })).reason, "CANONICAL_COMMENT_MISMATCH");
  assert.equal((await verify({ octokit: fakeOctokit({ failAt: "comment" }) })).reason, "API_READ_FAILED");
});
test("rejects malformed command, wrong SHA, unknown profile and short nonce", async () => {
  const invalidBodies = [
    "POOL-APPROVE v1\ntarget_sha=mutable-branch\nprofile=dsh-headless-probe\nnonce=" + "b".repeat(32),
    "POOL-APPROVE v1\ntarget_sha=" + sha + "\nprofile=unknown\nnonce=" + "b".repeat(32),
    "POOL-APPROVE v1\ntarget_sha=" + sha + "\nprofile=dsh-headless-probe\nnonce=short",
    body + "\n"
  ];
  for (const invalidBody of invalidBodies) {
    const result = await verify({ event: { ...event, comment: { ...comment, body: invalidBody } } });
    assert.equal(result.decision, "DENY");
    assert.equal(result.dispatch, false);
  }
  assert.equal((await verify({ policy: { ...policy, expectedTargetSha: "c".repeat(40) } })).reason, "TARGET_SHA_MISMATCH");
});
test("re-reads Issue and comment and rejects changes", async () => {
  assert.equal((await verify({ octokit: fakeOctokit({ issueReads: [issue, { ...issue, state: "closed" }] }) })).reason, "CANONICAL_RESOURCE_CHANGED");
  assert.equal((await verify({ octokit: fakeOctokit({ commentReads: [comment, { ...comment, body: body + " " }] }) })).reason, "CANONICAL_RESOURCE_CHANGED");
});
test("rejects incomplete responses and API failures", async () => {
  assert.equal((await verify({ octokit: fakeOctokit({ repo: null }) })).reason, "INCOMPLETE_API_RESPONSE");
  assert.equal((await verify({ octokit: fakeOctokit({ failAt: "repo" }) })).reason, "API_READ_FAILED");
  assert.equal((await verify({ octokit: fakeOctokit({ failAt: "issue" }) })).reason, "API_READ_FAILED");
});
test("all denials are explicitly non-dispatching", async () => {
  assert.deepEqual(await verify({ event: { ...event, action: "deleted" } }), {
    decision: "DENY", dispatch: false, reason: "WRONG_EVENT"
  });
});
