import test from "node:test";
import assert from "node:assert/strict";
import { evaluateNextEvent } from "../scripts/next-event-controller.mjs";

const sha = "6507823e7ec27caa9b2621daef964dba2d4cf436";
const valid = () => ({
  eventName: "issue_comment",
  ref: "refs/heads/Основной",
  sha,
  repository: {
    full_name: "VlDMlNSh/developer-cloud-pool",
    default_branch: "Основной",
    owner: { login: "VlDMlNSh" }
  },
  event: {
    action: "created",
    issue: { number: 96, state: "open" },
    comment: {
      id: 6902000001,
      body: "/next",
      user: { login: "VlDMlNSh" },
      author_association: "OWNER"
    }
  }
});

test("accepts only the exact owner /next envelope as read-only evidence", () => {
  const result = evaluateNextEvent(valid());
  assert.equal(result.admitted, true);
  assert.equal(result.mode, "READ_ONLY_NO_DISPATCH");
  assert.equal(result.executionAuthorized, false);
  assert.equal(result.sourceCommentId, 6902000001);
  assert.equal(result.targetSha, sha);
  assert.match(result.dispatchId, /^[0-9a-f]{64}$/);
});

const rejected = [
  ["non-issue_comment event", x => { x.eventName = "schedule"; }],
  ["edited comment", x => { x.event.action = "edited"; }],
  ["wrong repository", x => { x.repository.full_name = "attacker/repo"; }],
  ["wrong owner", x => { x.repository.owner.login = "attacker"; }],
  ["unexpected default branch", x => { x.repository.default_branch = "main"; }],
  ["untrusted ref", x => { x.ref = "refs/pull/12/merge"; }],
  ["invalid event SHA", x => { x.sha = "main"; }],
  ["wrong issue", x => { x.event.issue.number = 95; }],
  ["pull request comment", x => { x.event.issue.pull_request = { url: "https://api.github.com/..." }; }],
  ["closed control issue", x => { x.event.issue.state = "closed"; }],
  ["body with suffix", x => { x.event.comment.body = "/next please"; }],
  ["body with trailing newline", x => { x.event.comment.body = "/next\n"; }],
  ["non-owner login", x => { x.event.comment.user.login = "other"; }],
  ["non-owner association", x => { x.event.comment.author_association = "COLLABORATOR"; }],
  ["invalid comment ID", x => { x.event.comment.id = 0; }]
];

for (const [name, mutate] of rejected) {
  test("rejects " + name, () => {
    const input = valid();
    mutate(input);
    const result = evaluateNextEvent(input);
    assert.equal(result.admitted, false);
    assert.equal(result.mode, "READ_ONLY_NO_DISPATCH");
    assert.equal(typeof result.reason, "string");
    assert.equal(result.executionAuthorized, undefined);
  });
}

test("derives stable event identity from repository, issue and source comment", () => {
  const first = evaluateNextEvent(valid());
  const second = evaluateNextEvent(valid());
  assert.equal(first.dispatchId, second.dispatchId);
  const changed = valid();
  changed.event.comment.id += 1;
  assert.notEqual(first.dispatchId, evaluateNextEvent(changed).dispatchId);
});
