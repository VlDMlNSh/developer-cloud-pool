# /next pass — monotonic revocation watermark review

Date: 2026-11-15
Status: SOURCE REVIEW COMPLETE; PATCH NOT AUTHORIZED; CONTOUR A BLOCKED

## Immutable targets and event

- Cloud Pool default branch: `Основной`
- Default HEAD: `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`
- MediaHub Issue #301 source event created for this turn: comment `6899704487`, exact body `/next`.
- Controller/child run, job and artifact reconciliation for this event: NOT VERIFIED. The connected GitHub action set exposes job/artifact reads by known run ID but no workflow-run listing operation; no direct child dispatch was attempted.

## A0/D1 source findings

Inspected the following immutable source blobs and current PR metadata:

- Root-signed registry verifier/persistence module: `proofs/d1-ledger/src/trusted-route-registry.mjs`, blob `916581ca07cf94edb21c8c2daa77a4c45db3d666`.
- Admission module: `proofs/d1-ledger/src/admit-qualified-task.mjs`, blob `878e6ecf70355d05f9738d579b9455124b7ac3f9`.
- Migration 0014 admission assertion: blob `cb8a47d83faba62981daa8f7320da87baa2c55e2`.
- Registry verifier tests: blob `c7876cdc3b3eff39060d44e2890266374f54da4a`.

The current admission batch inserts an immutable registry assertion before consuming approval, creating admission/attempt/outbox rows and committing a receipt. Migration 0014's BEFORE INSERT guard checks the active singleton registry pointer, exact epoch/digest/version, accepted/unexpired snapshot, qualified/fresh route evidence and active/non-revoked issuer-key row. The A0 SQL binds the route's `revocation_version` to the stored qualification row.

The inspected admission path does not read a separate durable monotonic revocation authority/watermark in that same transaction. The signed bundle's registry epoch is monotonic only insofar as the current pointer/state is protected; that is not a distinct revocation watermark. This is a qualification gap, not a demonstrated exploit or failing test.

Do not add a new authority until its semantics are specified: revocation subject (issuer, key, route or qualification), monotonic sequence and compare-and-swap rule, authenticated writer, trusted-time source, rollback/replay behavior, recovery/restoration and same-batch admission predicate.

## Proof PR and CI reconciliation

All PRs below remain OPEN / DRAFT / UNMERGED with no formal reviews recorded:

- PR #87 head `8cc7b12948865bb0e13ce099386c09f3ae32b4f5`; D1 proof run `43712647597` / job `132807363651` SUCCESS (119 tests); Pool Contract Validation run `43712647615` / job `132807363825` SUCCESS.
- PR #86 head `a218f92274eca5491700d8f72a21172f8ce689dc`; proof run `43710912595` / job `132802030185` SUCCESS (118 tests).
- PR #92 head `7014961587759b27d2ef6e91c60ce098d077ae83`; proof run `43718679258` / job `132825665733` SUCCESS (120 tests); Pool Contract Validation run `43718679251` / job `132825665679` SUCCESS.
- PR #93 head `e200838d038b9cd48635233187819302bba6a33e`; proof run `43736264768` / job `132879427578` SUCCESS (120 tests). Its exact-head workflow query returned this successful run. Combined commit status contexts were empty and formal reviews were empty.

These are isolated local Workers/D1 proof runs. They do not constitute hosted D1, production trust-root custody, production issuer/revocation authority, Supervisor/Worker integration or independent security qualification.

## Current Cloud Pool / PR #95 state

- Issue #94 remains OPEN; Cloud Pool-native Gemini dispatch is NOT IMPLEMENTED / NOT QUALIFIED.
- Supervisor still has no `issue_comment` /next trigger; Worker remains limited to `dsh-headless-probe`; `POOL_DISPATCH_ENABLED` remains fail-closed.
- PR #95 remains OPEN / DRAFT / UNMERGED, head `c70a11481eca0921224174de623778265c95bcb8`, base default HEAD `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`. Exact-head workflow-run query returned no runs; combined status contexts were empty; formal reviews and review threads were empty. Exact-head CI and governance are NOT VERIFIED.

## Change boundary

No runtime code, schema, workflow, secret, variable, dispatch authority, provider call, deployment, merge or production resource changed. No tests were run in this pass. No claim of Gemini wave completion is made for source comment `6899704487`.

## Next bounded engineering step

Specify and review the revocation-authority contract before schema changes. Then add an append-only monotonic revocation state with authenticated advancement and a same-D1-batch admission check, plus adversarial tests for stale watermark, replay, lower-sequence rollback, conflicting updates, revocation race, unavailable authority and full transaction rollback. Preserve `dispatch:false`; do not merge stacked proof PRs until ancestry, exact-head CI, independent review and governance are reconciled.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
