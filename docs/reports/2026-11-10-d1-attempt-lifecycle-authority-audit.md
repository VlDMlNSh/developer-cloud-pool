# 2026-11-10 — D1 attempt lifecycle authority-boundary audit (PRs #49–51)

## Scope and immutable targets

Read-only source audit of the stacked local D1 proof. No application or workflow code was changed.

- Repository: `VlDMlNSh/developer-cloud-pool`
- PR #49: OPEN / DRAFT / UNMERGED; head branch `proof/immutable-task-attempts-audit-ci-2026-11-08`; exact head `b9067dc7d06245893cd4e208f6215438efe5ca64`; base SHA `2b7e30aeb8c404d84b2fe8bc36320aaa783520fb`.
- PR #50: OPEN / DRAFT / UNMERGED; head branch `fix/attempt-finalization-idempotency-2026-11-08`; exact head `65233f57038a9996e4a6e939abde3642a33d467d`; base SHA `4ab0fdc4d649736a171faf95b9ab3a24b17217e8`.
- PR #51: OPEN / DRAFT / UNMERGED; head branch `feat/indeterminate-reconciliation-queue-2026-11-08`; exact head `32c88e50e173e6b19bc6c61723ab6474a3c08145`; base SHA `4ab0fdc4d649736a171faf95b9ab3a24b17217e8`.
- PR #51 files: D1 proof workflow, migration 0005, `src/task-attempts.mjs`, `test/claim-outbox.test.ts`.
- PR #51 source readback:
  - migration 0004 source was read back from the exact PR #51 head; its blob identifier is omitted here because the connector response did not provide a complete 40-character SHA.
  - migration 0005 blob `7a19897f6197c79517170e101e4cbf1db233cac6`
  - `task-attempts.mjs` blob `6cb028e048569700ed623d93462ef55e2392a084`
  - `claim-outbox.test.ts` blob `0af5366564dfb3458ccda656c802ff039ead2418`
- Exact-head PR workflow run `42536377720`, Isolated D1 Ledger Proof: COMPLETED / SUCCESS. It validates Workers-runtime/Miniflare behavior, not hosted D1.
- Context Window before this pass: blob `ad8594224edcfd433aef10fc8abc87e6c5a24c3f` on `docs/cross-chat-continuation-2026-11-06`.

## Positive evidence

1. Migration 0004 separates immutable attempt identity from task lease generation, enforces unique attempt IDs, unique execution idempotency keys and unique (task, attempt_number), and adds append-only attempt events.
2. Lease acquisition is expressed as a conditional UPDATE. Initial acquisition requires a prepared attempt; takeover requires expired lease, explicit resumable flag and a still-running attempt. Generation increments in the same UPDATE and a trigger records lease actor/generation.
3. Renewal and terminal finalization are fenced by task, attempt, owner, generation and unexpired lease.
4. Migration 0005 adds a unique reconciliation row per attempt on the running-to-indeterminate transition. Trigger writes it in the same SQLite transaction as the status transition and preserves input digest, generation, expired owner and timestamp.
5. Indeterminate marking does not clear the task lease or retry/terminalize the attempt.
6. PR #50/#51 exact finalization replay accepts only matching immutable terminal fields and matching terminal audit event. PR #51 test simulates commit success followed by lost response and confirms subsequent exact replay recovers the committed result without a second terminal event.
7. Tests include 10-way concurrent initial lease acquisition with one winner, 12-way logical claim, rollback when outbox insert fails, and stale-generation rejection. These are local Workers-runtime tests.

## Findings requiring remediation or qualification

### F-1 — Caller-controlled resumability is not an authorization proof (BLOCKER)

In `proofs/d1-ledger/src/task-attempts.mjs`, `acquireAttemptLease(..., { resumable = false })` trusts a caller-supplied boolean. If true, its conditional UPDATE permits an expired `running` attempt to be leased to a different worker and increments the generation. The adapter does not authenticate an issuer, validate a capability, verify an immutable owner decision, or prove the previous executor has stopped/fenced from external side effects.

