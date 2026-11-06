# D1 Claim + Transactional Outbox Contract 0.1 (proposal)

**Status:** PROPOSED / NOT IMPLEMENTED / NOT QUALIFIED  
**Date:** 2026-11-06  
**Scope:** bounded design for a future isolated D1 qualification. This document does not authorize resource creation, production integration, secret access, model/provider calls, or dispatch.

## 1. Guarantees and non-guarantees

The protocol must distinguish the following:

- **Single-use authorization:** at most one claim is created for one signed approval ID.
- **Atomic enqueue:** the accepted claim and its outbox task are committed in one D1 transaction or neither is committed.
- **At-least-once delivery:** a pending task can be leased again after a worker/dispatcher failure.
- **Idempotent effect:** external effects are deduplicated by a stable task idempotency key where the downstream system supports it.
- **Fenced acknowledgement:** a worker with an expired lease cannot complete a task after a newer lease generation has been issued.

It does **not** guarantee exactly-once external side effects. That guarantee is impossible without downstream idempotency or a domain-specific reconciliation/compensation protocol.

## 2. Trust boundaries

### Approval issuer
- Authenticates the human approver through a verified GitHub identity flow.
- Derives the numeric owner ID from verified identity data, never from a request field.
- Creates a canonical approval envelope and signs it with an issuer-held private key.
- Private signing key and GitHub OAuth/App credentials are not available to the Supervisor, dispatcher, or worker.

### Claim API / Supervisor
- Verifies signature against pinned issuer public keys, issuer/key ID, audience, protocol version, issued-at/expiry, scope and revocation.
- Validates repository numeric ID, issue number, immutable target commit SHA and allowlisted executor profile.
- Does not mint approvals or supply trusted time/identity.
- Has only the minimum database permissions required for the claim API. It cannot administer D1 or access unrelated repositories/secrets.

### Dispatcher
- Reads pending outbox tasks and obtains short leases with monotonic fencing generations.
- Cannot create or alter approval envelopes.
- Cannot bypass the claim transaction or directly invoke a provider.

### Worker
- Receives an immutable task reference and approved payload digest.
- Has no approval issuer key, GitHub OAuth credential, D1 admin credential or general dispatch authority.
- Acknowledges only with the current claim ID and lease generation.

## 3. Signed approval envelope

Canonical payload fields (UTF-8 canonical JSON or a rigorously specified equivalent):

| Field | Type | Rule |
|---|---|---|
| `version` | integer | exactly 1 for this contract |
| `issuer` | string | exact configured issuer identity |
| `key_id` | string | key identifier in pinned verifier set |
| `audience` | string | exact claim API audience |
| `approval_id` | string | unique random identifier, 1–128 chars |
| `owner_numeric_id` | string | digits only; derived from verified GitHub identity |
| `repository_id` | string | digits only; canonical repository numeric ID |
| `issue_number` | integer | positive |
| `target_sha` | string | immutable 40-character lowercase commit SHA |
| `profile` | string | exact allowlisted executor profile |
| `payload_digest` | string | SHA-256 of canonical immutable task payload |
| `issued_at` | integer | issuer time in Unix seconds |
| `expires_at` | integer | greater than issued_at and within configured max TTL |
| `scope` | string array | exact least-privilege action set; unknown scopes rejected |

Signature algorithm and canonicalization must be pinned in implementation (no algorithm negotiation from untrusted input). Verifier key rotation, overlap, revocation and issuer-compromise response must be documented before implementation. Server time is authoritative; caller-supplied timestamps are not accepted. Define a small explicit clock-skew tolerance and fail closed when trusted time is unavailable.

## 4. Proposed persistent schema

This is a reviewable schema proposal, not a migration to apply yet.

### `pool_approval_ledger`
One row per issuer approval:
- `approval_id TEXT PRIMARY KEY`
- `issuer TEXT NOT NULL`, `key_id TEXT NOT NULL`
- `owner_numeric_id TEXT NOT NULL`, `repository_id TEXT NOT NULL`
- `issue_number INTEGER NOT NULL`, `target_sha TEXT NOT NULL`
- `profile TEXT NOT NULL`, `payload_digest TEXT NOT NULL`
- `issued_at INTEGER NOT NULL`, `expires_at INTEGER NOT NULL`
- `state TEXT NOT NULL CHECK state IN ('ready','claimed','revoked')`
- `revoked_at INTEGER NULL`, `created_at INTEGER NOT NULL`

Constraints: positive issue number/timestamps; target SHA is lowercase 40-hex; digest is lowercase 64-hex; expiry > issue time; claimed iff a matching claim exists (enforced by transaction and integrity audit). No update path may move claimed back to ready.

