# Checkpoint — DSH dependency lockfile via upstream pnpm — 2026-11-05

## Immutable target
- Repository: `VlDMlNSh/developer-cloud-pool`.
- Canonical base: `Основной` / `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- PR #16 branch: `security/pin-dsh-npm-dependencies-2026-11-05`.
- Previous branch head: `2bfdfabed8d27615d6ae3ca6a1146ae220b471ea`.
- Scope: replace the temporary npm lockfile resolver with a bounded, pinned pnpm lockfile-generation probe. No production DSH workflow changed.

## Evidence and decision
- Current DSH package: `@deepseek-ai/dsh@0.2.1-rc.5`, exact direct version in `dsh-runtime/package.json`.
- npm CLI issue #9934 reports a reproducible Arborist peer-dependency resolution livelock for `@deepseek-ai/dsh` (reported on 0.1.1-rc.2, npm 11.16.0/12.0.2): https://github.com/npm/cli/issues/9934
- DSH discussion #4872 reports npm resolver OOM and a working pnpm route with auto-install-peers for an earlier DSH release: https://github.com/deepseek-ai/deepseek-harness/discussions/4872
- These reports explain the observed pattern but do NOT prove that the current 0.2.1-rc.5 package has the identical defect.
- Upstream repository root manifest pins pnpm 11.28.5; upstream pnpm lock settings enable `autoInstallPeers: true`. The upstream root lockfile is a monorepo lockfile and is NOT copied into this project.
- Upstream root manifest blob: `c4f130943ddfee2d8d8040c6dd679f5b0e12312a`.
- Upstream workspace configuration blob: `59b31eb46b90e35251cbf3c26b20556892c4aa52`.

## Change in this checkpoint
- Validation workflow now activates exact pnpm 11.28.5 through Corepack on Node 24.9.0.
- Adds `dsh-runtime/pnpm-workspace.yaml` with upstream-compatible `autoInstallPeers: true`.
- Generates a temporary lockfile only; lifecycle scripts remain disabled.
- Validates lockfile version, exact DSH specifier and presence of package integrity records.
- Uploads the generated lockfile as a one-day artifact for review.
- Validation job timeout raised to 12 minutes to bound the resolver probe.
- Worker and standalone DSH evaluation workflows are unchanged and still NOT QUALIFIED.

## Verification
- New commit and blob SHAs: pending commit creation/readback.
- Exact-head CI: NOT VERIFIED until the new run is terminal and logs/artifact are inspected.
- Lockfile generation: NOT VERIFIED until artifact is produced and reviewed.
- Independent security review: NOT RUN.
- DSH runtime, Worker, Resource Probe, browser, model/provider calls: NOT RUN.
- `POOL_DISPATCH_ENABLED`: unchanged; dispatch remains fail-closed.

## Acceptance gates
1. Exact-head CI reaches terminal SUCCESS.
2. Generated `pnpm-lock.yaml` artifact is retrieved and inspected; all package versions and integrity records are present.
3. A separate review confirms the package graph and peer dependencies resolve correctly.
4. Only then commit the actual lockfile, remove the temporary generator, and update both DSH runtime workflows to install from the shared frozen lockfile.
5. Run exact-head CI, zizmor and independent security review.
6. Do not merge or enable dispatch before all gates pass.

## Explicit prohibitions
- Do not copy the upstream monorepo lockfile into this consumer project.
- Do not synthesize versions or integrity hashes.
- Do not use `--legacy-peer-deps` as a workaround.
- Do not switch production workflows to pnpm until the consumer lockfile has been generated and inspected.
- Do not run DSH or Worker as part of lockfile generation.
