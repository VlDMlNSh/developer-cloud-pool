# GITHUB CONTEXT WINDOW — DEVELOPER CLOUD POOL / CLOUD DEVELOPMENT ENVIRONMENT

> **Единый источник восстановления контекста проекта.** Этот файл объединяет текущее состояние облачного пула, облачной среды разработки, удалённого веб-доступа, исполнителей, маршрутизации моделей, квот, безопасности, GitHub governance, CI, решений, доказательств и очередности работ. При конфликте кратких checkpoint/report с этим файлом сначала сверяй первичные GitHub refs, Issues, PR, CI и contracts; затем обновляй этот файл. Остальные документы служат подробными доказательствами/контрактами и навигацией, а не параллельными окнами контекста.

Last refreshed: 2026-11-06 (UTC+3)
Repository: https://github.com/VlDMlNSh/developer-cloud-pool
Default branch: `Основной`
Observed default HEAD: `64d2636d4500127e635c214ccfb722c6b3fcda80`
Documentation continuation branch: `docs/cross-chat-continuation-2026-11-06`
Documentation branch HEAD before this consolidation: `ae542e7f9496e4c7e113682edf40b1a67cf2dd33`
This document is maintained on the documentation branch and is NOT merged into the default branch. Do not represent the documentation branch as default/canonical production code.

---

## 1. Project objective, scope and priority order

Developer Cloud Pool is an independent, cloud-first, governed agent platform and remote development environment. The goal is to make a secure web console accessible from iPhone and desktop, then qualify the cloud execution pool and only afterward move to native mobile and external compute.

**Mandatory order**
1. Deploy and qualify Contour A on free GitHub infrastructure (and a hosting path proven to remain free).
2. Deliver authenticated remote web access from mobile and desktop; verify real pool status and permitted operations.
3. Qualify task intake, Supervisor/Worker execution, safe model/provider routing, quota accounting, secret isolation, state persistence, recovery and audit.
4. Complete independent security/governance review and publish acceptance evidence for Contour A.
5. Only after Contour A is ACCEPTED, begin Contour B product development: native iOS MediaHub OS / Developer Mobile AI, local media assistant, external owner-operated servers and related product capabilities.

Contour B is explicitly deferred. It must not be pulled forward because a scope document or prototype exists.

