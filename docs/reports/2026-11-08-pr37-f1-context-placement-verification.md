# 2026-11-08 — PR #37 F1 workflow identity context correction

Date: 2026-11-08  
Scope: Reconcile the Worker reusable-workflow identity context placement on PR #37, inspect official GitHub Actions context documentation, and verify exact-head bounded CI.  
Disposition: CONTEXT PLACEMENT CORRECTED IN DRAFT PR / STATIC TESTS VERIFIED / HOSTED RUNTIME IDENTITY NOT VERIFIED.

## Immutable target

- Repository: `VlDMlNSh/developer-cloud-pool`.
- PR #37: `feat: replace privileged workflow_run supervisor with reusable worker`.
- Base SHA: `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- Exact PR head: `1be8672c1be1a720b6c813dcafff5c020b6456ae`.
- PR branch: `feat/reusable-pool-worker-boundary-2026-11-06`.
- Worker workflow blob: `04d63d815d2f7d15cfa80c932b614d559385ff0a`.
- Boundary test blob: `9667f4cab3d9312425e6818fc1e8bc8fb5b3419c`.
- Contract validator blob: `5bc08d827b0fcbbcc1c3a036fd0dd201bdacff35`.
- PR remains OPEN / DRAFT / UNMERGED.

## F1 finding and correction

The reusable Worker needs to distinguish the caller workflow identity (`github.workflow_ref`, `github.workflow_sha`) from the reusable callee identity (`job.workflow_repository`, `job.workflow_file_path`, `job.workflow_sha`).

The current PR head places the three `job.workflow_*` references in the step-level `env` block for the validation step, not the job-level `env` block. The Node validator and boundary test explicitly reject job-level placement and assert step-level mapping.

GitHub's current official Contexts reference documents the four `job.workflow_*` properties and says the job context is accessible from any step. It also demonstrates use of these properties inside a reusable workflow. Source: https://docs.github.com/en/actions/reference/workflows-and-actions/contexts

The same worker checks:
- caller repository ID against the configured repository ID;
- caller workflow ref against the protected default-branch Supervisor path;
- callee repository and workflow file path;
- caller/callee workflow SHA equality;
- task issue state and exactly one managed label equal to `pool:claimed`;
- target SHA and worker profile against the issue envelope.

This is a static contract correction, not proof that GitHub-hosted runtime context values were observed in a live Worker invocation. The PR validation workflow only runs syntax and static Node tests; it does not invoke the protected Supervisor/Worker execution path.

## Exact-head CI

- Reusable Pool Worker Boundary Validation run `42484039940`: COMPLETED / SUCCESS, exact head `1be8672c1be1a720b6c813dcafff5c020b6456ae`.
- Job `128741929176`: COMPLETED / SUCCESS.
- Retrieved job log: 9/9 Node tests passed, 0 failed; Supervisor syntax check passed.
- Pool Contract Validation run `42484039932`: COMPLETED / SUCCESS on the same PR head.
- Workflow URL: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42484039940

## Review and boundaries

- PR #37 remains OPEN / DRAFT / UNMERGED.
- Reviews remain from `maxkorolskiy88-ship-it`; latest submission CHANGES_REQUESTED. Independent reviewer identity and approval are NOT VERIFIED.
- No live Worker invocation, dispatch, provider request, DSH install, secret read, remote D1 operation, deployment, or paid resource was performed in this pass.
- F1 is corrected at source/static-contract level, but hosted runtime identity is NOT VERIFIED.
- F2 remains open: finalization still relies on `pool:claimed` rather than a durable claim ID bound to the specific Worker run, attempt, target envelope digest, approval, generation and fencing token.
- F3–F10 remain open/not qualified except F11's pure planner fix on PR #29 branch. F9 supply-chain closure and F10 stale completion remain unresolved.
- Dispatch must remain disabled/fail-closed. Do not merge draft PRs on these bounded CI results.

## Decision / next step

F1: STATIC CONTEXT PLACEMENT CORRECTED / EXACT-HEAD TESTS VERIFIED / HOSTED RUNTIME NOT VERIFIED.  
Contour A: BLOCKED / NOT QUALIFIED / NOT ACCEPTED.  
Contour B: DEFERRED.

Next: define and implement F2's durable claim-bound execution receipt and fencing contract, then test stale/duplicate/foreign Worker completion against a synthetic state store. Obtain independent authorized review before merge or runtime enablement.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
