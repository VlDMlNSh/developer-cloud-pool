const API_ORIGIN = "https://api.github.com";
const API_VERSION = "2022-11-28";
const DEFAULT_REPOSITORY = "VlDMlNSh/developer-cloud-pool";
const RESOURCE_PATHS = Object.freeze({
  repository: (owner, repo) => `/repos/${owner}/${repo}`,
  issues: (owner, repo) => `/repos/${owner}/${repo}/issues`,
  workflowRuns: (owner, repo) => `/repos/${owner}/${repo}/actions/runs`
});

const LIMITS = Object.freeze({
  maxPages: 3,
  maxPerPage: 50,
  maxResponseBytes: 256 * 1024,
  maxTimeoutMs: 5000
});

function failure(error, details = {}) {
  return { ok: false, error, ...details };
}

function isSafeRepository(value) {
  if (typeof value !== "string" ||
      !/^[A-Za-z0-9_.-]{1,100}\/[A-Za-z0-9_.-]{1,100}$/.test(value)) return false;
  const [owner, repo] = value.split("/");
  // URL normalizes dot segments before the request is sent (e.g. /repos/../user).
  return owner !== "." && owner !== ".." && repo !== "." && repo !== "..";
}

function isGitHubHtmlUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.origin === "https://github.com" &&
      !url.username && !url.password;
  } catch {
    return false;
  }
}

function validEtag(value) {
  return typeof value === "string" &&
    value.length <= 220 &&
    /^(?:W\/)?"[\x21\x23-\x7E\x80-\xFF]*"$/.test(value);
}

function readRateLimit(headers) {
  const remaining = headers.get("x-ratelimit-remaining");
  const reset = headers.get("x-ratelimit-reset");
  const retryAfter = headers.get("retry-after");
  return {
    remaining: remaining !== null && /^\d+$/.test(remaining) ? Number(remaining) : null,
    reset: reset !== null && /^\d+$/.test(reset) ? Number(reset) : null,
    retryAfter: retryAfter !== null && /^[0-9]{1,8}$/.test(retryAfter) ? retryAfter : null
  };
}

async function readJsonBounded(response, maxBytes) {
  const declaredLength = response.headers.get("content-length");
  if (declaredLength !== null && /^\d+$/.test(declaredLength) && Number(declaredLength) > maxBytes) {
    throw new Error("RESPONSE_TOO_LARGE");
  }
  if (!response.body) return null;

  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        try {
          await reader.cancel();
        } catch {
          // Preserve the bounded-size failure even if stream cancellation fails.
        }
        throw new Error("RESPONSE_TOO_LARGE");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new Error("INVALID_JSON");
  }
}

function projectRepository(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("INVALID_RESPONSE_SHAPE");
  }
  return {
    id: Number.isSafeInteger(data.id) ? data.id : null,
    name: typeof data.name === "string" ? data.name.slice(0, 100) : null,
    full_name: typeof data.full_name === "string" ? data.full_name.slice(0, 201) : null,
    default_branch: typeof data.default_branch === "string" ? data.default_branch.slice(0, 200) : null,
    private: typeof data.private === "boolean" ? data.private : null,
    html_url: isGitHubHtmlUrl(data.html_url) ? data.html_url.slice(0, 300) : null
  };
}

function projectIssues(data) {
  if (!Array.isArray(data)) throw new Error("INVALID_RESPONSE_SHAPE");
  return data.slice(0, LIMITS.maxPerPage).map((item) => ({
    number: Number.isSafeInteger(item?.number) ? item.number : null,
    title: typeof item?.title === "string" ? item.title.slice(0, 300) : null,
    state: item?.state === "open" || item?.state === "closed" ? item.state : null,
    updated_at: typeof item?.updated_at === "string" ? item.updated_at.slice(0, 40) : null,
    html_url: isGitHubHtmlUrl(item?.html_url) ? item.html_url.slice(0, 300) : null
  }));
}

