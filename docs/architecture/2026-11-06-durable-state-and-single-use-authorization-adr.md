# Durable state and single-use authorization storage — architecture decision record

- Date: 2026-11-06
- Status: D1 PREFERRED CANDIDATE; DURABLE OBJECTS SECONDARY ALTERNATIVE; BOTH NOT QUALIFIED
- Scope: Contour A state persistence and atomic approval consumption.
- No deployment, cloud resource creation, billing/plan change, secret access, dispatch, or production integration is authorized by this record.

## Decision

Retain the earlier repository assessment: **Cloudflare D1 on Workers Free remains the preferred first candidate** for the central transactional single-use approval ledger because it is the simpler relational fit and its batch API provides SQL transaction semantics. **SQLite-backed Durable Objects remain a viable secondary alternative** when per-approval serialized coordination or object-local state is materially needed.

This ADR records the Durable Objects comparison and testing path; it does not reverse the existing D1 preference. Neither candidate is selected for production. Do not prototype both in parallel. The next bounded proof should continue with D1 unless new evidence demonstrates a concrete coordination requirement that justifies Durable Objects.

Do not treat either candidate as production-ready until local runtime tests, quota/failure tests, free-plan account eligibility, security review, and governance checks pass. Do not introduce KV, PostgreSQL, Redis, or a paid managed service.

## Why this candidate

The current repository has a local Python SQLite reference model for single-use approval consumption. It passed seven local tests, including 12 concurrent consumers with exactly one winner. That is useful state-transition evidence, but it is explicitly NOT a D1/Workers/Cloudflare integration test.

Durable Objects provide a natural coordination boundary:
- globally unique object identity within a namespace;
- one object instance per ID at a time;
- single-threaded event execution;
- strongly consistent, transactional storage;
- SQLite storage and SQL API for new classes.

The logical coordination key must be stable and derived from trusted, validated identifiers. Candidate partitioning: one object per immutable repository ID (or another reviewed coordination atom), not one global singleton for every repository. Approval consumption and associated state transition must happen within the same object transaction. A replay or ambiguous result must fail closed and move to needs-review; never restore the same approval to ready.

## Free-tier facts from current Cloudflare documentation

Cloudflare's current Durable Objects pricing documentation states:
- Durable Objects are available on Workers Free and Workers Paid.
- Workers Free supports SQLite-backed Durable Objects only.
- Free compute allowance: 100,000 requests/day and 13,000 GB-s/day.
- Free SQLite storage allowance: 5 million rows read/day, 100,000 rows written/day, and 5 GB total stored data.
- Daily free limits reset at 00:00 UTC.
- If a Free limit is exceeded, further operations of that type fail; design must treat that as a hard fail-closed condition.
- Workers Free does not charge for SQLite-backed Durable Objects beyond the free plan allowance; operations are subject to the documented failure/limit behavior. Do not upgrade or configure paid fallback.

Sources:
- https://developers.cloudflare.com/durable-objects/platform/pricing/
- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/changelog/post/2025-12-12-durable-objects-sqlite-storage-billing/

These public plan facts do NOT prove that the project's connected Cloudflare account is currently on Workers Free, eligible without a payment method, or has the necessary API permissions. Account-specific entitlement remains NOT VERIFIED. No Cloudflare account or billing settings were read or changed in this pass.

## Mature test component

Use Cloudflare's official Workers Vitest integration, `@cloudflare/vitest-plugin`, for tests that run inside the Workers runtime with real Durable Object bindings and isolated per-test-file storage. The integration runs locally through Miniflare; it does not require deploying a production Worker for the local test suite.

Official references:
- https://developers.cloudflare.com/workers/testing/vitest-integration/
- https://developers.cloudflare.com/durable-objects/examples/testing-with-durable-objects/
- https://developers.cloudflare.com/durable-objects/best-practices/access-durable-objects-storage/
- https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/

Pin exact package versions and lockfile entries before adding dependencies. Do not install floating versions.

## Required proof matrix

1. **Atomic consume:** two or more concurrent requests against the same approval ID produce exactly one accepted consume.
2. **Binding:** wrong owner numeric ID, repository ID, issue number, target SHA, worker profile, capability digest, or envelope digest is rejected.
3. **Expiry/replay:** expired, unknown, duplicate, consumed, edited/revoked, or replayed approval is rejected.
4. **Atomicity:** injected failure before commit leaves no partial state; failure after commit but before response is treated as ambiguous and must not authorize replay.
5. **Restart/eviction:** persisted state survives Durable Object eviction/recreation; use documented test helpers where supported.
6. **Isolation:** different repositories/approval IDs do not share authorization state or quota identity accidentally.
7. **Quota exhaustion:** simulated storage/request failures produce fail-closed behavior and a needs-review outcome; no automatic retry of the same approval.
8. **No side effects:** tests assert that no Worker dispatch, provider/model request, task mutation, or secret read occurs.
9. **Retention and cleanup:** expired/consumed records have explicit retention/cleanup rules; cleanup cannot reopen a consumed approval ID.
10. **Audit:** immutable event IDs, timestamps, actor provenance and redacted envelope digests are persisted; no credential material is stored.

## Explicit non-goals and gates

- No production Supervisor/Worker integration.
- No GitHub dispatch, DSH, Resource Probe, provider/model calls, live OAuth, or production session.
- No Cloudflare resource creation/deployment or account/billing changes.
- No secrets, API keys, tokens, or private key material.
- No use of Durable Objects as a substitute for GitHub owner-event provenance, workflow caller validation, issuer/capability checks, or repository governance.
- No claim that a durable store authenticates a caller. Authentication and authorization must be independently validated before ledger operations.

## Acceptance

This ADR is an architecture comparison only. The next implementation pass should continue with a local-only D1 adapter and transaction tests, following the prior free transactional state-store assessment. Durable Objects should receive a separate proof only if per-approval actor coordination is required and D1's transaction model proves insufficient. No storage adapter may be mounted in the Hono Worker or production workflow.

Production use requires exact-head CI, independent security review, free/no-card account eligibility read-back, current governance/ruleset verification, and explicit authorization for a separate disposable cloud test.
