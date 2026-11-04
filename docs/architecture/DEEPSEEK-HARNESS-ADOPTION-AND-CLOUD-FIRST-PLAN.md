# DeepSeek Harness adoption and cloud-first build plan

**Date:** 2026-11-04  
**Status:** DESIGN ACCEPTED FOR EVALUATION / DEPLOYMENT NOT STARTED  
**Scope:** Developer Cloud Pool only. This repository is independent from MediaHub OS.

## 1. Owner's current hardware boundary

Only one local machine currently exists:
- Mac mini Server 2011;
- 4 CPU cores;
- 16 GB RAM;
- Linux installed.

Mac mini 2018 and remote GPU server are future equipment. They are design targets only and must not be treated as available capacity or deployment prerequisites.

**Priority:** build the cloud pool first. The current Mac mini is an optional auxiliary node, not the control-plane single point of failure. Do not install the full Jarvis stack on it in this phase.

## 2. DeepSeek Harness assessment

Upstream: https://github.com/deepseek-ai/deepseek-harness  
License: MIT.  
Upstream README explicitly labels the project Developer Preview and warns about compatibility-breaking changes. Upstream SAFETY.md says it has not undergone a security audit and must not be treated as production-ready.

### What it is

DeepSeek Harness (dsh) is a composable agent runtime and application framework built on Cordis. Capabilities are plugins: model adapters, tools, session log, agent loop, filesystem, shell, browser/computer-use providers, MCP, skills, subagents, teams, background jobs, storage, credentials, sandbox, telemetry, UI and SDK.

Shipped profiles:
- web: operator-facing Web UI;
- headless: one task per invocation, no GUI/server/browser, suitable for scripts and CI;
- sdk: JSON-RPC runtime for an external application;
- acp: automation-only Agent Client Protocol server;
- sdk-minimal: intentionally small standalone composition.

The dsh-base bundle supplies model access, tools, durable session history, sandbox and approval policy, settings, credentials and telemetry. The base profile also includes subagent delegation and Agent Teams.

### Decision

**Adopt DeepSeek Harness as the primary candidate agent runtime, not as the pool's authority or scheduler.**

Use:
1. dsh headless for isolated one-shot cloud tasks.
2. dsh sdk only if/when an external Jarvis service needs a persistent SDK runtime.
3. dsh web for an operator console only after authentication and network exposure are hardened.
4. Cordis plugins/bundles to add repository-specific task/evidence capabilities after a pinned-version evaluation.

Do not fork the upstream project initially. Pin an exact upstream commit and package version in our evaluation workflow. Track upstream changes and upgrade deliberately.

### What it does not replace

- GitHub Actions scheduler and concurrency controls.
- Pool Bridge authorization, repository allowlist and capability policy.
- Immutable task envelope and target SHA enforcement.
- Cross-repository credential isolation.
- Durable project-wide task ledger and artifact retention policy.
- Independent acceptance and provenance verification.
- Long-term backup/restore and operational monitoring.

### Security boundary

Upstream SAFETY.md explicitly warns that model-generated commands and third-party plugins may access files, processes, credentials and networks made available to the process; the project is not security-audited. Its own sandbox cannot replace OS/container/microVM isolation for hostile workloads.

Therefore:
- Run DSH only inside disposable GitHub-hosted jobs in the first phase.
- No long-lived secrets in the DSH process.
- Use read-only GitHub token for reconnaissance; use a short-lived scoped GitHub App token only in a later gated write phase.
- Do not allow third-party plugin installation during ordinary task execution.
- Disable or tightly constrain shell, filesystem, network, MCP and plugin-manager capabilities per role.
- Treat web fetch to loopback/private addresses as a network-policy risk; enforce egress restrictions outside DSH.
- Never expose the Web UI or raw runtime API publicly.
- Do not run untrusted public PR code on the local Mac mini.
- DSH's in-process sandbox is not a VM boundary; GitHub-hosted ephemeral VM is the outer isolation layer.

## 3. DeepSeek Superagent prototype assessment

Upstream: https://github.com/deepseek-ai/dsh-superagent-prototype

This is a separate research prototype and is explicitly described by its authors as not production-ready. It is a bundle for DeepSeek Harness that listens to GitHub and optionally Feishu, creates work items, runs an executor in its own session/directory, and returns results such as pull requests. It includes authorization concepts, Mandates, Tickets, worker lifecycle, review/report states, retries and an operator panel.

**Decision:** do not deploy it as-is. Reuse its domain concepts as design input:
- Source and Trigger;
- explicit versus inferred request;
- Policy and Mandate;
- Ticket and Assignment;
- isolated Executor Session and directory;
- Report lifecycle: ready / waiting / blocked / failed;
- human review and recovery;
- separate router and worker permission presets.

Do not copy its automatic command execution policy without our own security review. The prototype's documentation describes worker commands running without approval as the operator OS user; that is unacceptable as a default for our public cloud pool.

## 4. Cloud-first reference topology

