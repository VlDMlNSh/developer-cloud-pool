# Unified Developer Cloud Pool and Jarvis Build Plan

**Snapshot:** 2026-11-14  
**Repository:** `VlDMlNSh/developer-cloud-pool`  
**Branch:** `docs/unified-cloud-pool-jarvis-plan-2026-11-14`  
**Status:** Architecture consolidation proposal; documentation only; not deployed or qualified.

## 1. Executive decision

Build an independent, cloud-first Developer Cloud Pool with Jarvis as its remote operator interface. Keep this project separate from MediaHub OS. MediaHub OS Gemini workflows are useful evidence that a GitHub-dispatch pattern works, but they are not workers, capacity, or qualification evidence for this pool.

The target is an extensible agent execution platform, not a claim that every website exposes an API or that every integration can be automated without restrictions. "All connectors" means a stable connector framework with a growing, testable catalogue of supported adapters.

**Recommended delivery order:**
1. Make the existing GitHub-hosted pool safe, measurable, and genuinely dispatchable.
2. Deliver a small Jarvis web interface and durable task/status contract.
3. Add official API/MCP connectors, starting with GitHub and Telegram Bot API.
4. Add Instagram only through Meta's supported professional-account APIs and permissions.
5. Add isolated browser automation for sites without a suitable API.
6. Expand profiles and connectors based on measured demand, security review, and maintenance cost.

## 2. Verified repository state on 2026-11-14

### Developer Cloud Pool

Current default branch: `Основной`  
Current HEAD: `221f216c00ca7e5596bcc682ba185ad155a10603`

| Component | Verified state | What it does not prove |
|---|---|---|
| 20-slot architecture | DESIGN | Twenty machines are not provisioned or qualified |
| Pool Supervisor | Scheduled workflow has run; latest inspected run succeeded | It did not dispatch a worker |
| Dispatch gate | Latest inspected run logged `POOL_DISPATCH_ENABLED=false` | The pool is not currently accepting work |
| Pool Worker | Implemented for `dsh-headless-probe` only | No general-purpose agent runtime is qualified |
| DSH runtime | Candidate package/profile is pinned in the worker | Runtime evaluation and production security qualification are not complete |
| Runner Resource Probe | Workflow exists | No completed baseline measurement was found in the reviewed evidence |
| Jarvis UI/API | Reference architecture exists as a proposal | No deployed, qualified remote Jarvis service is evidenced |
| Durable task database | Deferred in current bootstrap design | GitHub Issues are only a low-volume bootstrap ledger |
| General checkpoint/resume | Not implemented | Arbitrary multi-hour tasks cannot yet be safely resumed |

The 2026-11-14 Supervisor run `43574445786` completed successfully, but its log explicitly says it was a heartbeat-only run because dispatch was disabled. A green heartbeat is not a worker execution.

The existing Worker is deliberately narrow: it validates an approved issue, exact 40-character target SHA and the allowlisted `dsh-headless-probe` profile; it installs a pinned DSH package and performs a headless composition smoke without model calls or provider credentials. This is a useful first proof, not a general agent workforce.

### MediaHub OS Gemini evidence — separate project

