# 2026-11-08 — default-branch versus reusable Worker boundary recheck

Date: 2026-11-08 (Europe/Vilnius)  
Scope: Read-only comparison of the current default-branch Supervisor workflow against PR #37's proposed reusable Supervisor/Worker boundary, plus fresh review and exact-head CI reconciliation.  
Disposition: STATIC REVIEW ONLY / NOT INDEPENDENT / NOT QUALIFIED. No dispatch, deployment, remote D1, provider/model calls, secrets access, or paid resources.

## Immutable targets and live refs

- Repository: `VlDMlNSh/developer-cloud-pool`.
- Default branch: `Основной`.
- Default HEAD re-read: `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- Default Supervisor workflow blob: `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`.
- PR #37 branch: `feat/reusable-pool-worker-boundary-2026-11-06`.
- PR #37 head re-read from the prior live reconciliation and commit endpoint: `5587a4e013507b5be330fd0c49ce1fc836faa946`.
- PR #37 Worker workflow blob: `4f57e8eef4a40d14b8d1df467cfac07e39e490a2`.
- PR #37 Supervisor workflow blob: `4a176e5ebb3cf1e7ef29b00164498e34a4f9fafc`.
- PR #37 Supervisor script blob: `2d0611851ff738b2aeb377f464e5fa7d821f3696`.
- Existing execution-receipt/fenced-claim design contract blob: `435534e4c02e62e19758428611eee9941ec85abc`.

## Fresh CI evidence for PR #37

- Reusable Pool Worker Boundary Validation run `42284051309`, job `128122653104`: COMPLETED / SUCCESS. Steps included exact-PR-head checkout, Supervisor syntax check and authorization-boundary tests.
- Pool Contract Validation run `42284051311`, job `128120184802`: COMPLETED / SUCCESS. Steps included workflow YAML parsing, security-contract validation and explicit assertion that worker dispatch remains disabled.
- Combined commit-status endpoint returned an empty status list; named workflow-run/job evidence above is the available evidence. Do not reinterpret an empty status list as additional checks.
- These tests validate their bounded static/contract scope. They do not prove GitHub Actions runtime availability of `job.workflow_*`, race safety, claim provenance, execution receipts, remote D1 or production behavior.

## Findings

### R1 — Default branch still contains the legacy privileged Supervisor chain

The default-branch workflow blob `d4bd23d...` still declares:
- `workflow_run` trigger for completion of Pool Worker;
- workflow-level `actions: write`;
- job-level `issues: write`;
- a scheduled and manual Supervisor entrypoint.

This is the currently published default-branch source, not the proposed PR #37 boundary. The live value of `POOL_DISPATCH_ENABLED` was not read in this pass; therefore no claim is made that the legacy dispatch path is currently executing. Keep it disabled and do not dispatch.

### R2 — PR #37 removes the privileged workflow_run chain but is not merge-ready

The proposed Supervisor workflow removes `workflow_run` and `actions: write`, calls a local reusable Worker and gives the Worker read-only issue access. This is a meaningful least-privilege improvement over the current default-branch workflow.

However, the PR remains OPEN / DRAFT / UNMERGED. Its Worker source still evaluates `job.workflow_repository`, `job.workflow_file_path` and `job.workflow_sha` in job-level `jobs.validate.env`. Runtime availability is not established. Move these values to a supported step-level environment and add a runtime identity integration test before closing F1.

### R3 — Finalizer is still label-only

The PR #37 Finalizer reads the Issue and checks only that `pool:claimed` is present before changing labels and posting a comment. It does not validate a durable claim ID, task-wide attempt, claim owner, envelope digest, approval ID, worker run/run_attempt, generation, fencing token or structured execution receipt.

GitHub Issue labels/body PATCH/read-back are not compare-and-swap. This does not satisfy the immutable claim-bound finalization contract. F2 remains OPEN.

### R4 — Independent review remains absent

Fresh review-list read-back:
- PR #36: 3 submissions, all by `maxkorolskiy88-ship-it`, all COMMENTED.
- PR #37: 4 submissions, all by `maxkorolskiy88-ship-it`, including CHANGES_REQUESTED and COMMENTED.
- PR #39: 3 submissions, all by `maxkorolskiy88-ship-it`, all COMMENTED.

No APPROVED review and no second reviewer identity was present. The submissions are not independent organizational review. Reviewer authority and independence remain NOT VERIFIED.

### R5 — The protocol remains a design contract

The immutable execution-receipt/fenced-claim contract remains DESIGN / NOT IMPLEMENTED. Task-wide single-active-attempt uniqueness across distinct approvals, lease/reclaim, monotonic fencing, durable outbox consumer lifecycle, receipt provenance, idempotent Finalizer and recovery are not integrated into the production Supervisor/Worker path.

## Permissions and write boundary

The connected GitHub repository metadata currently reports `admin=true` and `push=true` for the linked identity. This permits documentation updates on the designated working branch, but it does not confer independent-review authority or authorize changing secrets, variables, rulesets, dispatch, deployment or production resources.

## Actions in this pass

- Read-only re-read of repository metadata, branches, current context/checkpoint, PR review submissions, PR #37 source blobs and named workflow jobs.
- No source/workflow/runtime/config/secret/variable/ruleset/dispatch changes.
- No tests executed locally; CI evidence is limited to the named PR #37 runs above.
- No Worker/Supervisor/DSH/Resource Probe execution, remote D1 provisioning, deployment or provider/model request.

## Decision and next sequence

1. Keep default-branch dispatch fail-closed; do not merge PR #37 or promote its branch based on green static CI.
2. Obtain an authorized, genuinely independent reviewer for the immutable protocol/threat model and PR #36/#37/#39, recording exact target SHAs and reviewer authority.
3. On an isolated implementation branch, correct F1 and prove caller/callee identity at runtime.
4. Replace label-only claim/finalization with the selected conditional-write authority, task-wide uniqueness, lease/fencing, durable receipt, idempotent finalizer and recovery.
5. Run exact-SHA regression tests and only then separately qualify a free/card-free remote backend under approved governance.

Contour A: BLOCKED / NOT QUALIFIED / NOT ACCEPTED.  
Contour B: DEFERRED.  
Dispatch: KEEP DISABLED / FAIL-CLOSED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
