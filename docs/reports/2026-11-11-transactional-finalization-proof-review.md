# 2026-11-11 — Independent review of transactional attempt finalization proof

- Target: PR #54 exact head `ec3f3266ca28c4fb5633a9475cc6f396a4677974`.
- Review scope: PR #54 diff; `proofs/d1-ledger/src/task-attempts.mjs`; `proofs/d1-ledger/src/projection-outbox.mjs`; migrations `0005_create_attempt_reconciliation_queue.sql` and `0006_create_attempt_projection_outbox.sql`; PR #39 migration `0002_create_task_claim_outbox.sql`; exact-head workflow run and current PR review threads.
- No source/schema/workflow/permission/secret/dispatch/deployment/merge mutation.

## Findings

### F-01 — Finalization event digest does not satisfy the target contract (OPEN)

At the reviewed PR #54 head, `finalizeTaskAttempt()` replay acceptance compares the stored `pool_attempt_events.event_digest` to `resultDigest || provenanceDigest`. This is not a canonical digest of the complete immutable finalization event. It does not bind both result and provenance digests, terminal status/reason, attempt/task identity, actor, lease generation, or trusted event time as required by the target contract. The code therefore cannot demonstrate byte-equivalent event replay from the event digest.

The current SQL trigger in the inherited attempt-ledger migration was not changed by PR #54; the PR #54 adapter explicitly expects the single digest to equal one of the two input digests. The new contract requires a versioned canonical serialization and digest over all security-relevant event fields, plus tests for digest recomputation and conflicting replay.

**Disposition:** concrete contract gap; do not promote. Fix requires a bounded schema/trigger/adapter/test revision on a proof branch, then exact-head CI.

### F-02 — Projection delivery audit loses actor on terminal status transitions (OPEN)

Migration `0006_create_attempt_projection_outbox.sql` writes `NEW.lease_owner` into `pool_attempt_projection_events.actor_id` for status transitions. Both `markProjectionRetryable()` and `acknowledgeProjectionDelivered()` clear `lease_owner` in the same UPDATE that changes status. Therefore `delivery.retryable` and `delivery.delivered` events persist a NULL actor, not the worker that performed the transition.

This finding is already recorded in the current PR #54 review thread (unresolved, line 89) and review comment. The exact-head test verifies event types but does not assert the actor field for retryable/delivered events.

**Disposition:** OPEN and independently reproduced from the current source. Use the prior leased owner (or an explicit authenticated transition actor persisted before clearing) and add assertions. Preserve the existing unresolved review thread until corrected and verified.

### F-03 — Outbox transition history is trigger-backed but not complete proof of authenticated actor (QUALIFICATION GAP)

The local D1 schema appends delivery events transactionally with state changes and prevents UPDATE/DELETE on the event table. This is useful local evidence. However, adapter worker IDs are caller-supplied strings, not authenticated principals or issuer-verified capabilities; local timestamp arguments are caller supplied; and the proof does not qualify trusted time, independent consumer audiences, or hosted storage isolation. These are explicitly outside this local proof and remain NOT VERIFIED.

## Positive evidence retained

- PR #39 migration `0002_create_task_claim_outbox.sql`: conditional `ready → consumed` approval transition triggers claim and deterministic task-outbox inserts in the same SQLite transaction. Uniqueness constraints bind one claim/outbox per approval. Local proof only.
- PR #54 migration `0006`: terminal attempt event insertion triggers one projection-outbox row in the same D1 statement/transaction; unique `attempt_id` and primary `outbox_id` constrain duplicates. Projection delivery events are append-only by UPDATE/DELETE rejection triggers.
- PR #54 adapter uses conditional UPDATE predicates for attempt identity, current-task pointer, owner, generation and unexpired lease. D1 trigger effects participate in the same statement transaction. This is local transaction evidence, not hosted contention qualification.
- PR #54 exact-head workflow run [42537241204](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42537241204): COMPLETED / SUCCESS on exact head `ec3f3266ca28c4fb5633a9475cc6f396a4677974`.
- PR #54 formal review list contains one COMMENTED review; its inline thread on migration 0006 line 89 remains unresolved. No approval is recorded in the review list.

## Invariants assessed

| Invariant | Local proof result | Qualification |
|---|---|---|
| Approval consume + claim + task outbox atomicity | Trigger-backed local proof | Hosted store/auth/issuer NOT VERIFIED |
| Attempt terminal update + audit event + projection outbox atomicity | Trigger-backed local proof | Digest semantics incomplete; hosted store NOT VERIFIED |
| One terminal event / outbox per attempt | Event ID and unique attempt/outbox constraints | Requires adversarial rollback/concurrency proof at hosted backend |
| Exact replay | Adapter checks terminal row and event metadata | Event digest is not canonical; actor/capability provenance incomplete |
| Conflicting replay denial | Adapter rejects changed result/provenance/reason/status | Add event digest recomputation and full-field mismatch tests |
| Append-only delivery history | UPDATE/DELETE triggers | Actor attribution bug for retryable/delivered |
| Delivery lease fencing | Conditional owner/generation/expiry predicates | Local only; no trusted-time qualification |
| External projection exactly-once | Not claimed | At-least-once reconciliation remains correct target |

## Next bounded step

Create a proof-branch correction for F-01 and F-02 only after pinning the canonical event schema/version and actor semantics; add digest, replay, actor-retention, transaction rollback and exactly-one-event/outbox assertions. Do not deploy, merge, enable dispatch, or introduce a hosted backend as part of that correction.

## Status

- PR #54 exact-head local CI: VERIFIED SUCCESS.
- Finalization event digest against target contract: NOT VERIFIED / FAILS CONTRACT.
- Delivery audit actor attribution: OPEN FINDING.
- Hosted D1, issuer, trusted time, isolation, quota and recovery: NOT VERIFIED.
- Dispatch: DISABLED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
