# Free transactional state-store assessment — 2026-11-06

## Scope and immutable baseline

Read-only comparison for a durable, atomic, single-use owner-approval consume ledger. No resource provisioning or billing action is authorized by this assessment.

- Production repository default branch: `Основной` @ `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- PR #32: OPEN / DRAFT / UNMERGED; head `75c83a288d865f1bbeda4905cf817e00084bcc2d`; base `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- Production Supervisor workflow blob: `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`.
- Production Worker workflow blob: `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`.

## Current Cloudflare account read-back

The existing Cloudflare connection resolves to one standard account. Read-only list endpoints returned:
- D1 databases: 0.
- Durable Object namespaces: 0.
- Worker scripts: 0.

No resource was created, updated, deleted or deployed. The account connection proves API reachability and account identity only. It does not prove Workers Free entitlement is activated, that signup is card-free, or that a future deployment can complete without a billing prompt. The previously reported card-acceptance problem remains an operational blocker until a real free-tier deployment path is independently demonstrated; do not retry payment/card flows or upgrade.

## Candidate comparison

### 1. Cloudflare D1 — preferred first candidate, NOT provisioned

- SQLite-backed serverless SQL database accessible from Workers.
- `D1Database.batch()` executes a sequence of prepared statements in one SQL transaction; statements execute sequentially/non-concurrently, and a failed statement aborts/rolls back the batch.
- Free tier (current docs, read 2026-11-06): 5 million rows read/day, 100,000 rows written/day, 5 GB total storage, 10 databases. Daily limits reset at 00:00 UTC; when a free limit is exceeded, further queries fail until reset rather than automatically billing overage.
- D1 free plan is included in Workers Free; docs state the Free plan will continue to include D1 prototyping/experimentation.
- Suitable schema concept: approval_id PRIMARY KEY / UNIQUE, immutable task_issue, repository_id, target_sha, profile, envelope_digest, owner_numeric_id, created_at, consumed_at, state. A single atomic INSERT guarded by the unique approval_id plus inspection of affected rows provides a candidate first-consumer-wins primitive. The exact SQL/API semantics and race behavior must be proven in local tests and a separately authorized disposable deployment before production admission.
- Security boundary: only a server-side Worker binding may access D1. No browser credential or direct client database access. Bind approval to owner numeric ID, repository ID, immutable issue/SHA/profile/envelope digest, expiry and consumed state. Duplicate/replay/conflicting payload must fail closed.
- Limits: 100,000 row writes/day is finite; hitting the limit causes denial of writes, which is fail-closed but can interrupt task execution. No paid fallback.

Docs:
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/d1/worker-api/d1-database/
- https://developers.cloudflare.com/d1/platform/limits/

### 2. Cloudflare SQLite-backed Durable Objects — viable alternative, NOT provisioned

- Per-object private persistent SQLite storage, globally unique object ID, coordination point for requests to that object.
- Storage operations are transactional and strongly consistent; each storage method is atomic/isolated.
- Free plan: 100,000 requests/day, 13,000 GB-seconds/day, 5 million rows read/day, 100,000 rows written/day, 5 GB total SQLite storage; exceeding a free limit causes operations to fail. SQLite-backed Durable Objects are the supported backend for new Free-plan namespaces.
- Could derive a deterministic object ID from a trusted approval event ID and perform single-consumer state transition within that object. This gives clear per-approval serialization and private state, but introduces more class/lifecycle/migration complexity than D1.
- Do not use a single global object for every task; model the coordination unit carefully. The DO instance is not a substitute for caller authentication or owner-approval provenance.

Docs:
- https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/
- https://developers.cloudflare.com/durable-objects/platform/pricing/
- https://developers.cloudflare.com/durable-objects/platform/limits/
- https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/

### 3. Cloudflare official starter code

- Official Worker + D1 template: https://github.com/cloudflare/templates/tree/main/d1-template
  - Read at main; README blob `abaf618a7af8687d03b50c9712b1499f6368b630`.
  - Demonstrates Worker binding, migrations and basic query path. It is a starter, not an authorization/nonce-consume implementation.
- Official SQLite-backed Durable Object example: https://github.com/cloudflare/templates/tree/main/voice-agent-template
  - README blob `5992911a6042bf583d9ebd07c5ca347ebdae4a55`.
  - Demonstrates SQLite-backed DO and server-side secret handling. It is a voice-agent application, not a single-use authorization ledger.
- Reuse the platform APIs and test patterns, not the unrelated product-specific agent logic.

### 4. Neon / Supabase / Turso

Not selected. This pass did not establish a no-card, no-billing-fallback path that is superior to the already-connected Cloudflare account. Introducing another provider/account would add credential identity, quota, billing, data-residency and operational dependencies. Reconsider only if Cloudflare Free cannot be activated without a payment instrument and a fully free alternative is independently verified.

## Decision

**Preferred candidate for a bounded prototype: Cloudflare D1 on Workers Free.** It is the simplest fit for a central immutable approval ledger with SQL uniqueness and transaction batches. Durable Objects remain a valid alternative where per-approval serialized coordination is materially needed.

This is an architecture recommendation only, not a deployment or qualification. Cloudflare Free entitlement/card-free activation is NOT VERIFIED; current account has no D1 database, DO namespace or Worker script. No D1/DO resource was created.

## Required qualification before production use

1. Prove the account can use Workers Free/D1 without adding a card, starting a paid subscription, or accepting paid fallback. If a payment method is demanded, STOP; do not bypass it.
2. Build a local-only prototype with deterministic schema/migrations and pinned dependencies.
3. Test duplicate approval IDs, concurrent consume attempts, replay, altered envelope, wrong owner ID, wrong repository, wrong target SHA/profile, expiry, database unavailable, write-limit/error response and retry after ambiguous response. Exactly one consume may succeed; all uncertain outcomes must fail closed.
4. Prove read-back and recovery semantics, audit retention, backup/restore, schema migration, access isolation and no browser exposure.
5. Integrate only after GitHub caller identity and owner approval provenance are independently established. A database uniqueness constraint cannot authenticate the GitHub workflow caller.
6. Obtain exact-head CI, independent security review and owner approval before any separately authorized disposable deployment. No production dispatch until every authorization gate is qualified.

## Current security blockers unchanged

- Supervisor retains privileged `workflow_run: completed`, `issues: write`, `actions: write`.
- Worker retains direct `workflow_dispatch`; Worker report job has `issues: write`.
- PR #32 exact-head authorization negative-first run `42236017811` / job `127953700048`: COMPLETED / FAILURE, expected red baseline. Pool Contract Validation `42236017724`: SUCCESS, not security qualification.
- PR #32 reviews 0, inline review threads 0, independent review NOT RUN.
- Effective Actions token identity/permissions NOT VERIFIED.
- Do not dispatch, enable Worker, merge PR #32, create cloud resources or call providers.

## Status and next step

- D1: PREFERRED CANDIDATE / NOT PROVISIONED / NOT QUALIFIED.
- SQLite Durable Objects: ALTERNATIVE / NOT PROVISIONED / NOT QUALIFIED.
- Cloudflare Free entitlement and card-free activation: NOT VERIFIED.
- Cloudflare account inventory: 0 D1 DBs / 0 DO namespaces / 0 Worker scripts at read-back.
- Single-use consume: NOT IMPLEMENTED / NOT VERIFIED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Next bounded step: local-only D1 consume prototype and adversarial concurrency tests, with no Cloudflare resource creation. Separately keep the free-plan/card-free activation gate unresolved until independently verified.
