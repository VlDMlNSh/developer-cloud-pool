# Orphaned projection lease recovery authority audit — 2026-11-11

## Snapshot and source evidence
- Repository: `VlDMlNSh/developer-cloud-pool`; default branch `Основной`.
- Documentation branch: `docs/cross-chat-continuation-2026-11-06`.
- PR #59: OPEN / DRAFT / UNMERGED. Immutable head stated in PR body: `5c47cda4394d0381315bc16182799a09bf861797`; base PR #58 head `6f7953e4abec3cc564984ee3635cdb7717ae5d5e`.
- PR #59 exact-head workflow run 42980783397 / job 130390442001: COMPLETED / SUCCESS; 53 tests passed. The run validates only local Miniflare/workerd D1 proof.
- PR #58 remains OPEN / DRAFT / UNMERGED; PR #37 remains OPEN / DRAFT / UNMERGED.
- Current issue #1/#22/#38 remain OPEN. Issue #1's dispatch-disabled evidence is dated 2026-11-04; current Actions variable was not re-read in this pass.
- Canonical map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md

## Re-read immutable proof components
- `proofs/d1-ledger/src/projection-outbox.mjs` blob `1546c2e4172e3767ed8bd5642c7b9c6d95716d11`.
- `proofs/d1-ledger/src/projection-reconciler.mjs` blob `2f83befc145d39ea60f06fe5b9e9033f89df40c0`.
- `proofs/d1-ledger/migrations/0006_create_attempt_projection_outbox.sql` blob `660fa9de99ed78fe083bb627d6a61dbf0bd65c25`.
- `proofs/d1-ledger/migrations/0007_bound_projection_delivery_retries.sql` blob `767d95a30fa0a14c79e88c8c58392bfec9cdddc2`.
- `proofs/d1-ledger/migrations/0008_enforce_projection_attempt_monotonicity.sql` blob `1d9385dd371f3404c52ec15fce03b0a14d384ab1`.
- `proofs/d1-ledger/src/worker.mjs` blob `214622f6dc94623521070eb9e7fbc2f573fdc2c6`: inert 404 entrypoint; not an active Worker.

## Confirmed recovery gap
1. `acquireProjectionDelivery()` leases only rows with `delivery_attempts < 5`; expired fifth-attempt leases are not eligible for normal reacquisition.
2. `deadLetterExpiredProjection(db, outboxId, workerId, generation, now)` requires `lease_owner = workerId` and matching delivery generation. This allows the original lease owner to terminalize its own expired fifth lease, but does not allow an independent reaper to recover an orphaned lease after that worker disappears.
3. PR #59 body explicitly states this limitation: the expired-fifth-lease test proves same-owner expiry handling, not orphan-worker recovery; a row can remain leased indefinitely.
4. The local projection reconciler does not import or invoke the outbox adapter. The proof Worker entrypoint is inert. There is no hosted D1, Cron Trigger, Queue consumer or production recovery invocation.
5. Migration 0007's status-event trigger records `COALESCE(NEW.lease_owner, OLD.lease_owner)`. A reaper that clears the lease would currently attribute the event to the old owner, not to the reaper. This is not adequate provenance for an independent recovery actor.
6. D1 binding access is not a per-table SQL role boundary. Splitting code into another Worker does not by itself provide DB-enforced least privilege if that Worker receives the same D1 binding. Any recovery actor identity stored by application code is attribution, not cryptographic proof of caller identity.

## Bounded architecture decision
- Do not alter the existing same-owner function or silently broaden its authority.
- Do not allow expired fifth-attempt rows to be requeued. The terminal action is dead-letter only.
- A future orphan reaper requires a separately versioned contract with:
  - explicit recovery actor identity and authority source, distinct from lease owner;
  - conditional update requiring `status='leased'`, exact observed `lease_generation_delivery`, `lease_expires_at <= now`, and `delivery_attempts >= 5`;
  - a single atomic terminal transition clearing lease fields and recording a stable reason;
  - append-only audit event with both original lease owner and recovery actor, not just a caller-supplied free-form actor label;
  - idempotent readback and stale-generation rejection;
  - bounded candidate scan and batch limit, with no path to task dispatch or retry/requeue;
  - tests for concurrent reapers, worker disappearance, lease generation races, repeated recovery, audit attribution, DB trigger enforcement, and ambiguous write/readback.
- Before implementation, decide whether the reaper is a trusted module inside the one D1-bound Worker (shared DB trust boundary) or whether a stronger authorization design is required. A second Worker with the same D1 binding is not a meaningful SQL privilege boundary. No separate privileged API/token should be introduced without a threat-model review.
- If no defensible authority/provenance mechanism is available under the free plan, retain the row as visibly BLOCKED and require manual operator intervention; do not auto-requeue or fabricate a reaper identity.

## Cloudflare account readiness
- Billing entitlement remains NOT VERIFIED: connected OAuth cannot call account subscription/billing endpoints without Billing Read; do not request Billing Write or expose/create tokens.
- Inspected account had no D1 databases and no deployed Worker scripts. Free-tier product-level feasibility is not account-level entitlement proof.
- No resources provisioned, no secrets read, no dispatch, no deployment, no migrations applied.

## Status
- Local bounded retry/dead-letter invariants: VERIFIED by exact-head local D1 CI (53 tests).
- Same-owner expired fifth lease transition: VERIFIED locally.
- Orphaned fifth-lease recovery: BLOCKED / NOT IMPLEMENTED.
- Recovery actor provenance: NOT VERIFIED / NOT IMPLEMENTED.
- Hosted D1 / Cron / Worker: NOT PRESENT in inspected account.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B deferred.

## Next step
Resolve account Free/Paid status through dashboard read-only plan label, then prepare a separate recovery-actor threat model and implementation contract. Do not deploy or broaden the existing adapter until the authority/provenance design is accepted.

