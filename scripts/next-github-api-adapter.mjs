import { reconcileNextLedgerEvent } from "./next-github-ledger-adapter.mjs";

const OWNER_REPO = "VlDMlNSh/developer-cloud-pool";
const OWNER_LOGIN = "VlDMlNSh";
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
 * Verifies the source against GitHub's canonical issue/comment APIs and
 * current default-branch ref before allowing the non-dispatching ledger step.
 * This function intentionally does not grant or exercise dispatch permission.
 */
export async function reconcileVerifiedOwnerNextEvent({
  sourceCommentId, targetSha, api, lockHeld
}) {
  if (lockHeld !== true) return fail("SERIAL_CONTROLLER_LOCK_REQUIRED");
  if (!api || typeof api.getControlIssue !== "function" ||
      typeof api.getSourceComment !== "function" ||
      typeof api.getDefaultBranchSha !== "function") {
    return fail("GITHUB_EVENT_VERIFIER_INCOMPLETE");
  }

  let issue, comment, currentDefaultSha;
  try {
    [issue, comment, currentDefaultSha] = await Promise.all([
      api.getControlIssue(),
      api.getSourceComment(sourceCommentId),
      api.getDefaultBranchSha()
    ]);
  } catch {
    return fail("SOURCE_AUTHORITY_LOOKUP_FAILED");
  }

  if (!issue || issue.number !== CONTROL_ISSUE || issue.state !== "open" || issue.pull_request) {
    return fail("CONTROL_ISSUE_NOT_OPEN_OR_NOT_ISSUE");
  }
  if (!comment || comment.id !== sourceCommentId ||
      comment.issue_url !== "https://api.github.com/repos/" + OWNER_REPO + "/issues/" + CONTROL_ISSUE) {
    return fail("SOURCE_COMMENT_NOT_BOUND_TO_CONTROL_ISSUE");
  }
  if (comment.body !== "/next") return fail("COMMENT_BODY_NOT_EXACT");
  if (comment.user?.login !== OWNER_LOGIN || comment.author_association !== "OWNER") {
    return fail("COMMENT_AUTHOR_NOT_OWNER");
  }
  if (!/^[0-9a-f]{40}$/.test(String(targetSha || "")) ||
      currentDefaultSha !== targetSha) {
    return fail("TARGET_SHA_NOT_CURRENT_DEFAULT_HEAD");
  }

  return reconcileNextLedgerEvent({
    sourceCommentId, targetSha, api, lockHeld: true
  });
}
