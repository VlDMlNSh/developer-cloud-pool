# Pass 68 — GitHub Actions provenance feasibility and controller-presence audit

Date: 2026-11-24
Status: VERIFIED for repository/source/CI metadata inspection; runtime provenance NOT VERIFIED.
Contour A: IN PROGRESS / NOT ACCEPTED. Contour B: DEFERRED.

## Decision and scope

Independent human review remains a post-launch qualification step before final Contour A ACCEPTED. It is not a prerequisite for continuing implementation or the initial launch sequence. Automated CI, security, governance, provenance and fail-closed controls remain pre-launch gates.

Pass 68 scope: re-read current refs and PRs; inspect the D1 event binder; check for the event controller and Gemini dispatch controller in both default and D1 candidate refs; inspect current available PR CI jobs; record the exact blocker and next implementation boundary.

Frozen refs:
- Default `Основной`: `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`.
- PR #170 head: `7d900d9fe11b19f048548a3bed657b2549f8091f`; base `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`; synthetic merge `8b1c674c6fd2bdfaae55868fe75c13c6919fd047`.
- PR #169 docs head: `d1c401dd6279f105b6bac5fdad267d65dd7594bf`.
- PR #170 remains OPEN/DRAFT/UNMERGED; PR #169 remains OPEN/DRAFT/UNMERGED.
- Issue #140 and #96 remain OPEN.

## Reuse First

Reuse the existing canonical D1 admission/receipt chain, pinned Vitest + Cloudflare Workers test harness, GitHub Actions run metadata and GitHub REST workflow-run/file APIs. No new dependency or second ledger is needed. GitHub's official event documentation states that issue_comment uses the last commit on the default branch as GITHUB_SHA and requires the workflow file to exist on the default branch. The REST workflow-run API exposes run metadata; the implementation should verify a run against authoritative repository/workflow/ref/event/commit metadata and the actual workflow blob at a policy-approved immutable ref. Sources:
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- https://docs.github.com/en/actions/reference/workflows-and-actions/contexts
- https://docs.github.com/en/rest/actions/workflow-runs

## Repository evidence

At both `Основной` and PR #170 head, GitHub Contents API returned NOT_FOUND for:
- `.github/workflows/next-event-controller.yml`
- `.github/workflows/gemini-batch-dispatch-controller.yml`

At PR #170 head, `proofs/d1-ledger/package.json` exists (blob `d970b887f52eb1011e3df74b560ad9a35bb25866`); at default it is absent. The event adapter at PR #170 head is blob `fdec14e9088fd1db186d0ee1541a6085ca84104a`. It validates caller-supplied context fields and returns BOUND, but its unit tests construct a synthetic valid context object. This verifies predicate behavior, not that a live GitHub Actions run or workflow file is authentic. No live controller exists at either inspected ref, so there is no actual workflow SHA or run to authenticate yet.

## CI and review evidence

PR #170 associated PR-triggered workflows:
- D1 run `45274455569`, job `138042499229`: SUCCESS. Steps include clean-base D1 migration/authority tests and inert Worker entrypoint check. Historical Pass 62 synthetic-merge evidence, not new Pass 68 execution.
- Pool Contract run `45274455577`, job `138042499753`: SUCCESS. Steps include workflow YAML parsing, security contract validation and assertion that worker dispatch remains disabled. Historical Pass 62 synthetic-merge evidence.
- Synthetic merge SHA: `8b1c674c6fd2bdfaae55868fe75c13c6919fd047`.
- PR #170 formal reviews: 0; review threads: 0.
- PR #169 head workflow query: no runs returned for `d1c401dd6279f105b6bac5fdad267d65dd7594bf`; documentation CI NOT VERIFIED.
- New tests run in Pass 68: 0.

## Technical conclusion

The current D1 event binder and append-only source-comment receipt are useful admission evidence but are not a trusted event-ingress controller. More importantly, neither the event controller workflow nor the Gemini batch dispatch controller exists at the inspected default or D1 candidate refs. Do not create an API verifier that assumes a workflow exists, and do not claim workflow provenance verification is implemented.

Next implementation must be staged:
1. Design a minimal `issue_comment` workflow contract with least-privilege permissions, exact owner/issue/comment checks, immutable action pinning, no secret exposure, and a hard non-dispatch default.
2. Establish the workflow's presence on default branch through the repository's normal reviewed PR path; no dispatch in this stage.
3. Only after it exists, add a verifier that fetches authoritative run metadata, workflow identity/path, event, ref, SHA and the workflow blob at the recorded workflow-code SHA; enforce a policy-pinned trusted workflow digest/ref and explicit default-ref race handling. Fail closed on missing, stale, inconsistent or unavailable reads.
4. Test adversarially with mocked API responses and then qualify in a non-production/no-dispatch runtime.
5. Keep Gemini dispatch NOT RUN until its own approved controller and gates exist. Do not bypass the required controller.

## Non-actions and metrics

- Code/schema/dependency changes: 0.
- Tests executed: 0.
- Historical CI runs inspected: 2.
- Secrets/credential values read: 0.
- Dispatch/provider calls/hosted D1/deployment/production mutation: 0.
- Merge/close: 0.
- Active engineering time: NOT MEASURED.
- Main blocker: controller workflow absent from default and PR #170; trusted event ingress cannot yet be verified.
- Governance/independent review: independent human review intentionally post-launch; pre-launch automated gates remain mandatory.

## Next

Pass 69: implement the minimal non-dispatch event-controller workflow contract only after Reuse First and explicit scope/DoD; add workflow syntax/security contract tests; keep all dispatch and execution authorization false. The workflow must be reviewed and merged through normal governance before any verifier/runtime work. Then implement the run/workflow/ref provenance verifier against the actual deployed workflow. Contour B remains deferred.

Links:
- PR #170: https://github.com/VlDMlNSh/developer-cloud-pool/pull/170
- PR #169: https://github.com/VlDMlNSh/developer-cloud-pool/pull/169
- Issue #96: https://github.com/VlDMlNSh/developer-cloud-pool/issues/96
- Issue #140: https://github.com/VlDMlNSh/developer-cloud-pool/issues/140
- Context Window: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/engineering-excellence-2026-11-23/docs/context/GITHUB-CONTEXT-WINDOW.md
