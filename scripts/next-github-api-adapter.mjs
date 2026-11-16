import { reconcileNextLedgerEvent } from "./next-github-ledger-adapter.mjs";

const OWNER_REPO = "VlDMlNSh/developer-cloud-pool";
const CONTROL_ISSUE = 96;
const DEFAULT_BRANCH = "Основной";
const API = "https://api.github.com";

function fail(reason) {
  return Object.freeze({ action: "BLOCKED", reason });
}


function makeHeaders(token) {
  if (typeof token !== "string" || token.length < 1) {
    throw new TypeError("GitHub token is required.");
  }
  return {
    Accept: "application/vnd.github+json",
    Authorization: "Bearer " + token,
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json"
  };
}

export function createGithubLedgerApi({ token, fetchImpl = fetch, ownerRepo = OWNER_REPO }) {
  if (ownerRepo !== OWNER_REPO) throw new TypeError("Unexpected repository binding.");
  if (typeof fetchImpl !== "function") throw new TypeError("Fetch implementation is required.");
  const headers = makeHeaders(token);

  async function getJson(path, options = {}) {
    const response = await fetchImpl(API + path, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) }
    });
    const raw = await response.text();
    let payload = null;
    try { payload = raw ? JSON.parse(raw) : null; } catch { payload = raw; }
    if (!response.ok) {
      throw new Error("GitHub API " + response.status + ": " +
        (payload && typeof payload === "object" ? payload.message || "request failed" : "request failed"));
    }
    return payload;
  }

  async function listPages(path, key) {
    const collected = [];
    for (let page = 1; page <= 100; page += 1) {
      const separator = path.includes("?") ? "&" : "?";
      const payload = await getJson(path + separator + "per_page=100&page=" + page);
      const items = key ? payload?.[key] : payload;
      if (!Array.isArray(items)) throw new Error("GitHub API returned an invalid paginated collection.");
      collected.push(...items);
      if (items.length < 100) return collected;
    }
    throw new Error("GitHub API pagination safety limit exceeded.");
  }

  return Object.freeze({
    listIssueComments: issueNumber => {
      if (issueNumber !== CONTROL_ISSUE) throw new TypeError("Unexpected control issue.");
      return listPages("/repos/" + OWNER_REPO + "/issues/" + CONTROL_ISSUE + "/comments");
    },
    createIssueComment: async (issueNumber, body) => {
      if (issueNumber !== CONTROL_ISSUE || typeof body !== "string" || !body.startsWith("<!-- cloud-pool-next-ledger:v1 ")) {
        throw new TypeError("Invalid ledger comment request.");
      }
      return getJson("/repos/" + OWNER_REPO + "/issues/" + CONTROL_ISSUE + "/comments", {
        method: "POST",
        body: JSON.stringify({ body })
      });
    },
    listWorkflowRuns: () => listPages("/repos/" + OWNER_REPO + "/actions/runs", "workflow_runs"),
    getControlIssue: () => getJson("/repos/" + OWNER_REPO + "/issues/" + CONTROL_ISSUE),
    getSourceComment: commentId => {
      if (!Number.isSafeInteger(commentId) || commentId <= 0) throw new TypeError("Invalid source comment ID.");
      return getJson("/repos/" + OWNER_REPO + "/issues/comments/" + commentId);
    },
    getDefaultBranchSha: async () => {
      const ref = await getJson("/repos/" + OWNER_REPO + "/git/ref/heads/" + encodeURIComponent(DEFAULT_BRANCH));
      return ref?.object?.sha || null;
    }
  });
}

/**
 * Source verification cannot authorize ledger mutation until the durable
 * controller lease is implemented. Fail closed before any GitHub API lookup.
 */
export async function reconcileVerifiedOwnerNextEvent() {
  return fail("DURABLE_LOCK_NOT_IMPLEMENTED");
}
