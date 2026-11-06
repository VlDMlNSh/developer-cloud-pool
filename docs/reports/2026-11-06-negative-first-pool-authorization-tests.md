# 2026-11-06 — Negative-first production authorization test harness

## Immutable target and provenance
- Repository: `VlDMlNSh/developer-cloud-pool`.
- Production baseline: default branch `Основной` at `64d2636d4500127e635c214ccfb722c6b3fcda80` (baseline recorded in current canonical project context).
- Design/test branch: `design/integrated-pool-authorization-contract-2026-11-06`.
- Integrated contract blob: `ce42dd0095ca67166b9872b50ecaa90373b2e8ac`.
- Negative-first test file: `tests/security/pool-authorization-contract.test.mjs`.
- Test file final blob: `c482c9921774261e97de6aaa5beae3c5a7a4659b`.
- Test file update commit: `52151b23669f7b37a8c4d61c17a0bf61ba86f426`.
- Initial test commit: `856588e73e33f459ad22100e512b07cf107ce25f`; parser correction and local reusable-workflow syntax correction were applied afterward.

## Production baseline read-back
- Worker workflow blob `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`: `workflow_dispatch` remains; no `workflow_call` event; report job grants `issues: write` and mutates task labels/comments.
- Supervisor workflow blob `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`: privileged `workflow_run` trigger remains and top-level `actions: write` remains.
- Supervisor script was read from default branch; it still uses REST Worker dispatch and returns expired claims to `pool:ready`. Script blob in canonical context: `52bf03ca889edd92fd10c71ae96a2e35e106d43f`.
- These are source-level observations; no workflow was executed.

## Test harness scope
Seven Node.js built-in tests inspect the actual production workflow/script files:
1. Worker is reusable-workflow-only (`workflow_call`, no `workflow_dispatch`).
2. Worker has no Issues write permission.
3. Worker has no issue-mutation implementation.
4. Supervisor has no privileged `workflow_run` trigger.
5. Supervisor does not grant Actions write permission.
6. Supervisor calls Worker as a statically declared local reusable workflow and does not use REST workflow dispatch.
7. Supervisor does not requeue expired/failed claims to `pool:ready`.

The tests are deliberately negative-first: the current production source violates multiple assertions. They are placed on an isolated design branch and do not alter production workflows.

## Verification and limitations
- GitHub create/read-back of the test file: VERIFIED; final blob SHA above.
- Test execution: NOT RUN. The repository CI workflow has not been wired to this isolated design branch, and no Actions workflow was dispatched.
- Test outcomes are therefore NOT VERIFIED; do not claim a red/green CI result.
- No production source changed; no PR created; no merge.
- No workflow dispatch, Worker/DSH runtime, secrets, repository variables, Environment/ruleset, provider/model calls, paid services or deployment.
- Independent security review: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

## Next bounded step
Wire this test file into a dedicated read-only CI job on the design branch (or an isolated PR) with no privileged permissions, execute it against the immutable production baseline and capture expected failures. Then implement one coherent remediation behind those tests. Do not enable dispatch or merge.
