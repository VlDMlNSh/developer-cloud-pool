# Cloud Development Pool — Target Architecture 2.0

Date: 2026-11-16
Contour: A — Cloud Development Pool
Status: TARGET DESIGN / NOT DEPLOYED / NOT QUALIFIED
Decision scope: Cloud Pool only. MediaHub product implementation remains deferred until Contour A is ACCEPTED.

## 1. Executive decision

Build one policy-governed control plane (Jarvis + Pool Bridge), separate execution planes, and a model-routing boundary per credential domain.

- Jarvis is the user-facing planner and approval surface. It holds no provider secrets and executes no arbitrary worker commands.
- Pool Bridge is the only privileged dispatcher. It validates immutable task envelopes, repository scope, policy, capability, quota and admission state.
- PostgreSQL is the authoritative system of record for admissions, repository leases, monotonic fencing generations, task state, outbox, quota reservations and audit metadata.
- GitHub Actions provides ephemeral cloud workers. It is not the durable queue, lock, database or memory store.
- LiteLLM Proxy is the primary normalized model gateway. A separate quota ledger and fail-closed policy remain authoritative.
- LangGraph coordinates bounded agent graphs and human approval pauses. PostgreSQL persists graph checkpoints. Temporal is deferred until measured needs justify it.
- FCC → Claude Code → ECC is one separately qualified execution profile. FCC and ECC remain distinct components with separately inventoried versions, contracts and permissions.
- OmniRouter is a separate gateway/profile for a second Claude Code environment and local model routes. It does not replace Jarvis, Pool Bridge or the durable task ledger.
- Ollama is the local inference endpoint on the qualified GPU node; private-network-only.
- Diogen/agent-browser is an isolated browser capability with separate browser profiles and credentials. It never receives model-provider secrets.
- No paid fallback, silent provider switching, credential sharing or quota-domain merging.

This is a deployable target specification, not evidence that components are installed or live.

## 2. Target topology

User / phone / desktop browser
  -> Jarvis Web UI + API
  -> Pool Bridge (policy, admission, scheduler, capability registry)
  -> PostgreSQL system of record
  -> LangGraph orchestrator (bounded graph; approval gates)
  -> execution adapters:
       A. GitHub Actions ephemeral worker profiles
       B. Claude profile 1: Ollama-compatible client -> FCC -> Claude Code -> ECC
       C. Claude profile 2: Claude Code -> OmniRouter -> approved cloud/local model routes
       D. four Gemini task workers through approved Cloud Pool controller only after gates
       E. isolated coding/research/test/security workers
       F. Diogen/agent-browser and Playwright browser workers
  -> LiteLLM model gateway -> per-provider credential slots
  -> evidence collector -> PostgreSQL + immutable artifact storage -> Jarvis result view

All dispatch flows pass through Pool Bridge. Workers cannot mint capabilities, choose arbitrary repositories, read unrelated secrets or dispatch other workers.

## 3. Plane boundaries

### 3.1 Experience plane — Jarvis
- Responsive web interface for phone and desktop.
- Task intake, plan preview, approval, progress, artifacts, citations and acceptance.
- No provider credentials in browser storage, frontend configuration or UI payloads.
- Open WebUI is optional operator/model playground only; it is not the system of record or security boundary.

### 3.2 Control plane — Pool Bridge
Only privileged dispatch authority. Required APIs:
- POST /tasks: validate and persist immutable task envelope.
- POST /tasks/{id}/approve: bind owner approval to exact envelope digest and target SHA.
- POST /tasks/{id}/dispatch: policy-gated admission and transactional outbox.
- GET /tasks/{id}: state and evidence.
- POST /tasks/{id}/cancel: fenced cancellation.
- Worker claim/heartbeat/complete endpoints authenticated by short-lived worker identity.

Each task envelope binds:
- task_id, parent_task_id, source event/comment ID and event digest;
- immutable repository ID, repository name and target commit SHA;
- requesting principal, approval identity and approved capability;
- role, objective, bounded scope, allowed paths, commands and network destinations;
- input artifact IDs and SHA-256 digests;
- expected output schema and acceptance criteria;
- model/provider route policy, credential audience, quota budget and expiry;
- worker profile, timeout, CPU/RAM/disk budget and retry policy;
- independent reviewer requirement and retention classification.

