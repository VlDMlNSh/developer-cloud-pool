# Event Digest v2 — backward-compatible D1 identity design — 2026-11-12

## Status

SOURCE SCHEMA RECONCILIATION VERIFIED / DESIGN PROPOSAL ONLY / NOT ACCEPTED / NOT IMPLEMENTED / NO MIGRATION APPLIED.

This is a source-only design decision record for PR #67. It does not authorize code/schema changes, hosted D1, live GitHub writes, dispatch, deployment, or merge. Independent technical/security/governance review remains deferred until actual Cloud Pool launch by owner direction.

## Immutable targets and source evidence

- Implementation PR #67: `impl/receipt-bound-projection-2026-11-11@f8280ba5a78ffcf1c18bf33f0dc8932ebb36a81d`.
- Default base: `Основной@221f216c00ca7e5596bcc682ba185ad155a10603`.
- PR #67 is OPEN / DRAFT / UNMERGED, 20 ahead / 0 behind; exact-head local D1 run 43162128594 and Pool Contract Validation run 43162128615 are SUCCESS. Combined status contexts 0; formal reviews 0; review threads 0.
- Migration 0004 blob `0ad590ffdd2589f857257739275c15ed2d54d729`.
- Migration 0006 blob `660fa9de99ed78fe083bb627d6a61dbf0bd65c25`.
- Migration 0007 blob `767d95a30fa0a14c79e88c8c58392bfec9cdddc2`.
- Migration 0008 blob `1d9385dd371f3404c52ec15fce03b0a14d384ab1`.
- Migration 0009 blob `86919425f498dc634329bb783a3ca6ae7a0ff6a1`.
- Migration 0010 blob `30ac9d0ed0cbede9586c365578c606b47bcce1a7`.
- Finalizer source blob `6cb028e048569700ed623d93462ef55e2392a084`.
- Projection envelope source blob `cb1fb8b130c66343ca3b1c071aac506113c4cfb0`.
- D1 package uses Node 24 for local tests, Workers Vitest/Miniflare and compatibility date 2026-10-26. No JCS dependency currently exists.

## 1. Confirmed schema constraints

1. Migration 0004 creates stable event ID `attempt-finalized:<attempt_id>`, with `pool_attempt_events.event_id` as primary key. It creates the terminal event from a trigger using `COALESCE(result_digest, provenance_digest, input_digest)`; since the finalizer requires result and provenance SHA-256 values, the effective v1 digest is result-only.
2. Migration 0006 uses the event ID as `pool_attempt_projection_outbox.outbox_id`, copies the event digest to outbox `event_digest`, and enforces one outbox row per attempt.
3. Migration 0009 makes the outbox identity tuple immutable, including outbox ID, task/attempt IDs, repository/issue/target/profile, lease generation, terminal status and event digest.
4. Migration 0010 enforces monotonic comment state `not_attempted → indeterminate → verified`; it prohibits returning to `not_attempted` and requires verified comment state before delivered ACK.
5. Event and projection event tables are append-only. Existing v1 event IDs, digest bytes, outbox identities and GitHub marker receipts must remain historical facts.
6. The current finalizer's replay branch verifies result/provenance fields separately but compares the stored event digest to the result digest only. It does not prove provenance was included in v1.

## 2. Proposed version model

Use a separate integer `event_digest_version` with supported values 1 and 2. Do not overload or reinterpret `event_digest`.

- Existing rows are version 1. Migration adds version columns with a default of 1; no v1 digest is recomputed.
- New terminal events are version 2 only after explicit governance acceptance and exact-head proof. Version 2 is not enabled by this proposal.
- Preserve the stable event ID format `attempt-finalized:<attempt_id>`. Each attempt has exactly one terminal event; no second version of the same event is emitted. Version distinguishes digest semantics, not a second event.
- Define event identity as the tuple `(event_id, event_digest_version, event_digest)`. Outbox, projection envelope, marker receipt, Recovery Actor grant and audit record must bind this same tuple.
- For v1, preserve the existing marker representation byte-for-byte. For v2, marker metadata must expose the version or be unambiguously domain-separated by the v2 digest; this must be decided and tested before writer activation. Never edit existing GitHub comments to retrofit a version.
- A v1 event can be read and verified only under v1 semantics. It must never be reported as provenance-bound. A v2 reader must not silently upgrade v1.

## 3. Proposed v2 canonical payload

