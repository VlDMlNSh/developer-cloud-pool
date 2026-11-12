# Projection finalization provenance and fifth-lease recovery audit — 2026-11-12

## Status

SOURCE REVIEW COMPLETE / DESIGN GAPS CONFIRMED / NO RUNTIME CHANGE / NOT QUALIFIED.

This is a bounded source-level audit of the finalization actor/digest chain and fifth-delivery-lease recovery behavior in the current local D1 proof. It does not authorize a recovery actor, issuer, hosted database, live GitHub mutation, dispatch, or deployment.

## Immutable target

- Implementation branch: `impl/receipt-bound-projection-2026-11-11`
- PR #67 head: `f8280ba5a78ffcf1c18bf33f0dc8932ebb36a81d`
- Default branch: `Основной@221f216c00ca7e5596bcc682ba185ad155a10603`
- Relevant files read from the implementation head:
  - `proofs/d1-ledger/migrations/0004_create_immutable_task_attempts.sql` blob `0ad590ffdd2589f857257739275c15ed2d54d729`
  - `proofs/d1-ledger/migrations/0006_create_attempt_projection_outbox.sql` blob `660fa9de99ed78fe083bb627d6a61dbf0bd65c25`
  - `proofs/d1-ledger/migrations/0007_bound_projection_delivery_retries.sql` blob `767d95a30fa0a14c79e88c8c58392bfec9cdddc2`
  - `proofs/d1-ledger/migrations/0008_enforce_projection_attempt_monotonicity.sql` blob `1d9385dd371f3404c52ec15fce03b0a14d384ab1`
  - `proofs/d1-ledger/migrations/0009_projection_outbox_identity_immutable.sql` blob `86919425f498dc634329bb783a3ca6ae7a0ff6a1`
  - `proofs/d1-ledger/migrations/0010_projection_comment_at_most_once.sql` blob `30ac9d0ed0cbede9586c365578c606b47bcce1a7`
  - `proofs/d1-ledger/src/task-attempts.mjs` blob `6cb028e048569700ed623d93462ef55e2392a084`
  - `proofs/d1-ledger/src/projection-outbox.mjs` blob `06e80d04b4bb16fbc74028cb716b9167dcc965a1`
  - `proofs/d1-ledger/src/projection-delivery.mjs` blob `b09e9248323a57fff5e1c426eae012e2bb7aa3f0`
  - `proofs/d1-ledger/test/projection-delivery.test.ts` blob `a1b96a2e122b25594f75e5eb160c816ffff67812`

## Finding F-01 — finalization event actor is the lease holder, not an independently authenticated actor

Migration 0004's `pool_attempts_terminal_projection` trigger creates `attempt.finalized` inside the attempt status transaction. It records:
- `actor_id = pool_tasks.lease_owner`;
- `lease_generation = pool_tasks.lease_generation`;
- `created_at = NEW.completed_at`.

The finalizer adapter requires the same `workerId`, attempt ID and generation to match the active task lease before terminalization. Thus, in this proof, the event actor means **the worker identity holding the fenced execution lease at finalization time**. It is not evidence of an independently authenticated principal or signed issuer capability.

The transaction clears the task lease after writing the event. This correctly preserves the pre-clear lease holder for the event. However, the value is only as trustworthy as the runtime composition root that supplies the worker ID; the local adapter itself does not authenticate it.

**Disposition:** acceptable only as lease-holder provenance for the local proof. Do not describe it as authenticated actor identity or Recovery Actor provenance. Any future independent recovery operation needs a separately bound actor principal, issuer, capability and audit event; it must not impersonate the expired worker.

## Finding F-02 — event digest does not bind both result and provenance digests

Migration 0004 stores both `pool_attempts.result_digest` and `pool_attempts.provenance_digest`. But the `attempt.finalized` event uses:

`COALESCE(NEW.result_digest, NEW.provenance_digest, NEW.input_digest)`

Because normal finalization requires both result and provenance digests, the event digest becomes the result digest and does not cryptographically commit to the provenance digest. The outbox trigger copies this event digest into `pool_attempt_projection_outbox.event_digest`; the projection marker therefore binds the result digest but not the pair of result + provenance digests.

The adapter's terminal replay check uses `event_digest === (resultDigest || provenanceDigest)`; given both are required and resultDigest is first, this checks the result digest only. The provenance digest is separately compared against the attempt row, but it is not part of the event/outbox projection digest.

This is not necessarily a defect if the normative meaning of `event_digest` is explicitly “result artifact digest only” and provenance is independently referenced. No accepted contract located in this bounded source set establishes that meaning. If the digest is intended to identify the complete terminal event, the current construction is incomplete.

**Disposition:** CONTRACT GAP / NOT QUALIFIED. Before changing schema or hashing, define a versioned canonical terminal-event payload and digest domain. It should unambiguously bind task key, attempt ID/number, terminal status, result digest, provenance digest, terminal reason, lease generation and relevant immutable target identity. Specify canonical serialization, encoding, hash algorithm, nullability and migration compatibility. Do not concatenate digest strings ad hoc or silently reinterpret existing event IDs/digests.