### 3.3 Durable state and admission
PostgreSQL is authoritative. Required logical tables:
- repository_control(repository_id PK, fencing_generation, lease_owner, lease_expires_at, updated_at)
- admission(source_event_id UNIQUE, event_digest, repository_id, target_sha, requester_id, approval_digest, status, created_at)
- task(task_id PK, admission_id FK, task_key, role, payload_digest, state, attempt, fencing_generation, target_sha, created_at, updated_at)
- task_outbox(outbox_id PK, task_id UNIQUE, destination, payload_digest, delivery_state, created_at, delivered_at)
- quota_domain(provider, account_scope_id, model_family, period, limit_snapshot, reserved, consumed, status)
- credential_slot(slot_id PK, provider, secret_reference, account_scope_id, quota_domain_id, enabled, qualification_state)
- audit_event(event_id PK, actor, action, resource_id, decision, target_sha, evidence_digest, created_at)

Hard invariants:
- One active repository lease per immutable repository ID.
- Fencing generation increases monotonically for every new lease holder.
- Every write/claim/heartbeat/complete operation checks current repository generation AND task attempt token.
- Admission is idempotent on source_event_id; changed payload with same event ID is rejected.
- Task claim and outbox creation are one database transaction.
- Ambiguous dispatch outcomes are reconciled by outbox/event identity before retry.
- Expired lease never authorizes a stale worker; stale generations are rejected.
- Actions concurrency is only a secondary resource throttle, never the durable lock.
- No worker dispatch before owner authorization and policy gates.

### 3.4 Intelligence plane — LangGraph
- LangGraph is the initial graph orchestration runtime for decomposition, bounded subagents, state transitions and human approval pauses.
- Persist checkpoints in PostgreSQL; keep graph checkpoint state distinct from immutable task/admission/audit records.
- LangGraph does not own privileged dispatch. It calls Pool Bridge APIs.
- Temporal is deferred until measured long-running workflow, timer, recovery or multi-service scheduling requirements exceed LangGraph + PostgreSQL.
- n8n may handle notifications and non-privileged integrations only.

### 3.5 Model plane — LiteLLM + quota ledger
- LiteLLM Proxy provides normalized model APIs, provider adapters, aliases, per-service virtual keys and provider routing.
- Provider credentials exist only in the gateway secret store/runtime. Workers receive short-lived virtual credentials scoped to a route and task.
- Pool Bridge reserves quota in PostgreSQL before dispatch. Gateway records actual usage after response.
- A request is denied if account identity, quota domain, rate limit, cost class or free/paid classification is unknown.
- Provider 429/401/403 and billing errors are classified; no automatic cross-account retry, no hidden fallback, no paid fallback.
- Every route is tagged: local, permanent-free, restricted-free, promotional-credit or paid-disabled.
- LiteLLM budget controls are defense-in-depth, not the sole spend barrier. External quota ledger and hard route allowlist decide admission.
- Model aliases are pinned to explicit provider model IDs and a qualification record. No floating alias without change review.

### 3.6 Claude execution profiles — FCC, ECC and OmniRouter

Profile A:
- Ollama-compatible client -> FCC -> Claude Code -> ECC.
- Keep FCC and ECC as separate processes/components unless upstream contracts prove otherwise.
- Record repository URL, immutable release/tag/commit, license, install source, API contract, auth model, supported Claude Code features, tool permissions, network egress, logs and resource footprint.
- Do not send arbitrary provider keys through FCC/ECC until adapter contract and credential isolation are verified.
- One task workspace per execution; no concurrent edits to a shared working tree.

Profile B:
- Separate Claude Code instance -> OmniRouter -> explicitly allowed cloud/local model aliases.
- Separate workspace, queue, credentials, quota ledger scope, audit stream and capability profile from Profile A.
- Local model endpoint points only to authenticated private Ollama API.
- No paid fallback. Unknown provider price or unsupported feature means route disabled.
- Profile B is a future Cloud Pool execution profile; MediaHub product work remains prohibited until Contour A acceptance.

FCC/ECC qualification is a joint end-to-end gate, but each component has its own inventory and security review. A successful Claude Code startup alone is not qualification.

