# 2026-11-11 — Web Console session-store architecture decision

## Immutable references and disposition

- Repository: `VlDMlNSh/developer-cloud-pool`.
- Default branch: `Основной`; observed HEAD remains `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- Issue #22 remains OPEN: primary secure web console.
- PR #24 remains OPEN / DRAFT / UNMERGED; branch `docs/jarvis-web-experience-adr-2026-11-06`; base `Основной`.
- Updated PR #24 HEAD: `c698cd549e09ace392a273915216f4b3cbda5d39`.
- Updated ADR blob: `18f5c130023ae70559be2c1b50a23b91c898fa6c`.
- ADR read-back: VERIFIED.
- Exact-head CI for new PR #24 HEAD: NOT RUN / NOT VERIFIED (workflow-run query empty).
- Formal reviews: 0; inline threads: 0.
- Existing preceding exact-head checks on earlier PR #24 head `d9a7389d4bb5562bb6f2a1e853ebc818659e2cd6`: OpenAPI Validation `42188894226` SUCCESS; Pool Contract Validation `42188894227` SUCCESS. These do not cover the new ADR commit.

## Problem resolved

Issue #22 requires server-side opaque application sessions with expiry and revocation, while the original hosting ADR simultaneously claimed the first read-only slice needed no database. These requirements were contradictory.

Workers KV is eventually consistent and not suitable for strict atomic one-use state or immediate revocation. Stateless signed cookies can provide integrity and expiry but cannot provide immediate per-session revocation without a separate revocation authority.

## Decision recorded

Updated the ADR to require a dedicated D1 database exclusively for Jarvis Experience OAuth transaction state and application sessions. It is explicitly separate from every Pool task/attempt/projection database and is not a task ledger.

Required controls:
- only the authenticated Hono Experience Worker receives the D1 binding; inventory every script/workflow with that binding;
- store only hashes of high-entropy opaque session identifiers and OAuth state values;
- server-side GitHub numeric user ID, expiry and revocation state; no browser tokens or OAuth access-token persistence;
- one-time OAuth transaction consumption by a conditional database write; replay must have zero successful consumers;
- indexed, parameterized, bounded queries and strict retention;
- validate every protected request against current database state;
- if read replication is enabled later, start auth lookups with D1 Sessions API `withSession("first-primary")`; never trust caller-supplied bookmarks;
- D1/binding/quota errors fail closed; generic 503 for infrastructure/quota failure; no KV/stateless/paid fallback;
- D1 auth database cannot grant task mutation, approval or dispatch authority.

This narrows "no database" to "no Pool task database/task ledger in the first Experience slice". The Experience auth database is a separate, explicit dependency.

## Free-only feasibility

Current official Cloudflare documentation reports D1 Workers Free limits of 5 million rows read/day, 100,000 rows written/day, 5 GB total account storage, up to 10 databases/account and 500 MB/database. Cloudflare enforces the daily row limits; queries fail until reset after an account exceeds them. D1 is available on Free and Paid plans, but the connected account's actual Workers Free entitlement remains NOT VERIFIED.

D1 Sessions API supports sequential consistency. `withSession("first-primary")` directs the first query to the primary database instance; subsequent queries in the same session are sequentially consistent. The implementation must use this for security-sensitive session lookups if replication is ever enabled.

Official sources:
- D1 pricing: https://developers.cloudflare.com/d1/platform/pricing/
- D1 limits: https://developers.cloudflare.com/d1/platform/limits/
- D1 Free quota enforcement: https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/
- D1 Sessions API: https://developers.cloudflare.com/d1/worker-api/d1-database/
- D1 replication consistency: https://developers.cloudflare.com/d1/best-practices/read-replication/

## Required next implementation gate

Before any provisioning:
1. Verify account-specific Workers Free entitlement using authorized metadata; public plan documentation is not account entitlement proof.
2. Produce an exact D1 row-read/write budget and hard usage thresholds for login, callback, session validation, logout and cleanup.
3. Design schema/migrations and a separate binding inventory; do not create the database yet.
4. Implement local D1/Workers-runtime negative tests for OAuth replay, concurrent state consumption, session revocation read-after-write, expiry, DB/quota outage and cross-boundary access.
5. Run exact-head CI, browser/mobile smoke tests and independent security review.
6. Keep all protected reads fail-closed until all gates pass. No public deployment, credentials, OAuth app setup, secrets, model calls, task mutations or dispatch.

## Scope and safety

- Documentation/architecture only. No runtime code, schema, D1 resource, binding, secret, OAuth App, Worker, permission, workflow or deployment changed.
- No account billing metadata or secret value was read.
- No paid resource or paid fallback.
- PR #24 remains unmerged; the documentation branch is not the default branch.
- Web Console authentication/session implementation NOT IMPLEMENTED / NOT QUALIFIED.
- Runtime deployment NOT RUN. Contour A BLOCKED / NOT ACCEPTED. Contour B DEFERRED.

## Canonical MediaHub map

https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
