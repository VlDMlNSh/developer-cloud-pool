# Unified Developer Cloud Pool and Jarvis Build Plan

**Snapshot:** 2026-11-14  
**Repository:** `VlDMlNSh/developer-cloud-pool`  
**Branch:** `docs/unified-cloud-pool-jarvis-plan-2026-11-14`  
**Status:** Architecture consolidation proposal; documentation only; not deployed or qualified.

**Operational continuation:** [Master Handoff](../operations/MASTER-HANDOFF.md) · [Continuation Protocol](../operations/CONTINUATION-PROTOCOL.md) · [Architecture Decision Register](ARCHITECTURE-DECISION-REGISTER.md) · [Session Log](../reports/SESSION-LOG.md).

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


## 9. Reuse of the MediaHub A1/A2/A3 role model — bounded and explicit

The MediaHub OS repository already defines a mature separation of responsibilities. Reuse the **role pattern and evidence discipline**, not MediaHub's authority or state implementation.

### Role mapping for this independent pool

| Role | MediaHub meaning | Developer Cloud Pool application | Authority boundary |
|---|---|---|---|
| Human owner | Final architecture, security and launch authority | Approves architecture, privileged integrations, production changes and launch | Final authority remains human |
| Pool Control Plane | Not MediaHub A0 | Coordinates only this pool's task queue, leases, dispatch, status and recovery | Owns only pool operational state; it is not ASTRA and does not inherit MediaHub State Authority |
| A1 — Architect | Architecture, contracts and reconciliation | Defines task/result schemas, connector contracts, worker profiles, policy and ADRs | Cannot deploy or approve its own implementation |
| A2 — Builder | Bounded implementation | Implements one assigned change in an isolated workspace and declared path boundary | No self-assigned scope, no secret authority, no merge authority |
| A3 — Verifier | Independent verification | Runs independent tests, security/contract checks and exact-SHA evidence review | Must be a separate process/identity from A2; A2 cannot certify its own work |
| Executors | Execution only | Gemini, Claude Code, Codex, DSH and browser workers execute admitted tasks | No architecture, policy, credential or queue authority |

**Important separation:** MediaHub's A0-ASTRA is the coordination and state authority inside MediaHub OS. The Developer Cloud Pool must not import or claim that authority. The pool's own Pool Control Plane is a separate system with a narrower operational remit. Jarvis is the user-facing interface; it is not a substitute for the Pool Control Plane or an authorization issuer.

### Mandatory task lifecycle

Adopt the MediaHub evidence chain in a pool-specific schema:

`TASK → CLAIM → WORKER → VERIFY → COMMIT → EVIDENCE → MANIFEST`

Every task must bind:
- unique task and parent-task IDs;
- immutable repository and target SHA;
- requesting principal, approved capability and explicit approval record where needed;
- A1 contract/version reference;
- A2 executor identity, worker profile and isolated workspace;
- allowed paths, commands, domains, network egress and resource/time budgets;
- A3 verifier identity and independent-process marker;
- run IDs, exit status, test report and terminal state;
- artifact names, content digests and retention classification.

The evidence manifest is append-only for the task attempt. A retry creates a new attempt identity and references the previous attempt; it must not overwrite or silently reinterpret prior evidence.

### Concurrency and ownership rules

Start with the conservative MediaHub pattern, adapted to cloud capacity:
- 1 A1 contract/architecture lane at a time for each shared contract surface.
- 2 bounded A2 builders initially, increasing to 3 only when claims and workspaces are disjoint.
- 1 independent A3 verifier lane; verification capacity is not counted as a builder.
- Exactly one writer per shared file, release surface or integration branch.
- No two agents edit the same working tree.
- Pool-wide 20-job concurrency remains a later scheduling ceiling, not initial builder parallelism.

The MediaHub 23-round executor qualification and 24-hour GOLD soak are MediaHub-specific gates. Do not copy their numeric thresholds into the cloud pool without a separate A1 proposal and human approval. The pool must define profile-specific qualification criteria based on actual resource, security, reliability and recovery measurements.

### Promotion states

Keep role completion separate from system readiness:

`DESIGNED → PREFLIGHT → ADMITTED → EXECUTED → VERIFIED → INTEGRATED → QUALIFIED`

Any missing target SHA, claim/lease, independent verifier, test evidence, artifact digest, permission record or recovery proof results in `BLOCKED`. A successful GitHub workflow alone never promotes a worker profile to QUALIFIED.

### Jarvis ingress boundary

MediaHub's WB-14 source reconciliation found that the Jarvis mission-submission → accepted A0 ingress path was not yet proven end-to-end. In particular, a shaped task JSON field is not authentication, and an approval field is not trusted approval attestation without a verified issuer and caller chain.

Therefore:
- Build the Developer Cloud Pool Jarvis as an independent authenticated UI/API with its own task-ingress contract.
- Require server-side identity and authorization before a task can enter the queue.
- Bind approvals to the exact task, capability, target repository/SHA and requested external side effect.
- Do not wire the MediaHub Jarvis/A0 ingress into this pool by assumption.
- Any future cross-system bridge must have its own signed envelope, caller identity, replay protection, idempotency and independently reviewed trust contract.

