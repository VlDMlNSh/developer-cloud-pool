import test from "node:test";
import assert from "node:assert/strict";
import {
  extractTaskEnvelope,
  getOwnerApproval,
  formatOwnerApproval,
  hasOwnerApproval
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
  const comments = [{ user: { login: "github-actions[bot]" }, body: marker }];
  const expected = { issueNumber: 17, targetSha: sha, profile: "DSH headless probe" };
  assert.equal(hasOwnerApproval(comments, expected, "VlDMlNSh"), true);
  assert.equal(hasOwnerApproval([{ user: { login: "contributor" }, body: marker }], expected, "VlDMlNSh"), false);
  assert.equal(hasOwnerApproval(comments, { ...expected, targetSha: "b".repeat(40) }, "VlDMlNSh"), false);
  assert.equal(hasOwnerApproval(comments, expected, "another-owner"), false);
});
