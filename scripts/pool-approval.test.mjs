import test from "node:test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import {
  extractTaskEnvelope,
  getOwnerApproval,
  formatOwnerApproval,
  formatOwnerApprovalConsumed,
  formatOwnerApprovalRevoked,
  hasOwnerApproval,
  hasWorkerDispatchAuthority
} from "./pool-approval.mjs";

const sha = "a".repeat(40);
const body = "### Target SHA\n" + sha + "\n\n### Worker profile\nDSH headless probe\n";

function event(overrides = {}) {
  return {
    action: "labeled",
    label: { name: "pool:ready" },
    sender: { login: "VlDMlNSh" },
    issue: { number: 17, state: "open", body },
    ...overrides
  };
}

test("accepts only the exact task envelope", () => {
  assert.deepEqual(extractTaskEnvelope(body), { targetSha: sha, profile: "DSH headless probe" });
  assert.equal(extractTaskEnvelope(body.replace(sha, "bad-sha")), null);
  assert.equal(extractTaskEnvelope(body.replace("DSH headless probe", "arbitrary-shell")), null);
});

test("owner label event produces an approval envelope", () => {
  assert.deepEqual(getOwnerApproval(event(), "vldmlnsh"), {
    issueNumber: 17, actor: "vldmlnsh", targetSha: sha, profile: "DSH headless probe"
  });
});

test("non-owner, other labels, closed issues and pull requests cannot approve", () => {
  assert.equal(getOwnerApproval(event({ sender: { login: "contributor" } }), "VlDMlNSh"), null);
  assert.equal(getOwnerApproval(event({ label: { name: "pool:claimed" } }), "VlDMlNSh"), null);
  assert.equal(getOwnerApproval(event({ issue: { number: 17, state: "closed", body } }), "VlDMlNSh"), null);
  assert.equal(getOwnerApproval(event({ issue: { number: 17, state: "open", body, pull_request: {} } }), "VlDMlNSh"), null);
});

test("approval marker is accepted only from GitHub Actions bot and only for exact issue/SHA/profile/owner", () => {
  const approval = getOwnerApproval(event(), "VlDMlNSh");
  const marker = formatOwnerApproval(approval);
  const comments = [{ user: { login: "github-actions[bot]" }, body: marker, created_at: "2026-11-04T20:00:00Z" }];
  const expected = { issueNumber: 17, targetSha: sha, profile: "DSH headless probe" };
  assert.equal(hasOwnerApproval(comments, expected, "VlDMlNSh"), true);
  assert.equal(hasOwnerApproval([{ user: { login: "contributor" }, body: marker }], expected, "VlDMlNSh"), false);
  assert.equal(hasOwnerApproval(comments, { ...expected, targetSha: "b".repeat(40) }, "VlDMlNSh"), false);
  assert.equal(hasOwnerApproval(comments, expected, "another-owner"), false);

  const consumed = { user: { login: "github-actions[bot]" }, body: formatOwnerApprovalConsumed(17, sha), created_at: "2026-11-04T20:01:00Z" };
  assert.equal(hasOwnerApproval([...comments, consumed], expected, "VlDMlNSh"), false);

  const reapproved = { user: { login: "github-actions[bot]" }, body: marker, created_at: "2026-11-04T20:02:00Z" };
  assert.equal(hasOwnerApproval([...comments, consumed, reapproved], expected, "VlDMlNSh"), true);

  const revoked = { user: { login: "github-actions[bot]" }, body: formatOwnerApprovalRevoked(17), created_at: "2026-11-04T20:03:00Z" };
  assert.equal(hasOwnerApproval([...comments, revoked], expected, "VlDMlNSh"), false);
});

test("consumed approval recovery paths require a fresh owner approval", () => {
  const supervisor = readFileSync(new URL("./pool-supervisor.mjs", import.meta.url), "utf8");
  assert.match(supervisor, /replaceIssueLabels\(issue, \["pool:claimed", "pool:ready"\], \["pool:needs-review"\]\)/);
  assert.match(supervisor, /replaceIssueLabels\(current, \["pool:claimed", "pool:ready"\], \["pool:needs-review"\]\)/);
  assert.doesNotMatch(supervisor, /replaceIssueLabels\(issue, \["pool:claimed"\], \["pool:ready"\]\)/);
  assert.doesNotMatch(supervisor, /replaceIssueLabels\(current, \["pool:claimed"\], \["pool:ready"\]\)/);
});


