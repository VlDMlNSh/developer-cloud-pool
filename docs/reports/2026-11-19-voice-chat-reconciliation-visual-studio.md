# Voice-chat reconciliation — Visual Studio and Jarvis build sequence

Date: 2026-11-19
Repository baseline: `Основной` @ `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`
Documentation branch: `docs/next-2026-11-19-integrated-contour-pass`
Scope: reconcile the 2026-11-19 voice discussion with the frozen Cloud Pool Contour A architecture. This is a documentation decision record, not an implementation or acceptance claim.

## Decisions

### 1. Microsoft Visual Studio is explicitly included

Use the exact product name **Microsoft Visual Studio** for the full Windows IDE. It is a developer workstation/tooling layer for opening solutions, editing code, building, debugging, running tests, inspecting compiler diagnostics and reviewing diffs.

It is NOT:
- the Jarvis runtime or cloud execution pool;
- the Model Gateway or an authentication bridge between providers;
- a mandatory always-on server;
- a substitute for GitHub Actions, the D1 authority, sandbox isolation or durable state.

The Cloud Pool remains cloud-first and GitHub-governed. Visual Studio is an optional engineering cockpit connected to repository workspaces and approved local/remote development workflows.

### 2. Claude integration in Visual Studio

Do not conflate **Microsoft Visual Studio** with **Visual Studio Code**.

- Anthropic's official Claude Code IDE extension is for VS Code and supported VS Code forks; it is not an official native Visual Studio IDE extension.
- For full Microsoft Visual Studio, the conservative supported baseline is Claude Code CLI launched from Visual Studio's integrated terminal in the solution/workspace directory. The CLI retains its own provider authentication and permission controls.
- Community Visual Studio extensions exist, including projects claiming Visual Studio 2022/2026 support. They are third-party, not Anthropic-supported. Do not install or grant them repository/terminal/debugger permissions until source, publisher, license, release provenance, requested permissions, loopback/MCP exposure and version compatibility have been reviewed.
- Prefer the official Claude Code CLI path first; treat a native VS extension as an optional separately qualified adapter.

References:
- Anthropic Claude Code FAQ: https://support.claude.com/en/articles/12386420-claude-code-faq
- Official Claude Code VS Code Marketplace extension: https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code
- Example community Visual Studio bridge (research candidate only): https://github.com/LairdLuca/ClaudeCodeVS

### 3. Reconciled brain / executor architecture

The voice discussion proposed ChatGPT, Claude, Gemini and Codex as possible intelligence/tools. These are technology leads, not a new authorization to add four mandatory runtime dependencies.

The latest owner-frozen Contour A direction remains authoritative:
- Initial CODE execution candidate: one Claude Code + selected ECC + FCC profile, subject to the existing qualification gates.
- Executor identity is separate from capability profile, provider route/account, host identity and lease owner.
- PR #142 records executor identity examples `claude-code-1`, `codex-1`, `gemini-1`; these IDs do not themselves authorize execution.
- Codex and Gemini remain optional/deferred from the initial launch gate unless a later owner-approved architecture decision changes scope. Gemini may only be dispatched through the approved controller after its gates pass.
- ChatGPT can remain an external architecture/review interface; do not assume a ChatGPT API runtime, key, quota or paid fallback is included.
- Provider keys, subscriptions, account identities and quota domains are never interchangeable. No Gemini key can authenticate Claude, and no provider key is a generic cross-provider credential.

### 4. Nine-stage Jarvis overview aligned to the Contour A runbook

The conversational nine stages are a high-level user-facing map, not a replacement for the normative A0–A7 acceptance runbook:

1. Body — GitHub-hosted control plane, approved worker runtime and sandbox.
2. Brain — one qualified CODE executor first; provider routing only when separately authorized and qualified.
3. Memory — durable task, approval, lease, attempt, artifact and audit state; D1 remains a candidate until hosted qualification.
4. Hands — least-privilege tools and executor adapters, with Visual Studio as an optional developer IDE rather than a cloud agent.
5. Orchestration — owner-only intake, admission, queue/outbox, fenced leases, retry and reconciliation.
6. Security — immutable capability profile, secret isolation, quotas, sandbox, network policy and provenance.
7. Remote interface — authenticated web/PWA usable from phone and desktop.
8. Observability — logs, status, artifacts, resource ceilings and audit.
9. Qualification — integrated fault-injection, exact-head CI, independent review and explicit ACCEPTED decision.

Dependency order remains A0 baseline/governance → A1 immutable CODE profile → A2 canonical D1 lineage → A3 trusted admission/lease → A4 sandbox/provenance → A5 end-to-end control plane → A6 web interface/persistence → A7 independent qualification/acceptance. Do not build the user-facing nine stages in parallel if doing so bypasses these gates.

### 5. Time estimate: accounting correction

The earlier “45 hours” figure is an engineering-effort estimate, not a measured timer or a sum of chat durations. GitHub commits, PRs and workflow runs prove discrete deliverables, but do not establish how many human/assistant labor hours elapsed. Voice transcript timestamps establish only the duration of that recorded session, not the previous day's work.

Therefore:
- Completed engineering hours: **NOT MEASURED**.
- Remaining hours from the original 45-hour estimate: **cannot be calculated as 45 minus an invented number**.
- Treat 45 hours as a planning baseline only, not as a verified burn-down.
- A current forecast should be re-estimated from the remaining acceptance gates after A1 profile freeze and the integrated D1/sandbox path are proven. Any forecast must state assumptions and a range; do not report it as actual time worked.
- For future accounting, record per-pass start/end timestamps, target SHA, tasks, tool/CI time separately, and active engineering time. Keep voice conversation duration separate from implementation/test execution time.

## Current status and limits

- Default branch at reconciliation: `Основной` @ `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- PR #145 is OPEN / DRAFT / UNMERGED; this decision record is on its documentation branch only.
- No Visual Studio installation, extension installation, provider sign-in, provider API call, deployment, production dispatch or code/runtime modification was performed.
- Visual Studio integration: DESIGN DECISION RECORDED; actual local IDE availability and extension qualification NOT VERIFIED.
- Contour A remains BLOCKED / NOT ACCEPTED. Contour B remains DEFERRED.

Next: include this decision record in PR #145 review, then continue the A1 owner-defined immutable CODE profile and A2 canonical D1 integration on a clean current-base branch. Keep dispatch and execution authorization fail-closed.