### 3.7 Execution plane
- GitHub Actions hosted jobs are ephemeral workers; each task gets a clean checkout/worktree at the exact target SHA.
- Use least-privilege GitHub App installation tokens scoped to one repository/workflow where feasible; use OIDC federation when supported.
- Never run untrusted public PR code on persistent self-hosted nodes with secrets or local network access.
- Local nodes consume task leases from Pool Bridge; they are not general-purpose GitHub self-hosted runners.
- Agent outputs are untrusted until tests, provenance and independent review pass.
- Coding agents use isolated worktrees; integration is a separate controlled step.

### 3.8 Browser plane
- Diogen/agent-browser performs interactive web tasks in a dedicated worker with an isolated browser profile.
- Playwright is used for deterministic browser tests, not as a substitute for exploratory browser control.
- Browser cookies/session data are isolated from provider keys and worker environment.
- Domain allowlists, download/upload controls, navigation limits and evidence capture are policy-bound.
- Browser worker cannot read GitHub Actions secrets or model gateway credentials.

### 3.9 Data, artifacts and memory
- PostgreSQL: task ledger, approvals, leases, fencing, quota reservations, audit metadata and graph checkpoints.
- Object storage: large artifacts, source documents, browser evidence, generated outputs and scrubbed logs. Use S3-compatible storage or verified encrypted local volume.
- GitHub: source, contracts, workflows, ADRs and versioned project documentation.
- Actions artifacts: transient CI evidence only, not the sole durable copy.
- Memory is derived from accepted, source-linked records; retrieved memory is untrusted input, not executable instruction.
- Start with PostgreSQL full-text search + pgvector. Add Qdrant only after measured benchmark evidence.
- Backups must be encrypted, versioned and tested by restore.

## 4. Local node placement

Hardware facts must be re-inventoried before install; prior hardware descriptions are planning inputs only.
- L1 utility node: low-intensity adapters, telemetry, small document jobs and encrypted backup replica. Not primary database or GPU inference.
- L2 control/data node: Pool Bridge, PostgreSQL, LangGraph, LiteLLM, artifact API, telemetry and backup orchestration after disk/OS/network qualification.
- L3 GPU node: Ollama, embedding/reranking and GPU jobs behind private authenticated networking only.
- GitHub Actions: elastic ephemeral workers; do not download large model weights or persist secrets on runner disks.
- If a local node cannot pass host identity, capability, allowlist, OS, disk-health and network gates, keep it out of the scheduler.

## 5. Provider inventory and onboarding policy

Historical provider registry: 24 cloud credential slots plus ollama-local-1. It is a desired inventory, not proof of configured secrets, valid credentials, separate accounts, free entitlements or available quotas.

Existing slots to reconcile (do not create duplicate accounts until inventory is complete):
- MiMo: MIMO_API_KEY
- SiliconFlow: SILICONFLOW_API_KEY_1, SILICONFLOW_API_KEY_2
- Novita: NOVITA_API_KEY_1, NOVITA_API_KEY_2
- Z.ai: ZAI_API_KEY_1, ZAI_API_KEY_2
- Kimi/Moonshot: KIMI_API_KEY
- LLM7: LLM7_API_KEY
- SambaNova: SAMBANOVA_API_KEY
- Aion Labs: AIONLABS_API_KEY
- Cloudflare Workers AI: CLOUDFLARE_API_TOKEN_1/2 and matching ACCOUNT_ID_1/2
- NaraRouter: NARAROUTER_API_KEY_1
- OrcaRouter: ORCAROUTER_API_KEY
- UnoRouter: UNOROUTER_API_KEY
- ZeroRouter: ZEROUTER_API_KEY
- DeepSeek: DEEPSEEK_API_KEY
- Gemini: GEMINI_API_KEY plus candidate four-agent slots GEMINI_API_KEY_1..4 (four identities/quotas NOT VERIFIED)
- Groq: GROQ_API_KEY
- Mistral: MISTRAL_API_KEY_1/2
- OpenRouter: OPENROUTER_API_KEY
- Hugging Face: HF_TOKEN
- Local: Ollama, no cloud credential