### Control and policy
- GitHub repository: versioned contracts, task definitions, workflow code, skills and evidence.
- GitHub Actions: ephemeral execution, job fan-out, concurrency and lifecycle.
- Pool Bridge (later): validates task envelope, repo allowlist, target SHA, role, capabilities, quotas and approvals before dispatch.
- GitHub App: short-lived repository-scoped tokens. No PAT copied into worker environments.
- Task ledger in phase 1: GitHub Issues/PRs plus workflow run metadata and compact evidence artifacts. This is a bootstrap ledger, not a substitute for a transactional database at scale.

### Agent runtime
- DeepSeek Harness headless: primary evaluation runtime for task execution.
- Cordis: extension mechanism for custom capabilities.
- DSH subagents/teams: task-local decomposition only, bounded by the parent task's permissions and budget.
- Codex CLI, Claude Code, Gemini CLI, Aider, Goose, mini-SWE-agent and OpenHands remain separate adapters/profiles; do not install all of them in every job.
- Every coding worker gets a fresh checkout/worktree and one immutable target SHA.

### Model routing
- Phase 1: provider adapter configured per worker; no secrets in baseline probe.
- Phase 2: LiteLLM Proxy as a unified model gateway if provider compatibility is proven.
- Ollama is deferred to the future GPU host. Do not download model weights to GitHub runners or the 2011 Mac mini.
- Model route must report provider, model, region/route class, quota source, token counts and whether paid fallback was disabled.
- Default policy: free/local routes only; paid fallback disabled unless explicitly approved.
- PostgreSQL-backed budget controls are required before claiming hard spend enforcement.

### Durable data
Phase 1:
- GitHub is source of truth for code, issues, PRs, contracts and reviewed decisions.
- Workflow artifacts contain compact, scrubbed evidence with explicit retention.
- Actions cache is only a performance cache, never durable memory or a shared filesystem.

Phase 2 (after a durable host or managed service is approved):
- PostgreSQL for task ledger, users, policies, checkpoints and audit metadata.
- pgvector plus PostgreSQL full-text search for initial hybrid retrieval.
- S3-compatible object storage for large artifacts and source documents.
- restic encrypted backups and verified restore drills.
- Qdrant only if measured pgvector limits justify an additional stateful service.

### Research and knowledge ingestion
- SearXNG: metasearch/discovery.
- Crawl4AI: controlled crawling and extraction.
- agent-browser + Chromium: interactive pages and authenticated browser workflows, isolated from general coding jobs.
- Playwright: deterministic browser tests.
- Docling: document parsing and layout-aware extraction.
- MarkItDown / Apache Tika: fallback format conversion.
- OCR only after a language/accuracy benchmark.
- Every extracted fact retains source URL, publication/update date, retrieval time, parser version and content hash.

### Content and artifact production
- Markdown as canonical text source.
- Pandoc / Quarto for document publishing and technical reports.
- ReportLab for PDF, python-docx for DOCX, openpyxl for XLSX, python-pptx for PPTX.
- Mermaid for source-controlled diagrams.
- LibreOffice headless as an optional conversion backend after disk/RAM measurements.
- Generated claims must be marked as sourced fact, inference or unverified.

### Security and supply chain
- Least-privilege workflow permissions.
- Pin third-party Actions to full commit SHAs.
- Gitleaks for secret scanning.
- Semgrep for SAST.
- Trivy for filesystem/container/dependency scanning.
- Syft for SBOM generation; Grype for vulnerability scanning.
- OPA or Cedar may be evaluated for policy-as-code; keep the initial policy small and auditable.
- Sigstore/cosign for artifact/image signing where supported.
- Network egress allowlists, no credential-bearing logs, short-lived tokens, immutable task IDs and replay protection.
- Public PR workflows receive no secrets and cannot reach the local host.

### Observability
- GitHub Actions run/job IDs and summaries for phase 1.
- OpenTelemetry instrumentation for Pool Bridge and model gateway later.
- Prometheus metrics; Grafana/Loki/Tempo only when a persistent host is ready and resource measurements justify them.
- Audit every authorization, dispatch, cancellation, retry and acceptance decision.

## 5. Twenty-slot scheduling model

Twenty is the maximum simultaneous standard hosted-job concurrency for GitHub Free according to the Actions limits documentation; it is an account-level limit shared by repositories, not twenty per repository. Public standard runner use is free under current GitHub documentation. Re-check account policy and plan before relying on it.

Do not permanently reserve one slot per profile. Use a dynamic queue with capability labels and priority. Proposed classes:
1. Intake/schema validation.
2. Policy/provenance gate.
3. DSH research worker.
4. DSH implementation worker.
5. Independent DSH audit worker.
6. Claude Code + selected toolchain profile.
7. Codex CLI.
8. Aider.
9. Goose/MCP.
10. mini-SWE-agent.
11. OpenHands SDK.
12. agent-browser + Chromium.
13. Playwright QA.
14. Search/crawl.
15. Document ingestion.
16–17. Unit/integration tests.
18. Build/performance.
19. Security/SBOM.
20. Independent acceptance/evidence.

This is a logical capability catalogue. The scheduler may run any mix of up to the account's available concurrency. A job's disk and memory are private to that job.

## 6. Disk and memory efficiency

