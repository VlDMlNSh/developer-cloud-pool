import { digestOwnerNextEnvelope } from "../proofs/d1-ledger/src/owner-next-envelope.mjs";

export const OWNER_NEXT_WORKFLOW_PATH = ".github/workflows/next-event-controller.yml";
const API_ORIGIN = "https://api.github.com";
const MAX_RESPONSE_BYTES = 256 * 1024;
const REQUEST_TIMEOUT_MS = 3_000;
const REPOSITORY = "VlDMlNSh/developer-cloud-pool";
const OWNER_ID = "157891068";
const REPOSITORY_ID = "1445644538";
const OWNER_LOGIN = "VlDMlNSh";
const ISSUE_NUMBER = 96;
const DEFAULT_BRANCH = "Основной";
const SHA40 = /^[0-9a-f]{40}$/;
const DECIMAL = /^[1-9][0-9]*$/;

function reject(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}

function assertObject(value, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) reject(code);
  return value;
}

function assertSha(value, code) {
  if (typeof value !== "string" || !SHA40.test(value)) reject(code);
  return value;
}

function assertDecimal(value, code) {
  const normalized = String(value);
  if (!DECIMAL.test(normalized) || !Number.isSafeInteger(Number(normalized))) reject(code);
  return normalized;
}

async function readBounded(response) {
  const declared = Number(response.headers?.get?.("content-length"));
  if (Number.isFinite(declared) && declared > MAX_RESPONSE_BYTES) reject("GITHUB_API_BODY_TOO_LARGE");
  if (!response.body?.getReader) reject("GITHUB_API_STREAM_UNAVAILABLE");
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES) {
        await reader.cancel().catch(() => {});
        reject("GITHUB_API_BODY_TOO_LARGE");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock?.();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export function createBoundedGitHubApiGet({ token, fetchImpl = globalThis.fetch, timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
  if (typeof token !== "string" || token.length === 0) reject("GITHUB_TOKEN_MISSING");
  if (typeof fetchImpl !== "function") reject("FETCH_UNAVAILABLE");
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 10_000) reject("TIMEOUT_CONFIGURATION_INVALID");

  return async function apiGet(path) {
    const repositoryRoot = "/repos/" + REPOSITORY;
    if (typeof path !== "string" || (path !== repositoryRoot && !path.startsWith(repositoryRoot + "/")) ||
        path.includes("..") || path.includes("\\\\") || /%(?:2f|5c|2e)/i.test(path) ||
        path.startsWith("//") || path.includes("#")) reject("GITHUB_API_PATH_NOT_ALLOWED");
    const url = new URL(path, API_ORIGIN);
    if (url.origin !== API_ORIGIN) reject("GITHUB_API_ORIGIN_NOT_ALLOWED");
    if (url.username || url.password || url.pathname !== repositoryRoot && !url.pathname.startsWith(repositoryRoot + "/")) {
      reject("GITHUB_API_PATH_NOT_ALLOWED");
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, {
        method: "GET",
        redirect: "error",
        signal: controller.signal,
        headers: {
          accept: "application/vnd.github+json",
          authorization: "Bearer " + token,
          "x-github-api-version": "2022-11-28"
        }
      });
      if (!response.ok) reject("GITHUB_API_HTTP_" + response.status);
      const source = await readBounded(response);
      try { return JSON.parse(source); } catch { reject("GITHUB_API_JSON_INVALID"); }
    } catch (error) {
      if (error?.code) throw error;
      if (controller.signal.aborted) reject("GITHUB_API_TIMEOUT");
      reject("GITHUB_API_TRANSPORT_FAILED");
    } finally {
      clearTimeout(timer);
    }
  };
}