### Source references for the reused pattern

- [ASTRA GOLD complete component scheme](https://github.com/VlDMlNSh/mediahub-os/blob/main/architecture/ASTRA-GOLD-COMPLETE-COMPONENT-SCHEME.md)
- [ASTRA GOLD unified autonomous development system](https://github.com/VlDMlNSh/mediahub-os/blob/main/architecture/ASTRA-GOLD-UNIFIED-AUTONOMOUS-DEVELOPMENT-SYSTEM.md)
- [MH-25 autonomous execution blueprint](https://github.com/VlDMlNSh/mediahub-os/blob/main/docs/checkpoints/mh-25-autonomous-execution-blueprint-1.0.md)
- [ASTRA executor capability matrix](https://github.com/VlDMlNSh/mediahub-os/blob/main/docs/operations/ASTRA-EXECUTOR-CAPABILITY-MATRIX.md)
- [Jarvis/A0 ingress source reconciliation WB-14](https://github.com/VlDMlNSh/mediahub-os/blob/main/docs/checkpoints/MEDIAHUB-CONTOUR-A-WB-14-JARVIS-A0-AND-DIRECT-LOCAL-ROUTE-SOURCE-RECONCILIATION-2026-10-15.md)

These references are design inputs, not evidence that the Developer Cloud Pool has implemented or qualified A1/A2/A3 execution.

---

## 10. Governing correction: assemble proven projects; do not build a new agent framework

This section supersedes any earlier wording in this document that could be read as a plan to implement a new agent runtime, a fixed three-agent pool, or a full custom orchestration framework.

**Product objective:** assemble a working cloud pool from mature, maintained upstream projects and existing GitHub Actions capabilities. Write only the minimum integration glue, configuration, policy and adapters that are genuinely missing. Do not fork or reimplement an upstream product when a supported component can do the job.

The first deliverable is the cloud pool itself. Local machines, Mac minis, GPU servers and other external compute nodes are explicitly out of scope until the cloud pool is operational and qualified.

### 10.1 Corrected control and execution model

There are three distinct coordination levels; they must not be conflated:

1. **Pool A0 — global coordinator.** Owns the cloud pool's task queue, task admission, runner scheduling, worker registry, quotas, leases, retries, cancellation, task state and final result aggregation. In the first release, use the existing GitHub Actions Pool Supervisor and its issue/workflow state as the bootstrap A0 implementation. A later persistent A0 service is considered only if measured limits require it.
2. **Runner-local Gemini controller.** Inside a selected runner job, the Gemini controller coordinates the Gemini agent processes assigned to that task. It is subordinate to Pool A0 and cannot create new pool-level authority, choose arbitrary repositories, or grant itself credentials.
3. **Task agents.** Gemini, Claude, Codex and other provider-backed agents are execution engines. Their count is dynamic; three is not a design limit and one agent per runner is not a requirement.

The runner is an execution container/VM boundary, not an agent identity. One runner job may host several agent processes. A valid initial profile may contain one Gemini controller plus Gemini agents 1, 2 and 3 in the same runner, provided measured CPU/RAM/disk, provider concurrency/rate limits, task isolation and API quotas permit it. Additional providers/agents can be admitted to that same runner profile after measurement. The scheduler may also launch more runner jobs in parallel. These are separate scaling dimensions: **agents per runner** and **concurrent runner jobs**.

Do not hard-code a global agent count. A0 schedules from a capability registry and current measurements, not from a fixed three-agent or twenty-agent roster.

### 10.2 Roles as design guidance, not a code transplant

Use the useful separation of duties observed in MediaHub, but define and qualify the pool's own contracts:

- **A0:** global cloud-pool coordinator described above.
- **A1:** planning/architecture responsibility — interprets the admitted task, selects a proven toolchain/profile and defines acceptance criteria.
- **A2:** execution responsibility — one or more bounded agent processes in isolated task workspaces.
- **A3:** independent verification responsibility — checks exact target SHA, tests, artifact digests, scope and policy compliance. A3 must not simply repeat A2's self-assessment.

A0–A3 are responsibilities, not a requirement to deploy exactly four permanent agents. One agent may take a role on one task and a different role on another. The A3 check should use a fresh context and independently collected evidence; use a separate runner job for higher-risk changes. The cloud-pool A0 is not MediaHub's A0 implementation, and no MediaHub code or authority is imported without a separate source review.

### 10.3 Existing and candidate component register

Status terms: **Selected for phase** means the architecture currently chooses it; it does not mean installed, tested or qualified. **Candidate** means evaluate before adoption. **Deferred** means intentionally not part of the first cloud-pool launch.

| Component / upstream | Intended role | Decision now | Qualification / boundary |
|---|---|---|---|
| GitHub Actions hosted jobs | Ephemeral cloud execution and fan-out | SELECTED — phase 1 | Actual account concurrency, runner image, free disk, memory and job startup must be measured. |
| Existing Pool Supervisor + GitHub Issues task template | Bootstrap Pool A0 and low-volume task ledger | SELECTED — phase 1 | Existing code is a scaffold; dispatch is fail-closed and not yet qualified. Keep POOL_DISPATCH_ENABLED false until governance and negative tests pass. |
| Gemini controller + Gemini agents | Multi-agent work inside a runner | SELECTED TARGET PROFILE — first agent group | MediaHub's successful dispatch runs are evidence for that separate system only. Requalify the actual Gemini CLI/API invocation, controller, provider limits and result handoff inside this pool. |
| Everything Claude Code (ECC), official affaan-m/ECC | Reusable agent skills, rules, workflows, hooks and harness adapters | SELECTIVE CANDIDATE — Claude/Codex/Gemini profiles | ECC is a toolbox/harness layer, not Pool A0 or a cloud scheduler. Pin official source/version; select only needed modules; inspect hooks, MCP definitions, permissions and supported-harness parity. Do not install the entire catalogue into every runner. |
| DeepSeek Harness (deepseek-ai/deepseek-harness) | Composable agent runtime / headless or SDK profile | CONDITIONAL CANDIDATE | Upstream calls it Developer Preview and says it has not had a security audit. Existing pool workflow is only a no-model headless composition probe. Do not make it the mandatory runtime until it passes security, compatibility and workload qualification. |
| Dodaios (Dodaios/Dodaios) | Operator cockpit / superagent UX and agent dispatch | DEFERRED from core A0 | Upstream describes it as a desktop superagent. It is not automatically a headless cloud controller. Review its permission modes and service model before any use; never let its UI or agent defaults replace Pool A0 policy. |
| agent-browser + Chromium | Interactive browser automation | SELECTED CANDIDATE — isolated browser profile | Browser profile only; authenticated sessions and secrets require a separate trust review. |
| Playwright | Deterministic browser tests | SELECTED — QA profile | Keep deterministic QA distinct from exploratory agent-browser actions. |
| LiteLLM Proxy | Unified model API, provider routing and virtual keys | DEFERRED to gateway phase | Evaluate after multiple provider adapters are running. Database-backed budget enforcement, provider quotas and paid-fallback policy must be tested; no silent paid fallback. |
| LangGraph | Stateful orchestration / checkpoints | DEFERRED | Do not add to phase 1 while GitHub Actions can perform the required bounded dispatch. Reconsider only when durable multi-step orchestration is a measured requirement. |
| PostgreSQL / pgvector | Durable task state, leases and retrieval | DEFERRED from bootstrap | GitHub Issues/PRs and workflow metadata suffice for low-volume initial proving. Add PostgreSQL when queue throughput, durable checkpoints or audit queries justify it. |
| n8n | Notifications and ordinary integrations | OPTIONAL LATER | Must not become the privileged dispatch authority. |
| Telegram Bot API | Jarvis notifications and task intake | NEXT CONNECTOR AFTER CORE | Bot identity, command authorization and approval binding must be verified server-side. |
| Instagram Meta APIs | Approved professional-account integration | LATER CONNECTOR | Only official supported API scopes; verify account eligibility, app review and permission requirements before planning an activation date. |
| External servers / GPU nodes | Additional compute and persistent services | EXPLICITLY AFTER CLOUD POOL | No external node is a launch prerequisite. Add later through a separately qualified worker adapter and network identity. |

### 10.4 ECC naming and adoption note

The public project found for the user's “ECC” reference is affaan-m/ECC (https://github.com/affaan-m/ECC), whose current official distribution surfaces include the ecc-universal and ecc-agentshield packages and the ecc@ecc plugin identifier. The project is now branded simply ECC; "Every Cloud Code" is not the expansion shown by the official repository. Treat the above identification as the working match, not permission to install an unofficial fork or package.

Adoption rule:
- inventory the exact ECC release/tag and supported adapter matrix;
- select the smallest useful profile for each harness;
- do not stack plugin and manual installation methods in the same harness;
- inspect and explicitly enable hooks/MCPs rather than importing all defaults;
- run AgentShield against the selected agent/hook/MCP configuration;
- qualify Claude Code, Codex and Gemini adapters separately instead of assuming feature parity.

### 10.5 Runner packing and scaling policy

The architecture is **many agents per runner where efficient**, plus **many concurrent runner jobs where available**. It is not one agent = one VM.

For the public repository's standard ubuntu-24.04 hosted runner, GitHub currently documents 4 vCPU, 16 GB RAM and 14 GB SSD. GitHub's Free plan lists 20 concurrent standard hosted jobs; public standard-runner use is free and unlimited, but the account concurrency ceiling still applies. These are platform limits, not a promise that all jobs start immediately or that the full disk is free.

Packing rules:
- Start with one runner job and measure the Gemini controller plus the three Gemini agents as one profile.
- Record per-process and total peak RSS, CPU, disk delta, cold-start/install time, model latency, API rate-limit responses and task completion quality.
- Add Claude/Codex/other agents to that same runner only if the measured profile retains safety headroom and the provider's terms/quotas allow the concurrency.
- Keep each agent's worktree/output directory separate. Never allow concurrent agents to write to the same checkout or shared output path.
- Use an independent verifier context; use a separate runner for risky or write-capable verification.
- Split a profile across runner jobs when memory pressure, CPU contention, disk headroom, failure isolation or provider limits require it.
- Do not install browser binaries, every coding CLI, model weights or every ECC module in every runner.
- Use pinned dependencies and cache downloads only as an accelerator; cache is neither durable task state nor a security boundary.
- A runner is ephemeral and a job is limited to six hours. Long work must save bounded checkpoints/artifacts and resume in a new job; do not depend on a process staying alive.

### 10.6 Revised implementation sequence — cloud pool first

**Stage 0 — component inventory and compatibility freeze**
- Read the exact current repository state and all selected component definitions.
- For each upstream, record official repository, license, release/tag/commit SHA, maintenance/release activity, security advisories, install footprint, runtime dependencies, supported harnesses, API/auth mode and resource needs.
- Separate already selected, conditional candidates and deferred components using the register above.
- Reject duplicate products doing the same job unless a measured gap justifies both.
- Pin known-good versions; upgrades are deliberate, not floating latest.

**Stage 1 — prove the base cloud runner and Pool A0**
- Run the existing read-only Runner Resource Probe; do not create a duplicate.
- Verify branch governance and workflow permissions.
- Test the existing supervisor's idle, malformed-task, duplicate-claim, invalid-SHA, unauthorized-profile, dispatch-failure and recovery paths with no provider keys.
- Keep real dispatch disabled until the tests and governance are reviewed.
- Establish a compact task/result/evidence envelope using the current issue and workflow mechanism; avoid adding a database before it is needed.

**Stage 2 — first multi-agent runner**
- Assemble one ubuntu-24.04 runner profile containing the Gemini controller and Gemini agent processes.
- Start with the controller plus three Gemini agents as the initial measured configuration, not as a fixed architectural limit.
- Use separate workspaces, per-agent task scopes, timeouts and output manifests.
- Collect actual resource and API quota evidence; determine safe parallelism from measurement.
- Have an independent A3 verifier inspect outputs and evidence before accepting the task.
- No external server and no persistent host dependency.

**Stage 3 — additional provider profiles**
- Add Claude Code with a selective ECC toolchain profile.
- Add Codex and other API-backed agents as separate adapters/profiles, then optionally co-pack them with Gemini only after measurement.
- Put provider credentials in narrowly scoped secrets or a model gateway; inject only the key required for that task/profile. Never put keys in Issues, source, prompts, artifacts or logs.
- Make provider quotas, per-task request/token caps and paid-fallback policy visible to A0.

**Stage 4 — dynamic pool scaling**
- Let A0 schedule by capability, measured resource demand, provider quota, priority and available GitHub concurrency.
- Increase the number of simultaneous runner jobs progressively (for example 1 → 2 → 4 → 8 → account ceiling), not by assuming all twenty slots are immediately usable.
- A runner may host one or many agents; the scheduler chooses packing based on measured profiles.
- Add security, build, browser and independent-verification profiles as separate capabilities.

**Stage 5 — Jarvis and connector surface**
- Connect Jarvis to the existing A0 task API/queue after the queue and task contract are stable.
- Add Telegram intake/notifications with identity-bound commands and approvals.
- Add browser tasks via isolated agent-browser profiles and deterministic Playwright QA.
- Add Instagram only after official API eligibility and app permissions are verified.
- Keep n8n limited to non-privileged integration/notification workflows.

**Stage 6 — operational qualification**
- Verify task lifecycle, cancellation, duplicate/replay protection, retries, worker loss, checkpoint resume, artifact integrity, secret isolation, quotas and recovery.
- Publish a qualification report for each runner profile and each provider adapter.
- Only after cloud pool acceptance consider external servers as additional worker capacity. External nodes must register with A0 through a scoped identity/capability contract and must not become a prerequisite for the already-working cloud pool.

### 10.7 Definition of "cloud pool launched"

The cloud pool is not considered launched merely because workflows exist or a supervisor heartbeat succeeds. Launch acceptance requires:
- one real admitted task dispatched through A0;
- controller and multiple agents run inside a measured runner profile;
- task completes with the exact target SHA recorded;
- independent A3 verification passes;
- evidence manifest and artifacts are retained and integrity-checked;
- failure/cancel/retry paths behave safely;
- no credential material appears in logs or task records;
- provider quota and GitHub concurrency behavior are recorded;
- an operator can submit a task and retrieve the result without manually starting agent processes.

### 10.8 Current facts and external references checked 2026-11-14

- GitHub standard public Linux runner: 4 vCPU, 16 GB RAM, 14 GB SSD; GitHub Free standard hosted-job concurrency: 20. Public standard runner usage is documented as free and unlimited, but concurrency and service limits still apply.
- GitHub-hosted job maximum duration: six hours.
- DeepSeek Harness upstream labels itself Developer Preview and explicitly says it has not undergone a security audit.
- ECC official source is https://github.com/affaan-m/ECC; use official release channels only.
- Dodaios upstream describes a desktop superagent; its desktop product status does not by itself establish a secure headless cloud A0 implementation.

References:
- https://docs.github.com/en/actions/reference/runners/github-hosted-runners
- https://docs.github.com/en/actions/reference/limits
- https://docs.github.com/en/actions/concepts/security/compromised-runners
- https://github.com/affaan-m/ECC
- https://github.com/deepseek-ai/deepseek-harness
- https://github.com/deepseek-ai/deepseek-harness/blob/main/SAFETY.md
- https://github.com/Dodaios/Dodaios
- https://github.com/vercel-labs/agent-browser
- https://github.com/microsoft/playwright


---

## 11. MediaHub-wide consolidation: agent fabric, Jarvis source decision, tenants and quota lifecycle

This section is the controlling clarification for the cloud-pool target. It supersedes any reading of earlier sections that treats Gemini as the only agent family, assumes a Gemini-specific controller is the global coordinator, treats ECC as an unambiguous project name, or assumes a fixed three-agent pool.

### 11.1 What the MediaHub source review actually establishes

The following canonical/research sources were read for this consolidation:

- `profiles/agent-registry.json` (schema 1.2.0; 28 registered agent/tool candidates in the current source snapshot).
- `profiles/providers/astra-gold-hybrid-agent-fabric.yaml` (cloud providers, gateways, local tooling, qualification ladder).
- `architecture/ASTRA-GOLD-UNIFIED-AUTONOMOUS-DEVELOPMENT-SYSTEM.md` (A0–A3 roles, executor/provider/gateway separation, dynamic task-scoped workers).
- `architecture/MEDIAHUB-DISTRIBUTED-AI-INFRASTRUCTURE.md` (GitHub-cloud-only and local-Jarvis boundaries, provider routing, future owned/user-contributed compute).
- `docs/checkpoints/MEDIAHUB-JARVIS-CORPORATION-ARCHITECTURE-PROPOSAL-CROSSWALK-WAVE-01-2026-10-15.md` (Jarvis/ASTRA split, task DAG and tenant/worker gaps).
- `docs/checkpoints/MEDIAHUB-JARVIS-REPOSITORY-REUSE-AND-INTEGRATION-DECISION-WAVE-21-2026-10-16.md`, `...CANDIDATE-INTAKE-WAVE-22...`, and `...SOURCE-PIN-AND-CAPABILITY-CROSSWALK-WAVE-24...` (Jarvis upstream and OpenHands candidate findings).
- `docs/checkpoints/MEDIAHUB-GITHUB-CLOUD-ONLY-POOL-AND-LOCAL-JARVIS-BOUNDARY-WAVE-262-2026-10-20.md` (approved cloud-only execution boundary).
- Mature upstream register `docs/checkpoints/MEDIAHUB-MATURE-PROJECT-CANDIDATE-REGISTER-WAVE-432-2026-10-23.json`, blob `eefd7f64b4631b17278d6b5a1d1972c6ec17069b`, reconciled in Wave 452.

**Verified candidate inventory:** 128 unique repository records: 99 CANDIDATE, 22 CONDITIONAL, 2 REFERENCE_ONLY, 5 EXCLUDED_FROM_ACTIVE_SHORTLIST. Discovery remains OPEN_NOT_FROZEN; formal comparison NOT_STARTED; adoption NOT_STARTED. The repository-bounded source set reviewed here does not contain a second reconciled 200-row register. The owner's reference to "200 projects" is retained as an additional historical/discovery target, but it is not silently combined with the verified 128 or represented as a completed inventory. Recover and reconcile the exact second list before claiming 200 unique reviewed repositories.

A candidate register is a research universe, not an installation manifest. No component becomes active because it appears in JSON or has an API-secret name.

### 11.2 Agent and provider fabric — complete functional groups

Pool A0 must select from a versioned registry. The registry distinguishes agent executors from model providers, API gateways, transport adapters, harnesses and local models. They are not interchangeable identities.

**A. Cloud model/provider identities already named in the MediaHub registry**
- Gemini / Google
- Perplexity
- Kimi
- DeepSeek
- ChatGPT / OpenAI
- GigaChat
- Claude / Anthropic

**B. Cloud API gateways and aggregators**
- OpenRouter
- UnoRouter
- ZeroRouter
- NaraRouter
- OrcaRouter

**C. Additional direct provider candidates**
- SiliconFlow
- Novita
- Z.ai
- LLM7
- SambaNova
- Aion Labs
- Cloudflare Workers AI
- Groq
- Mistral
- Hugging Face
- OpenAI direct API

**D. Agent clients / coding executors / harnesses**
- Gemini CLI and the existing Gemini multi-agent controller/workflows
- Codex CLI / OpenAI Codex
- Claude Code
- Cursor
- DeepSeek Harness
- Stagewise
- OpenHands application and OpenHands Software Agent SDK
- Agno, smolagents, Pydantic AI, Google ADK, LangGraph, Microsoft Agent Framework and other candidates from the 128-row register, subject to comparison
- OpenFlux and OpenOPC as qualification-gated desktop/autonomous-system candidates, not controllers or authorities

**E. Local-only or machine-bound capabilities**
- Ollama and local model runtimes
- Kimi K3 In-C
- local Claude Code/FCC-compatible routes, where the exact backend is proven
- local Cursor/Stagewise and other local tooling

These local components are not part of the first GitHub-hosted cloud pool. They may be evaluated as future adapters only after the cloud pool works. A cloud provider, a gateway, an agent CLI and a model are separate registry records.

**Current status rule:** many names above are registered or candidate only. The MediaHub registry's own qualification ladder is the correct minimum model for each route:

`REGISTERED → CREDENTIAL_PRESENT → AUTH_SUCCESS → MODEL_DISCOVERY_PASS → PROBE_PASS → EXECUTION_PASS → A3_VERIFIED → ELIGIBLE`.

For the pool, use the corresponding pool-specific terminal status; do not reuse MediaHub's ASTRA GOLD eligibility authority. Missing evidence means NOT_PROVEN or BLOCKED.

### 11.3 ECC naming must not be conflated

There are two different meanings in the source history:

1. The user-defined term **Every Cloud Code (ECC)** is a desired cloud-side multi-agent controller/fabric concept. It must be treated as the user's architecture label until its exact source repository is identified.
2. The public repository `affaan-m/ECC` is branded **Everything Claude Code**. It is a separate upstream toolbox of skills, hooks, rules and harness support; it is not automatically the user's Every Cloud Code controller.

Do not silently equate the two. If the user means the public `affaan-m/ECC` repository, it may supply selected agent-harness practices after pinned review. It does not provide Pool A0, a durable multi-tenant queue, quota authority or a cloud scheduler by itself. The Every Cloud Code controller must be mapped to an exact upstream or explicitly assembled from selected proven components; do not invent a repository identity.

### 11.4 Jarvis source decision — what we take and what we do not claim

MediaHub's source documents define Jarvis as an umbrella architecture, not as one already-selected GitHub repository.

- **Cloud Pool A0 / first control plane:** continue from the existing repository `VlDMlNSh/developer-cloud-pool`, reusing its Pool Supervisor, GitHub issue/task intake and Actions workflows. It is the current project base, not a newly selected third-party product.
- **Execution substrate:** GitHub Actions with GitHub-hosted ephemeral runners, as established by MediaHub Wave 262. Do not require a VPS, local machine, self-hosted runner or always-on external server.
- **Jarvis user-facing web/workspace candidate:** `OpenHands/OpenHands` is the strongest currently reachable full web-application candidate in the reviewed set (public MIT repository, active main branch). Treat it as a candidate UI/workspace and possible agent application, not as the pool's authority or scheduler. Its full application must be checked for multi-tenant isolation, authentication, workspace boundaries, API compatibility, secret handling and deployment footprint before selection.
- **Coding execution SDK candidate:** `OpenHands/software-agent-sdk` is a separate candidate for task execution and streaming/workspace APIs. It is not a full Jarvis interface. A historical source pin exists in Wave 24, but refresh the exact commit, lockfile, license and security evidence before adopting it.
- **Personal Jarvis candidate:** `PersonalJarvis/PersonalJarvis` was identified in Wave 22 for desktop/voice/personal-agent UX, but Wave 24 could not resolve its canonical upstream provenance; two lookalike snapshots showed conflicting version/license claims. It is NOT the chosen base and must remain on hold until the authoritative repository identity and exact release are verified.
- **No arbitrary "Jarvis" repository by name:** `sukeesh/jarvis` was screened as a low-fit non-AI CLI assistant and is not a candidate for this system.

**Recommended composition:** current Developer Cloud Pool repository for A0 + GitHub Actions for cloud execution + OpenHands web app as the first UI/workspace candidate + OpenHands SDK as an optional bounded execution adapter. Keep OpenHands' internal orchestration subordinate to A0. PersonalJarvis remains an alternate UX research candidate, not an adopted dependency. This is a selection recommendation for the next source-review gate, not an installation or qualification claim.

### 11.5 Multi-tenant onboarding: how a user's MediaHub joins the cloud pool

A user MediaHub is a **tenant and task producer**, not a trusted worker and not a new authority inside another tenant.

Each tenant receives:
- immutable `tenant_id` and tenant owner/admin identity;
- one approved GitHub App/repository installation or an explicitly isolated repository boundary;
- tenant-specific repo allowlist, branch policy, task scopes and artifact namespace;
- per-tenant agent/provider allowlist and data-egress/privacy policy;
- tenant-specific secret references and budget/quota policy;
- isolated workspace/worktree and result/evidence namespace per task;
- separate memory/context namespace with no cross-tenant retrieval;
- audit trail, retention policy, revocation and deletion procedure.

**Onboarding flow**
1. Tenant owner authorizes a GitHub App installation or names the permitted repository and refs.
2. Pool validates the tenant principal, repository ownership/access, allowed operations, data class and policy version.
3. Pool creates a tenant record and capability profile; no provider key is copied into a task payload.
4. Tenant admin chooses which provider identities and agent profiles may be used; defaults are deny.
5. Secret references are bound to that tenant's isolated repository/environment and only injected into the specific authorized job that needs them.
6. A non-mutating admission probe verifies repository read, workflow permission, agent profile availability and secret-presence metadata without revealing secret values.
7. One bounded test task runs in a fresh ephemeral workspace with synthetic/non-sensitive input.
8. A3 checks target SHA, tenant scope, output manifest, artifacts and redaction; only then can the tenant be marked ELIGIBLE.
9. Tenant can suspend/revoke the GitHub App installation, disable provider profiles, cancel tasks and request artifact/data deletion according to retention rules.

**Isolation requirements**
- No shared writable checkout between tenants.
- No shared agent memory, browser profile, session cookies, provider key or task artifact namespace.
- No tenant can enumerate another tenant's repositories, prompts, outputs, usage or credentials.
- No untrusted pull-request code receives provider secrets.
- Each runner job is ephemeral; workspace cleanup is verified, not assumed.
- The pool itself never receives MediaHub Product State Authority. It returns a result/patch/evidence bundle; the tenant's own MediaHub controls whether to accept or apply it.

**User-contributed compute is a separate future feature.** Connecting a user's MediaHub to the pool does not automatically enroll that user's hardware. If user-owned machines are ever offered as workers, that is a separate opt-in, untrusted-by-default pool with sandboxing, resource caps, data minimization, no central secrets, attestation/provenance and revocation. It is not a launch prerequisite and is not enabled by tenant onboarding.

### 11.6 Daily renewable quotas and provider-key handling

The phrase "several hundred tokens per day" is recorded as a proposed per-tenant budget, but the unit and intended scale must remain configurable. The platform must not assume every provider offers a daily token reset or that free quotas are guaranteed.

Implement a quota ledger with independent dimensions:
- tenant and authenticated caller;
- provider, account/project, model and credential reference;
- input tokens and output tokens (separately);
- requests and concurrency;
- task/runtime minutes and optional cost ceiling;
- provider-defined quota scope and reset/cooldown timestamp;
- reserved, consumed, released and failed usage;
- source of usage data and confidence/freshness.

**Reservation and accounting**
1. A0 checks tenant policy and provider eligibility before selecting a credential reference.
2. Reserve the estimated budget atomically before dispatch.
3. Execute with explicit max input/output token and request/time caps.
4. Record provider usage metadata returned by the API; do not infer exact token counts from character length where the provider reports usage.
5. Reconcile reservation against actual use; release unused reservation; mark unknown usage conservatively.
6. On rate limit, honor the provider's Retry-After/reset data and persist cooldown at the actual quota scope (provider/account/project/model), not merely at a key index.
7. At the configured tenant-day boundary, renew the pool's internal allowance only. Provider capacity resets only when the provider's documented quota actually resets.
8. If quota is exhausted, queue until the permitted reset or choose another provider only if task data policy and provider terms allow it. Otherwise return QUOTA_EXHAUSTED.

**Credential rules**
- GitHub Secrets are references/containers, not proof of working credentials or available quota. Never read, print, copy or expose secret values in task records, logs, prompts or artifacts.
- Map each key only into the exact job/profile that needs it; never expose all provider secrets to every agent in a runner.
- For multiple tenants, do not reuse one repository-wide secret as an implicit shared tenant credential. Use isolated repositories/environments or a separately approved secret broker with tenant-bound authorization.
- GitHub Actions cannot automatically expose GitHub repository secrets to an unrelated Supabase/LiteLLM/other service. A transfer requires a separately reviewed mechanism; no secret is moved by assumption.
- No key rotation, account cycling or gateway switching may be used to evade a provider's account/project quota, free-tier limit or terms.
- No paid fallback unless the tenant explicitly authorized a budget and the task policy allows it. Default paid fallback is OFF.

### 11.7 Cloud-only runtime and capacity model

For the first launch, keep the execution plane GitHub-hosted:
- GitHub Actions workflows are the job envelope and bootstrap scheduler.
- GitHub-hosted ephemeral runners execute tasks.
- GitHub Issues/PRs, run metadata and artifacts hold the minimum initial task/evidence state.
- No self-hosted runner, VPS, local computer, NAS, user node, external queue server or external database is a dependency.
- If GitHub-native mechanisms cannot safely provide atomic quota reservations, leases or durable checkpoints at the required scale, stop and document the exact gap. Propose a separate hosted persistence/control service only through a new architecture and governance decision.

A runner can host multiple agent processes. The scheduler chooses a profile based on fresh CPU/RAM/disk measurements, model/API limits and isolation needs. Agent count and runner-job count are separate dimensions. Start with one bounded multi-agent job; scale jobs progressively only after exact evidence. Do not assume a runner slot is equivalent to one agent or that all account-level slots are available.

### 11.8 Required task graph and result contract

The corporation-wide task DAG gap identified in the MediaHub crosswalk must be closed for the pool. A mission may contain dependent subtasks, but only independent branches run concurrently.

Each task record binds:
- `tenant_id`, `mission_id`, `task_id`, idempotency key and schema version;
- requester identity/capability and approval provenance;
- repository, immutable ref/SHA, permitted paths and operation class;
- task dependencies, parent/child IDs, deadlines and cancellation propagation;
- data class, egress policy, provider/model/agent allowlist;
- selected agent profile, exact runtime and route identity;
- per-tenant/provider budget reservation and actual usage;
- unique workspace/lease identity and expiry;
- acceptance criteria, verifier profile and evidence schema;
- artifact URIs/digests, test results, limitations and terminal disposition.

Lifecycle:
`REQUESTED → AUTHENTICATED → ADMITTED → PLANNED → QUEUED → CLAIMED → EXECUTING → RESULT_STAGED → A3_VERIFIED → ACCEPTED or REJECTED`.

Retries create new attempt IDs. A worker never approves itself. A0 owns pool queue state; Jarvis UI and tenant MediaHub submit/read tasks through scoped APIs but cannot write leases or verification state directly.

### 11.9 Updated build order

1. **Freeze the source inventory:** reconcile the 128-row register and recover the second "200 projects" list if it exists; compare by capability and remove duplicates. Keep all research candidates uninstalled.
2. **Qualify the current pool foundation:** verify GitHub governance, current Supervisor/Worker scaffold, runner probe and negative tests. Keep dispatch disabled until gates pass.
3. **Implement the pool's typed tenant/task/result contract:** tenant identity, task DAG, SHA binding, policy, quota reservation, workspace and evidence. Prefer existing schemas/code where they fit; add only the missing adapter/glue.
4. **Prove one provider-backed runner:** use one authorized provider profile with a synthetic bounded task; validate usage capture and secret redaction.
5. **Prove the multi-agent runner profile:** run a mixed profile, not Gemini-only by assumption. Candidate initial coding group can include Gemini CLI/controller, Codex CLI and Claude Code only where each supported authentication route and license/terms are valid. Measure whether they can safely share one runner; separate profiles when their dependencies, credentials, tools or resource contention require it.
6. **Admit remaining provider identities:** Perplexity, Kimi, DeepSeek, OpenAI, GigaChat and the listed aggregators/direct providers one by one through the same admission ladder.
7. **Select and qualify Jarvis UI/workspace:** review OpenHands application against tenant isolation and the pool task API. Do not select PersonalJarvis until canonical source provenance is resolved.
8. **Add connector adapters:** GitHub first; Telegram bot after identity-bound intake; browser via isolated browser profile plus Playwright QA; Instagram only through official supported Meta APIs and required app permissions.
9. **Run multi-tenant qualification:** two synthetic tenants with disjoint repos, keys, workspaces, memory and artifacts; deliberately attempt cross-tenant access and require denial.
10. **Run quota/recovery qualification:** parallel reservation race, daily reset, provider reset mismatch, HTTP 429, unknown usage, worker loss, cancellation, retry, replay and paid-fallback denial.
11. **Launch the cloud pool:** only after a real multi-agent task, independent A3, tenant isolation and quota evidence pass.
12. **Add external servers later:** register each as a new isolated worker adapter after cloud-pool acceptance; external servers are not required to launch or operate the initial pool.

### 11.10 Explicit unresolved items — do not fabricate

- Exact canonical repository for the user's "Every Cloud Code" term.
- Exact source identity and intended use of PersonalJarvis; the current MediaHub source record does not qualify it.
- Exact second 200-project list; only the 128-row register is currently reconciled.
- Which of the registered provider credentials are valid and what quota each account/project/model actually has. Secret values were not read and must remain private.
- Whether "several hundred tokens" means hundreds, hundreds of thousands, per user or for the whole pool. The budget schema supports all these configurations; no numeric quota is activated by this plan.
- Whether GitHub-native task state is sufficient for atomic multi-tenant quota reservations and durable leases at target scale. This must be proven before adding any external database or router.
- Which agent processes can share one runner safely. That is a measured packaging decision, not an architectural assumption.

**Launch boundary:** this plan defines the target and decision sequence. It does not claim the pool, Jarvis UI, provider adapters, tenant onboarding, daily quota service or agent profiles are deployed or qualified. Current `POOL_DISPATCH_ENABLED=false` remains unchanged.


## 14. Operational evidence update — 2026-11-14

The point-in-time project state, exact active PR heads, exact-head CI, local D1 proof boundaries and next engineering gate are maintained in the Master Handoff. This architecture document is the target design and should not be used as a substitute for that live operational snapshot.

At the later 2026-11-14 continuation checkpoint:
- PR #67 exact head a53f6232bd5b50d3e150addf528b8e722002f9dd passed 84 local Workers-runtime tests, 1 upgrade-binding smoke and 2 frozen fixture tests.
- The A0 admission contract contributes 14 isolated tests. Its verifier, capability consumer and quota evidence are injected test authorities; the contract is not connected to the production Supervisor/Worker or an atomic hosted admission transaction.
- Six read-only GitHub-hosted runner resource observations exist: four in the same Azure image/version/region family and two in the same AWS image/version/region family. CPU model variation remains visible and no capacity is reserved. All observed Ubuntu 24.04.5 x64, 4 vCPU and 15 GiB RAM; observations do not establish reserved capacity or multi-agent packing.
- PR #67 and PR #68 remain open Draft PRs, not merged. Dispatch remains disabled.

For the exact current heads and next task, consult the Master Handoff and refresh GitHub metadata before making changes.
