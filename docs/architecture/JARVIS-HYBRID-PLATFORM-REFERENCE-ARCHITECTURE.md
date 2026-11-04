# Jarvis Hybrid Platform — Reference Architecture

**Status:** PROPOSED / NOT DEPLOYED / NOT QUALIFIED  
**Date:** 2026-11-04  
**Repository:** https://github.com/VlDMlNSh/developer-cloud-pool

## 1. Executive decision

Build Jarvis as a hybrid, policy-governed agent platform:
- GitHub Actions is the elastic cloud execution plane.
- Three local nodes provide persistent control, storage and compute.
- One task registry and one model gateway provide consistent routing.
- Planning, dispatch, execution, memory and evidence remain separate.
- Credentials are short-lived and least-privilege; every task runs in isolation.

The 20 cloud slots are a concurrency ceiling, not 20 persistent servers. GitHub-hosted jobs are ephemeral VMs. This design is proposed only; it does not claim local hosts are connected, components installed or profiles qualified.

## 2. System planes

### Experience plane — Jarvis interface
Responsibilities: chat and task intake, clarification and approvals, status, artifacts, citations, document/content generation and acceptance.
- A thin custom Jarvis web/API is the durable product surface.
- Open WebUI is optional for model experimentation and operator access, not the authoritative workflow engine.
- The UI is not a security boundary.

### Intelligence plane — planning and reasoning
Responsibilities: intent classification, decomposition, plan creation, model selection, agent delegation, result synthesis and grounded retrieval.
- Use LangGraph initially for explicit agent graphs, state transitions, checkpoints, bounded subagents and human approval pauses.
- Store checkpoints in PostgreSQL.
- Keep agent state separate from immutable task envelopes and audit records.
- Consider Temporal later if durable multi-day workflows, timers, retries and high-availability scheduling outgrow the initial design.
- n8n may handle notifications and integrations, but must not own privileged dispatch or task provenance.

### Control plane — Pool Bridge
A separate service mediates every task dispatch. It is the only service allowed to translate an approved Jarvis plan into cloud or local execution.

Required functions:
1. Task API and schema validation.
2. Policy engine and repository allowlist.
3. Capability registry for cloud profiles and local nodes.
4. Scheduler and concurrency admission control.
5. GitHub App token broker and workflow dispatch adapter.
6. Local-node task broker.
7. Model Gateway adapter.
8. Evidence and audit collector.
9. Cancellation, timeout and retry controller.

Every task envelope contains:
- task and parent-task identifiers;
- immutable repository and target commit SHA;
- requesting principal and approved capability;
- role, objective and bounded scope;
- allowed paths, commands and network destinations;
- input artifact references and hashes;
- expected output schema;
- resource and time budgets;
- credential audience and expiry;
- acceptance criteria and independent reviewer;
- retention classification.

Agents cannot grant themselves capabilities, select arbitrary repositories, access unrelated secrets or dispatch privileged jobs directly.

### Execution plane
Workers advertise capabilities, not unrestricted authority. The scheduler chooses a compatible worker and grants a short-lived task lease.

### Data plane
Keep relational records, vector indexes, source files, generated artifacts and Git history distinct. A vector database is not the system of record.

### Trust and evidence plane
Record target SHA, worker identity, tool versions, actual model/provider route, timestamps, exit status, output digests, tests, reviewer result and policy decision.

## 3. Cloud execution: 20 logical slots

GitHub documents standard public Linux runners as 4 vCPU, 16 GB RAM and 14 GB SSD, with a Free-plan ceiling of 20 concurrent standard jobs. The quota is shared across repositories in the account. Public standard-runner use is free under the applicable GitHub policy. Re-check the plan and current limits before operational commitments.

