# PR #40 lease lifecycle reconciliation — 2026-11-08

Status: SOURCE-VERIFIED DESIGN FINDING / NO IMPLEMENTATION CHANGE

## Immutable target and current refs

- Repository: `VlDMlNSh/developer-cloud-pool`
- PR #40: OPEN / DRAFT / UNMERGED; branch `proof/task-identity-fencing-design-2026-11-08`.
- Exact PR head: `2b7e30aeb8c404d84b2fe8bc36320aaa783520fb`.
- Base: PR #39 head `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`, not default branch.
- Exact-head local D1/Workers CI run `42489887940`: COMPLETED / SUCCESS; job `128759748692`. Artifact `13620723665`, SHA-256 `a79f822dd3acf44b22237d1fe164b8d446a0b269e6b40046987f2a3fda64d66b`.
- Contract proposal: `docs/contracts/2026-11-08-task-attempt-finalization-contract-proposal.md`, blob `7ba7b5285d564c43eb8d97e5901265d405aa75d5`.

## Source-level findings

Inspected the actual PR #40 patch at the immutable head, including:

- `proofs/d1-ledger/migrations/0003_create_logical_task_identity.sql`
- `proofs/d1-ledger/src/claim-outbox.mjs`
- `proofs/d1-ledger/src/task-lease.mjs`
- `proofs/d1-ledger/test/claim-outbox.test.ts`
- `proofs/d1-ledger/README.md`

The migration defines one `pool_tasks` row per logical `task_key`, with scalar `attempt_count`, `lease_generation`, `lease_owner` and `lease_expires_at`. It does not define a `pool_attempts` table or immutable `attempt_id` / `attempt_number` / `attempt_nonce` records.

In `acquireTaskLease`, every successful acquisition increments both `lease_generation` and `attempt_count`. An expired lease is reclaimed by updating the same task row. The old lease is fenced by generation, but no durable per-attempt history is retained. The five-attempt cap counts successful lease acquisitions, including expired-lease reclamations.

In `finalizeTaskLease`, a successful result directly changes the logical task state to `completed` and clears owner/expiry. It does not bind a result digest, Supervisor run/attempt, Worker run/attempt, workflow SHA, attempt ID, or append-only terminal audit event. There is no finalization idempotency key or outbox projection for terminal events.

The existing lease test proves generation increments from 1 to 2 after expiry and rejects the stale worker. It does not assert durable attempt history because none exists. The bounded-attempt test verifies five acquisitions then dead-letter, not immutable attempt records or restart recovery.

## Contract reconciliation

The proposal document describes:
- a distinct immutable `pool_attempts` row for each retry;
- `attempt_id`, `attempt_number`, and `attempt_nonce`;
- lease generation as a separate fence for takeover within one attempt;
- immutable provenance fields and terminal result digest;
- append-only audit and idempotent finalization.

That model is not implemented by PR #40. The PR currently implements a different model: one mutable lease slot on `pool_tasks`, where every acquisition/reclaim increments both generation and the attempt counter.

These models must not be described as equivalent. The PR #40 model can be interpreted as "each lease acquisition is a new attempt", but it cannot support the proposal's per-attempt immutable audit/history. It also makes the term "reclaim" misleading if the intended semantics are takeover within one attempt.

## Decision and bounded next step

- Do not modify PR #40 schema or adapter until the lifecycle model is selected explicitly.
- Recommended direction for the proposed durable audit contract: introduce immutable `pool_attempts` rows; create a new attempt on retry after an expired attempt is marked abandoned; keep a monotonic task-level fencing generation (or attempt-scoped generation with explicit uniqueness) to reject stale workers; make all transitions and audit inserts transactional.
- Before implementation, define exact semantics for: attempt creation, lease takeover, worker crash/expiry, retry count, dead-letter, and whether a takeover consumes a new attempt. Add migration-level invariants and adversarial tests for restart/replay and concurrent expiry reclaim.
- Keep PR #40 local-only and dispatch disabled. No production integration, remote D1 provisioning, secrets, provider calls, workflow dispatch, or deployment occurred.

## Status

- Source reconciliation: VERIFIED at PR #40 head `2b7e30aeb8c404d84b2fe8bc36320aaa783520fb`.
- Local D1/Workers CI: SUCCESS for exact head; does not validate remote D1 or production integration.
- Contract compatibility: NOT VERIFIED / INCOMPLETE; the proposal and current adapter use different lifecycle models.
- Independent review: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
