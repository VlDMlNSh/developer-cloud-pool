# PR #37 reusable workflow identity contract review — 2026-11-06

## Scope and immutable targets

- Repository: `VlDMlNSh/developer-cloud-pool`.
- Default branch `Основной`: `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- PR #37: OPEN / DRAFT / UNMERGED; branch `feat/reusable-pool-worker-boundary-2026-11-06`; head `5587a4e013507b5be330fd0c49ce1fc836faa946`; base `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- Tracking issue #38: durable single-use Supervisor claims.
- Review scope is source/contract analysis only. No workflow dispatch, Worker, DSH, Resource Probe, model/provider call, secret access or deployment.

## Exact-head CI evidence

For PR #37 head `5587a4e013507b5be330fd0c49ce1fc836faa946`:
- Reusable Pool Worker Boundary Validation run `42284051309`, job `128109201815`: COMPLETED / SUCCESS. Read-back steps: checkout exact PR head, pinned Node 24.9.0, Supervisor syntax check, authorization boundary tests.
- Pool Contract Validation run `42284051311`, job `128109179508`: COMPLETED / SUCCESS. Read-back steps: checkout, dispatch-disabled assertion, YAML parsing, pool security contract.
- Formal reviews: 0. Inline review threads: 0. Independent review: NOT RUN.

## Source review — reusable workflow identity

PR #37 changes the Worker from externally dispatchable `workflow_dispatch` to `workflow_call`, removes the privileged `workflow_run` Supervisor trigger, sets workflow-level permissions to empty, scopes Supervisor issue write to the reconcile/finalize jobs, and gives the reusable Worker read-only issue/content permissions.

The Worker compares:
- caller identity: `github.repository`, `github.repository_id`, `github.workflow_ref`, `github.workflow_sha`;
- callee identity: `job.workflow_repository`, `job.workflow_file_path`, `job.workflow_sha`;
- fixed repository ID, expected Supervisor path on `refs/heads/Основной`, expected Worker path, and equal caller/callee workflow SHA.

The GitHub Actions official contexts reference documents all four `job.workflow_*` identity properties and describes them as the workflow file defining the current job; it documents `github.workflow_ref` / `github.workflow_sha` as the current workflow run's workflow identity. GitHub's reusable-workflow documentation says the `github` context remains associated with the caller. The PR's caller/callee split is therefore aligned with the documented context model:
- https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#job-context
- https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#github-context
- https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations

A known tooling caveat: actionlint 1.7.12 was reported not to recognize the documented `job.workflow_*` properties (upstream issue https://github.com/rhysd/actionlint/issues/757). The current PR #37 validation workflow does not run actionlint; its successful YAML/custom-contract tests do not prove hosted expression evaluation. Do not misclassify the properties as undocumented or invalid, but add a supported linter version / compatibility note if actionlint is later introduced.

## Remaining authorization blockers

1. PR #37 is not merged. The default branch still contains the older Supervisor `workflow_run` trigger with `issues: write` and `actions: write`, plus the Worker `workflow_dispatch` entrypoint. The proposed reduction is not live.
2. Issue #38 documents that Issue label PATCH is not compare-and-swap. Supervisor concurrency serializes that workflow only; it does not prevent another actor/workflow from changing labels. Read-back detects some races but is not an atomic one-winner primitive.
3. PR #37's exact-head CI is static validation. It does not execute the live authorization chain, prove durable single-use claims, or authorize dispatch.
4. Latest recorded live Ruleset audit in Issue #38: active Ruleset #26550182 on `refs/heads/Основной`, required approvals 0, CODEOWNERS review false. This pass did not independently re-query the Ruleset API; treat the recorded audit as the latest evidence, not a fresh check.
5. Both `POOL_DISPATCH_ENABLED` and `POOL_AUTHORIZATION_CONTRACT_ACCEPTED` must remain fail-closed. No current value is freshly re-read in this pass.

## Durable claim candidates — disposition retained

- A. Serialized Supervisor + issue labels: useful defense-in-depth, not sufficient atomic claim authority.
- B. Dedicated state repository + immutable refs: possible isolated authority, but requires narrow Contents: write credential, immutable claim lifecycle and delete/recreate resistance qualification.
- C. D1 conditional-write store: strongest technical candidate based on local Workers-runtime proof (12-way contention, one winner), but account-specific Free/card-free entitlement, live resource, authenticated approval issuer, server-derived owner identity/clock, audit, quota and recovery remain unqualified.
- Keep candidate C in bounded qualification only; no production integration, resource provisioning or dispatch is authorized by this analysis.

## Result

- Documented GitHub context-property contract: VERIFIED from official documentation.
- PR #37 exact-head static CI: VERIFIED (2/2).
- Hosted caller/callee expression runtime: NOT RUN.
- Independent security review: NOT RUN.
- Durable production single-use claim: NOT QUALIFIED.
- Default-branch Supervisor/Worker dispatch boundary: BLOCKED pending merge/review and claim qualification.
- Contour A: BLOCKED / NOT QUALIFIED / NOT ACCEPTED. Contour B: DEFERRED.

## Next bounded step

Continue Issue #38 candidate C qualification without provisioning: review the D1 proof against the required production issuer/owner/time/restore threat model, then define the minimum isolated live contention test and exact non-secret entitlement evidence. Keep both dispatch gates fail-closed until independent review and real-backend one-winner tests pass.

Canonical context: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/github-context-window-2026-11-06/docs/context/GITHUB-CONTEXT-WINDOW.md
Checkpoint: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/github-context-window-2026-11-06/docs/checkpoints/2026-11-06-cloud-pool-next-checkpoint.md
MediaHub canonical map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
