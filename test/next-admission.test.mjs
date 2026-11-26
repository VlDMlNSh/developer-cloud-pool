import test from "node:test";
import assert from "node:assert/strict";
import { evaluateNextAdmission } from "../scripts/next-admission.mjs";

const sha = "9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc";
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
    issue: { number: 96, state: "open", title: "Cloud Pool control issue" },
    comment: {
      id: 123456789,
      body: "/next",
      user: { login: "VlDMlNSh" },
      author_association: "OWNER"
    }
  }
});

test("admits exact owner /next comment on the dedicated open control issue", () => {
  const result = evaluateNextAdmission(valid());
  assert.equal(result.admitted, true);
  assert.equal(result.sourceCommentId, 123456789);
  assert.equal(result.targetSha, sha);
  assert.match(result.dispatchId, /^[0-9a-f]{64}$/);
});

test("derives stable idempotency identity from source comment and target SHA", () => {
  const input = valid();
  const first = evaluateNextAdmission(input);
  const second = evaluateNextAdmission(input);
  assert.equal(first.dispatchId, second.dispatchId);
  const differentTarget = evaluateNextAdmission({ ...input, sha: "3d84f04bbc28385fe4da0cbdf47535a01eb9be1b" });
  assert.equal(first.dispatchId, differentTarget.dispatchId);
  input.event.comment.id += 1;
  assert.notEqual(first.dispatchId, evaluateNextAdmission(input).dispatchId);
});

const rejected = [
  ["schedule event", input => { input.eventName = "schedule"; }],
  ["edited comment", input => { input.event.action = "edited"; }],
  ["wrong repository", input => { input.repository.full_name = "attacker/fork"; }],
  ["wrong owner", input => { input.repository.owner.login = "attacker"; }],
  ["wrong default branch", input => { input.repository.default_branch = "main"; }],
  ["untrusted ref", input => { input.ref = "refs/pull/12/merge"; }],
  ["malformed target SHA", input => { input.sha = "main"; }],
  ["wrong issue", input => { input.event.issue.number = 95; }],
  ["pull request conversation", input => { input.event.issue.pull_request = { url: "https://api.github.com/..." }; }],
  ["closed control issue", input => { input.event.issue.state = "closed"; }],
  ["body with trailing newline", input => { input.event.comment.body = "/next\n"; }],
  ["body with whitespace", input => { input.event.comment.body = " /next"; }],
  ["non-owner login", input => { input.event.comment.user.login = "other"; }],
  ["non-owner association", input => { input.event.comment.author_association = "COLLABORATOR"; }],
  ["invalid comment ID", input => { input.event.comment.id = 0; }]
];

for (const [name, mutate] of rejected) {
  test("rejects " + name, () => {
    const input = valid();
    mutate(input);
    const result = evaluateNextAdmission(input);
    assert.equal(result.admitted, false);
    assert.equal(typeof result.reason, "string");
  });
}