For a standard Linux runner, GitHub documents 4 vCPU, 16 GB RAM and 14 GB SSD. This disk budget is the main constraint.

Rules:
- Install only the selected worker profile in a job.
- Use dsh headless for CI; do not install the desktop/Electron app on every runner.
- Cache package-manager downloads by lockfile and pinned runtime version, but never trust cache as durable state.
- Keep browser binaries only in browser jobs.
- Do not download model weights.
- Prefer shallow checkout when the task does not need history.
- Use bounded dependency installs, explicit timeouts and cleanup.
- Upload compressed, scrubbed reports, not whole workspaces.
- Maintain free-disk headroom and fail early if the profile cannot fit.
- Measure actual peak RSS, workspace disk delta, package install time and job duration before qualifying a profile.

The 14 GB figure is the runner SSD capacity, not a promise of 14 GB free workspace space. Probe actual filesystem allocation before selecting a profile.

## 7. Phase plan — cloud first

### Phase 0 — baseline and upstream pin (current)
- Confirm repository HEAD and branch governance.
- Run the existing read-only GitHub Runner Resource Probe.
- Pin DeepSeek Harness upstream commit and package version.
- Inspect license notices, safety notice, package footprint, Node/pnpm requirements and shipped profile dependencies.
- Build a disposable evaluation workflow with no secrets and read-only permissions.
- Do not dispatch real repository write tasks yet.

### Phase 1 — one DSH headless cloud worker
Acceptance:
- A manually dispatched workflow runs on ubuntu-24.04.
- DSH version and upstream commit are recorded.
- The headless profile completes a harmless bounded task.
- No secrets are accessed.
- No writes outside the job workspace occur.
- Job captures peak memory, disk delta, install time, duration and exit code.
- Output includes target SHA, provider/model metadata and artifact hashes.
- A separate verifier checks output and provenance.
- Security review confirms no unbounded network access or plugin self-install.

### Phase 2 — controlled task envelope and evidence
- JSON Schema for task envelope.
- Repository allowlist initially includes only this pool repository.
- Exact target SHA required.
- Roles and paths are explicit.
- Read-only execution by default.
- Separate write-enabled workflow only after branch protections, GitHub App permissions and approval gates exist.
- Record task/run/job IDs, logs, output digest and reviewer decision.

### Phase 3 — model gateway and provider profiles
- Prove DSH compatibility with an OpenAI-compatible LiteLLM endpoint.
- Test local/free route metadata, provider quota handling, retries and fail-closed behavior.
- Add Gemini, Claude, Codex and other profiles independently.
- Paid fallback remains disabled.

### Phase 4 — broader cloud workforce
- Add browser, crawl, document, test, security and code-agent profiles one by one.
- Measure profile footprint and concurrency fairness.
- Build dynamic queue and cancellation/retry policy.
- Cross-repository dispatch only after allowlist and GitHub App token scoping are qualified.

### Phase 5 — optional local node
Only after cloud pool works independently:
- Read-only inventory of Mac mini 2011.
- Consider a lightweight connector/backup helper only if Linux architecture, disk health, network and SentinelX capabilities pass.
- No full database, GPU inference or persistent self-hosted runner on the 2011 host by default.
- Mac mini 2018 and remote GPU server remain future capacity and are not deployment blockers.

## 8. Current state and blockers

At the beginning of this pass:
- Pool repo HEAD: 6e7a2b9c7c0cb9b66c67fbabaa5620a7b40c6110.
- Runner Resource Probe workflow: present, blob SHA 3b925d2ff7db77b669a1056b6ec04d4028640edf.
- GitHub Actions runs: zero; resource probe remains NOT RUN.
- Existing README and architecture docs describe future L1/L2/L3 target layout; only L1 exists now.
- SentinelX showed one connected ARM64 host Voktors-Mini.Dlink, host ID host_5f7264034bdf0b51; this identity is not confirmed as the 2011 Mac mini. SentinelX Free plan showed one active host slot used and zero free slots. No commands were run on it.
- Two other SentinelX entries were disabled; no changes were made.
- No DSH package was installed or executed in this pass.
- No provider credentials were accessed.

## 9. Upstream references

- DeepSeek Harness repository: https://github.com/deepseek-ai/deepseek-harness
- DeepSeek Harness architecture: https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md
- DeepSeek Harness safety notice: https://github.com/deepseek-ai/deepseek-harness/blob/master/SAFETY.md
- DeepSeek Harness package map: https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/README.md
- DSH base bundle: https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/base/README.md
- DSH headless profile: https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/headless/README.md
- DSH subagents: https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/README.md
- DSH teams: https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/team/README.md
- DSH jobs: https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/jobs/README.md
- DSH sandbox: https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/sandbox/README.md
- DeepSeek Superagent prototype: https://github.com/deepseek-ai/dsh-superagent-prototype
- GitHub hosted runners: https://docs.github.com/en/actions/reference/runners/github-hosted-runners
- GitHub Actions limits: https://docs.github.com/en/actions/reference/limits
- GitHub Actions secure use: https://docs.github.com/en/actions/reference/security/secure-use
