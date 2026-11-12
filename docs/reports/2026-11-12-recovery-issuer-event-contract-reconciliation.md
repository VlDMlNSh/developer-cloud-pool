# Recovery Actor × issuer/time × terminal-event contract reconciliation — 2026-11-12

## Status

SOURCE CROSSWALK VERIFIED / COMPATIBLE ONLY WITH EXPLICIT VERSIONING AND IDENTITY SEPARATION / OWNER DECISIONS UNRESOLVED / NO RUNTIME CHANGE / NOT QUALIFIED.

This pass reconciles the corrected narrow Recovery Actor Capability v1 design, the PR #60 issuer/trusted-time interface, the terminal-event identity proposal, and the PR #67 projection integration contract. It does not authorize code, schema, issuer, hosted D1, live GitHub writes, dispatch, deployment, or independent review before pool launch.

## Immutable source refs

- PR #67 implementation: `impl/receipt-bound-projection-2026-11-11@f8280ba5a78ffcf1c18bf33f0dc8932ebb36a81d`.
- PR #67 integration contract: `docs/contracts/ATTEMPT-OUTBOX-GITHUB-PROJECTION-INTEGRATION-CONTRACT.md`, blob `e9bca72fd93709638a14e30210154c5c04759a11`.
- Corrected Recovery Actor contract: `docs/contracts/2026-11-11-recovery-actor-capability-v1-design-contract.md`, blob `9b663ca9ab8fe639b83a26dd5296b3409fd90334`.
- PR #60 issuer/time contract: `docs/contracts/PROJECTION-RECOVERY-GRANT-ISSUER-AND-TRUSTED-TIME-CONTRACT.md`, blob `674e2a601acdc972e1e96f15776d45fa51ae6842`, on PR #60 head `134fe6fe739a09b181fee88463ac848a6b059206`.
- PR #60 parent ADR: `docs/decisions/2026-11-11-projection-recovery-actor-capability-contract.md`, blob `59a4be21516da0e005114acfe015aee7787524dc`.
- Terminal-event decision record: `docs/reports/2026-11-12-terminal-event-identity-and-actor-semantics-decision-record.md`, blob `d902a08f803b45bf4df4f27eefed686fa1cf051d`.
- Source audit: `docs/reports/2026-11-12-projection-finalization-provenance-and-fifth-lease-recovery-audit.md`, blob `b6c3d5d18bf5ba7a549d1782f84e86e9613d532d`.
- Operator resolution proposal: `docs/contracts/PROJECTION-COMMENT-INDETERMINATE-OPERATOR-RESOLUTION-PROPOSAL.md`, blob `0342f6246c689ea0610b810e0646a9b2d066f98b`.

## 1. Reconciliation result

The documents are not contradictory in their intended boundaries, but they are not yet an accepted, implementable normative stack. The terminal-event proposal must be treated as a prerequisite identity/digest versioning decision; the Recovery Actor grant must bind whichever immutable event-digest version is present on the exact outbox row. The issuer/time contract supplies a proposed trust boundary, not an operating issuer, clock or owner appointment.

### Identity semantics — keep four roles distinct

| Identity | Evidence/meaning | Must not be represented as |
|---|---|---|
| Request initiator | Original submitter/approver, only if source evidence exists | Worker or Recovery Actor |
| Execution lease holder | Fenced worker identity recorded by current `attempt.finalized.actor_id` | Authenticated issuer subject |
| Authenticated finalizer principal | Principal authenticated by a qualified issuer/runtime at finalization | Inferred worker ID or caller-supplied actor string |
| Recovery Actor | Separately admitted subject whose one-use grant authorizes only `dead_letter_expired_projection` on one exact outbox row | Expired lease owner, delivery worker, task resolver, or GitHub writer |

Current local proof establishes only execution lease-holder provenance for `attempt.finalized.actor_id`. It does not establish request initiator or authenticated finalizer principal. Recovery Actor attribution belongs to a distinct recovery/dead-letter event and must preserve the expired lease owner separately. Never overwrite historical worker attribution to make the Recovery Actor appear to have performed the original finalization.

### Digest semantics — version the event identity before Recovery Actor use

