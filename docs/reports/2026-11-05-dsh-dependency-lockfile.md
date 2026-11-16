# 2026-11-05 — DSH lockfile generation and frozen-install verification

## Scope
Resolve the DSH consumer dependency tree without relying on the repeatedly stalled npm resolver path. Use the upstream-pinned pnpm version, verify the effective peer policy, and prove a frozen install with lifecycle scripts disabled. No production DSH workflow or Worker dispatch was enabled.

## Resolver investigation
- npm CLI issue #9934 documents an Arborist `CanPlaceDep/canPlacePeers` resolution livelock for `@deepseek-ai/dsh@0.1.1-rc.2`, reproduced on npm 11.16.0 and 12.0.2: https://github.com/npm/cli/issues/9934
- DSH discussion #4872 documents npm resolver OOM on an earlier release and a pnpm path with automatic peer installation: https://github.com/deepseek-ai/deepseek-harness/discussions/4872
- These reports are consistent with the earlier npm non-completion but do not prove that the current `0.2.1-rc.5` package has the identical defect.
- Upstream DSH pins pnpm 11.28.5. Its upstream monorepo lockfile was not copied; the consumer lockfile was generated from this repository's exact manifest.

## Corrective implementation
- Branch: `security/pin-dsh-npm-dependencies-2026-11-05`.
- Verified code HEAD: `5d838b56048996a4afd553a4a476540311c5500d`.
- Node.js 24.9.0 and Corepack-pinned pnpm 11.28.5.
- `dsh-runtime/pnpm-workspace.yaml` sets top-level `autoInstallPeers: true`.
- CI asserts `pnpm config get autoInstallPeers` is exactly `true` before resolution.
- CI validates lockfile version 9.0, exact DSH importer version, recorded `autoInstallPeers`, and package integrity records.
- CI runs `pnpm install --frozen-lockfile --ignore-scripts --prod`, then verifies installed package metadata is exactly `0.2.1-rc.5`.
- Lifecycle scripts remain disabled; DSH itself is not executed in this validation workflow.

## Exact-head evidence
- Run [42096635000](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42096635000): COMPLETED / SUCCESS on exact code HEAD `5d838b56048996a4afd553a4a476540311c5500d`.
- Job: `127488270735`; all functional steps succeeded, including effective peer-config assertion, lockfile generation, frozen install, dispatch-disabled assertion, YAML parsing and pool contract validation.
- Artifact ID: `13446468980`, name `dsh-runtime-pnpm-lockfile`.
- Artifact ZIP SHA-256: `081a60afdf177de7c47e2064f830009a0509651664fa628596f1b7c34c58cece`.
- Extracted lockfile SHA-256: `9fb548f18191bcf3cb9786a3d3c6b597a88cc56a09ddff4f66b7b3c893d5a83c`; size 614,254 bytes.
- Independent parse of the downloaded artifact: 630 package records, 630 snapshots, 630 integrity records, zero package entries missing integrity, exact DSH importer version.
- The corrected run did not emit the previous ignored-`settings` warning. It did report one deprecated transitive dependency, `node-domexception@1.0.0`; this is non-blocking but remains in the dependency review list.
- The previous probe at HEAD `22a86eb99a93456808fc4ba47f76bf6455ebcc04` is superseded. It had the nested workspace configuration and did not run the frozen-install step.

## Remaining scope and security
- `.github/workflows/dsh-runtime-evaluation.yml` and `.github/workflows/pool-worker.yml` still use npm installation and do not yet consume the shared pnpm lockfile.
- The DSH headless profile was NOT executed. The verified run covers package resolution and frozen package installation only.
- No secrets/provider credentials, Worker dispatch, Resource Probe, browser session, model call or paid fallback.
- `POOL_DISPATCH_ENABLED=false`; dispatch remains fail-closed.
- Independent security review: NOT RUN.
- PR #16 remains OPEN / DRAFT / NOT MERGED / NOT QUALIFIED.

## Next bounded step
1. Inspect lifecycle scripts and native build requirements in the resolved dependency graph.
2. Add the verified consumer lockfile to the PR branch.
3. Switch the standalone DSH evaluation and Worker workflows to the same pinned pnpm lockfile with scripts disabled, after confirming the headless profile can start without lifecycle scripts.
4. Run a no-secret, isolated `dsh --profile headless --dump-config` smoke test with telemetry disabled and no model call.
5. Re-run exact-head CI, inspect dependency/license/security findings, and request independent review.
6. Keep dispatch disabled until the separate Supervisor/Worker authorization and governance gates are qualified.
