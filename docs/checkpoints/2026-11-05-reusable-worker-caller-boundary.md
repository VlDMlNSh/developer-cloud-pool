# Checkpoint — 2026-11-05 reusable Worker caller boundary

- Canonical branch `Основной`: `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Working branch: `feat/reusable-worker-call-boundary-2026-11-05`; NOT canonical.
- Working branch latest documented implementation commit before this checkpoint update: `056f2f43d007a29b3893c4a26e6658ba7cb394ca`; branch ancestry 4 ahead / 0 behind canonical.
- Design contract blob: `138953c1c0b09098b009f4da5f4da12df67c65a2`.
- Caller validator `scripts/pool-worker-caller.mjs` blob: `88d79d74691431ead14f29426d214833c0086183`.
- Detailed report: [2026-11-05 implementation pass](../reports/2026-11-05-reusable-worker-caller-boundary.md), latest report blob `8afa3a97dff4a7fd02d9d52c7966f67574a9addb`.

## Current blocker
Default Worker still uses `workflow_dispatch` and public issue metadata; default Supervisor still dispatches Worker through REST. Caller authorization BLOCKED. No production or privileged execution.

## Implementation status
A pure fail-closed caller-context validator was added to the working branch only. It checks the exact caller repository/ref, reusable Worker repository/path, SHA formats, and same-revision relationship. It is NOT wired into workflows. Unit test creation was blocked; tests NOT RUN. Exact-head CI NOT VERIFIED; no workflow runs/statuses were returned for the implementation commit. Independent review NOT RUN.

## Governance and execution
Current ruleset and `POOL_DISPATCH_ENABLED` NOT VERIFIED; historical Issue #1 data is stale evidence. Gemini NOT RUN (controller absent in default branch). Claude Code NOT RUN (no verified third host/free route in this pass). Worker, DSH, Resource Probe, browser and model/provider calls NOT RUN. Paid fallback NOT USED. Runtime NOT QUALIFIED.

## Next
Add/run tests; wire Worker `workflow_call` caller validation and remove `workflow_dispatch`; refactor Supervisor to static reusable job plus bounded planner/matrix and remove REST dispatch. Keep dispatch disabled until exact-head CI, independent security review and current governance gates pass.