function projectWorkflowRuns(data) {
  if (!data || typeof data !== "object" || !Array.isArray(data.workflow_runs)) {
    throw new Error("INVALID_RESPONSE_SHAPE");
  }
  return {
    total_count: Number.isSafeInteger(data.total_count) ? data.total_count : null,
    workflow_runs: data.workflow_runs.slice(0, LIMITS.maxPerPage).map((item) => ({
      id: Number.isSafeInteger(item?.id) ? item.id : null,
      name: typeof item?.name === "string" ? item.name.slice(0, 200) : null,
      event: typeof item?.event === "string" ? item.event.slice(0, 80) : null,
      status: typeof item?.status === "string" ? item.status.slice(0, 40) : null,
      conclusion: typeof item?.conclusion === "string" ? item.conclusion.slice(0, 40) : null,
      head_sha: typeof item?.head_sha === "string" && /^[a-f0-9]{40}$/i.test(item.head_sha) ? item.head_sha : null,
      run_number: Number.isSafeInteger(item?.run_number) ? item.run_number : null,
      created_at: typeof item?.created_at === "string" ? item.created_at.slice(0, 40) : null,
      updated_at: typeof item?.updated_at === "string" ? item.updated_at.slice(0, 40) : null,
      html_url: isGitHubHtmlUrl(item?.html_url) ? item.html_url.slice(0, 300) : null
    }))
  };
}

function nextPageFromLink(header, requestUrl, maxPages) {
  if (!header) return null;
  const entries = header.split(/,(?=\s*<)/);
  const next = entries.find((entry) => /;\s*rel="?next"?(?:;|$)/i.test(entry));
  if (!next) return null;
  const match = /^\s*<([^>]+)>\s*;\s*rel="?next"?\s*$/i.exec(next);
  if (!match) throw new Error("INVALID_PAGINATION_LINK");

  let candidate;
  try {
    candidate = new URL(match[1]);
  } catch {
    throw new Error("INVALID_PAGINATION_LINK");
  }
  if (candidate.origin !== API_ORIGIN || candidate.pathname !== requestUrl.pathname ||
      candidate.hash || candidate.username || candidate.password) {
    throw new Error("INVALID_PAGINATION_LINK");
  }

  const expectedKeys = requestUrl.pathname.endsWith("/issues")
    ? ["page", "per_page", "state"]
    : ["page", "per_page"];
  const keys = [...candidate.searchParams.keys()].sort();
  if (keys.join(",") !== expectedKeys.sort().join(",")) throw new Error("INVALID_PAGINATION_LINK");
  if (requestUrl.pathname.endsWith("/issues") && candidate.searchParams.get("state") !== "open") {
    throw new Error("INVALID_PAGINATION_LINK");
  }
  const page = Number(candidate.searchParams.get("page"));
  const perPage = Number(candidate.searchParams.get("per_page"));
  const currentPage = Number(requestUrl.searchParams.get("page") || "1");
  const currentPerPage = Number(requestUrl.searchParams.get("per_page") || "0");
  if (!Number.isSafeInteger(page) || page !== currentPage + 1 ||
      page > maxPages || perPage !== currentPerPage) {
    return null;
  }
  return page;
}

/**
 * Creates a no-credential, GET-only GitHub REST reader.
 * It is deliberately not mounted by the Hono Worker. Callers must not pass
 * browser-controlled URLs or tokens; only named resources and allowlisted repos.
 */
