# DeepSeek Harness upstream refresh and Cloud Pool fit — 2026-11-11

## Status

UPSTREAM RESEARCH VERIFIED / ARCHITECTURAL FIT CONFIRMED / NO RUNTIME DEPLOYMENT OR DISPATCH.

## Immutable references inspected

### Cloud Development Pool

- Default branch: `Основной@221f216c00ca7e5596bcc682ba185ad155a10603`.
- Existing adoption plan: `docs/architecture/DEEPSEEK-HARNESS-ADOPTION-AND-CLOUD-FIRST-PLAN.md`, blob `e5a518ab059ebde7f5eef3ee6b86a2651f5b7f39`.
- Existing DSH smoke workflow: `.github/workflows/dsh-runtime-evaluation.yml`, blob `df8a3788cd8ff4ba5c5b1009298f6bd81b80344d`.
- Existing workflow is manual-only, ubuntu-24.04, Node 24.9.0, read-only contents permission, no secrets, telemetry disabled, isolated DSH_HOME, read-only permission fallback, 6 GiB pre-install disk floor. It installs `@deepseek-ai/dsh@0.2.1-rc.5` and only runs `dsh --profile headless --dump-config`; it does not call a model or execute a task.
- Existing plan already selected DSH as the primary candidate agent runtime, not as scheduler, authorization authority, or project ledger.

### DeepSeek upstream

- Repository: https://github.com/deepseek-ai/deepseek-harness
- Inspected upstream master ref: `e8f7b93a344964de3dca1ace9e72b6e4d6de87cb`.
- Inspected README blob: `7941e30f7bdca9391befe39b9115d211157fa42d`.
- Inspected root package.json blob: `afa89fcf0733a1122f2ab7c164e29d19dcc31471`; root version `0.2.2-rc.2`, Node engine `>=24.9.0`.
- GitHub release page lists `v0.2.2-rc.2` as a pre-release published 2026-11-11 (release commit short SHA `ddac967`). It adds named/nested SubAgent collaboration and AgentTeam shared member/task board, among other fixes.
- npm package page at inspection lists `0.2.2-rc.1` as the current published `latest/next` tag; do not assume the newer source root version `0.2.2-rc.2` has been published as the `@deepseek-ai/dsh` npm package. Existing workflow's `0.2.1-rc.5` pin is now behind published npm `0.2.2-rc.1`.
- License: MIT; third-party dependency notices still apply.
- README explicitly says Developer Preview and warns of compatibility-breaking changes.
- `SAFETY.md` blob `2b76f00e0619ee69553afdc507df361080f4d3ac`: upstream says it has not undergone a security audit and must not be treated as secure or production-ready. It may execute model-generated code/commands and load plugins with access to available files, processes, network and credentials. Sandbox and approval prompts do not guarantee isolation. Use least privilege and disposable environments; do not rely on DSH as the sole control for untrusted workloads.
- Architecture docs describe all-plugin Cordis composition; profiles include web, headless, SDK and ACP. Web UI defaults to localhost:3080. This is not evidence of hardened public authentication or multi-tenant deployment.

## Fit to Cloud Pool

### Strong reusable capabilities / patterns

1. **Headless cloud worker** — natural fit for the existing ephemeral GitHub Actions job model. Keep one task per isolated runner and immutable target SHA.
2. **Plugin/capability seams** — replaceable model adapter, tool registry, agent loop, filesystem, subprocess, session persistence, credentials, sandbox and telemetry. This is useful for future Pool-specific adapters without forking the full harness.
3. **Durable event-sourced sessions** — append-only typed SessionEvent log, derived model history, explicit flush barrier and interrupted-turn recovery. Useful design reference for task/session evidence.
4. **Credential references** — configuration refers to credential names/records; UI reports presence/source/writability without exposing values. This matches secret-value isolation goals, but does not replace GitHub App token scoping, account identity separation or pool authorization.
5. **Sandbox fail-closed contract** — unavailable enforcement should reject execution. DSH's documented local sandbox shares the host kernel/filesystem; use GitHub-hosted ephemeral VM or a stronger external isolation boundary for untrusted workloads.
6. **Subagents/AgentTeam/background jobs** — named nested agents, task boards, ownership-scoped jobs, cancellation and bounded output. These can improve task-local decomposition, but all child roles must inherit the parent envelope's repository, target SHA, permissions, quotas and time budget.
7. **Token metering** — replay-based context pressure and usage estimates can help observability, but are not billing-grade quota enforcement.

