# 2026-11-15 — PR #649 live Gemini branch/PR provenance remediation

## Scope and immutable target
- Repository: `VlDMlNSh/mediahub-os`.
- PR: https://github.com/VlDMlNSh/mediahub-os/pull/649
- Base: `main` at `41c13e1c2b17ac48dc51c9963a9cda140f79ddb0`.
- Final observed PR head: `43e0f57d74f452f31a4e898741751107e2d95ad7`.
- PR remains OPEN/DRAFT/UNMERGED.

## Findings fixed in this pass
1. F-01 was prompt-only: the child workflows requested dispatch-specific branch names but did not validate the actual branch or PR.
2. A strict validator had been added to the PR branch but was not invoked by any of the three child workflows.
3. The new validator needed `actions: read` to retrieve its own workflow-run metadata under least-privilege `GITHUB_TOKEN` permissions.
4. Agent 2's controller task described contract/test verification, while its workflow still described research/architecture.
5. The provenance adversarial suite was not included in the workflow contract CI.

## Changes made
- Added `scripts/validate_gemini_dispatch_pr.py` to query GitHub API for the exact UUIDv4 role branch, all matching PRs, branch ref, and current workflow run. It rejects wrong role/dispatch branch, non-matching ref, malformed SHA, missing or multiple PRs, wrong head/base repository, wrong base branch, mismatched PR/ref SHA, non-open/non-draft/merged PRs, untrusted workflow_dispatch context, and PR timestamps predating the run.
- Wired the validator as a mandatory post-Gemini step in Agent 1, Agent 2, and Agent 3 child workflows.
- Added only `actions: read` to the child execution jobs; existing write permissions remain unchanged.
- Aligned Agent 2's workflow title, run name and prompt with Contract and Test Verification, while preserving its no-test-execution boundary and independent immutable-target scope.
- Expanded `tests/test_gemini_dispatch_pr_provenance.py` with adversarial validation, API reconciliation and workflow wiring/permission assertions.
- Added the provenance suite and `py_compile` to `.github/workflows/gemini-workflow-contract-validation-wave284.yml`.

## Verification
- Exact-head check-runs at `43e0f57d74f452f31a4e898741751107e2d95ad7`: 11 total; 9 SUCCESS, 2 expected SKIPPED in pull_request context; zero failed or pending at final read.
- Contract validation run `43729494613`, job `132858576406`: COMPLETED/SUCCESS.
- New provenance suite: 11 tests, all PASS; Python `py_compile` PASS; actionlint PASS.
- AI Factory verification, provider contract verification, Astra Cloud Runtime Validation and Astra Verify were SUCCESS on the exact head.
- Controller PR-context probe succeeded; dispatch/admission jobs were SKIPPED as intended. This does not prove trusted-main dispatch readiness or live child behavior.

## Review and operational gates
- PR #649 formal reviews: 0; inline review threads: 0. An explanatory remediation comment was posted and read back: https://github.com/VlDMlNSh/mediahub-os/pull/649#issuecomment-6896804744.
- Active ruleset `26108066` read back: default branch target; five required status contexts; required approving review count 0; extra approval for unattributed changes enabled; no bypass actors; current user cannot bypass. Project-level independent review/governance requirement remains outstanding.
- PR #650 (single-Gemini review controller proposal) remains OPEN/DRAFT/UNMERGED, exact head `eca542d7ecc9dba548e66860dc19ddbc51ff4077`; 9 checks (7 SUCCESS, 2 expected SKIPPED), zero formal reviews. It does not execute a review.
- MediaHub main remains `41c13e1c2b17ac48dc51c9963a9cda140f79ddb0`; the corrected workflows are not on main.
- Actions variable/secret metadata and effective scope are NOT VERIFIED; no secret values were read. No trusted-main no-secret probe, no Gemini dispatch, no provider call, no merge, no deployment, no qualification.
- GitHub connector identity read-back matches owner `VlDMlNSh` (numeric ID `157891068`) and repository permission is `admin`. This confirms the available connector can author Issue #301 comments as the owner, but does not itself create an automatic chat event bridge. Once all gates pass, each chat `/next` can be bridged by explicitly posting exactly `/next` to Issue #301; do not do this before merge/governance/metadata gates.

## Current status
- F-01 remediation: IMPLEMENTED and PR-context CI-VERIFIED.
- Live 3/3 Gemini child execution: NOT RUN / NOT VERIFIED.
- Per-chat `/next` bridge: technically callable through owner-authenticated GitHub connector, but not enabled for dispatch while gates remain outstanding.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

## Next step
Obtain independent review/governance for PR #649 and PR #650 as required; verify Actions variable/secret metadata without reading values; perform a trusted-main non-launching probe; then merge only through the active ruleset and execute one controlled 3/3 wave through the approved controller. Reconcile exact child run IDs, role branches, PRs, job conclusions and artifact digests. Only after repeatable 3/3 success enable per-chat `/next` bridging.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md

## Follow-up — owner-only no-secret `/probe` trigger

- Extended `.github/workflows/gemini-batch-dispatch-controller.yml` so an exact owner-authored `/probe` comment on Issue #301 invokes only the reusable no-secret caller-context observer.
- The reusable observer now validates the trusted main workflow ref and the event payload (Issue #301, not a PR, exact `/probe`, OWNER association). The controller probe and assertion jobs include this event; `readiness_gate` and `dispatch_and_monitor` explicitly exclude it. Run names distinguish probe-comment IDs from next-comment IDs.
- Added regression tests proving `/probe` is owner-only and cannot enter any dispatch job.
- Latest PR #649 head: `309fa6a4af866f57c7de07006b375780b726302d`, base `main@41c13e1c2b17ac48dc51c9963a9cda140f79ddb0`; OPEN/DRAFT/UNMERGED.
- Latest exact-head CI: 11 check-runs, 9 SUCCESS, 2 expected SKIPPED, 0 failed/pending. Contract validation run `43730102946`, job `132860465272`: SUCCESS; trigger-path suite 3/3 PASS; dispatch provenance suite 11/11 PASS; actionlint PASS.
- Follow-up PR comment: https://github.com/VlDMlNSh/mediahub-os/pull/649#issuecomment-6896878604.
- `/probe` was not triggered: PR is not on main. This adds a safe route to run a trusted-main no-secret probe after integration, without invoking Gemini. `/next` remains a separate OWNER-only path that can dispatch all three roles only when the batch variable and controller gates pass.
- Live 3/3 Gemini execution remains NOT RUN / NOT VERIFIED. Secret/variable metadata remains NOT VERIFIED; no secret values read; no provider call, merge, deployment or qualification.