A fencing generation only protects a downstream system if every side-effecting sink validates it. No such production executor/sink integration is part of these PRs. Therefore this flag cannot authorize a real takeover. For qualification, remove the caller assertion as an authority input and require a separately authenticated reconciliation decision bound to task/attempt/generation/input digest and verified execution fencing; otherwise deny takeover and leave the attempt indeterminate.

This is a code-level authority-boundary gap in the isolated adapter, not evidence of a deployed exploit. Do not enable dispatch.

### F-2 — Attempt creation is a multi-statement non-transactional adapter path (HARDENING)

`createTaskAttempt()` performs a prior SELECT, INSERT, then multiple readbacks as separate D1 calls rather than one batch. Unique constraints and triggers prevent two durable rows for the same attempt identity, and dispatch remains false, so this does not by itself establish duplicate durable attempts. However, simultaneous exact retries can race: one INSERT wins and the other returns a generic ambiguous denial on uniqueness conflict instead of resolving to the existing exact attempt. A commit followed by response loss likewise returns ambiguous until the caller retries.

Use a bounded transactional/idempotent create path (e.g. conditional INSERT with explicit conflict handling and exact immutable readback) and add simultaneous same-ID/same-payload and conflicting-payload fault-injection tests. Preserve fail-closed behavior.

### F-3 — Migration permits a prepared-to-failed transition but terminal guard requires a lease (INVARIANT MISMATCH)

Migration 0004's status transition trigger allows `prepared -> failed`, while `pool_attempts_guard_terminal` requires a current leased task, matching lease generation and unexpired lease for every terminal status. Thus a direct prepared-to-failed update is allowed by the transition matrix but rejected by the terminal guard. Either remove this transition from the allowed matrix or define a separately authorized, audited pre-execution cancellation transition. Current adapter finalization only accepts running attempts, so this is an internal schema-contract inconsistency, not a demonstrated production path.

### F-4 — Hosted lifecycle and real backend remain unproven (QUALIFICATION GAP)

No hosted D1 contention, quota exhaustion, worker restart/redeploy, executor-stop/fencing, reconciliation resolver, resolver lease/claim, authorized resolution, or external side-effect idempotency proof exists. The reconciliation table has only pending state; no resolver lifecycle is implemented. No independent security review is recorded.

## Required next engineering boundary

1. Remove or neutralize caller-controlled `resumable: true` as an authorization mechanism. No takeover based only on expiry or caller assertion.
2. Define a trusted reconciliation authority contract with explicit issuer/capability, immutable evidence, executor fencing/termination proof, target task/attempt/generation/input digest and audit binding.
3. If no reliable executor fencing can be demonstrated, keep indeterminate attempts blocked permanently for manual trusted resolution; do not create a new attempt.
4. Make attempt creation idempotent under concurrent exact retries and response-loss faults.
5. Align migration status transition matrix with terminal guard.
6. Only then design hosted D1 qualification. Hosted tests must prove real concurrent one-winner claims and recovery under restart, fault, quota exhaustion and ambiguous commit.
7. Independent security/governance review remains required. Do not grant broader permissions or add paid fallback.

## Status and actions

- Local D1 attempt/lease proof: VERIFIED only for covered Workers-runtime scenarios.
- Authority for resumable takeover: NOT QUALIFIED; F-1 BLOCKER.
- Attempt creation concurrent idempotency: NOT VERIFIED; F-2 hardening gap.
- Migration status transition consistency: NOT VERIFIED; F-3 mismatch.
- Reconciliation resolver: NOT IMPLEMENTED.
- Hosted D1: NOT RUN.
- Independent review: NOT RUN.
- Issue #38: OPEN / NOT QUALIFIED.
- Dispatch: KEEP FAIL-CLOSED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

No code/workflow changes, review comments, secrets access, Cloudflare resource creation/modification, dispatch, provider/model calls, deployment or merge occurred.

## Next step

Prepare a minimal remediation design for F-1/F-2/F-3 against the pinned PR #51 source. Do not implement or dispatch until the trusted issuer/capability and executor-fencing semantics are explicit. Keep all changes on a separate draft branch/PR and preserve the existing proof heads.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