async function gitBlobSha(bytes) {
  const header = new TextEncoder().encode("blob " + bytes.byteLength + "\0");
  const object = new Uint8Array(header.byteLength + bytes.byteLength);
  object.set(header);
  object.set(bytes, header.byteLength);
  const digest = await crypto.subtle.digest("SHA-1", object);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

async function verifyWorkflowBlob(file) {
  assertObject(file, "WORKFLOW_FILE_RESPONSE_INVALID");
  if (file.path !== OWNER_NEXT_WORKFLOW_PATH || file.encoding !== "base64" ||
      typeof file.content !== "string" || file.content.length > MAX_RESPONSE_BYTES * 2 ||
      !SHA40.test(file.sha ?? "")) reject("WORKFLOW_FILE_RESPONSE_INVALID");
  let binary;
  try {
    const raw = atob(file.content.replace(/\s/g, ""));
    binary = Uint8Array.from(raw, char => char.charCodeAt(0));
  } catch { reject("WORKFLOW_FILE_BASE64_INVALID"); }
  const actual = await gitBlobSha(binary);
  if (actual !== file.sha) reject("WORKFLOW_FILE_BLOB_DIGEST_MISMATCH");
  return file.sha;
}

/**
 * Read GitHub's event, issue, comment, run, workflow, default ref and workflow
 * file from the fixed api.github.com origin. The result is evidence only.
 */
export async function collectOwnerNextEnvelope({ event, env, apiGet }) {
  assertObject(event, "EVENT_PAYLOAD_INVALID");
  assertObject(env, "GITHUB_RUNTIME_CONTEXT_INVALID");
  if (typeof apiGet !== "function") reject("GITHUB_API_READER_MISSING");
  if (env.GITHUB_REPOSITORY !== REPOSITORY || env.GITHUB_EVENT_NAME !== "issue_comment" ||
      env.GITHUB_REF !== "refs/heads/" + DEFAULT_BRANCH ||
      !SHA40.test(env.GITHUB_SHA ?? "") || !SHA40.test(env.GITHUB_WORKFLOW_SHA ?? "") ||
      env.GITHUB_WORKFLOW_REF !== REPOSITORY + "/" + OWNER_NEXT_WORKFLOW_PATH + "@refs/heads/" + DEFAULT_BRANCH) {
    reject("GITHUB_RUNTIME_CONTEXT_MISMATCH");
  }
  if (event.action !== "created" || event.issue?.number !== ISSUE_NUMBER || event.issue?.pull_request ||
      event.comment?.body !== "/next" || event.comment?.user?.id !== Number(OWNER_ID) ||
      event.sender?.id !== Number(OWNER_ID) || event.comment?.author_association !== "OWNER" ||
      !Number.isSafeInteger(event.comment?.id)) reject("SOURCE_EVENT_NOT_ALLOWED");

  const commentId = assertDecimal(event.comment.id, "SOURCE_COMMENT_ID_INVALID");
  const runId = assertDecimal(env.GITHUB_RUN_ID, "GITHUB_RUN_ID_INVALID");
  const runAttempt = Number(assertDecimal(env.GITHUB_RUN_ATTEMPT, "GITHUB_RUN_ATTEMPT_INVALID"));
  if (runAttempt !== 1) reject("RERUN_REQUIRES_DURABLE_RECONCILIATION");

  const repoPath = "/repos/" + REPOSITORY;
  const [repository, issue, comment, workflowRun] = await Promise.all([
    apiGet(repoPath),
    apiGet(repoPath + "/issues/" + ISSUE_NUMBER),
    apiGet(repoPath + "/issues/comments/" + commentId),
    apiGet(repoPath + "/actions/runs/" + runId)
  ]);
  assertObject(repository, "REPOSITORY_RESPONSE_INVALID");
  assertObject(issue, "ISSUE_RESPONSE_INVALID");
  assertObject(comment, "COMMENT_RESPONSE_INVALID");
  assertObject(workflowRun, "WORKFLOW_RUN_RESPONSE_INVALID");

  if (repository.id !== Number(REPOSITORY_ID) || repository.full_name !== REPOSITORY ||
      repository.owner?.id !== Number(OWNER_ID) || repository.owner?.login !== OWNER_LOGIN ||
      repository.default_branch !== DEFAULT_BRANCH) reject("REPOSITORY_IDENTITY_MISMATCH");
  if (issue.number !== ISSUE_NUMBER || issue.pull_request || issue.node_id !== event.issue.node_id) reject("ISSUE_IDENTITY_MISMATCH");
  if (comment.id !== event.comment.id || comment.node_id !== event.comment.node_id ||
      comment.issue_url !== issue.url || comment.body !== "/next" ||
      comment.user?.id !== Number(OWNER_ID) || comment.author_association !== "OWNER") reject("COMMENT_IDENTITY_MISMATCH");
  if (workflowRun.id !== Number(runId) || workflowRun.run_attempt !== runAttempt ||
      workflowRun.event !== "issue_comment" || workflowRun.path !== OWNER_NEXT_WORKFLOW_PATH + "@" + DEFAULT_BRANCH ||
      workflowRun.repository?.id !== repository.id || workflowRun.actor?.id !== Number(OWNER_ID) ||
      workflowRun.head_branch !== DEFAULT_BRANCH || workflowRun.head_sha !== env.GITHUB_SHA) {
    reject("WORKFLOW_RUN_IDENTITY_MISMATCH");
  }

  const [workflow, defaultBranchRef, workflowFile] = await Promise.all([
    apiGet(repoPath + "/actions/workflows/" + workflowRun.workflow_id),
    apiGet(repoPath + "/git/ref/heads/" + encodeURIComponent(DEFAULT_BRANCH)),
    apiGet(repoPath + "/contents/" + OWNER_NEXT_WORKFLOW_PATH + "?ref=" + encodeURIComponent(workflowRun.head_sha))
  ]);
  assertObject(workflow, "WORKFLOW_METADATA_INVALID");
  assertObject(defaultBranchRef, "DEFAULT_REF_RESPONSE_INVALID");
  if (workflow.id !== workflowRun.workflow_id || workflow.path !== OWNER_NEXT_WORKFLOW_PATH ||
      workflow.state !== "active") reject("WORKFLOW_METADATA_MISMATCH");
  const observedDefaultHeadSha = assertSha(defaultBranchRef.object?.sha, "DEFAULT_REF_SHA_INVALID");
  const targetSha = assertSha(workflowRun.head_sha, "TARGET_SHA_INVALID");
  if (observedDefaultHeadSha !== targetSha) reject("DEFAULT_REF_MOVED_DURING_RUN");
  const workflowFileBlobSha = await verifyWorkflowBlob(workflowFile);

  const bodySha256 = [...new Uint8Array(await crypto.subtle.digest(
    "SHA-256", new TextEncoder().encode("/next")
  ))].map(byte => byte.toString(16).padStart(2, "0")).join("");

  const envelope = {
    schema: "cloud-pool.owner-next.api-attestation",
    version: 1,
    event: {
      name: "issue_comment", action: "created", body: "/next", bodySha256,
      repositoryId: REPOSITORY_ID, repository: REPOSITORY, ownerId: OWNER_ID,
      issueNumber: ISSUE_NUMBER, issueNodeId: issue.node_id,
      commentId, commentNodeId: comment.node_id,
      actorId: OWNER_ID, actorLogin: OWNER_LOGIN, authorAssociation: "OWNER"
    },
    ref: {
      name: "refs/heads/" + DEFAULT_BRANCH, defaultBranch: DEFAULT_BRANCH,
      observedDefaultHeadSha
    },
    run: {
      id: runId, attempt: runAttempt, event: "issue_comment",
      headBranch: DEFAULT_BRANCH, headSha: targetSha,
      workflowId: String(workflow.id), workflowPath: workflow.path,
      workflowState: workflow.state, workflowCommitSha: env.GITHUB_WORKFLOW_SHA,
      workflowFileBlobSha, workflowFileRefSha: targetSha
    },
    policy: { profile: "jarvis-code-sandbox-v1", dispatch: false, executionAuthorized: false }
  };
  const digest = await digestOwnerNextEnvelope(envelope);
  return { sourceJson: JSON.stringify(envelope), digest, envelope, dispatch: false, executionAuthorized: false };
}

export function mapGitHubActionsContext({ event, env, envelope }) {
  return {
    githubActions: "true", serverUrl: env.GITHUB_SERVER_URL,
    eventName: envelope.event.name, eventAction: envelope.event.action,
    repository: envelope.event.repository, repositoryId: envelope.event.repositoryId,
    ownerNumericId: envelope.event.ownerId, ownerLogin: envelope.event.actorLogin,
    actorId: envelope.event.actorId, actorLogin: envelope.event.actorLogin,
    ref: envelope.ref.name, sha: envelope.run.headSha,
    workflowRef: env.GITHUB_WORKFLOW_REF, workflowSha: env.GITHUB_WORKFLOW_SHA,
    runId: Number(envelope.run.id), runAttempt: envelope.run.attempt,
    issueNumber: envelope.event.issueNumber, isPullRequest: false,
    commentId: Number(envelope.event.commentId), commentBody: envelope.event.body,
    commentUserId: envelope.event.actorId, commentUserLogin: envelope.event.actorLogin,
    commentAuthorAssociation: envelope.event.authorAssociation
  };
}
