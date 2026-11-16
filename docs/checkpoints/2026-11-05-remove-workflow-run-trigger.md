# Checkpoint — Supervisor workflow_run removal (2026-11-05)

## Current target
- Repo: `VlDMlNSh/developer-cloud-pool`.
- Canonical base: `Основной` / `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Branch: `security/remove-supervisor-workflow-run-2026-11-05`.
- PR #15: https://github.com/VlDMlNSh/developer-cloud-pool/pull/15
- State: OPEN / DRAFT / NOT MERGED.
- Tested code commit: `17fda11001288cc0123b667251c712af13d55f9a`.
- Scope: remove privileged `workflow_run` trigger; retain scheduled reconciliation and issue-label wakeups.

## Source evidence
- Trigger finding: zizmor run `42037723023`, job `127280177651`, finding at `.github/workflows/pool-supervisor.yml:9`.
- Supervisor workflow blob: `d05fc4037f5663a64bb82d9ff67afe95e20c73da`.
- Supervisor script blob: `66bac1839a0cdbd8d12655852b7c7476f8dcc4d7`.
- Architecture blob: `cad3ea2c99e4f5f62bd82b6f4247dc5ca655b5ae`.
- Report: [2026-11-05 workflow_run remediation](../reports/2026-11-05-remove-workflow-run-trigger.md).

## Verification status
- Source readback: VERIFIED.
- Exact code-head CI: run `42037929298`, job `127280825826`, COMPLETED / SUCCESS.
- Passed: dispatch-disabled assertion, workflow YAML parsing, pool security contract validator.
- Runtime execution: NOT RUN.
- Independent review: NOT RUN.
- Qualification/acceptance: NOT QUALIFIED / NOT ACCEPTED.

## Remaining work
1. Resolve zizmor package-lock warnings in Worker and DSH evaluation workflows using committed lockfiles and `npm ci`.
2. Continue Worker reusable caller authorization; direct `workflow_dispatch` remains a separate blocker.
3. Independently review the scheduled recovery behavior.
4. Maintain fail-closed dispatch; do not execute Worker/DSH until security and governance gates pass.
