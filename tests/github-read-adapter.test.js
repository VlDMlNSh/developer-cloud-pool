import test from "node:test";
import assert from "node:assert/strict";
import { createGitHubReadAdapter } from "../src/github-read-adapter.js";

const REPOSITORY = "VlDMlNSh/developer-cloud-pool";

function jsonResponse(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "content-type": "application/json", ...init.headers },
    ...init
  });
}

test("rejects dot-segment repository slugs in the configured allowlist", () => {
  for (const repository of ["../issues", "./repo", "owner/..", "owner/."]) {
    assert.throws(
      () => createGitHubReadAdapter({ allowedRepositories: [repository] }),
      /allowedRepositories must contain repository slugs/
    );
  }
});

test("rejects non-allowlisted repositories before any network request", async () => {
  let calls = 0;
  const adapter = createGitHubReadAdapter({ fetchImpl: async () => { calls += 1; } });
  const result = await adapter.read({ repository: "attacker/other", resource: "repository" });
  assert.deepEqual(result, { ok: false, error: "REPOSITORY_NOT_ALLOWED" });
  assert.equal(calls, 0);
});

test("rejects ETags containing invalid HTTP entity-tag characters before network access", async () => {
  let calls = 0;
  const adapter = createGitHubReadAdapter({
    fetchImpl: async () => { calls += 1; throw new Error("must not fetch"); }
  });
  for (const etag of ['"contains space"', '"contains\t-tab"', '"contains\u0001-control"', '"contains\u007f-delete"', '"contains\u0100-unicode"']) {
    const result = await adapter.read({ repository: REPOSITORY, resource: "repository", etag });
    assert.equal(result.error, "INVALID_ETAG", JSON.stringify(etag));
  }
  assert.equal(calls, 0);
});

test("rejects arbitrary resources and out-of-range pagination", async () => {
  const adapter = createGitHubReadAdapter({ fetchImpl: async () => { throw new Error("must not fetch"); } });
  assert.equal((await adapter.read({ repository: REPOSITORY, resource: "arbitrary" })).error, "RESOURCE_NOT_ALLOWED");
  assert.equal((await adapter.read({ repository: REPOSITORY, resource: "issues", page: 4 })).error, "PAGE_OUT_OF_RANGE");
  assert.equal((await adapter.read({ repository: REPOSITORY, resource: "issues", perPage: 51 })).error, "PAGE_SIZE_OUT_OF_RANGE");
});

test("uses fixed GitHub origin, GET only, manual redirects and no Authorization header", async () => {
  let captured;
  const adapter = createGitHubReadAdapter({
    fetchImpl: async (url, init) => {
      captured = { url, init };
      return jsonResponse({
        id: 42, name: "developer-cloud-pool", full_name: REPOSITORY,
        default_branch: "Основной", private: false,
        html_url: "https://github.com/VlDMlNSh/developer-cloud-pool",
        description: "must not escape projection"
      }, { headers: { etag: '"repo-v1"' } });
    }
  });

  const result = await adapter.read({ repository: REPOSITORY, resource: "repository" });
  assert.equal(new URL(captured.url).origin, "https://api.github.com");
  assert.equal(new URL(captured.url).pathname, "/repos/VlDMlNSh/developer-cloud-pool");
  assert.equal(captured.init.method, "GET");
  assert.equal(captured.init.redirect, "manual");
  assert.equal(captured.init.cache, "no-store");
  assert.equal(captured.init.headers.get("accept"), "application/vnd.github+json");
  assert.equal(captured.init.headers.get("x-github-api-version"), "2022-11-28");
  assert.equal(captured.init.headers.has("authorization"), false);
  assert.deepEqual(result.data, {
    id: 42, name: "developer-cloud-pool", full_name: REPOSITORY,
    default_branch: "Основной", private: false,
    html_url: "https://github.com/VlDMlNSh/developer-cloud-pool"
  });
  assert.equal(result.etag, '"repo-v1"');
});

test("rejects lookalike, credentialed and non-HTTPS GitHub links in every projected resource", async () => {
  const invalidUrls = [
    "https://github.com.attacker.example/path",
    "https://user@github.com/VlDMlNSh/developer-cloud-pool",
    "http://github.com/VlDMlNSh/developer-cloud-pool"
  ];
  const fixtures = [
    {
      resource: "repository",
      payload: (html_url) => ({
        id: 42, name: "developer-cloud-pool", full_name: REPOSITORY,
        default_branch: "Основной", private: false, html_url
      }),
      getUrl: (data) => data.html_url
    },
    {
      resource: "issues",
      payload: (html_url) => [{
        number: 17, title: "Example", state: "open",
        updated_at: "2026-11-06T10:00:00Z", html_url
      }],
      getUrl: (data) => data[0].html_url
    },
    {
      resource: "workflowRuns",
      payload: (html_url) => ({
        total_count: 1,
        workflow_runs: [{
          id: 123, name: "CI", event: "pull_request", status: "completed",
          conclusion: "success", head_sha: "a".repeat(40), run_number: 1,
          created_at: "2026-11-06T10:00:00Z", updated_at: "2026-11-06T10:00:00Z",
          html_url
        }]
      }),
      getUrl: (data) => data.workflow_runs[0].html_url
    }
  ];

  for (const fixture of fixtures) {
    for (const htmlUrl of invalidUrls) {
      const adapter = createGitHubReadAdapter({
        fetchImpl: async () => jsonResponse(fixture.payload(htmlUrl))
      });
      const result = await adapter.read({ repository: REPOSITORY, resource: fixture.resource });
      assert.equal(result.ok, true, fixture.resource);
      assert.equal(fixture.getUrl(result.data), null, `${fixture.resource}: ${htmlUrl}`);
    }
  }
});