| Slot(s) | Profile | Responsibility |
|---|---|---|
| 01 | Intake / Dispatch | Validate envelope, SHA, permissions and quotas |
| 02 | Policy / Provenance | Policy evaluation, evidence and audit |
| 03 | Gemini Research | Bounded research |
| 04 | Gemini Implementation | Isolated implementation |
| 05 | Gemini Independent Audit | Independent contract and security review |
| 06 | Claude toolchain | Ollama client → FCC → Claude Code → ECC |
| 07 | Codex CLI | Coding and review |
| 08 | Aider | Patch generation and test loop |
| 09 | Goose + MCP | Tool orchestration and reusable recipes |
| 10 | mini-SWE-agent | Issue-to-patch workflow |
| 11 | OpenHands SDK | Agent SDK and sandboxed workspace |
| 12 | agent-browser + Chromium | Interactive browser automation |
| 13 | Playwright | Deterministic UI tests |
| 14 | Search / Crawl | SearXNG client and Crawl4AI |
| 15 | Document ingestion | Docling and format conversion |
| 16–17 | Test workers | Unit and integration tests |
| 18 | Build / Performance | Build, package and benchmarks |
| 19 | Security | SAST, dependency, secret and configuration checks |
| 20 | Independent acceptance | Verify outputs, tests, hashes and provenance |

These are scheduling classes, not permanently reserved machines. Jobs are queued by priority and capability; idle slots are reused.

### Disk strategy for 14 GB ephemeral SSD
- Never download large model weights onto hosted runners.
- Do not install every agent in every job.
- Build a small number of versioned container images only after measuring their footprint.
- Use Actions cache as an accelerator, never as durable storage or a trust boundary.
- Keep Chromium only in browser-specific jobs.
- Use shallow checkout where full history is unnecessary, but fetch the exact target SHA.
- Key caches by OS, architecture, lockfile and image version.
- Keep 3–5 GB free after profile setup as a provisional guardrail; tune after measurements.
- Upload compact reports and scrubbed logs, not entire workspaces.
- Set explicit timeouts and cancellation behavior.

### Cross-repository participation
Multiple repositories can dispatch jobs into the same account-level hosted concurrency pool; each repository does not receive its own separate 20-job allowance. The central dispatcher must record source repository and target SHA. Use a GitHub App installation token scoped to the intended repository and workflow permission.

Do not register persistent local machines as self-hosted runners for workflows executing untrusted public pull-request code. GitHub warns that self-hosted runners can be persistently compromised by untrusted workflow code. Prefer ephemeral GitHub-hosted jobs for untrusted contributions. Local nodes should consume separately authorized task leases from the private broker.

## 4. Local node placement

Hardware values supplied by the owner are planning inputs, not verified telemetry. Inventory CPU, RAM, disk, SMART, OS, kernel, NIC, GPU, drivers, temperature and network before installation.

### L1 — Mac mini Server 2011, stated 4 cores / 16 GB
Role: low-intensity utility and secondary worker.
- Lightweight MCP adapters and internal integrations.
- Small CPU-only tasks and document conversion batches.
- Health checks and node telemetry.
- Encrypted backup replica if disk health and capacity are verified.
- Optional lightweight task worker in a rootless container.

Do not place the primary database, large model inference or browser farm here. Check drive health, thermals, Linux architecture and actual RAM. Older disks must not be the only backup.

### L2 — Mac mini 2018, stated 6 cores / 32–64 GB
Role: persistent control and data host.
- Pool Bridge API and scheduler.
- PostgreSQL as system of record.
- pgvector initially for semantic retrieval.
- LangGraph orchestration and checkpoint persistence.
- LiteLLM gateway, if not hosted elsewhere.
- Document metadata, ingestion queue and retrieval API.
- Optional Open WebUI.
- Metrics/log collection and backup scheduler.
- Durable artifact/object storage on a separate SSD or verified volume.

Reserve memory for PostgreSQL, OS page cache and service headroom. Measure IOPS and free disk before placing vector indexes or large corpora here.

### L3 — Remote GPU server
Role: inference and accelerated batch compute.
- Ollama model server and model weights.
- Embedding and reranking models.
- Code, reasoning and general-purpose local inference.
- Vision/audio models only when VRAM and drivers qualify.
- Batch inference and GPU-heavy document processing.

Expose only an authenticated private API. Never publish Ollama raw API ports to the public internet. Register model, quantization, context limit, VRAM, throughput and health in the capability registry.

### eGPU note
Mac mini 2018 supports Thunderbolt 3 and Apple documented eGPU options, but Linux driver/kernel/device compatibility must be tested. External GPU memory is not automatically shared with remote GPU memory. Treat eGPU as optional and separately qualified.

