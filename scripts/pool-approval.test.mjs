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
  hasConsumedOwnerApproval,
  hasSupervisorClaimComment,
  hasOwnerReadyEvent,
  hasCurrentBotClaimEvent,
  isTrustedSupervisorRun,
  hasPriorWorkerRun
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

  const consumed = { user: { login: "github-actions[bot]" }, body: formatOwnerApprovalConsumed(17, sha, "9001"), created_at: "2026-11-04T20:01:00Z" };
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


test("Worker accepts only the exact consumed owner approval bound to one supervisor run", () => {
  const expected = { issueNumber: 17, targetSha: sha, profile: "DSH headless probe" };
  const approval = { user: { login: "github-actions[bot]" }, body: formatOwnerApproval(getOwnerApproval(event(), "VlDMlNSh")), created_at: "2026-11-06T10:00:00Z" };
  const consumed = { user: { login: "github-actions[bot]" }, body: formatOwnerApprovalConsumed(17, sha, "9001"), created_at: "2026-11-06T10:01:00Z" };
  assert.equal(hasConsumedOwnerApproval([approval, consumed], expected, "VlDMlNSh", "9001"), true);
  assert.equal(hasConsumedOwnerApproval([approval, consumed], expected, "VlDMlNSh", "9002"), false);
  assert.equal(hasConsumedOwnerApproval([approval], expected, "VlDMlNSh", "9001"), false);
  const revoked = { user: { login: "github-actions[bot]" }, body: formatOwnerApprovalRevoked(17), created_at: "2026-11-06T10:02:00Z" };
  assert.equal(hasConsumedOwnerApproval([approval, consumed, revoked], expected, "VlDMlNSh", "9001"), false);
});

test("Worker requires a bot claim receipt bound to the same supervisor run and target", () => {
  const comments = [{
    user: { login: "github-actions[bot]" },
    body: [
      "**POOL_TASK_CLAIMED**", "",
      "- Supervisor run: 9001",
      "- Target SHA: " + sha,
      "- Profile: dsh-headless-probe"
    ].join("\n")
  }];
  const expected = { issueNumber: 17, targetSha: sha, profile: "DSH headless probe" };
  assert.equal(hasSupervisorClaimComment(comments, expected, "9001"), true);
  assert.equal(hasSupervisorClaimComment(comments, expected, "9002"), false);
  assert.equal(hasSupervisorClaimComment(comments, { ...expected, targetSha: "b".repeat(40) }, "9001"), false);
});

test("Worker requires owner ready event and latest bot-authored claimed transition", () => {
  const runTime = "2026-11-06T10:02:00Z";
  const events = [
    { event: "labeled", label: { name: "pool:ready" }, actor: { login: "VlDMlNSh" }, created_at: "2026-11-06T10:01:00Z" },
    { event: "unlabeled", label: { name: "pool:ready" }, actor: { login: "github-actions[bot]" }, created_at: "2026-11-06T10:02:01Z" },
    { event: "labeled", label: { name: "pool:claimed" }, actor: { login: "github-actions[bot]" }, created_at: "2026-11-06T10:02:02Z" }
  ];
  assert.equal(hasOwnerReadyEvent(events, "VlDMlNSh", runTime), true);
  assert.equal(hasCurrentBotClaimEvent(events, runTime), true);
  const forged = [...events, {
    event: "labeled", label: { name: "pool:claimed" }, actor: { login: "contributor" }, created_at: "2026-11-06T10:03:00Z"
  }];
  assert.equal(hasCurrentBotClaimEvent(forged, runTime), false);
  assert.equal(hasOwnerReadyEvent(events, "contributor", runTime), false);
});

test("Worker accepts only the actual owner-triggered Supervisor workflow run", () => {
  const run = {
    id: 9001, workflow_id: 44, event: "issues",
    actor: { login: "VlDMlNSh" }, head_branch: "Основной",
    status: "in_progress", created_at: new Date(Date.now() - 60_000).toISOString()
  };
  const expected = { supervisorRunId: "9001", workflowId: 44, repositoryOwner: "VlDMlNSh", defaultBranch: "Основной" };
  assert.equal(isTrustedSupervisorRun(run, expected), true);
  assert.equal(isTrustedSupervisorRun({ ...run, event: "workflow_dispatch" }, expected), false);
  assert.equal(isTrustedSupervisorRun({ ...run, actor: { login: "contributor" } }, expected), false);
  assert.equal(isTrustedSupervisorRun({ ...run, workflow_id: 45 }, expected), false);
  assert.equal(isTrustedSupervisorRun({ ...run, status: "completed", conclusion: "failure" }, expected), false);
});

test("Worker rejects a second execution for the same issue approval", () => {
  const runs = [
    { id: 9002, display_title: "Pool task #17 (dsh-headless-probe)", created_at: "2026-11-06T10:03:00Z" },
    { id: 9003, display_title: "Pool task #18 (dsh-headless-probe)", created_at: "2026-11-06T10:03:00Z" }
  ];
  assert.equal(hasPriorWorkerRun(runs, "9002", 17, "2026-11-06T10:02:00Z"), false);
  assert.equal(hasPriorWorkerRun(runs, "9999", 17, "2026-11-06T10:02:00Z"), true);
});
