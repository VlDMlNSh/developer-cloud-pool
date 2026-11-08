# D1 attempt finalization replay semantics — bounded audit — 2026-11-09

## Scope and immutable targets
Read-only source/test/CI audit of the existing local D1 proof chain:
- PR #50 head `65233f57038a9996e4a6e939abde3642a33d467d` (idempotent attempt finalization replay).
- PR #51 head `f50e8fc09a6442b4ca3088194c9d7284c7ffce55` (indeterminate reconciliation queue; includes PR #50 changes).
- PR #39 head `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833` (initial local D1 claim/outbox).
No code, migration, permission, secret, resource, dispatch, provider/model, Worker, DSH or deployment changes.

## Exact-head CI evidence
- PR #50: run `42533097813`, job `128891421839`, COMPLETED / SUCCESS. Exact source SHA `65233f...`. Local Workers-runtime D1 tests and syntax check succeeded.
- PR #51: run `42533777096`, job `128893481500`, COMPLETED / SUCCESS. Exact source SHA `f50e8...`. Local Workers-runtime D1 tests and syntax check succeeded.
- PR #39 earlier evidence: run `42329993548`, job `128274072508`, SUCCESS for `ecc7193...` (19 tests). This is historical baseline only.
These are local Miniflare/workerd tests, not remote D1 qualification. PRs #50/#51 remain OPEN/DRAFT/UNMERGED.

## Existing positive properties
- `pool_attempts` has immutable attempt identity, unique execution idempotency key and monotonic lease generation.
- `pool_attempt_events` is append-only.
- Fenced SQL update binds task, attempt, worker, generation, expected status and unexpired lease.
- Terminal-state trigger atomically inserts the terminal audit event and updates the task projection in the same SQLite transaction.
- PR #51 materializes expired indeterminate attempts into a durable reconciliation queue; queue creation does not authorize blind retry/takeover.
- The implementation is local proof only and all functions return `dispatch: false`.

## New finding D1-FINALIZE-REPLAY-01 — replay time coupling (MEDIUM, test gap / possible functional defect)
Source: `proofs/d1-ledger/src/task-attempts.mjs`, blob `cfbce80efbf8e19fd667770ec3a8f86cd17dc865`.
On an update that affects zero rows, `finalizeTaskAttempt` accepts a prior terminal record only when all terminal fields match AND `prior.completed_at === now`. The existing test repeats the exact same timestamp (`NOW + 3`) for the replay. It does not test a retry after a later wall-clock read, e.g. `NOW + 30`, while all immutable result/actor/generation fields remain identical.
Implication: if the caller obtains a fresh trusted timestamp for each retry (the natural implementation unless the original timestamp is persisted as part of the retry capability), an otherwise exact replay is denied as `STALE_OR_EXPIRED_ATTEMPT_FINALIZER`. This weakens the claimed lost-response recovery property.
This is recorded as a testable defect hypothesis, not a proven production failure: an implementation that explicitly persists and resends the original timestamp could satisfy the current check, but the API contract does not document that requirement and the lifecycle contract does not make retry timestamp part of the immutable finalization identity.

### Required bounded correction
1. Define the idempotency identity for finalization: attempt_id + task_key + worker_id + generation + terminal status + result_digest + provenance_digest + terminal_reason. Treat the first accepted completed_at as authoritative backend-generated metadata, not as a caller-supplied equality requirement for replay.
2. On zero-row update, compare the immutable finalization identity and append-only event actor/generation/digest; return the prior terminal result and original completed_at when identical.
3. Reject any conflicting terminal payload, actor, or generation.
4. Add a regression test: first finalize at `NOW + 3`; exact replay at `NOW + 30` must return `ATTEMPT_ALREADY_FINALIZED` and preserve the original completed_at/event count; changed result or actor/generation must deny.
5. Add a lost-response test where DB commit succeeds but the caller sees an ambiguous result, then retries with a fresh clock value.

## Relationship to PR #53
PR #53's GitHub Issue-label finalizer is a separate projection path and still has the previously documented split-write / non-CAS blockers. The D1 trigger-backed terminal state + audit event is a stronger local pattern to reuse, but it is not integrated into the Supervisor → Worker flow and is not a remote backend. Do not conflate the local D1 proof with PR #53 remediation.

## Decision / disposition
- PR #50/#51 local CI: VERIFIED / SUCCESS.
- D1 terminal state + audit event transaction: VERIFIED in local Workers-runtime test scope.
- Exact retry across fresh timestamp: NOT VERIFIED; test gap and plausible functional defect.
- Remote D1 / issuer / revocation / trusted clock / quota / backup / recovery: NOT QUALIFIED.
- PR #50/#51: keep OPEN/DRAFT; no merge/dispatch authorization.
- Issue #38 remains OPEN. Continue local tests before backend integration.
- Dispatch: BLOCKED / FAIL-CLOSED.
- Contour A: BLOCKED / NOT QUALIFIED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Evidence
- PR #50: https://github.com/VlDMlNSh/developer-cloud-pool/pull/50
- PR #51: https://github.com/VlDMlNSh/developer-cloud-pool/pull/51
- PR #39: https://github.com/VlDMlNSh/developer-cloud-pool/pull/39
- PR #50 CI: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42533097813
- PR #51 CI: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42533777096
- Source: https://github.com/VlDMlNSh/developer-cloud-pool/blob/f50e8fc09a6442b4ca3088194c9d7284c7ffce55/proofs/d1-ledger/src/task-attempts.mjs
- Lifecycle contract: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/contracts/SHARED-IMMUTABLE-CLAIM-LIFECYCLE-CONTRACT.md
- Canonical MediaHub map (reference only): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