## 5. Component selection

### Agent runtime and engineering workforce
| Component | Purpose | Placement / decision |
|---|---|---|
| Gemini CLI / approved controller | Research, implementation, independent audit | GitHub jobs; only through approved controller and policy gates |
| Claude Code | Engineering agent | Slot 06 or qualified local worker; bounded sandbox |
| Codex CLI | Coding and review | Slot 07; separate credentials and worktree |
| Aider | Repo-aware patching | Slot 08; repo map and explicit test commands |
| Goose | MCP-connected agent and recipes | Slot 09; strong extension ecosystem |
| mini-SWE-agent | Issue-to-patch workflow | Slot 10; bounded issue tasks |
| OpenHands SDK | Extensible agent runtime | Slot 11 / L2; sandboxed workspaces |
| FCC / ECC | Existing selected toolchain components | Slot 06; exact versions and contracts still need inventory |
| agent-browser | Interactive browser tasks | Slot 12 with Chromium; load current core skill before browser actions |
| Playwright | Deterministic browser QA | Slot 13, separate from exploratory browser agent |

Do not let several coding agents edit the same working tree concurrently. Use isolated worktrees or ephemeral checkouts; integrate only after review.

### Orchestration and automation
- LangGraph: primary agent graph, checkpoints, subagents and human approval pauses.
- PostgreSQL: task ledger, durable state, checkpoint store and audit metadata.
- PostgreSQL task-lease table: enough for initial dispatch using transactional row claiming and lease expiry.
- Redis: add only for high-throughput ephemeral queues, rate-limit counters or caching.
- Temporal: optional later upgrade for long-running workflows and advanced retry semantics.
- n8n: optional integration and notification automation, not privileged dispatch.

### Model gateway and inference
- LiteLLM Proxy: unified model API, aliases, routing, retries, provider adapters, virtual keys and spend accounting.
- PostgreSQL is mandatory for LiteLLM budget enforcement. Its documentation states that budgets fail open without a database; do not claim hard budget enforcement on a DB-less deployment.
- Ollama runs on L3; clients on L2 and approved cloud jobs connect over the private authenticated network.
- Label local, free-tier and paid routes explicitly.
- Paid fallback is disabled unless separately approved. No silent paid fallback.
- Enforce per-task token/request caps, model allowlists, cooldowns and provider quota tracking.
- Only the gateway holds provider credentials; agents receive scoped virtual keys.

### Research and web acquisition
| Component | Function | Recommendation |
|---|---|---|
| SearXNG | Self-hosted metasearch | Discovery layer; validate original sources |
| Crawl4AI | Crawling and clean Markdown extraction | Main self-hosted crawler candidate |
| Firecrawl | Crawl, scrape and extraction API | Optional alternative; validate footprint, licence and dependencies |
| agent-browser | Dynamic websites and interactive sessions | Use for interaction, not bulk crawling |
| Playwright | Reproducible browser automation and QA | Keep deterministic tests separate |

Research pipeline: search → candidate URLs → fetch original source → normalize → record publication/update date → deduplicate → cite → fact-check. Search snippets are not verified facts. Respect robots directives, site terms, rate limits and access controls.

### Document ingestion and content production
- Docling: first-choice parser for PDF, DOCX, PPTX, XLSX, HTML, images and structured exports.
- MarkItDown or Apache Tika: fallback parsers for formats not handled adequately by Docling.
- Add OCR only after measuring scanned-document accuracy and language coverage.
- Store original file, normalized Markdown/text, parser version, source metadata, extraction warnings and SHA-256.
- Separate extraction from summarization and content generation.
- Generated content distinguishes sourced facts, inference and unverified claims.

### Memory and retrieval
Start with PostgreSQL metadata, pgvector embeddings and PostgreSQL full-text search. Combine lexical and vector retrieval, metadata filters and reranking.

Add Qdrant only if benchmarks show pgvector is insufficient for corpus size, query load or filtering needs. Qdrant supports payload filtering and hybrid dense/sparse/BM25 retrieval, but adds another stateful service to monitor and back up.

