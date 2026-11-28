export const OWNER_NEXT_ATTESTATION_SCHEMA = "cloud-pool.owner-next.api-attestation";
export const OWNER_NEXT_ATTESTATION_VERSION = 1;
export const OWNER_NEXT_ATTESTATION_DOMAIN = "cloud-pool.owner-next.api-attestation/v1";

const WORKFLOW_PATH = ".github/workflows/next-event-controller.yml";
const REPOSITORY = "VlDMlNSh/developer-cloud-pool";
const REPOSITORY_ID = "1445644538";
const OWNER_ID = "157891068";
const OWNER_LOGIN = "VlDMlNSh";
const DEFAULT_BRANCH = "Основной";
const PROFILE = "jarvis-code-sandbox-v1";
const SHA = /^[0-9a-f]{40}$/;
const DIGEST = /^[0-9a-f]{64}$/;
const DECIMAL = /^[1-9][0-9]*$/;
const TOP_KEYS = ["schema", "version", "event", "ref", "run", "policy"];
const EVENT_KEYS = ["name", "action", "body", "bodySha256", "repositoryId", "repository", "ownerId", "issueNumber", "issueNodeId", "commentId", "commentNodeId", "actorId", "actorLogin", "authorAssociation"];
const REF_KEYS = ["name", "defaultBranch", "observedDefaultHeadSha"];
const RUN_KEYS = ["id", "attempt", "event", "headBranch", "headSha", "workflowId", "workflowPath", "workflowState", "workflowCommitSha", "workflowFileBlobSha", "workflowFileRefSha"];
const POLICY_KEYS = ["profile", "dispatch", "executionAuthorized"];

function reject(code) {
  const error = new TypeError(code);
  error.code = code;
  throw error;
}

function exactKeys(value, expected, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) reject(code);
  const keys = Object.keys(value);
  if (keys.length !== expected.length || expected.some(key => !Object.hasOwn(value, key)) || keys.some(key => !expected.includes(key))) reject(code);
}

function decimal(value) {
  return typeof value === "string" && DECIMAL.test(value) && Number.isSafeInteger(Number(value));
}

function sha(value) {
  return typeof value === "string" && SHA.test(value);
}

