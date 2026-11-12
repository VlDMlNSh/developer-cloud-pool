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


## 11. Relationship to the existing Resolver contract

The repository already defines a broader backend-neutral Resolver capability in `docs/contracts/TRUSTED-RECONCILIATION-AUTHORITY-CONTRACT.md` (documentation branch `docs/cross-chat-continuation-2026-11-06`, blob `32bce214a8a3577584f058fb5679b8cecf5f3309`). That contract binds resolver grants to task/attempt/generation/envelope/executor evidence and permits only `observe`, `resolve_no_retry`, or `propose_retry_candidate`.

**Do not reuse a task Resolver grant as a projection recovery grant.** The authority domains and resources differ:
- Task Resolver evaluates native executor/effect evidence and must not clear or transfer the old task lease, create a new attempt, or dispatch.
- Projection Recovery Actor terminalizes one exhausted projection-delivery outbox row and must not resolve task execution, change task/attempt state, or perform GitHub writes.

Reuse the established issuer/capability design patterns only if the issuer explicitly supports a distinct audience (for example `projection-outbox-recovery`), subject allowlist, operation, and exact outbox binding. A dedicated grant must bind repository ID, outbox ID, attempt ID, delivery generation, immutable event digest, and the terminal-only operation. Its nonce namespace and consumption record must be unambiguous and single-use. Do not expand the task Resolver's current operation allowlist or silently broaden an existing Resolver capability.

The shared claim lifecycle and trusted reconciliation contracts remain normative for issuer authentication, revocation, policy versioning, trusted clock provenance, immutable binding, fencing, idempotency and audit. They do not by themselves grant projection recovery permission.

## 12. Trusted time correction and implementation boundary

The current local projection adapter accepts `now` as a caller argument. That is acceptable only as a deterministic test seam; it is not a production time authority. The recovery contract must not trust a caller-supplied timestamp to prove lease expiry or grant validity.

Before implementation, select and qualify one trusted time source:
- preferably a database-generated UTC timestamp evaluated inside the same conditional transaction as lease-expiry checks and grant-nonce consumption; or
- a separately qualified trusted host clock sampled at the trusted composition root, with provenance, skew bounds, monotonicity and failure behavior established.

The selected source must be authoritative for both `lease_expires_at` and grant `not_before`/`expires_at` comparisons. Clock unavailable, backwards, future-inconsistent, or outside the permitted skew bound means DENY / UNRESOLVED. A timestamp passed by an API caller or embedded in an unverified JSON object is never authoritative.

Tests may inject a deterministic clock only behind a test-only adapter. Production exports must not accept arbitrary `now` values from the caller. If D1's database time functions are selected, test their exact semantics in the pinned local runtime and hosted D1 before relying on them; do not assume local SQLite and hosted D1 timing semantics are equivalent without evidence.

The trusted reconciliation contract's existing host-clock composition proof is synthetic and explicitly leaves production clock provenance NOT QUALIFIED. That proof is useful precedent, not clock qualification for this outbox.


## 13. Verified-grant object and D1 composition-root boundary

A structurally valid JavaScript object is not an authenticated capability. The phrase "verified grant object" must not be implemented as a caller-provided object containing fields such as `verified: true`, `recoveryActorId`, or `issuerId`. TypeScript interfaces and compile-time brands alone do not establish runtime authenticity.

Before implementation, select and test one of these equivalent trusted patterns:

1. **Verify at the storage entrypoint:** the only recovery entrypoint receives the signed grant bytes, verifies the signature and all issuer/key-version/policy/revocation/claim bindings itself, then performs the conditional state transition; or
2. **Opaque in-process capability:** a trusted composition-root verifier validates the signed grant and constructs a non-serializable capability whose constructor and validation state are private to the module/process boundary (for example, module-private closure state or a private WeakMap). The storage function rejects plain objects, JSON round-trips, cross-process copies, and capabilities not minted by that verifier.

The chosen design must additionally establish:

- A fixed issuer trust configuration and explicit algorithm allowlist; reject unsigned grants, algorithm confusion, unknown issuer/key versions, invalid key rotation state, revoked issuer/policy epochs, malformed canonical claims, and ambiguous duplicate grant IDs.
- Signature verification covers the canonical immutable claim set, including repository ID, outbox ID, attempt ID, delivery generation, immutable event digest, audience, subject, operation, attempt ceiling, not-before, expiry, nonce, and policy version.
- The authorization boundary obtains actor identity from the verified issuer/capability, never from request headers, issue text, workflow inputs, or caller-provided actor strings.
- The recovery operation is reachable only through the trusted composition root. No public route, generic RPC, task Worker input, or browser payload may invoke the storage transition by supplying a grant-shaped JSON object.
- The D1 binding remains server-side and is never exposed to a browser/client. Inventory every Worker/script with the binding. A second Worker with the same binding is not a distinct database privilege boundary; do not claim SQL least privilege from code separation alone.
- If one Worker hosts multiple routes, document the application-level trust boundary and ensure only the dedicated authenticated route can invoke the private recovery module. If that cannot be established, keep recovery disabled or select a backend/API with an independently enforceable access boundary.
- The nonce-consumption table has a database-enforced unique key over the issuer/audience/nonce namespace (or an equally strong canonical grant identifier). Its insert/consume and the outbox terminal transition must commit in the same transaction. Duplicate concurrent consumption must produce one winner and no duplicate event.
- The audit receipt records the verified issuer, subject, key version, policy epoch, grant ID/digest, nonce hash, original lease owner, expected generation, recovery reason, and trusted timestamp. Never persist the raw signed grant or bearer credential.

These requirements are acceptance criteria, not a selected implementation. The signing format, key custody/rotation mechanism, issuer operator, Worker topology, and account-level isolation remain unresolved. No issuer, credential, route, Worker, or database authority is created by this document.