Memory layers:
1. Working context: current task and conversation.
2. Episodic memory: completed tasks, decisions and evidence.
3. Semantic memory: approved facts and extracted knowledge.
4. Procedural memory: versioned skills, runbooks and recipes.
5. Project memory: repo contracts, ADRs, issues and release history.

Every memory record needs source, timestamp, confidence, access scope, retention and deletion policy. Retrieved memory is untrusted input, not executable instruction.

### Durable storage and backup
- Git: source code, contracts, skills, runbooks and versioned decisions.
- PostgreSQL: authoritative relational state and task history.
- Object store: original documents, large generated artifacts, browser captures and evidence bundles.
- Actions artifacts: short-lived CI evidence only, never the only copy of important records.
- Local SSD: active object storage after disk health/capacity verification.
- Backup: encrypted, versioned restic snapshots to a separate physical target; keep an off-site copy where feasible.
- Test restore, not merely backup creation.

Actions cache is not a shared filesystem. Never put secrets, tokens or private documents into public Git history or public artifacts. One Mac mini disk is not resilient storage.

### Networking and secrets
- Private overlay: Tailscale Grants/ACLs or carefully managed WireGuard.
- Deny-by-default connectivity between nodes.
- L3 inference API reachable only from authorized L2 and approved worker egress.
- mTLS or short-lived signed service tokens between Pool Bridge and workers.
- GitHub Actions: prefer GitHub App installation tokens and OIDC federation where supported; avoid long-lived personal access tokens.
- Local secrets: encrypted at rest, service-specific files, restrictive permissions, no secrets in Git.
- Never print environment variables or credentials in logs.
- Review third-party Actions and pin them to full commit SHAs.
- Untrusted public PRs receive no secrets and no access to local nodes.

### Observability
Minimum:
- Structured JSON logs with task_id, worker_id, target SHA and correlation ID.
- Prometheus metrics for CPU, RAM, disk, queue wait, job duration, model latency, tokens, errors and retries.
- OpenTelemetry traces across Jarvis → Pool Bridge → model gateway → worker.
- Alerts for disk pressure, failed backups, offline workers, provider quota exhaustion and repeated failures.
- Append-only audit events for authorization and dispatch decisions.

Start with a lightweight collector and Prometheus-compatible metrics. Add Grafana/Loki/Tempo only when operational value justifies the overhead.

## 6. Recommended deployment topology

### L2 — persistent control/data
Pool Bridge API and scheduler; PostgreSQL + pgvector; LangGraph; LiteLLM; small object-store or filesystem-backed artifact service; telemetry collector; backup agent.

### L3 — GPU
Ollama; approved embedding/reranker services; GPU metrics exporter; private API only.

### L1 — utility/backup
Lightweight local task worker; health agent; encrypted backup replica; selected MCP adapters.

### GitHub Actions — ephemeral
Twenty elastic logical job classes; no durable state on runner disk; no large model weights; one task per isolated checkout; compact report/evidence upload.

## 7. Scheduling policy

Route by task type, required tools, CPU/RAM/disk/GPU/VRAM, latency, quality, privacy, provider quota, cost ceiling, worker health and repository permissions.

Priority:
1. Safety and policy validation.
2. Human-approved high-priority work.
3. CI and release-critical work.
4. Normal engineering and research.
5. Batch indexing and maintenance.

Reserve capacity for security, verification and release checks. Agent fan-out must not consume every slot.

## 8. Qualification gates

### Gate 0 — hardware inventory (NOT RUN)
For each local node record exact host ID, hostname, CPU model/flags, RAM, disk model/size/SMART, filesystem, OS/kernel, NIC/link speed, GPU/VRAM/driver, power/thermal state, network reachability and SentinelX capabilities/allowlist.

### Gate 1 — network and trust (NOT RUN)
Private overlay, deny-by-default policy, service identity, no public model ports, isolated worker account and firewall review.

### Gate 2 — storage and recovery (NOT RUN)
PostgreSQL backup/restore, object-store backup/restore, file hashes, disk alarms and retention tests.

### Gate 3 — model gateway (NOT RUN)
Ollama health, model/quantization inventory, API authentication, quota accounting, no paid fallback, rate limits and failure behavior.

### Gate 4 — agent profiles (NOT RUN)
Install one profile at a time; record footprint; run representative tasks; capture peak RAM/disk; verify cleanup; inspect outbound access; independently review outputs.