- Current v1 SQL uses `COALESCE(result_digest, provenance_digest, input_digest)`; with result and provenance required, the event/outbox digest is result-only.
- The integration contract maps immutable outbox `event_digest` to projection `payloadDigest`; migration 0009 prevents changing it after insertion.
- The Recovery Actor grant binds the exact immutable event digest. Therefore a v2 event digest is a new immutable identity version, not a mutable reinterpretation of a v1 row.
- A v2 canonical terminal-event digest may bind both result and provenance digests and immutable terminal identity. It must include an explicit version/domain marker and deterministic canonicalization. Hashing alone does not authenticate an issuer.
- Preserve all existing v1 event IDs and v1 digest bytes. Do not rewrite historical rows, markers, or grant evidence. New v2 rows must carry an explicit schema/digest version and be dual-read compatible before v2 writer activation.
- Define whether the stable event ID remains the existing ID across digest versions or whether a new event version gets a deterministic versioned ID. This decision must be explicit and replay-safe; no silent regeneration or collision-prone ad hoc concatenation.
- The projection marker, outbox, Recovery Actor grant and audit receipt must all refer to the same exact event ID + digest + version.

### Recovery Actor authority — narrow operation remains unchanged

The corrected Capability v1 is the controlling scope boundary:
- audience exactly `projection-outbox-recovery`;
- operation exactly `dead_letter_expired_projection`;
- exact repository ID, outbox ID, attempt ID, delivery generation, immutable event digest and configured exhaustion ceiling;
- one admitted Recovery Actor subject and identity generation;
- one-use grant ID/nonce, policy/authority epoch and issuer/key identity;
- atomic nonce consumption + terminalize only that outbox row + append immutable recovery event;
- exact read-back before reporting success.

It cannot retry/resume task attempts, mutate task/attempt rows, create attempts, requeue, dispatch, write GitHub, alter comment state, or scan/batch/wildcard resources. It must not use the expired worker's ID to satisfy the current same-owner helper. The current helper remains a same-owner expiry finalizer, not independent recovery.

The grant's event-digest claim must match the exact immutable outbox digest version. It does not independently define or repair that digest's semantics.

### Issuer and trusted time — requirements, not operational evidence

PR #60 contract correctly separates `RecoveryGrantVerifier` and `TrustedTimeSource` at the trusted composition root. Storage must not accept caller-selected issuer/key, raw actor ID, decoded-but-unverified claims, arbitrary `now`, or a forged `verified:true` object. It also requires current issuer/key/policy/revocation state and one-use nonce enforcement.

The proposed lifetime ceiling (300 seconds) and revocation-state age ceiling (30 seconds) are Wave 486/487 target defaults only, not accepted or deployed policy. Preferred D1 database time is conditional on pinned local and hosted D1 semantics being demonstrated for expiry, grant validity and nonce consumption in the same atomic transition. Caller-supplied time is test-only. Failure, stale revocation, untrusted time, ambiguous commit, failed read-back or required audit failure must fail closed / remain NOT VERIFIED.

### At-most-once comment state — independent safety boundary

The projection integration contract and operator-resolution proposal preserve the monotonic comment state:
`not_attempted → indeterminate → verified`.
Once indeterminate, no Recovery Actor or operator may reset the state or authorize another POST. The Recovery Actor operation only dead-letters an exhausted expired outbox row and has no GitHub write permission. Operator resolution of an indeterminate comment is a separate proposed capability and must not be folded into Recovery Actor.

## 2. Required decisions before any implementation

1. **Event schema/version:** exact v1/v2 field set, canonicalization, digest algorithm/domain, stable event-ID strategy, null semantics and cross-runtime determinism.
2. **Migration/compatibility:** dual-read rules, v1 fixture retention, rollback policy, and behavior when v1 and v2 outbox rows coexist.
3. **Actor vocabulary:** authoritative meaning of each actor field and which authenticated system, if any, establishes finalizer principal. Until established, authenticated finalizer remains NULL/UNAVAILABLE rather than inferred.
4. **Recovery attribution:** explicit fields for expired lease owner vs Recovery Actor subject, issuer/key ID, grant ID/digest, policy/revocation generation, trusted timestamp and transition receipt.
5. **Issuer authority:** named accountable issuer operator, issuance principal authentication, trust-anchor/key custodian, key rotation/revocation/compromise process, subject registry/lifecycle and revocation publisher.
6. **Trusted time:** named operator/source, D1 database-time qualification or alternative trusted clock, skew/freshness/monotonicity bounds and failure semantics.
7. **Audit/privacy:** named private audit sink/operator, atomicity and integrity, access control, backup/restore/outage behavior, retention/deletion/legal-hold approval and data classification.
8. **Operational model:** free-tier/hosting availability and durability evidence, activation/quorum procedure, and independent reviewer after Cloud Pool launch.
9. **Projection label registry:** complete source-backed managed-label ownership before live GitHub qualification; unrelated labels remain untouched.
10. **Indeterminate comment disposition:** accept or reject the separate operator-resolution proposal; it cannot authorize another POST.

