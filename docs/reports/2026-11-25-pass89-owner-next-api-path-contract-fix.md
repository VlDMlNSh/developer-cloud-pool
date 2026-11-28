# Pass 89 — независимая проверка API provenance PR #174

Дата: 2026-11-25

## Цель и границы

Проверить PR #174 после Pass 88, повторно сверить refs/PR/issues/CI/governance и исправить один подтверждённый дефект в интерпретации GitHub Actions REST API. Проход ограничен безопасной проверкой происхождения события; admission, outbox и dispatch не реализуются.

- Frozen target default SHA: `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- Implementation branch: `feat/pass88-owner-next-api-audit-proof-2026-11-25`.
- PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/174
- Initial reviewed head: `5ec1e3663683e1ad7c64e9548d2f65e10d14de7f`.
- Final head after bounded correction: `a8809c1dc8c2eaa49944fb031baeec54ce46b922`.
- Compare final head to frozen target: 10 commits ahead / 0 behind; merge base equals frozen target; five changed files, 215 additions, zero deletions.

## Revalidation snapshot

- Default base SHA remained `565404f84b6b86afb4dc2d8fa939341f42df6eca` as recorded by PR #174 base metadata.
- PR #174: OPEN / DRAFT / UNMERGED; formal reviews 0; review threads 0; merge not performed.
- PR #169: OPEN / DRAFT / UNMERGED, head `726b1ac0ec5884177079a54c0108ca76f167e0a9`, based on old `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`.
- PR #170: OPEN / DRAFT / UNMERGED, head `40281787c208af2df916f10af1dba073061ff0d3`, same old base.
- PR #171: OPEN / DRAFT / UNMERGED, head `423da55ca1e2d91c28572f88f60b494b59d56e9e`, same old base.
- Issue #96 remains OPEN and PLANNED; it explicitly prohibits dispatch until trusted provenance, durable idempotency, governance, exact-head CI and other qualification gates pass.
- Issue #94 and #140 remain OPEN. #140 is D1 admission/lease proof, not branch governance.
- Issue #1 is the governance gate. Current ruleset read-back and current `POOL_DISPATCH_ENABLED` value were NOT VERIFIED in this pass. Historical Issue #1 statements are not current proof.
- Available GitHub workflow-run connector returns only PR-triggered runs; no new final-head run was returned at the time of this checkpoint. Final-head CI therefore remains PENDING / NOT VERIFIED. Prior-head run #45675656378 is not evidence for corrected head.

## Finding F89-01 — REST workflow path includes branch suffix

The official GitHub REST API workflow-run response example represents `path` as `.github/workflows/build.yml@main`, not just the YAML path. Source: https://docs.github.com/en/rest/actions/workflow-runs?apiVersion=2022-11-28

PR #174 originally required:
`workflowRun.path === ".github/workflows/owner-next-event-audit.yml"`.

That exact comparison rejects the documented API response format and would cause a legitimate workflow run to fail closed. Synthetic fixtures had omitted the documented branch suffix, so the prior 19 tests did not expose it.

### Correction

- The verifier now requires `workflowRun.path === EXPECTED_WORKFLOW_PATH + "@" + repository.default_branch`.
- The workflow metadata endpoint's `workflow.path` remains checked against the bare workflow file path.
- Test fixture now uses `.github/workflows/owner-next-event-audit.yml@Основной`.
- Added negative tests for a missing branch suffix and a path bound to a different branch.
- Total adversarial tests: 21 (one positive + 20 rejection cases); exact-head CI confirms 21 passed / 0 failed.
- Read-back verified corrected source and test blobs:
  - script blob: `26a842e50ae4239996ec2c95a4969b291e63d266`
  - test blob: `71ead8a42e6de77afd7093145dcaa7756efef965`

## Reuse First

No new dependency is warranted for this API-shape correction. Retain Node built-in `fetch`, `node:test`, and the existing pinned GitHub Actions. This avoids dependency and supply-chain expansion for a simple response-contract fix. The GitHub REST documentation is the authoritative API contract used for this correction.

## Verification and limitations

- GitHub PR metadata read-back confirms final head `a8809c1dc8c2eaa49944fb031baeec54ce46b922`.
- GitHub compare confirms 10 ahead / 0 behind and exact frozen merge base.
- Corrected source and test files were fetched again from the branch and their blob SHAs recorded above.
- Previous exact-head run #45675656378 / job #139422380969 passed 19/19 tests on superseded head `5ec1e3663683e1ad7c64e9548d2f65e10d14de7f`. It is historical evidence only.
- Corrected final-head CI VERIFIED: Pool Contract Validation run #45677997233, job #139430608357, completed SUCCESS on exact head `a8809c1dc8c2eaa49944fb031baeec54ce46b922`. Job log confirms six workflow YAML files parsed, `POOL_CONTRACT_VALIDATION=PASS`, and 21/21 Node tests passed (0 failed).
- Live `issue_comment` audit on default branch: NOT RUN; PR is unmerged.
- Current branch ruleset and current dispatch variable: NOT VERIFIED.
- No secret values read, D1 writes, provider calls, child dispatch, production writes, deployment, merge, or governance mutation.
- Gemini roles: NOT RUN because approved controller/gates are not qualified. Claude Code + ECC + FCC: NOT RUN.
- Independent review: NOT RUN. Repository owner previously deferred external reviews until the pool can perform its own bounded review; no review request was sent.
- Active engineering time: NOT MEASURED. No invented time estimate.

## Disposition

PR #174 remains Draft. Do not merge until corrected final-head CI, owner-authorized review sequencing, current governance and full controller gates are verified. The PR remains audit-only: `OBSERVED_ONLY`, admission not created, dispatch not authorized.

Contour A: BLOCKED / NOT ACCEPTED.
Contour B: DEFERRED.

## Next bounded step

Obtain exact-head CI evidence for `a8809c1dc8c2eaa49944fb031baeec54ce46b922`; inspect the workflow-run API payload shape and logs. Then continue a current-base traceability/integration pass for durable source-comment idempotency and outbox reconciliation, still with dispatch disabled.

Canonical MediaHub map (deferred): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
