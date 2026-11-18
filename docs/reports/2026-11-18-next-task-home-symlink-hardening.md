# /next — task HOME symlink-boundary hardening — 2026-11-18

## Scope

One bounded hardening pass on PR #116. Target branch: `feat/claude-code-fcc-runner-qualification-2026-11-17`. Base/default SHA observed: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`. No merge, deployment, credential access, provider call or dispatch.

## Finding

The existing task HOME helper canonicalized paths with `Path.resolve()` before checking whether the supplied root/HOME itself was a symlink. Since resolution follows symlinks, the later symlink test on the resolved path could not detect a symlink alias. This weakened the helper's stated refusal to delete through symlinked task paths.

## Changes

- Hardened `_private_directory` to inspect the supplied path using `lstat()` and reject symlinks before resolving it.
- Kept explicit directory/owner/mode checks after canonicalization.
- Hardened teardown to validate the caller-supplied task HOME before resolving and deleting it.
- Changed forbidden credential-store detection to treat dangling symlinks as present paths, not absent stores.
- Added regression coverage for a symlinked root and a symlink alias to a task HOME; the alias must be rejected while the real task directory remains intact.

## Immutable evidence refs

- PR #116 updated head: `b75b95a2c67c9e3d84b191cd88137887dfdfc7dc`.
- Task HOME helper commit: `5bf8b84e97bef8cb1d3f22fe4e40d5e095c649ab`.
- Symlink regression test commit / current branch head: `b75b95a2c67c9e3d84b191cd88137887dfdfc7dc`.
- PR remains OPEN / DRAFT / UNMERGED. Latest GitHub mergeability was UNKNOWN while checks were queued; do not merge based on this state.

## Exact-head CI

- Runner Qualification [44262676210](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262676210): PENDING at report creation, exact head `b75b95a2c67c9e3d84b191cd88137887dfdfc7dc`.
- Pool Contract Validation [44262676143](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262676143): IN_PROGRESS at report creation, exact head `b75b95a2c67c9e3d84b191cd88137887dfdfc7dc`.
- An earlier runner qualification [44262653818](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262653818) was still IN_PROGRESS on prior helper commit `5bf8b84e97bef8cb1d3f22fe4e40d5e095c649ab`; it is not evidence for final head.
- No final-head test success is claimed until run 44262676210 completes.

## Residual boundaries

- This is a filesystem primitive plus regression coverage. It is not yet wired into the default production worker launcher; default `.github/workflows/pool-worker.yml` remains DSH-only.
- It does not provide OS/container sandboxing, network egress isolation, protection from credentials outside HOME, or host recovery after runner loss.
- PR #116 still needs independent security review. Governance ruleset #26550182 has zero required approvals and zero required status checks.
- PR #114/#125 owner admission remains proof-only; hosted D1 and live webhook provenance remain unqualified. Production controller and approved Gemini controller remain absent on default.
- No secrets read, provider calls, dispatch, deployment or merge. Contour A remains BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

## Next step

Wait for exact-head CI. If green, conduct an independent review of the HOME helper and child environment boundary. Then separately design a production launcher integration with explicit per-task lifecycle, trusted PATH, OS/container boundary, network policy and external credential isolation. Keep all dispatch fail-closed.
