# 2026-11-05 — DSH lockfile resolver investigation and pnpm probe

## Scope
Investigate why repeated GitHub-hosted npm lockfile generation did not reach artifact upload. Replace the temporary resolver probe with a bounded upstream-aligned pnpm probe. No production DSH execution or Worker dispatch.

## Evidence
- PR #16: https://github.com/VlDMlNSh/developer-cloud-pool/pull/16
- Canonical base: `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Previous PR branch head: `2bfdfabed8d27615d6ae3ca6a1146ae220b471ea`.
- Current direct package pin: `@deepseek-ai/dsh@0.2.1-rc.5`.
- Run 42095638148 / job 127484885517 on commit `89798bb5b900f18da670db3a42449e91605208bf` remained at the npm lockfile-resolution step; a later branch update cancelled that run. This is not a terminal npm failure.
- Run 42095679649 for commit `9e24d3ae1bc00e1cb59da37d1dba4f70e789a5c3` was queued without a job and was superseded by a later branch update.
- Earlier npm resolver run 42038801999 ended CANCELLED, not FAILED, with no artifact.
- Thus the observed symptom is repeated non-completion at npm resolution, not a captured npm error or proven 0.2.1-rc.5 defect.

## Mature upstream evidence
- npm CLI issue #9934 documents an Arborist `CanPlaceDep/canPlacePeers` recursion/livelock while resolving `@deepseek-ai/dsh` 0.1.1-rc.2; reporters reproduced with npm 11.16.0 and 12.0.2. https://github.com/npm/cli/issues/9934
- DSH discussion #4872 documents npm resolver OOM on an earlier release and a pnpm installation route with `auto-install-peers`. https://github.com/deepseek-ai/deepseek-harness/discussions/4872
- Upstream DSH root manifest pins pnpm 11.28.5. Upstream `pnpm-lock.yaml` sets `autoInstallPeers: true`.
- The upstream lockfile covers the upstream monorepo, not the published npm consumer package; it is not reused or converted.

## Implementation
- The temporary generator in Pool Contract Validation now activates pnpm 11.28.5 through Corepack.
- Adds consumer-local `pnpm-workspace.yaml` with `autoInstallPeers: true`.
- Generates a lockfile with `pnpm install --lockfile-only --ignore-scripts`.
- Checks lockfile version 9.0, exact DSH specifier and nonzero integrity records.
- Uploads the generated lockfile for inspection; no generated lockfile is committed by this step.
- Job timeout is 12 minutes. No runtime workflow changes.

## Verification
- Source readback and blob SHAs: pending.
- Exact-head CI: NOT VERIFIED.
- pnpm lockfile artifact: NOT GENERATED / NOT VERIFIED.
- Worker/DSH runtime/model/browser/resource probe: NOT RUN.
- Dispatch: remains disabled / fail-closed.
- Independent review and qualification: NOT RUN.

## Next step
Inspect the exact-head run and artifact. If pnpm generation succeeds, inspect the full lockfile and verify a clean frozen install in an isolated job before switching runtime workflows. If it fails, capture terminal logs and investigate the specific package-resolution error. Do not fall back to npm unchanged, `--legacy-peer-deps`, fabricated locks or paid services.