### Not a drop-in replacement

- GitHub Actions remains the scheduler/execution plane and account concurrency governor.
- Pool Bridge / policy layer remains the authorization authority and validates task envelope, repository allowlist, immutable target SHA, role, capabilities, quotas, approvals and replay protection.
- Durable project-wide task ledger, artifact retention, independent acceptance and provenance verification remain external to DSH.
- DSH local JSONL session persistence and process-local jobs are not a distributed multi-runner ledger or durable cross-process job queue.
- DSH's local sandbox is not a VM/microVM boundary.
- DSH's model adapters/credential store do not prove our provider quotas, free-route-only behavior, account separation or no-paid-fallback guarantee.
- Do not expose the Web UI publicly without a separately qualified authentication, authorization, TLS, network-egress and tenant-isolation layer.
- Do not allow unreviewed third-party plugin installation in worker jobs.

## Decision

**Keep DSH as the primary candidate agent runtime, and keep GitHub Actions + Pool Bridge as the authority plane.** The new upstream release strengthens the value of its subagent/team orchestration, but it does not change the pool architecture or relax any security gates.

The immediate safe next step is to refresh the existing no-secret headless smoke evaluation to the latest actually published npm version (`0.2.2-rc.1` at inspection), then run it in a disposable GitHub-hosted job and capture install footprint, startup, disk/RSS, profile composition and artifact digest. Do not pin `0.2.2-rc.2` until that exact package version is verified published and installable. The current manual workflow remains pinned to `0.2.1-rc.5`; no runtime evaluation was run during this pass.

## Cloud Pool state revalidation

- Current implementation branch `impl/receipt-bound-projection-2026-11-11` advanced to `dea09ffe94059f446c74fada37971087ec4878eb`; commit adds migration `0009_projection_outbox_identity_immutable.sql`, contract/readme updates and tests.
- PR #67 remains OPEN / DRAFT / UNMERGED; base `221f216c00ca7e5596bcc682ba185ad155a10603`, current head `dea09ffe94059f446c74fada37971087ec4878eb`, 9 commits / 33 files. No formal reviews or review threads.
- Exact-head PR D1 run [43064261520](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43064261520), job `130674831651`: SUCCESS; 5 files / 66 tests passed. Artifact ID `13875340881`, SHA-256 `de5833fb4eca7a6ca94c7b133d4b1b53e7a548e49a86e86748e222136fb693e5`.
- Exact-head contract run [43064261551](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43064261551), job `130674831998`: SUCCESS; workflow YAML parsed; inputs not interpolated into shell; Actions pinned to full SHA; worker permissions/profile allowlist/no-secret probe invariants passed; Supervisor dispatch fail-closed; DSH and resource-probe workflows manual, read-only and secret-free; `POOL_CONTRACT_VALIDATION=PASS`.
- Exact-head push run [43064251525](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43064251525): SUCCESS.
- Combined status endpoint returned zero contexts; do not represent this as required status contexts being published.
- Hosted D1, real provider calls, dispatch, deployment and independent qualification remain NOT RUN / DEFERRED. Contour A remains BLOCKED / NOT ACCEPTED; Contour B remains DEFERRED.

## Next bounded step

Refresh the existing DSH evaluation workflow pin only after confirming the exact npm dist-tag/version and package metadata, then run the no-secret headless smoke in an ephemeral runner. Keep all real model tasks, provider credentials, repository write tokens, public Web UI exposure and plugin installation disabled. Capture and review resource and startup evidence before qualifying DSH headless as the first cloud worker.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md

## Additional security review leads (not independently validated against current release)

Public upstream Discussions include security reports concerning earlier DSH versions: #817 (0.1.0-rc.5), #3252 (0.1.0-rc.7), #3245 (Code Mode execution boundary), and #10507 (0.2.1-rc.2). These are community reports, not an independent verification of the current `0.2.2-rc.2` release; no claim is made here that every reported issue remains present or is exploitable in the current version. They materially raise the required review bar: before any agent task is allowed, inspect the exact selected profile and ensure Code Mode, dynamic plugin installation/hot-update, untrusted project instructions, network egress, loopback/RPC and telemetry are either disabled or separately constrained. Do not infer safety from the ordinary bash/filesystem sandbox alone. Upstream itself still says the project is unaudited and not production-ready.
