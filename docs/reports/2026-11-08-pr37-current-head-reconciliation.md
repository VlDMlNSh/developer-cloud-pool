# 2026-11-08 — PR #37 current-head reconciliation (Supervisor → reusable Worker)

Status: PARTIAL REMEDIATION VERIFIED BY STATIC CI; END-TO-END WORKER / FINALIZER NOT QUALIFIED

## Immutable target and current refs

- Repository: `VlDMlNSh/developer-cloud-pool`
- PR #37: https://github.com/VlDMlNSh/developer-cloud-pool/pull/37
- Current PR state: OPEN / DRAFT / UNMERGED; mergeable=true at read time.
- Base: `Основной` @ `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- Current head branch: `feat/reusable-pool-worker-boundary-2026-11-06`.
- Current head SHA: `1be8672c1be1a720b6c813dcafff5c020b6456ae`.
- Previously audited head: `5587a4e013507b5be330fd0c49ce1fc836faa946`.
- Worker workflow blob at current head: `04d63d815d2f7d15cfa80c932b614d559385ff0a`.
- Supervisor workflow blob at current head: `4a176e5ebb3cf1e7ef29b00164498e34a4f9fafc`.

## F1 — reusable workflow context placement

The previously audited head `5587a4e...` placed `job.workflow_repository`, `job.workflow_file_path` and `job.workflow_sha` in `jobs.validate.env`. GitHub rejected that workflow on the exact head in run `42284042173` (failure; jobs API returned no jobs).

At current head `1be8672...`, the three `job.*` expressions are moved into the step-level `env` of “Validate caller/callee and claimed task”. They are no longer in the job-level `env`. This is a source-level remediation of the reported context-placement defect.

Exact-head validation:
- [Reusable Pool Worker Boundary Validation run 42484039940](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42484039940): COMPLETED / SUCCESS; job `128741929176`; steps included checkout exact PR head, pinned Node.js, Supervisor syntax check and authorization boundary tests.
- [Pool Contract Validation run 42484039932](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42484039932): COMPLETED / SUCCESS; job `128741928922`; workflow YAML parse, dispatch-disabled assertion and contract validator succeeded.

Limit: these are static/boundary validations. They do NOT invoke the reusable Worker from a permitted Supervisor event, do not prove the GitHub Actions runtime resolves the three `job.*` properties as expected, and do not execute DSH. F1 is therefore SOURCE-REMEDIATED / STATIC-CI-VERIFIED; live reusable invocation remains NOT RUN.

## F2 / F10 — Finalizer stale-state and audit consistency remain open

Current Supervisor blob `4a176e5...` still shows the Finalizer:
1. GETs the Issue and checks only that `pool:claimed` is present.
2. Chooses a terminal label from `needs.worker.result`.
3. PATCHes labels to replace managed states.
4. GETs again and checks terminal label / absence of claimed and ready.
5. Separately POSTs an audit comment.

No immutable task-attempt identity, lease generation, claim owner, exact Supervisor run/attempt binding, canonical envelope digest, or version/CAS condition is visible in this Finalizer path. A read-before-write check does not close the race with task edits/closure or a different claimant. Terminal label PATCH and audit comment POST remain separate operations, so a successful state transition followed by failed comment creation can leave incomplete audit evidence (F10). Read-back confirms a projection, not atomic durable finalization.

These findings remain open; no claim is made that the issue was modified in this pass.

## Review / governance

- PR #37 reviews re-read: multiple CHANGES_REQUESTED and COMMENTED submissions by `maxkorolskiy88-ship-it`; no APPROVED review observed.
- This account's identity/authorization as an independent organizational approver remains NOT VERIFIED. Repeated reviews by the same reviewer are not multiple independent reviewers.
- PR #37 remains draft and unmerged. Do not merge on static CI alone.
- Dispatch gates remain fail-closed; no worker dispatch, DSH, resource probe, provider/model call, remote D1, secret read or deployment was performed.

## Next bounded work

1. Design a single immutable task-attempt/finalization record binding repository/task, target SHA, envelope digest, approval/issuer, claim ID/owner, Supervisor run ID + attempt, Worker run identity, lease generation and result digest.
2. Make terminal transition and audit event idempotent and recoverable from ambiguous/lost responses; GitHub labels/comments should be projections, not the sole authoritative record.
3. Add negative tests for closed/edited/conflicting task, stale run, old generation, duplicate result and failure between terminal transition and audit append.
4. Re-run exact-head CI on the new source SHA; keep dispatch disabled until governance and target-environment gates pass.

Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
