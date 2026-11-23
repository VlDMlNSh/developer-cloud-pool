# Pass 61 — separate GitHub event and workflow SHA provenance

Date: 2026-11-24  
Status: **VERIFIED — local Workers/D1 suite and exact synthetic merge CI**  
Contour A: **NOT ACCEPTED**  
Contour B: **DEFERRED**

## Frozen inputs and scope

- Default branch `Основной` HEAD: `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`
- PR #170 pre-pass head: `9a61572dca2a6621001a1bae770e8d85a5d93315`
- PR #170 final head: `4b4055b4f2026db617f1e2f686f337ad85e9531e`
- Exact synthetic merge SHA: `9171489be9232a3c3389fef215904f5ade25a5ea` (verified through GitHub commit lookup and both final job logs).
- PR #170 remains OPEN / DRAFT / UNMERGED.
- Scope: correct the invalid equality assumption between event target SHA and workflow-file SHA, preserve both values in immutable receipt provenance, and validate using the existing Workers/Vitest D1 harness.

## Reuse First

**REUSE:** existing Cloudflare Workers Vitest harness, local Miniflare/workerd D1, migration runner, event binder and receipt integration tests.  
**ADAPT:** existing event context fixture to use separate, valid SHA values and verify their persistence.  
**BUILD:** no new runtime, dependency, migration number, ledger or controller. One additive correction to migration 0017 plus binder/test updates.

## Changes

1. `bindGitHubNextEvent` now validates `context.sha` as the event/default-ref target SHA and validates `context.workflowSha` independently as a 40-character lowercase hexadecimal workflow-file SHA. It no longer requires the two to be equal.
2. Exact workflow identity remains constrained by the expected `workflowRef` on `refs/heads/Основной`.
3. Migration 0017 no longer imposes `workflow_sha = target_sha`; both immutable fields remain stored and included in the canonical event digest/readback.
4. Unit tests now cover different valid target/workflow SHAs, malformed workflow SHA rejection, and distinct values in the bound context.
5. Integration fixture now uses distinct values and exercises persistence/readback through local D1.

## Validation

- D1 run [45273084680](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45273084680): **SUCCESS**, 8/8 test files, 108/108 tests.
- Pool Contract run [45273084714](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45273084714): **SUCCESS**.
- D1 job log checked out exact synthetic merge: `9171489` (merge of PR head `4b4055b4f2026db617f1e2f686f337ad85e9531e` into frozen default `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`).
- New test file result: 26/26 unit cases; integration suite remains 7/7.
- No new dependencies. Four files changed: source binder, migration 0017, unit test, integration test.
- Diff relative to pre-pass head: 4 files; +12 / -6.

## Trust boundary — important remaining qualification

This pass corrects the invalid equality constraint; it does **not** prove the workflow SHA is authentic or that the workflow code at that SHA is the intended trusted controller. The binder receives context values and checks shape/expected ref; it does not independently call GitHub APIs or verify commit ancestry/file content.

Before any live controller:
- read the current default branch ref independently through GitHub API and compare it with the event target SHA under an explicit race policy;
- verify the exact workflow file path and content at `workflowSha`;
- establish that `workflowSha` is an ancestor of the event target SHA on the trusted default branch (or define a more precise GitHub-supported workflow identity policy);
- pin the expected workflow content digest / approved revision;
- test wrong owner/repository/issue/ref/workflow, stale target SHA, unexpected workflow SHA, replay and rerun.
- Keep event SHA, workflow SHA, workflow ref, run ID and run attempt as separate immutable provenance fields.

The current binder remains a local predicate proof, **not** a cryptographic event authenticator or a deployable controller. No live workflow/controller was created.

## Governance and safety

- PR #170: OPEN / DRAFT / UNMERGED; formal reviews 0; review threads 0.
- Ruleset `26550182` re-read: active on `refs/heads/Основной`; PR required; review-thread resolution required; 0 approvals configured; deletion and non-fast-forward prohibited; no bypass actors; current user cannot bypass.
- PR #168 remains historical D1 source lineage; do not merge #168 and #170 together. PR #169 remains documentation/process.
- No secrets/variables values read; no Gemini/Claude dispatch; no hosted D1; no provider calls; no deployment; no merge; no production mutation.
- No SQL adversarial matrix expansion in this pass; duplicate-key/forged-insert/missing-route/missing-commit-receipt cases remain open for a subsequent bounded pass.

## Metrics

- Test files: 8/8 PASS.
- Tests: 108/108 PASS.
- Pool Contract: PASS.
- Exact synthetic merge CI: 2/2 SUCCESS.
- Dependencies added: 0.
- Files changed: 4.
- Active engineering time: **NOT MEASURED**.
- CI failures in final target: 0.
- Contour A: **NOT ACCEPTED**. Contour B: **DEFERRED**.

## Next

Next pass: SQL receipt adversarial tests — duplicate source-comment ID with a distinct envelope; forged INSERT bindings; independently missing route and commit receipt; field-by-field immutability and repository-scoped key assumptions. Continue to keep dispatch disabled and do not create a live controller.

Links:
- [PR #170](https://github.com/VlDMlNSh/developer-cloud-pool/pull/170)
- [Issue #140](https://github.com/VlDMlNSh/developer-cloud-pool/issues/140)
- [Issue #96](https://github.com/VlDMlNSh/developer-cloud-pool/issues/96)
- [Pass 60](./2026-11-24-pass60-next-event-receipt-d1-integration.md)
- [Context Window](../context/GITHUB-CONTEXT-WINDOW.md)
- [MediaHub canonical map](https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md)

## CI correction history

- An intermediate run on commit `f4b818ddb791251359401f051774e137c3a029e2` failed 1/107 tests because the old negative test still expected a different-but-well-formed workflow SHA to be rejected. This was an obsolete assertion after the intended semantic correction, not a runtime regression. The test was replaced with malformed-SHA rejection plus a positive distinct-SHA case.
- The final exact target run `45273084680` passed 108/108 tests; Pool Contract `45273084714` passed. An intermediate Pool Contract run was cancelled after the next commit. No failures remain on the final target.
