# Cloud Development Pool — isolated D1 proof

This directory contains a local-only Cloudflare Workers/D1 proof. It is not mounted in the product Worker, the Hono web console, production Supervisor/Worker workflows, or any deployed service.

## Current migration baseline

The clean-base candidate starts from the owner-approved CODE capability root and preserves the selected canonical source lineage:

- 0001: CODE approval ledger with exact `jarvis-code-sandbox-v1` profile constraint.
- 0002–0005: historical per-approval tables, logical task identity, immutable attempts and non-authorizing reconciliation.
- 0006–0010: independent terminal-attempt projection outbox, bounded delivery retries, identity immutability and at-most-once comment-post state.
- 0011: immutable executor identity on approvals and logical tasks; replaces the task-keyed trigger to require executor match and disables the legacy approval-keyed claim/outbox trigger.
- 0012: additive qualified admission, route qualification, admission receipt and task-ready outbox binding.

Migration 0011 deliberately does not backfill historical rows because their executor identity cannot be inferred. Existing rows without an executor ID cannot be consumed through the canonical task-keyed trigger. Pass 27 adds a forward-only atomic qualified-admission migration (0012) and adapts the local admission adapter to canonical task identity v2. The adapter binds executor identity across approval, logical task, admission, outbox linkage and commit receipt. Lease guard and the full legacy-table write-denial migration remain outstanding.

## Runtime and test boundary

- Exact-pinned development dependencies: `@cloudflare/vitest-plugin@1.4.7`, `vitest@4.1.12`.
- Uses the official Cloudflare Workers Vitest integration and local Miniflare/workerd D1 runtime.
- Uses only synthetic test rows.
- No account API, hosted D1, secrets, provider calls, GitHub writes, workflow dispatch, or external execution.
- The Worker entrypoint is deliberately inert and returns 404.
- Every observed queue and adapter in this proof is non-dispatching. This package does not grant execution authority.

## Run

With Node.js 24:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run check
npm test
```

The ordinary D1 suite applies migrations 0001–0012 to a fresh local D1 database. The separate `UPGRADE_DB` test binding exercises a staged upgrade: it applies only 0001–0010, seeds historical synthetic approval/task/attempt/outbox rows at that boundary, and then applies only 0011–0012. It checks preservation of historical IDs and relationships, the intentionally-null legacy executor identity, fail-closed handling of unidentifiable legacy approvals, executor-bound atomic admission, receipt/outbox linkage, exact replay, cross-executor task-key conflict, migration reapplication and missing-receipt denial.

This is an isolated synthetic upgrade fixture, not a dump of any hosted or production database. The upgrade path does not run all migrations on an empty database and call that an upgrade.

## Atomic admission v2

- Migration 0012 is adapted from the historical atomic-admission proof, not copied unchanged. It uses the CODE profile and adds executor identity to admission and receipt rows.
- The adapter derives the task key through `canonicalTaskKey` (v2), checks executor identity on input, replay, approval consumption and final readback, and never dispatches.
- The tests use synthetic local rows and include executor-substitution denial cases.

## Status

This is a candidate proof foundation on a clean branch from a frozen default SHA. It is not a hosted deployment, executor qualification, or Contour A acceptance.


## Pass 32 — ambiguous D1 batch acknowledgement and durable readback

- Admission pre-read and post-write verification use D1 `withSession("first-primary")` so the first read is routed to the primary and later reads in the same session remain sequentially consistent.
- A rejected/ambiguous `batch()` is not reported as a rollback. The adapter performs a new primary-first readback and returns `ADMISSION_ALREADY_COMMITTED` only when the immutable admission, approval, executor, attempt, route evidence, receipt, task-ready outbox and current task-attempt tuple all match.
- If no complete durable record can be observed, the result is `ADMISSION_OUTCOME_UNCONFIRMED`; callers must retain the same admission identity for retry/reconciliation and must not mint a new one.
- Fault injection covers: commit then lost acknowledgement; failure before commit followed by exact same-key retry; and unavailable primary readback after commit. Dispatch remains disabled.
- D1 batch atomicity and D1 Sessions API semantics are based on Cloudflare's documented binding behavior. No external orchestration dependency is added.


## Pass 33 — SQL-level authorization and receipt binding

- Added forward-only migration 0013 to freeze approval authorization identity, make consumed/revoked states monotonic, and require consumed_at/task_key/admission_id to bind in one ready-to-consumed update.
- Added database-level admission checks for the consumed approval, task/executor identity, active route qualification, evidence digest and qualification freshness.
- Added a receipt INSERT guard that binds every receipt identity to the admission, prepared attempt, current task pointer, pending task-ready outbox and active qualification. Adapter checks remain defense in depth, not the only enforcement layer.
- Adversarial tests cover direct SQL mutation of consumed approval identity, direct admission against revoked route evidence, and forged receipt attempt identity.
- Migration upgrade tests now exercise 0013 as part of the forward-only 0011–0013 upgrade sequence.
- This remains local synthetic D1 proof. Lease fencing, trusted event provenance, hosted D1, executor qualification and independent review are separate gates.


## Pass 34 — database-enforced lease and fencing

Migration `0014_d1_lease_fencing_guards.sql` closes SQL-level bypasses in the immutable-attempt lease lifecycle:

- A lease acquisition is a single pending → leased transition for the current prepared attempt, with exactly one positive monotonic generation increment and a bounded expiry.
- A live lease can only be renewed by preserving owner, attempt and generation while extending expiry; an expired lease cannot be renewed.
- A running attempt cannot be created by direct SQL without a matching current, unexpired task lease.
- Task lease release is permitted only as the transactional projection of a fenced terminal attempt transition.
- Indeterminate is a quarantine state for an expired running attempt; it is not automatically reclaimed.
- Attempt start/indeterminate/terminal metadata and audit-event identities are bound to the corresponding SQL transitions; terminal metadata and audit events cannot be rewritten.
- Task attempt pointers are monotonic and can advance only to the next prepared attempt after the prior attempt is failed or abandoned.

The new `test/lease-fencing.test.ts` exercises direct-SQL bypass attempts, valid acquisition/renewal/finalization, expired lease handling, indeterminate quarantine, forged event insertion and pointer regression. The frozen schema-0010 upgrade suite now applies migrations 0011–0014.

This is still a local synthetic Workers/D1 proof. The lease API is not yet wired into the admission adapter or an executor. No hosted D1, dispatch, worker launch or production write is performed.
