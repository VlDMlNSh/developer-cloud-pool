import fs from "node:fs";
import { createBoundedGitHubApiGet, collectOwnerNextEnvelope, mapGitHubActionsContext } from "./owner-next-api-envelope.mjs";

const DIGEST = /^[0-9a-f]{64}$/;
const MAX_ENVELOPE_BYTES = 16_384;

function reject(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}

export function buildOwnerNextControllerOutputs(result, trustedContext) {
  if (!result || typeof result !== "object" ||
      result.dispatch !== false || result.executionAuthorized !== false ||
      typeof result.sourceJson !== "string" ||
      Buffer.byteLength(result.sourceJson, "utf8") > MAX_ENVELOPE_BYTES ||
      typeof result.digest !== "string" || !DIGEST.test(result.digest)) {
    reject("CONTROLLER_RESULT_NOT_READ_ONLY_OR_INVALID");
  }
  let envelope;
  try { envelope = JSON.parse(result.sourceJson); }
  catch { reject("CONTROLLER_ENVELOPE_JSON_INVALID"); }
  if (envelope?.schema !== "cloud-pool.owner-next.api-attestation" ||
      envelope?.version !== 1 || envelope?.policy?.dispatch !== false ||
      envelope?.policy?.executionAuthorized !== false) {
    reject("CONTROLLER_ENVELOPE_POLICY_INVALID");
  }
  if (!trustedContext || trustedContext.githubActions !== "true" ||
      trustedContext.serverUrl !== "https://github.com") {
    reject("CONTROLLER_TRUSTED_CONTEXT_INVALID");
  }

  return {
    source_json_base64: Buffer.from(result.sourceJson, "utf8").toString("base64"),
    source_digest: result.digest,
    trusted_context_base64: Buffer.from(JSON.stringify(trustedContext), "utf8").toString("base64"),
    dispatch: "false",
    execution_authorized: "false"
  };
}

export function appendOwnerNextControllerOutputs(outputPath, outputs) {
  if (typeof outputPath !== "string" || outputPath.length === 0 ||
      !outputs || typeof outputs !== "object") reject("GITHUB_OUTPUT_UNAVAILABLE");
  const keys = ["source_json_base64", "source_digest", "trusted_context_base64", "dispatch", "execution_authorized"];
  const lines = keys.map(key => {
    const value = outputs[key];
    if (typeof value !== "string" || !value || /[\r\n]/.test(value)) reject("CONTROLLER_OUTPUT_INVALID");
    return key + "=" + value;
  });
  fs.appendFileSync(outputPath, lines.join("\n") + "\n", { encoding: "utf8", flag: "a" });
}

export async function collectControllerEvidence({ event, env, apiGet }) {
  const result = await collectOwnerNextEnvelope({ event, env, apiGet });
  const trustedContext = mapGitHubActionsContext({ event, env, envelope: result.envelope });
  return { outputs: buildOwnerNextControllerOutputs(result, trustedContext), result, trustedContext };
}

export async function main(env = process.env) {
  if (typeof env.GITHUB_EVENT_PATH !== "string" || typeof env.GITHUB_OUTPUT !== "string") {
    reject("GITHUB_EVENT_OR_OUTPUT_PATH_MISSING");
  }
  if (typeof env.GITHUB_TOKEN !== "string" || env.GITHUB_TOKEN.length === 0) {
    reject("GITHUB_TOKEN_MISSING");
  }
  let event;
  try { event = JSON.parse(fs.readFileSync(env.GITHUB_EVENT_PATH, "utf8")); }
  catch { reject("GITHUB_EVENT_PAYLOAD_INVALID"); }
  const apiGet = createBoundedGitHubApiGet({ token: env.GITHUB_TOKEN });
  const { outputs, result } = await collectControllerEvidence({ event, env, apiGet });
  appendOwnerNextControllerOutputs(env.GITHUB_OUTPUT, outputs);
  process.stdout.write("OWNER_NEXT_CONTROLLER=READ_ONLY_VERIFIED\n");
  process.stdout.write("SOURCE_DIGEST=" + result.digest + "\n");
  process.stdout.write("DISPATCH=false\nEXECUTION_AUTHORIZED=false\n");
}

if (process.argv[1] && new URL(import.meta.url).pathname === new URL("file://" + process.argv[1]).pathname) {
  main().catch(error => {
    process.stderr.write("OWNER_NEXT_CONTROLLER=DENIED code=" + (error?.code || "CONTROLLER_FAILED") + "\n");
    process.exitCode = 1;
  });
}
