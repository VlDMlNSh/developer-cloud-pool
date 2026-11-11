# PR #58 / #59 SQL and recovery integration audit — 2026-11-11

## Immutable refs inspected
- PR #58 head: `6f7953e4abec3cc564984ee3635cdb7717ae5d5e`; base: `ec3f3266ca28c4fb5633a9475cc6f396a467797`; OPEN / DRAFT / UNMERGED.
- PR #59 head: `5c47cda4394d0381315bc16182799a09bf861797`; base: `6f7953e4abec3cc564984ee3635cdb7717ae5d5e`; OPEN / DRAFT / UNMERGED.
- PR #59 compares 8 commits ahead of its base, 0 behind.
- PR #59 exact-head merged checkout CI: run `42980783397`, job `130390442001`, SUCCESS; 53/53 tests.

## Files inspected
- `proofs/d1-ledger/migrations/0007_bound_projection_delivery_retries.sql`, blob `767d95a30fa0a14c79e88c8c58392bfec9cdddc2`.
- `proofs/d1-ledger/src/projection-outbox.mjs`, blob `1546c2e4172e3767ed8bd5642c7b9c6d95716d11`.
- `proofs/d1-ledger/src/projection-reconciler.mjs`, blob `2f83befc145d39ea60f06fe5b9e9033f89df40c0`.
- `proofs/d1-ledger/test/claim-outbox.test.ts`, blob `0b7c5f624ff726aa00ebd2618c3659eb9adf30fd`.
- `.github/workflows/d1-ledger-proof-validation.yml`, blob `a72b58c06b7d621a228df86bc2295110c9b5f451`.

## SQL / adapter findings
- Retry attempt cap is enforced by adapter predicate and SQL trigger.
- Backoff is deterministic at 30/60/120/240 seconds.
- Dead-letter transition requires five attempts, timestamp, reason and cleared lease.
- Dead-letter rows are terminal under the update trigger.
- Status event trigger writes transition evidence and reason code.
- Adapter returns `dispatch:false` on all inspected outcomes.
- Local adversarial tests cover normal fifth-failure dead-letter, no automatic requeue, and stale-generation denial for expired fifth-lease recovery.

## Blocking integration finding
- `deadLetterExpiredProjection()` exists in `projection-outbox.mjs`.
- The inspected `projection-reconciler.mjs` contains only fake/injected GitHub comment and label reconciliation; it does not import or invoke `deadLetterExpiredProjection()`.
- The inspected D1 workflow only installs dependencies, runs syntax checks/tests, and uploads a lockfile artifact. It is not a production recovery scheduler.
- The inspected migration labels itself local proof only.
- No inspected production Worker schedule, queue consumer, poller, hosted D1 migration application, or recovery invocation establishes that expired fifth leases are automatically processed.
- Therefore automatic recovery orchestration and hosted migration are NOT VERIFIED. The isolated recovery function is not proof of a live recovery loop.

## Disposition
- SQL invariant proof: VERIFIED in local Workers-runtime D1 tests only.
- Isolated expired-fifth-lease function: VERIFIED in local tests only.
- Automatic recovery orchestration: BLOCKED / NOT VERIFIED.
- Hosted D1 schema: NOT VERIFIED.
- Live GitHub projection: NOT VERIFIED.
- PR #58 and #59 remain OPEN / DRAFT / UNMERGED; no merge or deployment performed.
- Contour A remains BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

## Next bounded step
Trace the existing pool runtime/worker scheduling architecture and determine the intended durable trigger for outbox recovery. Prefer a mature GitHub-hosted/Cloudflare-native component already present in the repository. Produce a bounded integration design and tests for batch polling, expired lease recovery, retry idempotency, worker interruption, and observable evidence. Do not deploy or enable dispatch until governance and hosted migration gates are verified.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
