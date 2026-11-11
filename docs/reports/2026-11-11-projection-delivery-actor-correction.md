# 2026-11-11 — Projection delivery actor attribution correction

## Immutable target and scope

- Base commit: `ec3f3266ca28c4fb5633a9475cc6f396a4677974` (PR #54 exact head).
- Proof branch: `fix/projection-audit-actor-2026-11-11`.
- Latest commit: `b9731547afaefde2d22e704122e73615ce85876c`.
- Scope limited to the local D1 proof migration, its assertions, and the proof-validation workflow branch filter.
- No merge, deployment, secret/credential access, production mutation, dispatch, provider call, or hosted D1 operation.

## F-02 correction

Migration `proofs/d1-ledger/migrations/0006_create_attempt_projection_outbox.sql` now selects the actor from `OLD.lease_owner` when a transition leaves `leased`; other transitions retain `NEW.lease_owner`. This preserves the lease holder in append-only `delivery.retryable`, `delivery.delivered`, and `delivery.dead_letter` records even though the same UPDATE clears the live lease fields.

Blob SHA after read-back: `956911c5d66938829205e9ef6d56568d17198376`.

Test changes in `proofs/d1-ledger/test/claim-outbox.test.ts` assert:
- delivered event actor is `projection-new`, generation 2;
- retryable event actor is `projection-retry`, generation 1;
- leased event actor and generation remain intact.

Blob SHA after read-back: `32ae873f71af7f74041e52fc0d067c16626f76c8`.

Workflow push branch filter now includes `fix/projection-audit-actor-2026-11-11`, to permit exact-branch proof CI. Workflow blob SHA: `be0003fd29a687ad87b2d51ac973f0bfc7b5a8b5`.

## Verification

- All three changed files were fetched again from the proof branch; read-back content and blob SHAs match the intended changes.
- Exact-head workflow lookup for `b9731547afaefde2d22e704122e73615ce85876c` returned no runs. CI is therefore **NOT VERIFIED**, not PASS.
- The added assertions are source-reviewed but have not yet been executed by GitHub Actions.
- Branch remains isolated and unmerged.

## F-01 remains OPEN

The existing `finalizeTaskAttempt()` replay path still compares the event digest to `resultDigest || provenanceDigest`, not to a canonical, versioned serialization of the complete finalization event. The source migration that defines `pool_attempt_events` was inherited from the base stack and is not part of this bounded correction. Resolving F-01 safely requires tracing and changing that originating schema/trigger and all dependent consumers/tests together. No incomplete digest workaround was added.

## Status

- F-02 source correction: **SUCCEEDED** on isolated proof branch; execution **NOT VERIFIED**.
- F-01 canonical event digest: **OPEN / NOT VERIFIED**.
- Hosted D1, issuer-authenticated actor identity, trusted time, production isolation and quotas: **NOT VERIFIED**.
- Dispatch: **DISABLED**.
- Contour A: **BLOCKED / NOT ACCEPTED**.
- Contour B: **DEFERRED**.

## Next step

Obtain exact-head CI for the actor correction. Then trace the original `pool_attempt_events` schema/trigger migration and implement F-01 as a versioned canonical event contract with recomputation, replay-conflict, transaction rollback, and exactly-one-event/outbox tests. Keep the branch unmerged and dispatch disabled.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
