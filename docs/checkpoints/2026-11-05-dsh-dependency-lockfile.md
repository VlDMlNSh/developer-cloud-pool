# Checkpoint — DSH dependency lockfile via upstream pnpm — 2026-11-05

## Immutable target and provenance
- Repository: `VlDMlNSh/developer-cloud-pool`.
- Canonical base: `Основной` / `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- PR #16: https://github.com/VlDMlNSh/developer-cloud-pool/pull/16
- Branch: `security/pin-dsh-npm-dependencies-2026-11-05`.
- Verified implementation code HEAD: `5d838b56048996a4afd553a4a476540311c5500d`.
- Direct dependency: `@deepseek-ai/dsh@0.2.1-rc.5`.
- Node: `24.9.0`; pnpm: `11.28.5`.

## Verified lockfile generation and frozen install
- Exact-head Pool Contract Validation run [42096635000](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42096635000): COMPLETED / SUCCESS on the exact code HEAD above.
- Job: `127488270735`; all 10 functional workflow steps succeeded.
- Corrected `dsh-runtime/pnpm-workspace.yaml` uses top-level `autoInstallPeers: true`; CI asserts `pnpm config get autoInstallPeers` returns literal `true`.
- The earlier nested `settings:` form was ignored by pnpm 11.28.5. It is corrected; the successful run emitted no ignored-setting warning.
- Lockfile generation validated format 9.0, exact importer specifier `0.2.1-rc.5`, and `settings.autoInstallPeers: true`.
- Artifact: `dsh-runtime-pnpm-lockfile`, ID `13446468980`.
- Artifact ZIP SHA-256: `081a60afdf177de7c47e2064f830009a0509651664fa628596f1b7c34c58cece`.
- Extracted `pnpm-lock.yaml` SHA-256: `9fb548f18191bcf3cb9786a3d3c6b597a88cc56a09ddff4f66b7b3c893d5a83c`; size 614,254 bytes.
- Independent local parse: 630 package records, 630 snapshots, 630 integrity records; zero package entries missing integrity; exact DSH importer version.
- Frozen install step `pnpm install --frozen-lockfile --ignore-scripts --prod` completed successfully and verified installed DSH version `0.2.1-rc.5`.
- One deprecated transitive subdependency warning: `node-domexception@1.0.0`; not a CI failure, but retain in dependency review.

## Scope and security boundary
- No production DSH workflow changed in this pass.
- `.github/workflows/dsh-runtime-evaluation.yml` and `.github/workflows/pool-worker.yml` still install DSH with npm and do not yet consume this shared lockfile.
- DSH headless profile was NOT executed; only the package install and installed-version check ran.
- No model/provider calls, credentials, browser activity, Worker dispatch or paid services.
- `POOL_DISPATCH_ENABLED` remains false / fail-closed.
- Independent security review: NOT RUN.
- PR #16 remains OPEN / DRAFT / NOT MERGED / NOT QUALIFIED.

## Next bounded engineering step
1. Inspect lifecycle scripts and required native build artifacts in the resolved DSH dependency graph; keep scripts disabled by default.
2. Add the verified shared lockfile to the PR branch and switch both DSH workflows to the pinned pnpm install path with `--frozen-lockfile --ignore-scripts`, provided the headless smoke profile works without lifecycle scripts.
3. Run the harmless headless `dsh --profile headless --dump-config` smoke with isolated `DSH_HOME`, telemetry disabled, no credentials and no model call.
4. Re-run exact-head CI, inspect dependency/license/security findings, and obtain independent review.
5. Keep dispatch disabled until the separate Supervisor/Worker authorization and governance gates are qualified.

## Prohibitions
- Do not copy or convert the upstream monorepo lockfile.
- Do not synthesize versions or integrity hashes.
- Do not use `--legacy-peer-deps`.
- Do not enable dependency lifecycle scripts without a reviewed allowlist and demonstrated need.
- Do not merge or enable Worker dispatch based on lockfile validation alone.
