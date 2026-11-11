# Canonical attempt-finalization event v1 — proposal

- Date: 2026-11-11
- Status: PROPOSED / DESIGN ONLY / NOT APPROVED / NOT IMPLEMENTED
- Scope: resolve the canonical event-digest and delivery-actor ambiguities in the local PR #54 proof.
- Authority: this proposal does not select a hosted store, grant issuer authority, authorize deployment, or enable dispatch.
- Related: [Issue #38](https://github.com/VlDMlNSh/developer-cloud-pool/issues/38), [transactional attempt finalization contract](./2026-11-11-transactional-attempt-finalization-contract.md), [PR #54](https://github.com/VlDMlNSh/developer-cloud-pool/pull/54).

## 1. Problem statement

The current target contract requires the immutable `attempt.finalized` event to bind both result and provenance digests and all security-relevant terminal identity/authority fields. The PR #54 local proof currently stores `COALESCE(result_digest, provenance_digest, input_digest)`; because result_digest is required, the stored event digest binds only result_digest. Its replay verifier repeats that shortcut. This is internally consistent but does not satisfy the target contract.

The PR #54 migration `0006_create_attempt_projection_outbox.sql` also records `NEW.lease_owner` for status transitions. The retryable and delivered adapters clear `lease_owner` in the same UPDATE, so those immutable delivery events store NULL actor_id. The existing review thread at [PR #54 line 89](https://github.com/VlDMlNSh/developer-cloud-pool/pull/54#discussion_r4524475226) documents this finding.

## 2. Serialization and digest proposal

Use RFC 8785 JSON Canonicalization Scheme (JCS) as the canonical JSON serialization, with UTF-8 encoding and SHA-256 as the digest algorithm.

- Standards reference: [RFC 8785 — JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785).
- Canonicalization MUST operate on a schema-validated object, not arbitrary caller JSON.
- Reject duplicate JSON member names before object construction; reject unknown fields; do not coerce types.
- Integer fields MUST be safe integers in the interoperable JSON range. Identifiers and digests are strings, never JSON numbers.
- Identifiers, enum values, hashes and SHA values use their explicitly defined ASCII grammar and case. No implicit lowercasing or normalization.
- Free-text terminal_reason is a UTF-8 string; do not Unicode-normalize it. Enforce a byte-length bound as well as a code-point bound.
- No floating-point values, NaN, Infinity, undefined, or null placeholders are allowed in the event schema.
- The digest input is the complete canonical event envelope, including a fixed domain and schema version. This prevents accidental cross-protocol digest reuse.

Proposed digest construction:

```text
event_bytes = UTF8(JCS(event_envelope))
event_digest = lowercase_hex(SHA-256(event_bytes))
```

The envelope includes `domain = "mediahub.cloud-pool.attempt-finalized"` and `schema_version = 1`. The domain and version are themselves covered by the digest. Do not hash a concatenation of independently serialized fragments.

JCS is a serialization standard, not an authentication mechanism. The service must authenticate the issuer capability and derive actor/time from trusted components before it constructs the event.

## 3. Proposed immutable event envelope

The v1 event has exactly these fields; field names and types are part of the schema:

| Field | Type / constraint | Meaning |
|---|---|---|
| domain | fixed string | `mediahub.cloud-pool.attempt-finalized` |
| schema_version | integer = 1 | Event schema version |
| event_id | deterministic string | `attempt-finalized:<attempt_id>` |
| event_type | fixed string | `attempt.finalized` |
| task_key | lowercase SHA-256 hex | Canonical logical task identity |
| attempt_id | bounded ASCII identifier | Immutable attempt identity |
| attempt_number | positive safe integer | Monotonic attempt ordinal |
| repository_id | decimal string | Immutable GitHub numeric repository identity |
| issue_number | positive safe integer | Task Issue number |
| target_sha | lowercase 40-hex string | Immutable source target |
| profile | allowlisted ASCII identifier | Execution profile |
| envelope_digest | lowercase SHA-256 hex | Canonical approved task envelope |
| input_digest | lowercase SHA-256 hex | Exact attempt input |
| execution_idempotency_key | bounded ASCII identifier | Stable execution idempotency identity |
| terminal_status | enum | succeeded / failed / abandoned |
| terminal_reason | bounded UTF-8 string | Approved terminal reason |
| result_digest | lowercase SHA-256 hex | Worker result digest |
| provenance_digest | lowercase SHA-256 hex | Worker result provenance digest |
| completed_at | positive safe integer | Trusted UTC Unix time in milliseconds |
| lease_owner_id | bounded ASCII identifier | Principal to which the exact lease was issued |
| lease_generation | positive safe integer | Monotonic execution fencing generation |
| worker_execution_id | bounded ASCII identifier | Exact executor identity |
| workflow_run_id | decimal string | GitHub Actions run identity |
| workflow_run_attempt | positive safe integer | Exact run attempt |
| workflow_job_id | decimal string | Exact job identity |
| actor_issuer_id | bounded ASCII identifier | Authenticated capability issuer |
| actor_subject_id | bounded ASCII identifier | Authenticated capability subject |
| actor_audience | fixed allowlisted string | Exact capability audience |
| actor_operation | fixed allowlisted string | Exact authorized operation |
| actor_policy_version | bounded ASCII identifier | Issuer policy version |
| actor_capability_id | bounded ASCII identifier | Non-secret capability identity |
| actor_capability_digest | lowercase SHA-256 hex | Digest of the verified signed capability envelope |
| actor_key_id | bounded ASCII identifier | Public verifier key identifier |
| actor_nonce | bounded ASCII identifier | One-time capability nonce |
| actor_issued_at | positive safe integer | Issuer timestamp in milliseconds |
| actor_not_before | positive safe integer | Capability not-before in milliseconds |
| actor_expires_at | positive safe integer | Capability expiry in milliseconds |
| actor_revocation_epoch | non-negative safe integer | Revocation snapshot/version used by verifier |

The exact audience and operation allowlists, identifier grammars, length bounds, timestamp skew policy, and capability trust-anchor format MUST be approved by the Security Issuer Authority before implementation. This proposal deliberately does not invent those authorities or values.

The raw bearer token, private keys, shared secrets, cookies, GitHub tokens and provider credentials MUST NOT be stored in the event, digest input, logs, artifacts or browser-visible data.

## 4. Transaction and replay rules

The finalization transaction MUST atomically:

1. Validate the complete v1 event schema and recompute its digest inside the trusted service boundary.
2. Conditionally terminalize the exact current attempt using task pointer, attempt ID, owner, generation and trusted unexpired lease.
3. Persist immutable terminal fields and the event digest.
4. Append exactly one `attempt.finalized` event with the complete envelope and digest.
5. Update the task projection and clear the matching lease.
6. Insert exactly one projection-outbox row referencing the event ID and digest.

Any failure rolls back all six effects. Database uniqueness and conditional writes enforce one event/outbox per attempt; read-before-write is not a substitute.

A replay is `ALREADY_FINALIZED` only when the recomputed canonical envelope bytes and digest match the persisted event byte-for-byte and the authoritative attempt/event/outbox identities match. A mismatch in any field, including provenance digest, reason, actor, capability, workflow run attempt, owner or generation, is a conflict and must not mutate state.

A client timeout is ambiguous. Reconcile by deterministic attempt/event/outbox IDs; never infer non-commit from a missing response and never dispatch a replacement attempt solely because a response was lost.

## 5. Delivery actor attribution

Execution finalization actor and projection-delivery actor are different identities and must not be conflated.

For the local D1 proof only, a transition from `leased` to `retryable` or `delivered` may preserve the lease principal as `OLD.lease_owner` before the UPDATE clears the live lease fields. Tests must assert that the immutable event records the expected prior lease owner. This fixes the NULL-attribution defect in the synthetic schema, but does not authenticate that identifier.

For the hosted service, the delivery event must persist both:
- `lease_owner_id`: the principal holding the exact delivery lease before transition;
- `actor_issuer_id`, `actor_subject_id`, `actor_audience`, `actor_operation`, `actor_capability_id`, `actor_capability_digest`, `actor_key_id`, and trusted event time from the authenticated delivery capability.

A caller-supplied workerId or preserved OLD value is only a lease-binding field; it is not proof of authenticated identity. The trusted composition root must derive and verify the actor capability, audience, operation, expiry and revocation before allowing the transition.

Delivery event identity remains deterministic from outbox ID and delivery generation. Stale generations cannot append accepted delivery transitions. Event append-only constraints and outbox state change remain in one transaction.

## 6. Required conformance tests

Before changing PR #54 proof code, add:

- Golden JCS byte vectors and SHA-256 vectors for the complete v1 event.
- A digest mutation matrix: independently alter every field, especially result_digest, provenance_digest, terminal_status, terminal_reason, owner, generation, actor, capability digest, workflow run attempt and trusted time; every mutation must change the digest.
- Reject unknown/missing fields, duplicate keys, wrong types, non-safe integers, invalid ASCII identifiers, malformed digests, unsupported versions and out-of-policy timestamps.
- Unicode terminal_reason vectors proving deterministic UTF-8/JCS behavior without implicit normalization.
- Exact replay succeeds; conflicting replay of each security-relevant field fails and leaves exactly one terminal event and one outbox.
- Transaction rollback injected after each write boundary leaves no partial terminal/task/event/outbox state.
- Lost response before commit and after commit reconcile to the correct state without creating another attempt or event.
- Delivery actor tests assert lease_owner_id survives lease clearing, authenticated actor fields are present, stale generations are rejected, and event rows remain append-only.
- A negative test proves caller-supplied actor labels and caller-supplied clocks cannot satisfy production authentication/trusted-time checks.

## 7. Scope and decision gates

This is a proposal, not an approved wire contract. Before implementation:
1. Security Issuer Authority approves the issuer/subject/audience/operation and trust-anchor fields.
2. Governance approves timestamp units, skew/revocation semantics, key lifecycle and event retention.
3. The canonical v1 schema and JCS vectors are accepted as a versioned contract.
4. Hosted conditional-write store, free-tier entitlement, ownership, quota, isolation and trusted time are qualified.
5. A bounded proof-only implementation is reviewed against the accepted contract and exact-head CI.
6. Dispatch remains disabled until all Contour A gates are independently evidenced.

## 8. Current disposition

- PR #54 canonical full-field event digest: NOT IMPLEMENTED; current result-first digest does not conform.
- PR #54 delivery actor attribution: NOT VERIFIED; current status trigger writes NULL for retryable/delivered.
- JCS + SHA-256 v1: PROPOSED, not approved.
- Authenticated issuer/capability and trusted time: NOT QUALIFIED.
- Hosted store and delivery service: NOT SELECTED / NOT QUALIFIED.
- Runtime changes, hosted provisioning, dispatch, deployment and merge: NOT AUTHORIZED by this proposal.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
