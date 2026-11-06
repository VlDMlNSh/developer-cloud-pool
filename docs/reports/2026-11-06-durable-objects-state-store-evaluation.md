# Durable Objects state-store evaluation — 2026-11-06

## Scope

One bounded architecture research/documentation pass for Contour A persistence and single-use authorization. No implementation or cloud mutation.

## Baseline

- Default branch: `Основной`; latest observed HEAD in current context: `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- Documentation branch: `docs/cross-chat-continuation-2026-11-06`.
- Context updated in this pass; latest context blob SHA: `e295bacc3383ddc77d60bdbbb4e6969d12e63a3c`.
- New ADR: [Durable state and single-use authorization ADR](../architecture/2026-11-06-durable-state-and-single-use-authorization-adr.md), blob SHA `0e20bb8fcc530dff74e5d949d80e681c7316b0de`.
- ADR create commit: `dc79af5338763f749f25c56668e37f35a525a87f`.
- Context update commit: `e2e7d78e2cc21eaad8a71c727934ab88fe30043d`.

## Findings

The existing Python SQLite reference ledger has seven local tests and one 12-way concurrent-consume test. This is not D1, Workers runtime or Cloudflare integration evidence.

Official Cloudflare documentation confirms SQLite-backed Durable Objects are available on Workers Free. Public Free limits include:
- 100,000 DO requests/day;
- 13,000 GB-s/day;
- 5 million SQLite rows read/day;
- 100,000 rows written/day;
- 5 GB total SQL storage.

Free-plan operations fail when the corresponding limit is exceeded. The system must fail closed and never switch to paid fallback. Workers Free only supports SQLite-backed Durable Objects.

Cloudflare's official Workers Vitest integration supports local Miniflare tests with real Workers runtime APIs and Durable Object bindings. This is a viable local test path before any deployment.

## Decision

Select SQLite-backed Durable Objects as a candidate for local/synthetic proof only. Do not yet select it for production. Keep D1, KV, PostgreSQL, Redis and paid managed services out of scope for this proof.

## Required next tests

- concurrent consume: exactly one winner;
- owner/repository/issue/SHA/profile/digest binding;
- expiry and replay rejection;
- atomicity under failure and ambiguous response;
- eviction/recreation persistence;
- repository isolation;
- free-tier quota exhaustion fail-closed;
- no dispatch/provider/secret side effects;
- retention/cleanup without reopening consumed IDs;
- redacted immutable audit events.

## Status

- ADR: RECORDED.
- Durable Object implementation: NOT RUN.
- Workers-runtime tests: NOT RUN.
- Cloudflare account-specific Free/no-card eligibility: NOT VERIFIED.
- Cloud resource creation/deployment: NOT RUN.
- Independent review: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Sources

- https://developers.cloudflare.com/durable-objects/platform/pricing/
- https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/
- https://developers.cloudflare.com/durable-objects/examples/testing-with-durable-objects/
- https://developers.cloudflare.com/workers/testing/vitest-integration/
