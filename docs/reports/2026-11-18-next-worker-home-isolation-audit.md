# /next — worker HOME isolation boundary audit — 2026-11-18

## Immutable target and scope

- Repository: `VlDMlNSh/developer-cloud-pool`.
- Default branch: `Основной`.
- Default HEAD: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Executor qualification PR: #116, exact head `6620a1557f14d26756dcb3bc11c8ab3d5e57c746`.
- Scope: read-only audit of the current production worker workflow, supervisor, and PR #116's FCC child-process boundary. No runtime dispatch, credentials, provider calls, host access, or deployment.

## Current production worker boundary

The default-branch `.github/workflows/pool-worker.yml` currently exposes only the `dsh-headless-probe` profile. Its worker job creates `$RUNNER_TEMP/dsh-pool-home` and a separate package prefix, but the workflow does not export that directory as `HOME`, create/validate a complete XDG hierarchy, or invoke the FCC profile guard / `exec_allowlist.py`. This is a DSH configuration-dump probe, not an FCC/Claude worker.

The default-branch supervisor `scripts/pool-supervisor.mjs` dispatches only the DSH profile and remains gated by `POOL_DISPATCH_ENABLED`. The observed code does not provide a production FCC/Claude launcher or a per-task HOME provisioning contract.

## PR #116 child boundary findings

At PR #116 head `6620a1557f14d26756dcb3bc11c8ab3d5e57c746`:

- `exec_allowlist.py` copies a fixed environment allowlist, drops inherited credential/proxy variables, requires HOME and PATH, verifies HOME is a private directory owned by the current uid, and requires supplied XDG directories to be private and contained inside HOME.
- It does **not** create HOME, prove that HOME is unique to a worker/task, prove that it was freshly provisioned, or reject pre-existing credential stores inside it. HOME is supplied by the caller.
- XDG variables are optional. When omitted, downstream programs may use their default paths under HOME.
- The FCC loopback CI workflow creates a dedicated temporary HOME for its test server and bridge. This demonstrates the test harness can construct an isolated HOME, not that a production worker launcher does so.
- The FCC profile guard is exercised against synthetic fixtures in CI. It is not invoked against a real worker's HOME or the DSH worker workflow.
- The test workflow's dedicated HOME and mock bridge do not establish host egress policy, worker identity, isolation across concurrent tasks, or credentials outside HOME.

## Verified refs and evidence

- Default branch ref read directly from GitHub: `Основной@35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- PR #116: OPEN / DRAFT / UNMERGED, head `6620a1557f14d26756dcb3bc11c8ab3d5e57c746`, mergeable=true.
- PR #116 Runner Qualification [44260105806](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44260105806), job [134651081368](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44260105806/job/134651081368): COMPLETED / SUCCESS on the exact PR head; 13/13 persisted-profile synthetic tests passed and loopback/mock bridge steps succeeded.
- Pool Contract Validation [44260105903](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44260105903): COMPLETED / SUCCESS on the same head.
- Read-only source blob identities on default: `pool-worker.yml` `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`; `pool-supervisor.yml` `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`; `pool-supervisor.mjs` `52bf03ca889edd92fd10c71ae96a2e35e106d43f`.
- PR #116 `exec_allowlist.py` blob `f98ba421ec98e020b28fefb71083d65bd27213d4`; tests blob `dcf6000f9475a0bef598f175663475a12a787927`.

## Governance and controller refresh

- Active ruleset #26550182 still requires a PR and review-thread resolution but has `required_approving_review_count=0`; it defines no required status-check rule. No bypass actors are configured.
- PRs #114, #116, #120, #124 and #125 remain OPEN / DRAFT / UNMERGED. PR #124 currently reports `mergeable=false`; others in this set report mergeable=true.
- Default-branch `.github/workflows/gemini-batch-dispatch-controller.yml` and `.github/workflows/cloud-pool-next-controller.yml` both return 404. Gemini dispatch and owner-event controller execution: NOT RUN.
- No branch protection/governance changes were made.

## Conclusion

**Worker HOME isolation: NOT VERIFIED for production.** The code has a useful child environment filter and synthetic tests, but no current production FCC/Claude launcher provisions and proves a dedicated HOME. The present default worker remains DSH-only. Do not infer worker-level credential isolation from the temporary HOME in the qualification workflow.

No secrets were read; no provider calls, task dispatch, deployments, merges, or external host operations occurred.

## Next bounded step

Design and implement a fail-closed worker HOME provisioning contract in a dedicated, reviewable worker-launcher change: fresh per-task HOME, mode/owner checks, explicit XDG paths, rejection of known external credential stores, safe teardown, and synthetic concurrent-task isolation tests. Keep it separate from the DSH probe and do not enable production dispatch. Require independent A3 review and exact-head CI before qualification.

## Status

- Static audit: **VERIFIED** for the listed source facts.
- Production dedicated HOME: **NOT VERIFIED**.
- Production FCC/Claude launcher: **NOT IMPLEMENTED / NOT VERIFIED**.
- Contour A: **BLOCKED / NOT ACCEPTED**.
- Contour B: **DEFERRED**.

## References

- [PR #116](https://github.com/VlDMlNSh/developer-cloud-pool/pull/116)
- [Issue #115](https://github.com/VlDMlNSh/developer-cloud-pool/issues/115)
- [Worker workflow on default](https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/.github/workflows/pool-worker.yml)
- [Supervisor on default](https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/scripts/pool-supervisor.mjs)
- [Canonical MediaHub Chat Tree Map](https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md)
