# /next — GitHub Actions-bound D1 admission context audit — 2026-11-18

**Disposition:** SYNTHETIC CONTEXT COMPOSITION VERIFIED; PRODUCTION ADMISSION NOT QUALIFIED  
**Contour:** A only  
**Default branch:** `Основной`  
**Immutable default HEAD at pass start:** `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`  
**Candidate:** [PR #125](https://github.com/VlDMlNSh/developer-cloud-pool/pull/125), head `2ca95775982c711a289881e94eb664d5fe14ed5a`, stacked on PR #114 head `ab9461eb84b14fe230918391d5212f19ca25592c`.

## Scope

Review the new GitHub Actions context adapter over the D1 single-use admission proof, including exact-head CI, checkout provenance, event/ref assumptions and live-controller readiness. No merge, secret reads, live webhook, provider call, deployment or dispatch occurred.

## Exact-head CI evidence

| Workflow | Run / job | Result |
|---|---|---|
| D1 GitHub Actions Context Admission Proof | [44255849885](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44255849885) / [134637228939](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44255849885/job/134637228939) | SUCCESS |
| D1 GitHub Actions Context Adapter Validation | [44255841721](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44255841721) / [134637205479](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44255841721/job/134637205479) | SUCCESS |

Both jobs checked out the immutable PR head with checkout credentials persistence disabled, used read-only `contents: read`, installed locked dependencies with `npm ci --ignore-scripts`, passed syntax checks and ran the Workers-runtime suite. Each log reports 2 test files and 22 tests passed (22/22). Both check-runs point to candidate SHA `2ca95775982c711a289881e94eb664d5fe14ed5a`. The legacy combined-status endpoint had no status contexts; the successful check-runs above are the evidence used.

## What is verified

- The adapter binds Issue #96 comment metadata to runner variables for repository and owner identity, default-branch ref, workflow ref, target SHA, workflow SHA, run ID and run attempt.
- It requires a newly created top-level issue comment, exact body `/next`, expected repository and owner identity/association; it rejects PR issue payloads and identity/ref/profile mismatches.
- It derives target/trusted default SHA from `GITHUB_SHA`, controller code SHA from `GITHUB_WORKFLOW_SHA`, and controller run identity from `GITHUB_RUN_ID` plus `GITHUB_RUN_ATTEMPT`. Attempt is stored in the D1 receipt and replay digest.
- The composed proof retains `dispatch: false` and `executionAuthorized: false`.
- The result is a synthetic context-composition and local D1 test only; it does not authenticate a live webhook.

## Independent GitHub source verification

GitHub's official event documentation states that for `issue_comment`, `GITHUB_SHA` is the last commit on the default branch, `GITHUB_REF` is the default branch, and the workflow file must exist on the default branch for the event to trigger: [Events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#issue_comment).

The official variable reference documents `GITHUB_REPOSITORY_ID`, `GITHUB_REPOSITORY_OWNER_ID`, `GITHUB_RUN_ID`, `GITHUB_RUN_ATTEMPT`, `GITHUB_WORKFLOW_REF`, `GITHUB_WORKFLOW_SHA`, and `RUNNER_ENVIRONMENT`: [Variables reference](https://docs.github.com/en/actions/reference/workflows-and-actions/variables#default-environment-variables).

## Findings and blockers

1. **Production controller is absent from default branch.** Contents API returned 404 for `.github/workflows/cloud-pool-next-controller.yml` on `Основной`. Therefore the intended `issue_comment` event currently cannot trigger that controller. Live admission remains NOT IMPLEMENTED / NOT QUALIFIED.
2. **The adapter exposes an injectable environment argument.** `bindGitHubActionsContext(event, environment, ...)` and `admitGitHubActionsEvent(db, event, environment, ...)` accept the environment object as an argument. That is useful for tests; a production entrypoint must source it directly from runner process environment and obtain payload JSON from the runner event file, never from request/task/user input. No such trusted entrypoint is supplied by this PR.
3. **Hosted runner identity is not checked.** `GITHUB_ACTIONS=true` alone does not distinguish GitHub-hosted from self-hosted. The future controller must use a fixed trusted GitHub-hosted runner profile and preferably assert `RUNNER_ENVIRONMENT=github-hosted` before counting the run as free-tier hosted-worker qualification.
4. No live webhook signature validation or independent GitHub API re-read is proved.
5. Hosted D1, trusted approval issuer, lease/fencing/recovery, outbox delivery/reconciliation, worker identity, provider route/quota, egress isolation and real task execution remain NOT VERIFIED.
6. The approved Gemini controller `.github/workflows/gemini-batch-dispatch-controller.yml` is also absent from default branch (404); the owner-requested Gemini wave was NOT RUN. No alternate route was used.
7. Active ruleset #26550182 requires a PR and review-thread resolution but has zero required approving reviews and no required status checks. PR #125 has no formal review submission; independent A3 review remains mandatory by project policy.

## Repository and governance snapshot

- Default `Основной` HEAD: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`, unchanged.
- PR #125: OPEN / DRAFT / UNMERGED; head `2ca95775982c711a289881e94eb664d5fe14ed5a`; base PR #114 head `ab9461eb84b14fe230918391d5212f19ca25592c`.
- PR #124: OPEN / DRAFT / UNMERGED; head `65af2a72fa4301bc5cf4f111e9b7a620bcac310c`; base PR #120 head `67a0cb1b84f7829bb3fc95e8e9f88b509c401bc8`; architecture link validation run [44256001611](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44256001611) SUCCESS. Pool Contract Validation and independent review are not established by this check.
- PR #120: OPEN / DRAFT / UNMERGED, head at pass start `67a0cb1b84f7829bb3fc95e8e9f88b509c401bc8`; Architecture Documentation Validation [44094756333](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44094756333) and Pool Contract Validation [44094756250](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44094756250) SUCCESS.
- PR #116: OPEN / DRAFT / UNMERGED; runner qualification [44094382662](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44094382662) and Pool Contract Validation [44094382669](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44094382669) SUCCESS. This remains synthetic Claude mock/loopback qualification only.
- No secrets read, provider calls, agent task, live event, dispatch, merge or deployment occurred.

## Decision

- PR #125 context-composition layer: **VERIFIED** on exact candidate SHA.
- Live owner-only admission controller: **NOT IMPLEMENTED / NOT QUALIFIED**.
- Gemini dispatch: **NOT RUN**; approved workflow absent from default branch.
- Keep `POOL_DISPATCH_ENABLED=false`; CI success does not authorize merge/deployment/dispatch.
- Contour A: **BLOCKED / NOT ACCEPTED**. Contour B: **DEFERRED**.

## Next bounded step

Prepare a trusted default-branch controller entrypoint that reads runner-provided event payload and process environment directly, pins workflow ref and immutable default target, enforces GitHub-hosted runner identity, and still performs no child dispatch. Independently review live-event trust and hosted D1 contracts before any dispatch path is enabled.
