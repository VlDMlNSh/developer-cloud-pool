# 2026-11-05 — Cloud Pool capacity and iOS toolchain architecture audit

## Executive decision
Do not install an iOS Simulator into the Linux Cloud Pool workers. Add a separate, on-demand macOS CI profile for Xcode build and Simulator/XCUITest jobs. Keep it outside the always-on logical Linux worker classes and admit it through a separate cost/concurrency budget.

The pool's 20 logical slots are scheduling classes on ephemeral jobs, not persistent machines. The existing 20-runner architecture and Jarvis reference architecture are designs, not proof of installed or qualified components. The only current executable scaffold is the fail-closed GitHub Supervisor/Worker path; PR #7/#8 remain open drafts and Worker dispatch is blocked.

## iOS simulator placement
Apple's supported Xcode Simulator is a macOS/Xcode capability. Apple explicitly describes Simulator as running on a Mac and notes that it does not reproduce all physical-device performance/hardware behavior. Therefore:
- Linux GitHub jobs: Swift static checks that are Linux-compatible, API/schema tests, backend, docs, web, security, browser and ordinary agents.
- macOS GitHub job: Xcode build, unit tests that require Apple SDKs, Simulator boot, XCTest/XCUITest, screenshot/accessibility checks.
- Physical-device verification: separate release/acceptance gate for camera, notifications, background execution, push, hardware codecs, biometrics, real networking/performance and signing/device installation.
- The macOS job must be ephemeral and on-demand, with one or a small matrix of pinned Xcode/iOS runtimes; never leave a simulator booted or reserve a permanent runner.

A simulator installation does not slow unrelated Linux jobs because it runs on a separate macOS VM. It does increase macOS job startup, download/storage, and job runtime. If mistakenly installed on a shared self-hosted host, it would compete for disk/RAM/CPU and pollute the worker image. Avoid that design.

## Cost and runner sizing
Current GitHub billing documentation lists standard macOS 3/4-core M1/Intel at $0.062/minute; public-repository standard runner use is free under the published policy. Private-repository included minutes depend on plan; excess usage is billed. Do not infer the user's account entitlement. A 30-minute macOS job at the listed rate corresponds to $1.86 before any applicable included allowance. Larger runners are separate and more expensive. Re-check current rates and repository visibility before enabling the workflow.

The architecture document's older 4 vCPU / 16 GB / 14 GB baseline for standard Ubuntu runners is no longer safe to assume: current GitHub documentation distinguishes public/private images and current standard Linux private runner specifications can be 2 vCPU / 8 GB / 14 GB. Measure actual runtime characteristics in a read-only probe and update capacity assumptions from telemetry.

## Component selection and current readiness
The reference architectures select a broad candidate ecosystem but do not prove that components are installed or qualified. Current verified statuses:
- GitHub Actions Supervisor/Worker: scaffold implemented, dispatch fail-closed; Worker dispatch authorization gap remains blocking.
- DSH: developer-preview candidate; no production qualification, no model/provider call.
- Task Matrix Builder: isolated pure component in draft PR #8; 9 local tests passed; exact-head CI NOT VERIFIED; independent review NOT RUN; not wired into Supervisor.
- agent-browser/Chromium: design in Issue #5; not installed or smoke-tested.
- Gemini three-role controller, Ollama/FCC/Claude/ECC, Codex, Aider, Goose, mini-SWE-agent, OpenHands: candidate profiles, not operationally qualified.
- Browser and Playwright should remain distinct: interactive browser operator versus deterministic test runner.
- No iOS/macOS workflow or simulator runtime is implemented in the pool as of this audit.
- Mac mini 2011 is an auxiliary/admin host, not a production worker. Mac mini 2018 and remote GPU host are future hardware in the current DSH adoption plan, not available capacity.

## Efficient placement recommendation
| Execution class | Workloads | Placement |
|---|---|---|
| Linux lightweight | validation, policy, docs, API/unit tests, static analysis | ephemeral ubuntu runner |
| Linux agent coding | one selected coding runtime per task; separate worktree | ephemeral ubuntu runner |
| Browser operator | agent-browser + Chromium, clean profile | dedicated ephemeral ubuntu runner |
| Deterministic UI QA | Playwright | separate ephemeral ubuntu runner, combine only after resource measurements |
| iOS build/test | Xcode, Simulator, XCTest/XCUITest | on-demand ephemeral macOS runner |
| GPU inference | Ollama, embeddings/reranking, vision/audio if qualified | future GPU node or managed inference endpoint; never standard GitHub runner |
| Persistent control/data | Pool Bridge, PostgreSQL, task ledger, checkpoints, audit | future managed service or verified always-on host; not runner filesystem |
| Independent review | read-only patch/test/provenance audit | isolated runner, no write token or provider secret |

Do not install all agent CLIs into one image. Select one primary runtime per task and use adapters for alternatives. DSH and other agent runtimes are not authorities. Avoid simultaneously installing Aider, Goose, mini-SWE-agent and OpenHands into the same base image; enable them as opt-in profiles only after a benchmark proves value.

## Agent additions / priorities
Priority 0 (required foundations, not more agents):
1. GitHub Actions security/provenance validator and independent reviewer.
2. Resource qualification probe and benchmark harness.
3. Task ledger/lease/retry/checkpoint protocol and evidence collector.
4. Model Gateway with quota/rate limits and strict paid-fallback deny.
5. Secret broker / GitHub App short-lived token minting.

