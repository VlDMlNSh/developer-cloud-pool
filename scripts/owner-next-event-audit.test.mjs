import test from "node:test";
import assert from "node:assert/strict";
import { verifyOwnerNextEvent } from "./owner-next-event-audit.mjs";

function fixture(overrides = {}) {
  const repository = { id: 100, full_name: "VlDMlNSh/developer-cloud-pool", default_branch: "Основной", owner: { id: 200, login: "VlDMlNSh" } };
  const issue = { number: 96, url: "https://api.github.com/repos/VlDMlNSh/developer-cloud-pool/issues/96" };
  const comment = { id: 300, issue_url: issue.url, body: "/next", author_association: "OWNER", user: { id: 200, login: "VlDMlNSh" } };
  const event = { action: "created", repository: { id: 100, owner: { id: 200 } }, issue: { number: 96 }, comment: { id: 300, body: "/next", user: { id: 200 } }, sender: { id: 200 } };
  const workflowRun = { id: 400, run_attempt: 1, event: "issue_comment", path: ".github/workflows/next-event-controller.yml@Основной", workflow_id: 500, repository: { id: 100 }, actor: { id: 200 }, head_branch: "Основной", head_sha: "a".repeat(40) };
  const workflow = { id: 500, path: ".github/workflows/next-event-controller.yml", state: "active" };
  const defaultBranchRef = { object: { sha: "a".repeat(40) } };
  const expected = { eventName: "issue_comment", repository: repository.full_name, runId: "400", runAttempt: "1", ref: "refs/heads/Основной", sha: "a".repeat(40) };
  return { event, repository, issue, comment, workflowRun, workflow, defaultBranchRef, expected, ...overrides };
}

test("accepts only a fully API-attested exact owner /next event as audit-only", () => {
  const result = verifyOwnerNextEvent(fixture());
  assert.equal(result.status, "OBSERVED_ONLY");
  assert.equal(result.admission, "NOT_CREATED");
  assert.equal(result.dispatch, "NOT_AUTHORIZED");
  assert.equal(result.targetSha, "a".repeat(40));
});

const rejected = [
  ["wrong issue", (x) => { x.issue.number = 97; }],
  ["PR comment", (x) => { x.issue.pull_request = { url: "https://api.github.com/pulls/96" }; }],
  ["non-owner author", (x) => { x.comment.user.id = 201; }],
  ["missing OWNER association", (x) => { x.comment.author_association = "COLLABORATOR"; }],
  ["wrong exact body", (x) => { x.comment.body = "/next "; }],
  ["edited event", (x) => { x.event.action = "edited"; }],
  ["repository ID mismatch", (x) => { x.event.repository.id = 999; }],
  ["comment ID mismatch", (x) => { x.event.comment.id = 999; }],
  ["sender mismatch", (x) => { x.event.sender.id = 201; }],
  ["wrong workflow metadata path", (x) => { x.workflow.path = ".github/workflows/untrusted.yml"; }],
  ["workflow run path missing branch suffix", (x) => { x.workflowRun.path = ".github/workflows/next-event-controller.yml"; }],
  ["workflow run path bound to another branch", (x) => { x.workflowRun.path = ".github/workflows/next-event-controller.yml@feature/untrusted"; }],
  ["wrong workflow event", (x) => { x.workflowRun.event = "workflow_dispatch"; }],
  ["run ID mismatch", (x) => { x.workflowRun.id = 401; }],
  ["run attempt mismatch", (x) => { x.workflowRun.run_attempt = 2; }],
  ["rerun blocked pending durable reconciliation", (x) => { x.expected.runAttempt = "2"; x.workflowRun.run_attempt = 2; }],
  ["wrong run actor", (x) => { x.workflowRun.actor.id = 201; }],
  ["wrong run repository", (x) => { x.workflowRun.repository.id = 999; }],
  ["untrusted branch", (x) => { x.workflowRun.head_branch = "feature/untrusted"; }],
  ["stale target SHA", (x) => { x.defaultBranchRef.object.sha = "b".repeat(40); }]
];

for (const [name, mutate] of rejected) {
  test("fails closed for " + name, () => {
    const input = fixture();
    mutate(input);
    const result = verifyOwnerNextEvent(input);
    assert.equal(result.status, "REJECTED");
    assert.equal(result.admission, "NOT_CREATED");
    assert.equal(result.dispatch, "NOT_AUTHORIZED");
  });
}