test("rejects upstream redirects without following them", async () => {
  let calls = 0;
  const adapter = createGitHubReadAdapter({
    fetchImpl: async () => {
      calls += 1;
      return new Response(null, { status: 302, headers: { location: "https://attacker.invalid/collect" } });
    }
  });
  const result = await adapter.read({ repository: REPOSITORY, resource: "repository" });
  assert.equal(result.error, "REDIRECT_REJECTED");
  assert.equal(calls, 1);
});

test("returns only bounded issue fields and validates same-origin pagination links", async () => {
  const adapter = createGitHubReadAdapter({
    fetchImpl: async (url) => {
      assert.equal(new URL(url).searchParams.get("page"), "1");
      return jsonResponse([{
        number: 17, title: "Example", state: "open",
        updated_at: "2026-11-06T10:00:00Z",
        html_url: "https://github.com/VlDMlNSh/developer-cloud-pool/issues/17",
        body: "large untrusted issue body must not be returned"
      }], {
        headers: {
          link: '<https://api.github.com/repos/VlDMlNSh/developer-cloud-pool/issues?state=open&per_page=20&page=2>; rel="next"',
          etag: '"issues-page-1"'
        }
      });
    }
  });
  const result = await adapter.read({ repository: REPOSITORY, resource: "issues" });
  assert.deepEqual(result.data, [{
    number: 17, title: "Example", state: "open",
    updated_at: "2026-11-06T10:00:00Z",
    html_url: "https://github.com/VlDMlNSh/developer-cloud-pool/issues/17"
  }]);
  assert.equal(result.nextPage, 2);
  assert.equal(result.etag, '"issues-page-1"');
});

test("rejects pagination links that escape the fixed origin or endpoint", async () => {
  const adapter = createGitHubReadAdapter({
    fetchImpl: async () => jsonResponse([], {
      headers: { link: '<https://evil.invalid/steal?page=2&per_page=20>; rel="next"' }
    })
  });
  const result = await adapter.read({ repository: REPOSITORY, resource: "issues" });
  assert.equal(result.error, "INVALID_PAGINATION_LINK");
});

test("supports conditional ETag requests and 304 without parsing a body", async () => {
  let captured;
  const adapter = createGitHubReadAdapter({
    fetchImpl: async (_url, init) => {
      captured = init;
      return new Response(null, { status: 304, headers: { etag: '"cached-v2"' } });
    }
  });
  const result = await adapter.read({ repository: REPOSITORY, resource: "repository", etag: '"cached-v1"' });
  assert.equal(captured.headers.get("if-none-match"), '"cached-v1"');
  assert.deepEqual(result, { ok: true, notModified: true, etag: '"cached-v2"' });
});

test("bounds response bodies even when Content-Length is absent", async () => {
  const adapter = createGitHubReadAdapter({
    maxResponseBytes: 32,
    fetchImpl: async () => new Response(JSON.stringify({ value: "x".repeat(100) }))
  });
  const result = await adapter.read({ repository: REPOSITORY, resource: "repository" });
  assert.equal(result.error, "RESPONSE_TOO_LARGE");
});

test("classifies rate limits without exposing upstream response bodies", async () => {
  const adapter = createGitHubReadAdapter({
    fetchImpl: async () => new Response("private upstream error detail", {
      status: 429,
      headers: { "retry-after": "60", "x-ratelimit-remaining": "0", "x-ratelimit-reset": "1793980800" }
    })
  });
  const result = await adapter.read({ repository: REPOSITORY, resource: "repository" });
  assert.equal(result.error, "RATE_LIMITED");
  assert.deepEqual(result.rateLimit, { remaining: 0, reset: 1793980800, retryAfter: "60" });
  assert.equal(JSON.stringify(result).includes("private upstream error detail"), false);
});

test("maps aborted upstream requests to a bounded timeout error", async () => {
  const adapter = createGitHubReadAdapter({
    timeoutMs: 5,
    fetchImpl: (_url, init) => new Promise((_resolve, reject) => {
      init.signal.addEventListener("abort", () => {
        const error = new Error("aborted");
        error.name = "AbortError";
        reject(error);
      }, { once: true });
    })
  });
  const result = await adapter.read({ repository: REPOSITORY, resource: "repository" });
  assert.equal(result.error, "UPSTREAM_TIMEOUT");
});