No named operational appointments are established by the inspected project refs. Wave 486/487 assigns functional accountability to Security Audit and Privacy/Data Governance but does not evidence named operators, deployed services, or accepted production policy. Do not invent appointments or imply that the PR #60 draft is accepted.

## 3. Required verification sequence after governance acceptance

1. Freeze immutable target SHA and accepted versions of the event, issuer, time, Recovery Actor and audit contracts.
2. Add v1/v2 canonicalization and fixture tests first; prove v1 historical IDs/digests are unchanged.
3. Prove a provenance-only change changes v2 digest; immutable identity changes alter digest; mutable lease/retry state does not.
4. Prove marker/outbox/grant/audit all bind the exact same event ID + digest + version.
5. Prove verifier rejects forged objects, unknown/duplicate claims, wrong subject/audience/operation/resource, key/policy/revocation mismatch, stale revocation and replay.
6. Prove trusted time is authoritative for lease and grant boundaries and is evaluated atomically with nonce consumption and dead-letter transition.
7. Prove recovery actor and expired lease owner are recorded separately; no task/attempt/comment/GitHub/dispatch state changes.
8. Prove concurrent grant replay yields at most one commit; ambiguous commit/read-back remains NOT VERIFIED with no blind retry.
9. Prove audit failure aborts the transition; secrets/tokens/key material never enter logs/artifacts.
10. Only after local proof, exact-head CI and all owner approvals, schedule hosted qualification. Independent security/governance review remains deferred until actual Cloud Pool launch per owner direction.

## 4. Current GitHub governance snapshot

- Default branch `Основной` observed at `221f216c00ca7e5596bcc682ba185ad155a10603`.
- PR #60: OPEN / DRAFT / UNMERGED; head `134fe6fe739a09b181fee88463ac848a6b059206`; base `864213e2ff5b4fa956ba405dea8137a44d812f49`; exact-head workflow query returned no runs; CI NOT VERIFIED.
- PR #63: OPEN / DRAFT / UNMERGED; head `4d2f6ac2d96980f28ecbab53b46b2984d7dda9f6`; base `6fdcedebeba62715122e43a75c6ad6d926321ce7`; mergeability false; do not treat it as accepted governance.
- PR #66: OPEN / DRAFT / UNMERGED; docs-only branch; current head was re-read before this report; not default/canonical.
- PR #67: OPEN / DRAFT / UNMERGED; implementation head `f8280ba5a78ffcf1c18bf33f0dc8932ebb36a81d`; exact-head local D1 and contract workflows 43162128594 / 43162128615 SUCCESS. Local Workers-runtime proof only; combined status contexts 0; formal reviews 0; review threads 0.
- Active default-branch ruleset still requires PR and resolved review threads, blocks deletion/non-fast-forward, has zero required approvals and no bypass actors. Zero required approvals is not independent review.
- No hosted D1, issuer, live GitHub mutation, dispatch, provider/model call, deployment, secret read or merge performed.

## 5. Disposition

- Cross-contract source reconciliation: VERIFIED.
- Actor vocabulary: PROPOSED / owner decision required.
- v2 event digest: PROPOSAL ONLY / NOT ACCEPTED.
- Recovery Actor Capability v1: DESIGN ONLY / NOT IMPLEMENTED / NOT QUALIFIED.
- Issuer, key custody, subject registry, revocation, trusted time and audit sink: NOT OPERATIONAL / OWNERS UNRESOLVED.
- At-most-once comment boundary: local proof contract only; hosted qualification NOT RUN.
- Hosted D1: NOT QUALIFIED.
- Dispatch: FAIL-CLOSED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
- Independent review: DEFERRED until actual Cloud Pool launch by owner direction.

## Next bounded step

Perform a source-only design check on the current D1 migrations and event/marker identity constraints to decide a backward-compatible v2 event-ID/digest scheme, including dual-read and rollback behavior. Do not implement. After that, update the normative draft contracts only if the proposed scheme is internally consistent; retain NOT ACCEPTED status pending owner appointments and explicit governance acceptance.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
