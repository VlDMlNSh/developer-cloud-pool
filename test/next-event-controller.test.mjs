import test from "node:test";
import assert from "node:assert/strict";
import { evaluateNextEvent } from "../scripts/next-event-controller.mjs";

const sha = "35208f0ef28f0ac031a7acdf35fc90ccc9b16845";
const valid = () => ({
  eventName: "issue_comment",
  ref: "refs/heads/Основной",
  sha,
  repository: {
    id: 1445644538,
    full_name: "VlDMlNSh/developer-cloud-pool",
    default_branch: "Основной",
    owner: { id: 157891068, login: "VlDMlNSh" }
  },
  event: {
    action: "created",
    issue: {
      number: 96,
      state: "open",
      repository_url: "https://api.github.com/repos/VlDMlNSh/developer-cloud-pool/issues/96"
    },
    comment: {
      id: 6912000001,
      body: "/next",
      user: { id: 157891068, login: "VlDMlNSh" },
      author_association: "OWNER"
    }
  }
});

test("admits exact owner /next event only as read-only evidence", () => {
  const result = evaluateNextEvent(valid());
  assert.equal(result.admitted, true);
  assert.equal(result.mode, "READ_ONLY_NO_DISPATCH");
  assert.equal(result.executionAuthorized, false);
  assert.equal(result.sourceCommentId, 6912000001);
  assert.equal(result.targetSha, sha);
  assert.match(result.dispatchId, /^[0-9a-f]{64}$/);
});

const rejected = [
  ["non-issue_comment event", x => { x.eventName = "schedule"; }],
  ["edited comment", x => { x.event.action = "edited"; }],
  ["wrong repository", x => { x.repository.full_name = "attacker/repo"; }],
  ["wrong repository numeric ID", x => { x.repository.id += 1; }],
  ["wrong owner login", x => { x.repository.owner.login = "attacker"; }],
  ["wrong owner numeric ID", x => { x.repository.owner.id += 1; }],
  ["unexpected default branch", x => { x.repository.default_branch = "main"; }],
  ["untrusted ref", x => { x.ref = "refs/pull/12/merge"; }],
  ["invalid event SHA", x => { x.sha = "main"; }],
  ["wrong issue", x => { x.event.issue.number = 95; }],
  ["pull request comment", x => { x.event.issue.pull_request = { url: "https://api.github.com/..." }; }],
  ["closed control issue", x => { x.event.issue.state = "closed"; }],
  ["wrong issue repository URL", x => { x.event.issue.repository_url = "https://api.github.com/repos/attacker/repo/issues/96"; }],
  ["body with suffix", x => { x.event.comment.body = "/next please"; }],
  ["body with trailing newline", x => { x.event.comment.body = "/next\\n"; }],
  ["non-owner login", x => { x.event.comment.user.login = "other"; }],
  ["non-owner numeric ID", x => { x.event.comment.user.id += 1; }],
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
    assert.equal(result.executionAuthorized, false);
    assert.equal(typeof result.reason, "string");
  });
}

test("derives stable idempotency identity from repository, issue and source comment", () => {
  const first = evaluateNextEvent(valid());
  const second = evaluateNextEvent(valid());
  assert.equal(first.dispatchId, second.dispatchId);
  const changed = valid();
  changed.event.comment.id += 1;
  assert.notEqual(first.dispatchId, evaluateNextEvent(changed).dispatchId);
});