**Web-first owner priority (Issue #22, 2026-11-06):** authenticated remote web access first; native iOS Developer Mobile AI second; external servers third. The web application must be usable in an iPhone browser without requiring a native app.

**UI direction:** restrained graphite/gray surfaces and typography; no prominent blue or green accents. Reuse the existing graphite mobile dashboard and mature components rather than redesigning from scratch.

**Free-tier constraint:** GitHub Free and genuinely free service tiers only. No paid fallback, no paid managed DB/cache, no billing workaround, no payment-card workaround, no upgrade, and no resource creation that can incur charges. GitHub-hosted runners are ephemeral and are not persistent web hosts.

## 2. Source-of-truth and cross-project boundaries

- This repository is the engineering source of truth for Cloud Pool: https://github.com/VlDMlNSh/developer-cloud-pool
- MediaHub OS is a separate repository and a source of provider inventory/governance context, not the Cloud Pool control plane: https://github.com/VlDMlNSh/mediahub-os
- Never merge repository states, authority, credentials, quotas, or product-state responsibilities across the two projects.
- MediaHub canonical map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
- MediaHub bootstrap: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CONTEXT-BOOTSTRAP-INSTRUCTION.md
- MediaHub checkpoint: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/checkpoints/mediahub-next-continuation-checkpoint-2026-10-12-current.md
- MediaHub master roadmap: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/checkpoints/MEDIAHUB-MASTER-DEVELOPMENT-ROADMAP-1.0.md
- MediaHub Issue #301: https://github.com/VlDMlNSh/mediahub-os/issues/301
- MediaHub PR #437: https://github.com/VlDMlNSh/mediahub-os/pull/437 (previously observed merged)
- MediaHub PR #441: https://github.com/VlDMlNSh/mediahub-os/pull/441 (previously observed open/unmerged; refresh before relying)
- Preserve MediaHub Baseline 2.0 and historical IDs where applicable. Jarvis, ASTRA A0, and MediaHub Product State Authority have distinct authority boundaries. A technical capability is not authorization.

## 3. Repository state, branches and governance

- Repository metadata currently reports default branch `Основной`, public repository, pushed_at 2026-11-06T12:17:27Z, open issues count 28.
- Observed default HEAD: `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Branch API returned `protected=false` for `Основной` and all listed feature/docs branches. This field alone does NOT establish whether a repository ruleset is effective.
- Active repository ruleset collection returned one active ruleset: ID `26550182`, name `Основной — verified`, target branch, enforcement active. Its current conditions/rules must be read directly before any merge or dispatch; do not infer effective protections solely from the collection listing.
- Historical Issue #1 evidence (2026-11-04) reported exact selector `refs/heads/Основной`, PR required, zero required approvals, deletion/non-fast-forward restrictions, review-thread resolution enabled, no bypass actors, and `POOL_DISPATCH_ENABLED=false` read back through owner-authenticated GitHub CLI. Treat the variable read-back and detailed ruleset condition as historical until rechecked; do not read secret values.
- Issue #2 is closed and contains an earlier governance alignment history; its former ruleset ID 26535481 was reported absent. Current ruleset collection shows ID 26550182.
- PRs are not automatically accepted because mergeable=true or CI passed. Formal independent review, effective ruleset details, provenance, exact-head checks and acceptance criteria remain separate gates.
- The current documentation branch `docs/cross-chat-continuation-2026-11-06` is a working continuation branch. PR #27 remains OPEN/DRAFT/UNMERGED. Do not call it merged or the default branch.

## 4. Cloud execution architecture and actual runtime status

### Intended architecture
- 20-slot GitHub-hosted execution architecture: DESIGN, not a running 20-worker pool.
- Pool Supervisor/task queue: IMPLEMENTED SCAFFOLD; NOT RUN for real task execution.
- Pool Worker: implementation exists for one DeepSeek Harness (DSH) headless smoke profile; NOT RUN as a qualified execution runtime.
- Scheduled/event-driven wake-up/reconciliation: implementation exists; runtime qualification NOT VERIFIED.
- General-purpose agent execution, durable checkpoint/resume and automatic continuation: NOT IMPLEMENTED.
- DSH selected as candidate task runtime; developer-preview evaluation NOT RUN.
- Baseline runner resource probe: implementation exists; NOT RUN.
- Cloud runtime deployment and profile qualification: NOT RUN.
- No local deployment before cloud-first pool qualification.
- GitHub-hosted Actions runners are ephemeral; they cannot serve as the persistent authenticated web console or durable state store.

### Dispatch trust boundary
- Dispatch must remain fail-closed. Do not enable `POOL_DISPATCH_ENABLED`, invoke Supervisor/Worker/DSH, launch provider/model calls, or perform resource probes unless all relevant governance, issuer/capability, security and acceptance gates are satisfied.
- Historical workflow/contract work includes owner-originated `pool:ready` event provenance, approval marker bound to issue/immutable SHA/allowlisted DSH profile, single-use approval consumption, stale-claim recovery to needs-review, trusted workflow metadata, Supervisor run binding and duplicate-run checks.
- PR #7 contains owner approval and Worker-side authorization hardening. Its latest branch SHA at last recorded update was `effda14e286ebe276fee2b3ead96c4ed2122a45e`; code CI passed at earlier immutable code head `9c8afd2e3530b970e7f26a0b8d3d1bac62636f96`, while later branch commits were documentation-only. Independent review and live Worker runtime verification remain NOT RUN.
- PR #8 is a bounded task-matrix builder stacked on PR #7; not wired into Supervisor and not independently qualified.
- PRs #10/#11 address GitHub Free runner policy validation; do not infer all CI or deployment routes are free solely from static policy tests.
- Keep task queue, approvals, execution, recovery, evidence and user-facing read API as distinct trust boundaries.

## 5. Remote web console (primary Contour A user surface)

Controlling issue: https://github.com/VlDMlNSh/developer-cloud-pool/issues/22

### Existing UI and hosting direction
- PR #6: read-only graphite mobile dashboard shell; static demo fixtures only, no live API, auth or task submission. Exact-head static UI/contract CI previously passed at `5b8469b3bb691ff48f8be9bda9aea0969d42f537`; browser/device visual QA and independent review NOT VERIFIED.
- PR #24: hosting ADR and Jarvis Experience API contract. OPEN/DRAFT/UNMERGED; branch `docs/jarvis-web-experience-adr-2026-11-06`; head `d9a7389d4bb5562bb6f2a1e853ebc818659e2cd6`; base `Основной` @ `64d2636d4500127e635c214ccfb722c6b3fcda80`. Exact-head OpenAPI Validation run `42188894226` and Pool Contract Validation run `42188894227` previously COMPLETED/SUCCESS. No independent review recorded.
- PR #25: Hono web console prototype. OPEN/DRAFT/UNMERGED; branch `feat/jarvis-hono-web-prototype-2026-11-06`; head `d8521571ede91d7f6d7fb6d5ee37747ac94385ea`; base default branch at `64d2636...`. Exact-head Jarvis Web Prototype Validation run `42188468546` and Pool Contract Validation run `42188468584` previously COMPLETED/SUCCESS. Uses Hono Worker + Workers Static Assets and existing graphite UI. Health is service-only; protected reads return 503; mutation routes return 405. This is a fail-closed prototype, not an authenticated deployed service.
- PR #30: synthetic oauth4webapi compatibility proof, stacked on PR #25. OPEN/DRAFT/UNMERGED; branch `proof/github-oauth4webapi-compat-2026-11-06`; base branch `feat/jarvis-hono-web-prototype-2026-11-06` @ `d8521571ede91d7f6d7fb6d5ee37747ac94385ea`; head `ad9f9ac598a2414b5209b6923094b16be64630ae`; 3 files changed. Exact-head workflow `GitHub OAuth Protocol Compatibility (Synthetic)`, run `42216422883`, job `127887461269`, COMPLETED/SUCCESS. Job steps include pinned protocol library install and synthetic compatibility test. Formal reviews: 0. Combined commit-status contexts: 0 / pending. The named exact-head Actions run is positive CI evidence; empty status contexts are not a pass.
- PR #30 tests synthetic state validation/mismatch rejection, PKCE S256, form-encoded `client_secret_post`, synthetic token response, Bearer-authenticated synthetic `GET https://api.github.com/user` and synthetic numeric user identity. All responses are supplied by customFetch; no live GitHub OAuth/API requests or real credentials. `panva/oauth4webapi@3.8.8` is installed in CI without saving to project manifests/lockfile. This proves synthetic protocol-library fit only, not live interoperability or production auth.
- PR #30 report: https://github.com/VlDMlNSh/developer-cloud-pool/blob/proof/github-oauth4webapi-compat-2026-11-06/docs/reports/2026-11-06-oauth4webapi-github-compatibility.md
- PR #27: this documentation/context branch, OPEN/DRAFT/UNMERGED; head before current consolidation `ae542e7f9496e4c7e113682edf40b1a67cf2dd33`; base default branch @ `64d2636...`; CI previously NOT VERIFIED.
- Preferred hosting candidate is Cloudflare Workers Static Assets + Hono, subject to actual free entitlement verification. workers.dev namespace `jarvis-developer-cloud-pool.workers.dev` was previously provisioned/read back; this does not prove Workers Free entitlement or deployability.
- Prior Cloudflare read: 0 Worker scripts; Workers Free entitlement NOT VERIFIED because connected OAuth integration lacked Billing Read; Access disabled/not required; no Worker deployment. Re-read Cloudflare state before any deployment. Do not pay, upgrade, add card or create billable resources.

### Required production web-console controls (NOT IMPLEMENTED unless explicitly stated)
- Server-side GitHub OAuth App flow with state and PKCE S256; exact callback allowlist; one-time authorization code exchange; no tokens in browser.
- Validate authenticated GitHub identity from `GET /user`; authorize only the immutable numeric owner GitHub user ID, not username alone.
- Opaque `__Host-jarvis_session` cookie with Secure, HttpOnly, SameSite, server-side expiry, revocation and durable session state.
- Fixed GitHub API origin and repository allowlist; GET-only read API for status, tasks, jobs/runs, logs and artifact metadata; strict response minimization and bounded pagination/size/timeouts; ETag/cache and rate-limit behavior.
- CSRF/origin controls, secure headers, no-store for sensitive responses, structured redacted audit events, no secrets/tokens in HTML/JSON/logs/artifacts.
- Protected routes remain fail-closed until OAuth/session and independent review pass. Existing 503/405 behavior is intentional.
- No live browser/iPhone QA, authenticated end-to-end flow, deployed Worker or persistent state store has been demonstrated.

## 6. Identity, model routing and provider quota architecture

Controlling issue: https://github.com/VlDMlNSh/developer-cloud-pool/issues/26

### Source inventory
- MediaHub provider registry source: `ops/qualification/provider_model_registry.json`, previously recorded blob `8c0f95d33a6fc85128b3a7aa37157c2dca74bbca`.
- Related MediaHub orchestrator: `runtime/mediahub_runtime/cloud_orchestrator.py`, previously recorded blob `24c28197df7baca49abd81956752a7a5092506d9`.
- Provider qualification workflow: `.github/workflows/astra-provider-qualification.yml`, previously recorded blob `d3160088fbef4fce152ed7335f0acaa3bb440378`.
- MediaHub cloud auth baseline: `docs/architecture/MH-CLOUD-AUTH-BASELINE.md`, previously recorded blob `075652ad031e92f7d0c9231db6f40f5f45cd77b8`.
- Registry inventory has 24 cloud credential slots in selection order plus a local Ollama route. Multiple distinct slots exist for SiliconFlow, Novita, Z.ai, Cloudflare and Mistral. Inventory is not proof of secret existence, account separation, free quota, or route health.
- A code reference to a GitHub Secret name is not evidence the secret exists. Secret presence/metadata remains NOT VERIFIED unless read through an authorized metadata-only path. Never inspect or print secret values.
- Different API keys may belong to different accounts/projects and have independent quotas. Never combine keys, account identities, billing owners, quota domains or permissions. Never infer separate upstream quota from suffixes such as `_1`/`_2`; map to provider account/project/org quota domain only with provider evidence.
- User reports having Mistral API keys/free quotas; account/project scope, exact quota/reset rules and current eligibility remain NOT VERIFIED.

### Routing and ledger
- PR #28: account-isolated model routing design. OPEN/DRAFT/UNMERGED; branch `docs/provider-quota-agent-routing-2026-11-06`; head `c07e3442a54fabdb74431f00cbbcd9d75280b01b`; base default @ `64d2636...`.
- PR #29: pure provider quota ledger state machine. OPEN/DRAFT/UNMERGED; branch `feat/quota-ledger-state-machine-2026-11-06`; head `34fc78921b16359d136db553d8a51b4a4716995d`; base default @ `64d2636...`. Exact-head Pool Contract Validation run `42211525076` / job `127871048179` previously SUCCESS. No independent review; not qualified/integrated.
- Required credential identity tuple: `credential_ref`, `provider_account_ref`, `quota_domain_id`, provider/model, billing class, qualification evidence, and `paid_fallback_allowed=false` by default.
- Keep upstream quota domains separate from internal pool budgets: requests, tokens, concurrency, estimated spend, task priority, per-agent/per-model limits and global ceilings.
- Quota ledger must persist state and reservation/settlement/reconciliation events; no in-memory-only budget enforcement in a multi-runner environment.
- Error policy: 401/403 = credential/configuration failure; 402 = billing/payment boundary; 429 = scoped cooldown/quota evidence. Never silently fan out to a paid destination on failure.
- LiteLLM Proxy is a mature gateway candidate researched but NOT integrated/qualified. DB-less max_budget is not a safe spend ceiling; production budget enforcement requires persistent PostgreSQL with fail-closed budget enforcement; multi-instance coordination requires Redis. Neither PostgreSQL nor Redis is provisioned/approved. No paid managed service.
- Next model-pool proof must be no-secret/no-provider-call and pinned; measure GitHub-hosted runner install/pull, disk, peak RSS, startup/readiness; parse synthetic account-separated manifest; test unavailable budget-store fail-closed behavior and paid-fallback denial. Do not provision DB/Redis or call providers during this proof.

## 7. Secrets, data handling and trust boundaries

- Never read, copy, reveal, log, commit, embed in browser assets or pass through prompts/artifacts any OAuth credential, GitHub token/PAT/App private key, provider API key, secret value or private key.
- Keep credential references separate from credential material. Keep provider account identity and quota domain distinct.
- Do not infer that a credential exists because workflow YAML references a secret. Do not enumerate secret names/values unless the operation is explicitly metadata-only and authorized; current status is NOT VERIFIED.
- No `secrets: inherit`; do not send controller tokens to agents/models. Do not expose tokens in child run payloads, logs or artifacts.
- No arbitrary URL fetching in the GitHub adapter; fixed API origin, repository allowlist, bounded response, redirect/host validation and strict schema minimization are mandatory.
- No prompt-controlled shell, arbitrary runner labels, arbitrary repository refs or dynamic code execution in the worker control plane.
- Audit every authorization/approval/dispatch/state transition with immutable IDs, timestamps, actor provenance and redacted evidence.
- Separate read-only experience plane from mutation/control plane. The web console is not a privileged authority merely because the owner is signed in.
- Preserve Jarvis, ASTRA A0 and MediaHub Product State Authority separation.

## 8. Agent executors and orchestration policy

- Use free routes only; no paid fallback. GitHub is the cloud development/orchestration environment; physical servers are only for explicitly permitted local compute.
- Gemini must be invoked exclusively through the approved `.github/workflows/gemini-batch-dispatch-controller.yml` in MediaHub OS. Before dispatch, verify controller contract, exact-main CI, secret/variable scope metadata without values, effective governance, security review and trusted-main no-secret probe. If any gate is missing, status is NOT RUN/BLOCKED. Do not bypass the controller or claim an individual assignment unless it was actually delivered.
- Prefer three independent roles where the approved controller supports them: Agent 1 research/implementation; Agent 2 contract/test review; Agent 3 security, authority and provenance audit. Record immutable target SHA, controller run ID, child run/job IDs, terminal statuses, reports/artifact digests and verification.
- Claude Code may be used only on confirmed server 3 through an allowed free route. Verify exact SentinelX host ID, capabilities, allowlist and permission before use. Never use server 3 for Gemini.
- Before browser automation, read the installed agent-browser skill and verify the browser runtime. Browser operation must remain within the authorized host/session and website permissions.
- When an executor is blocked, continue independent safe work; do not switch to an unapproved transport.
- A ChatGPT /next message is not a GitHub event and is not proof of agent dispatch.

## 9. Cloudflare / hosting / persistence

- Candidate: Cloudflare Workers Static Assets + Hono; not yet deployed.
- Namespace `jarvis-developer-cloud-pool.workers.dev` was provisioned and previously read back.
- Workers Free entitlement: NOT VERIFIED at last recorded read because billing read permission was unavailable; verify without changing payment or plan.
- Cloudflare Access is excluded from the no-card path in current design.
- Persistent state is not yet proven. GitHub Actions runners are ephemeral. Durable task, quota, session and checkpoint state needs an explicitly approved free-tier persistence strategy with concurrency/consistency semantics.
- No PostgreSQL/Redis or other paid state service provisioned. Avoid selecting a storage product until its actual free tier, limits, durability, region, data retention and security controls are verified.
- Do not deploy until auth, persistence, free entitlement, security review, and fail-closed tests pass.

## 10. Open work inventory — PRs and issues

All listed PR states were refreshed on 2026-11-06. Refresh before each subsequent action.

| PR | Scope | Current state / ref |
|---|---|---|
| #6 | Graphite mobile read-only dashboard | OPEN/DRAFT; head `5b8469b3bb691ff48f8be9bda9aea0969d42f537`; static demo only |
| #7 | Owner-bound approval and Worker authorization | OPEN/DRAFT; branch head `effda14e286ebe276fee2b3ead96c4ed2122a45e`; code CI passed at earlier immutable code head; independent review/runtime NOT RUN |
| #8 | Pure bounded task matrix builder | OPEN/DRAFT; head `0a8dba68aa12070b3768d6fb834bedf404ed5d99`; not wired into Supervisor |
| #9 | Corrective docs-governance revert | OPEN/DRAFT; head `c0fae34e73180fdf195862036ca8356abad51101` |
| #10 | GitHub Free runner policy guard | OPEN/DRAFT; head `fa308f0178fe332851cc8b5a8c43b564912c37a6` |
| #11 | YAML parser for Free-tier policy validator | OPEN/DRAFT; head `7b3bd8d8840e122f03326299444a921e3ba5f425` |
| #23 | Native mobile assistant scope | OPEN/DRAFT; head `f78832dfa1fa86c553ec76eb82477da7c3f5324a`; Contour B deferred |
| #24 | Web hosting ADR + Experience API | OPEN/DRAFT; head `d9a7389d4bb5562bb6f2a1e853ebc818659e2cd6`; exact-head two validations SUCCESS |
| #25 | Hono web console prototype | OPEN/DRAFT; head `d8521571ede91d7f6d7fb6d5ee37747ac94385ea`; exact-head validations SUCCESS |
| #27 | Unified cross-chat context docs | OPEN/DRAFT; branch `docs/cross-chat-continuation-2026-11-06`; pre-consolidation head `ae542e7f9496e4c7e113682edf40b1a67cf2dd33`; CI NOT VERIFIED |
| #28 | Account-isolated routing design | OPEN/DRAFT; head `c07e3442a54fabdb74431f00cbbcd9d75280b01b` |
| #29 | Quota ledger state machine | OPEN/DRAFT; head `34fc78921b16359d136db553d8a51b4a4716995d`; exact-head contract CI SUCCESS |
| #30 | oauth4webapi synthetic compatibility proof | OPEN/DRAFT; head `ad9f9ac598a2414b5209b6923094b16be64630ae`; exact-head synthetic CI SUCCESS; no live OAuth; no independent review |

Issue map:
- #1 governance / protect default branch before dispatch (OPEN; refresh details)
- #2 governance follow-up (CLOSED)
- #21 native mobile assistant scope (OPEN; Contour B deferred)
- #22 primary secure remote web console (OPEN; top product priority)
- #26 account-isolated multi-provider routing and quota ledger (OPEN)
- Additional issues and current labels/assignees must be read live; do not infer from this summary.

## 11. Evidence ledger and what is / is not proven

**Verified/documented evidence**
- Default branch HEAD and branch inventory were read through GitHub API on 2026-11-06.
- Active repository ruleset collection currently contains ruleset ID 26550182 with enforcement active; exact effective rules and selector still require a direct read before merge/dispatch.
- PR #24 named exact-head workflow runs 42188894226 and 42188894227 previously SUCCESS.
- PR #25 named exact-head workflow runs 42188468546 and 42188468584 previously SUCCESS.
- PR #29 exact-head Pool Contract Validation run 42211525076 / job 127871048179 previously SUCCESS.
- PR #30 exact-head run 42216422883 / job 127887461269 COMPLETED/SUCCESS, exact head `ad9f9ac598a2414b5209b6923094b16be64630ae`; job steps read back. No live external OAuth/API request.
- Documentation branch existing context/checkpoint/report were read back before consolidation. Previous context blob SHA `4ce4c804aa0ae634a81b27cb1afc208ec252a242`; checkpoint blob SHA `bd77c65c4243750c47905037106d8633e71ec6f9`; report blob SHA `9623874dbab3c3cc55da6fe1177b16b301860af9`.

**NOT VERIFIED / NOT RUN / NOT IMPLEMENTED**
- Real authenticated web console deployment and iPhone/desktop browser QA.
- Live GitHub OAuth, production session persistence/expiry/revocation and owner identity authorization.
- Fixed-origin live GitHub REST adapter and real task/run/log data.
- Durable state persistence and cross-runner recovery.
- Cloudflare Workers Free entitlement and Worker deployment.
- Actual pool Supervisor/Worker/DSH runtime execution and general-purpose agent execution.
- Runner resource profile, DSH qualification and cloud profile qualification.
- Actual provider secret existence, credential-to-account mapping, free quota status/reset/eligibility, and provider route health.
- Production router, provider calls, quota enforcement in a deployed multi-runner runtime.
- Independent security review for PRs #24/#25/#28/#29/#30 and broader control plane.
- Formal Contour A qualification/acceptance.
- Gemini/Claude execution for this Cloud Pool workstream; no claim of dispatch or agent assignment.
- Mobile native app and local media assistant (Contour B).

## 12. Mature components and reuse decisions

- Hono + Cloudflare Workers Static Assets: selected prototype path for web console, subject to free-tier proof and security qualification.
- `panva/oauth4webapi`: protocol engine candidate; synthetic compatibility proof passed, but NOT accepted as production auth by itself and not a GitHub REST adapter.
- Bezzie 1.4.2: rejected as direct GitHub OAuth drop-in (OIDC-provider oriented).
- Auth0 Hono SDK: not selected; introduces external Auth0 broker/account dependency.
- LiteLLM Proxy: researched mature gateway candidate; not integrated. Budget controls need persistent backing store and cannot be treated as upstream free-quota oracle.
- PostgreSQL/Redis: not provisioned/approved; do not introduce paid managed services.
- DSH: candidate runtime only; not qualified.
- Before building new subsystems, search mature GitHub components, pin exact source/version, review license/security/provenance, verify interface fit and resource footprint, then make a bounded proof-of-fit.

## 13. Required /next operating protocol

At the beginning of every /next:
1. Refresh default branch HEAD, docs branch HEAD, relevant feature refs, PR states, issues, exact-head CI, review submissions/threads, ruleset details and executor availability.
2. Read this file first, then open the relevant primary contracts/reports/checkpoints and the MediaHub canonical map/bootstrap/roadmap where cross-project dependencies are involved. If Contents API returns empty, resolve blob SHA or raw file.
3. Fix one immutable target SHA for the planned work. State inputs, scope, exclusions, security boundary and acceptance criteria.
4. Search for mature GitHub components before custom implementation.
5. Execute one bounded, high-value, independently verifiable pass. Keep secrets, paid services, live provider calls and dispatch out unless all specific gates permit them.
6. Run relevant tests/CI and inspect exact-head job logs. Empty status arrays, missing runs, inaccessible reviews or incomplete logs are NOT VERIFIED.
7. Read changed files back and record commit/blob SHA. Never merge without exact-head CI, effective ruleset/governance, provenance, review and no-data-loss checks.
8. After a significant pass, update this file first; update checkpoint/report/map only with short navigation/status pointers or evidence-specific detail. Avoid duplicating the full context in multiple documents.
9. Record actual status using PLANNED, DISPATCHED, RUNNING, SUCCEEDED, VERIFIED, QUALIFIED, ACCEPTED, NOT RUN, BLOCKED, FAILED, NOT VERIFIED.
10. End with factual status, evidence links, blockers and the next concrete step.

## 14. Current next step

**Next engineering step:** implement a fixed-origin, read-only GitHub REST adapter as a bounded synthetic proof on top of the Hono web console. Cover repository allowlisting, strict API origin/redirect rules, bounded pagination and response size, ETag/cache behavior, timeout/rate-limit handling, and response minimization. Use synthetic fixtures only; no live GitHub token, no real OAuth session, no task dispatch, no provider calls. Keep adapter unmounted from protected routes until production OAuth/session and independent security review pass.

In parallel, re-read Cloudflare entitlement through available read-only integration and verify the exact free-tier hosting constraints without payment changes. Do not deploy.

**Contour A status: NOT ACCEPTED.** Do not start Contour B.

---

## Canonical navigation links

- This unified context window: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/context/GITHUB-CONTEXT-WINDOW.md
- Continuation checkpoint: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/checkpoints/2026-11-06-cross-chat-continuation.md
- Cross-chat report: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/reports/2026-11-06-cross-chat-continuation-report.md
- Web console issue #22: https://github.com/VlDMlNSh/developer-cloud-pool/issues/22
- Provider routing issue #26: https://github.com/VlDMlNSh/developer-cloud-pool/issues/26
- PR #24: https://github.com/VlDMlNSh/developer-cloud-pool/pull/24
- PR #25: https://github.com/VlDMlNSh/developer-cloud-pool/pull/25
- PR #27: https://github.com/VlDMlNSh/developer-cloud-pool/pull/27
- PR #28: https://github.com/VlDMlNSh/developer-cloud-pool/pull/28
- PR #29: https://github.com/VlDMlNSh/developer-cloud-pool/pull/29
- PR #30: https://github.com/VlDMlNSh/developer-cloud-pool/pull/30
- MediaHub canonical map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## 2A. Cross-project precedence and supersession — Cloud Pool is authoritative for cloud development

Effective 2026-11-06. This section resolves source conflicts between the Cloud Pool repository and MediaHub OS documentation.

1. **Cloud Pool engineering authority:** for the cloud development environment, remote web console, GitHub-hosted execution, Supervisor/Worker, task queue, runtime, free-tier hosting, provider routing, quota ledger, cloud persistence, and cloud-environment security/operations, the latest owner-directed and technically verified decisions in VlDMlNSh/developer-cloud-pool take precedence. The Cloud Pool Основной branch, its accepted changes, current Issues/PRs and exact-head evidence are the primary sources. A draft PR is a proposal, not an accepted implementation; owner-directed priorities are binding target requirements but do not prove implementation.
2. **MediaHub is a consumer, not the cloud-environment control plane:** MediaHub Baseline 2.0, Product State Authority and product-specific contracts remain authoritative for MediaHub product behavior and its own state. MediaHub's older cloud-environment implementation instructions must not override later Cloud Pool architecture or force the pool to inherit MediaHub-specific topology.
3. **Retain compatible cross-project constraints:** no paid fallback or unapproved billing; secret isolation and no secret-value inspection; distinct provider accounts/quota domains; least privilege, provenance, audit, fail-closed behavior; Jarvis / ASTRA A0 / Product State Authority separation; Gemini controller restrictions only when operating the MediaHub Gemini workstream; local/server executor restrictions only when that executor is explicitly in scope.
4. **Do not impose on Cloud Pool unless separately re-admitted:** MediaHub-specific ASTRA GOLD A0 DAG ownership, Alamo/server-3 Claude executor, FCC/FreeLLMAPI/OmniRoute route choices, user-owned MediaHub destination lanes, MediaHub MEDIAHUB_GITHUB_TOKEN controller transport and Issue #301 bridge. These are MediaHub workstream contracts, not default Cloud Pool infrastructure requirements. Reuse requires a separate interface, authority, cost, security and runtime admission decision.
5. **Cloud Pool decisions currently controlling the target:** (a) web console is the first access milestone for iPhone and desktop; native iOS and external servers are deferred; (b) GitHub-hosted execution remains the cloud baseline and Actions runners are ephemeral, not persistent hosts; (c) Hono + Workers Static Assets is a hosting candidate only, subject to verified free entitlement and deployment gates; (d) production web auth is server-side GitHub OAuth, immutable numeric owner ID, opaque server-side session, GET-only read API; Cloudflare Access is not required for the no-card path; (e) protected reads remain fail-closed and mutations rejected until auth/security gates pass; (f) provider identities are isolated by credential_ref, provider_account_ref, quota_domain_id; upstream quotas are separate from internal pool budgets; paid fallback is denied; (g) quota state needs durable persistence before multi-runner enforcement; (h) dispatch requires owner-bound approval, immutable SHA/profile binding, single-use approval, provenance and effective governance; (i) no secrets, live provider calls, dispatch or deployment without their specific gates.
6. **Status and supersession rule:** compare decision date, owner direction, merge/acceptance state, exact source SHA and evidence. Newer does not automatically mean accepted. If a newer Cloud Pool PR is DRAFT/UNMERGED, record it as a target proposal and do not silently replace accepted default-branch behavior. Preserve older MediaHub text as historical provenance; mark conflicting operational requirements SUPERSEDED FOR CLOUD POOL rather than deleting audit history.
7. **Bootstrap rule:** when MediaHub Bootstrap/Map/Checkpoint/Roadmap is read for cross-project context, extract only product constraints and compatible shared security invariants. Do not import its Cloud Pool implementation mandates wholesale. For Cloud Pool /next, this Context Window and Cloud Pool primary refs are authoritative for cloud-environment work.

Source comparison used: Cloud Pool Context Window blob 0dcba5a910070fcdc59cf3f07949310c725ef7ae; Cloud Pool PRs #7, #19, #20, #24–#30 refreshed 2026-11-06; MediaHub Bootstrap blob 75f30750183efe8c6877368e9f0ada48f8e81ea7; MediaHub checkpoint blob fd312ded05dd1898bd36d776a9669bb02920720d (latest indexed wave observed: 477, 2026-10-30). MediaHub checkpoint is older than the 2026-11-06 Cloud Pool decisions and is not a source for superseding them.


## 15. Latest engineering pass — 2026-11-06 GitHub read adapter correction

- PR #31: OPEN / DRAFT / UNMERGED; branch `feat/github-read-adapter-synthetic-2026-11-06`; base is PR #25 feature branch at `d8521571ede91d7f6d7fb6d5ee37747ac94385ea`; PR head `633cc2c8a2f7a70f996ccc7c5d03070b0899aa06`.
- Corrected HTTP 304 ordering (conditional ETag response before generic 3xx redirect rejection), added `state=open` to issue pagination fixture, and made oversized stream cancellation best-effort while preserving `RESPONSE_TOO_LARGE`.
- Source blob `2b7199ce4a5cf394ee44738b29f03014830632c1`; test blob `e9881aa8a1654769e13c11f271d81b8219ee5d68`; read-back confirmed.
- Exact-head workflow lookup returned no runs; CI NOT VERIFIED. Formal reviews empty; independent review NOT RUN. Local Node test execution NOT RUN.
- Adapter remains unmounted; synthetic fixtures only. No live GitHub API, OAuth, credentials, provider calls, dispatch, deployment or paid resources.
- Report: [2026-11-06 adapter correction](../reports/2026-11-06-github-read-adapter-correction.md).
- Next: obtain exact-head CI and independent review for PR #31; then assess integration into PR #25 only after governance/security review. Do not merge or mount prematurely.
- Contour A: NOT ACCEPTED; Contour B remains deferred.

## 16. Cloud environment consolidation — 2026-11-06 follow-up

### 16.1 Priority and product sequence (Issue #22 refreshed)
- Owner's current delivery order: (1) authenticated remote web console usable from desktop and iPhone; (2) native iOS Developer Mobile AI; (3) connect/qualify external owner-operated servers. Steps 2–3 remain deferred until Contour A acceptance.
- The web console is an Experience plane, not a privileged control plane. First live phase is read-only; task intake, cancellation, approval and dispatch are separate later gates. Browser must never receive PAT, App private key, provider key or privileged workflow token.
- PR #6 is static fixture-only UI. PR #25 is a fail-closed Hono/Workers prototype, not a live console. PR #24 is the API/hosting contract. PR #30 is synthetic OAuth protocol fit. PR #31 is synthetic GitHub read-adapter correction and remains unmounted.
- PR #25 exact-head validation evidence was reported in Issue #22: runs 42188468584 and 42188468546 succeeded at head d8521571ede91d7f6d7fb6d5ee37747ac94385ea. This proves prototype/contract checks only; it does not prove production OAuth, live API, browser QA or deployment.

### 16.2 Supervisor privileged-event boundary — current verification
- Default-branch .github/workflows/pool-supervisor.yml blob d4bd23d06c0dc98211cea165cdad30a1861eb3bd still contains workflow_run: completed for Pool Worker and permissions issues: write, actions: write.
- This is a privileged trust boundary. Do not enable dispatch or treat the current default branch as cleared for Worker lifecycle execution.
- PR #15 proposes removal of workflow_run and associated event metadata/recovery branch. Changed files: Supervisor workflow, Supervisor architecture, dated checkpoint/report, scripts/pool-supervisor.mjs.
- PR #15 latest head observed: c57f2ab3f2b91bf6b3e413640f65ec518008b75e; base Основной at 64d2636d4500127e635c214ccfb722c6b3fcda80; OPEN / DRAFT / UNMERGED; formal reviews empty.
- Code change commit 17fda11001288cc0123b667251c712af13d55f9a removed privileged trigger and event-specific failure handler; retains scheduled reconciliation, issue-label wakeups and manual invocation. Scheduled polling becomes Worker completion/recovery mechanism and is best-effort, not immediate.
- Exact code-head validation run 42037929298, job 127280825826, COMPLETED / SUCCESS. Later PR head c57f2ab changes only checkpoint documentation; commit diff read-back confirms this. Run passed dispatch-disabled assertion, workflow YAML parsing and pool security contract validator. This is CI contract evidence, not runtime qualification.
- PR #15 has zero formal reviews. Independent review NOT RUN. PR remains unmerged. Two zizmor package provenance warnings were documented for ad-hoc DSH installation in Worker and DSH evaluation workflows; deterministic lockfiles and npm ci remain required. Direct Worker workflow_dispatch caller-boundary remains a separate blocker.
- Do not call the remediation accepted until independent security review and exact current-head governance are verified.

### 16.3 Runtime/worker facts revalidated
- Default-branch .github/workflows/pool-worker.yml blob fe1ee4c41a86807810a6b6bc85c677b46c3cebb4: only dsh-headless-probe is an allowed input profile; workflow starts with no permissions and grants issues: read to validation, then contents: read to probe.
- Validation checks numeric issue number, 40-character lowercase SHA, allowlisted profile, open issue, pool:claimed, exact target SHA and expected issue profile.
- Probe checks out exact immutable SHA, pins Node 24.9.0 and setup-node action, requires at least 6 GiB free space, installs @deepseek-ai/dsh@0.2.1-rc.5; it declares no provider credentials and no model call.
- DSH install currently uses ad-hoc npm install in the default-branch workflow; PR #15 report records a package-lock provenance warning. Do not claim dependency graph is fully reproducible until lockfile/npm ci remediation is verified.
- Supervisor and Worker remain IMPLEMENTED SCAFFOLD / NOT RUN / NOT QUALIFIED. No Worker execution, DSH execution, Resource Probe or production task lifecycle was performed in this pass.

### 16.4 Context integrity and next actions
- This section was successfully published and read back. Current context blob SHA: 9d79670c50f3d76988b15b2921ab2ae8507e1836; size 41,548 characters. Previous blocked write attempt did not modify the file; this later update did.
- PR #31 still has no workflow runs associated with exact head 633cc2c8a2f7a70f996ccc7c5d03070b0899aa06, and no formal reviews. CI NOT VERIFIED; independent review NOT RUN.
- Next bounded work: (1) independently inspect PR #15 scheduled recovery and caller authorization, resolve pinned dependency/lockfile warnings; (2) inspect current active ruleset and dispatch variable read-only; (3) diagnose PR #31 exact-head CI trigger association; (4) update this same unified context and checkpoint with verified blob/commit SHAs. Keep dispatch disabled and Contour B deferred.

## 17. Supervisor / Worker authorization audit — 2026-11-06

### 17.1 Governance read-back
- Repository ruleset ID 26550182 was read directly from the GitHub Rulesets API. It is active and selects refs/heads/Основной; it enforces PR, deletion and non-fast-forward restrictions, but required approving review count is 0, CODEOWNERS review is false, and bypass actors are empty. This does not satisfy the project's independent-review gate by itself.
- Issue #1 is OPEN and records POOL_DISPATCH_ENABLED=false as verified by an owner-host CLI read-back on 2026-11-04. The current Actions variable value was not independently re-read in this pass; do not represent the historical value as a fresh live check. Keep dispatch fail-closed.

### 17.2 Current default-branch Supervisor / Worker trust boundary
- Default-branch Supervisor workflow blob d4bd23d06c0dc98211cea165cdad30a1861eb3bd still has workflow_run: completed for Pool Worker and grants issues:write plus actions:write. This remains an active privileged event boundary on Основной.
- Default-branch Worker workflow blob fe1ee4c41a86807810a6b6bc85c677b46c3cebb4 still exposes workflow_dispatch, accepts task_issue/target_sha/profile and allows only dsh-headless-probe.
- Worker validation checks issue open/non-PR, pool:claimed, exact target SHA in issue body and expected profile. It does not authenticate an owner approval event, bind a single-use approval reference, or prove that the caller is the protected Supervisor.
- Worker report job has issues:write and mutates issue labels/comments after the probe. This violates the single-writer Supervisor-only lifecycle model proposed in ADR #12; report must become read-only/no-write or be replaced by Supervisor reconciliation.
- Report job does not re-read and revalidate the complete task envelope immediately before mutation. The validate/probe/report sequence therefore has a time-of-check/time-of-use gap if issue state/body/labels change between jobs. Treat this as a concrete design finding requiring remediation and tests.
- Direct workflow_dispatch means a user with sufficient repository Actions permissions can invoke the Worker independently of Supervisor. The current issue-label/body checks are not caller authentication or owner approval provenance.

### 17.3 PR #15 workflow_run remediation
- PR #15 remains OPEN/DRAFT/UNMERGED at head c57f2ab3f2b91bf6b3e413640f65ec518008b75e, base 64d2636d4500127e635c214ccfb722c6b3fcda80. Formal reviews: zero.
- PR #15 removes workflow_run and associated event fields/handler. It retains scheduled reconciliation, issue-label wakeups and manual workflow_dispatch. This reduces the privileged trigger surface but does not repair direct Worker workflow_dispatch, owner approval provenance, Worker report write authority, or the single-use dispatch model.
- PR #15 scheduled recovery still returns a stale claim to pool:ready when no matching run appears after 15 minutes. ADR #12 explicitly identifies this as incompatible with single-use approval; ambiguous dispatch must move to needs-review and require fresh owner approval. Do not integrate PR #15 as complete authorization remediation.
- PR #15 latest-head Pool Contract Validation run 42038004176 completed SUCCESS; independent review NOT RUN. This is static contract CI only. No Supervisor/Worker runtime was run.

### 17.4 PR #12 caller-boundary design status
- PR #12 remains OPEN/DRAFT/UNMERGED at head 6c053bacff29ca8efb5fdb759edd44fcd416b749; formal reviews zero.
- Exact-head fixture workflow 42041946049 and Pool Contract Validation 42041945700 completed SUCCESS. The fixture proves selected reusable-workflow context fields in a non-privileged fixture only; it does not prove production Worker caller authorization.
- PR #12 adds helper/tests and a proposed ADR for owner-authored approval, single-use consumption and static local reusable Worker. It is design/fixture evidence, not a production caller-boundary implementation. No actual owner approval, durable nonce/transaction store, workflow_call-only Worker or production caller check has been accepted.

### 17.5 Security gate disposition
- Ruleset: VERIFIED active; required review count 0, so independent review remains a project gate, not a branch-ruleset enforcement guarantee.
- Current Actions dispatch variable: NOT RE-READ in this pass; historical issue evidence says false on 2026-11-04. No dispatch action was taken.
- Supervisor privileged workflow_run on default branch: VERIFIED PRESENT.
- Worker direct workflow_dispatch: VERIFIED PRESENT.
- Worker report issues:write: VERIFIED PRESENT; conflicts with proposed single-writer authority.
- Owner approval provenance / single-use approval / production caller verification: NOT IMPLEMENTED / NOT QUALIFIED.
- PR #15: static CI SUCCESS; independent review NOT RUN; authorization remediation incomplete.
- PR #12: fixture/contract CI SUCCESS; independent review NOT RUN; production boundary not implemented.
- No Worker, DSH, Resource Probe, model call, secret read, deployment or dispatch was performed.

### 17.6 Required coherent remediation before any dispatch
1. Make Supervisor the sole queue-state writer; remove Worker report issues:write and reconcile terminal run state through Supervisor.
2. Replace Worker workflow_dispatch with static same-repository workflow_call only, in the same change that wires caller identity checks before checkout/install/side effects.
3. Implement owner approval provenance bound to immutable issue/SHA/profile/envelope digest and a single-use approval reference; do not treat labels as approval.
4. Change stale/ambiguous claim recovery to needs-review, never automatic return to ready using the same approval.
5. Revalidate task envelope and approval at each trust boundary; test duplicate events, issue edits, dispatch ambiguity, replay, cancellation and concurrent Supervisor runs.
6. Resolve DSH package provenance with committed lockfiles and npm ci.
7. Obtain independent security review, exact-head CI, current ruleset and live dispatch-variable read-back before any separately authorized runtime gate.

### 17.7 Next bounded action
Review the full PR #12 ADR and helper/tests against the current Supervisor and Worker code; create a traceability matrix of required security properties versus implemented evidence. Do not merge PR #12/#15 or enable dispatch based on fixture CI alone.

## 18. PR #12 approval and reusable Worker traceability audit — 2026-11-06

### 18.1 Immutable target and CI
- PR #12 exact observed head 6c053bacff29ca8efb5fdb759edd44fcd416b749; base 64d2636d4500127e635c214ccfb722c6b3fcda80; OPEN/DRAFT/UNMERGED; formal reviews empty.
- Exact-head fixture run 42041946049 SUCCESS and Pool Contract Validation run 42041945700 SUCCESS. Static test evidence only.
- Report: docs/reports/2026-11-06-pr12-approval-worker-traceability-audit.md.

### 18.2 Traceability conclusions
- Owner approval parser `scripts/pool-owner-approval.mjs` compares numeric author ID with supplied ownerId and binds command to issue number/SHA/fixed profile/envelope digest. Trusted owner ID derivation, trusted comment retrieval, repository/issue URL association and live Supervisor integration are absent.
- Parser checks updated_at equals created_at and tests edited comments, but no expiry/age policy or immediate pre-consumption re-fetch is integrated.
- `planApprovalConsumption` is pure. Consumed comment IDs are caller-supplied; no durable ledger/atomic consumption is implemented. It returns dispatchAllowed=true after pure validation; this is not production authority.
- `pool-gated-dispatch.mjs` accepts booleans and marker outcome strings. No Environment configuration/read-back, Git ref marker API adapter, marker payload verification, uniqueness race handling or durable replay ledger exists.
- `pool-worker-caller.mjs` is pure and not wired into Worker. It validates caller repo/ref, called repo/path and SHA equality, but does not validate `job.workflow_ref` explicitly.
- Fixture invokes `reusable-worker-context-fixture.yml`, not production `pool-worker.yml`; fixture success does not prove production Worker context.
- Default Worker remains workflow_dispatch-only, Supervisor still uses REST workflow_dispatch, Worker report job still has issues:write, and default Supervisor still has privileged workflow_run.

### 18.3 Required work
1. Bind approval comment to trusted repository/issue API identity and re-fetch immediately before consumption; define expiry and deletion/edit policy.
2. Implement durable single-use consumption with a race-safe native primitive, exact marker payload read-back, duplicate/precreated marker and API timeout tests. Do not claim exactly-once.
3. Integrate protected Environment approval only after API read-back of reviewer, prevent-self-review, bypass and branch policy.
4. Convert Worker to workflow_call-only and Supervisor to static local reusable invocation in one coherent reviewed transition; validate caller/callee context before checkout/install.
5. Remove Worker issue-write and privileged workflow_run; Supervisor alone writes lifecycle state; ambiguous dispatch => needs-review.
6. Independent security review, exact-head CI and current governance read-back before any runtime.

### 18.4 Status
- PR #12 CI: SUCCESS; independent review NOT RUN.
- Owner approval: PARTIAL pure helper; production integration NOT IMPLEMENTED.
- Durable single-use and Environment gate: NOT IMPLEMENTED / NOT QUALIFIED.
- Production reusable Worker boundary: NOT IMPLEMENTED.
- Worker/DSH/dispatch/model/secrets/deployment: NOT RUN.
- Contour A NOT ACCEPTED; Contour B DEFERRED.

### 18.5 Next bounded action
Inspect GitHub-native Environment and Git ref/ruleset API capabilities using read-only metadata/docs, then compare viable race-safe single-use designs against GitHub Free limits. Do not create an Environment/ref or change rulesets in this pass without an accepted implementation and explicit authorization.


## 19. GitHub-native Environment and single-use marker review — 2026-11-06

- PR #12 exact head `6c053bacff29ca8efb5fdb759edd44fcd416b749`; fixture run `42041946049` and Pool Contract Validation `42041945700` SUCCESS; formal reviews empty. PR #15 head `c57f2ab3f2b91bf6b3e413640f65ec518008b75e`, PR #27 head `e289e97bbffeb0196a03226f9a052856dfa5567f`; all OPEN/DRAFT/UNMERGED with zero formal reviews.
- Ruleset `26550182` read back active and targets only `refs/heads/Основной`; PR required but required approvals=0, CODEOWNERS review=false, no bypass actors. No tag ruleset evidenced.
- GitHub docs confirm required-reviewer Environments are available for public repositories on Free; up to six reviewers, one approval suffices, prevent-self-review is configurable. Environment config and bypass settings are not verified in this repository; Environment is a workflow human gate, not a durable nonce store.
- GitHub Create Ref API documents 201/409/422. A unique tag ref can be a create-if-absent claim, but requires tag ruleset restrictions on update/delete, exact ref/tag-object read-back on conflicts/timeouts, and fail-closed recovery. It does not transact with subsequent dispatch; crash after marker creation must remain needs-review. No exactly-once claim.
- Environment-list API read unavailable through current connector; configuration NOT VERIFIED. No Environment/ref/ruleset mutation occurred.
- Detailed comparison and acceptance tests: `docs/reports/2026-11-06-github-environment-single-use-marker-review.md`.
- No dispatch, Worker/DSH, provider/model calls, secret reads or deployment. Contour A NOT ACCEPTED; Contour B DEFERRED.
- Next: draft marker protocol/tag-ruleset spec and adversarial tests; obtain authorized read-back of Environment config before deciding to use it.


## 20. Single-use Git marker protocol and adversarial acceptance spec — 2026-11-06
- PR #12 OPEN/DRAFT/UNMERGED, head 6c053bacff29ca8efb5fdb759edd44fcd416b749; fixture 42041946049 and contract 42041945700 SUCCESS; reviews empty.
- PR #15 OPEN/DRAFT/UNMERGED, head c57f2ab3f2b91bf6b3e413640f65ec518008b75e; contract 42038004176 SUCCESS; reviews empty.
- PR #27 current head 7a7b05ec3a1581303c6207aaeaadba2ba3305a88; exact-head CI lookup empty => NOT VERIFIED; reviews empty.
- Ruleset 26550182 active for refs/heads/Основной only; approvals=0, CODEOWNERS review=false, no bypass actors. No tag ruleset evidenced.
- Proposed marker namespace refs/tags/pool-consumed/<approval-comment-id>; annotated tag payload binds repository/issue/comment/owner/task SHA/profile/envelope/expiry. Create Ref 201 must be followed by exact ref/object read-back; 409 is not success without exact payload verification; all ambiguous failures fail closed.
- Proposed tag ruleset: target refs/tags/pool-consumed/*, restrict update and deletion, leave creation unrestricted, bypass list empty. Design only; require disposable-tag test.
- Marker creation and dispatch are not transactional; crash after marker before dispatch => needs-review and fresh approval; no exactly-once claim.
- Full protocol and adversarial matrix: docs/reports/2026-11-06-single-use-git-marker-protocol-spec.md.
- No tag/Environment/ruleset mutation, dispatch, Worker/DSH, provider/model calls, secret reads or deployment. Contour A NOT ACCEPTED; Contour B DEFERRED.
- Next: read-only verify tag-ruleset and Environment API capabilities/config through authorized path; no resource creation.


## 21. GitHub API capability and marker namespace recheck — 2026-11-06
- PR #12 remains OPEN/DRAFT/UNMERGED at head 6c053bacff29ca8efb5fdb759edd44fcd416b749; exact-head fixture 42041946049 and contract 42041945700 SUCCESS; formal reviews empty.
- PR #15 remains OPEN/DRAFT/UNMERGED at head c57f2ab3f2b91bf6b3e413640f65ec518008b75e; exact-head contract 42038004176 SUCCESS; reviews empty.
- PR #27 current head is f10db507660c2945642e99e23f957025058e27c5 (corrects stale 7a7b05e reference in Section 20/checkpoint); exact-head PR-triggered workflow lookup returned no runs => CI NOT VERIFIED; reviews empty.
- Default branch remains 64d2636d4500127e635c214ccfb722c6b3fcda80.
- Active ruleset 26550182 is branch-only for refs/heads/Основной; active, PR required, 0 approvals, CODEOWNERS review false, no bypass actors, current_user_can_bypass=never. Branch API protected=false only describes legacy branch protection and does not negate this ruleset.
- Ruleset collection returned one ruleset only (26550182); no tag ruleset. GET matching-refs/tags/pool-consumed/ returned [].
- GitHub docs say public repository Environment listing is readable with repository read access / Actions: read; connected GitHub action rejected the /environments endpoint as disallowed by its endpoint allowlist. Actual Environment config remains NOT VERIFIED; do not infer absence.
- Report: docs/reports/2026-11-06-github-api-capability-marker-namespace-recheck.md.
- No tag/Environment/ruleset mutation, dispatch, Worker/DSH, provider/model calls, secret reads or deployment. Contour A NOT ACCEPTED; Contour B DEFERRED.
- Next: inspect current production workflow contracts and ruleset tag semantics read-only; no resource creation.


## 22. Default-branch production Supervisor/Worker authorization recheck — 2026-11-06
- Read immutable default-branch files at HEAD 64d2636d4500127e635c214ccfb722c6b3fcda80: Worker workflow blob fe1ee4c41a86807810a6b6bc85c677b46c3cebb4; Supervisor workflow blob d4bd23d06c0dc98211cea165cdad30a1861eb3bd; Supervisor script blob 52bf03ca889edd92fd10c71ae96a2e35e106d43f.
- Production Worker still exposes workflow_dispatch, does not validate owner-authored approval/caller provenance, and its report job has issues:write. Probe checks out exact target SHA, but this does not authorize the caller.
- Production Supervisor still has privileged workflow_run, issues:write/actions:write, REST dispatch to Worker, and pool:ready label intake without trusted owner-comment verification. PR #15 removing workflow_run remains unmerged.
- Supervisor script is fail-closed unless POOL_DISPATCH_ENABLED equals exact string true; current repository variable value is NOT VERIFIED. Dispatch API errors restore pool:ready; stale claims with no matching run are returned to pool:ready after 15 minutes. Both conflict with single-use approval/replay prevention.
- Worker report job and Supervisor both mutate issue state: multiple writers remain.
- PR #12 exact-head fixture/contract runs SUCCESS, but fixture is not production Worker. PR #15 exact-head contract SUCCESS, but proposed workflow change is not on default branch. PR #27 head f10db507660c2945642e99e23f957025058e27c5 has no PR-triggered CI runs (NOT VERIFIED). Reviews empty.
- Full audit: docs/reports/2026-11-06-default-branch-supervisor-worker-authorization-recheck.md.
- No code/config mutation, dispatch, Worker/DSH, provider/model calls, secret reads or deployment. Contour A NOT ACCEPTED; Contour B DEFERRED.
- Next: coherent test-first remediation plan; keep dispatch disabled and require independent review before any runtime.