### Gate 5 — Pool Bridge (NOT RUN)
Schema validation, immutable SHA enforcement, capability check, least privilege, replay protection, task leases, cancellation, timeouts, audit completeness and cross-repository isolation.

### Gate 6 — end-to-end acceptance (NOT RUN)
Jarvis task → plan → approval → dispatch → execution → evidence → independent review → accepted result → durable memory. Test failure, retry, cancellation, worker loss and restore.

An install is not qualification. A profile is QUALIFIED only after representative workload and security gates pass.

## 9. Implementation order

1. Verify the existing GitHub resource probe and actual cloud runner footprint.
2. Inventory all three local hosts read-only; confirm SentinelX host IDs, capabilities and allowlists.
3. Qualify L2 storage and network before deploying databases or model services.
4. Deploy PostgreSQL + pgvector and encrypted backup/restore.
5. Deploy private overlay and local GPU API.
6. Deploy Ollama on L3 and verify remote inference from L2.
7. Deploy LiteLLM with PostgreSQL-backed budgets and paid fallback disabled.
8. Deploy LangGraph and Pool Bridge in read-only/probe mode.
9. Qualify one cloud profile at a time, starting with the lightest.
10. Qualify Ollama client → FCC → Claude Code → ECC as one profile.
11. Qualify browser automation and document ingestion.
12. Expand remaining profiles and dynamic scheduling.
13. Add Temporal, n8n or Qdrant only if measured needs justify them.
14. Run end-to-end acceptance and disaster-recovery exercises.

## 10. Current verified state

Latest repository check on 2026-11-04:
- Repository is public: VERIFIED.
- Default branch is Основной; it is currently unprotected.
- Latest HEAD before this design update: de860cb9f61b998713ae1bbf4fc3b48908a0e004.
- Existing runner resource probe: IMPLEMENTED, NOT RUN.
- Actions workflow runs observed: zero.
- No local host inventory was performed in this pass.
- No local components were installed or changed.
- No provider credentials were accessed.
- This reference architecture is PROPOSED, not deployed or qualified.

## 11. Source references

- GitHub hosted runners: https://docs.github.com/en/actions/reference/runners/github-hosted-runners
- GitHub Actions limits: https://docs.github.com/en/actions/reference/limits
- GitHub secure use: https://docs.github.com/en/actions/reference/security/secure-use
- GitHub self-hosted runners: https://docs.github.com/en/actions/concepts/runners/self-hosted-runners
- OpenHands SDK architecture: https://github.com/OpenHands/docs/blob/main/sdk/arch/overview.mdx
- Goose extensions: https://goose-docs.ai/docs/getting-started/using-extensions/
- Goose recipes: https://goose-docs.ai/docs/guides/recipes/
- agent-browser skills: https://agent-browser.dev/skills
- LiteLLM architecture: https://docs.litellm.ai/docs/proxy/architecture
- LiteLLM routing: https://docs.litellm.ai/docs/routing
- LiteLLM budgets: https://docs.litellm.ai/docs/proxy/users
- Ollama OpenAI compatibility: https://github.com/ollama/ollama/blob/main/docs/api/openai-compatibility.mdx
- LangGraph persistence: https://github.com/langchain-ai/docs/blob/main/src/oss/langgraph/persistence.mdx
- LangGraph checkpointers: https://github.com/langchain-ai/docs/blob/main/src/oss/langgraph/checkpointers.mdx
- Temporal tasks: https://docs.temporal.io/tasks
- Open WebUI essentials: https://docs.openwebui.com/getting-started/essentials/
- Open WebUI knowledge bases: https://docs.openwebui.com/features/workspace/knowledge/
- SearXNG: https://docs.searxng.org/
- Crawl4AI: https://docs.crawl4ai.com/
- Docling: https://github.com/docling-project/docling
- Qdrant hybrid search: https://qdrant.tech/documentation/hybrid-queries/
- Tailscale grants: https://tailscale.com/docs/features/access-control/grants
- Apple Mac mini Server 2011: https://support.apple.com/en-vn/112006
- Apple Mac mini 2018: https://support.apple.com/en-ie/111912