Use RFC 8785 JSON Canonicalization Scheme (JCS) over a fixed, closed, validated object, then SHA-256 over UTF-8 bytes with an explicit domain separator. Proposed domain prefix: `mediahub.pool.attempt-finalized.v2\n`.

The v2 object should include only immutable, source-backed terminal facts:

- `event_schema_version`: integer 2
- `event_id`: unchanged stable event ID
- `event_type`: `attempt.finalized`
- `task_key`
- `attempt_id`
- `attempt_number`
- `repository_id`
- `issue_number`
- `target_sha`
- `profile`
- `terminal_status`
- `terminal_reason`
- `execution_lease_holder_id`: actual fenced lease owner recorded at finalization; nullable only if schema permits and evidence says unavailable
- `lease_generation`
- `result_digest`
- `provenance_digest`
- `completed_at`: recorded completion timestamp, explicitly not proof of trusted time

Do not include mutable delivery state, retry count, delivery lease owner/generation, comment-post state, ACK time, mutable GitHub state, secrets, raw result bytes or provider credentials. Do not include an authenticated finalizer principal until an accepted issuer/runtime contract actually authenticates it. Do not infer one from the worker ID.

Canonicalization requirements:
- RFC 8785 JCS, I-JSON-compatible values, deterministic UTF-8 encoding.
- Reject undefined, non-finite numbers, invalid Unicode/lone surrogates, duplicate-key raw input, unsupported value types and unknown schema fields.
- Fixed field allowlist and explicit null semantics; no optional-field omission ambiguity.
- Numeric values must be safe integers with schema bounds; identifiers/digests are validated before canonicalization.
- SHA-256 lower-case hex output; domain separator and version are part of the hashed bytes.
- A digest provides integrity binding only; it is not a signature, issuer proof, trusted-time proof or authorization.

### Reusable implementation candidate

RFC 8785 is the normative algorithm. Its Appendix G identifies JavaScript `canonicalize` as an implementation. The source repo `erdtman/canonicalize` is a small, dependency-free ESM package; the fetched package metadata currently reports version 5.1.0 and Node >=22. The independent comparison repo `erdtman/json-canonicalisation-comparison` provides reproducible RFC vectors, 10,000 number vectors and edge-case testing; its current published table reports canonicalize 5.0.0, so it is not sufficient by itself to qualify 5.1.0. The canonicalization project `cyberphone/json-canonicalization` supplies the official reference vectors.

Candidate disposition: reuse `canonicalize` only after pinning an exact release, verifying package provenance/license, checking Workers/workerd compatibility under the project's exact compatibility date, and running the complete official vector suite plus project-specific adversarial tests. Do not write a bespoke canonicalizer. No dependency was added and no component is adopted yet.

## 4. Proposed migration shape — NOT IMPLEMENTED

A future migration 0011 should be drafted only after contract acceptance. The expected logical changes are:

1. Add `event_digest_version INTEGER NOT NULL DEFAULT 1 CHECK (event_digest_version IN (1,2))` to `pool_attempt_events` and `pool_attempt_projection_outbox`. Existing rows remain v1.
2. Add a nullable v2 terminal digest field to `pool_attempts` (or an equivalent tightly scoped immutable terminal-event staging field) so the application can compute the canonical digest before the existing trigger inserts the event. The trigger must copy the exact version/digest into event and outbox in the same D1 transaction.
3. Replace the terminal projection trigger only after v2 writer is gated. For v1 rows, retain the existing event construction semantics. For v2 rows, require a valid precomputed digest and version 2; no fallback to result-only digest.
4. Add a database guard making terminal result digest, provenance digest, terminal reason, completed timestamp and v2 digest immutable once terminal. Existing migration 0004 does not currently establish all these field-level immutability checks.
5. Extend the immutable outbox identity trigger to include `event_digest_version`; extend envelope validation to carry and validate version.
6. Keep the outbox primary key and one-row-per-attempt constraint unchanged. Do not add a second outbox row or requeue an old v1 event.
7. Preserve existing `comment_post_state` and its one-POST semantics exactly. Migration must not reset comment state or cause any projection POST.
8. No data backfill may recompute or replace v1 digests. Version columns are marked 1 for all existing rows. Any v2 staging field for old terminal attempts remains NULL.
9. Rollback is forward-compatible only: disable v2 writer and continue reading v1/v2 rows. Do not roll back by dropping columns, rewriting event/outbox identity, downgrading version markers, or deleting v2 events. A binary rollback to a v1-only reader must be blocked if v2 rows exist.

