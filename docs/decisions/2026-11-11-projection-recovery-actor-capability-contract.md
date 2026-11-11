# Recovery Actor capability contract for terminal projection outbox

- Date: 2026-11-11
- Status: PROPOSED / NOT IMPLEMENTED / NOT QUALIFIED
- Scope: local D1 terminal-projection outbox recovery only
- Immutable design base: `Основной@864213e2ff5b4fa956ba405dea8137a44d812f49`
- Related proof: PR #58 and PR #59 (both draft, stacked, unmerged at time of design)
- Related governance blocker: Issue #38
- Non-goals: task execution retry, task-state mutation, GitHub dispatch, production sender, secret access, deployment, provider/model calls

## 1. Problem statement

The current local adapter `deadLetterExpiredProjection(db, outboxId, workerId, generation, now)` can terminalize an expired fifth delivery lease only when the caller supplies the original lease owner. This demonstrates same-owner expiry handling, not independent orphan-worker recovery. If that worker disappears permanently, another actor cannot complete the transition and the row may remain `leased`.

An expired lease is not proof that an external side effect did not happen. Recovery must therefore be a terminal projection-delivery decision only; it must never replay the underlying task attempt.

## 2. Threat model

Protect against:
- a stale or crashed delivery worker attempting to acknowledge or mutate a newer lease;
- a caller inventing a worker/recovery identity in request data;
- replay of a previously accepted recovery request;
- a recovery actor being used to requeue work or mutate authoritative task state;
- ambiguous database outcomes being treated as success;
- external GitHub projection retries creating duplicate visible records;
- accidental expansion of Supervisor, Worker, or recovery authority.

Assume:
- the storage adapter is not itself an authentication boundary;
- D1 SQL predicates can enforce atomic conditional transitions, but do not authenticate the caller;
- a trusted ingress/authentication layer must establish actor identity before invoking storage operations;
- external side effects can be ambiguous after timeout.

## 3. Authority separation

Define three distinct identities:
1. **Delivery Worker** — may acquire, retry, and acknowledge its own unexpired delivery lease using exact owner + generation fencing.
2. **Projection Recovery Actor** — may only terminalize an expired, exhausted projection delivery lease; may not create or retry deliveries, dispatch tasks, mutate task/attempt state, alter terminal status, or change repository/target bindings.
3. **Task Supervisor / Worker** — retains its separate task lifecycle permissions; these must not be inherited by the projection recovery actor.

A caller-provided `workerId` or `recoveryActorId` string is audit metadata, not proof of authority. The adapter must not infer authorization from a non-empty identifier.

## 4. Recovery authorization envelope (proposed contract)

The trusted authorization boundary must produce a verified, narrowly scoped grant with all of:
- issuer identity and issuer key/version identifier;
- subject = one registered recovery actor;
- audience = projection-recovery operation;
- exact repository identity;
- exact `outbox_id` and `attempt_id`;
- exact expected `lease_generation_delivery`;
- operation = `dead_letter_expired_projection` only;
- maximum-attempt precondition = configured ceiling (currently 5 in the isolated proof);
- not-before and expiry timestamps;
- unique nonce / grant ID for replay detection;
- immutable grant digest for audit attribution.

The storage adapter accepts only a verified grant object produced by the trusted boundary, not a caller-supplied identity string. The production mechanism for producing/verifying this grant is deliberately unresolved until issuer ownership, key custody, rotation, free-tier availability, and capability enforcement are qualified. Do not add a shared static token, expose secret values, or give the Supervisor broad repository contents-write authority as a shortcut.

## 5. Atomic state transition

The recovery operation must perform one conditional database transition whose predicate includes all of:
- exact `outbox_id`;
- status = `leased`;
- exact expected delivery generation;
- lease expiry <= authoritative current time;
- delivery attempts >= configured maximum;
- exact attempt/task binding read from immutable outbox row;
- grant scope matches the same repository, outbox, attempt, generation, and operation;
- grant nonce has not been consumed.

The same transaction must:
- mark only the projection outbox row `dead_letter`;
- clear lease owner and expiry;
- persist bounded reason code and recovery actor ID;
- persist grant ID/digest and recovery timestamp;
- consume the grant nonce exactly once;
- append one immutable `delivery.dead_letter` event attributed to the recovery actor.

