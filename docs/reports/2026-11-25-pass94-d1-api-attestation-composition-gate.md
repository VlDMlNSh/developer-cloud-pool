# Pass 94 — D1 guide correction and API-attestation composition gate

Date: 2026-11-25  
Contour: A — Cloud Development Pool  
Status: VERIFIED (bounded documentation correction and source-level audit); integration remains BLOCKED

## Frozen inputs

- Canonical default base: `Основной` @ `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- D1 candidate PR #175: `integration/pass92-d1-clean-base-565404f`, head before this pass `bb9fd296928df3a99b6f060144cc60f5642f0d15`.
- API audit PR #174: `feat/pass88-owner-next-api-audit-proof-2026-11-25`, head `a8809c1dc8c2eaa49944fb031baeec54ce46b922`.
- D1 source files reviewed: `github-next-event.mjs`, `github-actions-context.mjs`, migration `0017`, and local D1 integration tests.

## Work completed

1. Re-read PR #175 metadata, changed paths, source files and current CI evidence.
2. Verified the D1 merge-result run `45689197397` / job `139469816000`: merge-result SHA `f543b77115edd797c735e74cc84a996937ae6ff2`, Node 24.9.0, worker syntax check passed, 8/8 test files and 123/123 tests passed.
3. Verified Pool Contract run `45689197360` / job `139469816983` on the same merge-result SHA: six workflow YAML files parsed; security contract PASS; `POOL_CONTRACT_VALIDATION=PASS`; workflow environment reported `POOL_DISPATCH_ENABLED=false`.
4. Corrected `proofs/d1-ledger/README.md` in PR #175 so the fresh-install and staged-upgrade instructions accurately include migrations 0011–0017, not 0011–0016. Commit: `3d69bc943677dba909792bf4930d4c0aa5d2233f`; new blob `93f133653e7e7b1315ebaca1d53b44ca671589d8`. Read-back confirms the old ranges are absent and the new ranges are present.
5. Compared PR #175 to its frozen base: 40 commits ahead / 0 behind; 39 added paths, no modified/deleted base paths. The documentation correction is an additional commit on the same PR branch.

## Reuse First

- Reuse the official Cloudflare Workers Vitest integration and local Miniflare/workerd D1 runtime already pinned in the candidate.
- Reuse Node built-in `fetch` and GitHub REST API for the audit path; no additional dependency is justified for this bounded composition.
- No new OSS package added. No account API, hosted D1, provider call, credential read or runner execution was performed in this pass.

## Findings / blockers

### F94-01 — API attestation is not composed into D1 admission (HIGH)

PR #175's `admitGitHubNextEvent(db, input, context, trustedClock)` calls `bindGitHubNextEvent(context)` directly. That binder accepts a flat Actions-context object and structurally checks fields such as `githubActions`, repository/owner IDs, actor/comment identities, ref, SHA, workflow ref/SHA and run identifiers. It does not perform independent GitHub API read-back.

PR #174 separately adds `verifyOwnerNextEvent`, which reads repository, issue, comment, workflow run, workflow metadata and default-branch ref through the read-only GitHub API. Its result is `OBSERVED_ONLY`; it creates no D1 admission or receipt and is not passed to PR #175's D1 adapter. Therefore the D1 event digest is still derived from caller-supplied context, not from the API-attested event/run/ref tuple.

Required next implementation: one canonical workflow call path must obtain the API-readback result, construct an immutable attested envelope, and pass only that envelope into D1 admission. D1 must bind the exact API-readback fields and their digest to the source-comment receipt; untrusted raw context must not be accepted as equivalent. Add adversarial tests for altered API response fields, stale/default-ref races, workflow identity mismatch, source-comment mismatch, and exact replay. Keep all outputs non-dispatching.

### F94-02 — workflow identity mismatch must be resolved explicitly

PR #174 audits `.github/workflows/owner-next-event-audit.yml`; PR #175's D1 binder and migration 0017 hard-code `.github/workflows/next-event-controller.yml`. A naïve copy/paste integration will either reject the real audit workflow or weaken workflow identity checks. Choose one reviewed canonical controller workflow identity and bind it consistently across API audit, D1 envelope, receipt schema and tests.

### F94-03 — new-head merge-result CI completed; exact-head status remains unavailable

After the README correction, PR #175 head `3d69bc943677dba909792bf4930d4c0aa5d2233f` triggered two successful PR merge-result workflows. D1 run `45690428935`, job `139474112922`, checked out merge-result SHA `1606645` (full SHA in the job checkout log), passed the Worker syntax check and 8/8 files / 123/123 tests. Pool Contract run `45690428805`, job `139474113226`, checked out the same merge result, parsed all six workflow YAML files, passed the security contract and reported `POOL_CONTRACT_VALIDATION=PASS` with `POOL_DISPATCH_ENABLED=false`. Combined status for the PR head remains empty; these are merge-result checks, not standalone exact-head checks.

### F94-04 — governance/review remain open

PR #175 remains OPEN / DRAFT / UNMERGED. Formal reviews: 0; review threads: 0. Current active ruleset details and current dispatch variable were not re-read in this pass. Independent security review is NOT RUN.

## Safety boundary

No merge, deployment, hosted D1 access, production write, live issue_comment event, controller activation, provider call, executor dispatch, secret-value read, paid fallback or Contour B work. The local D1 proof remains synthetic and inert; it does not qualify hosted D1 semantics, live event authenticity, executor runtime, model routing, quota accounting, UI or persistent user state.

## Metrics

- Files changed this pass: 1 README.
- Tests executed in this pass: none locally.
- CI after correction: D1 123/123 (8/8 files) and Pool Contract PASS on merge-result for current PR head; standalone exact-head status contexts remain empty.
- Active engineering time: NOT MEASURED; no wall-clock estimate asserted.
- Defects: 1 documentation range mismatch corrected; 3 active integration/review blockers (F94-01 through F94-04, with CI/governance as separate gates).
- Critical path: API-attested event envelope → D1 receipt binding/recovery → trusted lease/runtime integration → authenticated remote UI and persistent state → quota/routing and executor qualification → E2E/security/governance → independent acceptance.

## Decision

PR #175's clean-base D1 import is verified at merge-result CI level for its previous head. The README range correction is committed and read back. The D1/API trust boundary remains BLOCKED by F94-01. Keep PRs draft, keep dispatch false, and do not merge or claim Contour A acceptance.

## Next step

Implement the API-attested event-envelope-to-D1 composition on a fresh bounded branch from the current reviewed base. Resolve the canonical workflow path before code changes; include immutable full-tuple binding and replay/race tests. Then verify the new head and merge-result CI, governance and review gates.

References:
- PR #175: https://github.com/VlDMlNSh/developer-cloud-pool/pull/175
- PR #174: https://github.com/VlDMlNSh/developer-cloud-pool/pull/174
- Issue #140: https://github.com/VlDMlNSh/developer-cloud-pool/issues/140
- Context Window: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/engineering-excellence-2026-11-23/docs/context/GITHUB-CONTEXT-WINDOW.md
- MediaHub canonical map (deferred, separate project): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
