# 2026-11-16 — Exact-replay active registry fence

Date: 2026-11-16
Scope: one bounded adversarial test pass for the Cloud Pool A0→D1 admission proof.
Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md

## Immutable refs

- Cloud Pool default `Основной`: `6507823e7ec27caa9b2621daef964dba2d4cf436`.
- MediaHub OS `main`: `1694cde38c7b7d69baf9676b4908c1bb6e197fbe`.
- Admission proof PR #93 exact HEAD: `e200838d038b9cd48635233187819302bba6a33e`, based on PR #92 head `7014961587759b27d2ef6e91c60ce098d077ae83`.
- Test branch: `test/exact-replay-active-registry-fence-2026-11-16`.
- New Draft PR #101: https://github.com/VlDMlNSh/developer-cloud-pool/pull/101
- PR #101 exact HEAD: `ae9cf5d4fd76134136b9af8b5498e90a65509722`; base PR #93 branch at exact `e200838d038b9cd48635233187819302bba6a33e`.
- Changed test blob `proofs/d1-ledger/test/atomic-admission.test.ts`: `2a7129524fa2f2b00c500a4b78d90948b8352c40`.

## Engineering change

Added one negative-first D1 Workers-runtime test for a gap not explicitly covered by the prior suite:

1. Admit a task against the currently active root-signed registry snapshot.
2. Advance the active registry pointer to a newer snapshot and a different issuer key.
3. Replay the original immutable admission with the old route evidence.
4. Require `DENY / ROUTE_EVIDENCE_REVOKED_OR_STALE`, rather than returning `ADMISSION_ALREADY_COMMITTED`.
5. Assert that the original consumed approval, immutable commit receipt and attempt remain unchanged and no duplicate attempt is created.

Production code was not changed. The test validates the existing replay guard's active-snapshot fence; it does not qualify the real issuer/root, prove production D1 configuration, or enable dispatch.

## Verification

- PR #101 exact-head GitHub Actions run `43764995448`, job `132967987468`, exact HEAD `ae9cf5d4fd76134136b9af8b5498e90a65509722`: COMPLETED / SUCCESS.
- Steps passed: pinned Node setup, dependency install, proof adapter syntax, Workers-runtime D1 tests, isolated second D1 binding/migration API, frozen schema-0010 fixture, lockfile preservation.
- Artifact ID `14182400848` (`d1-ledger-proof-package-lock`). GitHub artifact metadata did not expose a SHA-256 digest; digest therefore NOT VERIFIED.
- Formal PR reviews: 0. PR remains OPEN / DRAFT / UNMERGED; mergeability relative to its declared base is true. No merge.
- PR #93 exact-head checks on `e200838d038b9cd48635233187819302bba6a33e`: both checks SUCCESS; formal reviews 0; OPEN / DRAFT / UNMERGED.
- No local test run is claimed; evidence is the exact-head GitHub Actions run.

## Gemini controller and three-agent status

- Latest trusted-main non-launching probe: owner comment `6901747908`; controller run `43764634513`; probe job `132966862378` and context assertion job `132966891092` SUCCESS. Readiness and dispatch jobs SKIPPED. Probe verified caller context and no secrets mapped in probe mode only.
- Last actual three-agent wave remains controller `43763042415`, target `1694cde38c7b7d69baf9676b4908c1bb6e197fbe`; Agent 1 run/job `43763061253 / 132961975123`, Agent 2 `43763062743 / 132961977561`, Agent 3 `43763064255 / 132961996069`. All child runs SUCCEEDED. Artifacts: Agent 1 `14181440011`, Agent 2 `14181202709`, Agent 3 `14180987288`; SHA-256 values are not exposed in the current artifact metadata and remain NOT VERIFIED.
- No new owner-authored exact `/next` comment was posted and no new Gemini batch was dispatched in this pass. Controller dispatch remains gated: REST/HMAC child dispatch still conflicts with the approved `workflow_call` architecture, and independent governance review/effective secret-variable scope are NOT VERIFIED. Do not bypass these gates.
- A later owner comment `6901757142` was a report comment, not `/next`; controller run `43764698156` concluded SKIPPED, all jobs SKIPPED, no children.
- No secrets read, provider calls, live D1, Worker deployment, production root configuration, merge, executor qualification or Contour B work.

## Status and next step

- Test-only exact-replay fence: IMPLEMENTED / VERIFIED by exact-head CI.
- PR #101: OPEN / DRAFT / UNMERGED; independent review NOT VERIFIED.
- Trusted issuer registry: proof stack exists in PRs #75–#93, but production trust root/custody and deployed D1 remain NOT QUALIFIED.
- Cloud Pool controller: NOT QUALIFIED; live Gemini dispatch in this pass NOT RUN due unresolved governance gates.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.
- Next bounded step: independent review of PR #101 and PR #93's complete stack; then resolve the controller transport architecture mismatch and effective configuration governance before authorizing another Gemini batch.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