Important transaction boundary: application code computes v2 digest from a validated source snapshot, but the D1 finalization CAS must bind the digest to the same immutable attempt/task identity and fenced lease generation. The terminal event/outbox trigger then copies that digest atomically. Replay must recompute/compare against the persisted terminal record and exact version; it must never accept a result-only digest for a v2 row.

## 5. Dual-read and rollout sequence

1. Reader-only release: understand v1 and v2 tuple formats, but continue emitting v1 only.
2. Migration 0011 with version defaults/backfill-to-v1 and immutability constraints; verify populated fixtures and unchanged v1 bytes.
3. Dual-read exact tuple: v1 follows historical semantics; v2 follows JCS/domain-separated semantics. Unknown versions DENY.
4. Add v2 canonicalization and digest tests, but keep writer feature-disabled.
5. Verify projection envelope, GitHub marker, ACK and Recovery Actor grant all preserve exact event ID/version/digest.
6. Enable v2 writer only after accepted contracts, local proof, exact-head CI and governance gates. No hosted rollout in this proposal.
7. Rollback means disabling v2 creation while retaining dual-read and all v2 rows. Any reader downgrade requires a proof that no v2 row exists; otherwise block rollback.

## 6. Required acceptance tests

- Existing v1 populated fixtures retain exact event IDs, digest bytes, outbox IDs, marker strings and comment state.
- Migration 0011 applied twice is rejected/handled according to the migration runner's explicit one-time semantics; partial migration failure rolls back atomically.
- New v2 finalization with fixed inputs yields a deterministic digest across Node 24 and workerd.
- Changing only provenance digest changes v2 digest.
- Changing any immutable field (including worker, generation, task/repo/issue/target/profile/status/reason/completion) changes v2 digest.
- Changing mutable delivery state/retry count/comment state/ACK time does not change v2 digest.
- JCS official vectors, 10,000 number vectors, Unicode ordering, lone surrogate rejection, duplicate-key handling, NaN/Infinity rejection and UTF-8 byte encoding pass.
- Unknown version, unknown field, missing field, null/omission mismatch, malformed SHA-256, unsafe integer, invalid identifier and noncanonical serialization DENY.
- Exact replay of a v2 event returns the same tuple; conflicting replay with same event ID but any different immutable field DENY.
- A v1 event is never silently upgraded or described as provenance-bound.
- Concurrent finalizers cannot create two event/outbox identities; trigger atomicity preserved.
- Recovery grant for v2 must bind event ID + version + digest; v1 grant must bind exact v1 tuple.
- No migration or test path performs a GitHub POST, dispatch, provider call, hosted D1 operation or secret read.

## 7. Unresolved decisions and blockers

- Accept the event field set, stable event ID rule and JCS/domain-separation scheme.
- Decide exact v2 marker representation while preserving existing v1 marker strings.
- Accept whether `completed_at` is included as a recorded (untrusted) timestamp; it must not be conflated with issuer trusted time.
- App/runtime authority for computing the digest and the exact D1 transaction/CAS contract remain to be specified.
- Confirm package `canonicalize@5.1.0` provenance, license, runtime compatibility and official-vector compliance at the exact pinned artifact.
- Named issuer, key custodian, subject/revocation registry, trusted-time operator, audit sink/operator and privacy/retention approver remain unresolved.
- PR #60 exact-head CI NOT VERIFIED; PR #67 local CI is successful but is not hosted qualification.

## 8. Disposition

- Source migration reconciliation: VERIFIED.
- Stable v1 event/outbox identity: PRESERVE.
- Event v2 schema and canonicalization: PROPOSAL ONLY / NOT ACCEPTED.
- JCS standard: RECOMMENDED; implementation package candidate NOT QUALIFIED.
- Migration 0011: PLANNED / NOT CREATED.
- Runtime writer/reader changes: NOT IMPLEMENTED.
- Hosted D1: NOT RUN.
- Live GitHub writes/dispatch/deployment: NOT RUN.
- Recovery Actor: NOT IMPLEMENTED / NOT QUALIFIED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next bounded step

Prepare a schema-only migration 0011 review packet and exact v1 fixture inventory, without committing SQL or code. First confirm the current local D1 fixture/test bootstrap can snapshot all v1 event/outbox/comment rows and prove byte-for-byte identity after applying a candidate migration in a disposable in-memory test. Then request governance acceptance of the v2 field set and rollback policy before implementation.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