function assertNoDuplicateJsonKeys(source) {
  let i = 0;
  const ws = () => { while (/[\\u0009\\u000a\\u000d\\u0020]/.test(source[i] ?? "")) i++; };
  function stringToken() {
    const start = i;
    if (source[i++] !== '"') reject("INVALID_JSON");
    while (i < source.length) {
      const c = source[i++];
      if (c === '"') {
        try { return JSON.parse(source.slice(start, i)); } catch { reject("INVALID_JSON"); }
      }
      if (c === "\\") {
        if (i >= source.length) reject("INVALID_JSON");
        const esc = source[i++];
        if (esc === "u") {
          if (!/^[0-9a-fA-F]{4}$/.test(source.slice(i, i + 4))) reject("INVALID_JSON");
          i += 4;
        } else if (!'"\\\\/bfnrt'.includes(esc)) reject("INVALID_JSON");
      } else if (c.charCodeAt(0) < 0x20) reject("INVALID_JSON");
    }
    reject("INVALID_JSON");
  }
  function value() {
    ws();
    const c = source[i];
    if (c === '"') { stringToken(); return; }
    if (c === "{") {
      i++; ws();
      const keys = new Set();
      if (source[i] === "}") { i++; return; }
      while (i < source.length) {
        ws();
        if (source[i] !== '"') reject("INVALID_JSON");
        const key = stringToken();
        if (keys.has(key)) reject("DUPLICATE_JSON_KEY");
        keys.add(key);
        ws();
        if (source[i++] !== ":") reject("INVALID_JSON");
        value(); ws();
        if (source[i] === "}") { i++; return; }
        if (source[i++] !== ",") reject("INVALID_JSON");
      }
      reject("INVALID_JSON");
    }
    if (c === "[") {
      i++; ws();
      if (source[i] === "]") { i++; return; }
      while (i < source.length) {
        value(); ws();
        if (source[i] === "]") { i++; return; }
        if (source[i++] !== ",") reject("INVALID_JSON");
      }
      reject("INVALID_JSON");
    }
    const rest = source.slice(i);
    const literal = /^(?:true|false|null)(?![A-Za-z0-9_$])/.exec(rest);
    if (literal) { i += literal[0].length; return; }
    const number = /^-?(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/.exec(rest);
    if (number) { i += number[0].length; return; }
    reject("INVALID_JSON");
  }
  value(); ws();
  if (i !== source.length) reject("INVALID_JSON");
}

export function validateOwnerNextEnvelope(envelope) {
  exactKeys(envelope, TOP_KEYS, "ENVELOPE_SCHEMA_KEYS_INVALID");
  if (envelope.schema !== OWNER_NEXT_ATTESTATION_SCHEMA || envelope.version !== OWNER_NEXT_ATTESTATION_VERSION) reject("ENVELOPE_VERSION_UNSUPPORTED");

  const e = envelope.event;
  exactKeys(e, EVENT_KEYS, "ENVELOPE_EVENT_KEYS_INVALID");
  if (e.name !== "issue_comment" || e.action !== "created" || e.body !== "/next" || e.authorAssociation !== "OWNER") reject("SOURCE_EVENT_NOT_ALLOWED");
  if (typeof e.bodySha256 !== "string" || !DIGEST.test(e.bodySha256)) reject("SOURCE_BODY_DIGEST_INVALID");
  if (e.repositoryId !== REPOSITORY_ID || e.repository !== REPOSITORY || e.ownerId !== OWNER_ID || e.issueNumber !== 96) reject("SOURCE_REPOSITORY_OR_ISSUE_INVALID");
  if (typeof e.issueNodeId !== "string" || !e.issueNodeId.trim() || !decimal(e.commentId) || typeof e.commentNodeId !== "string" || !e.commentNodeId.trim()) reject("SOURCE_NODE_IDENTITY_INVALID");
  if (e.actorId !== OWNER_ID || e.actorLogin !== OWNER_LOGIN) reject("SOURCE_ACTOR_NOT_OWNER");

  const r = envelope.ref;
  exactKeys(r, REF_KEYS, "ENVELOPE_REF_KEYS_INVALID");
  if (r.name !== "refs/heads/" + DEFAULT_BRANCH || r.defaultBranch !== DEFAULT_BRANCH || !sha(r.observedDefaultHeadSha)) reject("DEFAULT_REF_INVALID");

  const run = envelope.run;
  exactKeys(run, RUN_KEYS, "ENVELOPE_RUN_KEYS_INVALID");
  if (!decimal(run.id) || !Number.isSafeInteger(run.attempt) || run.attempt !== 1) reject("RUN_ID_OR_ATTEMPT_INVALID");
  if (run.event !== "issue_comment" || run.headBranch !== DEFAULT_BRANCH || !sha(run.headSha)) reject("RUN_SOURCE_INVALID");
  if (!decimal(run.workflowId) || run.workflowPath !== WORKFLOW_PATH || run.workflowState !== "active") reject("WORKFLOW_METADATA_INVALID");
  if (!sha(run.workflowCommitSha) || !sha(run.workflowFileBlobSha) || !sha(run.workflowFileRefSha)) reject("WORKFLOW_SHA_INVALID");
  if (run.headSha !== r.observedDefaultHeadSha || run.workflowFileRefSha !== run.workflowCommitSha) reject("RUN_REF_PROVENANCE_MISMATCH");

  const p = envelope.policy;
  exactKeys(p, POLICY_KEYS, "ENVELOPE_POLICY_KEYS_INVALID");
  if (p.profile !== PROFILE || p.dispatch !== false || p.executionAuthorized !== false) reject("POLICY_NOT_READ_ONLY");
  return envelope;
}

export async function digestOwnerNextEnvelope(envelope) {
  validateOwnerNextEnvelope(envelope);
  const e = envelope.event, r = envelope.ref, run = envelope.run, p = envelope.policy;
  const tuple = [
    OWNER_NEXT_ATTESTATION_DOMAIN, envelope.schema, envelope.version,
    e.name, e.action, e.body, e.bodySha256, e.repositoryId, e.repository, e.ownerId,
    e.issueNumber, e.issueNodeId, e.commentId, e.commentNodeId, e.actorId, e.actorLogin, e.authorAssociation,
    r.name, r.defaultBranch, r.observedDefaultHeadSha,
    run.id, run.attempt, run.event, run.headBranch, run.headSha, run.workflowId, run.workflowPath,
    run.workflowState, run.workflowCommitSha, run.workflowFileBlobSha, run.workflowFileRefSha,
    p.profile, p.dispatch, p.executionAuthorized
  ];
  const bytes = new TextEncoder().encode(JSON.stringify(tuple));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * sourceJson must be the serialized controller output; trustedContext must be
 * built directly from github context + runner env by mapGitHubActionsContext.
 * The envelope is evidence only and never grants dispatch/execution authority.
 */
export async function verifyOwnerNextEnvelopeForActions(sourceJson, suppliedDigest, trustedContext) {
  if (typeof sourceJson !== "string" || sourceJson.length === 0 || sourceJson.length > 16_384) reject("ENVELOPE_JSON_SIZE_INVALID");
  assertNoDuplicateJsonKeys(sourceJson);
  let envelope;
  try { envelope = JSON.parse(sourceJson); } catch { reject("INVALID_JSON"); }
  validateOwnerNextEnvelope(envelope);
  if (!trustedContext || trustedContext.githubActions !== "true" || trustedContext.serverUrl !== "https://github.com") reject("UNTRUSTED_GITHUB_ACTIONS_CONTEXT");

  const e = envelope.event, r = envelope.ref, run = envelope.run;
  if (trustedContext.eventName !== e.name || trustedContext.eventAction !== e.action ||
      trustedContext.repository !== e.repository || String(trustedContext.repositoryId) !== e.repositoryId ||
      String(trustedContext.ownerNumericId) !== e.ownerId || trustedContext.ownerLogin !== OWNER_LOGIN ||
      trustedContext.issueNumber !== e.issueNumber || trustedContext.isPullRequest !== false ||
      String(trustedContext.commentId) !== e.commentId || trustedContext.commentBody !== e.body ||
      String(trustedContext.commentUserId) !== e.actorId || trustedContext.commentUserLogin !== e.actorLogin ||
      trustedContext.commentAuthorAssociation !== e.authorAssociation ||
      trustedContext.actorLogin !== e.actorLogin || String(trustedContext.actorId) !== e.actorId) reject("ACTIONS_EVENT_CROSSCHECK_FAILED");

  if (trustedContext.ref !== r.name || trustedContext.sha !== run.headSha ||
      trustedContext.workflowSha !== run.workflowCommitSha || trustedContext.workflowRef !==
      "VlDMlNSh/developer-cloud-pool/" + WORKFLOW_PATH + "@" + r.name ||
      String(trustedContext.runId) !== run.id || trustedContext.runAttempt !== run.attempt) reject("ACTIONS_RUN_CROSSCHECK_FAILED");

  const bodyBytes = new TextEncoder().encode(e.body);
  const bodyHash = await crypto.subtle.digest("SHA-256", bodyBytes);
  const bodyDigest = [...new Uint8Array(bodyHash)].map(byte => byte.toString(16).padStart(2, "0")).join("");
  if (bodyDigest !== e.bodySha256) reject("SOURCE_BODY_DIGEST_INVALID");

  const actual = await digestOwnerNextEnvelope(envelope);
  if (typeof suppliedDigest !== "string" || !DIGEST.test(suppliedDigest)) reject("ENVELOPE_DIGEST_INVALID");
  if (actual !== suppliedDigest) reject("ENVELOPE_DIGEST_MISMATCH");
  return { decision: "VERIFIED", envelope, digest: actual, dispatch: false, executionAuthorized: false };
}
