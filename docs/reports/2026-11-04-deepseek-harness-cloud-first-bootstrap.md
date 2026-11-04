# Engineering report — 2026-11-04: DeepSeek Harness selection and cloud-first bootstrap

## Scope
Evaluate DeepSeek Harness and related DeepSeek agent work, correct hardware availability assumptions, and implement the first safe cloud-only evaluation workflow. This is the Developer Cloud Pool project, separate from MediaHub OS.

## Owner-confirmed hardware
- Currently available: Mac mini Server 2011, Linux, 4 CPU cores, 16 GB RAM.
- Mac mini 2018: future equipment only.
- Remote GPU server: future equipment only.
- Deployment priority: GitHub-hosted cloud pool first. No local deployment in this pass.

## DeepSeek findings
- Official repository: https://github.com/deepseek-ai/deepseek-harness
- Upstream master HEAD observed: fcc0ad462172522aaf5c93a7b2e01f6b9f0b0159.
- npm latest channel observed: @deepseek-ai/dsh 0.2.1-rc.5.
- License: MIT; third-party dependency notices still apply.
- Status: Developer Preview; breaking changes expected.
- Upstream SAFETY.md says it has not undergone a security audit and must not be treated as production-ready.
- Cordis plugin composition covers model adapters, tools, agent loop, session log, shell/filesystem, sandbox, subagents, teams, background jobs, web, MCP, skills, credentials, storage, telemetry, UI and SDK.
- Headless profile is a one-shot CI-friendly runtime with no GUI/server/browser; SDK and ACP provide automation integration surfaces.
- DSH is selected as the primary candidate task runtime, not as the pool's authorization authority or scheduler.

## Related prototype
- Official repository: https://github.com/deepseek-ai/dsh-superagent-prototype
- HEAD observed: 8c32a9dc5d72c033816c6a8110b37f40cf94fba4.
- Authors explicitly describe it as a research prototype, not production-ready.
- Its Ticket/Mandate/Assignment/Executor/Report concepts are useful design references.
- Do not deploy it as-is; its documented worker execution policy is too permissive for our public cloud trust boundary.

## GitHub changes
1. Added architecture/adoption decision:
   - File: docs/architecture/DEEPSEEK-HARNESS-ADOPTION-AND-CLOUD-FIRST-PLAN.md
   - Commit: 327594a86ebd79c58cb17a0186c06488b5630354
   - Blob SHA: e5a518ab059ebde7f5eef3ee6b86a2651f5b7f39
2. Added isolated DSH headless smoke workflow:
   - File: .github/workflows/dsh-runtime-evaluation.yml
   - Commit: f566076647ae6ebbddac78e1dd978ae07d43836c
   - Blob SHA: df8a3788cd8ff4ba5c5b1009298f6bd81b80344d
   - Manual dispatch only; ubuntu-24.04; read-only contents permission; no secrets; telemetry disabled; read-only permission fallback; exact npm package version 0.2.1-rc.5; Node 24.9.0; setup-node action pinned to full commit 49933ea5288caeca8642d1e84afbd3f7d6820020.
   - Requires at least 6 GiB free before install.
   - Installs the pinned package in RUNNER_TEMP and runs only headless composition dump; no model task or provider credential is used.
   - Captures install footprint, disk, memory/time and composition hash in job summary.
3. Updated README with cloud-first status and evaluation links:
   - Commit: 52451e63a0a431d06ba66c4a77a9aeeb1dcfae80
   - Blob SHA: f406654204aeee8fc4a3524c3f509eaa7c8c5fb8
4. Clarified future-only local hardware placement in Jarvis architecture:
   - Commit: 696735b90e467e588630497d5beffd13cd365723
   - Blob SHA: 98f84dd24814ca91d4ade45fb3cf57535d8884ba

## Verification
- All four modified files were re-read from GitHub after commits.
- DSH evaluation workflow content was checked for manual trigger, read-only permissions, pinned setup-node SHA, fixed DSH version and no secrets.
- GitHub Actions workflow runs at final inspection: total_count 0.
- Combined status on architecture correction commit: empty statuses.
- No workflow has run; no runtime result, installation success, security qualification or agent profile qualification is claimed.
- No local host commands or installs were performed.
- No secrets or provider credentials were accessed.

## Architecture decisions
- DSH headless is the candidate for isolated cloud task runtime.
- GitHub Actions remains the elastic execution plane.
- Pool Bridge remains a separate future policy/authorization/dispatch boundary.
- GitHub Issues/PRs and workflow metadata are the phase-1 bootstrap ledger; PostgreSQL is deferred until durable storage is approved.
- LiteLLM is a later model gateway candidate; DSH custom provider compatibility must be tested, not assumed.
- Ollama model weights are deferred to the future GPU server.
- No permanent runner profile reservations; dynamic capability-based scheduling up to available account concurrency.
- No untrusted public PR execution on the local Mac mini.

## Current repository state
- Latest HEAD: 696735b90e467e588630497d5beffd13cd365723
- Branch: Основной
- Branch protection: previously observed disabled; re-check before enabling write-capable dispatch.
- Runner Resource Probe: IMPLEMENTED, NOT RUN.
- DSH Runtime Evaluation: IMPLEMENTED, NOT RUN.
- Runtime deployment: NOT RUN.
- Pool Bridge: DESIGN ONLY.
- Local Mac mini inventory: NOT RUN.
- Mac mini 2018 and GPU server: FUTURE / DESIGN ONLY.

## Next step
The owner should run both manual workflows in sequence:
1. Runner Resource Probe.
2. DeepSeek Harness Runtime Evaluation.

Review the actual runner free disk, Node version, npm installation footprint, DSH composition output, peak RSS and startup duration. Only after reviewing evidence should we decide whether to qualify DSH headless as the first cloud worker. No API key is needed for these two tests.

## Sources
- https://github.com/deepseek-ai/deepseek-harness
- https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md
- https://github.com/deepseek-ai/deepseek-harness/blob/master/SAFETY.md
- https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/headless/README.md
- https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/README.md
- https://github.com/deepseek-ai/dsh-superagent-prototype
- https://www.npmjs.com/package/@deepseek-ai/dsh
- https://docs.github.com/en/actions/reference/runners/github-hosted-runners
- https://docs.github.com/en/actions/reference/limits
- https://docs.github.com/en/actions/reference/security/secure-use
