# Pass 88 — non-dispatch owner /next API provenance proof

Date: 2026-11-25
Status: IMPLEMENTED / CI VERIFIED (synthetic, no-provider tests) / NOT VERIFIED (live event API path) / BLOCKED (Contour A acceptance)

## Frozen target and scope

- Default branch: `Основной`.
- Frozen target SHA: `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- Implementation branch: `feat/pass88-owner-next-api-audit-proof-2026-11-25`.
- PR: #174, OPEN / DRAFT / UNMERGED.
- Final PR head: `5ec1e3663683e1ad7c64e9548d2f65e10d14de7f`.
- Compare: 8 commits ahead / 0 behind; merge base equals frozen target SHA.
- Scope: API-backed, read-only, non-dispatch owner `/next` event provenance audit plus fake-input adversarial tests and static workflow contract assertions.
- Exclusions: no durable admission/receipt/outbox/lease, no provider calls, no D1, no dispatch, no secrets/variables inspection, no deployment, no merge, no governance mutation.

## Implementation

Files changed in PR #174:
- `.github/workflows/owner-next-event-audit.yml`
- `.github/workflows/pool-contract-validation.yml`
- `scripts/owner-next-event-audit.mjs`
- `scripts/owner-next-event-audit.test.mjs`
- `scripts/validate-pool-contract.mjs`

The new issue-comment workflow is triggered only for `issue_comment.created`, then narrows execution to Issue #96, non-PR comments and exact `/next`. It uses a short-lived `github.token` with only `contents: read`, `issues: read`, `actions: read`; checkout has `persist-credentials: false`; external Actions are pinned to full commit SHAs. The token is used only for GitHub REST read requests and is never printed or persisted.

The verifier independently reads:
- repository metadata and numeric repository/owner IDs;
- Issue #96 and its non-PR status;
- the source issue comment by numeric ID, exact body, author numeric ID and OWNER association;
- the current Actions run by run ID, attempt, event, workflow path, repository ID and actor;
- workflow metadata by workflow ID/path/state;
- current default branch ref and SHA.

The pure verifier returns `OBSERVED_ONLY` only when the source and run envelope match. It explicitly returns `admission: NOT_CREATED` and `dispatch: NOT_AUTHORIZED`. It rejects run attempts other than 1 because no durable rerun reconciliation exists yet.

No third-party dependency was added. Reuse First: Node.js built-in `fetch`, `node:test`, existing pinned `actions/checkout` and `actions/setup-node`, and the repository's Pool Contract Validation workflow.

## Verification evidence

- Exact-head Pool Contract Validation run: [45675656378](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45675656378), run number 873, COMPLETED / SUCCESS on PR head `5ec1e3663683e1ad7c64e9548d2f65e10d14de7f`.
- Job: `139422380969`, COMPLETED / SUCCESS.
- Log confirms all six workflow YAML files parse; `POOL_CONTRACT_VALIDATION=PASS`.
- Node test output: 19 tests, 19 passed, 0 failed. Coverage includes exact valid owner event and rejection of wrong issue, PR comment, non-owner, missing OWNER association, non-exact body, edited event, repository/comment/sender identity mismatch, wrong workflow path/event, run ID/attempt mismatch, rerun, wrong actor/repository, untrusted branch and stale SHA.
- Combined commit-status endpoint returned no status contexts; the exact-head Actions run above is the concrete CI evidence. Do not imply every possible required check is green.
- Source, tests, workflows and validator were fetched back from the implementation branch after writes.
- Local clone/test attempt was NOT RUN: container network could not resolve github.com. GitHub-hosted CI supplied the actual test evidence instead.
- PR #174 formal reviews: 0; review threads: 0; remains DRAFT and UNMERGED.
- The audit workflow itself was NOT triggered from default branch; PR code does not execute on owner issue comments until merged. No live API provenance run was performed.

## Security limits and residual risks

1. This proves the pure envelope predicate under synthetic fixtures and the CI static contract. It does not yet prove the live GitHub API response shape for issue_comment runs.
2. No durable idempotency receipt, transactional admission, repository-wide lease/fencing, outbox or ambiguous-dispatch reconciliation exists in this PR.
3. Workflow reruns (attempt > 1) fail closed rather than recover; separate controller-run replay is not handled.
4. Current default branch governance is NOT VERIFIED in this pass. Issue #1 has historical evidence of ruleset #26550182 being active, PR-required, zero approvals and no required status contexts; that historical snapshot is not a current ruleset read-back. The current dispatch variable was not read.
5. Workflow API metadata/path and run `head_sha` assumptions must be validated by a real no-dispatch issue_comment event after a protected default-branch installation; until then the live path is NOT VERIFIED.
6. No CODE runtime, Claude Code + ECC + FCC qualification, quota accounting, UI, persistence, artifact ingest or independent acceptance was attempted.

## Repository and governance snapshot

- Default HEAD remains `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- PR #174 is clean-base: 8 ahead / 0 behind; OPEN / DRAFT / UNMERGED.
- PR #169 remains OPEN / DRAFT / UNMERGED, head `884775c60fa6a8646a91052e410297326d8a04f1`, base `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9` (diverged).
- PR #170 remains OPEN / DRAFT / UNMERGED, head `40281787c208af2df916f10af1dba073061ff0d3`, same old base (diverged).
- PR #171 remains OPEN / DRAFT / UNMERGED, head `423da55ca1e2d91c28572f88f60b494b59d56e9e`, same old base (diverged).
- The documentation working branch remains separate from the implementation branch and default branch.
- Issue #1 is the governance gate for protecting `Основной`; current effective ruleset read-back unavailable in this pass. Issue #140 is the D1 admission/lease proof chain, not the branch governance issue.

## Tests, agents and metrics

- Automated exact-head CI: 1 observed workflow SUCCESS.
- Adversarial Node tests: 19/19 PASS.
- YAML parsing: six workflow files PASS.
- Pool Contract Validation: PASS.
- Live issue_comment API audit: NOT RUN.
- Gemini Agents 1–3/optional 4: NOT RUN.
- Claude Code + ECC + FCC: NOT RUN.
- Secret values read: 0; stored secret/variable values were not inspected. The workflow only uses the platform-generated short-lived `github.token` for scoped API reads.
- Provider calls, D1 writes, dispatch, deployment, merge, production writes and governance changes: NOT RUN.
- Active engineering time: NOT MEASURED. Local clone attempt was blocked by network DNS; do not count wall-clock duration as engineering effort.

## Decision and next step

Pass 88 produces a useful read-only provenance verifier and adversarial CI evidence. It is not an admission controller and does not authorize any execution.

Contour A remains BLOCKED / NOT ACCEPTED. Contour B remains DEFERRED.

Next bounded step: after independent review of PR #174 and a current governance read-back, install the audit workflow only through an approved protected-default-branch process and run one real owner-authored Issue #96 event with no admission or dispatch. Then implement durable source-comment receipt + single-use lease/fencing + outbox/reconciliation as a separate no-dispatch proof, with crash/replay tests. Do not enable dispatch.

Canonical MediaHub map (deferred): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
