# Wave 336 — /next dispatch reconciliation and A0/D1 revocation gap review

Date: 2026-11-15
Status: DISPATCHED / NOT VERIFIED (new Gemini wave); bounded source review completed; Contour A NOT ACCEPTED.

## Execution event
- New owner-authored exact /next event created on MediaHub Issue #301: [comment 6900175631](https://github.com/VlDMlNSh/mediahub-os/issues/301#issuecomment-6900175631).
- The comment was read back and its exact body/owner identity verified.
- Available GitHub connector operations in this pass do not expose a list-workflow-runs-by-repository endpoint for the new event. No controller run ID or child run IDs were returned/read back for comment 6900175631. Therefore dispatch status is DISPATCHED; controller/children are NOT VERIFIED. Do not infer failure or success from the missing run-list capability.
- Previous waves 334 and 335 remain independently evidenced by PR #95 and Wave 335 report; do not discard them.

## Immutable engineering target and repository state
- Cloud Pool repository: VlDMlNSh/developer-cloud-pool.
- Default branch Основной HEAD observed: 9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc.
- Documentation branch: docs/gemini-three-agent-next-bridge-2026-11-15; PR #95 OPEN / DRAFT / UNMERGED.
- Issue #94 OPEN: [Cloud Pool-native Gemini dispatch](https://github.com/VlDMlNSh/developer-cloud-pool/issues/94).
- No Cloud Pool runtime/workflow/secret/variable/dispatch/deployment changes in this pass.

## A0/D1 source and governance review
- PR #92 [exact replay receipt integrity](https://github.com/VlDMlNSh/developer-cloud-pool/pull/92): OPEN / DRAFT / UNMERGED, head 7014961587759b27d2ef6e91c60ce098d077ae83; formal reviews empty; combined status contexts empty (NOT VERIFIED).
- PR #93 [verifier-issued registry persistence capability](https://github.com/VlDMlNSh/developer-cloud-pool/pull/93): OPEN / DRAFT / UNMERGED, head e200838d038b9cd48635233187819302bba6a33e; formal reviews empty; combined status contexts empty (NOT VERIFIED). Historical exact-head proof run 43736264768 completed SUCCESS; this does not substitute for current independent review/governance.
- PR #92 adds a replay-time read-back across admission, commit receipt, approval ledger, outbox, task/attempt and registry assertion. It fails closed on missing or mismatched receipt/assertion rather than inferring success from an admission row.
- PR #93 introduces a module-private WeakMap capability holding a frozen verifier snapshot and detached signature; persistence rejects copied/forged result objects. Its verification result records verifiedAt: now, and persistence uses that value as acceptedAt. This remains caller-supplied time at the verifier boundary, not a database-derived trusted clock.
- Existing registry epoch monotonicity and stale-epoch rollback tests do not constitute an independent revocation authority or a durable per-subject revocation event chain.
- The proposed [Authoritative Revocation Authority Contract v1](../contracts/AUTHORITATIVE-REVOCATION-AUTHORITY-CONTRACT-V1.md) requires a separate root/keyset, distinct revoke/reinstate roles, immutable event chain, per-subject monotonic sequence + digest, trusted DB time, and same-batch admission checks of both route-qualification and issuer-key revocation heads.
- Gap remains: no verified implementation in the reviewed PR #92/#93 diff/source demonstrates that the admission transaction reads and validates a durable authoritative revocation watermark/event chain in the same D1 consistency boundary. This is an unclosed qualification gap, not a claim of a demonstrated exploit.

## Next implementation direction
1. Preserve PR #92/#93 as draft proof branches; do not merge the divergent stack wholesale.
2. Implement a pure deterministic revocation event/keyset verifier and canonical vectors against Contract v1, with malformed signature, wrong role, duplicate event, sequence gap/fork, digest substitution, stale keyset, expired signer and subject-crossing replay tests.
3. Then add D1 schema/transaction tests for append-only event storage, CAS head advancement, rollback on partial batch, and same-batch admission denial for route and issuer-key revocation.
4. Derive admission time inside the D1 transaction; never use request/caller now as the authoritative clock.
5. Keep dispatch disabled; no hosted D1 provisioning or live keys/provider calls without separate gates.

## Disposition
- New Gemini event: DISPATCHED; controller and children NOT VERIFIED.
- Wave 335: 3/3 child runs and artifacts verified; controller completed SUCCESS per prior final reconciliation.
- PR #92/#93 source review: bounded source findings recorded; independent review NOT RUN.
- PR exact-head combined statuses: empty; CI status NOT VERIFIED from combined-status endpoint. PR #93 historical workflow run success remains valid for that immutable head only.
- Cloud Pool-native Gemini dispatch: NOT IMPLEMENTED / NOT QUALIFIED.
- A0/D1: local proof exists; authoritative revocation + trusted-time integration NOT QUALIFIED.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
