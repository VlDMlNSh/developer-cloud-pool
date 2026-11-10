# Cloudflare D1 suitability for claim qualification — 2026-11-10

## Scope

Documentation-only assessment for Issue #38 after the read-only account inventory. No D1 database or Worker exists in the connector-visible Cloudflare account inventory. No resource was created, modified, or deleted; no secrets read; no SQL executed; no dispatch or provider invoked.

## Official platform facts (documentation last updated 2026-10-30 where stated)

Cloudflare D1 documentation establishes:

- Workers Free includes D1 prototyping/experimentation. D1 Free limits: 5 million rows read/day, 100,000 rows written/day, 5 GB total storage, and 10 databases/account. Daily read/write limits reset at 00:00 UTC. Exceeding daily row limits causes queries to fail until reset; it does not delete stored data.
- Each D1 database is inherently single-threaded and processes queries one at a time. Concurrent requests are queued; if the queue fills, requests can fail with an overloaded error.
- D1 `batch()` executes prepared statements sequentially and non-concurrently in one SQL transaction. If a statement fails, the batch aborts/rolls back.
- `batch()` reduces network round trips but does not reduce row-read/row-write accounting; each statement remains separately counted in analytics.

Sources:
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/d1/platform/limits/
- https://developers.cloudflare.com/d1/worker-api/d1-database/
- https://developers.cloudflare.com/d1/observability/debug-d1/
- https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/

## Assessment for Issue #38

D1 is a plausible free-tier candidate for a claim protocol because its per-database serialized execution and transactional batch primitive can support an atomic conditional claim design. The protocol still needs to demonstrate correctness with an actual isolated database, not infer correctness from the platform model alone.

Proposed qualification design, not yet implemented:

1. A dedicated disposable D1 database and a test-only Worker binding; no production database or Worker.
2. A claims table with a canonical logical-task key enforced by a database UNIQUE constraint. The unique constraint is the final invariant, not an application-side read-then-write check.
3. Each contender attempts the same logical claim using one atomic conditional INSERT/UPSERT or a transactionally equivalent statement sequence; success is determined from the database result, not a preflight SELECT.
4. Concurrently submit a bounded contender set, then query the durable record and audit rows. Acceptance requires exactly one winning claim identity and no duplicate task-level delivery/outbox.
5. Inject controlled failures between claim and subsequent lifecycle steps; verify retry/idempotency and recovery without duplicate winners or premature lease release.
6. Repeat the test after Worker restart and record database identity, schema digest, test code commit, request count, results, and artifact digests.
7. Apply strict read/write budgets well below Free limits, account for index write amplification, and stop on any quota/overload signal. Do not upgrade or incur paid fallback.

## Limitations and unresolved requirements

- The connected Cloudflare account currently lists zero D1 databases and zero Worker scripts. The connector inventory does not itself establish whether a new resource can be created under the intended free-tier terms.
- The actual claim protocol must run through the intended Worker binding and production-equivalent SQL path; a REST query fixture or local Miniflare test alone is insufficient.
- A D1 single-threaded execution model is not by itself proof of application-level exactly-once behavior. The schema constraint, conditional write, transaction boundaries, response interpretation, idempotency, and recovery must all be tested.
- Free-tier quotas are account-level or aggregate where documented; the test must avoid interfering with unrelated workloads.
- The API token must be narrowly scoped to the test resource/account actions required; no broad account-wide credentials should be added to Supervisor.
- This assessment does not establish independent review, hosted qualification, or dispatch authorization.

## Decision

Recommend Cloudflare D1 as the first candidate backend for a separately authorized, disposable, free-tier qualification environment. Do not create it or enable dispatch in this pass. The next action is to confirm owner authorization for creating one isolated D1 database and one test-only Worker, plus a least-privilege credential path. If free-tier constraints or permissions cannot be verified, retain fail-closed dispatch.

## Status

- D1 platform suitability: DOCUMENTATION-ASSESSED / NOT QUALIFIED.
- Actual isolated backend test: NOT RUN.
- Independent review: NOT RUN.
- Issue #38: OPEN / NOT QUALIFIED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
