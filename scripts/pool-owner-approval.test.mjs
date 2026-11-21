import test from "node:test";
import assert from "node:assert/strict";
import { parseOwnerApproval, planApprovalConsumption } from "./pool-owner-approval.mjs";

const targetSha = "a".repeat(40);
const envelopeSha256 = "b".repeat(64);
const createdAt = "2026-11-05T12:00:00Z";
const validComment = {
  id: 987654,
  user: { id: 12345, login: "repository-owner" },
  created_at: createdAt,
  updated_at: createdAt,
  body: "/pool approve issue=42 sha=" + targetSha +
    " profile=dsh-headless-probe envelope=" + envelopeSha256
};
const validInput = {
  comment: validComment,
  ownerId: 12345,
  issueNumber: 42,
  targetSha,
  profile: "dsh-headless-probe",
  envelopeSha256
};

test("accepts a fresh owner-authored approval bound to the exact task envelope", () => {
  const result = parseOwnerApproval(validInput);
  assert.equal(result.authorized, true);
  assert.equal(result.approval.commentId, validComment.id);
  assert.equal(result.approval.targetSha, targetSha);
});

test("rejects a collaborator even when the display login resembles the owner", () => {
  const result = parseOwnerApproval({
    ...validInput,
    comment: { ...validComment, user: { id: 99999, login: "repository-owner" } }
  });
  assert.equal(result.authorized, false);
  assert.ok(result.failures.includes("comment author is not the repository owner"));
});

test("rejects an edited approval comment", () => {
  const result = parseOwnerApproval({
    ...validInput,
    comment: { ...validComment, updated_at: "2026-11-05T12:01:00Z" }
  });
  assert.equal(result.authorized, false);
  assert.ok(result.failures.includes("approval comment was edited or update timestamp is unavailable"));
});

test("rejects a previously consumed comment ID", () => {
  const result = parseOwnerApproval({ ...validInput, consumedCommentIds: [validComment.id] });
  assert.equal(result.authorized, false);
  assert.ok(result.failures.includes("approval comment ID was already consumed"));
});

for (const [name, patch, expected] of [
  ["issue mismatch", { issueNumber: 43 }, "approval issue number mismatch"],
  ["target SHA mismatch", { targetSha: "c".repeat(40) }, "approval target SHA mismatch"],
  ["profile mismatch", { profile: "other-profile" }, "expected profile is not allowlisted"],
  ["envelope digest mismatch", { envelopeSha256: "d".repeat(64) }, "approval envelope digest mismatch"],
  ["missing author ID", { comment: { ...validComment, user: { login: "repository-owner" } } }, "comment author ID is missing or invalid"],
  ["missing timestamp", { comment: { ...validComment, created_at: null, updated_at: null } }, "comment creation timestamp is missing or invalid"]
]) {
  test("rejects " + name, () => {
    const result = parseOwnerApproval({ ...validInput, ...patch });
    assert.equal(result.authorized, false);
    assert.ok(result.failures.includes(expected));
  });
}

test("plans one claim only from a valid approval and approvable state", () => {
  const parsedApproval = parseOwnerApproval(validInput);
  assert.deepEqual(
    planApprovalConsumption({ parsedApproval, taskState: "submitted", dispatchAttempted: false }),
    {
      state: "claimed",
      dispatchAllowed: true,
      consumeCommentId: validComment.id,
      reason: "validated-owner-approval"
    }
  );
});

test("fails closed when dispatch may already have been attempted", () => {
  const parsedApproval = parseOwnerApproval(validInput);
  const result = planApprovalConsumption({
    parsedApproval,
    taskState: "submitted",
    dispatchAttempted: true
  });
  assert.equal(result.state, "needs-review");
  assert.equal(result.dispatchAllowed, false);
  assert.equal(result.reason, "dispatch-outcome-may-be-ambiguous");
});

test("fails closed for an already claimed task", () => {
  const parsedApproval = parseOwnerApproval(validInput);
  const result = planApprovalConsumption({
    parsedApproval,
    taskState: "claimed",
    dispatchAttempted: false
  });
  assert.equal(result.state, "needs-review");
  assert.equal(result.dispatchAllowed, false);
  assert.equal(result.reason, "task-state-not-approvable");
});

test("fails closed when parsing did not authorize the comment", () => {
  const result = planApprovalConsumption({
    parsedApproval: parseOwnerApproval({ ...validInput, ownerId: 999 }),
    taskState: "submitted",
    dispatchAttempted: false
  });
  assert.equal(result.state, "needs-review");
  assert.equal(result.dispatchAllowed, false);
  assert.equal(result.reason, "approval-not-authorized");
});