Additional provider registrations:
1. NVIDIA Developer Program / NIM — recommended optional registration for hosted prototype endpoints and local NIM evaluation. It is a development/evaluation route, not an assumption of permanent production-free capacity. Confirm endpoint-specific limits and license before use. https://build.nvidia.com/
2. Cerebras — optional evaluation registration only. Current developer offer is promotional credit with a valid payment method and expiry; not a permanent free tier. Do not enable unattended usage or add a payment method solely for this architecture. https://cloud.cerebras.ai/
3. Do NOT register Anthropic API or OpenAI API as mandatory free routes. Treat API access as paid/credit-controlled unless an explicit active grant is verified. Claude Code subscription entitlements and API billing are separate. OpenAI API credits are account/plan-dependent and must not be assumed. https://console.anthropic.com/ ; https://platform.openai.com/
4. GitHub Models is not a new provider candidate: it was retired July 30, 2026. Do not build a route against it.

No other provider registration is mandatory for the first deploy. First reconcile existing provider accounts and credential slots. Do not create duplicate accounts to simulate independent quotas.

For each slot, record only metadata: slot ID, provider, account scope ID (non-secret), quota domain ID, secret name/reference, model allowlist, cost class, rate limits, region, terms/retention, last qualification time and status. Never store secret values or key fingerprints in Git.

## 6. Initial deployment profile (minimum viable production topology)

Required first:
1. Qualified L2 host and private overlay.
2. PostgreSQL with migrations, transactional repository lease/fencing, durable admission and outbox.
3. Encrypted backup and demonstrated restore.
4. Pool Bridge API in read-only/probe mode, then dispatch-disabled integration tests.
5. LiteLLM gateway with PostgreSQL-backed metadata, secret injection and paid routes hard-disabled.
6. Provider registry and quota ledger; start with one provider slot only after manual account/quota verification.
7. LangGraph with PostgreSQL checkpoints and explicit approval pauses.
8. GitHub Actions worker profile with exact-SHA checkout, minimal permissions, no secrets for untrusted PRs and artifact provenance.
9. Jarvis web interface with authentication and task/evidence views.
10. Observability: structured logs, task correlation IDs, Prometheus metrics and OpenTelemetry traces.
11. Browser profile only after Diogen/agent-browser host, browser, skill, domain allowlist and session isolation are verified.
12. FCC/ECC profile only after both components' provenance, license, API compatibility, permissions and end-to-end task are verified.

Do not initially deploy Redis, Temporal, Qdrant, n8n, Kubernetes or a second database. Add them only after measurements demonstrate a need. Do not treat Cloudflare D1/Workers as available: last read-only inventory found zero D1 databases and zero Worker scripts; entitlement/provisioning authority remain unverified.

## 7. Security invariants

- No secrets in Git, issue comments, artifacts, task payloads, browser sessions or logs.
- No secret reads during inventory; metadata-only presence checks where supported.
- Separate credentials and quotas by account, project and provider.
- No credential rotation, fallback or retry across accounts without explicit policy.
- All outbound network access is deny-by-default and capability-scoped.
- No worker may self-approve, expand scope, change target SHA or mint capabilities.
- Every worker mutation validates task attempt and repository fencing generation.
- External model calls record provider, model, credential slot ID, quota domain, latency, usage, status and output digest without credentials.
- Provider/model outputs are untrusted and cannot directly authorize actions.
- Paid routes remain disabled at gateway and scheduler layers.
- Untrusted PRs run only in isolated ephemeral environments with no secrets and no local network access.

## 8. Qualification and acceptance gates

G0 — repository governance and exact target SHA: PASS required.
G1 — host identity, hardware, OS, disk and network inventory: PASS required.
G2 — private network, identity, firewall and secret isolation: PASS required.
G3 — PostgreSQL migrations, concurrent admission, lease fencing, replay protection, outbox and crash recovery: adversarial tests PASS.
G4 — backup and restore: PASS with hashes and restore log.
G5 — LiteLLM + quota ledger: route allowlist, hard caps, 429 behavior, no paid fallback and credential isolation PASS.
G6 — one provider slot: account/quota identity confirmed, no-secret probe and one explicitly authorized low-cost qualification call; no automatic retry.
G7 — one worker profile: exact SHA, least privilege, workspace isolation, cancellation and artifact provenance PASS.
G8 — FCC/ECC: source/license/API/security inventory and end-to-end task PASS.
G9 — OmniRouter + local Ollama: private auth, model metadata, isolation and fail-closed routing PASS.
G10 — browser: isolated profile, site/session controls, no secrets and evidence capture PASS.
G11 — Jarvis end-to-end: task -> approval -> admission -> dispatch -> execution -> evidence -> independent review -> accepted state -> durable record.
G12 — independent security/governance review and published acceptance report.

