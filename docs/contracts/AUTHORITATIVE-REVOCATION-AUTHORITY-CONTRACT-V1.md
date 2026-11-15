# Authoritative Revocation Authority Contract v1 — Wave 328

Date: 2026-11-15
Status: PROPOSED CONTRACT / GOVERNANCE GATE OPEN
Target documentation branch: `docs/gemini-three-agent-next-bridge-2026-11-15`
Immutable starting documentation commit: `c2069f231b2010e33bce0636262660fccf3e131f`
Scope: design contract only. No code, schema, runtime, secret, dispatch, deployment or merge changes.

## 1. Purpose and trust boundary

The existing route registry root is a distinct trust domain from the authority that revokes route qualifications and issuer keys. The existing registry verifier pins `ROUTE_REGISTRY_ROOT_KEY_ID` and `ROUTE_REGISTRY_ROOT_PUBLIC_JWK` from platform environment bindings; the root key is not accepted from the request or registry bundle. That model is a useful implementation precedent, but reusing the route-registry root for revocation would couple registry publication and revocation powers.

**Decision proposed for v1:** introduce an independent revocation authority root, pinned outside caller-controlled payloads through platform environment bindings:
- `POOL_REVOCATION_ROOT_KEY_ID`
- `POOL_REVOCATION_ROOT_PUBLIC_JWK`

The JWK is public verification material, not a private key or bearer credential. The corresponding private root key must remain offline / in owner-controlled signing custody and must never be placed in Worker bindings, D1, logs or artifacts. No key values are to be read or recorded during implementation.

The revocation root signs a versioned delegation keyset. Delegated event-signing keys have explicit roles:
- `route.revoke` — may sign REVOKE events only.
- `route.reinstate` — may sign REINSTATE events only.

A single delegated key MUST NOT receive both roles in v1. The verifier pins the authority root, verifies the keyset signature, validates key IDs/JWKs/roles/validity windows, then verifies each event against the delegated keyset. Caller-supplied keys, root IDs, role claims or trust snapshots never establish authority.

## 2. Signer lifecycle

The authority keyset is a canonical, root-signed object with:
- schema version, authority ID, strictly increasing keyset epoch, issued-at and valid-until;
- root key ID;
- sorted unique delegated signer records: signer key ID, public ES256 JWK, one role, valid-from, valid-until, status;
- optional supersession metadata binding the prior keyset digest.

Unknown fields, duplicate IDs, non-canonical ordering, private JWK members, invalid role combinations, expired/future keysets, stale epochs and invalid signatures fail closed.

Key rotation is append-only and epoch-monotonic. A keyset epoch and digest are permanently bound once accepted. A signer may be retired from future signing, but already accepted events remain verifiable against the historical keyset that was valid at event issuance. Emergency root rotation requires an out-of-band trust-anchor update plus an independently authenticated transition/checkpoint; silently replacing an environment JWK is not a qualified rotation procedure.

A keyset may not retroactively authorize an event signed outside that signer's validity interval. Event signing time must fall within signer validity and keyset validity. Compromised delegated keys are removed from the current keyset and a new epoch is accepted; events after the compromise cutoff are rejected. Earlier events remain subject to audit and explicit supersession/recovery policy.

## 3. Canonical subject identity

Events operate on one of two stable subject types:

1. `route_qualification`: subject identity is the immutable `qualification_id` from `pool_route_qualifications`.
2. `issuer_key`: subject identity is the exact composite tuple `issuer_id + key_id`, represented as separate canonical fields and separate SQL columns. Do not concatenate ambiguous strings or use provider/account display names as identity.

The full subject tuple is `authority_id + subject_type + subject_id` (with issuer ID and key ID as separate fields for issuer-key subjects). Route revocation denies only the bound qualification. Issuer-key revocation denies every qualification bound to that exact issuer/key pair. It must not revoke a different key, issuer, provider account or quota domain by string-prefix matching.

## 4. Event schema and canonical bytes

Each event has exactly these fields, in this fixed order:
`schemaVersion, authorityId, eventId, subjectType, subjectId, issuerId, keyId, sequence, previousEventDigest, action, signerKeyId, keysetEpoch, keysetDigest, issuedAt, effectiveAt`.