## Finding F-03 — fifth expired delivery lease cannot be independently reaped

Migration 0007 caps delivery attempts at five and makes `dead_letter` terminal. `acquireProjectionDelivery` refuses new leases when `delivery_attempts >= 5`.

The only fifth-lease expiry helper, `deadLetterExpiredProjection(db, outboxId, workerId, generation, now)`, conditionally transitions the row only when:
- status remains `leased`;
- `lease_owner = workerId`;
- `lease_generation_delivery = generation`;
- lease expiry is at or before `now`;
- attempts are at least five.

Therefore it is a same-owner expiry finalizer, not an independent reaper. If the fifth worker disappears, a separate Recovery Actor cannot claim the lease through the ordinary acquisition path and cannot call this helper with its own identity. Passing the original worker ID would be impersonation and is prohibited.

The SQL status-event trigger records `COALESCE(NEW.lease_owner, OLD.lease_owner)`, preserving the old lease holder when the helper clears the lease. That actor field denotes the expired lease holder; it does not record a distinct recovery principal. The earlier PR #59 audit identified this same orphaned-fifth-lease limitation; current PR #67 still has it.

**Disposition:** BLOCKER for independent recovery capability; no independent reaper exists in this proof. The current helper remains valid only for same-owner expiry finalization. Do not claim Recovery Actor support.

## Finding F-04 — no accepted authority boundary for an independent reaper

The local API accepts caller-supplied `workerId`, `generation` and `now`; SQL fencing verifies the supplied tuple against stored state but does not authenticate the caller, validate a grant, check revocation, or establish trusted time. The architecture document explicitly labels the pool supervisor/recovery scaffold NOT RUN / NOT QUALIFIED.

A future independent reaper must be a distinct, narrowly scoped operation that:
- accepts one exact repository/outbox/attempt/delivery-generation/event-digest identity;
- verifies a dedicated, one-use capability for `dead_letter_expired_projection`;
- uses qualified trusted time and current revocation/policy state;
- atomically consumes the nonce and transitions only the exact expired fifth-lease outbox row to terminal dead-letter;
- records both the expired lease owner and the actual recovery actor as separate fields;
- appends immutable evidence and read-backs the exact resulting state;
- cannot acquire/renew leases, POST/replay GitHub projection, alter comment state, reopen dead-letter, or mutate task/attempt state.

The current accepted/operational owners, issuer, principal registry, key custodian, revocation source, trusted-time source, audit sink and retention approval are not established. This is not authorized for implementation.

## Actor semantics and digest contract decision required

Before code changes, normative decisions must explicitly answer:
1. Does `pool_attempt_events.actor_id` mean execution lease holder, request initiator, authenticated principal, or issuer subject? These must not be conflated.
2. Does `event_digest` mean result digest only or canonical terminal-event digest? The current SQL implements the former when both digests exist.
3. Must projection marker bind result and provenance separately, or bind a versioned canonical event digest?
4. How are historical v1 rows and event IDs preserved if a v2 digest is introduced?
5. Which separately authorized actor can reap an orphaned fifth lease, and how is that actor distinguished from the expired lease holder?

No accepted shared immutable lifecycle or trusted reconciliation authority contract was found in the prior bounded source crosswalk. Do not invent a canonical contract or borrow the A0 issuer audience for this operation.

## Tests and qualification status

Existing exact-head PR #67 local D1 proof previously passed 69/69 tests and contract validation on the same immutable implementation head. Those tests prove the current implementation's specified local behavior; they do not cover independent fifth-lease recovery or canonical terminal-event digest semantics.

Required future negative/positive tests:
- fifth lease expires and original worker is unavailable; only separately authorized reaper can dead-letter;
- wrong repository/outbox/attempt/generation/digest, unexpired lease, attempts below five, expired/revoked/replayed grant all fail closed;
- event records both expired lease owner and recovery principal without substituting one for the other;
- recovery transition cannot mutate task/attempt/comment state or call GitHub;
- canonical terminal event digest changes if any bound field, including provenance digest, changes;
- exact replay preserves event ID/digest; conflicting replay is rejected;
- legacy digest rows remain readable and are not silently rewritten.

## Explicitly unchanged

No code, schema, workflow, secrets, permissions, hosted D1, live GitHub comment/label writes, dispatch, provider/model calls, deployment, paid resources, merge or independent reviewer dispatch. Independent review remains deferred until actual Cloud Pool launch by owner direction.

## Current disposition

- Finalization actor: SOURCE VERIFIED as lease-holder provenance only; authenticated actor NOT QUALIFIED.
- Finalization event digest: result-only under current SQL; full terminal-event digest semantics NOT DEFINED / NOT QUALIFIED.
- Fifth-lease helper: SOURCE VERIFIED as same-owner expiry finalizer.
- Independent fifth-lease Recovery Actor: NOT IMPLEMENTED / NOT QUALIFIED.
- Hosted D1: NOT QUALIFIED.
- Dispatch: FAIL-CLOSED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Next bounded step: define a versioned terminal-event digest/actor contract and a separately authorized independent fifth-lease reaper contract. Do not implement either runtime until authority owners and normative semantics are accepted.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
