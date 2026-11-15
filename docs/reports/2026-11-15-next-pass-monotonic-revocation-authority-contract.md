# Monotonic revocation authority contract — 2026-11-15

Status: DESIGN / NOT IMPLEMENTED. This document defines the next bounded local-proof increment; it does not authorize hosted provisioning, provider calls, dispatch, deployment, merge or production qualification.

## 1. Finding and immutable scope

The current local A0→D1 proof verifies a root-signed registry bundle, persists verifier-issued snapshots, checks the active registry epoch/digest and issuer-key lifecycle in the admission batch, and records an immutable admission assertion. The route evidence also carries a `revocationVersion`.

The remaining gap is that the inspected admission path has no distinct durable revocation authority/watermark. Equality between the route's `revocationVersion` and a qualification row is not itself proof that no newer authoritative revocation exists. This is a qualification gap, not a demonstrated exploit.

Relevant proof heads:
- Clean D1 base PR #87: `8cc7b12948865bb0e13ce099386c09f3ae32b4f5`.
- Atomic admission/replay PR #92: `7014961587759b27d2ef6e91c60ce098d077ae83`.
- Verifier-issued persistence capability PR #93: `99ca50ce11efb380efa6346a1db672585876a8b1`.
- PRs remain OPEN / DRAFT / UNMERGED; none is production-qualified.

## 2. Required authority model

A revocation decision must be authored by a separately identified authority, not inferred from a route payload, issuer-supplied boolean, caller timestamp or mutable registry projection.

Each revocation subject is scoped by a stable tuple:
`authorityId + subjectType + subjectId`, where supported subject types must be explicitly allowlisted (at minimum route qualification and issuer key). Cross-subject or cross-authority substitution is denied.

Each accepted event must bind:
- schema version and authority ID;
- subject type and stable subject ID;
- strictly increasing per-subject sequence;
- event ID and event type (`REVOKE` or an explicitly authorized `REINSTATE`);
- effective time and expiry/validity boundary;
- previous event digest (or an explicit genesis marker);
- registry epoch/digest and issuer/key identity where relevant;
- authority signing-key ID and canonical event digest.

Canonical serialization must be versioned, fixed-order, exact-key, UTF-8 and covered by deterministic digest/signature test vectors. Unknown fields, duplicate IDs, ambiguous nulls, non-canonical encodings and unsupported event types fail closed.

## 3. Monotonic persistence and admission consistency

The local D1 design should use:
1. An append-only revocation event ledger.
2. A per-subject current-state pointer containing the latest accepted sequence and digest.
3. A compare-and-swap writer requiring the expected prior sequence/digest and exactly the next sequence.
4. Database guards preventing event update/delete, pointer regression, sequence gaps, duplicate sequence acceptance and pointer movement to a non-existent/mismatched event.
5. An admission assertion written as the first statement in the same D1 batch that consumes approval and creates the immutable task/attempt/outbox/receipt chain.

Admission must re-read, inside that same D1 batch, the current pointer and matching latest event for both the route subject and issuer-key subject. It must reject if:
- no authoritative state exists;
- the pointer/event is missing, malformed, expired, future-dated or signature-invalid;
- a subject is revoked at the admission time;
- route evidence was issued against an older sequence/digest;
- registry epoch, issuer key, route identity or account/quota binding differs;
- any writer update races the admission preflight;
- any assertion or later batch statement fails.

The assertion and all admission mutations must roll back together. Exact replay must verify the original assertion and receipt chain and must not silently accept a newer or substituted revocation state.

## 4. Rollback and recovery boundary

Append-only D1 rows and monotonic triggers protect against ordinary application-level mutation, but they cannot by themselves prove freshness after a full database restore to an older backup. The implementation must not claim protection from whole-database rollback until an independent anti-rollback anchor exists.

Before hosted qualification, define an externally retained signed checkpoint containing authority ID, latest global/partition epoch, event-log digest and checkpoint time. Recovery must compare the restored D1 state against that independently retained anchor and fail closed if the restored sequence is behind, forked or unverifiable. The anchor's custody, write authority, retention and recovery procedure require separate review.

No design may use key rotation, a second provider account, a new database or a region change to evade a revocation or quota decision.

## 5. Trusted time and key lifecycle

The API must not accept caller-controlled `now` as its only freshness authority. Define the authoritative clock source, permitted skew, monotonicity assumptions, clock failure behavior and evidence timestamps. If time is unavailable or outside the allowed skew, admission is denied.

Revocation signing keys need an independently pinned trust root, key IDs, validity windows, rotation overlap, explicit revocation, and a documented compromise/recovery process. A key marked revoked must not validate a later event merely because it appears in an older signed snapshot. Root-key custody is not established by the local proof.

## 6. Required adversarial qualification matrix

- stale route evidence after a newer revoke event;
- revocation inserted between preflight and D1 admission batch;
- stale expected sequence / stale expected digest;
- duplicate event ID and duplicate sequence;
- sequence gap, sequence regression and pointer rollback;
- wrong authority, wrong subject type, cross-route and cross-issuer replay;
- invalid signature, wrong key ID, retired/revoked key and key-rotation overlap;
- future-dated, expired and clock-skewed event;
- missing authority state, unavailable trust root and malformed canonical bytes;
- concurrent revoke/reinstate ordering and explicit reinstatement authorization;
- rollback after simulated partial batch failure;
- restored database behind the external checkpoint;
- exact replay after a later revocation, proving the original receipt is verified without reopening execution.

For every denial assert: approval remains ready, no admission/attempt/task delivery is committed, no outbox is newly authorized, and `dispatch:false`. For every accepted local proof assert the complete immutable assertion/receipt chain and the exact event digest/sequence.

## 7. Implementation sequence and gates

1. Approve the authority/subject/event semantics and trusted-time assumptions.
2. Reconcile migration ancestry on the clean D1 proof stack; do not transplant divergent PR stacks wholesale.
3. Add the additive schema, append-only/CAS guards and a pure canonical signature verifier.
4. Add a verifier-issued capability for revocation events; do not accept caller-supplied verified snapshots.
5. Add the same-batch route + issuer revocation assertion to A0 admission.
6. Add the full adversarial matrix and exact-head D1/contract CI.
7. Obtain independent security review, then qualify backup/restore anti-rollback and hosted D1 separately.
8. Keep `dispatch:false` and `POOL_DISPATCH_ENABLED` fail-closed throughout.

## 8. Current-turn orchestration record

- One owner-authored exact `/next` source event was created on MediaHub Issue #301: comment `6899808366`, https://github.com/VlDMlNSh/mediahub-os/issues/301#issuecomment-6899808366.
- The event was read back and confirmed as authored by `VlDMlNSh` with body exactly `/next`.
- The available GitHub connector does not expose a list-workflow-runs operation for the MediaHub controller. Controller run, three child run/job IDs and artifact digests are therefore NOT VERIFIED in this pass. No direct child dispatch was attempted.
- This MediaHub bridge is supplementary only; it is not Cloud Pool-native execution and does not qualify Contour A.

## 9. Disposition

- Revocation authority/watermark: DESIGN REQUIRED / NOT IMPLEMENTED.
- Same-batch revocation admission check: NOT IMPLEMENTED / NOT QUALIFIED.
- Hosted D1, independent anti-rollback anchor, trusted time and root-key custody: NOT QUALIFIED.
- Gemini event: source comment VERIFIED; controller/children NOT VERIFIED.
- Cloud Pool-native Gemini: NOT IMPLEMENTED / NOT QUALIFIED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