For `route_qualification`, `issuerId` and `keyId` are null and `subjectId` is the qualification ID. For `issuer_key`, `subjectId` is null and `issuerId` + `keyId` identify the subject. This avoids dual encodings of one subject.

Canonical bytes are UTF-8 JSON for a fixed-position array:
`["pool-route-revocation-event-v1", ...fieldValues]`.
All fields are mandatory by position; nullable values are explicit JSON null. Reject unknown/missing fields, duplicate object keys at parser boundary, unsafe integers, non-canonical base64url signatures and non-canonical JSON value types. Signature algorithm is ES256 / P-256 / SHA-256. Event digest is lowercase hex SHA-256 of canonical bytes; signature is detached base64url 64-byte P-256 signature.

Events are permanent; no event TTL or implicit expiry exists. `effectiveAt` is required and must be no earlier than the prior subject event's effectiveAt and no later than trusted database time plus the bounded skew allowance.

## 5. Transition and monotonic sequence rules

- First event for a subject is sequence 1 with `previousEventDigest = null`.
- Every subsequent event is exactly prior sequence + 1 and binds the exact prior event digest.
- No gaps, forks, duplicate sequence, duplicate event ID, cross-subject replay, digest substitution, stale CAS or sequence regression are accepted.
- REVOKE is valid only when the current subject state is not already revoked.
- REINSTATE is valid only when the current subject state is revoked and the event is signed by a key with the distinct `route.reinstate` role.
- REVOKE must be signed by `route.revoke`; REINSTATE must be signed by `route.reinstate`.
- A second REVOKE or a REINSTATE against an active subject is rejected; no-op transitions are not silently accepted.
- Concurrent updates use compare-and-swap on expected prior sequence + digest. Exactly one contender can advance a subject head.
- The immutable event row and subject-head advance are one D1 transaction/batch. Partial advancement must roll back.

The current head projection is a convenience index, not authority by itself: every accepted head must point to an immutable event whose digest, subject, sequence, signature, keyset and transition validate.

## 6. Trusted time

The existing evidence verifier accepts caller-provided `now`; this is not sufficient for authoritative revocation.

For v1, online admission and event acceptance MUST derive time inside the D1 consistency boundary using the database engine clock (for example SQLite `unixepoch()`), never from request fields, client timestamps or a caller-supplied `input.now`. The exact time value is materialized once per transaction and reused for all checks. Reject missing, non-positive, non-integer or implausibly skewed time. Enforce a bounded future-skew allowance (proposed maximum 30 seconds) for signed event timestamps. Evidence freshness and validity are compared against this database-derived time.

The database clock is an operational trust dependency, not a cryptographic timestamp authority. Clock synchronization/health must be monitored; if time health cannot be established, admission fails closed. This contract does not claim independently timestamped historical proof.

## 7. Same-batch admission invariant

The admission transaction must atomically:
- validate the current route registry snapshot pointer and issuer-key row;
- validate qualification freshness/expiry against database-derived time;
- read the current route-qualification revocation head;
- read the current issuer-key revocation head;
- prove each head references the expected immutable subject/event chain;
- deny if the latest event for either subject is REVOKE;
- consume owner approval and create task/attempt/receipt/outbox only if all trust assertions pass.

No admission assertion may rely on a previously cached revocation status or a worker-side preflight alone. A revocation that commits before admission's D1 serialization point must deny admission. A revocation racing after admission may not retroactively undo an already committed admission, but the execution/claim boundary must re-check revocation before any external work is ever enabled. Dispatch remains false in this proof.

A denial must leave approval ready and must not create admission, task, attempt, receipt or newly authorized outbox work. Exact replay returns the original receipt only; it does not reopen execution and must preserve the original decision semantics.

## 8. D1 schema shape (implementation target, not yet applied)

Additive migration 0015 should introduce:
- immutable authority keyset snapshots keyed by `(authority_id, keyset_epoch)`, unique keyset digest, exact canonical payload/signature and validity;
- immutable revocation event rows with globally unique event ID and unique `(authority_id, subject_type, subject_id, sequence)`;
- one subject-head row keyed by the stable subject tuple, containing current sequence and event digest;
- foreign-key bindings from event to accepted keyset epoch/digest;
- triggers preventing event/keyset UPDATE and DELETE;
- guarded head insert/update enforcing strict +1 sequence, prior digest CAS, matching immutable event and monotonic update time;
- no caller-controlled boolean such as `verified: true` as proof of verification.