### `pool_claims`
One durable claim per approval:
- `claim_id TEXT PRIMARY KEY`
- `approval_id TEXT NOT NULL UNIQUE REFERENCES pool_approval_ledger(approval_id)`
- `idempotency_key TEXT NOT NULL UNIQUE`
- `payload_digest TEXT NOT NULL`
- `state TEXT NOT NULL CHECK state IN ('queued','leased','completed','dead_letter','cancelled')`
- `lease_generation INTEGER NOT NULL DEFAULT 0`
- `lease_owner TEXT NULL`, `lease_expires_at INTEGER NULL`
- `attempt_count INTEGER NOT NULL DEFAULT 0`
- `created_at INTEGER NOT NULL`, `updated_at INTEGER NOT NULL`, `completed_at INTEGER NULL`
- `last_error_code TEXT NULL` (bounded non-sensitive enum; no raw exception/secret payload)

Constraints: lease owner and expiry are both set iff state is leased; generation and attempt count are non-negative; completed_at is set iff completed. State changes must follow the transition table below.

### `pool_outbox`
Durable delivery queue:
- `outbox_id TEXT PRIMARY KEY`
- `claim_id TEXT NOT NULL UNIQUE REFERENCES pool_claims(claim_id)`
- `state TEXT NOT NULL CHECK state IN ('pending','leased','delivered','dead_letter')`
- `available_at INTEGER NOT NULL`, `created_at INTEGER NOT NULL`, `updated_at INTEGER NOT NULL`
- `delivery_generation INTEGER NOT NULL DEFAULT 0`
- `lease_owner TEXT NULL`, `lease_expires_at INTEGER NULL`
- `attempt_count INTEGER NOT NULL DEFAULT 0`

Outbox and claim rows are inserted atomically with approval transition. Outbox is not deleted on delivery; state history is retained for audit.

### `pool_claim_events`
Append-only transition audit:
- `event_id TEXT PRIMARY KEY`
- `claim_id TEXT NOT NULL`
- `event_type TEXT NOT NULL` (bounded enum)
- `from_state TEXT NULL`, `to_state TEXT NOT NULL`
- `generation INTEGER NOT NULL`
- `occurred_at INTEGER NOT NULL`
- `actor_class TEXT NOT NULL` (issuer/claim-api/dispatcher/worker/reconciler)
- `correlation_digest TEXT NULL`

No credentials, signed token, raw user data, raw payload, or arbitrary exception text in audit events. Append-only must be enforced by the application boundary and periodic integrity/export procedure; D1 itself is not an immutable/WORM audit archive.

## 5. State transitions

| Entity | Allowed transition | Condition |
|---|---|---|
| approval | ready → claimed | signature valid, not expired/revoked, one atomic winning claim |
| approval | ready → revoked | authorized issuer/revoker |
| claim | queued → leased | pending outbox and atomic lease acquisition |
| claim | leased → leased | lease expired; generation increments |
| claim | leased → completed | current generation and lease owner match |
| claim | leased → queued | explicit retryable failure or lease expiry |
| claim | queued/leased → dead_letter | bounded retry budget exhausted / non-retryable failure |
| claim | queued → cancelled | authorized cancellation policy |
| outbox | pending → leased | dispatcher lease acquisition |
| outbox | leased → pending | lease expiry/retry, next available time set |
| outbox | leased → delivered | accepted by dispatcher/worker handoff, same generation |
| outbox | pending/leased → dead_letter | bounded retry budget exhausted |

No transition may decrease generation, resurrect completed/dead-letter state, or accept a stale generation.

## 6. Atomic claim transaction

The claim API first verifies the signed envelope outside the SQL transaction. It then creates a stable candidate `claim_id` and `idempotency_key` for the request. If the client retries after an unknown HTTP outcome, it must reuse the same request idempotency key. A new key is not allowed to bypass the unique approval constraint.

The D1 batch must perform, in order:
1. Conditional update of exactly one approval row from ready to claimed, matching approval ID, issuer, owner, repository, issue, target SHA, profile, digest and expiry using server-derived time.
2. Insert one claim row tied to that approval and idempotency key.
3. Insert one outbox row tied to that claim.
4. Insert a claim-created audit event.

The operation is accepted only if the transaction commits and the first statement reports exactly one changed row. Any statement failure must roll back all four operations. If the response is lost, read by the original approval ID/request idempotency key using a primary-consistent read. If a matching claim exists, return its existing status; if no matching claim exists, return a retryable/unknown response and do not invent a new approval. If storage cannot establish the outcome, return an ambiguous fail-closed result.

Important: the exact D1 `batch()` metadata shape and affected-row behavior for every statement must be tested on the chosen Workers runtime and live isolated D1. Do not infer multi-statement correctness from the current one-statement proof.

