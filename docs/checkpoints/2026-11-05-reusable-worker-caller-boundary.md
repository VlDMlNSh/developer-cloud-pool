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

## Follow-up checkpoint — tests and PR #12
- Added test file `scripts/pool-worker-caller.test.mjs`, blob `251a4772d85a5dff8cdcc8ca589509ffa48eac98`.
- Added a Node test step to `.github/workflows/pool-contract-validation.yml`, blob `5991c0cf839d510ef6e6540895ddbcd9e306c068`.
- Draft PR #12: https://github.com/VlDMlNSh/developer-cloud-pool/pull/12; head at creation `215bd04490d19ec1d6392a8defa9bbd9e1e7bafc`; base canonical SHA `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Exact-head CI and combined status returned no runs/statuses when queried: NOT VERIFIED. Tests committed, NOT RUN in an observed CI runner.
- Independent security review NOT RUN. PR #12 DRAFT, not accepted.
- Branch compare at PR creation: 8 ahead / 0 behind canonical. Canonical unchanged.
- Worker remains `workflow_dispatch`; Supervisor still uses REST dispatch. Caller helper not wired into Worker. Authorization BLOCKED.
- Runtime/dispatch remains NOT RUN; paid fallback NOT USED.
- Detailed updated report: [2026-11-05 implementation report](../reports/2026-11-05-reusable-worker-caller-boundary.md), blob `af9329089528e46b35248f9ca540bdf44aaa1361`.