A zero-row conditional update is DENY / stale / already handled. A database exception or ambiguous commit is DENY / NOT VERIFIED; do not infer success. Read-back must verify all terminal fields and the unique recovery event.

## 6. Database invariants

- Dead-letter is terminal; no update or delete after terminalization.
- Delivery attempts cannot exceed the configured maximum.
- Only an expired, exhausted lease can be recovered.
- Recovery cannot alter `pool_tasks`, `pool_attempts`, terminal attempt status, task result digest, provenance digest, target SHA, or repository/issue binding.
- Event history is append-only.
- Recovery actor attribution is distinct from the expired delivery lease owner.
- Recovery grant consumption and dead-letter transition are atomic.
- No automatic requeue, task retry, or dispatch follows dead-letter.

If schema changes are made, add an explicit `recovered_by` / `recovery_grant_id` (or equivalent immutable audit columns) and update the status-event trigger to prefer the verified recovery actor for `delivery.dead_letter`. Do not overwrite the historical lease owner before its identity has been captured.

## 7. External projection idempotency

The future GitHub projection sender must use a deterministic idempotency identity derived from the immutable outbox ID. On ambiguous timeout, it must reconcile visibility before retrying. An expired lease alone does not authorize duplicate comment creation. The recovery actor does not perform GitHub writes.

## 8. Mature component evaluation

| Candidate | Useful property | What it does not solve | Current disposition |
|---|---|---|---|
| Cloudflare D1 | Conditional SQL updates and transaction-backed state transitions fit the existing local proof | Does not authenticate the caller or create a distinct recovery identity | Keep as local proof backend; hosted/free-tier qualification pending |
| Cloudflare Durable Objects (SQLite) | Per-object serialized coordination and private strongly consistent storage are suitable for per-task/per-outbox coordination | Does not automatically define issuer, actor authorization, capability scope, or GitHub side-effect idempotency | Candidate for comparison; do not migrate without entitlement/cost/isolation qualification |
| Cloudflare Workflows | Durable steps, wait/sleep and configurable retries help with orchestration and restart handling | Retry durability is not an authorization boundary or a compare-and-swap claim protocol | Candidate orchestration layer only; not a replacement for claim authority |
| GitHub Actions concurrency | Serializes runs sharing a concurrency group | Not a lock against unrelated actors or workflows and not a durable per-row capability | Not sufficient alone for recovery authorization |

The existing D1 conditional-update proof is the smallest local mechanism to retain while the authority boundary is designed. Durable Objects may reduce coordination complexity if per-entity serialization becomes a requirement, but Cloudflare account entitlement, plan limits, storage billing, and production access are not yet qualified. Workflows may provide durable scheduling/retries but must call a separately authorized state transition.

## 9. Required tests before qualification

Local D1 tests:
- recovery actor can terminalize an expired fifth lease with an exact valid grant;
- recovery actor is denied for a live lease;
- wrong repository, outbox, attempt, operation, generation, issuer, subject, or audience is denied;
- expired/not-yet-valid grant is denied;
- nonce replay is denied, including concurrent duplicate requests;
- stale generation and already-dead-lettered row are denied;
- worker cannot use recovery operation;
- recovery actor cannot acquire, retry, acknowledge, requeue, dispatch, or mutate task/attempt state;
- recovery event attributes the recovery actor, not the vanished lease owner;
- injected storage errors and ambiguous commit remain NOT VERIFIED and are reconciled without duplicate events.

Backend qualification:
- contention test against the selected real backend proving exactly one recovery winner;
- crash/restart and retry tests;
- exact-head CI and independent security review;
- verify no secrets in logs/artifacts and no broad permission expansion.

## 10. Decision and gates

**Decision:** Do not implement a recovery actor in the current PR #59 adapter yet. Retain the existing D1 local proof, and treat the recovery-actor capability contract as a separate design prerequisite.

**Blocked until:**
1. issuer and verification boundary are identified and owned;
2. recovery actor identity cannot be forged by a caller;
3. one-use grant consumption and dead-letter transition are atomic;
4. task lifecycle and dispatch permissions remain unreachable;
5. backend free-tier/cost and isolation are verified;
6. exact-head tests and independent security review pass.

Keep `POOL_DISPATCH_ENABLED` false/unset and all production dispatch paths fail-closed. Do not deploy, wire a live sender, or claim Contour A acceptance from this local proof.
