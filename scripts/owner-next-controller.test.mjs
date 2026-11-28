import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { appendOwnerNextControllerOutputs, buildOwnerNextControllerOutputs } from "./owner-next-controller.mjs";
import { digestOwnerNextEnvelope } from "../proofs/d1-ledger/src/owner-next-envelope.mjs";

const sha = "a".repeat(40);
const envelope = {
  schema: "cloud-pool.owner-next.api-attestation",
  version: 1,
  event: {
    name: "issue_comment", action: "created", body: "/next",
    bodySha256: "65e2c8aed83c729f4663f27dceb83ec1b5abe5c0717eb156934fcce9658df2e3",
    repositoryId: "1445644538", repository: "VlDMlNSh/developer-cloud-pool",
    ownerId: "157891068", issueNumber: 96, issueNodeId: "I_kwDOTestIssue",
    commentId: "300", commentNodeId: "IC_kwDOTestComment",
    actorId: "157891068", actorLogin: "VlDMlNSh", authorAssociation: "OWNER"
  },
  ref: { name: "refs/heads/Основной", defaultBranch: "Основной", observedDefaultHeadSha: sha },
  run: {
    id: "400", attempt: 1, event: "issue_comment", headBranch: "Основной", headSha: sha,
    workflowId: "500", workflowPath: ".github/workflows/next-event-controller.yml",
    workflowState: "active", workflowCommitSha: "b".repeat(40),
    workflowFileBlobSha: "c".repeat(40), workflowFileRefSha: "b".repeat(40)
  },
  policy: { profile: "jarvis-code-sandbox-v1", dispatch: false, executionAuthorized: false }
};
const sourceJson = JSON.stringify(envelope);
const digest = await digestOwnerNextEnvelope(envelope);
const result = { sourceJson, digest, dispatch: false, executionAuthorized: false };
const trustedContext = { githubActions: "true", serverUrl: "https://github.com" };

test("controller emits the exact canonical serialized envelope and trusted context as base64 outputs", async () => {
  const outputs = await buildOwnerNextControllerOutputs(result, trustedContext);
  assert.equal(Buffer.from(outputs.source_json_base64, "base64").toString("utf8"), sourceJson);
  assert.equal(outputs.source_digest, digest);
  assert.deepEqual(JSON.parse(Buffer.from(outputs.trusted_context_base64, "base64").toString("utf8")), trustedContext);
  assert.equal(outputs.dispatch, "false");
  assert.equal(outputs.execution_authorized, "false");
  assert.ok(!Object.values(outputs).includes(sourceJson));
});

test("controller refuses dispatch, malformed envelope and digest substitution", async () => {
  await assert.rejects(() => buildOwnerNextControllerOutputs({ ...result, dispatch: true }, trustedContext),
    /CONTROLLER_RESULT_NOT_READ_ONLY_OR_INVALID/);
  const enabledEnvelope = { ...envelope, policy: { ...envelope.policy, dispatch: true } };
  await assert.rejects(() => buildOwnerNextControllerOutputs({
    ...result, sourceJson: JSON.stringify(enabledEnvelope)
  }, trustedContext), /CONTROLLER_ENVELOPE_POLICY_INVALID/);
  await assert.rejects(() => buildOwnerNextControllerOutputs({
    ...result, digest: "d".repeat(64)
  }, trustedContext), /CONTROLLER_ENVELOPE_DIGEST_MISMATCH/);
  await assert.rejects(() => buildOwnerNextControllerOutputs(result, {
    ...trustedContext, serverUrl: "https://evil.invalid"
  }), /CONTROLLER_TRUSTED_CONTEXT_INVALID/);
});

test("controller writes only single-line, base64-safe GitHub outputs", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "owner-next-controller-"));
  const outputPath = path.join(directory, "github-output");
  try {
    const outputs = await buildOwnerNextControllerOutputs(result, trustedContext);
    appendOwnerNextControllerOutputs(outputPath, outputs);
    const written = fs.readFileSync(outputPath, "utf8");
    assert.match(written, /^source_json_base64=[A-Za-z0-9+/=]+\nsource_digest=[0-9a-f]{64}\ntrusted_context_base64=[A-Za-z0-9+/=]+\ndispatch=false\nexecution_authorized=false\n$/);
    assert.throws(() => appendOwnerNextControllerOutputs(outputPath, {
      ...outputs, dispatch: "true\n::warning::injected"
    }), /CONTROLLER_OUTPUT_INVALID/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});


test("issue_comment activation is default-branch gated and controller policy stays immutable", () => {
  const workflow = fs.readFileSync(".github/workflows/next-event-controller.yml", "utf8");
  const activation = fs.readFileSync("docs/architecture/OWNER-NEXT-ISSUE-COMMENT-ACTIVATION-CONTRACT.md", "utf8");
  assert.match(workflow, /^on:\\s*\\n  issue_comment:\\s*\\n    types:\\s*\\[created\\]/m);
  assert.doesNotMatch(workflow, /^  (?:workflow_dispatch|workflow_run|workflow_call|schedule):/m);
  assert.match(workflow, /actions\\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1/);
  assert.match(workflow, /actions\\/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1/);
  assert.match(workflow, /package-manager-cache:\\s*false/);
  assert.match(activation, /does not trigger an \\x60issue_comment\\x60 workflow unless the workflow file exists on the repository's default branch/);
  assert.match(activation, /Live \\x60issue_comment\\x60 execution: \\*\\*NOT RUN\\*\\*/);
});
