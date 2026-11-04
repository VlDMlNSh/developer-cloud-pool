# Live checkpoint — 2026-11-04: Worker dispatch authorization boundary

## Canonical refs
- Default branch `Основной` HEAD: `692025e4a039aaf94c6683bb95da38b4f324fce8`.
- Documentation branch: `docs/continuation-context-2026-11-04`.
- PR #7 branch: `fix/pool-owner-approval-guard-2026-11-04`.
- PR #7 head: `d60d26ae647940e702d646e572c861a8f68f523e`; 15 commits ahead of default, 0 behind.
- PR #7 state: OPEN / DRAFT / NOT MERGED.

## Blocking finding
The Supervisor-side owner approval guard is not sufficient because `.github/workflows/pool-worker.yml` remains identical on default and PR #7 (blob `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`). It still exposes `workflow_dispatch` and validates issue open state, `pool:claimed`, target SHA and profile, but does not independently prove trusted dispatch provenance or bind authorization to the current workflow run/attempt. Direct/manual Worker invocation remains an unresolved path.

## Evidence
- PR #7 exact-head static CI [41909811327](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/41909811327), job `126854055084`: COMPLETED / SUCCESS. This does not verify the Worker authorization boundary.
- Supervisor blob: `b2046dd9671c6bd5491f63a006d10239fbd3d3b1`.
- Approval tests blob: `c7c7499d9d2bb4c123e72b86adb85369023c4284`.
- Security finding recorded in [PR #7 comment](https://github.com/VlDMlNSh/developer-cloud-pool/pull/7#issuecomment-6641832357), comment ID `6641832357`.
- Formal REQUEST_CHANGES review API rejected submission because the PR author is the repository owner. Independent review therefore remains NOT RUN.
- Dated report: [Worker dispatch authorization boundary audit](../reports/2026-11-04-worker-dispatch-authorization-boundary-audit.md).

## Governance and runtime
- `POOL_DISPATCH_ENABLED`: NOT VERIFIED in this pass. No change made.
- Ruleset and SentinelX current state: NOT RECHECKED in this bounded pass; do not infer current state from historical snapshots.
- Worker, DSH, Resource Probe, browser, model/provider calls: NOT RUN.
- No secrets or provider credentials accessed.
- Pool deployment: NOT DEPLOYED.

## Required next step
Design and implement Worker-side authorization so manual/direct dispatch cannot enter the probe job. Authorization must be independently verifiable, bound to issue number + immutable target SHA + exact profile + workflow run/attempt, and not rely on a public label/comment as a secret capability. Verify GitHub event actor/provenance semantics before selecting the mechanism. Add positive Supervisor-path and negative direct/manual-dispatch tests. Keep dispatch disabled; do not run Worker. Then exact-head static CI and genuinely independent review.

## Canonical links
- [Default branch](https://github.com/VlDMlNSh/developer-cloud-pool/tree/Основной)
- [PR #7](https://github.com/VlDMlNSh/developer-cloud-pool/pull/7)
- [Issue #1 governance](https://github.com/VlDMlNSh/developer-cloud-pool/issues/1)
- [Issue #5 browser runtime](https://github.com/VlDMlNSh/developer-cloud-pool/issues/5)
- [Full project context](../context/DEVELOPER-CLOUD-POOL-CONTEXT.md)


## Worker authorization architecture decision — 2026-11-04
- Current default HEAD: `692025e4a039aaf94c6683bb95da38b4f324fce8`.
- PR #7 head: `d60d26ae647940e702d646e572c861a8f68f523e`; 15 ahead / 0 behind; OPEN / DRAFT / NOT MERGED.
- Worker workflow remains unchanged on default and PR #7: blob `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`; standalone `workflow_dispatch` still lacks caller provenance enforcement.
- Official GitHub docs verified: `workflow_dispatch` is manually/API-triggerable; reusable workflows use `workflow_call`; inside a reusable workflow the `github` context belongs to caller and `job.workflow_*` identifies the called workflow. This supports a provenance gate using exact protected caller ref plus called workflow identity.
- Preferred design: migrate Worker to `workflow_call`, and refactor Supervisor from script-level REST dispatch to a two-phase planner + statically declared reusable-workflow matrix job (bounded at 20). Validate caller `github.workflow_ref`/SHA and called `job.workflow_repository`, `job.workflow_file_path`, and SHA; revalidate task envelope and approval in Worker.
- This is a design recommendation only; NOT IMPLEMENTED. It requires an orchestration/recovery refactor because reusable workflows cannot be invoked dynamically from a Node script step.
- Rejected shortcuts: actor-only check (`github.actor` does not identify which workflow called); public issue labels/comments as capabilities; unverified new HMAC secret/replay contract; removing `workflow_dispatch` without replacing Supervisor dispatch.
- Report: [Worker authorization architecture decision](../reports/2026-11-04-worker-authorization-architecture-decision.md).
- PR #7 exact-head static CI [41909811327](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/41909811327): SUCCESS, but independent review remains NOT RUN.
- `POOL_DISPATCH_ENABLED`: NOT VERIFIED in this pass; no variable or secret mutation. Worker/DSH/Resource Probe/browser/model execution: NOT RUN.
- Next: extract a pure Supervisor task-matrix builder with schema/bounds/duplicate/SHA/profile/approval tests. Do not yet wire it to reusable workflow or run Worker.