test("Worker rejects direct manual dispatch and forged pool:claimed labels", () => {
  const expected = { issueNumber: 17, targetSha: sha, profile: "DSH headless probe" };
  const owner = "VlDMlNSh";
  const approvalMarker = {
    user: { login: "github-actions[bot]" },
    body: formatOwnerApproval({ issueNumber: 17, actor: owner, targetSha: sha, profile: "DSH headless probe" }),
    created_at: "2026-11-04T20:00:00Z"
  };
  const consumed = {
    user: { login: "github-actions[bot]" },
    body: formatOwnerApprovalConsumed(17, sha),
    created_at: "2026-11-04T20:01:00Z"
  };
  const claimed = {
    user: { login: "github-actions[bot]" },
    body: [
      "**POOL_TASK_CLAIMED**", "",
      "- Supervisor run: 123456",
      "- Target SHA: " + sha,
      "- Profile: dsh-headless-probe"
    ].join("\n"),
    created_at: "2026-11-04T20:02:00Z"
  };
  assert.equal(hasWorkerDispatchAuthority({
    actor: owner, comments: [approvalMarker, consumed, claimed], expected, repositoryOwner: owner
  }), false);
  assert.equal(hasWorkerDispatchAuthority({
    actor: "github-actions[bot]", comments: [], expected, repositoryOwner: owner
  }), false);
  assert.equal(hasWorkerDispatchAuthority({
    actor: "github-actions[bot]", comments: [claimed], expected, repositoryOwner: owner
  }), false);
  assert.equal(hasWorkerDispatchAuthority({
    actor: "github-actions[bot]", comments: [consumed, claimed], expected, repositoryOwner: owner
  }), true);
});

test("Worker rejects terminal or mismatched Supervisor evidence", () => {
  const expected = { issueNumber: 17, targetSha: sha, profile: "DSH headless probe" };
  const consumed = {
    user: { login: "github-actions[bot]" },
    body: formatOwnerApprovalConsumed(17, sha),
    created_at: "2026-11-04T20:01:00Z"
  };
  const claimedBody = [
    "**POOL_TASK_CLAIMED**", "",
    "- Supervisor run: 123456",
    "- Target SHA: " + sha,
    "- Profile: dsh-headless-probe"
  ].join("\n");
  const claimed = {
    user: { login: "github-actions[bot]" }, body: claimedBody,
    created_at: "2026-11-04T20:02:00Z"
  };
  const terminal = {
    user: { login: "github-actions[bot]" },
    body: "**POOL_DSH_PROBE_COMPLETE**\n\n- Worker run: 999",
    created_at: "2026-11-04T20:03:00Z"
  };
  assert.equal(hasWorkerDispatchAuthority({
    actor: "github-actions[bot]", comments: [consumed, claimed, terminal], expected, repositoryOwner: "VlDMlNSh"
  }), false);
  assert.equal(hasWorkerDispatchAuthority({
    actor: "github-actions[bot]", comments: [approvalMarker, consumed, { ...claimed, body: claimedBody.replace(sha, "b".repeat(40)) }],
    expected, repositoryOwner: "VlDMlNSh"
  }), false);


test("fresh owner reapproval resets prior terminal evidence but requires a new consumed claim", () => {
  const owner = "VlDMlNSh";
  const expected = { issueNumber: 17, targetSha: sha, profile: "DSH headless probe" };
  const approval = {
    user: { login: "github-actions[bot]" },
    body: formatOwnerApproval({ issueNumber: 17, actor: owner, targetSha: sha, profile: "DSH headless probe" }),
    created_at: "2026-11-04T20:00:00Z"
  };
  const consumed = {
    user: { login: "github-actions[bot]" }, body: formatOwnerApprovalConsumed(17, sha),
    created_at: "2026-11-04T20:01:00Z"
  };
  const claimed = {
    user: { login: "github-actions[bot]" },
    body: ["**POOL_TASK_CLAIMED**", "", "- Supervisor run: 123456",
      "- Target SHA: " + sha, "- Profile: dsh-headless-probe"].join("\\n"),
    created_at: "2026-11-04T20:02:00Z"
  };
  const terminal = {
    user: { login: "github-actions[bot]" },
    body: ["**POOL_DSH_PROBE_NEEDS_REVIEW**", "", "- Issue: 17"].join("\\n"),
    created_at: "2026-11-04T20:03:00Z"
  };
  const reapproval = {
    ...approval,
    created_at: "2026-11-04T20:04:00Z"
  };
  const newConsumed = {
    ...consumed,
    created_at: "2026-11-04T20:05:00Z"
  };
  const newClaim = {
    ...claimed,
    created_at: "2026-11-04T20:06:00Z"
  };
  assert.equal(hasWorkerDispatchAuthority({
    actor: "github-actions[bot]", comments: [approval, consumed, claimed, terminal],
    expected, repositoryOwner: owner
  }), false);
  assert.equal(hasWorkerDispatchAuthority({
    actor: "github-actions[bot]", comments: [approval, consumed, claimed, terminal, reapproval, newConsumed, newClaim],
    expected, repositoryOwner: owner
  }), true);
});
});
