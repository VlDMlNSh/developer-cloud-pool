import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  digestOwnerNextEnvelope,
  parseStrictOwnerNextEnvelope,
  verifyOwnerNextEnvelope
} from "./owner-next-api-attestation-envelope.mjs";

const hash = (value) => createHash("sha256").update(value, "utf8").digest("hex");

function fixture() {
  const head = "a".repeat(40);
  return {
    schema: "cloud-pool.owner-next.api-attestation",
    version: 1,
    event: {
      name: "issue_comment", action: "created", body: "/next", bodySha256: hash("/next"),
      repositoryId: "1445644538", repository: "VlDMlNSh/developer-cloud-pool",
      ownerId: "157891068", issueNumber: 96, issueNodeId: "I_kwDOExample",
      commentId: "300000001", commentNodeId: "IC_kwDOExample",
      actorId: "157891068", actorLogin: "VlDMlNSh", authorAssociation: "OWNER"
    },
    ref: { name: "refs/heads/Основной", defaultBranch: "Основной", observedDefaultHeadSha: head },
    run: {
      id: "400000001", attempt: 1, event: "issue_comment", headBranch: "Основной", headSha: head,
      workflowId: "500000001", workflowPath: ".github/workflows/next-event-controller.yml",
      workflowState: "active", workflowCommitSha: "b".repeat(40),
      workflowFileBlobSha: "c".repeat(40), workflowFileRefSha: head
    },
    policy: { profile: "jarvis-code-sandbox-v1", dispatch: false, executionAuthorized: false }
  };
}

test("validates, canonicalizes and verifies a complete immutable envelope", () => {
  const envelope = fixture();
  const digest = digestOwnerNextEnvelope(envelope);
  const verified = verifyOwnerNextEnvelope(envelope, digest);
  assert.equal(verified.digest, digest);
  assert.equal(verified.dispatch, false);
  assert.equal(verified.executionAuthorized, false);
  const reordered = JSON.parse(JSON.stringify(envelope, Object.keys(envelope).sort()));
  assert.equal(digestOwnerNextEnvelope(envelope), digest);
  assert.equal(parseStrictOwnerNextEnvelope(JSON.stringify(envelope)).schema, envelope.schema);
});

const rejected = [
  ["unknown top-level key", (e) => { e.untrusted = true; }],
  ["unsupported version", (e) => { e.version = 2; }],
  ["wrong repository identity", (e) => { e.event.repositoryId = "999"; }],
  ["wrong issue", (e) => { e.event.issueNumber = 97; }],
  ["non-owner actor", (e) => { e.event.actorId = "123"; }],
  ["body substitution", (e) => { e.event.body = "/next "; }],
  ["body digest substitution", (e) => { e.event.bodySha256 = "f".repeat(64); }],
  ["non-canonical comment id", (e) => { e.event.commentId = "0300"; }],
  ["stale default ref", (e) => { e.ref.observedDefaultHeadSha = "d".repeat(40); }],
  ["workflow run head mismatch", (e) => { e.run.headSha = "d".repeat(40); }],
  ["workflow blob ref mismatch", (e) => { e.run.workflowFileRefSha = "d".repeat(40); }],
  ["workflow commit SHA malformed", (e) => { e.run.workflowCommitSha = "bad"; }],
  ["rerun blocked", (e) => { e.run.attempt = 2; }],
  ["dispatch policy enabled", (e) => { e.policy.dispatch = true; }],
  ["execution authority enabled", (e) => { e.policy.executionAuthorized = true; }]
];

for (const [name, mutate] of rejected) {
  test("rejects " + name, () => {
    const envelope = fixture();
    mutate(envelope);
    assert.throws(() => digestOwnerNextEnvelope(envelope));
  });
}

test("rejects supplied digest substitution", () => {
  const envelope = fixture();
  assert.throws(() => verifyOwnerNextEnvelope(envelope, "f".repeat(64)), { code: "ENVELOPE_DIGEST_MISMATCH" });
});

test("rejects duplicate JSON keys before JSON.parse last-key-wins behavior", () => {
  const raw = JSON.stringify(fixture()).replace('"version":1', '"version":1,"version":1');
  assert.throws(() => parseStrictOwnerNextEnvelope(raw), { code: "DUPLICATE_JSON_KEY" });
});

test("rejects unknown nested fields and malformed JSON", () => {
  const envelope = fixture();
  envelope.run.untrusted = "x";
  assert.throws(() => digestOwnerNextEnvelope(envelope), { code: "ENVELOPE_RUN_KEYS_INVALID" });
  assert.throws(() => parseStrictOwnerNextEnvelope('{"schema":'), { code: "INVALID_JSON" });
});

test("canonical digest is deterministic for repeated serialization", () => {
  const envelope = fixture();
  const digest = digestOwnerNextEnvelope(envelope);
  assert.equal(digestOwnerNextEnvelope(JSON.parse(JSON.stringify(envelope))), digest);
});
