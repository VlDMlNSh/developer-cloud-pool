# Live checkpoint — 2026-11-04: Worker dispatch authorization boundary

## Canonical refs
- Default branch `Основной` HEAD (live verified 2026-11-05): `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Documentation branch: `docs/continuation-context-2026-11-04`.
- PR #7 branch: `fix/pool-owner-approval-guard-2026-11-04`.
- PR #7 head: `d60d26ae647940e702d646e572c861a8f68f523e`; 15 commits ahead of default, 0 behind.
- PR #7 state: OPEN / DRAFT / NOT MERGED.

## Blocking finding
The Supervisor-side owner approval guard is not sufficient because `.github/workflows/pool-worker.yml` remains identical on default and PR #7 (blob `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`). It still exposes `workflow_dispatch` and validates issue open state, `pool:claimed`, target SHA and profile, but does not independently prove trusted dispatch provenance or bind authorization to the current workflow run/attempt. Direct/manual Worker invocation remains an unresolved path.

## Evidence
- PR #7 exact-head static CI [41909811327](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/41909811327), job `126854055084`: COMPLETED / SUCCESS. This does not verify the Worker authorization boundary.
- Supervisor blob: `b2046dd9671c6bd5491f63a006d10239fbd3d3b1`.
- Approval tests blob: `c7c7499d9d2bb4c123e72b86adb85369023c4284`.
- Security finding recorded in [PR #7 comment](https://github.com/VlDMlNSh/developer-cloud-pool/pull/7#issuecomment-6641832357), comment ID `6641832357`.
- Formal REQUEST_CHANGES review API rejected submission because the PR author is the repository owner. Independent review therefore remains NOT RUN.
- Dated report: [Worker dispatch authorization boundary audit](../reports/2026-11-04-worker-dispatch-authorization-boundary-audit.md).

## Governance and runtime
- `POOL_DISPATCH_ENABLED`: NOT VERIFIED in this pass. No change made.
- Ruleset and SentinelX current state: NOT RECHECKED in this bounded pass; do not infer current state from historical snapshots.
- Worker, DSH, Resource Probe, browser, model/provider calls: NOT RUN.
- No secrets or provider credentials accessed.
- Pool deployment: NOT DEPLOYED.

## Required next step
Design and implement Worker-side authorization so manual/direct dispatch cannot enter the probe job. Authorization must be independently verifiable, bound to issue number + immutable target SHA + exact profile + workflow run/attempt, and not rely on a public label/comment as a secret capability. Verify GitHub event actor/provenance semantics before selecting the mechanism. Add positive Supervisor-path and negative direct/manual-dispatch tests. Keep dispatch disabled; do not run Worker. Then exact-head static CI and genuinely independent review.

## Canonical links
- [Default branch](https://github.com/VlDMlNSh/developer-cloud-pool/tree/Основной)
- [PR #7](https://github.com/VlDMlNSh/developer-cloud-pool/pull/7)
- [Issue #1 governance](https://github.com/VlDMlNSh/developer-cloud-pool/issues/1)
- [Issue #5 browser runtime](https://github.com/VlDMlNSh/developer-cloud-pool/issues/5)
- [Full project context](../context/DEVELOPER-CLOUD-POOL-CONTEXT.md)


## Worker authorization architecture decision — 2026-11-04
- Current default HEAD: `692025e4a039aaf94c6683bb95da38b4f324fce8`.
- PR #7 head: `d60d26ae647940e702d646e572c861a8f68f523e`; 15 ahead / 0 behind; OPEN / DRAFT / NOT MERGED.
- Worker workflow remains unchanged on default and PR #7: blob `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`; standalone `workflow_dispatch` still lacks caller provenance enforcement.
- Official GitHub docs verified: `workflow_dispatch` is manually/API-triggerable; reusable workflows use `workflow_call`; inside a reusable workflow the `github` context belongs to caller and `job.workflow_*` identifies the called workflow. This supports a provenance gate using exact protected caller ref plus called workflow identity.
- Preferred design: migrate Worker to `workflow_call`, and refactor Supervisor from script-level REST dispatch to a two-phase planner + statically declared reusable-workflow matrix job (bounded at 20). Validate caller `github.workflow_ref`/SHA and called `job.workflow_repository`, `job.workflow_file_path`, and SHA; revalidate task envelope and approval in Worker.
- This is a design recommendation only; NOT IMPLEMENTED. It requires an orchestration/recovery refactor because reusable workflows cannot be invoked dynamically from a Node script step.
- Rejected shortcuts: actor-only check (`github.actor` does not identify which workflow called); public issue labels/comments as capabilities; unverified new HMAC secret/replay contract; removing `workflow_dispatch` without replacing Supervisor dispatch.
- Report: [Worker authorization architecture decision](../reports/2026-11-04-worker-authorization-architecture-decision.md).
- PR #7 exact-head static CI [41909811327](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/41909811327): SUCCESS, but independent review remains NOT RUN.
- `POOL_DISPATCH_ENABLED`: NOT VERIFIED in this pass; no variable or secret mutation. Worker/DSH/Resource Probe/browser/model execution: NOT RUN.
- Next: extract a pure Supervisor task-matrix builder with schema/bounds/duplicate/SHA/profile/approval tests. Do not yet wire it to reusable workflow or run Worker.


## Task Matrix Builder pass — 2026-11-04
- Created isolated branch `feat/supervisor-task-matrix-builder-2026-11-04` from PR #7 immutable head `d60d26ae647940e702d646e572c861a8f68f523e`.
- Added pure `scripts/pool-task-matrix.mjs` and `scripts/pool-task-matrix.test.mjs`.
- Builder rejects non-open issues, PRs, missing `pool:ready`, malformed target SHA/profile, missing or mismatched approval envelopes, duplicate issue numbers, invalid bounds, and more than 20 tasks. It emits deterministic `{ include: [...] }` matrix entries.
- Local Node test: 9 passed / 0 failed. GitHub read-back verified module blob `ac0012e8c52e02be6d29e007a5cf8a2aa09113a4` and test blob `f32fd0914b8c96588d977545ec5eb9e0b7133275`.
- Opened draft PR [#8](https://github.com/VlDMlNSh/developer-cloud-pool/pull/8) targeting PR #7 branch; head `0a8dba68aa12070b3768d6fb834bedf404ed5d99`. PR #8 exact-head workflow runs/status contexts empty: CI NOT VERIFIED. Independent review NOT RUN. PR is not accepted.
- This is an isolated pure component, NOT integrated into Supervisor. Approval authenticity still depends on caller obtaining approval via trusted `pool-approval.mjs`; the builder does not authenticate GitHub comments itself.
- PR #7 direct Worker `workflow_dispatch` gap remains BLOCKING. No dispatch, Runner, Worker, DSH, browser, model, secret or variable action. `POOL_DISPATCH_ENABLED` NOT VERIFIED.
- Report: [Supervisor Task Matrix Builder](../reports/2026-11-04-supervisor-task-matrix-builder.md).
- Next: implement/test a pure Supervisor planner that obtains approvals through `hasOwnerApproval`, constructs typed builder inputs, and specifies atomic claim/consume ordering and per-matrix terminal recovery. Do not wire to Worker until reusable workflow provenance and recovery design are reviewed.


## iOS Simulator / capacity / agents / API credential architecture audit — 2026-11-05
- Recommendation: do NOT install iOS Simulator into Linux workers or as a persistent pool service. Xcode Simulator is a macOS/Xcode capability; use a dedicated on-demand ephemeral macOS job for Xcode build + Simulator + XCTest/XCUITest. Use physical-device checks for hardware-specific behavior. Apple documentation: https://developer.apple.com/documentation/xcode/running-your-app-on-simulated-or-physical-devices
- A separate ephemeral macOS job does not compete with Linux worker CPU/RAM. It does consume macOS job time, runtime downloads, disk and concurrency while active. Current GitHub pricing documentation lists standard macOS 3/4-core M1/Intel at $0.062/min; public standard-runner use is free under published policy, while private included minutes and overage depend on plan. Re-check billing before activation: https://docs.github.com/en/billing/reference/actions-runner-pricing and https://docs.github.com/en/billing/concepts/product-billing/github-actions
- Existing 20-runner table describes logical scheduling profiles, not deployed/qualified machines. Current architecture says most profiles PLANNED. Do not treat the agent roster as installed or operational.
- Placement: Linux lightweight validation/docs/API/security and one coding runtime per job; separate ephemeral Linux browser operator (agent-browser + Chromium) and Playwright deterministic QA; ephemeral macOS iOS build/simulator; GPU inference only on future qualified GPU host/managed endpoint; persistent task ledger/Pool Bridge on managed service or qualified always-on host.
- Avoid one giant image with all agents. Keep DSH experimental (upstream developer preview/safety warning); use one primary coding agent after qualification. Gemini 3 roles only through approved controller; browser/Playwright distinct; Aider/Goose/mini-SWE/OpenHands opt-in only after benchmark.
- API keys: none required for static validation, Resource Probe or Simulator tests. Phase 0 only job-scoped least-privilege GITHUB_TOKEN; no PAT, no model key. Phase 1 select one provider route (Gemini OR Anthropic OR OpenAI OR DeepSeek) through a Model Gateway with quotas, token/cost telemetry, model allowlist and paid fallback hard-deny; do not inject raw long-lived provider keys into generic workers. Phase 2 credentials only for approved integrations: App Store Connect Issuer ID/Key ID/.p8 in release-only workflow; Google/YouTube, Meta, Telegram, TikTok credentials in separate platform adapter scopes; GitHub App private key only in broker; object storage credentials short-lived/scoped. No keys were added.
- No iOS/macOS workflow created, no simulator installed, no API keys/secrets accessed, no runner dispatch, no model or platform API calls.
- Dated report: [Cloud Pool iOS, capacity, agents and API audit](../reports/2026-11-05-cloud-pool-ios-capacity-agents-api-audit.md).
- Next bounded step: design-only iOS macOS runner profile contract and static tests (macOS label, pinned Xcode selection, simulator matrix, concurrency=1, timeout, no general secrets, no signing, no persistent self-hosted runner). Do not create runnable workflow until Worker authorization/governance/CI/review gates pass. Measure actual Linux runner resources via read-only probe before updating 20-slot capacity assumptions.


## Live update — 2026-11-05: GitHub Free-only policy guard

- Repository visibility: PUBLIC. Immutable constraint: GitHub Free only; zero automatic charges; no paid runner, model/API fallback, external paid compute/storage/browser or custom runner image.
- PR #10: https://github.com/VlDMlNSh/developer-cloud-pool/pull/10 — OPEN / DRAFT / NOT MERGED. Branch `feat/github-free-tier-policy-guard-2026-11-05`; exact head `fa308f0178fe332851cc8b5a8c43b564912c37a6`.
- Exact-head CI run `41913465969`, job `126866831669`: COMPLETED / SUCCESS on standard `ubuntu-24.04`. YAML parse, dispatch-disabled assertion, Free-only policy validator, nine Node tests and existing pool contract validator all passed.
- Initial CI attempt on earlier head `36042186afed101cf8cf65ad946c5a72b41a732c` failed due over-escaped regexes; corrected in `fa308f0178fe332851cc8b5a8c43b564912c37a6`.
- Validator requires literal standard Ubuntu/Windows/macOS labels, timeout 1–30 minutes, matrix max-parallel 1–4; rejects dynamic/self-hosted/larger/GPU labels, custom job images/containers and explicit paid-fallback config.
- Standard ephemeral macOS remains allowed for future Xcode/Simulator tests; not implemented or run.
- PR #10 independent review: NOT RUN. Keep DRAFT; do not merge without independent review and fresh exact-head verification.
- PR #7 remains open/draft; Worker caller provenance unresolved. PR #8 and PR #9 remain open/draft with exact-head CI/review not verified.
- Active Ruleset ID 26550182 applies to `refs/heads/Основной`, but required approvals = 0; independent review remains a separate gate.
- `POOL_DISPATCH_ENABLED`: NOT VERIFIED. No secrets/variables read or changed; no workflow dispatch, Worker, DSH, Resource Probe, browser or model execution.
- Report: [GitHub Free-only policy guard implementation](../reports/2026-11-05-github-free-tier-policy-guard.md). Contract: [GitHub Free-only workflow contract](../architecture/GITHUB-FREE-TIER-WORKFLOW-CONTRACT.md).
- Next: resolve Worker caller provenance and safe reusable-workflow orchestration/recovery. Keep dispatch disabled.


## Live update — 2026-11-05: Gemini independent review request

- User requested three manually launched Gemini agents for bounded independent review. The requirement was accepted in principle, but manual/direct Gemini invocation outside the approved controller is prohibited.
- Rechecked default branch `Основной` HEAD `64d2636d4500127e635c214ccfb722c6b3fcda80`; repository is PUBLIC. Documentation branch before this update: `06ba03c06c66355be556bb285dc14bdc2963d78d`.
- Inspected the full default-branch workflow tree: only `dsh-runtime-evaluation.yml`, `pool-contract-validation.yml`, `pool-supervisor.yml`, `pool-worker.yml`, `runner-resource-probe.yml`. `.github/workflows/gemini-batch-dispatch-controller.yml` is absent. No Gemini-capable connector/tool is available in this environment.
- Existing `pool-worker.yml` is a DSH probe with standalone `workflow_dispatch`; it is not a Gemini controller and has unresolved caller-provenance risk documented in PR #7. `pool-supervisor.yml` has write permissions and reconciliation/dispatch side effects; it is not a review-only launcher. Neither may be repurposed for Gemini review.
- Prepared bounded three-role read-only review packet for PR #10 at immutable SHA `fa308f0178fe332851cc8b5a8c43b564912c37a6`: [Gemini independent review packet](../reviews/2026-11-05-gemini-independent-review-packet-pr10.md). Roles: implementation/policy semantics; adversarial tests; security/governance/provenance. Agents must work independently and cannot modify code or repository state.
- Packet status: PLANNED / BLOCKED — NOT DISPATCHED. No controller run ID, child run/job IDs, artifacts or Gemini reports exist. Do not describe this as a completed review.
- PR #10 remains OPEN / DRAFT. Exact-head CI run `41913465969`, job `126866831669`, COMPLETED / SUCCESS. This is CI evidence only, not independent review or acceptance.
- No direct Gemini/API call, workflow dispatch, secret/variable access, DSH, browser, Resource Probe, or paid service was used.
- Next safe step: qualify/add the approved controller contract in this repository (or establish an explicitly approved integration with a controller whose contract is verifiably in scope), then dispatch this exact immutable review packet through that controller only. Keep PR #10 draft and pool dispatch disabled/unmodified.


## Live update — 2026-11-05: Gemini controller contract and PR #10 audit

- Rechecked default branch `Основной` HEAD `64d2636d4500127e635c214ccfb722c6b3fcda80`, documentation branch prior HEAD `a569c805fa082dace999b4542cafb8b387358091`, repository PUBLIC and active Ruleset ID `26550182` (selector `refs/heads/Основной`; PR required; approvals=0; no bypass; current-user bypass never). Classic branch protection endpoint reports `protected:false`; retain distinction from active Ruleset.
- PR #10 remains OPEN/DRAFT/NOT MERGED at exact head `fa308f0178fe332851cc8b5a8c43b564912c37a6`; exact-head CI run `41913465969` COMPLETED/SUCCESS; formal review list empty. PR #9, #8, #7 remain open/draft/unmerged at previously recorded heads.
- Source audit found PR #10 dispatch gate rejects only literal `true`; unset/unexpected values pass. This does not prove explicit `false`. Current `POOL_DISPATCH_ENABLED` remains NOT VERIFIED; no variable/secret was read or changed.
- PR #10 Free-only validator is line-oriented regex parsing, not full YAML parsing, and does not prove transitive reusable-workflow coverage. Nine tests do not establish complete policy coverage. Treat policy guard as preliminary, not complete security qualification.
- Added design-only [Gemini review controller contract](../architecture/GEMINI-REVIEW-CONTROLLER-CONTRACT.md). It defines manual-only controller entry, immutable PR SHA, workflow provenance, three isolated read-only roles, least-privilege token, provider free-quota/zero-paid-fallback gate, artifact digests and no auto-approval. No runnable workflow was added.
- Gemini controller remains absent from default and docs branch; no Gemini-capable tool/connector or qualified provider free route/credential contract is available. Gemini agents NOT RUN; no controller run IDs, child IDs, reports or artifact digests.
- No Worker, Supervisor dispatch, DSH, Resource Probe, browser, provider API, secrets or variables accessed. Pool dispatch remains unmodified; current dispatch variable NOT VERIFIED.
- Report: [2026-11-05 Gemini controller contract and PR #10 audit](../reports/2026-11-05-gemini-controller-contract-and-pr10-audit.md).
- Next bounded step: strengthen PR #10 validation with real YAML parsing, adversarial fixtures and transitive reusable-workflow coverage; keep PR draft until independent review. Do not implement/dispatch Gemini until provider free-tier evidence and exact credential contract are qualified.
