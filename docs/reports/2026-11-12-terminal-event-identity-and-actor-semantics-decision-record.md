# Terminal event identity and actor semantics — source decision record — 2026-11-12

## Status

SOURCE AUDIT VERIFIED / DESIGN OPTIONS PROPOSED / NO NORMATIVE AUTHORITY DECISION / NOT IMPLEMENTED.

This is an author-side source reconciliation. It does not authorize schema changes, runtime behavior, hosted D1, live GitHub writes, dispatch, deployment, or a Recovery Actor expansion. Independent review remains deferred until the Cloud Pool is actually launched, by owner direction.

## Immutable source targets

- Current implementation candidate: PR #67, branch `impl/receipt-bound-projection-2026-11-11`, head `f8280ba5a78ffcf1c18bf33f0dc8932ebb36a81d`.
- Base: `Основной@221f216c00ca7e5596bcc682ba185ad155a10603`.
- PR #67 is OPEN / DRAFT / UNMERGED; 20 commits ahead / 0 behind.
- Source: `proofs/d1-ledger/src/task-attempts.mjs`, blob `6cb028e048569700ed623d93462ef55e2392a084`.
- Source: `proofs/d1-ledger/migrations/0006_create_attempt_projection_outbox.sql`, blob `660fa9de99ed78fe083bb627d6a61dbf0bd65c25`.
- Source: `proofs/d1-ledger/src/projection-envelope.mjs`, blob `cb1fb8b130c66343ca3b1c071aac506113c4cfb0`.
- Source: `proofs/d1-ledger/src/projection-delivery.mjs`, blob `b09e9248323a57fff5e1c426eae012e2bb7aa3f0`.
- Source audit: [finalization provenance and fifth-lease recovery audit](2026-11-12-projection-finalization-provenance-and-fifth-lease-recovery-audit.md).
- Current delivery integration contract: [Attempt Outbox → GitHub Projection Integration Contract](../contracts/ATTEMPT-OUTBOX-GITHUB-PROJECTION-INTEGRATION-CONTRACT.md).

## Confirmed source behavior

1. `finalizeTaskAttempt` accepts and stores both `resultDigest` and `provenanceDigest` in `pool_attempts`.
2. The attempt-finalized event is trigger-created. In the current schema path its `actor_id` is sourced from the fenced execution lease owner; the event does not establish an authenticated human/service principal or issuer subject.
3. The event digest supplied by the finalizer is currently `resultDigest || provenanceDigest`. Since both are required valid SHA-256 strings, this selects only `resultDigest`; provenance is stored separately but is not bound into the event/outbox digest.
4. The outbox trigger copies `NEW.event_digest` into `pool_attempt_projection_outbox.event_digest`. The projection envelope then maps that value to `payloadDigest`; the GitHub marker and ACK therefore bind the current result-only digest.
5. The replay branch in `finalizeTaskAttempt` checks exact result/provenance/reason/status/completion/generation and also checks event actor/generation/digest. It does not repair the missing provenance binding.
6. The current fifth-lease dead-letter helper is fenced to the original worker/generation. It cannot independently reap an orphaned worker. This is a distinct authority problem and must not be solved by changing actor/digest semantics implicitly.

## Invariants that must remain separate

- **Execution lease holder:** technical worker identity that held the valid fenced lease.
- **Request initiator:** principal that originally submitted or approved the task, if available and evidenced.
- **Authenticated finalization principal:** identity cryptographically authenticated by a qualified runtime/issuer at finalization time, if such an identity exists.
- **Recovery actor:** a separately authorized actor for the one narrow `dead_letter_expired_projection` operation. It is not the execution lease holder by default.
- **Result digest:** digest of the produced result bytes/manifest.
- **Provenance digest:** digest of the provenance record/manifest.
- **Terminal event digest:** digest of a versioned canonical serialization that binds the immutable terminal event identity and its evidence references.

Do not overload one `actor_id` or one digest field to mean several of these concepts.

## Proposed versioned event design (NOT ACCEPTED)

A future schema version may define a canonical terminal-event record with explicit fields, at minimum:

- `event_schema_version`
- stable `event_id` (preserve existing v1 event IDs; do not regenerate them)
- `task_key`, `attempt_id`, `attempt_number`
- terminal status and bounded terminal reason
- repository ID, issue number, target SHA, profile
- attempt lease generation and execution lease-holder identity
- result digest and provenance digest as separate fields
- completion timestamp from a separately qualified trusted-time source
- authenticated finalization principal and issuer/key reference only if independently authenticated; otherwise explicit NULL/UNAVAILABLE, never infer from worker ID
- canonicalization algorithm/version and digest algorithm identifier

