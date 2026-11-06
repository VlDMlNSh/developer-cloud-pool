# Cross-chat continuation checkpoint — Developer Cloud Pool — 2026-11-06

Purpose: durable hand-off for any new ChatGPT chat. A user message containing /next resumes from this checkpoint after refreshing GitHub state. This is context/navigation, not authorization to dispatch, access secrets, deploy, or spend money.

## 1. Project identity and priorities

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch: Основной
- Last observed default HEAD: 64d2636d4500127e635c214ccfb722c6b3fcda80. Refresh before every action.
- This project is separate from https://github.com/VlDMlNSh/mediahub-os. MediaHub OS is an upstream source for provider/model registry and governance context; do not merge authority or repository state.
- Product priority: (1) secure remote Jarvis web console usable from iPhone and desktop browser; (2) native iOS Developer Mobile AI / Media Assistant for media intake, organization/classification and assistance with image/video/instruction generation; (3) external owner-operated servers after cloud-first pool qualification.
- Model routing and renewable/free quota optimization are parallel infrastructure work and must not delay first secure web access.
- UI visual direction: restrained graphite/gray, no prominent blue/green accent. Reuse the existing vanilla graphite dashboard; prefer mature maintained components over custom rewrites.

## 2. Current documentation branch

- Branch: docs/cross-chat-continuation-2026-11-06
- Created from immutable default-branch baseline 64d2636d4500127e635c214ccfb722c6b3fcda80.
- This checkpoint is intended to become the durable cross-chat entry point.
- Dated report: ../reports/2026-11-06-cross-chat-continuation-report.md

## 3. Web console — current PR evidence

Controlling issue: https://github.com/VlDMlNSh/developer-cloud-pool/issues/22

### PR #24 — hosting ADR and Experience API
- https://github.com/VlDMlNSh/developer-cloud-pool/pull/24
- Branch docs/jarvis-web-experience-adr-2026-11-06
- Latest observed HEAD d9a7389d4bb5562bb6f2a1e853ebc818659e2cd6; base Основной @ 64d2636d4500127e635c214ccfb722c6b3fcda80.
- OPEN / DRAFT / UNMERGED; mergeable true; 0 formal reviews and 0 inline review threads at last check.
- Exact-head run 42188894226 Jarvis Experience OpenAPI Validation: completed SUCCESS.
- Exact-head run 42188894227 Pool Contract Validation: completed SUCCESS.
- Combined commit-status endpoint returned empty array; the two named workflow runs are the positive evidence.
- Key files: docs/architecture/JARVIS-WEB-EXPERIENCE-HOSTING-ADR-2026-11-06.md and contracts/jarvis-experience-api-v1.yaml.
- Candidate only, not accepted or deployed.

### PR #25 — Hono web console prototype
- https://github.com/VlDMlNSh/developer-cloud-pool/pull/25
- Branch feat/jarvis-hono-web-prototype-2026-11-06
- Latest observed HEAD d8521571ede91d7f6d7fb6d5ee37747ac94385ea; base Основной @ 64d2636d4500127e635c214ccfb722c6b3fcda80.
- OPEN / DRAFT / UNMERGED; mergeable true; 0 formal reviews and 0 inline review threads at last check.
- Exact-head run 42188468546 Jarvis Web Prototype Validation: completed SUCCESS.
- Exact-head run 42188468584 Pool Contract Validation: completed SUCCESS.
- Earlier job read-back confirmed npm ci, static checks, negative API tests, static dashboard contract and dispatch-disabled security assertion. Re-read jobs before relying on detailed acceptance claims.
- Reuses graphite static UI, Hono Worker and Workers Static Assets. Health is service-only; protected reads return 503; mutation routes return 405.
- Test-only auth fixtures are not production authentication. OAuth/session and live GitHub data adapter are NOT IMPLEMENTED.

### PR #23 — mobile assistant scope
- https://github.com/VlDMlNSh/developer-cloud-pool/pull/23
- Branch docs/mobile-media-assistant-scope-2026-11-06
- Latest observed HEAD f78832dfa1fa86c553ec76eb82477da7c3f5324a.
- OPEN / DRAFT / UNMERGED; mergeable true. Exact-head workflow runs and combined status contexts were empty: CI NOT VERIFIED. Formal review count not re-read in this pass.
- Issue #21: https://github.com/VlDMlNSh/developer-cloud-pool/issues/21
- Native iOS, local models, media generation adapters: NOT IMPLEMENTED / NOT QUALIFIED. Start after web-console milestone acceptance.

## 4. Hosting, OAuth and security boundary