Priority 1:
- Gemini three roles only through the approved controller after controller contract and governance pass.
- One primary coding agent profile (choose Codex CLI or Claude Code as first production candidate after route and credential qualification; keep DSH experimental until its upstream safety/security status is resolved).
- agent-browser on ephemeral Linux, plus separate Playwright.
- iOS/macOS Xcode + Simulator profile.

Priority 2, opt-in after measurement:
- mini-SWE-agent for issue-to-patch experiments.
- Aider as a lightweight alternative patch agent.
- Goose only where MCP recipes provide measurable value.
- OpenHands SDK only for tasks requiring its sandbox/workspace orchestration; heavier footprint makes it a later profile, not a default.
- Repository Intelligence / Docling / Crawl4AI / SearXNG as separate ingestion profiles, not installed on every worker.

## API credentials — phased allowlist
No API key is required for the current static pool tests, resource probes, or iOS Simulator tests. Do not create or inject credentials until the corresponding workflow and secret-isolation gates pass.

Phase 0 — no provider keys:
- GitHub Actions job-scoped GITHUB_TOKEN with minimal per-job permissions.
- No PAT in workers. No model credentials for DSH smoke or browser smoke.

Phase 1 — one model provider route at a time, only through Model Gateway:
- Gemini API key OR Anthropic API key OR OpenAI project/service-account key OR DeepSeek API key, according to the selected route and actual supported free/approved quota.
- Keep each provider credential separate; no multi-provider key in a general agent job.
- Store at gateway/secret broker; workers receive short-lived scoped access or gateway-mediated calls, not raw long-lived keys.
- Enforce model allowlist, max tokens, request budget, daily/monthly cap, per-task cap, retry ceiling, and paid fallback hard-deny. Record provider/model/route, token usage, quota source and cost metadata, never the key.
- Do not add all four keys speculatively. Start with one provider after route qualification, then add a second only for resilience after failover is tested without paid fallback.

Phase 2 — platform and release integrations only when required:
- Apple App Store Connect API key material (Issuer ID, Key ID, .p8 private key) for a dedicated release/signing workflow only; not required for Simulator tests. Store the private key in a release-only secret scope and never expose it to general agents.
- Google OAuth client credentials only for approved YouTube/Google API read/write adapter tasks.
- Meta app credentials only for approved Instagram/Facebook adapter scope.
- Telegram bot token only for a dedicated bot adapter.
- TikTok developer app credentials only after app/API access and platform policy are approved.
- Sentry/PostHog DSN or write tokens only if observability/analytics is selected; prefer public ingest DSNs where safe and keep admin tokens out of workers.
- S3-compatible storage credentials only after durable artifact storage is selected; use scoped, short-lived object credentials.
- GitHub App ID/private key/installation access only for cross-repository broker tasks, not general workers; use installation tokens with narrow repo permissions.

Never put signing keys, social tokens, App Store Connect private keys, GitHub App private keys, or general provider API keys into public issue bodies, repository files, build logs, browser jobs, or general coding agents. No secret names/aliases should be created until a reviewed contract maps exact consumer workflow and permissions.

## Explicit exclusions
- No persistent iOS Simulator service.
- No simulator installation on the Mac mini 2011 or Linux worker.
- No self-hosted runner for untrusted public PR code.
- No 20-worker agent image containing all toolchains.
- No model/API secrets added in this pass.
- No runner dispatch, browser smoke, DSH execution, model calls, App Store operation or social API access.

## Evidence and sources
- Current pool design: [20 Runner Architecture](https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/docs/architecture/CLOUD-POOL-20-RUNNER-ARCHITECTURE.md).
- Hybrid platform: [Jarvis Reference Architecture](https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/docs/architecture/JARVIS-HYBRID-PLATFORM-REFERENCE-ARCHITECTURE.md).
- DSH adoption plan: [Cloud-first plan](https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/docs/architecture/DEEPSEEK-HARNESS-ADOPTION-AND-CLOUD-FIRST-PLAN.md).
- Browser runtime issue: [Issue #5](https://github.com/VlDMlNSh/developer-cloud-pool/issues/5).
- Security blocker: [PR #7](https://github.com/VlDMlNSh/developer-cloud-pool/pull/7).
- Matrix builder: [PR #8](https://github.com/VlDMlNSh/developer-cloud-pool/pull/8).
- Apple Simulator documentation: https://developer.apple.com/documentation/xcode/running-your-app-on-simulated-or-physical-devices
- Apple Xcode requirements: https://developer.apple.com/xcode/system-requirements/
- GitHub runner pricing: https://docs.github.com/en/billing/reference/actions-runner-pricing
- GitHub Actions billing: https://docs.github.com/en/billing/concepts/product-billing/github-actions

## Next bounded implementation
Add a design-only iOS macOS runner profile contract and static validation tests (runner label, Xcode selection, simulator device/runtime matrix, timeout, concurrency 1, no general secrets, no signing, no persistent self-hosted runner). Do not add a runnable workflow or dispatch until governance, PR #7 authorization and CI/review gates pass. Separately update runner capacity assumptions using measured read-only resource probe.