The v2 event digest should be computed over a deterministic, documented canonical encoding of all immutable fields above, including both result and provenance digests. The canonicalization must define field ordering, UTF-8 normalization, integer representation, null handling, and domain separation. The digest must not include mutable delivery lease state, retry counters, GitHub projection state, or secrets. A hash is integrity binding, not proof of signer identity; signatures and issuer trust require a separate accepted authority contract.

Compatibility constraints:
- Preserve v1 event IDs and existing v1 digests as immutable historical facts.
- Do not silently rewrite/backfill old event digests or pretend old rows bind provenance.
- Introduce an explicit schema/digest version and dual-read behavior before any v2 writer is enabled.
- Keep the GitHub marker's event ID and digest deterministic and version-aware.
- Define exact replay as byte-identical canonical terminal event for the same event ID; conflicting replay must DENY.
- Migration and rollback behavior must be tested against populated v1 fixtures, not only empty databases.

## Proposed actor model (NOT ACCEPTED)

- Retain `execution_lease_holder_id` as the factual worker identity that performed finalization under the fenced lease.
- Add `authenticated_finalizer_principal_id` and `issuer_key_id` only after an accepted issuer/authentication contract and trusted runtime identity exist. Until then, do not populate them from the worker ID.
- Preserve request initiator separately if source evidence exists; never derive it from finalizer identity.
- For a future Recovery Actor, append `recovery_actor_principal_id`, capability/grant ID, issuer/key ID, exact target identity, and consumed nonce evidence in a distinct recovery event. Preserve the expired lease owner/generation as separate fields.
- No shared A0 audience/grant may be reused. Recovery scope remains exactly one expired/exhausted projection outbox row and operation `dead_letter_expired_projection`.

## Required acceptance tests before implementation

1. Changing only `provenanceDigest` changes the v2 terminal event digest.
2. Changing any immutable identity field changes the digest; changing mutable delivery state does not.
3. Canonical serialization is deterministic across process/runtime instances and rejects malformed/non-canonical input.
4. v1 fixtures remain readable with their original event IDs/digests and are never silently rewritten.
5. Exact v1/v2 replay is idempotent; conflicting event-ID replay is rejected.
6. Worker ID is recorded only as execution lease holder; absent authenticated principal remains absent.
7. A fabricated principal/issuer field, mismatched issuer key, revoked principal, invalid signature, or untrusted time is denied once an issuer contract exists.
8. Recovery event distinguishes expired lease owner from recovery principal and consumes the exact one-use capability atomically with the narrow state transition.
9. Recovery cannot mutate task/attempt rows, retry/resume attempts, requeue, write GitHub, dispatch, or alter comment-post state.
10. Outbox and GitHub marker bind the same versioned event ID/digest; ACK requires exact read-back and the current delivery generation.

## Decisions required from governance owners

No accepted owner/authority inventory currently establishes the issuer operator, key custodian, principal/revocation registry owner, trusted-time operator, private audit sink/operator, or privacy/retention approver. Therefore the proposed fields and algorithms are a design basis only. Before implementation, owners must explicitly accept:
- actor vocabulary and the authority that authenticates each actor class;
- canonical terminal-event field set, canonicalization and digest versioning;
- v1 compatibility and migration/rollback policy;
- trusted-time source and its failure semantics;
- issuer/key lifecycle, revocation, nonce consumption and audit retention;
- exact recovery authority and operational ownership.

## Disposition

- Current v1 result-only event digest: SOURCE VERIFIED.
- Separate result/provenance storage: SOURCE VERIFIED.
- Authenticated finalizer principal: NOT ESTABLISHED / NOT QUALIFIED.
- Versioned canonical terminal-event digest: PROPOSAL ONLY.
- Independent fifth-lease Recovery Actor: NOT IMPLEMENTED / NOT QUALIFIED.
- Hosted D1 and live GitHub projection: NOT QUALIFIED / NOT RUN.
- Dispatch: FAIL-CLOSED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next bounded step

Resolve the missing normative authority decisions without changing runtime: reconcile this proposal against the corrected Recovery Actor contract and issuer/trusted-time contract, and record explicit acceptance or unresolved owner assignments. After owner acceptance, add a separate local-only migration/test plan; do not implement until the governance and trusted-time prerequisites are evidenced.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
