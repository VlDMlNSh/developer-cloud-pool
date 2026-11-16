# 2026-11-16 — Cloud Code agent fleet architecture pass

## Scope
Documentation-only architecture refinement on the existing documentation continuation branch. No runtime or production changes.

## Decisions recorded
- One Jarvis control/experience plane dispatches into two isolated execution profiles: Development Cloud Code and Media Cloud Code.
- Each profile has a lead/orchestrator; specialist agents/workers are logical roles and may be subagents, separate processes or external model-backed workers.
- Development roles: research, architecture, bounded implementation, test/CI, security/dependency audit, documentation/evidence.
- Media roles: script/storyboard, asset/continuity, generation, render/transcode, quality/packaging.
- Code-writing agents must use separate Git worktrees/branches and explicit file ownership. Integration is serialized; the lead integrates; an independent verifier checks the combined diff. No self-approval or direct protected-default-branch writes.
- A canonical task/result envelope binds immutable input/target, role/profile, allowed scope/tools, credential reference (not value), provider/account/quota identity, budget/concurrency/deadline, idempotency/cancellation, test requirements and artifact digests.
- Claude Code subagents are a candidate for in-profile specialist work. Gemini/Qwen/DeepSeek and other providers remain separate adapter-backed workers; Claude Code is not assumed to be a universal multi-provider gateway.
- FCC and ECC remain unselected pending source, license, compatibility and security audit.
- Mature candidates reviewed: Claude Code subagents/worktrees/hooks, LangGraph, OpenHands Agent Server/SDK, LiteLLM Proxy and ComfyUI. None adopted or deployed. Prefer the smallest component that closes a demonstrated gap.

## Evidence reviewed
- Anthropic Claude Code guidance describes subagents with isolated contexts, custom tool/model permissions, worktree isolation and parallel task patterns.
- LangGraph documentation describes stateful graph orchestration, durable execution and human-in-the-loop controls.
- OpenHands describes an Agent Server API for running multiple agents and a separated SDK/API, UI and automation architecture.
- LiteLLM documents virtual keys and rate limits; its budget enforcement requires persistent database state and coordinated multi-instance limits require shared Redis. A DB-less budget configuration must not be treated as a hard spending cap.
- ComfyUI exposes workflow submission, queue and job APIs suitable for a future typed media adapter; this does not establish free GPU availability or model eligibility.

## Current state and limits
- Contour A remains the only active build and acceptance priority: NOT ACCEPTED.
- The architecture branch is documentation-only and is not merged into default branch.
- No Claude Code/FCC/ECC installation, provider call, Gemini dispatch, secret read, GPU provisioning, paid resource, web-console deployment, runtime code change or MediaHub product implementation occurred.
- No executable tests were run; this pass changes architecture documentation only.
- All candidate software and provider integrations remain NOT VERIFIED for this project.

## Next bounded step
Continue Contour A from its live issues/PRs and exact-head evidence. In parallel, keep the Cloud Code architecture at proposal level until Contour A is ACCEPTED. After acceptance, qualify one Development Cloud Code profile with a minimal two-role pilot (lead + isolated researcher/verifier) before scaling the fleet; Media Cloud Code remains a separate later phase with its own resource and security approval.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
