# Verifier-capability persistence and atomic registry-bound admission

Date: 2026-11-15

Status: PR #84 EXACT-HEAD CI VERIFIED / PR #85 EXACT-HEAD CI VERIFIED / 118 WORKERS-RUNTIME TESTS PASS / NO MERGE / CONTOUR A NOT ACCEPTED

## Why the branch stack was reconciled

Live PR discovery found that PR #81 already implemented `persistTrustedRouteRegistryBundle` and migration `0013_persist_verified_route_registry.sql`. PR #82 independently introduced a second, incompatible migration 0013 defining overlapping issuer/route tables. Combining both would create schema conflicts. PR #83 independently implemented active-registry A0 admission but its exact-head CI failed with SQLite `Expression tree is too large (maximum depth 100)`.

To avoid duplicate schema and preserve the existing persistence work:
- PR #80 was closed as superseded; its module-private capability pattern was ported into PR #84.
- PR #82 was closed as a conflicting duplicate schema branch.
- PR #83 was closed as superseded after its admission changes were carried into PR #85 and the SQL depth defect was corrected.
- No PR was merged.

## PR #84 — verifier-issued persistence capability

PR [#84](https://github.com/VlDMlNSh/developer-cloud-pool/pull/84) is OPEN / DRAFT / UNMERGED. It is based on PR #81 HEAD `68ccf7b5b11857c00c9b5c4250bf95bac361468a`; its exact HEAD is `390ef0a09af2585c79f7e15d789343eb23fa370f`.

Changes:
- Successful verifier result objects are associated through module-private WeakMaps with the exact deep-frozen bundle snapshot and detached root signature.
- `getVerifiedTrustedRouteRegistryBundle(result)` returns a snapshot only for the original verifier-issued object.
- The persistence adapter accepts only that genuine verifier result; it no longer re-verifies caller-supplied bundle/signature/environment values.
- Snapshot acceptance time comes from the verifier result.
- Tests reject copied, forged and denied results, and prove nested immutability plus protection against mutation of the caller-owned bundle after verification.

Exact-head CI:
- PR run [43709839460](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43709839460), job `132798791200`: SUCCESS.
- Push run [43709824427](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43709824427), job `132798745644`: SUCCESS.
- Artifact `14160336008`, SHA-256 `6aaf530000d576263782736f915af09740aea4670d6c526fcca73c30715b1614`.

## PR #85 — active registry bound into A0 admission and receipt

PR [#85](https://github.com/VlDMlNSh/developer-cloud-pool/pull/85) is OPEN / DRAFT / UNMERGED and is stacked directly on PR #84. Immutable parent: `390ef0a09af2585c79f7e15d789343eb23fa370f`. Current exact HEAD: `b8b0252a2389406b5c6a22c27ef9885cd2faa498`; compare: 16 commits ahead / 0 behind its parent.

Changes:
- Adds migration `0014_active_route_registry_admission_view.sql`, a read-only view joining route qualifications to the live singleton pointer, exact persisted snapshot and matching issuer key.
- Admission, exact retry and receipt assertion query that view, checking snapshot acceptance/expiry and issuer status/revocation/validity in the same D1 transaction as approval consumption, task/outbox/attempt writes and immutable receipt.
- To stay below SQLite's expression-tree depth limit, SQL uses a compact identity predicate bound to qualification ID, canonical evidence digest, issuer key ID, registry epoch, bundle digest and registry version.
- Before first admission, the adapter independently recomputes the canonical Qualified Route Evidence SHA-256 digest from the caller's route fields and rejects substitutions. The evidence digest therefore commits the full canonical route evidence while SQL avoids repeating a large field-by-field predicate inside nested receipt SQL.
- The database view excludes non-active/revoked keys and any route not bound to the current snapshot pointer.
- Public denial reasons remain stable and do not expose internal SQLite diagnostics.

Exact-head CI at `b8b0252a2389406b5c6a22c27ef9885cd2faa498`:
- PR run [43710547450](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43710547450), job `132800929790`: SUCCESS.
- Push run [43710543522](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43710543522), job `132800917969`: SUCCESS.
- Workers-runtime suite: 11 test files / 118 tests PASS / 0 FAIL.
- Syntax, second D1 binding/migration smoke and frozen schema-0010 fixture also passed.
- PR artifact `14159912561`, 18,253 bytes, SHA-256 `239e9ddc8bb482c558431ba51dc8e7f0d43ac180f84bd03bcb16eaf1f1eb4b49`.
- Push artifact `14160496589`, 18,253 bytes, SHA-256 `572ef118d673400cadc1570844dab91d33344135f3fa7f11e85ebb09b951c4d8`.

## Review and governance

- PR #81, #84 and #85 remain Draft / OPEN / UNMERGED; formal reviews and inline review threads are 0 for #84 and #85.
- PR #83 failed both exact-head workflows before supersession; its root defect was SQLite expression-tree depth 100. PR #85 resolves this in the new exact-head passing tests.
- PR #80, #82 and #83 are CLOSED / UNMERGED as superseded/conflicting work.
- Default branch `Основной` remains `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`, branch API reports `protected=false`.
- Active ruleset #26550182 still requires PR and review-thread resolution but 0 approvals and no required status checks. CI success is evidence, not formal independent review.
- PR #81 actual base is `impl/durable-route-registry-d1-2026-11-15` at PR #77 HEAD `e63f1dda4c046d485ae9c2f08392a1943a06553d`; its body provenance was corrected. It includes the epoch-order hardening patch but remains unreviewed.

## Remaining boundaries

- Registry root-key configuration and custody are not production-qualified.
- Issuer fixtures in admission tests are synthetic; no live root trust anchor or hosted D1.
- The full production route lifecycle, key rotation, cross-process trust and hosted concurrency are not qualified.
- Web Experience API, remote console deployment, Supervisor/Worker executor, provider routing/quota and end-to-end execution remain incomplete.
- No secrets read, provider calls, deployment, worker dispatch, Gemini run, independent audit or Contour B work. `dispatch:false` remains.
- Contour A IN PROGRESS / NOT ACCEPTED; Contour B DEFERRED. Independent acceptance remains deferred until after an actual pool launch.

## Next step

Review and harden the PR #81 → #84 → #85 stack as one ordered change set, including formal code review and exact-head checks after any rebase. Then test the registry-bound A0 transaction against the existing supervisor/task envelope/outbox/receipt path without dispatch. Only after the actual web console, executor, persistence restoration, account-isolated quota routing and governance gates work may deployment/launch qualification proceed.

## Links

- PR #81: https://github.com/VlDMlNSh/developer-cloud-pool/pull/81
- PR #84: https://github.com/VlDMlNSh/developer-cloud-pool/pull/84
- PR #85: https://github.com/VlDMlNSh/developer-cloud-pool/pull/85
- PR #85 exact-head CI: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43710547450
- PR #84 exact-head CI: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43709839460
- Context Window: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/next-2026-11-15-route-registry-revalidation/docs/context/GITHUB-CONTEXT-WINDOW.md
- Checkpoint: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/next-2026-11-15-route-registry-revalidation/docs/checkpoints/2026-11-15-a0-admission-route-qualification.md
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