export function createGitHubReadAdapter({
  fetchImpl = globalThis.fetch,
  allowedRepositories = [DEFAULT_REPOSITORY],
  timeoutMs = 3500,
  maxResponseBytes = LIMITS.maxResponseBytes,
  maxPages = LIMITS.maxPages
} = {}) {
  if (typeof fetchImpl !== "function") throw new TypeError("fetchImpl must be a function");
  if (!Array.isArray(allowedRepositories) || allowedRepositories.length === 0 ||
      allowedRepositories.some((repo) => !isSafeRepository(repo))) {
    throw new TypeError("allowedRepositories must contain repository slugs");
  }
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > LIMITS.maxTimeoutMs) {
    throw new TypeError("timeoutMs is outside the supported bound");
  }
  if (!Number.isSafeInteger(maxResponseBytes) || maxResponseBytes < 1 ||
      maxResponseBytes > LIMITS.maxResponseBytes) {
    throw new TypeError("maxResponseBytes is outside the supported bound");
  }
  if (!Number.isSafeInteger(maxPages) || maxPages < 1 || maxPages > LIMITS.maxPages) {
    throw new TypeError("maxPages is outside the supported bound");
  }

  const allowed = new Set(allowedRepositories);

  async function read({ repository, resource, page = 1, perPage = 20, etag } = {}) {
    if (!allowed.has(repository)) return failure("REPOSITORY_NOT_ALLOWED");
    if (!Object.hasOwn(RESOURCE_PATHS, resource)) return failure("RESOURCE_NOT_ALLOWED");
    if (!Number.isSafeInteger(page) || page < 1 || page > maxPages) return failure("PAGE_OUT_OF_RANGE");
    if (!Number.isSafeInteger(perPage) || perPage < 1 || perPage > LIMITS.maxPerPage) {
      return failure("PAGE_SIZE_OUT_OF_RANGE");
    }
    if (resource === "repository" && page !== 1) return failure("PAGE_OUT_OF_RANGE");
    if (etag !== undefined && !validEtag(etag)) return failure("INVALID_ETAG");

    const [owner, repo] = repository.split("/");
    const path = RESOURCE_PATHS[resource](owner, repo);
    const url = new URL(path, API_ORIGIN);
    if (resource !== "repository") {
      if (resource === "issues") url.searchParams.set("state", "open");
      url.searchParams.set("per_page", String(perPage));
      url.searchParams.set("page", String(page));
    }
    if (url.origin !== API_ORIGIN) return failure("ORIGIN_REJECTED");

    const headers = new Headers({
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": API_VERSION
    });
    if (etag !== undefined) headers.set("If-None-Match", etag);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const finish = (result) => {
      clearTimeout(timeout);
      return result;
    };
    let response;
    try {
      response = await fetchImpl(url.toString(), {
        method: "GET",
        headers,
        redirect: "manual",
        cache: "no-store",
        signal: controller.signal
      });
    } catch (error) {
      return finish(failure(error?.name === "AbortError" ? "UPSTREAM_TIMEOUT" : "UPSTREAM_UNAVAILABLE"));
    }

    if (controller.signal.aborted) return finish(failure("UPSTREAM_TIMEOUT"));
    if (response.status === 304) {
      return finish({ ok: true, notModified: true, etag: response.headers.get("etag") || etag || null });
    }
    if (response.status >= 300 && response.status < 400) return finish(failure("REDIRECT_REJECTED"));

    const rateLimit = readRateLimit(response.headers);
    if (response.status === 429 || (response.status === 403 && rateLimit.remaining === 0)) {
      return finish(failure("RATE_LIMITED", { rateLimit }));
    }
    if (response.status === 401 || response.status === 403) return finish(failure("UPSTREAM_FORBIDDEN"));
    if (!response.ok) return finish(failure("UPSTREAM_ERROR", { status: response.status }));

    let raw;
    try {
      raw = await readJsonBounded(response, maxResponseBytes);
    } catch (error) {
      if (controller.signal.aborted || error?.name === "AbortError") {
        return finish(failure("UPSTREAM_TIMEOUT"));
      }
      return finish(failure(error.message === "RESPONSE_TOO_LARGE" ? "RESPONSE_TOO_LARGE" : "INVALID_UPSTREAM_RESPONSE"));
    }

    let data;
    try {
      if (resource === "repository") data = projectRepository(raw);
      else if (resource === "issues") data = projectIssues(raw);
      else data = projectWorkflowRuns(raw);
    } catch {
      return finish(failure("INVALID_UPSTREAM_RESPONSE"));
    }

    let nextPage;
    try {
      nextPage = nextPageFromLink(response.headers.get("link"), url, maxPages);
    } catch {
      return finish(failure("INVALID_PAGINATION_LINK"));
    }

    return finish({
      ok: true,
      notModified: false,
      data,
      etag: response.headers.get("etag"),
      nextPage,
      rateLimit
    });
  }

  return Object.freeze({ read });
}