- Preferred hosting candidate: Cloudflare Workers Static Assets + Hono. Candidate only.
- Cloudflare Access is excluded from the no-card path. Do not ask owner to retry payment onboarding, substitute payment methods or bypass billing checks.
- workers.dev namespace jarvis-developer-cloud-pool.workers.dev was provisioned and read back successfully in prior Cloudflare connector work. This does not prove Workers Free entitlement or deployment readiness.
- Latest recorded Cloudflare state: 0 Worker scripts; Workers Free entitlement NOT VERIFIED because connected OAuth integration lacked Billing Read; Access disabled/not required; no Worker deployment.
- Recheck Cloudflare state read-only before any deployment. Do not create billable resources, upgrade, add payment instruments or use paid fallback.
- Intended identity flow: direct server-side GitHub OAuth App; state + PKCE S256; exact callback; server-side code exchange; retrieve authenticated GitHub /user; authorize only immutable numeric owner GitHub user ID; issue opaque __Host-jarvis_session cookie with Secure/HttpOnly/SameSite and server-side expiry/revocation; GET-only API; fixed GitHub host/repository allowlist.
- OAuth App credentials, callback, state/PKCE transaction storage, session persistence/validation/expiry/revocation and production OAuth are NOT IMPLEMENTED.
- Never expose GitHub token/PAT/App private key/provider key to browser, logs, HTML, JSON or artifacts. Keep protected API fail-closed until implementation, negative tests and independent security review pass.
- Auth research is in Issue #22 comment https://github.com/VlDMlNSh/developer-cloud-pool/issues/22#issuecomment-6680760037 and docs/reports/2026-11-06-auth-component-fit-assessment.md.
- Bezzie 1.4.2: REJECTED as direct GitHub OAuth drop-in; OIDC-provider oriented.
- Auth0 Hono SDK: NOT SELECTED; adds an external Auth0 broker/account dependency.
- panva/oauth4webapi: preferred protocol-engine candidate for synthetic compatibility tests only; NOT IMPLEMENTED / NOT ACCEPTED. It is not a GitHub adapter. Verify GitHub token endpoint client-auth compatibility and state/PKCE/replay/error cases before integration.

## 5. Model Router and renewable quota pool

Controlling issue: https://github.com/VlDMlNSh/developer-cloud-pool/issues/26

- MediaHub provider registry previously verified at ops/qualification/provider_model_registry.json, blob 8c0f95d33a6fc85128b3a7aa37157c2dca74bbca. Re-read before relying on it.
- Registry contains 24 cloud slots plus local Ollama route, including multiple credential references for SiliconFlow, Novita, Z.ai, Cloudflare and Mistral.
- Code/workflow references to GitHub Secret names do not prove actual secrets exist. Secret presence is NOT VERIFIED; never read or expose secret values.
- Owner reports having Mistral API keys and free quotas. Account status, free allowance, reset policy, account/project scope and eligibility are NOT VERIFIED.
- Never infer separate upstream quotas from key suffixes such as _1/_2. Map each credential to provider account/project/org quota domain only with provider evidence.
- LiteLLM Proxy remains a mature reusable gateway candidate, RESEARCHED / NOT INTEGRATED. Issue #26 evidence:
  - https://github.com/VlDMlNSh/developer-cloud-pool/issues/26#issuecomment-6681108306
  - https://github.com/VlDMlNSh/developer-cloud-pool/issues/26#issuecomment-6681122639
- LiteLLM DB-less max_budget is not a safe spend ceiling. A production design relying on budget enforcement needs persistent PostgreSQL and fail_closed_budget_enforcement=true; multi-instance coordination needs Redis. LiteLLM spend accounting is not an upstream free-quota oracle.
- PostgreSQL/Redis NOT PROVISIONED / NOT APPROVED. No paid managed service or always-on host authorized.
- Proposed identity fields: credential_ref, provider_account_ref, quota_domain_id, provider/model, billing_class, qualification evidence and paid_fallback_allowed=false by default.
- Separate upstream quota domains from internal pool request/token/concurrency/estimated-spend budgets.
- Error policy: 401/403 credential/config failure; 402 billing; 429 scoped cooldown/quota evidence. Never fan out to paid destinations on failure.
- No provider/model calls, secret access, dispatch or paid fallback during proof-of-fit unless separately authorized.
- Next bounded model-pool step: pinned no-secret/no-provider-call LiteLLM proof-of-fit on GitHub-hosted runner; measure pull/install, disk, peak RSS and startup/readiness; parse synthetic account-separated manifest; test fail-closed behavior for unavailable budget store and paid-fallback denial. Do not provision DB/Redis in this step.

## 6. Cloud execution pool status

- README at default branch blob fea44c2485b604432ab9ee20293c3e1f7ee8bdec describes 20-slot GitHub-hosted architecture as DESIGN.
- Pool Supervisor/task queue: IMPLEMENTED SCAFFOLD / NOT RUN.
- Worker: implemented for one DSH headless smoke profile only / NOT RUN.
- Scheduled/event wake-up: implemented but not verified; dispatch fail-closed pending governance and explicit variable.
- General-purpose agent execution, durable checkpoint/resume and automatic continuation: NOT IMPLEMENTED.
- DSH headless evaluation and baseline runner resource probe: NOT RUN.
- No local deployment until cloud-first pool is qualified.
- Keep POOL_DISPATCH_ENABLED=false. Never turn it on during a documentation/context pass.
- GitHub Actions runners are ephemeral; do not treat them as persistent web hosts.

