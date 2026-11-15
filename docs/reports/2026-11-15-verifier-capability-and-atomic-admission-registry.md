# Verifier-capability persistence and atomic registry-bound admission

Date: 2026-11-15

Status: PR #84 EXACT-HEAD CI VERIFIED / PR #86 EXACT-HEAD CI VERIFIED / 118 WORKERS-RUNTIME TESTS PASS / NO MERGE / CONTOUR A NOT ACCEPTED

## Why the branch stack was reconciled

Live PR discovery found that PR #81 already implemented `persistTrustedRouteRegistryBundle` and migration `0013_persist_verified_route_registry.sql`. PR #82 independently introduced a second, incompatible migration 0013 defining overlapping issuer/route tables. Combining both would create schema conflicts. PR #83 initially failed at HEAD `46db457` with SQLite `Expression tree is too large (maximum depth 100)`, then was updated to HEAD `a2e0247` with a passing assertion-table implementation.

To avoid duplicate schema and preserve the existing persistence work:
- PR #80 was closed as superseded; its module-private capability pattern was ported into PR #84.
- PR #82 was closed as a conflicting duplicate schema branch.
- PR #83's passing updated head was closed only to reconcile ancestry; its assertion-table implementation was ported into PR #86 on top of PR #84.
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

## PR #86 — atomic registry trust assertion bound into A0 admission and receipt

PR [#86](https://github.com/VlDMlNSh/developer-cloud-pool/pull/86) is OPEN / DRAFT / UNMERGED and is stacked directly on PR #84. Immutable parent: `390ef0a09af2585c79f7e15d789343eb23fa370f`. Current exact HEAD: `a218f92274eca5491700d8f72a21172f8ce689dc`; compare: 5 commits ahead / 0 behind its parent.

Changes:
- Adds migration `0014_atomic_admission_registry_assertion.sql`, creating append-only `pool_admission_registry_assertions`.
- A BEFORE INSERT trigger validates the exact current registry pointer, snapshot epoch/digest/version and validity, matching route qualification/evidence digest, issuer ID/key ID, active/unrevoked issuer status and key validity interval.
- The assertion is the first statement in the same D1 batch as approval consumption, task/admission, attempt, outbox and immutable receipt writes. Any later failure rolls the assertion back with the transaction.
- The commit receipt joins and binds to the immutable assertion row; exact retry independently re-checks current snapshot and issuer-key lifecycle.
- Preserves full route-field conditional matching for first admission. This avoids the competing read-view migration approach from PR #85 and records a durable per-admission trust assertion.
- Source was ported from PR #83's updated passing head `a2e02471438104a5502d505995912c9eedb06480`; the earlier head `46db457` had the expression-depth failure.

Exact-head CI at `a218f92274eca5491700d8f72a21172f8ce689dc`:
- PR run [43710912595](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43710912595), job `132802030185`: SUCCESS.
- Push run [43710887889](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43710887889), job `132801952692`: SUCCESS.
- Workers-runtime suite: 11 test files / 118 tests PASS / 0 FAIL.
- Syntax, second D1 binding/migration smoke, frozen schema-0010 fixture and artifact upload all succeeded.
- Push artifact `14159919500`, 18,253 bytes, SHA-256 `fde2ce7a1c0c5b7fed55f80d74ee2e5f3b95dfabb6257c6187b3cb7204063710`.
- PR artifact `14160372747`, SHA-256 `8a1d61c86ecdda5dc58ae1d45cfbc83d09fcc3d53183f2101ebdd36c243745fc`.

## Review and governance

- PR #81, #84 and #86 remain Draft / OPEN / UNMERGED; formal reviews and inline review threads are 0 for #84 and #86.
- PR #83 updated to HEAD `a2e02471438104a5502d505995912c9eedb06480` and both exact-head workflows passed (runs 43710565281 and 43710560400); it was closed to reconcile the branch ancestry and its passing assertion-table implementation was ported into #86. Its initial `46db457` head had the SQLite expression-depth failure.
- PR #78, #80, #82, #83 and #85 are CLOSED / UNMERGED. #78's epoch-order migration change is included in PR #81. #82 had a conflicting duplicate migration 0013; #85 had a competing migration 0014 read-view approach; #83's passing assertion implementation was ported into #86. No merge occurred.
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

Review and harden the PR #81 → #84 → #86 stack as one ordered change set, including formal code review and exact-head checks after any rebase. Then test the registry-bound A0 transaction against the existing supervisor/task envelope/outbox/receipt path without dispatch. Only after the actual web console, executor, persistence restoration, account-isolated quota routing and governance gates work may deployment/launch qualification proceed.

## Links

- PR #81: https://github.com/VlDMlNSh/developer-cloud-pool/pull/81
- PR #84: https://github.com/VlDMlNSh/developer-cloud-pool/pull/84
- PR #86: https://github.com/VlDMlNSh/developer-cloud-pool/pull/86
- PR #86 exact-head CI: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43710912595
- PR #84 exact-head CI: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43709839460
- Context Window: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/next-2026-11-15-route-registry-revalidation/docs/context/GITHUB-CONTEXT-WINDOW.md
- Checkpoint: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/next-2026-11-15-route-registry-revalidation/docs/checkpoints/2026-11-15-a0-admission-route-qualification.md
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
