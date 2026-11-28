# Pass 69 — non-dispatch owner /next intake workflow

Date: 2026-11-24
Status: IMPLEMENTED on an isolated feature branch; CI and runtime NOT VERIFIED.
Contour A: IN PROGRESS / NOT ACCEPTED. Contour B: DEFERRED.

## Target and scope

Target base SHA: `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9` (`Основной`).
Feature branch: `feat/next-event-intake-nondispatch-pass69`.
PR #171 head after validator update: `423da55ca1e2d91c28572f88f60b494b59d56e9e`.
PR #171: OPEN / DRAFT / UNMERGED; base `Основной`; 2 files changed, 74 additions.
D1 PR #170 remains OPEN / DRAFT / UNMERGED at `7d900d9fe11b19f048548a3bed657b2549f8091f`. This pass does not alter PR #170.

Scope: add an inert `issue_comment.created` intake workflow for exact owner `/next` requests on Issue #96 and extend the existing pool contract validator to assert its non-dispatch/security properties.

## Reuse First

Used native GitHub Actions `issue_comment` trigger, expression guards, runner environment and step summary; reused the repository's existing `scripts/validate-pool-contract.mjs` and `Pool Contract Validation` workflow. No external action, third-party package, new service, or second admission ledger added.

## Implementation

Added `.github/workflows/next-request-intake.yml`:
- Trigger: `issue_comment.created`.
- Job runs only when issue number is 96, the target is not a PR, comment author equals `github.repository_owner`, and body is exactly `/next`.
- Rechecks actor/owner, comment author, issue number, exact command and numeric comment ID in the shell using environment variables (untrusted body is not interpolated into shell source and is not echoed).
- Explicit `permissions: {}`.
- No checkout, external `uses:`, secrets, D1 writes, API calls, dispatch, worker invocation, or task execution.
- Writes an audit-only step summary: request observed; no task dispatched; execution authorization false.

Updated `scripts/validate-pool-contract.mjs`:
- Adds the new workflow to the existing workflow scan.
- Asserts empty permissions, no external actions, no secret/token references, no dispatch/write paths, exact owner/Issue #96/`/next` guard, and explicit observation-only status.

Important: this is an intake probe only. It does not create a D1 admission/receipt, authenticate a live workflow run, or authorize an executor. It becomes active only after it is merged to the default branch through normal governance. No merge performed.

## Verification

- Workflow readback: VERIFIED; blob `9402a803e21987b61813436647e43dac333c866c`.
- Validator readback: VERIFIED; blob `6f82878beabeb2c0a1f65dfa66dee1c7de253482`.
- PR diff readback: VERIFIED; exactly 2 paths, 74 additions, no deletions.
- PR #171 exact-head workflow runs: none returned.
- Combined commit statuses: empty.
- Exact-head CI: NOT VERIFIED (not observed as of this check).
- Local YAML/Node tests: NOT RUN (no local execution environment used).
- Reviews/review threads: 0 / 0.
- PR #171 remains DRAFT; no merge.
- Runtime trigger test: NOT RUN; no comment posted to activate it.

The existing Pool Contract Validation workflow is configured to run for PR changes under `.github/workflows/**` and `scripts/**`; its exact-head result must be checked again after GitHub schedules the run.

## Security and non-actions

- Token permissions are explicitly empty.
- No secrets/credential values read.
- No dispatch/provider calls, D1 mutation, deployment, production change, merge or branch protection change.
- No Gemini controller or Gemini dispatch created.
- No independent review performed; by project decision independent human review is post-launch before final ACCEPTED. Automated pre-launch gates remain mandatory.

## Metrics

- Files changed: 2.
- Additions: 74; deletions: 0.
- New dependencies: 0.
- Tests run locally: 0.
- CI exact-head: NOT VERIFIED.
- Active engineering time: NOT MEASURED.
- Main risks: workflow has not yet passed CI or been installed on default branch; event provenance and durable D1 admission remain future gates.

## Next

Pass 70: re-read PR #171 exact head and inspect exact-head Pool Contract Validation CI. If CI is absent, identify why without triggering owner comments or dispatch. Fix only evidence-backed failures. After CI success, continue design for authoritative GitHub run/workflow/blob/ref provenance and the D1 admission write path, still fail-closed. Do not merge without normal governance; do not enable dispatch.

Links:
- PR #171: https://github.com/VlDMlNSh/developer-cloud-pool/pull/171
- PR #170: https://github.com/VlDMlNSh/developer-cloud-pool/pull/170
- Issue #96: https://github.com/VlDMlNSh/developer-cloud-pool/issues/96
- Issue #140: https://github.com/VlDMlNSh/developer-cloud-pool/issues/140
- Context Window: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/engineering-excellence-2026-11-23/docs/context/GITHUB-CONTEXT-WINDOW.md
