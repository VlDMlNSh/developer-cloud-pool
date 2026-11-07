# Engineering pass report — 2026-11-06 — PR #31 exact-head CI activation and adapter hardening

## Immutable targets and resulting heads
- Repository: `VlDMlNSh/developer-cloud-pool`.
- PR #31 base branch: `feat/jarvis-hono-web-prototype-2026-11-06`.
- PR #31 feature branch: `feat/github-read-adapter-synthetic-2026-11-06`.
- PR #31 resulting exact head: `907bf6c819bf0744473dfc96027fedc3a82e475a` (OPEN / DRAFT / UNMERGED).
- PR #25 resulting head after base-branch workflow correction: `8f0c0c57cf24d476a27d456e80ffd1d8ced7ab85`.
- Unified documentation branch: `docs/cross-chat-continuation-2026-11-06`; PR #27 remains OPEN / DRAFT / UNMERGED.

## Root cause and correction
- The earlier audit incorrectly attributed missing PR #31 CI to the Pool Contract Validation path filter. The actual applicable workflow is `.github/workflows/jarvis-web-validation.yml`, which already includes `src/**` and `tests/**`.
- Root cause: its `pull_request.branches` filter included only `Основной`, while PR #31 targets the Hono prototype feature branch.
- Corrected the workflow on PR #31's base branch by adding `feat/jarvis-hono-web-prototype-2026-11-06` to the pull_request target-branch allowlist.
- Workflow commit: `8f0c0c57cf24d476a27d456e80ffd1d8ced7ab85`; workflow blob: `cb935cc92272f09576604ed0365d5e7bf92903a0`.
- PR #25 exact-head validation after that base-branch change: run `42228269689` Pool Contract Validation SUCCESS and run `42228269676` Jarvis Web Prototype Validation SUCCESS.

## Adapter hardening
- Reviewed PR #31 source and tests. Found that the previous ETag validator accepted spaces and control/DEL/non-Latin characters even though HTTP entity-tag opaque-tag grammar does not.
- Tightened validation to accept only the permitted entity-tag character ranges (plus optional weak prefix), rejecting malformed input before any upstream request.
- Added a regression test covering space, tab, control, DEL and out-of-range Unicode characters; verifies fetch is never called.
- Source blob: `9df448c7817a62d9eca86b91697eb593be23855e`.
- Test blob: `04a7acb6173625f50934ba59e87ab55d7001ecc0`.

## Exact-head CI evidence
- PR #31 exact resulting head `907bf6c819bf0744473dfc96027fedc3a82e475a`: Jarvis Web Prototype Validation run `42228343320` COMPLETED / SUCCESS.
- Job `127927472859` COMPLETED / SUCCESS.
- Job log confirms `npm test`: 22 tests, 22 passed, 0 failed. New malformed-ETag regression test is test 13 and passed.
- The same job completed runtime verification, lockfile install, static checks and static dashboard contract validation successfully.
- PR #31 formal reviews: 0; inline review threads: 0. Independent review remains NOT RUN. PR remains DRAFT and unmerged.
- This verifies the workflow and tests at the exact PR head; it does not qualify adapter integration, OAuth, live provider calls or the cloud pool.

## Scope boundaries and blockers
- The adapter remains deliberately unmounted from Hono Worker routes. Protected API still fails closed pending qualified OAuth/session implementation.
- Default production Supervisor/Worker authorization remediation remains incomplete: privileged Supervisor workflow_run and issues/actions write, Worker workflow_dispatch and report issue-write remain blockers.
- Issue #1 historical read-back recorded `POOL_DISPATCH_ENABLED=false` on 2026-11-04; current value was not freshly read. Keep dispatch fail-closed.
- Active ruleset details were not re-read in this pass. Refresh before any merge.
- SentinelX availability previously read: only Voktors-Mini operational; mh-dev-01/mh-dev-02 user-disabled; Alamo/server-3 not identified. No Claude Code task.
- No Gemini controller/child run, Worker, DSH, Resource Probe, provider/model call, secret read, deployment or paid resource action occurred.

## Status and next step
- PR #31 exact-head CI: VERIFIED SUCCESS (run `42228343320`; 22/22 tests).
- PR #31 independent review: NOT RUN; merge: NOT APPROVED / NOT PERFORMED.
- Adapter integration into Hono: NOT IMPLEMENTED.
- OAuth/session live operation, browser/device QA, deployment and pool runtime: NOT RUN.
- Contour A: NOT ACCEPTED. Contour B: DEFERRED.
- Next: obtain independent review of PR #31; separately audit and remediate Supervisor/Worker authorization before any execution test. Re-read ruleset and Actions variable before dispatch-related operations.

## Documentation write correction
An earlier report creation omitted the documentation branch argument and briefly landed on `Основной`. The file was immediately deleted from `Основной` using its exact blob SHA; corrective deletion commit: `197ba98d0dc7d8437d759dd25bee8750d02e59ae`. The report now resides only on the documentation branch.

Canonical unified context: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/context/GITHUB-CONTEXT-WINDOW.md
Continuation checkpoint: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/checkpoints/2026-11-06-cross-chat-continuation.md
MediaHub canonical map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
