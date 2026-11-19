const API_ROOT = "https://api.github.com";
const OWNER_REPO = "VlDMlNSh/developer-cloud-pool";
const OWNER_ID = "157891068";
const REPOSITORY_ID = "1445644538";
const DEFAULT_BRANCH = "Основной";
const REGISTRY_PATH = ".github/pool-executor-registry.json";
const SHA40 = /^[0-9a-f]{40}$/;
const EXECUTOR_ID = /^(claude-code|codex|gemini)-[1-9][0-9]*$/;

const deny = (reason) => Object.freeze({
  decision: "DENY",
  executionAuthorized: false,
  dispatch: false,
  reason
});

function decodeBase64Utf8(value) {
  if (typeof value !== "string" || value.length === 0) throw new Error("REGISTRY_CONTENT_EMPTY");
  const binary = atob(value.replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function getJson(fetchImpl, url, headers) {
  const response = await fetchImpl(url, { method: "GET", headers, redirect: "error" });
  if (!response || response.status !== 200) throw new Error("GITHUB_API_HTTP_" + String(response?.status ?? "UNKNOWN"));
  return response.json();
}

/**
 * Resolve an executor assignment from an owner-controlled registry pinned to
 * the independently fetched current default-branch commit.
 *
 * This verifies registry provenance and assignment policy only. It does not
 * attest which process is running, authenticate a worker, authorize execution,
 * or enable dispatch. The registry must be protected by repository governance.
 */
export async function resolveTrustedExecutorAssignment({
  executorId,
  profile,
  fetchImpl = globalThis.fetch,
  token,
  apiRoot = API_ROOT
} = {}) {
  if (typeof executorId !== "string" || !EXECUTOR_ID.test(executorId)) {
    return deny("INVALID_EXECUTOR_ID");
  }
  if (profile !== "dsh-headless-probe") return deny("PROFILE_NOT_ALLOWED");
  if (typeof fetchImpl !== "function") return deny("FETCH_UNAVAILABLE");
  if (apiRoot !== API_ROOT) return deny("UNTRUSTED_GITHUB_API_ROOT");

  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  };
  if (typeof token === "string" && token.length > 0) headers.Authorization = "Bearer " + token;

  try {
    const branchUrl = API_ROOT + "/repos/" + OWNER_REPO +
      "/branches/" + encodeURIComponent(DEFAULT_BRANCH);
    const branch = await getJson(fetchImpl, branchUrl, headers);
    const trustedDefaultHeadSha = branch?.commit?.sha;
    if (branch?.name !== DEFAULT_BRANCH || !SHA40.test(trustedDefaultHeadSha ?? "")) {
      return deny("UNTRUSTED_DEFAULT_BRANCH_RESPONSE");
    }

    const contentsUrl = API_ROOT + "/repos/" + OWNER_REPO +
      "/contents/" + REGISTRY_PATH.split("/").map(encodeURIComponent).join("/") +
      "?ref=" + encodeURIComponent(trustedDefaultHeadSha);
    const file = await getJson(fetchImpl, contentsUrl, headers);
    if (file?.path !== REGISTRY_PATH || file?.encoding !== "base64" ||
        typeof file?.content !== "string") {
      return deny("INVALID_EXECUTOR_REGISTRY_FILE");
    }

    let registry;
    try {
      registry = JSON.parse(decodeBase64Utf8(file.content));
    } catch {
      return deny("EXECUTOR_REGISTRY_PARSE_FAILED");
    }
    if (registry?.schemaVersion !== 1 ||
        String(registry.repositoryId) !== REPOSITORY_ID ||
        registry.defaultBranch !== DEFAULT_BRANCH ||
        !Array.isArray(registry.executors)) {
      return deny("EXECUTOR_REGISTRY_IDENTITY_MISMATCH");
    }

    const matches = registry.executors.filter((entry) => entry?.executorId === executorId);
    if (matches.length !== 1) return deny(matches.length ? "DUPLICATE_EXECUTOR_REGISTRY_ENTRY" : "EXECUTOR_NOT_REGISTERED");
    const entry = matches[0];
    if (entry.status !== "enabled") return deny("EXECUTOR_NOT_ENABLED");
    if (!Array.isArray(entry.profiles) || !entry.profiles.includes(profile)) {
      return deny("EXECUTOR_PROFILE_NOT_APPROVED");
    }
    const oidc = entry.oidcBinding;
    if (!oidc || typeof oidc.audience !== "string" || typeof oidc.subject !== "string" ||
        typeof oidc.workflowRef !== "string" || typeof oidc.jobWorkflowRef !== "string") {
      return deny("EXECUTOR_OIDC_BINDING_MISSING");
    }

    return Object.freeze({
      decision: "TRUSTED_ASSIGNMENT",
      executorId,
      profile,
      registryPath: REGISTRY_PATH,
      registryBlobSha: typeof file.sha === "string" ? file.sha : null,
      trustedDefaultHeadSha,
      source: "GITHUB_DEFAULT_BRANCH_CONTENTS_AT_VERIFIED_HEAD",
      oidcBinding: Object.freeze({
        audience: oidc.audience,
        subject: oidc.subject,
        repository: OWNER_REPO,
        repositoryId: REPOSITORY_ID,
        repositoryOwnerId: OWNER_ID,
        workflowRef: oidc.workflowRef,
        jobWorkflowRef: oidc.jobWorkflowRef
      }),
      executionAuthorized: false,
      dispatch: false
    });
  } catch {
    return deny("TRUSTED_EXECUTOR_LOOKUP_FAILED");
  }
}
