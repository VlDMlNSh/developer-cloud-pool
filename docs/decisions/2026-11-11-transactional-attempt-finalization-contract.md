# Transactional attempt finalization contract — target design

- Date: 2026-11-11
- Status: TARGET CONTRACT / DOCUMENTATION ONLY / NOT IMPLEMENTED AS A HOSTED SERVICE / NOT QUALIFIED
- Related: [Issue #38](https://github.com/VlDMlNSh/developer-cloud-pool/issues/38), [PR #37](https://github.com/VlDMlNSh/developer-cloud-pool/pull/37), [PR #53](https://github.com/VlDMlNSh/developer-cloud-pool/pull/53), [PR #39](https://github.com/VlDMlNSh/developer-cloud-pool/pull/39), [PR #54](https://github.com/VlDMlNSh/developer-cloud-pool/pull/54), [PR #60](https://github.com/VlDMlNSh/developer-cloud-pool/pull/60).

## 1. Purpose and authority boundaries

Define the minimum durable transaction for terminalizing one immutable execution attempt and creating its audit/projection intent. This is separate from consuming an approval, creating a task claim, acquiring an execution lease, and delivering a GitHub projection.

The target remains the dedicated authenticated claim/execution service backed by a transactional conditional-write store selected in Issue #38. Existing Cloudflare D1 Workers-runtime proofs are implementation references only; no hosted D1 service or issuer is selected or qualified.

Authorities remain separate:
- Supervisor coordinates one bounded task request and invokes the reusable Worker only after all gates.
- Claim service authenticates issuer capability and owns authoritative task/attempt/lease/finalization records.
- Worker performs only the allowlisted execution and submits a result bound to its exact attempt and lease generation.
- Projection delivery actor can publish only the committed outbox event to its allowed GitHub projection.
- Projection Recovery Actor can recover only its own outbox delivery under a separate audience; it cannot change task execution, create attempts, requeue, or dispatch.
- Jarvis, ASTRA A0, MediaHub Product State Authority and MediaHub Security Issuer Authority remain distinct authorities. No capability is reused across audiences.

## 2. Aggregate identity and immutable binding

A finalization command MUST identify the exact current attempt with all of:
- stable logical task key;
- immutable attempt ID and positive attempt number;
- repository numeric ID and task/Issue number;
- immutable target commit SHA and allowlisted execution profile;
- canonical task-envelope digest and attempt input digest;
- execution idempotency key;
- lease owner/principal ID and monotonically increasing lease generation;
- Worker execution/run/job identity and result provenance digest;
- terminal status and bounded terminal reason;
- authenticated capability issuer, subject, audience, operation, policy version, nonce and trusted validity interval.

Caller-supplied actor labels or timestamps are metadata, not authentication or trusted time. The service derives authenticated principal and trusted time from qualified sources.

Any mismatch in task key, attempt ID/number, repository, target SHA, profile, envelope/input digest, lease owner, generation, audience or current attempt pointer MUST fail closed.

## 3. Atomic finalization transaction

The authoritative store MUST commit the following as one transaction, or commit none:

1. Conditionally update exactly one current attempt from `running` (or a separately authorized `indeterminate` resolution path) to one terminal state: `succeeded`, `failed` or `abandoned`.
2. Require exact task pointer, attempt ID, task key, owner, lease generation, and unexpired lease at the transaction's trusted decision time. A stale generation MUST affect zero rows.
3. Persist immutable terminal fields: result digest, provenance digest, terminal reason, completion time and canonical finalization event digest.
4. Append exactly one immutable `attempt.finalized` audit event with event ID deterministic from attempt ID and fields binding task key, attempt ID, terminal state, result digest, provenance digest, owner, generation, trusted timestamp, and authenticated actor/capability provenance.
5. Update the logical task projection and clear the lease only for that same current attempt.
6. Insert exactly one deterministic projection-outbox row referencing the immutable event and carrying the exact repository/Issue/target/profile/terminal projection fields.

Database uniqueness constraints and conditional writes, not application-level read-before-write, enforce one terminal event and one outbox row per attempt. Append-only event records reject update/delete. A transaction failure rolls back terminal state, task projection, audit event and outbox together.

The canonical event digest MUST cover a canonical serialization of all security-relevant event fields, including both result and provenance digests. It MUST NOT be merely an alias for the result digest. The existing local proof's trigger stores a selected digest in `pool_attempt_events.event_digest`; before promotion, verify that the digest commits to the complete finalization event rather than only `result_digest`.

## 4. Idempotency and ambiguous outcomes

- Deterministic finalization identity: `attempt-finalized:<attempt_id>`.
- A repeated command with byte-for-byte equivalent immutable terminal fields and the same authenticated actor/generation may return `ALREADY_FINALIZED` without rewriting records.
- Any conflicting replay (different status, result digest, provenance digest, reason, actor, generation, or event digest) MUST return a conflict/deny result and MUST NOT rewrite the terminal row.
- If the client loses the response, it queries authoritative state by attempt ID and deterministic event/outbox IDs. It must not infer failure from timeout.
- If storage outcome cannot be established, return/retain `INDETERMINATE` and require authoritative reconciliation. Never create a new attempt or dispatch based only on a missing response or expired lease.
- Exactly-once external GitHub effects are not claimed. The guarantee is one durable finalization and one durable projection intent; delivery is at-least-once with deterministic idempotency and read/reconcile-before-retry.

## 5. Projection outbox lifecycle

The outbox is a separate aggregate created atomically with finalization. Delivery state transitions are conditional on exact outbox ID, delivery owner, monotonic delivery generation and unexpired delivery lease.

Minimum states:
- `pending` → `leased` → `delivered`;
- `leased` → `retryable` after a known safe retry decision;
- `leased` → `dead_letter` only under a separate narrow recovery policy.

Every delivery lease acquisition, retryable transition, delivered acknowledgement and dead-letter action appends an immutable delivery event in the same transaction as its outbox state change. Stale delivery generations cannot acknowledge or overwrite newer delivery attempts.

GitHub Issue labels/comments are projections only. A timeout after GitHub accepts a write is an ambiguous external effect: the delivery actor must read and reconcile the projection before retrying. It cannot mutate the authoritative task/attempt state. Projection recovery cannot authorize a Worker retry or dispatch.

## 6. State transitions and invariants

| Entity | Allowed terminal transition | Required invariant |
|---|---|---|
| Attempt | running → succeeded / failed / abandoned | Exact current attempt + owner + generation + valid lease |
| Attempt | indeterminate → terminal | Separate resolver capability and independently verified evidence; not ordinary Worker finalization |
| Task | leased → completed / pending | Same transaction as attempt terminalization; never update a newer attempt |
| Finalization event | insert once | Append-only; unique deterministic event ID |
| Projection outbox | insert once per attempt | Created in finalization transaction |
| Delivery outbox | pending/retryable → leased → delivered/retryable/dead_letter | Conditional owner + generation + expiry fencing |
| GitHub projection | external effect | Idempotent reconciliation; not authoritative state |

A failed attempt may leave the logical task pending for a separately authorized new attempt, but finalization itself MUST NOT create or dispatch that next attempt. An abandoned or indeterminate attempt MUST NOT be treated as proof that external execution stopped.

## 7. Existing mature components and reuse

Source review found existing local proof components suitable for reuse as reference implementations:
- PR #39: conditional approval consume with trigger-created claim + task outbox in one local D1 transaction. Exact-head CI run 42329993548 succeeded.
- PR #54: logical task identity, immutable attempt rows, lease generation, owner/generation/expiry fencing, attempt events, terminal projection outbox, and append-only projection delivery events. Exact-head CI run 42537241204 succeeded.
- PR #53: useful defense-in-depth for immutable Issue envelope and run/attempt identity, but GitHub label PATCH remains non-CAS; it does not close F2.
- Official Cloudflare Workers Vitest integration and local Miniflare/workerd D1 fixtures are already used. Do not build a custom database engine.

The above PRs are stacked Drafts/local-only proofs, not merged or deployed. Their CI success proves those exact local test workflows ran, not hosted D1, issuer authentication, production isolation, quotas, account ownership, trusted time, or production recovery.

## 8. Required qualification before implementation/promotion

1. Select and qualify the hosted conditional-write store and prove free-tier entitlement, account ownership, quota, retention and isolation.
2. Accept the separate Security Issuer Authority and its verifier/trust-anchor/revocation/trusted-time/audit contracts. Current MediaHub issuer PRs remain draft and unaccepted.
3. Define canonical event serialization, digest algorithm/version and schema; validate strict schema and database constraints.
4. Add tests for duplicate finalization, conflicting replay, concurrent stale/current generation, wrong owner, expired lease, attempt pointer replacement, task envelope mutation, transaction rollback at every write boundary, lost response before/after commit, process restart and projection delivery ambiguity.
5. Run real hosted contention and fault-injection tests; verify one terminal event and one outbox per attempt.
6. Prove independent per-consumer capability checks and secret isolation. No database credential or issuer key reaches browser, Worker payload, logs or artifacts.
7. Verify exact-head CI, current governance/ruleset, independent security review and immutable artifact provenance.
8. Keep dispatch disabled until all gates are ACCEPTED.

## 9. Explicit non-goals and current disposition

This contract does not select a hosted backend, deploy a service, enable dispatch, authorize provider/model calls, or merge any PR. It does not grant broad GitHub Contents: write or Issues: write as a substitute for a claim service.

- Transactional finalization target: DEFINED / NOT IMPLEMENTED AS HOSTED SERVICE.
- Local D1 attempt/outbox evidence: VERIFIED at the cited exact CI runs.
- Hosted store, issuer, trusted time, quotas, isolation: NOT VERIFIED.
- PR #53 F2: PARTIALLY ADDRESSED; non-CAS Issue labels remain.
- F10: local transactional outbox pattern exists as a proof; production integration NOT QUALIFIED.
- Dispatch: DISABLED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
