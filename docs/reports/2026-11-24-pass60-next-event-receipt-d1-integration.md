# Pass 60 — D1 integration tests for GitHub /next source-comment receipt

Date: 2026-11-24  
Status: **VERIFIED — local D1 integration tests and exact synthetic merge CI**  
Contour A: **NOT ACCEPTED**  
Contour B: **DEFERRED**

## Frozen inputs and scope

- Default branch `Основной` HEAD: `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`
- Pass 59 PR #170 head: `4946f9c6656aef4d7bb75fddc552b4045f1ccd73`
- Final PR #170 head: `9a61572dca2a6621001a1bae770e8d85a5d93315`
- Exact synthetic merge SHA used by both final workflows: `73adf651c32882d0d57f339ac6eb8e5e1c41cfbd`
- PR #170 remains OPEN / DRAFT / UNMERGED.
- Scope: add direct local Workers/D1 integration tests for the Pass 59 `admitGitHubNextEvent` composition and durable source-comment receipt. No production implementation or migration changes.

## Reuse First

**REUSE:** existing Cloudflare Workers Vitest integration (`@cloudflare/vitest-plugin@1.4.7`, `vitest@4.1.12`), local Miniflare/workerd D1, migration suite, canonical `admitQualifiedTask`, `canonicalTaskKey`, and `pool_task_delivery_outbox`.

**ADAPT:** the synthetic approval/route seed fixture from the existing atomic-admission tests and narrow D1 fault-injection wrappers for pre-commit failure, lost acknowledgement, partial readback and unavailable primary readback.

**BUILD:** one new integration test file. No external dependency, new ledger, schema migration, provider SDK or second test harness.

## Tests added

New file: `proofs/d1-ledger/test/github-next-event.integration.test.ts` (248 lines).

Seven integration tests cover:

1. **Success + exact replay + conflicting admission:** complete receipt persists once; exact retry returns the existing receipt; attempting a different admission ID for the already-consumed source event fails closed. Attempt and receipt counts remain one.
2. **Rerun provenance conflict:** same source-comment digest with a different run ID/attempt cannot silently rewrite immutable run provenance; returns `SOURCE_COMMENT_IDENTITY_CONFLICT`.
3. **Write-before-commit failure:** injected receipt insert failure leaves no receipt; the same immutable admission is recovered on retry without creating a second attempt.
4. **Commit with lost acknowledgement:** receipt insert commits, then the test wrapper throws; primary-first readback reconciles the already-recorded receipt.
5. **Partial readback:** a deliberately incomplete read result is rejected as `SOURCE_COMMENT_READBACK_MISMATCH`; a later complete read recovers the existing receipt.
6. **Primary readback unavailable:** committed receipt cannot be confirmed while primary reads fail; returns `SOURCE_COMMENT_OUTCOME_UNCONFIRMED`; a later healthy retry reconciles it.
7. **Broken canonical chain:** after a synthetic admission, removing its task-ready outbox tuple causes replay to fail with `ADMISSION_COMMIT_RECEIPT_MISMATCH`; no source receipt is created.

All scenarios assert that the resulting path does not authorize dispatch or execution. These are synthetic local D1 tests; fault wrappers simulate acknowledgement/read failures and do not prove Cloudflare hosted-D1 failure semantics.

## Validation evidence

Both final workflows completed SUCCESS on the same exact synthetic merge SHA `e05736b720599e56c30d3dcc46975029da2e6921`.

- D1 Ledger Proof run [45271582467](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45271582467): **SUCCESS**, 8 test files, 107/107 tests. The new integration file reports 7 passing tests. Dependency install and inert Worker check passed.
- Pool Contract run [45271582448](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45271582448): **SUCCESS**, workflow YAML/security invariants passed, `POOL_CONTRACT_VALIDATION=PASS`.
- Both job logs explicitly checked out `e05736b720599e56c30d3dcc46975029da2e6921`.
- Existing Node.js 20 deprecation warnings remain for pinned checkout/setup-node action revisions while the runner executes Node 24; non-blocking and not modified in this pass.

## Diff and governance

- One new test path; +248 lines relative to Pass 59 candidate.
- PR #170: 38 files, +7,655 / -0; 25 commits ahead / 0 behind frozen default.
- Formal reviews: 0; review threads: 0.
- Ruleset full detail was not re-read in this pass; prior recorded ruleset ID `26550182` must be rechecked before any merge.
- PR remains DRAFT / UNMERGED. No merge attempted.

## Residual NOT VERIFIED

- No live default-branch `issue_comment` controller.
- No cryptographic GitHub event authentication or independent GitHub API ref read.
- No hosted D1, production D1 concurrency/failure qualification, executor identity attestation, trusted production clock, worker launch, provider routing, quota enforcement, web UI or phone/desktop qualification.
- No independent formal review or acceptance.
- The source-comment receipt write remains a second phase after canonical admission, not a single atomic transaction. Recovery is tested locally but does not establish distributed/hosted failure semantics.

## Safety boundary

No secrets/variables values read. No Gemini controller dispatch, Claude/server dispatch, provider calls, hosted D1, deployment, merge, production mutation or runtime activation. All adapter results remain non-authorizing.

## Metrics

- New test files: 1.
- New integration cases: 7.
- D1 suite: 107/107.
- Pool Contract: PASS.
- Exact merge CI: 2/2 SUCCESS.
- New dependencies: 0.
- Active engineering time: **NOT MEASURED**; no timer/telemetry was available.
- Defects found in this pass: no CI failures observed. The new tests establish local behavior for the listed cases; they do not close hosted runtime or event-authenticity gaps.


## Additional trust-boundary finding — GitHub Actions SHA semantics

Official GitHub documentation distinguishes the event SHA from the workflow-file SHA:
- For `issue_comment`, `GITHUB_SHA` is the last commit on the default branch and `GITHUB_REF` is the default branch; the workflow file must exist on the default branch for the event to trigger: [GitHub event trigger reference](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#issue_comment).
- `github.workflow_sha` is separately defined as the commit SHA for the workflow file: [GitHub contexts reference](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts).

Therefore the current binder's strict `workflowSha === targetSha` equality is **not a generally valid GitHub invariant**. Pass 60 did not silently alter the implementation because this is a trust-contract change requiring a dedicated review. Treat this as a Pass 61 high-priority correction: bind the event target SHA and workflow-code SHA as separate provenance fields, then define and test the trusted relationship between them using the default-branch workflow identity and an independently verified ref/commit policy. Until corrected and tested, the binder is a local predicate proof only and is not ready to become a live controller.

## Next — Pass 61

Audit the complete admission/receipt trust boundary and close remaining test gaps without enabling dispatch:
1. verify SQL uniqueness under duplicate source-comment ID with a distinct immutable admission envelope;
2. test the receipt INSERT trigger against forged approval/admission/task/attempt/route/outbox/commit-receipt bindings;
3. test missing route and missing commit receipt independently;
4. test exact source receipt field-by-field immutability and repository-scoped key assumptions;
5. inspect whether the binder's assumed `GITHUB_SHA` / `GITHUB_WORKFLOW_SHA` equality is valid for the intended future `issue_comment` workflow and document a trusted target-ref strategy before controller creation.
6. Keep one canonical ledger, no live workflow/controller and no dispatch.

Links:
- [PR #170](https://github.com/VlDMlNSh/developer-cloud-pool/pull/170)
- [Issue #140](https://github.com/VlDMlNSh/developer-cloud-pool/issues/140)
- [Issue #96](https://github.com/VlDMlNSh/developer-cloud-pool/issues/96)
- [Context Window](../context/GITHUB-CONTEXT-WINDOW.md)
