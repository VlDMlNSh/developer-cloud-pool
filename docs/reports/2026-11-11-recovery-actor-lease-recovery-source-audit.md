# Recovery Actor and lease-recovery source audit — 2026-11-11

## Immutable source target

- Repository: `VlDMlNSh/developer-cloud-pool`
- Implementation branch: `impl/receipt-bound-projection-2026-11-11`
- Audited PR #67 HEAD: `dea09ffe94059f446c74fada37971087ec4878eb`
- PR base: `Основной@221f216c00ca7e5596bcc682ba185ad155a10603`
- PR remains OPEN / DRAFT / UNMERGED. This audit changes documentation only; implementation source is unchanged.

## Files and evidence inspected

- `proofs/d1-ledger/src/task-lease.mjs` blob `b41edf89cdf960b2c007f38ba16554dc179f021a`
- `proofs/d1-ledger/src/task-attempts.mjs` blob `6cb028e048569700ed623d93462ef55e2392a084`
- `proofs/d1-ledger/src/projection-outbox.mjs` blob `cd27ba98c5716ef568c0672250b652d68e714ea5`
- `proofs/d1-ledger/migrations/0004_create_immutable_task_attempts.sql` blob `0ad590ffdd2589f857257739275c15ed2d54d729`
- `proofs/d1-ledger/migrations/0005_create_attempt_reconciliation_queue.sql` blob `7a19897f6197c79517170e101e4cbf1db233cac6`
- `proofs/d1-ledger/migrations/0007_bound_projection_delivery_retries.sql` blob `767d95a30fa0a14c79e88c8c58392bfec9cdddc2`
- `proofs/d1-ledger/migrations/0008_enforce_projection_attempt_monotonicity.sql` blob `1d9385dd371f3404c52ec15fce03b0a14d384ab1`
- `proofs/d1-ledger/test/claim-outbox.test.ts` blob `93192ebb3d00701230c3d9a1a5557ba159fd74f3`

## Verified controls

1. Task lease acquire increments `lease_generation`; renew/finalize SQL predicates bind task key, owner, generation and unexpired lease.
2. Attempt lease renew binds task, attempt, owner, generation and unexpired lease.
3. Attempt finalization binds current attempt and lease attempt, owner, generation and unexpired lease; database triggers independently enforce terminal fencing.
4. Expired running attempts can be marked indeterminate only against the current attempt and matching generation.
5. Migration 0005 creates a durable pending reconciliation record with task/attempt/input digest/generation/expired owner.
6. The reconciliation record is intentionally not an authorization to retry, clear a lease, or finalize. Test lines 536–580 prove expiry creates durable work while leaving the task lease intact.
7. Projection delivery retry/dead-letter paths bind outbox ID, owner, delivery generation and lease expiry. Dead-letter is terminal at database level.

## Blocking finding: self-asserted resumability

In `src/task-attempts.mjs`, `acquireAttemptLease` accepts `{ resumable = false }`. A caller can set `resumable: true` and acquire a new generation for an expired still-`running` attempt. The SQL verifies that the current attempt is still `running`, but it does not verify a Recovery Actor issuer, capability, authorization scope, evidence digest, or separate approval.

The existing test explicitly demonstrates this: an expired attempt is taken over by `worker-b` after passing `{ resumable: true }` (test lines 350–380). This is a caller assertion, not an authenticated authority proof.

The indeterminate path is safer: after `markAttemptIndeterminate`, the attempt is no longer `running`, takeover fails even with `resumable: true`, retry creation fails, and the pending reconciliation row remains. However, no resolver/Recovery Actor implementation consumes that queue.

Disposition:
- Generation fencing: VERIFIED for the local proof.
- Expiry-only takeover: denied by default.
- Caller-asserted resumable takeover: LOCAL TEST FEATURE ONLY; NOT AUTHORIZED FOR PRODUCTION.
- Recovery Actor identity/capability and reconciliation resolver: NOT IMPLEMENTED / NOT QUALIFIED.
- No source patch was made in this pass because a safe authorization contract and executable negative tests must be defined together; changing only the flag would either preserve an authority bypass or disable recovery without a qualified replacement.

## Required design before implementation

A future resolver must require a separately authenticated, narrowly scoped Recovery Actor capability. Bind the authorization to at least task key, attempt ID, observed lease generation, input digest, permitted decision, issuer, expiry, nonce/replay key and evidence digest. Validate issuer and capability outside caller-controlled task payload; persist the decision and evidence append-only; use a single conditional transaction that rechecks the exact reconciliation row and current task/attempt state before mutation. A resolver must not infer that the old executor stopped merely because its lease expired.

Decision types should be explicit and mutually constrained, e.g. confirm-terminal-from-evidence, authorize-resume-with-idempotency-proof, or authorize-new-attempt. Each decision must have a distinct evidence contract; no generic `resumable=true` boolean. Deny by default on missing/ambiguous evidence, expired/replayed capability, generation mismatch, or storage ambiguity. Preserve the original attempt and reconciliation history.

## Validation and scope

- Source-level audit only; no code changes, no new tests executed.
- Existing PR #67 CI evidence remains 66 tests passing on its exact head, but does not qualify Recovery Actor authority.
- No independent external review was run; per project direction, independent checks remain deferred until after actual pool launch.
- No secrets read, hosted D1, dispatch, provider/model call, Cloudflare deployment or paid resource used.
- Contour A remains BLOCKED / NOT ACCEPTED. Contour B remains DEFERRED.

## Next bounded step

Define a versioned Recovery Actor capability contract and negative-first test matrix only. Before implementing a resolver, prove that worker-supplied flags cannot authorize takeover, that a capability is issuer-bound and single-use, and that task/attempt/generation/input digest/reconciliation identity are revalidated atomically. Keep PR #67 draft and dispatch disabled.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
