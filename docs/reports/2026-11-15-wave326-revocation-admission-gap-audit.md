# Wave 326 — authoritative revocation and trusted-time admission gap audit

Date: 2026-11-15
Status: READ-ONLY AUDIT COMPLETE; implementation not started.

## Immutable scope

- Cloud Pool default branch: `Основной` @ `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`.
- D1 proof stack: PR #87 → PR #92 → PR #93; all OPEN / DRAFT / UNMERGED.
- PR #93 head source reviewed at `e200838d038b9cd48635233187819302bba6a33e`.
- Admission source blob: `878e6ecf70355d05f9738d579b9455124b7ac3f9`.
- Migration 0013 blob: `40b93551c787078e5c65c8861569bb428bd2eb8b`.
- Migration 0014 blob: `cb8a47d83faba62981daa8f7320da87baa2c55e2`.
- Revocation contract design blob: `20e1338522766487be7f9eedba2769fa0c12d8d5`.

## Findings

1. Admission validates `input.now` as a positive safe integer, but this value is supplied by the caller. The inspected function does not obtain or authenticate an independent trusted-time assertion. The five-minute observation freshness bound therefore inherits the caller's clock trust. This is a qualification gap, not a demonstrated production exploit.
2. Route evidence includes `revocationVersion`; admission binds it to the corresponding qualification row and checks `q.revoked_at IS NULL`. This proves equality with the stored row, not freshness against a separately authoritative, monotonic revocation watermark.
3. Migration 0014's admission assertion trigger checks the current registry snapshot pointer, matching qualification, active issuer-key row, validity windows and evidence identity. It does not query a distinct append-only route/issuer revocation event ledger or per-subject current watermark.
4. Migration 0013 makes issuer-key rows append-only. A future revocation design cannot rely on mutating an existing key row; it needs immutable revocation events and a guarded current-state projection/pointer, or a new immutable registry epoch with independently enforced freshness. The authority and event semantics must be explicit.
5. The present local proof is dispatch-disabled and the Worker entrypoint remains inert. These findings do not establish deployed Cloudflare D1 behavior or a live provider route.

## Contract decisions required before implementation

- Authority identity and trust-root custody: identify who can revoke a route qualification and who can revoke an issuer key; explicitly prevent an issuer from revoking itself or substituting another authority.
- Subject identity: stable allowlisted tuple `authorityId + subjectType + subjectId`; distinguish route qualification from issuer key.
- Event semantics: append-only signed `REVOKE` and separately authorized `REINSTATE`; define event ID, strict per-subject sequence, previous digest, effective time, expiry and registry/key bindings.
- Canonicalization: versioned exact-key canonical JSON/bytes, duplicate/unknown-field rejection, deterministic digest/signature vectors.
- CAS semantics: expected prior sequence/digest, exactly-next sequence, no gaps, forks or pointer regression.
- Trusted time: authenticated time source, skew bound, monotonicity assumptions, fail-closed behavior and evidence retention. Caller-supplied `now` alone is insufficient.
- Admission: route and issuer revocation watermarks must be re-read in the same D1 batch that inserts the admission assertion and consumes approval. Exact replay must verify the original receipt without reopening execution or accepting changed revocation state.
- Restore boundary: D1 append-only triggers cannot prevent a full database restore to an old backup. A separate signed anti-rollback checkpoint/anchor is required before making whole-database rollback claims.

## Minimum implementation and adversarial test plan

1. Additive migration: append-only event table plus per-subject head table; immutable event rows; guarded compare-and-swap head advancement.
2. Pure canonical verifier: verify authority key, signature, subject binding, sequence, previous digest, effective/expiry time and allowed transition.
3. Verifier-issued capability: persistence accepts only the exact opaque result of successful verification, not caller-supplied `verified: true`.
4. Admission migration: assertion trigger checks current route and issuer heads/events, registry epoch/digest and time in the same D1 batch.
5. Positive cases: genesis, sequential revoke, authorized reinstate, independent route and issuer subjects, key rotation overlap.
6. Negative cases: duplicate ID/sequence, sequence gap/regression, stale CAS, wrong authority/subject, cross-subject replay, bad signature/digest, revoked/retired key, future/expired event, unavailable clock, stale route evidence, concurrent revoke/admission, partial batch rollback, exact replay after later revocation.
7. Recovery case: restore D1 behind an independent signed checkpoint and verify admission remains denied.
8. For every denial: approval remains ready; no admission, task, attempt, receipt or newly authorized outbox mutation; dispatch remains false.

## Orchestration and execution gates

- MediaHub's controller is a separate supplementary execution path; it is not Cloud Pool-native Gemini or a substitute for Issue #94.
- Latest durable context records source comment `6899808366` but does not contain verified controller/child reconciliation for that event. The connected GitHub action set does not expose a workflow-run listing operation for issue_comment-triggered runs.
- This pass did not create another MediaHub comment: current controller secret/variable presence and scope metadata could not be independently verified with the available read-only actions. No direct child dispatch was attempted.
- Cloud Pool-native controller remains absent from default branch; Issue #94 remains OPEN. Gemini Agent 1/2/3 for Cloud Pool: NOT RUN.
- No secret values were read, no secret/variable was changed, no provider/model call, dispatch, deployment or merge occurred.

## Disposition

- Caller-clock independence: NOT VERIFIED.
- Authoritative monotonic route/issuer revocation: NOT IMPLEMENTED.
- Same-batch revocation watermark assertion: NOT IMPLEMENTED.
- Whole-database rollback protection: NOT QUALIFIED.
- Local registry + A0 admission proof: existing tests/CI only; independent review and production integration remain NOT VERIFIED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next bounded step

Implement the additive revocation event ledger and CAS pointer only after reconciling the migration ancestry on one clean D1 branch. Then add the same-batch route+issuer watermark assertion and adversarial D1 tests. Do not transplant divergent PR stacks, enable dispatch, or merge.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