## 7. MediaHub OS relationship and guardrails

- Repository https://github.com/VlDMlNSh/mediahub-os
- Canonical map https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
- Bootstrap https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CONTEXT-BOOTSTRAP-INSTRUCTION.md
- Checkpoint https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/checkpoints/mediahub-next-continuation-checkpoint-2026-10-12-current.md
- Master Roadmap https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/checkpoints/MEDIAHUB-MASTER-DEVELOPMENT-ROADMAP-1.0.md
- Issue #301 https://github.com/VlDMlNSh/mediahub-os/issues/301
- PR #437 was observed MERGED; old checkpoint text saying open is stale. PR #441 observed OPEN/UNMERGED with no formal review at last check.
- Gemini only through approved GitHub Actions controller. Do not dispatch until controller contract, secret/variable metadata, exact-main CI, security review, effective governance and trusted-main no-secret probe gates pass.
- A ChatGPT /next message is not itself a GitHub event and does not prove agent dispatch.
- Claude/Alamo is a separate local lane; require verified host ID/capabilities/allowlist and approved non-paid route.
- Do not conflate MediaHub A0/Jarvis/ASTRA authority or credentials with Cloud Pool control plane.

## 8. Status snapshot (last checked 2026-11-06)

| Workstream | Status |
|---|---|
| PR #24 OpenAPI + hosting ADR | OPEN / DRAFT / UNMERGED; two exact-head workflow runs SUCCESS |
| PR #25 Hono prototype | OPEN / DRAFT / UNMERGED; two exact-head workflow runs SUCCESS |
| PR #23 mobile scope | OPEN / DRAFT / UNMERGED; exact-head CI NOT VERIFIED |
| Independent review #24/#25 | NOT RUN / NOT VERIFIED |
| GitHub OAuth/session | NOT IMPLEMENTED |
| Live GitHub read adapter | NOT IMPLEMENTED |
| Workers Free entitlement | NOT VERIFIED |
| workers.dev namespace | PROVISIONED / prior read-back VERIFIED |
| Cloudflare Worker deployment | NOT RUN |
| iPhone/browser QA | NOT RUN |
| Model Router/LiteLLM | RESEARCHED / CANDIDATE |
| Durable Quota Ledger | NOT IMPLEMENTED |
| Provider quota/account independence | NOT VERIFIED |
| Actual GitHub Secret presence | NOT VERIFIED |
| Provider/model requests | NOT RUN |
| Pool dispatch | DISABLED / FAIL-CLOSED |
| Gemini controller batch | NOT RUN |
| Claude/Alamo task | NOT RUN |
| Cloud Pool qualification/acceptance | NOT ACCEPTED |

## 9. Mandatory /next startup protocol

1. Read this checkpoint and latest dated report; refresh Основной HEAD and branches.
2. Refresh PRs #6, #7, #23, #24, #25: current head/base SHA, draft/merge state, formal reviews, review threads, exact-head workflow runs and jobs. Refresh Issues #1, #21, #22 and #26.
3. Read current README, relevant ADR/API contract, OAuth assessment, mobile scope, Model Router comments and changed source files. Do not rely on old SHAs without read-back.
4. Verify Cloudflare state read-only when relevant; do not deploy while Workers Free entitlement is unknown.
5. Define one bounded task against immutable target SHA, explicit files, inputs, prohibitions and acceptance criteria.
6. Prefer stable components; no dependencies until license, maintenance, compatibility, runtime and free-tier fit are evidenced.
7. Keep dispatch, secret access, model calls, paid resources, mutation APIs, deployment and merges behind separate gates. Empty CI/review/status response is NOT VERIFIED, not PASS.
8. After edits, reread changed files, verify blob SHAs, exact-head CI and provenance. Record dated report and update checkpoint.
9. Continue from next unresolved priority: (a) independent security review #24/#25; (b) OAuth/session synthetic proof; (c) fixed-origin GitHub read adapter; (d) Workers Free entitlement; (e) secure preview and mobile browser QA; (f) after acceptance, native iOS and external-server phases. LiteLLM no-secret proof-of-fit can proceed independently.
10. Never claim dispatch, execution, verification, qualification or acceptance without run/job/artifact/review evidence.

## 10. Immediate next step

Prepare a small no-secret authentication compatibility test for pinned oauth4webapi against synthetic GitHub OAuth authorize/token/user fixtures. In parallel, request independent security review for PR #24 and #25 if authorized reviewers are available. Keep PRs draft and protected Worker routes fail-closed. Do not deploy.

## 11. Cross-chat resume instruction

When the owner writes /next, resume from this checkpoint, refresh live GitHub state first, and continue the next bounded engineering step. Do not ask the owner to restate project context. If a newer checkpoint/report or merged PR supersedes this file, follow newer evidence and update this checkpoint.