Contour A is ACCEPTED only when every required gate passes and evidence is published. Until then, dispatch remains disabled or limited to explicitly qualified probe profiles. Contour B remains DEFERRED.

## 9. Recommended open-source components reviewed

- LiteLLM Proxy — primary model gateway candidate: https://github.com/BerriAI/litellm
- LangGraph — bounded graph orchestration and checkpointing: https://github.com/langchain-ai/langgraph
- PostgreSQL — authoritative relational state and transactional lease/outbox implementation: https://github.com/postgres/postgres
- Temporal — later option for durable long-running workflow orchestration: https://github.com/temporalio/temporal
- OpenHands — optional agent runtime, not privileged controller: https://github.com/All-Hands-AI/OpenHands
- Open WebUI — optional operator UI, not system of record: https://github.com/open-webui/open-webui
- Langfuse — optional LLM observability, not quota authority: https://github.com/langfuse/langfuse
- Ollama — local model serving: https://github.com/ollama/ollama
- Docling — document parsing: https://github.com/docling-project/docling
- SearXNG + Crawl4AI — search and extraction: https://github.com/searxng/searxng ; https://github.com/unclecode/crawl4ai
- agent-browser — interactive browser automation: https://agent-browser.dev/
- Playwright — deterministic browser QA: https://github.com/microsoft/playwright

Reuse these components; do not fork or recreate them without a documented gap. Pin versions/releases and review license, dependencies, permissions and update cadence before deployment.

## 10. Current status at design review

- Cloud Pool default branch Основной: 35208f0ef28f0ac031a7acdf35fc90ccc9b16845.
- Documentation branch docs/cross-chat-continuation-2026-11-06: 3041cce096e25a8bfe4fe9675f8dc6dc51324d10 before this design record.
- Existing reference architecture blob: 98f84dd24814ca91d4ade45fb3cf57535d8884ba.
- PR #107: OPEN/DRAFT/UNMERGED; four Gemini task envelopes and eight mocked tests; no live provider calls, no proof of four accounts/quotas, no production caller.
- PR #111: OPEN/DRAFT/UNMERGED; D1 proof tests passed but no repository-wide singleton lease/fencing and no live resource.
- PR #112: OPEN/DRAFT/UNMERGED; read-only owner-event controller; no durable admission/dispatch.
- Cloudflare read-only inventory: zero D1 databases and zero Worker scripts; entitlement/provisioning authority NOT VERIFIED.
- Approved Cloud Pool Gemini controller path remains absent from default branch; Gemini dispatch NOT RUN.
- GitHub Actions secret names/existence and provider account identities remain NOT VERIFIED. No secret values read.
- FCC/ECC source versions, licenses, runtime/API contracts and live qualification remain NOT VERIFIED.
- No provider gateway, live routing, local node, browser session or end-to-end deployment is claimed by this document.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

## 11. Next bounded implementation order

1. Implement PostgreSQL-backed repository-wide admission, monotonic fencing, durable source-event idempotency and transactional outbox with adversarial tests.
2. Reconcile existing provider slots by metadata only; do not add more keys until ownership and quota domains are documented.
3. Inventory FCC and ECC upstream sources, releases, licenses and API contracts; produce separate component qualification records.
4. Qualify L2 host/storage/network and backup restore.
5. Deploy LiteLLM + quota ledger with all routes disabled by default.
6. Qualify one no-cost provider slot, then one worker profile.
7. Qualify FCC -> Claude Code -> ECC as one isolated profile.
8. Add OmniRouter/local model profile only after its own isolation and route tests.
9. Integrate browser profile and responsive Jarvis UI.
10. Run independent end-to-end acceptance; only then consider Contour B.

Canonical MediaHub map (separate project; no product work authorized): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