The application verifier must issue a module-private WeakMap-backed capability, following the existing verified-registry persistence boundary. Persistence accepts only the exact verifier-issued object; copied/spread objects and caller-constructed lookalikes fail closed. The event insert and head CAS must be executed as one D1 batch.

## 9. Whole-database rollback / restore

Append-only D1 tables do not prevent restoration of an old complete database image. A separately stored, signed anti-rollback checkpoint must bind the highest accepted authority keyset epoch and digest plus per-subject high-water marks (or a Merkle root over them). The checkpoint trust anchor and storage location must be independent of the D1 restore domain. Restoring D1 behind the last externally observed checkpoint must block all admission until a verified forward reconciliation is completed.

This external checkpoint mechanism is NOT IMPLEMENTED and is a separate acceptance gate. Do not claim D1 append-only triggers solve whole-database rollback.

## 10. Required adversarial qualification tests

Positive:
- genesis REVOKE, sequential REINSTATE, then a later REVOKE;
- separate route and issuer-key subjects;
- separate signer roles and valid key rotation overlap;
- exact event replay returns the same accepted result without advancing the head;
- concurrent independent subjects progress independently.

Negative:
- unpinned/substituted authority root, wrong keyset signature, stale/future keyset;
- private JWK material, unknown fields, duplicate keys/IDs, unsorted records;
- wrong signer role, expired/not-yet-valid/retired signer, revoked signer;
- duplicate event ID/sequence, sequence gap/regression, wrong previous digest, stale CAS, fork;
- subject substitution, route/issuer cross-subject replay, malformed tuple;
- bad signature/digest, non-canonical base64url, unsafe timestamps;
- future effectiveAt, decreasing effectiveAt, unavailable/unhealthy DB time;
- REVOKE after prior REVOKE, REINSTATE without prior REVOKE;
- concurrent REVOKE/admission and two competing events;
- partial batch rollback and exact replay after revocation;
- missing/stale anti-rollback checkpoint and restore behind external high-water mark.

Every denial asserts: `dispatch:false`, approval remains ready, and no admission/task/attempt/receipt/new outbox mutation.

## 11. Open governance gates before implementation

This is a proposed contract, not an assertion that authority has been provisioned. Before live event signing or production use, record:
1. owner-approved custody and recovery procedure for the independent revocation root;
2. who is authorized to operate `route.revoke` and `route.reinstate` delegated signers;
3. independent review of root rotation and emergency compromise procedure;
4. trusted D1 clock health/monitoring policy;
5. independent anti-rollback checkpoint store and trust anchor.

No secret values are requested or read. No dispatch, provider calls, hosted D1 provisioning or paid fallback are authorized by this document.

## 12. Implementation sequence

1. Freeze this canonical event/keyset contract and resolve governance gates.
2. Implement pure keyset/event canonicalizers and ES256 verifier with deterministic vectors.
3. Implement verifier-issued persistence capability.
4. Add migration 0015 with immutable keyset/event ledger and CAS subject heads.
5. Add same-batch route + issuer revocation assertion to admission migration 0016.
6. Run all positive/adversarial D1 Workers-runtime tests, exact-head CI and independent review.
7. Implement external anti-rollback checkpoint before claiming restore safety.
8. Keep `dispatch:false` until the entire Contour A acceptance chain is independently qualified.

## Existing source evidence

- Existing root-signed registry verifier pins `ROUTE_REGISTRY_ROOT_KEY_ID` and `ROUTE_REGISTRY_ROOT_PUBLIC_JWK` from platform environment bindings; request/bundle cannot supply the root key. Source blob on clean candidate: `12f1b09b238d61fa7cf3574221f3cb79f6d4767a`.
- Existing evidence canonicalization uses fixed-position UTF-8 JSON array, exact fields and ES256. Source blob: `0d5b97ad0bc59173fe8c4c7de28c67965bd09ad0`.
- Existing route registry snapshot schema is append-only and enforces monotonically increasing registry epochs. Migration 0012 blob: `485d8c2d2327a64c8d86ddc004134113d6ae3d80`.
- Existing admission migration 0014 checks active registry snapshot and issuer key but does not consult a distinct revocation event ledger/head. Blob: `cb8a47d83faba62981daa8f7320da87baa2c55e2`.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
