# 2026-11-08 — F1 reusable Worker context-scope correction

Date: 2026-11-08  
Scope: Verify GitHub Actions context availability for PR #37 and correct the placement of reusable-workflow identity expressions.  
Disposition: F1 JOB-ENV CONTEXT-SCOPE DEFECT FIXED IN PR BRANCH / EXACT-HEAD CI VERIFIED / NOT MERGED / HOSTED IDENTITY VALUES NOT RUNTIME-QUALIFIED.

## Finding and authoritative platform contract

The PR #37 Worker referenced `job.workflow_repository`, `job.workflow_file_path` and `job.workflow_sha` from `jobs.<job_id>.env`.

GitHub's current context-availability table explicitly allows the `job` context in `jobs.<job_id>.steps.env`, but does not list it for `jobs.<job_id>.env`. The expressions were therefore placed in an unsupported context location. This is narrower and more precise than saying the `job.workflow_*` properties themselves are unavailable.

GitHub announced the four reusable-workflow source-identity properties on 2026-09-03. The current docs define:
- `job.workflow_ref`: defining workflow ref;
- `job.workflow_sha`: defining workflow commit SHA;
- `job.workflow_repository`: defining workflow repository;
- `job.workflow_file_path`: defining workflow file path.

These properties are not available on GitHub Enterprise Server. This project targets GitHub.com. References:
- https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#context-availability
- https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#job-context
- https://github.blog/changelog/2026-09-03-github-actions-early-september-2026-updates/

## Immutable target and correction

- Repository: `VlDMlNSh/developer-cloud-pool`.
- PR #37: https://github.com/VlDMlNSh/developer-cloud-pool/pull/37
- Branch: `feat/reusable-pool-worker-boundary-2026-11-06`.
- Base: `Основной` at `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- Final exact PR head: `1be8672c1be1a720b6c813dcafff5c020b6456ae`.
- Worker workflow blob: `04d63d815d2f7d15cfa80c932b614d559385ff0a`.
- Boundary test blob: `9667f4cab3d9312425e6818fc1e8bc8fb5b3419c`.
- Pool contract validator blob: `5bc08d827b0fcbbcc1c3a036fd0dd201bdacff35`.

The three `job.workflow_*` values were moved from job-level `env` into the specific validation step's `env`. Caller properties continue to be sourced from `github.workflow_ref` and `github.workflow_sha`. The Worker still compares caller and callee SHA and enforces repository ID, repository name, callee path, task state, target SHA and profile.

Regression tests and the pool contract validator now explicitly assert that the `job.workflow_*` expressions are present in step-level env and absent from job-level env.

## Exact-head verification

Final PR head `1be8672c1be1a720b6c813dcafff5c020b6456ae`:
- Pool Contract Validation run `42484039932`: COMPLETED / SUCCESS.
- Reusable Pool Worker Boundary Validation run `42484039940`: COMPLETED / SUCCESS.
- Boundary job `128741929176`: COMPLETED / SUCCESS; log summary: 9 tests, 9 pass, 0 fail.
- Contract job `128741928922`: COMPLETED / SUCCESS.
- YAML parsing and `node scripts/validate-pool-contract.mjs` completed successfully in the contract job.
- Workflow URLs:
  - https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42484039932
  - https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42484039940
- Worker, test and validator files were re-read from GitHub at final head; blob SHAs matched expected values.

Intermediate attempts on earlier commits failed because the newly added static assertions had malformed regular-expression syntax / an over-escaped validator expression. Those failures were inspected in full logs, corrected, and superseded by the two successful final exact-head runs above. They are not represented as passing.

## Remaining limitations

- PR #37 remains OPEN / DRAFT / UNMERGED.
- The final CI proves YAML, static policy checks and 9 boundary tests. It does not prove that the hosted runner supplies the expected non-empty `job.workflow_*` values at runtime, that caller/callee SHA equality is true for a real protected default-branch invocation, or that end-to-end authorization is secure.
- A safe runtime identity-only probe is still needed before production use. It must log only non-secret identity fields and fail closed; it must not enable dispatch or run the DSH probe.
- Reviews on PR #37 remain from the same account `maxkorolskiy88-ship-it`; no independent authorized reviewer approval was observed.
- No Worker dispatch, DSH install, provider request, secret/credential read, remote D1, deployment or paid resource was used in this pass.
- Default branch remains unchanged and still contains legacy Supervisor `workflow_run` trigger with `actions: write`. Keep dispatch disabled.
- F2 and other F3–F10 qualification issues remain open/not qualified.

## Decision and next step

F1 is narrowed and corrected at the expression-scope level in PR #37. Exact-head CI is VERIFIED. Runtime identity behavior remains NOT VERIFIED; PR remains draft and must not be merged on this evidence alone.

Next: prepare a strictly read-only hosted GitHub Actions identity probe on a non-dispatching workflow, with no DSH/provider execution and no secrets output; obtain independent review; then continue F2 durable claim/fencing/receipt/finalizer/recovery.

Contour A: BLOCKED / NOT QUALIFIED / NOT ACCEPTED.  
Contour B: DEFERRED.  
Dispatch: KEEP DISABLED / FAIL-CLOSED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
