# 2026-11-05 — contract-validator fix for local reusable workflows

## Immutable target and branch state
- Canonical branch: `Основной`, verified base/merge-base SHA: `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Working branch: `feat/reusable-worker-call-boundary-2026-11-05`; NOT canonical.
- PR #12: OPEN / DRAFT / NOT MERGED; latest implementation HEAD at report creation: `ef4de08e12d5a22adf0df19b61a35886c72d03f4`.
- Compare: 23 commits ahead / 0 behind; merge base equals canonical SHA.
- PR URL: https://github.com/VlDMlNSh/developer-cloud-pool/pull/12

## Exact-head validation failure investigated
- Pool Contract Validation run: [42023131061](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42023131061), terminal FAILURE.
- Failed job: `127230605028`, step `Validate pool security contracts`.
- Job logs prove:
  - `POOL_DISPATCH_ENABLED=false` was present in this run's environment.
  - All seven workflow YAML files parsed successfully.
  - Caller authorization unit tests: 8 passed, 0 failed.
  - Static validator failed only because it classified the local reusable workflow reference `./.github/workflows/reusable-worker-context-fixture.yml` as an external action that must be pinned to a 40-character commit SHA.
- The separate non-privileged reusable context fixture run [42023131365](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42023131365), job `127230606746`, completed SUCCESS.

## Bounded corrective change
- Updated `scripts/validate-pool-contract.mjs` to exempt only static local workflow references matching `./.github/workflows/<file>.yml|yaml` from the external action SHA-pinning assertion. External actions still require a full 40-character SHA.
- Existing fixture-specific assertions continue to require a static local caller reference, `workflow_call`, no `workflow_dispatch`, no secrets, read-only permissions, bounded timeout and the caller/callee identity fields.
- A second adjustment aligned the positive “all external Actions pinned” summary predicate with that local-workflow exception.
- Latest commit: `ef4de08e12d5a22adf0df19b61a35886c72d03f4`.
- Validator blob SHA after read-back: `a69714d87553d14b00cd0c0c3e3df89586136960`.
- Previous validator blob: `f027bcbd637d840292232281c75c10bf4886fe88`.
- Read-back of the updated validator: VERIFIED.
- Commit link: https://github.com/VlDMlNSh/developer-cloud-pool/commit/ef4de08e12d5a22adf0df19b61a35886c72d03f4

## CI and review status after correction
- GitHub API queries for runs associated with latest implementation HEAD and latest PR merge SHA returned empty workflow-run arrays at the time of this report.
- Corrected validator has NOT YET been executed by GitHub Actions; exact-head/merge-result CI for `ef4de08e12d5a22adf0df19b61a35886c72d03f4`: NOT VERIFIED.
- PR #12 reviews list is empty; independent security review: NOT RUN.
- PR remains DRAFT. No merge or acceptance.

## Governance and safety
- Repository Ruleset ID `26550182` was independently re-read and is ACTIVE.
- The workflow run above observed `POOL_DISPATCH_ENABLED=false`; this is run-scoped evidence, not a direct read-back of the current repository variable.
- Canonical Worker and Supervisor remain unchanged; Worker still exposes `workflow_dispatch`, and Supervisor still uses REST workflow dispatch. Caller validator is not wired into production.
- Gemini controller availability, third-host Claude route, and current variable value are NOT VERIFIED in this pass.
- Worker, DSH, Resource Probe, browser, provider/model calls and privileged dispatch: NOT RUN.
- Paid fallback: NOT USED. Runtime: NOT QUALIFIED.

## Next bounded step
1. Obtain a new CI run for the corrected latest PR merge result and inspect job logs.
2. If green, continue with a static, non-privileged authorization design review; do not wire production until independent review validates caller identity and approval provenance.
3. Refactor Worker/Supervisor only as a separately reviewed package: Worker `workflow_call` only; no Worker `workflow_dispatch`; static reusable invocation; no REST dispatch; preserve one-time approval consumption and bounded matrix.
4. Keep all dispatch/runtime gates closed.

## Canonical and working references
- Canonical branch: https://github.com/VlDMlNSh/developer-cloud-pool/tree/%D0%9E%D1%81%D0%BD%D0%BE%D0%B2%D0%BE%D0%B9
- Working branch: https://github.com/VlDMlNSh/developer-cloud-pool/tree/feat/reusable-worker-call-boundary-2026-11-05
- Governance issue #1: https://github.com/VlDMlNSh/developer-cloud-pool/issues/1
- Browser runtime issue #5: https://github.com/VlDMlNSh/developer-cloud-pool/issues/5


## Follow-up — corrected validator CI result
- Corrected PR head `8387dccf556f03194aabcf032c9579c7b9a1bf51`, base `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Pool Contract Validation run [42023631278](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42023631278): COMPLETED / SUCCESS; job `127232286449`.
- The run's PR association records exact head SHA `8387dccf556f03194aabcf032c9579c7b9a1bf51`; workflow is `pull_request` and uses the GitHub PR merge result checkout semantics. Classify as **PR merge-result CI PASS associated with exact PR head**, not a direct branch-only checkout.
- Job logs: `POOL_DISPATCH_ENABLED=false`; all seven workflow YAML files parsed; caller unit tests 8 passed / 0 failed; static validator emitted `POOL_CONTRACT_VALIDATION=PASS`; external Actions SHA pin assertion passed.
- Reusable Worker Context Fixture Caller run [42023631355](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42023631355): COMPLETED / SUCCESS; job `127232286911`.
- This qualifies the static validator correction and fixture only. It does not qualify the production Worker/Supervisor authorization boundary.
- PR #12 reviews remain empty; independent security review NOT RUN; PR remains DRAFT.
- Ruleset `26550182` detail re-read: ACTIVE, selector exactly `refs/heads/Основной`, PR required, no bypass actors, current-user bypass `never`; required approval count is 0 and CODEOWNERS review is disabled. This protects the default branch from direct pushes but does not provide an independent security-review gate.
- Branch compare at this read: 26 commits ahead / 0 behind; merge base canonical SHA unchanged. Current branch HEAD at verification: `8387dccf556f03194aabcf032c9579c7b9a1bf51`.


## Final checkpoint-head CI — 2026-11-05
- Latest pre-documentation code/report checkpoint HEAD `317a6a81294feb334f7a63d61da6ec2789914a85`.
- Pool Contract Validation run [42023792304](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42023792304): COMPLETED / SUCCESS; job `127232831663`.
- Reusable Worker Context Fixture Caller run [42023792334](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42023792334): COMPLETED / SUCCESS; job `127232832106`.
- Contract job logs for exact PR head `317a6a81294feb334f7a63d61da6ec2789914a85`: `POOL_DISPATCH_ENABLED=false`; seven YAML files parsed; Node tests 8/8 pass; external action SHA pin check passed; `POOL_CONTRACT_VALIDATION=PASS`.
- Classification: PR merge-result CI PASS associated with exact PR head. The job's successful terminal status and all steps are verified; this remains static CI, not production authorization or runtime qualification.
- PR #12 still OPEN / DRAFT / NOT MERGED; independent security review NOT RUN.
