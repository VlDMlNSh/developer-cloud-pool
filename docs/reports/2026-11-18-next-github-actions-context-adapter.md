# /next — GitHub Actions context binding for atomic D1 admission — 2026-11-18

## Immutable target and scope
- Parent implementation: PR #114, head/base for this stack `ab9461eb84b14fe230918391d5212f19ca25592c`.
- Bounded implementation branch: `proof/d1-github-actions-context-adapter-2026-11-18`.
- PR #125 exact head: `edfeaef277fe709a9acc37d99b7bd3cda3003774`; base `ab9461eb84b14fe230918391d5212f19ca25592c`; compare 18 ahead / 0 behind.
- Scope: bind the previously pure local D1 admission proof to GitHub Actions runner-provided context fields, persist workflow retry attempt identity, and verify the exact immutable PR head. No controller deployment, hosted D1, secrets, provider calls or dispatch.

## What changed
- Added `bindGitHubActionsContext` and `admitGitHubActionsEvent` composition in `proofs/d1-admission/src/github-actions-adapter.mjs`.
- Require GitHub Actions runtime marker and `https://github.com`; compare runner repository/owner login and numeric IDs with the webhook event repository payload.
- Require exact `issue_comment.created`, exact open Issue #96 URL, owner numeric ID/login/OWNER association and full comment body `/next`.
- Require default ref `refs/heads/Основной`, exact allowlisted future workflow reference `.github/workflows/cloud-pool-next-controller.yml@refs/heads/Основной`, valid `GITHUB_SHA`, `GITHUB_WORKFLOW_SHA`, positive `GITHUB_RUN_ID` and `GITHUB_RUN_ATTEMPT`.
- Derive target and trusted default-head SHA only from `GITHUB_SHA`; derive controller run ID, run attempt and code SHA only from the respective runner environment variables. Caller-provided target/head overrides are ignored.
- Extended the local D1 receipt migration/read-back to persist `controller_run_attempt`; bind it into the approval envelope digest and validate it as a positive integer. Source-comment replay remains idempotent and still returns the original admission.
- All outputs remain `dispatch: false` and `executionAuthorized: false`. Added a regression test proving that replaying one source comment under the same `GITHUB_RUN_ID` and incremented `GITHUB_RUN_ATTEMPT` returns the original immutable receipt/task/outbox without duplicates.
- Reuses GitHub Actions' documented runner context/variables and the existing PR #112 read-only owner-event predicate. No new external runtime dependency was introduced.

## Exact-head evidence
- PR #125: OPEN / DRAFT / UNMERGED; 18 commits ahead / 0 behind PR #114 head; mergeable=true at read-back; formal reviews: 0.
- Final exact-head PR workflow [44253572758](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44253572758), job [134629803561](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44253572758/job/134629803561): COMPLETED / SUCCESS on exact branch head `edfeaef277fe709a9acc37d99b7bd3cda3003774`.
- Job log proves checkout was exactly `edfeaef277fe709a9acc37d99b7bd3cda3003774` (the checkout command and `git log -1` both returned that SHA; it did not test the PR merge commit).
- Workers-runtime test suite: **21/21 PASS** across 2 files (12 D1 admission tests + 9 GitHub Actions context tests, including the workflow-rerun idempotency regression test). `npm ci --ignore-scripts --no-audit --no-fund` and `npm run check` also passed.
- Exact-head push validation [44253567272](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44253567272): COMPLETED / SUCCESS on the same SHA.
- Earlier intermediate CI attempts exposed one invalid test expectation (`dispatch: undefined`); it was removed. Only the final successful exact-head run above is used as acceptance evidence.
- Changed source/migration/test files were read back from GitHub after commit. Final code branch head is `edfeaef277fe709a9acc37d99b7bd3cda3003774`.

## Security and qualification limits
- The GitHub Actions context fixtures remain synthetic. The adapter composes runner-provided values and event JSON in tests; it does not authenticate a live webhook signature, independently re-read the default branch through GitHub API, or prove that the allowlisted workflow exists/deployed on the default branch.
- Current default branch `Основной` HEAD remains `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`. The allowlisted `cloud-pool-next-controller.yml` workflow is NOT PRESENT on that default branch; no production `issue_comment` controller is enabled.
- D1 tests use local Workers-runtime emulation only. Hosted D1 entitlement, persistence, backup/restore and contention are NOT VERIFIED.
- Supervisor claim/lease/fencing/recovery, outbox delivery, worker identity, real provider/free-quota qualification and production dispatch remain NOT QUALIFIED.
- Active ruleset #26550182 has 0 required approvals and 0 required status checks. PR #125 formal reviews are 0. Governance/independent A3 review remains a blocker; do not merge.
- The default-branch `.github/workflows/gemini-batch-dispatch-controller.yml` was checked and is absent (404). The requested four Gemini assignments are **NOT RUN**; no controller bypass, direct API calls, secret access or substitute MediaHub controller was used.
- No secrets were read, provider calls made, hosted resources created, dispatch enabled, deployment or merge performed.

## Status
- GitHub Actions context binding logic + local D1 composition tests: **VERIFIED on exact PR head**.
- Production webhook/controller: **NOT IMPLEMENTED / NOT QUALIFIED**.
- Hosted D1 and end-to-end task execution: **NOT QUALIFIED**.
- Contour A: **BLOCKED / NOT ACCEPTED**.
- Contour B: **DEFERRED**.

## Next
1. Obtain independent security/contract review of PR #125 and its stacked parent PR #114.
2. Keep controller workflow absent/dispatch disabled until trusted production event provenance, hosted transactional authority, approval issuance, durable claims/leases/fencing/recovery, worker identity, quota and all governance gates are qualified.
3. Continue the first no-secret vertical slice only after the current admission contract is independently reviewed. Keep Gemini optional/controller-only and Contour B deferred.

## References
- [PR #125 — GitHub Actions context binding](https://github.com/VlDMlNSh/developer-cloud-pool/pull/125)
- [PR #114 — atomic D1 admission parent](https://github.com/VlDMlNSh/developer-cloud-pool/pull/114)
- [Issue #96 — owner-only /next admission](https://github.com/VlDMlNSh/developer-cloud-pool/issues/96)
- [GitHub Actions variables](https://docs.github.com/en/actions/reference/workflows-and-actions/variables)
- [GitHub Actions issue_comment event semantics](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)
- Canonical MediaHub map (separate project): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
