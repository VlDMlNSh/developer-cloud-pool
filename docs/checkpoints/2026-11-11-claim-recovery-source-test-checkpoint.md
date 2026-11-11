# Claim / Recovery source-to-test checkpoint — 2026-11-11

## Current phase
Contour A only. Production dispatch FAIL-CLOSED. Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

## Latest pass
[Source-to-test mapping](../reports/2026-11-11-claim-recovery-source-to-test-mapping.md) maps N01–N20 to immutable source/test refs in PR #36/#39/#40/#50/#51/#53/#54.

## Key correction to prior matrix
PR #54 already proves 50 distinct approvals attach concurrently to one canonical logical task and one task-level outbox in local Workers/D1 tests. PR #54 also tests attempt generation fencing, terminal finalization replay, projection outbox lease generations and stale acknowledgement. PR #53 tests pure finalizer rejection for envelope mutation, closed issue, wrong run/attempt generation and duplicate finalization. PR #51 persists indeterminate attempts and reconciliation rows without releasing the lease.

These are local proofs only; no hosted D1 or integrated Supervisor/Worker qualification.

## Highest-priority remaining gaps
1. Two lifecycle APIs coexist: legacy `task-lease.mjs` and attempt-aware `task-attempts.mjs`. Tests exercise both; no cross-API negative tests. Select one canonical lifecycle and retire/hard-disable the legacy path.
2. `acquireAttemptLease` accepts caller-controlled `resumable=true` for expired running attempt takeover. Replace with authenticated reconciliation evidence/capability. Reconciliation queue currently has no resolver.
3. Projection outbox tests do not implement a GitHub consumer or prove external side-effect idempotency after accepted-write/lost-ack.
4. Trusted issuer, revocation, service clock, audit sink ownership, restore/replay and hosted D1 remain unqualified.
5. Default ruleset requires zero approvals; independent review is not enforced.

## Live refs at pass start
- Default: `Основной@6fdcedebeba62715122e43a75c6ad6d926321ce7`.
- PR #63 head: `7bd818443d13cf3bba9f0f8c0b63e0689f68cd60`, OPEN/DRAFT/UNMERGED.
- PR #64 head: `95d237c753bec96abe9add621140928511047599`, OPEN/DRAFT/UNMERGED.
- Proof PRs #36/#39/#40/#50/#51/#53/#54 remain OPEN/DRAFT/UNMERGED; exact-head CI/reviews are detailed in the report. Empty runs/statuses = NOT VERIFIED.
- Ruleset #26550182 active on default, but zero required approvals.
- Context Window blob before this pass: `d98ddce99a1bc4f6ed824e4f03d82591ab692e10`.

## Next
Implement no runtime changes until the canonical lifecycle/reconciliation contract is approved. Next useful work is a narrow design decision and cross-API negative test specification, then authorized independent review. No hosted provisioning, secrets, dispatch or Contour B.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
