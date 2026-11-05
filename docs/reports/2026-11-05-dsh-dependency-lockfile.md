# 2026-11-05 — DSH lockfile resolver investigation and pnpm verification

## Scope
Replace the blocked npm lockfile generation path with an upstream-aligned pnpm probe. Verify the generated consumer lockfile and correct a pnpm configuration warning. No production DSH workflow or Worker dispatch was enabled.

## Root-cause evidence
- npm CLI issue #9934 documents an Arborist `CanPlaceDep/canPlacePeers` resolution livelock for `@deepseek-ai/dsh@0.1.1-rc.2`, reproduced on npm 11.16.0 and 12.0.2: https://github.com/npm/cli/issues/9934
- DSH discussion #4872 documents npm resolver OOM on an earlier release and a pnpm path with automatic peer installation: https://github.com/deepseek-ai/deepseek-harness/discussions/4872
- This is consistent with our npm job repeatedly stalling at resolution, but does not prove the exact same defect in current `0.2.1-rc.5`.
- Upstream DSH pins pnpm 11.28.5. Its monorepo lockfile is not a consumer lockfile and was not copied.

## First pnpm probe
- Commit: `22a86eb99a93456808fc4ba47f76bf6455ebcc04`.
- Exact-head run [42096330542](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42096330542): COMPLETED / SUCCESS.
- Job `127487220599`: all steps completed successfully.
- Generated artifact ID `13446658533`; SHA-256 of ZIP: `75b3abd3ea1bdbefb2f3d2984d98bcef4772929af62a188089d58f0cdd35710e`.
- Downloaded artifact and parsed lockfile independently: 630 packages, 630 snapshots, 630 integrity records; exact importer specifier `0.2.1-rc.5`.
- Lockfile SHA-256: `9fb548f18191bcf3cb9786a3d3c6b597a88cc56a09ddff4f66b7b3c893d5a83c`.
- CI emitted: `The following settings in pnpm-workspace.yaml are not recognized ... "settings"`. The nested workspace setting was ignored. The lockfile's own `settings.autoInstallPeers` was true (the pnpm default), but the project config needed correction.

## Corrective change
- Move `autoInstallPeers: true` to the top level of `dsh-runtime/pnpm-workspace.yaml`.
- Assert effective value with `pnpm config get autoInstallPeers`.
- Add frozen install verification: `pnpm install --frozen-lockfile --ignore-scripts --prod`.
- Read installed package metadata and assert exact version `0.2.1-rc.5`; do not execute DSH.
- Keep all production runtime workflows unchanged until the corrected probe passes and its artifact is reviewed.

## Security and qualification
- No secrets or provider credentials used.
- No DSH runtime, Worker, Resource Probe, browser, model call or paid fallback.
- Lifecycle scripts disabled.
- `POOL_DISPATCH_ENABLED=false`.
- First lock generation: VERIFIED.
- Initial workspace config: FAILED (ignored setting warning); correction implemented, awaiting exact-head CI.
- Frozen install: NOT VERIFIED until corrected run completes.
- Independent review: NOT RUN.
- PR #16 remains OPEN / DRAFT / NOT MERGED / NOT QUALIFIED.

## Next step
Inspect the corrected exact-head CI, retrieve the new lockfile artifact, verify the effective peer setting and frozen install, then inspect lifecycle scripts before changing runtime workflows. Do not merge or enable dispatch.