## 7. Lease acquisition, fencing and acknowledgement

Lease acquisition must be one conditional update against a pending/expired task, incrementing generation and attempt count, assigning a bounded worker identity, and setting expiry from server time. Only a result with exactly one changed row grants the lease.

Acknowledge/update must include:
- claim ID;
- current lease owner identity;
- exact lease generation;
- state = leased;
- lease not expired according to server time.

A stale generation must update zero rows and must not append a completion event. Lease expiry and retry are driven by a reconciler with bounded batches and explicit concurrency controls. No worker can extend its own lease without a narrowly defined policy.

## 8. Deterministic adversarial qualification tests

Tests must use the same SQL and transition implementation as production, first under pinned local Workers runtime, then against a dedicated isolated real D1 database only after account eligibility and provisioning authorization are verified.

| ID | Scenario | Pass condition |
|---|---|---|
| C01 | 12 and 100 simultaneous claim requests for one approval | exactly one approval→claimed, one claim, one outbox |
| C02 | identical retry with same request idempotency key | same claim ID and status; no duplicate rows/events |
| C03 | retry with a different key for already claimed approval | returns existing claim or denies; never creates a second claim |
| C04 | fail second/third/fourth batch statement | full rollback; approval remains ready; no claim/outbox/event |
| C05 | commit succeeds but HTTP response is dropped | lookup by same approval/idempotency key returns same claim |
| C06 | process terminates after claim commit before dispatch | pending outbox survives restart and is later leased |
| C07 | dispatcher terminates after lease before handoff | lease expiry allows retry with generation + 1 |
| C08 | old worker acknowledges after re-lease | zero rows changed; stale ack rejected |
| C09 | worker side effect succeeds but ack response is lost | same idempotency key prevents duplicate downstream effect |
| C10 | repeated retryable failures | bounded retries and dead-letter state |
| C11 | revoke before claim | claim denied |
| C12 | revoke after claim before lease | follows explicit cancellation/revocation policy; no implicit behavior |
| C13 | bad signature, issuer, key ID, audience, scope, version | denied before DB mutation |
| C14 | owner/repository/issue/target/profile/digest mismatch | denied before DB mutation |
| C15 | expired envelope, clock skew boundary, unavailable trusted clock | fail closed according to explicit tolerance |
| C16 | restore from backup / replay old snapshot | no duplicate claim or resurrection of consumed approval |
| C17 | storage unavailable, overload, ambiguous write | no new claim without deterministic primary read resolution |
| C18 | lease expiry races with ack | one valid transition only; generation fencing preserved |

Each test records exact source SHA, runtime version, backend type, row counts, transition history and artifact digest. Synthetic fault injection must target every transaction boundary. No personal information or secrets in logs.

## 9. Resource, quota and governance gates

Before a live D1 test:
- verify account-specific Workers/D1 Free entitlement and card-free eligibility through a permitted non-secret source;
- verify quota limits, daily write budget, storage budget and overload behavior;
- provision only a dedicated isolated test database after eligibility and authorization;
- use a least-privilege Worker binding and distinct issuer/claim/dispatcher/worker roles;
- define retention, audit export, backup/restore, key rotation/revocation and incident recovery;
- independent security review and exact-head CI required.

Current account Free/card-free eligibility is NOT VERIFIED. No live D1 resource exists in the recorded evidence. Billing/payment details must not be inspected to bypass this blocker.

## 10. Compatibility with current proof and PR #37

Current PR #36 migration has only `pool_approval_ledger` with ready/consumed/revoked and caller-supplied owner/time inputs in the local proof adapter. It has no claims, outbox, lease, fencing, issuer signature or event ledger. Do not mutate that proof migration in place or silently claim backward compatibility.

PR #37 defines the Supervisor/reusable Worker boundary but remains OPEN/DRAFT/UNMERGED. The approval issuer and claim API must remain separate from that Worker boundary. The Worker must not receive issuer private material or broad D1 authority. This proposal does not authorize merging PR #36/#37 or enabling their gates.

## 11. Decision gates

- 0.1 contract review: PROPOSED.
- SQL schema/migration: NOT IMPLEMENTED.
- local adversarial tests C01–C18: NOT IMPLEMENTED.
- real isolated D1: NOT RUN.
- entitlement: NOT VERIFIED.
- independent security review: NOT RUN.
- dispatch: DISABLED / FAIL-CLOSED.
- Contour A: BLOCKED / NOT QUALIFIED / NOT ACCEPTED.
- Contour B: DEFERRED.

Next bounded task: implement the schema and state-transition functions only in an isolated proof branch after contract review, then run local C01–C18 with deterministic fault injection. Do not connect this proof to a production Worker or dispatcher.
