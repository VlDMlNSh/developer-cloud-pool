# Issue #38 backend candidate and Cloudflare Q0 requalification — 2026-11-09

## Scope and safety boundary
Read-only review of Issue #38, current repository state, Cloudflare account identity/inventory/role visibility, and current Cloudflare product documentation. No resources, permissions, secrets, billing settings, payment methods, workers, deployments, provider calls or dispatch were created or changed.

## GitHub state
- Default branch `Основной`: `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- Issue #38 remains OPEN. It requires a real-backend one-winner test or explicit no-go, recovery, least privilege, exact-head evidence and fail-closed dispatch.
- Open PR inventory includes #54 (50-way local D1 contention), #53 (F2 finalizer fencing), #52 (local D1 attempt ledger/workflow compatibility), #51 (reconciliation queue), #50 (finalization replay idempotency), #49 (audit provenance validation), #40/#39 (D1 claim/outbox), #37 (Supervisor→Worker authorization boundary). All are OPEN/DRAFT; none accepted/merged in this audit.
- Autonomous-First policy is ADOPTED. External review is not a blanket prerequisite for each implementation iteration; separate multi-role audits after safe activation are required. Self-audit cannot self-assign final ACCEPTED. The lifecycle contract and adopted policy are on `docs/cross-chat-continuation-2026-11-06`.

## Cloudflare Q0 account evidence (read-only)
- Connected Cloudflare identity resolved to one account connection. Exactly one accessible standard account was returned.
- Account membership endpoint returned one accepted member with the account role `Super Administrator - All Privileges`. This is a broad account-level role, not a least-privilege project identity. Do not use this broad identity for production Worker/D1 provisioning or runtime authority; a separately scoped identity/binding must be designed and reviewed.
- Read-only inventory: D1 databases = 0; Durable Object namespaces = 0; Worker scripts = 0.
- Account subscription endpoint returned HTTP 403 because the connected OAuth session lacks Billing Read/Billing Write. No billing profile/payment method was read.
- Exact plan, card-free eligibility, remaining account quota and subscription remain **NOT VERIFIED**. `default_usage_model=standard` and empty entitlements do not prove Free or paid status.
- The account connection and account scope are reachable, but production account qualification is incomplete. No resource creation is authorized by this evidence.

## Backend candidate comparison

### C — Cloudflare D1 (retain as primary candidate, not selected/qualified)
- Existing repo already has a D1 schema/adapter, local Workers-runtime tests, conditional single-use update, unique constraints and atomic claim+outbox proof.
- Cloudflare D1 `batch()` executes statements sequentially, non-concurrently, in a single SQL transaction; failure aborts/rolls back the batch. A single conditional SQL mutation with a unique key and exactly-one-changed-row acceptance is the simplest fit for shared approval/task/outbox relational state.
- Public Workers Free documentation currently lists D1 availability with 5 million rows read/day, 100,000 rows written/day, 5 GB total SQL storage and 10 databases. Since 2026-09-01, Free-tier row-limit overages fail until midnight UTC rather than silently continuing.
- Local Miniflare/workerd tests are not remote D1 qualification. No remote D1 exists in this account inventory.

### Cloudflare Durable Objects SQLite (credible alternative; do not add now)
- Current Cloudflare docs describe global uniqueness per object ID and private, transactional, strongly consistent SQLite storage, with input/output gates. Storage methods are atomic/isolated; SQL-backed DOs are recommended for new namespaces.
- Workers Free supports SQLite-backed Durable Objects, but account entitlement and remaining quota remain unverified. DO introduces a new authority/runtime and binding design; one object per approval/task can provide per-entity serialization, but cross-approval indexes, outbox semantics, and the existing D1 relational proof would need a separate design and full real-backend qualification.
- Given the existing D1 implementation and no demonstrated D1 production blocker, introducing DO now would duplicate state machinery rather than reduce scope. Retain as an alternative only if a concrete D1 consistency/availability/latency requirement fails.

### A — GitHub Issue labels / Actions concurrency
- Already assessed in Issue #38: workflow concurrency is not a global CAS lock; label PATCH is not CAS. Defense-in-depth only, not the durable claim authority.

### B — Immutable Git refs
- Already assessed in Issue #38: Create Ref conflict response is a candidate primitive but requires Contents: write and delete/recreate protections. Do not grant Contents: write to current Supervisor.

## Decision
1. Retain D1 as the primary technical candidate because it matches the existing implementation and supports atomic SQL batch transactions/unique constraints. This is a candidate decision only; **NOT SELECTED FOR PRODUCTION / NOT QUALIFIED**.
2. Do not provision D1, Durable Objects, Worker scripts, or API tokens in this pass.
3. The current Cloudflare account identity is overprivileged for the project boundary (Super Administrator role); no production execution may use it. Design a dedicated least-privilege runtime identity and restrict authority to the exact Worker/D1 resources.
4. Account plan and card-free eligibility remain NOT VERIFIED because the subscription endpoint is denied. No paid fallback.
5. Keep both dispatch gates fail-closed. Continue test-first implementation of issuer provenance, server-derived owner identity, trusted clock, revocation, quota reservation, and recovery against local D1 before any controlled remote qualification.
6. Apply Autonomous-First policy: internal separated-role audits are part of later qualification; do not block routine safe implementation on a blanket external review, but do not self-assign ACCEPTED.

## Evidence and sources
- Issue #38: https://github.com/VlDMlNSh/developer-cloud-pool/issues/38
- D1 batch transaction semantics: https://developers.cloudflare.com/d1/worker-api/d1-database/
- D1 Free pricing/limits (last updated 2026-10-30): https://developers.cloudflare.com/d1/platform/pricing/
- D1 Free limit enforcement (2026-09-01): https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/
- Durable Objects SQLite transactional/strongly consistent storage: https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/
- Durable Objects global uniqueness and storage options: https://developers.cloudflare.com/workers/platform/storage-options/
- Durable Objects Free/paid limits (last updated 2026-11-07): https://developers.cloudflare.com/durable-objects/platform/limits/
- Autonomous-First policy: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/policies/AUTONOMOUS-FIRST-DEVELOPMENT-AND-ACCEPTANCE.md
- Shared lifecycle contract: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/contracts/SHARED-IMMUTABLE-CLAIM-LIFECYCLE-CONTRACT.md

## Status
- Cloudflare identity/account reachability: VERIFIED.
- Single-account scope: VERIFIED.
- Cloudflare member role least privilege: FAILED (broad Super Administrator).
- Existing D1/DO/Worker resources: none visible.
- Public Free product availability/quotas: VERIFIED from docs.
- Actual account plan/card-free entitlement: NOT VERIFIED.
- D1 remote backend: NOT PRESENT / NOT QUALIFIED.
- Durable Objects remote backend: NOT PRESENT / NOT QUALIFIED.
- D1 as primary technical candidate: SELECTED FOR FURTHER LOCAL QUALIFICATION ONLY.
- Dispatch: BLOCKED / FAIL-CLOSED.
- Contour A: BLOCKED / NOT QUALIFIED / NOT ACCEPTED.
- Contour B: DEFERRED.

Canonical MediaHub map (reference only): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
