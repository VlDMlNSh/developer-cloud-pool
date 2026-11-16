import test from "node:test";
import assert from "node:assert/strict";
import {
  makeLedgerRecord, encodeLedgerComment, parseLedgerComments,
  planNextDispatch, planNextDispatchState, authorizeSingleDispatch
} from "../scripts/next-dispatch-ledger.mjs";

const sourceCommentId = 987654321;
const targetSha = "9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc";
const admitted = makeLedgerRecord({ sourceCommentId, targetSha, state: "ADMITTED" });
const intent = makeLedgerRecord({ sourceCommentId, targetSha, state: "DISPATCH_INTENT" });
const ownerComment = body => ({ body, user: { login: "VlDMlNSh" }, author_association: "OWNER", issue_url: "https://api.github.com/repos/VlDMlNSh/developer-cloud-pool/issues/96" });

test("ledger comment round-trips a digest-checked write-ahead record", () => {
  const body = encodeLedgerComment(admitted);
  const records = parseLedgerComments([ownerComment(body)]);
  assert.deepEqual(records, [admitted]);
});

test("rejects tampered ledger data", () => {
  const body = encodeLedgerComment(admitted).replace(targetSha, "3d84f04bbc28385fe4da0cbdf47535a01eb9be1b");
  assert.throws(() => parseLedgerComments([ownerComment(body)]), /integrity|corrupted/i);
});

test("requires serialized controller lock", () => {
  assert.deepEqual(planNextDispatchState({ sourceCommentId, targetSha, records: [] }), {
    action: "DENY", reason: "DURABLE_LOCK_NOT_IMPLEMENTED"
  });
});

test("pure state planner models first admission without granting runtime authority", () => {
  const plan = planNextDispatchState({ sourceCommentId, targetSha, records: [] });
  assert.equal(plan.action, "PERSIST_ADMISSION");
  assert.equal(plan.record.state, "ADMITTED");
});

test("pure state planner models intent persistence without granting runtime authority", () => {
  const plan = planNextDispatchState({ sourceCommentId, targetSha, records: [admitted] });
  assert.equal(plan.action, "PERSIST_DISPATCH_INTENT");
  assert.equal(plan.record.state, "DISPATCH_INTENT");
});

test("dispatch authorization remains denied even with caller-asserted intent flags", () => {
  assert.deepEqual(
    authorizeSingleDispatch({ record: intent, appendConfirmed: true, sameInvocation: true }),
    { allowed: false, reason: "DURABLE_LOCK_NOT_IMPLEMENTED" }
  );
  assert.equal(authorizeSingleDispatch({ record: intent, appendConfirmed: true, sameInvocation: false }).allowed, false);
  assert.equal(authorizeSingleDispatch({ record: intent, appendConfirmed: false, sameInvocation: true }).allowed, false);
});

test("recovery reconciles a visible run and never dispatches again", () => {
  const result = planNextDispatchState({
    sourceCommentId, targetSha, records: [intent],
    observedRuns: [{ dispatchId: intent.dispatchId, targetSha, runId: 444 }]
  });
  assert.equal(result.action, "RECONCILED");
  assert.equal(result.controllerRunId, 444);
});

test("recovery with an intent but no visible run is ambiguous and must not retry", () => {
  const result = planNextDispatchState({ sourceCommentId, targetSha, records: [intent] });
  assert.equal(result.action, "AMBIGUOUS_NO_RETRY");
});

test("duplicate ledger rows and duplicate matching runs fail closed", () => {
  assert.equal(planNextDispatchState({ sourceCommentId, targetSha, records: [intent, intent] }).action, "DENY");
  assert.equal(planNextDispatchState({
    sourceCommentId, targetSha, records: [intent],
    observedRuns: [
      { dispatchId: intent.dispatchId, targetSha, runId: 444 },
      { dispatchId: intent.dispatchId, targetSha, runId: 445 }
    ]
  }).action, "INCIDENT");
});

test("source comment cannot be rebound to another target SHA", () => {
  const result = planNextDispatchState({
    sourceCommentId, targetSha: "3d84f04bbc28385fe4da0cbdf47535a01eb9be1b",
    records: [intent]
  });
  assert.equal(result.action, "DENY");
  assert.equal(result.reason, "SOURCE_COMMENT_BINDING_CONFLICT");
});


test("unauthorized malformed ledger markers cannot poison trusted ledger parsing", () => {
  const trusted = ownerComment(encodeLedgerComment(admitted));
  const untrustedMalformed = [
    { body: "<!-- cloud-pool-next-ledger:v1 {not-json} -->", user: { login: "attacker" }, author_association: "CONTRIBUTOR", issue_url: "https://api.github.com/repos/VlDMlNSh/developer-cloud-pool/issues/96" },
    { body: "<!-- cloud-pool-next-ledger:v1", user: { login: "VlDMlNSh" }, author_association: "COLLABORATOR", issue_url: "https://api.github.com/repos/VlDMlNSh/developer-cloud-pool/issues/96" },
    { body: "<!-- cloud-pool-next-ledger:v1 {not-json} -->", user: { login: "VlDMlNSh" }, author_association: "OWNER", issue_url: "https://api.github.com/repos/VlDMlNSh/developer-cloud-pool/issues/95" }
  ];
  assert.deepEqual(parseLedgerComments([...untrustedMalformed, trusted]), [admitted]);
  assert.throws(() => parseLedgerComments([ownerComment("<!-- cloud-pool-next-ledger:v1 {not-json} -->")]), /Malformed Cloud Pool ledger JSON/);
});

test("ignores ledger-looking comments not authored by the repository owner on the control issue", () => {
  const body = encodeLedgerComment(admitted);
  const untrusted = [
    { body, user: { login: "attacker" }, author_association: "CONTRIBUTOR", issue_url: "https://api.github.com/repos/VlDMlNSh/developer-cloud-pool/issues/96" },
    { body, user: { login: "VlDMlNSh" }, author_association: "COLLABORATOR", issue_url: "https://api.github.com/repos/VlDMlNSh/developer-cloud-pool/issues/96" },
    { body, user: { login: "VlDMlNSh" }, author_association: "OWNER", issue_url: "https://api.github.com/repos/VlDMlNSh/developer-cloud-pool/issues/95" },
    { body }
  ];
  assert.deepEqual(parseLedgerComments(untrusted), []);
  assert.deepEqual(parseLedgerComments([ownerComment(body)]), [admitted]);
});
