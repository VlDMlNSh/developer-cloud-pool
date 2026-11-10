# 2026-11-10 — PR #37 / PR #53 Supervisor–Worker boundary and Finalizer audit

## Target and live refs

Audit baseline: default branch `Основной` at `864213e2ff5b4fa956ba405dea8137a44d812f49`.
Relevant PRs are all OPEN / DRAFT / UNMERGED:
- PR #37 reusable Supervisor→Worker boundary, head `1be8672c1be1a720b6c813dcafff5c020b6456ae`, based on old default `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- PR #53 F2 finalizer fencing, head `b8a253f06418841d5f0250c9fd550bf3247db040`, stacked on PR #37.
- PR #39 local D1 claim/outbox proof, head `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`.
- PR #54 logical-task contention + reconciliation/projection outbox work, head `ec3f3266ca28c4fb5633a9475cc6f396a4677974`.
Issue #38 remains OPEN.

## Evidence and checks

PR #37 exact-head runs:
- Reusable Pool Worker Boundary Validation: `42484039940` SUCCESS.
- Pool Contract Validation: `42484039932` SUCCESS.

PR #53 exact-head run:
- Reusable Pool Worker Boundary Validation: `42513724733` SUCCESS.
- Job `128832083652`: syntax, authorization boundary and finalizer fencing adversarial tests all SUCCESS.

PR #39 local D1 proof run `42329993548` SUCCESS.
PR #54 local D1 proof run `42537241204` SUCCESS.
These are local Workers-runtime/Miniflare proof runs, not remote Cloudflare D1 qualification.

## PR #37 — useful boundary migration, not a production-ready claim authority

Verified source changes:
- Supervisor no longer has `workflow_run` trigger or Actions write; invokes Worker as a statically declared reusable workflow.
- Worker is `workflow_call` only, has read-only issue access, and checks caller/callee repository/workflow identity, exact target SHA, profile, unique managed state, and claim generation.
- Supervisor and Finalizer retain Issues write authority because GitHub Issue labels/comments remain the claim/state projection.
- Supervisor still uses GitHub Issue label PATCH as the claim mechanism. It performs read-after-write verification, but GitHub label PATCH is not atomic compare-and-swap; this is not a durable single-winner guarantee under concurrent external actors.
- Supervisor checks two variables (`POOL_DISPATCH_ENABLED`, `POOL_AUTHORIZATION_CONTRACT_ACCEPTED`) and protected default ref, but these gates are not evidence of a trusted owner-event issuer or D1 consume integration.
- The Worker is safer than the default workflow but still only performs the DSH headless configuration probe; no model/provider call or production workload qualification.

## PR #53 — F2 finalizer fencing improvement and remaining limitation

Verified additions:
- Finalizer binds the issue number, SHA-256 digest of the full issue body, Supervisor run ID + run attempt, and a generation label `pool:claim-<run>-<attempt>`.
- It requires exactly one managed lifecycle state (`pool:claimed`) and exactly one matching generation label.
- It re-reads before mutation, validates the response, reads back after mutation, and rejects changed body, stale generation, wrong state, or ambiguous labels.
- Adversarial unit tests cover body mutation, closed issue, stale run/attempt, wrong/duplicate generation, duplicate finalization and invalid digest.

Residual risk:
- The Finalizer itself explicitly documents that GitHub Issue label PATCH has no atomic compare-and-swap; the read/re-read/write/readback sequence still has a race window.
- The generation label is a projection of Supervisor run identity, not a durable backend fencing token atomically issued with a claim/outbox record.
- Audit comment creation is a separate API operation after label mutation; terminal state and audit event are not atomic. Failure after label write but before comment creates a recoverable audit gap, not an atomic finalization.
- Inputs such as run ID, run attempt and digest are workflow-provided values; they bind execution context but do not authenticate an owner-approved event or mint an issuer-backed capability.
- Supervisor still has Issues write authority; Worker is read-only. This is least-privilege improvement over the old REST-dispatch chain but not a complete issuer/store separation.

## Issue #38 contract reconciliation

The shared immutable claim lifecycle contract requires authenticated immutable approval, atomic claim+outbox, monotonically increasing generation, trusted issuer and clock, stale-worker fencing, and terminal state/audit committed together or durably represented by outbox.
PR #37/#53 implement a safer reusable workflow boundary and useful GitHub-projection fencing, but they do not satisfy the contract's durable claim authority, atomicity, or trusted issuer requirements.
The local D1 PRs provide useful state-machine proofs but remain local-only. The prior Cloudflare account inventory found no remote D1 resources and account plan/card-free entitlement NOT VERIFIED.

## Disposition

- PR #37: useful boundary candidate; NOT QUALIFIED for dispatch because Issue-label claim is not atomic and trusted issuer/real durable consume are absent.
- PR #53: F2 finalizer fencing tests VERIFIED at PR head; Finalizer remains non-atomic and not backend-fenced.
- PR #39/#54: local proof evidence only; remote D1 NOT VERIFIED.
- Do not weaken tests or enable either dispatch gate.
- Do not rebase/merge stacked PRs until a controlled stack reconciliation is planned against the actual current default HEAD; current default has advanced beyond PR #37 base.
- No workflow dispatch, DSH execution, model/provider call, secret read, resource provisioning, deployment, merge, or production source change occurred.

## Next bounded step

Continue Issue #38 with a test-first design of the D1 claim/Finalizer adapter contract. Keep GitHub Issue state as a projection only; define how the trusted issuer produces a canonical approval envelope, how the real D1 transaction consumes it and writes the outbox atomically, and how Finalizer commits terminal state plus audit outbox under a fencing generation. Until the live backend and issuer are qualified, dispatch remains fail-closed.

## Status

- PR #37 reusable boundary static/exact-head CI: VERIFIED for its stated code head only.
- PR #53 F2 finalizer fencing unit/contract CI: VERIFIED for its stated code head only.
- Atomic single-winner production claim: NOT VERIFIED.
- Trusted owner-event issuer: NOT IMPLEMENTED / NOT VERIFIED.
- Remote D1 and free-tier entitlement: NOT VERIFIED.
- Production dispatch: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
