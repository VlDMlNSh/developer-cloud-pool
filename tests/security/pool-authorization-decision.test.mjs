import test from "node:test";
import assert from "node:assert/strict";
import { decidePoolAuthorization } from "../../src/pool/authorization-decision.mjs";

const valid = () => ({
  caller: { repositoryId: "1234", workflowRef: "owner/repo/.github/workflows/supervisor.yml@refs/heads/main", workflowSha: "a".repeat(40) },
  task: { repositoryId: "1234", approvedWorkflowRef: "owner/repo/.github/workflows/supervisor.yml@refs/heads/main", approvedWorkflowSha: "a".repeat(40), targetSha: "b".repeat(40), approvalEventId: "evt-001", state: "pool:ready", profile: "dsh-headless-probe" },
  consume: { status: "created", markerApprovalEventId: "evt-001" }
});

test("only first durable consume confirmation permits dispatch", () => {
  const result = decidePoolAuthorization(valid());
  assert.deepEqual(result, { decision: "ALLOW_ONCE", state: "pool:claimed", dispatch: true, reason: "FIRST_CONSUME_CONFIRMED" });
});

for (const [name, mutate, reason] of [
  ["repository mismatch", x => x.caller.repositoryId = "other", "CALLER_REPOSITORY_MISMATCH"],
  ["workflow mismatch", x => x.caller.workflowRef = "untrusted", "CALLER_WORKFLOW_MISMATCH"],
  ["workflow SHA mismatch", x => x.caller.workflowSha = "c".repeat(40), "CALLER_WORKFLOW_SHA_MISMATCH"],
  ["invalid target SHA", x => x.task.targetSha = "mutable-ref", "INVALID_TARGET_SHA"],
  ["missing approval event", x => x.task.approvalEventId = "", "MISSING_APPROVAL_EVENT_ID"],
  ["task not ready", x => x.task.state = "pool:claimed", "TASK_NOT_READY"],
  ["unsupported profile", x => x.task.profile = "other", "PROFILE_NOT_ALLOWLISTED"],
  ["replayed approval", x => x.consume.status = "exists", "APPROVAL_ALREADY_CONSUMED"],
  ["consume denied", x => x.consume.status = "denied", "CONSUME_DENIED"],
  ["ambiguous consume", x => x.consume.status = "timeout", "CONSUME_OUTCOME_AMBIGUOUS"],
  ["marker mismatch", x => x.consume.markerApprovalEventId = "evt-other", "CONSUME_OUTCOME_AMBIGUOUS"],
  ["missing consume receipt", x => x.consume = null, "CONSUME_RESULT_MISSING"]
]) {
  test(`fail closed: ${name}`, () => {
    const input = valid();
    mutate(input);
    const result = decidePoolAuthorization(input);
    assert.equal(result.dispatch, false);
    assert.equal(result.decision, "DENY");
    assert.equal(result.state, "pool:needs-review");
    assert.equal(result.reason, reason);
  });
}
