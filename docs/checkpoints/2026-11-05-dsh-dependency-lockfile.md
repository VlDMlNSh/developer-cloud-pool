# Checkpoint — DSH dependency lockfile via upstream pnpm — 2026-11-05

## Immutable target
- Repository: `VlDMlNSh/developer-cloud-pool`.
- Canonical base: `Основной` / `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- PR #16 branch: `security/pin-dsh-npm-dependencies-2026-11-05`.
- Previous implementation head: `22a86eb99a93456808fc4ba47f76bf6455ebcc04`.
- Current direct dependency: `@deepseek-ai/dsh@0.2.1-rc.5`.

## First pnpm probe — verified
- Exact-head CI run [42096330542](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42096330542): COMPLETED / SUCCESS.
- Job: `127487220599`; all workflow steps succeeded.
- Corepack activated pnpm `11.28.5` on Node `24.9.0`.
- Lockfile artifact ID: `13446658533`; artifact name `dsh-runtime-pnpm-lockfile`.
- Artifact ZIP SHA-256: `75b3abd3ea1bdbefb2f3d2984d98bcef4772929af62a188089d58f0cdd35710e`.
- Extracted lockfile SHA-256: `9fb548f18191bcf3cb9786a3d3c6b597a88cc56a09ddff4f66b7b3c893d5a83c`.
- Independent local inspection of the downloaded artifact: 630 package records, 630 snapshots and 630 package integrity records; importer pins `0.2.1-rc.5`.
- Lockfile records `autoInstallPeers: true` in its settings.
- The first run emitted a warning because this branch initially nested `autoInstallPeers` under an unsupported `settings:` key in `pnpm-workspace.yaml`. That file-level configuration was ignored, even though pnpm's default and generated lockfile setting were true.

## Corrective implementation in current pass
- Move `autoInstallPeers: true` to the top level of `dsh-runtime/pnpm-workspace.yaml`, matching pnpm 11 project configuration.
- Assert `pnpm config get autoInstallPeers` is exactly `true` before resolution.
- Validate lockfile's `settings.autoInstallPeers` field.
- Add a frozen install using `pnpm install --frozen-lockfile --ignore-scripts --prod`; verify installed DSH package version without executing DSH.
- No production Worker or evaluation workflow changes until the corrected exact-head CI and frozen install pass.

## Upstream investigation
- npm CLI issue #9934 reports an Arborist peer-dependency resolution livelock for an earlier DSH release: https://github.com/npm/cli/issues/9934
- DSH discussion #4872 reports npm resolver OOM and a pnpm route with peer auto-install for an earlier release: https://github.com/deepseek-ai/deepseek-harness/discussions/4872
- Upstream root manifest pins pnpm 11.28.5; upstream monorepo lockfile is not reused.
- Current DSH `0.2.1-rc.5` has not been proven to share the exact npm defect.

## Current verification gates
- First pnpm lock generation: VERIFIED.
- Artifact structure and integrity count: VERIFIED.
- Initial file-level peer setting: FAILED (warning, ignored); corrected in current commit.
- Corrected exact-head CI and frozen install: NOT VERIFIED until terminal run.
- Independent security review: NOT RUN.
- DSH runtime, Worker, Resource Probe, browser and model/provider calls: NOT RUN.
- `POOL_DISPATCH_ENABLED`: unchanged, false; dispatch remains fail-closed.

## Acceptance gates
1. Corrected exact-head CI succeeds without an ignored-config warning.
2. Frozen install succeeds from the generated lockfile with scripts disabled.
3. Retrieve and inspect the new artifact and compare lockfile SHA/integrity.
4. Review peer graph and package lifecycle scripts.
5. Only then update both DSH runtime workflows to consume the shared frozen lockfile, with an explicit reviewed build-script allowlist if needed.
6. Run exact-head CI, zizmor and independent security review before merge.
7. Keep dispatch disabled until runtime authorization and governance gates are accepted.

## Prohibitions
- Do not copy or convert the upstream monorepo lockfile.
- Do not synthesize versions or integrity hashes.
- Do not use `--legacy-peer-deps`.
- Do not enable DSH lifecycle scripts by default.
- Do not enable Worker dispatch or claim pool readiness based on lockfile CI.
