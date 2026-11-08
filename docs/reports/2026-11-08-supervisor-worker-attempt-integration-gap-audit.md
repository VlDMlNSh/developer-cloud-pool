# Supervisor / Worker ↔ immutable Attempt integration gap audit

Date: 2026-11-08
Status: STATIC SOURCE AUDIT COMPLETE / INTEGRATION NOT IMPLEMENTED / NOT PRODUCTION-APPROVED

## Immutable targets checked

- PR #49: `4ab0fdc4d649736a171faf95b9ab3a24b17217e8`, OPEN / DRAFT / UNMERGED; base PR #40 head `2b7e30aeb8c404d84b2fe8bc36320aaa783520fb`.
- PR #40: `2b7e30aeb8c404d84b2fe8bc36320aaa783520fb`, OPEN / DRAFT / UNMERGED; base PR #39 head `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`.
- PR #37: `1be8672c1be1a720b6c813dcafff5c020b6456ae`, OPEN / DRAFT / UNMERGED; base default `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- PR #49 migration blob: `0ad590ffdd2589f857257739275c15ed2d54d729`.
- PR #49 adapter blob: `30a27b959c453e431bf5575f33db4a67c6ff0017`.
- PR #49 tests blob: `c50342e0075ae6b394a0bac69503d03507b37d12`.
- PR #37 Supervisor workflow blob: `4a176e5ebb3cf1e7ef29b00164498e34a4f9fafc`.
- PR #37 Worker workflow and Supervisor script were read at the PR #37 branch.

## Exact-head proof status

PR #49 exact-head D1 runs 42492657024 and 42492663954 both completed SUCCESS; each ran the local Workers-runtime suite (35/35). This validates only the isolated D1 proof. PR #49 formal review submissions and inline threads are empty at this inspection. PR #37 has an earlier CHANGES_REQUESTED audit review, but that review describes a different historical head; it is not an approval of current PR #37 head and not an independent approval of PR #49.

## Finding A — HIGH: no runtime identity bridge

The current Supervisor passes only:
- GitHub Issue number;
- target SHA;
- worker profile.

The reusable Worker accepts and validates those three values, then checks the Issue label/body. It does not accept or bind:
- canonical `task_key`;
- immutable `attempt_id` / `attempt_number`;
- `lease_generation` and lease owner;
- Supervisor run ID + run_attempt;
- Worker run ID + run_attempt;
- attempt input/envelope digest;
- durable dispatch idempotency key.

The Finalizer likewise has no D1 binding or Attempt identity. It checks only that `pool:claimed` exists, changes labels, reads them back, then separately posts a comment. Therefore PR #49's attempt ledger is not used by PR #37's execution path. The two PRs cannot yet be treated as an integrated system.

## Finding B — HIGH: indeterminate attempt has no recovery transition

In the PR #49 migration, `markAttemptIndeterminate` updates the Attempt to `indeterminate` and appends an event, but does not transition the Task out of `leased` into an explicit reconciliation state or release/annotate lease ownership.

The adapter's `finalizeTaskAttempt` only updates rows where status is `running`; it cannot finalize an `indeterminate` Attempt. The SQL terminal guard also requires a currently leased Task with a live lease (`lease_expires_at > completed_at`). An indeterminate attempt is reached after expiry, so this guard prevents the evidence-based reconciliation path described by the design proposal.

Result: the implementation correctly blocks blind retry, but provides no implemented route to reconcile and safely recover. A task can remain stuck in an expired leased state. Recovery is NOT IMPLEMENTED.

## Finding C — MEDIUM/HIGH: idempotent create replay is coupled to current pointer

`createTaskAttempt` returns `ATTEMPT_ALREADY_CREATED` only if the old attempt is still the Task's current pointer. After that attempt is terminal and a later attempt advances `current_attempt_id`, replaying the original create request finds the immutable prior row but returns `ATTEMPT_POINTER_READBACK_MISMATCH`.

This contradicts the intended operation-idempotency property: replay of the same immutable create key should identify the already-created historical attempt, even if the Task has since advanced. It must not silently move the pointer back; it should return the prior attempt identity as historical/idempotent and report whether it is current.

## Finding D — MEDIUM/HIGH: finalization replay is not idempotent

`finalizeTaskAttempt` updates only `status='running'`. A repeated request after the first terminal commit is denied as stale instead of reading back and returning the already committed terminal result when all immutable request fields match. This does not meet the proposal's lost-response requirement for finalization replay. Conflicting replay must be denied; exact replay should be recognized without writing a second event.

## Required bounded remediation sequence

1. Define and implement an explicit evidence-backed reconciliation transition for indeterminate attempts. It must require a trusted reconciliation authority and immutable evidence digest; it must not infer safe retry from lease expiry. Make Task enter a recoverable reconciliation state and atomically record the decision.
2. Make create-attempt and finalization operations idempotent by immutable operation identity, with exact readback of prior immutable values and no pointer rollback.
3. Extend adversarial Workers-runtime tests: replay old create after a later attempt exists; exact terminal finalization replay; conflicting terminal replay; indeterminate reconciliation success/failure; reject reconciliation without authority/evidence; verify Task no longer remains indefinitely leased after indeterminate transition.
4. Only then design the Supervisor/Worker envelope bridge. Every run must carry and validate task/attempt/generation/idempotency identities; durable D1 state is authoritative, GitHub labels/comments are repairable projections.
5. Keep dispatch disabled. Do not run remote D1, provider/model calls, secrets, deployment or real Worker execution until authorization and independent review gates pass.

## Status

- Local isolated Attempt lifecycle tests: VERIFIED at PR #49 exact head (35/35).
- Supervisor/Worker integration: NOT IMPLEMENTED.
- Indeterminate recovery: BLOCKED / NOT IMPLEMENTED.
- Idempotent replay requirements: NOT VERIFIED; source audit found gaps.
- PR #49 independent review: NOT RUN.
- Remote D1 / provider execution / deployment: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
