# Wave 343 — GitHub ledger adapter prototype

Date: 2026-11-15

## Result

Added a fail-closed, dependency-injected GitHub ledger adapter prototype and fake-API tests on the isolated PR #97 branch. The adapter reads and appends digest-checked records on control Issue #96, re-reads after ambiguous append failures, and reconciles a single visible Actions run by deterministic display_title plus immutable head_sha. It never dispatches a workflow.

## Immutable refs and PR state

- Cloud Pool default branch: Основной; observed HEAD remains 9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc.
- Feature branch: feat/cloud-pool-next-admission-contract-2026-11-15.
- Draft PR #97, base 9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc, current head b98787604ae53dee5464b49400658e17915f8a9e; OPEN / DRAFT / UNMERGED.
- Formal PR reviews: 0. Combined status contexts: empty / NOT VERIFIED.
- Issues #94 and #96 re-read OPEN.

## Changes

- scripts/next-github-ledger-adapter.mjs, blob aa343e4cf10ca1d8b0608957caba5b9ea9fe9956.
- test/next-github-ledger-adapter.test.mjs, blob 13489d07c902827d151a2c059ddc3b2432128b8b.
- .github/workflows/next-admission-contract.yml, blob 7e94970cb9b13312f272a898f71bdeb1dd788762.

The adapter requires a caller-held repository-wide lock, validates and parses Issue #96 ledger comments, appends ADMITTED and DISPATCH_INTENT records, and re-reads after a timed-out append before returning a recovered or ambiguous result. For existing DISPATCH_INTENT, it lists runs and matches exact display_title plus head_sha; one run reconciles, duplicates raise INCIDENT, and no visible run remains AMBIGUOUS_NO_RETRY.

Important limitation: this is an injected adapter prototype, not a live GitHub client binding. The workflow does not yet invoke it. No real Actions concurrency lock, issue_comment trigger, live ledger writes, workflow dispatch, Gemini children, secrets or provider calls were enabled. Dispatch remains fail-closed.

## CI evidence

Initial run exposed a reconciliation ordering defect and a wrong assumption about Actions run metadata; three adapter tests failed. The source was corrected to inspect visible workflow runs for existing intent and match GitHub's display_title.

On exact head b98787604ae53dee5464b49400658e17915f8a9e:
- Cloud Pool Next Admission Contract — run 43757112894: COMPLETED / SUCCESS; all steps passed, including the 36-test suite.
- Pool Contract Validation — run 43757112913: COMPLETED / SUCCESS; all 7 steps passed.
- Formal review: 0 / NOT VERIFIED.
- Combined status contexts: empty / NOT VERIFIED.

Read-back verified all three file blobs listed above on the feature branch. No changes were made to default branch.

## Supplementary Gemini bridge

The MediaHub Issue #301 /next bridge is separate from Cloud Pool-native dispatch. No Cloud Pool controller run ID, child run IDs, artifacts or digests were produced or verified in this pass. Gemini execution: NOT VERIFIED.

## Status

- Adapter prototype and fake-API tests: SUCCEEDED.
- Exact-head CI: SUCCEEDED.
- Live GitHub adapter invocation: NOT IMPLEMENTED.
- Real serialized concurrency and issue_comment admission: NOT IMPLEMENTED.
- Cloud Pool-native controller: NOT IMPLEMENTED / NOT QUALIFIED.
- Gemini dispatch: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next bounded step

Build the trusted-main workflow wrapper that supplies the actual GitHub API adapter and repository-wide Actions concurrency lock, while retaining a hard no-dispatch boundary. Add event-level integration tests for exact owner-only Issue #96 comments and run-list pagination/visibility. Do not enable dispatch until governance, no-secret probe and independent review gates are verified.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
