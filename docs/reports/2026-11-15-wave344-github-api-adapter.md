# Wave 344 — paginated GitHub API adapter and source verification

Date: 2026-11-15

## Scope and result

Implemented a dependency-injected GitHub REST adapter for the Cloud Pool /next ledger prototype. It supports bounded page-by-page reads of Issue #96 comments and Actions workflow runs, ledger-only comment writes, retrieval of the canonical control issue/source comment, and retrieval of the current default-branch ref SHA. Added a source-verification wrapper that fails closed unless the control issue is open, the source comment is exactly `/next`, belongs to Issue #96, is authored by `VlDMlNSh` with `OWNER` association, and the requested target SHA equals the current default-branch head.

This is a testable API adapter layer only. It is not connected to a trusted-main workflow, does not create the actual Actions concurrency lock, and never dispatches a worker/controller/Gemini job.

## Immutable refs and repository state

- Repository default branch: `Основной`.
- Default branch HEAD at end of pass: `6507823e7ec27caa9b2621daef964dba2d4cf436`.
- The prior default HEAD was `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`.
- Feature branch: `feat/cloud-pool-next-admission-contract-2026-11-15`.
- PR [#97](https://github.com/VlDMlNSh/developer-cloud-pool/pull/97): OPEN / DRAFT / UNMERGED; latest head `f0ad25ce60e6ef052fcfeab31fb5deab06793f21`; base ref still points to `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`; formal reviews 0.
- Issues [#94](https://github.com/VlDMlNSh/developer-cloud-pool/issues/94) and [#96](https://github.com/VlDMlNSh/developer-cloud-pool/issues/96) remain OPEN.
- Current default `.github/workflows/pool-supervisor.yml` blob remains `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`; no `issue_comment` or owner `/next` trigger. Default worker remains DSH headless probe only.

## Files on PR #97 feature branch

- `scripts/next-github-api-adapter.mjs`, blob `9e307f2e40dfc1fa18ffd5142ec205fb6afa3c80`.
- `test/next-github-api-adapter.test.mjs`, blob `9a386b8fd8d7ae2a6b87ae5cba34b3de67ae029f`.
- `scripts/next-github-ledger-adapter.mjs`, blob `aa343e4cf10ca1d8b0608957caba5b9ea9fe9956`.
- `.github/workflows/next-admission-contract.yml`, blob `f05454a67defba5e4d9d3a1e163bd282e68b63fb`.

The contract CI workflow now serializes its own validation runs per ref. This is CI-only concurrency and must not be confused with the missing production controller lock.

## CI and test evidence

An exact-head run on intermediate commit `7f1551a0794480fbd1ec692389ac0817a0332a7a`:
- [Cloud Pool Next Admission Contract — run 43757790420](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43757790420): FAILED, 45/49 tests passed, 4 failed.
- [Pool Contract Validation — run 43757790396](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43757790396): SUCCESS, 7/7 steps.

Failure causes were isolated from the job log: the fake pagination matcher accidentally matched the `per_page=100` query value, and three assertions used synchronous expectations for promise-returning validation paths. These tests were corrected in later feature commits. The final feature head `f0ad25ce60e6ef052fcfeab31fb5deab06793f21` has no workflow run returned by the available commit-run lookup and no combined status contexts. Therefore current exact-head CI and the corrected 49-test suite are **NOT VERIFIED**. Do not infer success from the prior Pool Contract Validation run.

## Default-branch write incident and cleanup

A GitHub Contents API create call for the test file omitted the explicit feature-branch argument. This placed one test-only file on the default branch:
- accidental add commit: `bbc4da7ba1c06cde6c79d9216cdbdcae771ac6db`, message `test: verify GitHub API pagination and owner admission`.
- cleanup delete commit: `6507823e7ec27caa9b2621daef964dba2d4cf436`, message `chore: remove misplaced prototype test from default branch`.

The file was then recreated on the intended feature branch. Read-back on the default branch returns 404 for that test path, and the cleanup commit diff removes exactly that one file. Thus the default branch's current file tree no longer contains the accidental test file, but its HEAD/history did advance by these two commits. This was an execution deviation and must remain visible in the audit trail. No default supervisor/worker files were changed. The feature PR and documentation branch now compare as 2 commits behind the default branch due to this add/delete history; merge base remains the previous default HEAD. Reconcile this ancestry before any merge.

## Execution and security boundaries

- No live API token was read or used by this adapter; tests use an injected fake fetch implementation.
- No live ledger comment was written to Issue #96.
- No trusted-main workflow wrapper, issue_comment trigger, production concurrency group, or live controller invocation was added.
- No workflow dispatch, Gemini child run, provider call, secret access, paid fallback, or deployment occurred.
- The API adapter is not proof of a production-secure controller.

## Status

- API adapter source: SUCCEEDED as authored and read back.
- Fake API tests: corrected after a failed first CI run; final exact-head execution NOT VERIFIED.
- Pool Contract Validation: SUCCESS on intermediate head only.
- Final exact-head CI: NOT VERIFIED.
- Live trusted-main integration: NOT IMPLEMENTED.
- Cloud Pool-native controller: NOT IMPLEMENTED / NOT QUALIFIED.
- Gemini dispatch: NOT RUN / NOT VERIFIED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next bounded step

First reconcile the two default-branch history commits with PR #97 and the documentation branch without rewriting or force-pushing history. Then obtain exact-head CI evidence for `f0ad25ce60e6ef052fcfeab31fb5deab06793f21`. Only after that, implement a trusted-main wrapper that provides a real repository-wide Actions concurrency lock and calls the verified API adapter, still with dispatch hard-disabled. Do not wire a live issue_comment trigger until the wrapper, governance, no-secret probe and independent review are verified.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## CI reconciliation addendum — 2026-11-15

The latest feature head `f0ad25ce60e6ef052fcfeab31fb5deab06793f21` subsequently received exact-head workflow runs:
- [Cloud Pool Next Admission Contract — run 43758033223](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43758033223): COMPLETED / SUCCESS; job `contract` SUCCESS; syntax checks and all 49 Node tests passed (49 pass, 0 fail).
- [Pool Contract Validation — run 43758033182](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43758033182): COMPLETED / SUCCESS; all 7 steps passed, including worker-dispatch-disabled and YAML/security invariants.

This supersedes the earlier statement that exact-head CI was NOT VERIFIED. The earlier intermediate failure run 43757790420 remains part of the audit trail and was corrected before the exact-head successful runs. Combined status contexts remain empty and formal PR reviews remain 0 / NOT VERIFIED.
