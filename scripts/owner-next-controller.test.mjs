import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { appendOwnerNextControllerOutputs, buildOwnerNextControllerOutputs } from "./owner-next-controller.mjs";

const sourceJson = JSON.stringify({
  schema: "cloud-pool.owner-next.api-attestation",
  version: 1,
  policy: { dispatch: false, executionAuthorized: false }
});
const result = {
  sourceJson,
  digest: "a".repeat(64),
  dispatch: false,
  executionAuthorized: false
};
const trustedContext = { githubActions: "true", serverUrl: "https://github.com" };

test("controller emits the exact serialized envelope and trusted context as base64 outputs", () => {
  const outputs = buildOwnerNextControllerOutputs(result, trustedContext);
  assert.equal(Buffer.from(outputs.source_json_base64, "base64").toString("utf8"), sourceJson);
  assert.equal(outputs.source_digest, result.digest);
  assert.deepEqual(JSON.parse(Buffer.from(outputs.trusted_context_base64, "base64").toString("utf8")), trustedContext);
  assert.equal(outputs.dispatch, "false");
  assert.equal(outputs.execution_authorized, "false");
  assert.ok(!Object.values(outputs).includes(sourceJson));
});

test("controller refuses any dispatch or execution authorization", () => {
  assert.throws(() => buildOwnerNextControllerOutputs({ ...result, dispatch: true }, trustedContext),
    /CONTROLLER_RESULT_NOT_READ_ONLY_OR_INVALID/);
  assert.throws(() => buildOwnerNextControllerOutputs({
    ...result,
    sourceJson: JSON.stringify({ schema: "cloud-pool.owner-next.api-attestation", version: 1,
      policy: { dispatch: true, executionAuthorized: false } })
  }, trustedContext), /CONTROLLER_ENVELOPE_POLICY_INVALID/);
  assert.throws(() => buildOwnerNextControllerOutputs(result, { ...trustedContext, serverUrl: "https://evil.invalid" }),
    /CONTROLLER_TRUSTED_CONTEXT_INVALID/);
});

test("controller writes only single-line, base64-safe GitHub outputs", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "owner-next-controller-"));
  const outputPath = path.join(directory, "github-output");
  try {
    const outputs = buildOwnerNextControllerOutputs(result, trustedContext);
    appendOwnerNextControllerOutputs(outputPath, outputs);
    const written = fs.readFileSync(outputPath, "utf8");
    assert.match(written, /^source_json_base64=[A-Za-z0-9+/=]+\nsource_digest=[0-9a-f]{64}\ntrusted_context_base64=[A-Za-z0-9+/=]+\ndispatch=false\nexecution_authorized=false\n$/);
    assert.throws(() => appendOwnerNextControllerOutputs(outputPath, { ...outputs, dispatch: "true\n::warning::injected" }),
      /CONTROLLER_OUTPUT_INVALID/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