The separate repository `VlDMlNSh/mediahub-os` has a more mature Gemini dispatch implementation. On 2026-11-11:
- Controller run `43029067368` completed successfully.
- Child runs `43029095783`, `43029098931`, and `43029101957` completed successfully.
- Each child passed its controller-signature verification job.
- Three review/implementation pull requests were opened: [#635](https://github.com/VlDMlNSh/mediahub-os/pull/635), [#636](https://github.com/VlDMlNSh/mediahub-os/pull/636), and [#637](https://github.com/VlDMlNSh/mediahub-os/pull/637).
- Those PRs remain open and unmerged in the inspected state. The work was bounded evidence/review, not deployment or production qualification.

This confirms that a signed GitHub workflow-dispatch pattern can work in that repository. It does not establish that the Developer Cloud Pool dispatch gate is enabled, that the two repositories share credentials, or that MediaHub's agents can be treated as pool capacity. Reuse the design patterns only after a separate security and contract review.

## 3. Target system architecture

Use six logical planes. They may initially be implemented as a small number of services; do not create unnecessary microservices.

### A. Jarvis experience plane

A responsive web application / PWA that works on desktop and mobile:
- Chat and structured task intake.
- Task list, queue position, worker status, progress and run history.
- Approval prompts for sensitive or externally visible actions.
- Artifact viewer for reports, documents, screenshots and test evidence.
- Connector settings and connection health.
- Cancellation and retry requests, subject to task state and policy.
- Notifications through the web UI and selected messaging connectors.

The browser UI is an operator surface, not a security boundary. Every action must be authorized again by the backend.

### B. Identity and connector plane

One connector contract for all integrations. Every connector has:
- Stable connector ID, version and owner.
- Authentication mode: OAuth 2.0, service token, webhook signature, API key reference, or browser session where explicitly supported.
- Declared scopes and capabilities.
- Allowed operations and data classes.
- Input/output schemas and pagination model.
- Rate limits, retry policy, idempotency rules and webhook subscriptions.
- Data retention and deletion rules.
- Health check and contract tests.
- Status: planned, implemented, connected, tested, verified, qualified.

Support three connector types:
1. **Official API adapters** — preferred for stable, supported operations.
2. **MCP / OpenAPI adapters** — reusable tool interfaces, with per-tool allowlists and schema validation.
3. **Browser adapters** — isolated browser sessions for approved workflows where no suitable official API exists.

Never equate "connector installed" with "account connected" or "operation qualified". OAuth consent and scopes must be explicit, revocable and least-privilege.

### C. Pool Bridge control plane

A single trusted service mediates every dispatch. It is the only component allowed to convert a Jarvis plan into an execution job.

Responsibilities:
- Task API and strict schema validation.
- User identity, roles, approvals and audit events.
- Repository and workflow allowlists.
- Immutable target SHA validation.
- Capability registry and worker health.
- Queue leases, concurrency admission and fair scheduling.
- GitHub App token broker and workflow-dispatch adapter.
- Connector credential broker; credentials never enter task descriptions or model prompts.
- Timeout, cancellation, bounded retries and idempotency.
- Evidence collection and independent acceptance state.

Agents cannot grant themselves capabilities, choose arbitrary repositories, read unrelated secrets, or dispatch privileged sibling workflows.

### D. Intelligence and model plane

Start with explicit, bounded workflows:
- LangGraph for task decomposition, state transitions, checkpoints and approval pauses.
- Model Gateway adapter, with LiteLLM as the candidate if provider compatibility and budget controls are verified.
- DSH headless as the first candidate runtime for isolated cloud tasks.
- Separate adapters for Gemini CLI, Codex CLI, Claude Code, Aider, Goose and OpenHands only after each profile has its own resource, auth, tool and security qualification.

Do not install every agent stack in every runner. Do not let multiple coding agents edit the same checkout. Give each coding task a fresh workspace and immutable target SHA.

Keep provider credentials only in the gateway or narrowly scoped job boundary. Paid fallback remains disabled unless separately approved. A route must report provider, model, route class, quota source and usage metadata without exposing credential values.

### E. Execution plane

GitHub Actions is the initial elastic execution substrate:
- Up to 20 concurrent standard jobs is the current Free-plan ceiling documented by GitHub; the quota is account-wide and shared across repositories.
- Standard public-repository runner use is currently free under GitHub's documented policy.
- Standard Linux runner reference: 4 vCPU, 16 GB RAM and 14 GB SSD for the documented standard image.
- Each job gets its own fresh VM. Theoretical 20-job aggregate is 80 vCPU, 320 GB RAM and 280 GB SSD across separate ephemeral VMs, not a shared computer or filesystem.
- Hosted jobs have a six-hour maximum. Treat this as a hard ceiling, not a target.
- Measure actual assigned images and limits before promising capacity.

Use capability profiles rather than fixed permanent slots. Proposed initial profiles:
1. Intake and policy validation.
2. Gemini research.
3. Gemini implementation.
4. Independent security and contract review.
5. DSH headless research/implementation.
6. Repository intelligence.
7. agent-browser + Chromium.
8. Playwright QA.
9. Search and controlled crawling.
10. Document ingestion.
11. Unit tests.
12. Integration tests.
13. Build/performance.
14. Security/SBOM.
15. Independent evidence acceptance.

Profiles 16–20 remain spare capacity until measurements justify them. The 20-slot design is a concurrency ceiling, not twenty installed agents or a guaranteed reservation.

### F. Data, memory and evidence plane

Use separate stores for separate purposes:
- Git: source code, contracts, skills, runbooks and architecture decisions.
- PostgreSQL: users, task ledger, leases, connector metadata, checkpoints, policy decisions and audit metadata.
- pgvector + PostgreSQL full-text search: initial hybrid retrieval.
- S3-compatible object storage: original documents, generated artifacts, browser captures and evidence bundles.
- Actions artifacts: compact, scrubbed, short-retention CI evidence only.
- Encrypted versioned backups with restore drills.

GitHub Issues may remain the bootstrap queue for the first controlled probe. They are not a high-throughput transactional database. Actions cache is not durable storage or a shared filesystem.

## 4. Connector catalogue and platform boundaries

### Initial priority

| Connector | Initial integration | Boundary |
|---|---|---|
| GitHub | Repositories, issues, PRs, workflow status and scoped dispatch | GitHub App installation tokens; repo/workflow allowlist |
| Telegram | Bot API, inbound webhooks, commands, status notifications and approved bot replies | Bot only sees messages/updates available to it; user must initiate or add it where required |
| Instagram | Meta Instagram API for professional accounts | Business/Creator account permissions and app review; not general automation of arbitrary personal accounts |
| Generic websites | agent-browser + Chromium in isolated browser workers | Use only authorized accounts and site-permitted operations |
| Deterministic browser QA | Playwright | Separate from exploratory browser-agent sessions |
| MCP tools | Per-server and per-tool allowlists | Treat tool descriptions and returned content as untrusted |
| OpenAPI services | Generated typed adapters | Validate schemas, scopes, quotas and idempotency before enabling writes |
| Email/calendar/storage | Provider-specific OAuth adapters | Read-only by default; write scopes enabled per approved operation |

### Instagram

Meta's official Instagram API with Instagram Login is designed for Instagram professional accounts (businesses and creators) and exposes permissioned capabilities such as basic account/media access, content publishing, comment management and messaging. It is not a universal API for arbitrary personal accounts. Permissions include `instagram_business_basic`, `instagram_business_content_publish`, `instagram_business_manage_comments` and `instagram_business_manage_messages`. Access and publishing behavior depend on the selected API login path and account type.

Implementation plan:
1. Build the connector contract and OAuth callback without storing tokens in browser storage.
2. Start with read-only account/media metadata.
3. Add comment management and messaging only after permissions and webhook behavior are verified.
4. Add publishing as a separate high-impact capability with preview and explicit confirmation.
5. Record Meta app review, token expiry, scopes and API version.

### Telegram

Use the official Telegram Bot API first. It supports HTTPS requests and either long polling or HTTPS webhooks. Webhooks can use a secret token header. The Bot API is a bot interface, not unrestricted access to a human user's account.

Implementation plan:
1. Create a dedicated Jarvis bot.
2. Use HTTPS webhook delivery with secret-token validation and deduplication by update ID.
3. Allowlist user IDs and chat IDs for privileged commands.
4. Provide status, notifications, task submission and approval callbacks.
5. Keep bot permissions and group privacy settings minimal.

Respect Telegram Bot Developer Terms. Do not scrape public groups/channels or use bot-collected content to build unrelated datasets or train AI products. Retain only data needed for the explicitly requested bot service and provide deletion controls.

### Browser automation

Use agent-browser with Chromium for interactive websites and Playwright for repeatable QA. Keep browser workers separate from coding workers. Use per-task isolated sessions, explicit domain allowlists, short-lived session credentials and evidence capture. Do not bypass CAPTCHAs, access controls, platform restrictions or anti-bot protections. If an official API is available and suitable, prefer it over browser automation.

## 5. Security and operational invariants

- Default deny; least privilege at workflow, connector, repository and tool level.
- No long-lived provider credentials in worker environments.
- Prefer GitHub App short-lived installation tokens and OIDC where supported.
- Separate controller credentials from agent processes and browser sessions.
- Sign dispatch envelopes; bind signature to workflow, task ID, target SHA, scope and expiry.
- Prevent replay and duplicate dispatch; use idempotency keys.
- Keep human approval for external side effects such as publishing, sending messages to third parties, deleting data or changing account settings.
- Do not put secrets, private documents or personal data in public issue bodies, logs or artifacts.
- Treat all fetched website content, documents, issue text and model output as untrusted data.
- Pin third-party Actions and tool versions; generate SBOMs and scan dependencies.
- Egress allowlists; no public raw model endpoints or browser debugging ports.
- Distinguish IMPLEMENTED, EXECUTED, VERIFIED, QUALIFIED and ACCEPTED. A successful workflow is not automatically a qualified system.
- Record task ID, target SHA, worker/profile version, run ID, connector IDs, timestamps, artifact digests, tests, reviewer and terminal state.

## 6. Implementation sequence and time estimate

Estimates assume one focused engineering stream using AI agents for bounded parallel work, prompt owner decisions on account permissions, and no prolonged external app-review delay. Calendar estimates include integration and verification; they are not guarantees.

| Phase | Scope | Estimated effort | Exit criterion |
|---|---|---:|---|
| 0. Reconcile and govern | Confirm canonical contracts, default-branch governance, dispatch gate policy, current workflows and exact target SHAs | 1–2 working days | Approved control contract and no unresolved unsafe dispatch path |
| 1. Prove pool substrate | Run read-only resource probe; validate supervisor/worker on one DSH profile; capture CPU/RAM/disk/time and evidence; fix fail-closed dispatch governance | 3–5 working days | One approved task reaches a real ephemeral worker and produces verifiable evidence |
| 2. Pool Bridge MVP | Task envelope, allowlists, lease/claim, dispatch, status, cancellation, retry limits and audit records | 4–6 working days | End-to-end task lifecycle passes negative and positive tests |
| 3. Jarvis web MVP | Responsive PWA, login, task intake, approvals, live status, history and artifact view | 5–8 working days | User can submit, monitor and review a bounded task remotely |
| 4. Connector framework + first connectors | Connector registry, OAuth/token broker, webhooks, GitHub and Telegram Bot API | 4–7 working days | Two connectors pass permission, webhook, retry and revocation tests |
| 5. Instagram + browser | Meta professional-account connector, agent-browser isolated worker, Playwright QA | 4–8 working days plus external approval time | Read-only Instagram integration and one authorized browser workflow qualified |
| 6. Operations and hardening | Observability, backup/restore, rate limits, secret rotation, threat review, failure injection and acceptance | 5–8 working days | Recovery and security gates pass; operational runbook accepted |

**Planning totals:**
- **First usable MVP:** about 2–3 weeks (Phases 0–3, assuming no external blockers).
- **Useful first release:** about 4–6 weeks (through Telegram and first browser integration).
- **Hardened initial platform:** about 6–9 weeks (through Instagram and operational qualification).
- A broad catalogue of many third-party connectors is ongoing work, not a finite "all connectors" milestone. A straightforward official API connector may take 1–3 working days after its auth contract is known; complex OAuth/app-review or browser-only integrations can take longer and require ongoing maintenance.

External dependencies that can extend the schedule: Meta app review and account eligibility, OAuth provider approvals, account-level GitHub concurrency, missing/expired credentials, storage/network selection, and any change to the current security/governance contracts.

## 7. Immediate next work

1. Keep `POOL_DISPATCH_ENABLED=false` until branch governance and the dispatch contract are verified.
2. Complete the read-only runner inventory and record a baseline.
3. Run one narrowly scoped DSH headless probe through the issue queue only after the governance gate is satisfied.
4. Add tests that prove an unapproved task, malformed SHA, unsupported profile, missing approval, replayed dispatch and missing credential are all rejected.
5. Turn the existing architecture proposal into a versioned Pool Bridge task/result schema.
6. Build Jarvis UI against a mock/task API contract before connecting real credentials.
7. Integrate GitHub and Telegram first; add Instagram after Meta account/app eligibility is confirmed.
8. Expand worker profiles only after measured resource budgets and independent review.

## 8. Source references

- Developer Cloud Pool README: https://github.com/VlDMlNSh/developer-cloud-pool
- 20-runner architecture: https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/docs/architecture/CLOUD-POOL-20-RUNNER-ARCHITECTURE.md
- Supervisor and recovery: https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/docs/architecture/GITHUB-POOL-SUPERVISOR-AND-RECOVERY.md
- Jarvis reference architecture: https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/docs/architecture/JARVIS-HYBRID-PLATFORM-REFERENCE-ARCHITECTURE.md
- DeepSeek Harness cloud-first plan: https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/docs/architecture/DEEPSEEK-HARNESS-ADOPTION-AND-CLOUD-FIRST-PLAN.md
- MediaHub Gemini controller evidence: https://github.com/VlDMlNSh/mediahub-os/actions/runs/43029067368
- GitHub Actions concurrency limits: https://docs.github.com/en/actions/reference/limits
- GitHub-hosted runner specifications: https://docs.github.com/en/actions/reference/runners/github-hosted-runners
- GitHub Actions billing: https://docs.github.com/en/actions/concepts/billing-and-usage
- GitHub workflow dispatch API: https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event
- Meta Instagram API changelog: https://developers.facebook.com/docs/instagram/platform/instagram-api/changelog/
- Meta Instagram Messaging API changelog: https://developers.facebook.com/documentation/business-messaging/instagram-messaging/changelog/
- Telegram Bot API: https://core.telegram.org/bots/api
- Telegram Bot Developer Terms: https://telegram.org/tos/bot-developers
- agent-browser: https://github.com/vercel-labs/agent-browser
