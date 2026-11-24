# Claude Code-first Executors, Continuous Runner Lifecycle and Hybrid Nodes

- Status: **DESIGN / NOT IMPLEMENTED / NOT QUALIFIED**
- Date: 2026-11-24
- Scope: Contour A only
- Owner-approved tracker: [Issue #172](https://github.com/VlDMlNSh/developer-cloud-pool/issues/172)
- Frozen default base: `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`
- Working documentation branch: `docs/engineering-excellence-2026-11-23`; PR #169 OPEN/DRAFT/UNMERGED

## 1. Architecture decision

Jarvis is a governed hybrid agent platform. **Claude Code is the primary candidate engineering-agent runtime for the first qualified executor profile.** GitHub Actions provides disposable, isolated cloud compute; it is not the agent identity, persistent database, permanent UI host or long-lived worker.

The owner-proposed first toolchain preserves the existing project lineage:

`local model / inference adapter → FCC → Claude Code → ECC`

Keep the labels **FCC** and **ECC** exactly as used in project direction. Their acronym expansions, canonical repositories, versions, licenses, installation procedures and security contracts are unresolved until verified from authoritative sources. Do not guess or silently redefine them.

Four planes remain separate:
1. **Experience/operator:** Jarvis web UI and Microsoft Visual Studio Code.
2. **Control/intelligence:** task intake, policy, model gateway, scheduler, durable ledger, quota manager and recovery coordinator.
3. **Execution:** ephemeral GitHub-hosted jobs running Claude Code or another explicitly qualified profile.
4. **Local/media:** Mac mini nodes and a future remote video server with narrowly registered capabilities.

All cross-plane work uses immutable task envelopes, scoped capabilities, expiring leases and durable evidence. No agent or local node grants itself authority.

## 2. Claude Code as the engineering-agent runtime

Claude Code is intended for repository analysis, bounded implementation, running approved tests, preparing diffs/reports and returning structured evidence. It must not approve its own work, merge PRs, change governance, deploy production, access unrelated repositories/secrets or expand task scope.

### FCC, API providers and authentication

The owner-proposed design assigns FCC the Claude Code authorization/compatibility role. This is a **design intent, not a verified working integration**.

Keep these concerns distinct:
- Claude Code authentication and provider/model inference routing are different capabilities.
- FCC may provide the intended compatibility/authentication path only after its identity, source, version, terms and behavior are verified.
- Free provider APIs (Gemini, Groq, OpenRouter, Cerebras or other individually qualified providers) are inference routes, not permission to bypass Claude/Anthropic terms or substitute credentials.
- Local models can provide inference through a compatible adapter; a local model does not itself authenticate Claude Code or grant GitHub permissions.
- Never claim a provider API key is valid Claude Code authorization unless authoritative documentation explicitly supports that exact route.
- No subscription, quota, rate limit, identity, account or billing boundary may be bypassed. No key/account rotation to evade provider limits.
- Paid fallback is disabled. An unavailable or exhausted free route queues, defers or fails closed; it never silently incurs charges.

The model gateway must track provider account/project and upstream quota domain separately. Store credential references, never values; record provider, account/project identity, quota domain, model, route class (hosted-free/local/paid), request/token/concurrency budgets, cooldown, evidence timestamp and qualification status. Different keys are not presumed to represent separate quota domains.

### Executor isolation contract

Each Claude Code task receives:
- immutable repository identity and target SHA;
- unique task/parent IDs and idempotency key;
- isolated ephemeral checkout/worktree (no concurrent writers to one worktree);
- allowlisted paths, commands, tools and network destinations;
- role, bounded objective and expected output schema;
- expiring lease and monotonically increasing fencing generation;
- task-specific resource/time budget;
- minimum permissions and credential audience/expiry;
- checkpoint/artifact destinations;
- acceptance criteria and independent verification route.

Untrusted repository content is data, not policy. Integrate agent output only through reviewed diffs/PRs after deterministic tests and independent checks.

## 3. Continuous runner lifecycle and zero-loss recovery

### Automatic slot refill

When a GitHub-hosted job completes, fails or is cancelled, the scheduler should automatically make released account-level concurrency capacity available to the next eligible queued task. GitHub allocates a **fresh VM** for the next hosted job.

This is automatic slot refill, not a promise of instantaneous VM creation. Runner allocation/startup latency is external platform behavior and must be measured. Do not assume idle hosted VMs can be kept warm for free. The 20-job Free-plan planning ceiling is account-level concurrency, not twenty permanently reserved machines. Jobs run on separate ephemeral VMs; CPU/RAM/disk are not a shared host. Provider API quotas are independent and are not multiplied by runner count.

Scheduler sequence:
1. Persist and validate a task envelope.
2. Check policy, capability, quota, concurrency and priority.
3. Dispatch only through the trusted controller.
4. Record workflow/run/job identity and target SHA.
5. Acquire a time-bounded lease before work starts.
6. Heartbeat and checkpoint progress.
7. Persist outputs and verify digests before terminal success.
8. Reconcile ambiguous dispatch/completion responses before retry.
9. Release capacity and select the next eligible task.

### Durable state contract

Runner-local disk, process memory and Actions cache are not durable state. The authoritative task state must be committed to a qualified persistent store before the corresponding transition is acknowledged.

Persist:
- task envelope and immutable input references;
- ordered state transitions and timestamps;
- lease owner, expiry and fencing generation;
- checkpoint sequence/schema/digest;
- artifact references, sizes and cryptographic digests;
- workflow/run/job IDs and source/target SHA;
- retry/recovery lineage and idempotency key;
- redacted logs and audit events;
- terminal outcome and independent verification result.

Required mechanisms:
- **Checkpointing:** periodic and phase-boundary saves.
- **Idempotency:** replay cannot duplicate externally visible side effects.
- **Atomic completion:** success only after output persistence and digest verification.
- **Lease + fencing:** stale workers cannot mutate state after reassignment.
- **Reconciliation:** read back ambiguous GitHub API responses before retry.
- **Bounded retry/backoff:** retry only eligible transient failures within an attempt budget.
- **Retention/GC:** delete temporary artifacts only after verifying durable references and retention rules.

Define RPO and RTO explicitly. “Zero loss” means no loss of **committed** task state/artifacts under a tested failure model. Uncheckpointed in-memory work may be lost; it must be replayable from the last committed checkpoint. Do not promise absolute zero data loss without defining the failure domain and verifying storage durability.

### Fault model

No-secret fault-injection tests must cover:
- runner process/VM disappearance, cancellation and timeout;
- runner loss between side effect and completion acknowledgement;
- delayed, rejected, partial or corrupt checkpoint upload;
- duplicate queue delivery/webhook event;
- lease expiry while old worker remains alive;
- stale fencing generation attempting a write;
- D1/object-storage outage;
- ambiguous GitHub dispatch response;
- simultaneous termination of all active jobs;
- UI disconnect/reconnect after multiple transitions.

Expected outcome: the durable ledger remains authoritative; stale workers are fenced; idempotent work is resumed/replayed; unresolved tasks remain visibly queued/recovering/failed, never silently successful.

### UI continuity

The UI reads a durable projection through the Experience API; it does not depend on runner lifetime or one socket. Use SSE/WebSocket only with bounded polling fallback and reconnect/replay support.

The client must:
- reconnect using a replay cursor/last event ID;
- fetch a fresh snapshot after missed events;
- show last confirmed state and timestamp while offline;
- distinguish QUEUED, STARTING, RUNNING, CHECKPOINTING, RECOVERING, SUCCEEDED, FAILED and CANCELLED;
- keep the main interface responsive while jobs start/exit/replace;
- never infer success from a closed connection or missing heartbeat.

## 4. Local and media nodes

### Mac mini Server 2011

Owner-reported hardware: Intel i7 / 16 GB RAM. Candidate low-intensity roles after inventory/security qualification:
- local connector and health telemetry;
- metadata indexing and lightweight document processing;
- bounded cache/queue relay (not authoritative unless durable semantics are proven);
- encrypted backup replica only after disk health, capacity and restore testing.

Do not make it the only copy of critical data, sole control plane, large-model inference host or heavy video processor. Verify exact model, OS support, architecture, disk health/SMART, thermals, network and patchability before connecting it.

### Mac mini 2018 i3

Owner-planned hardware: i3 / 32 GB RAM. Candidate roles after qualification:
- local connector and bounded worker;
- document/indexing/metadata services;
- small quantized local models if measured performance is adequate;
- local test/development environment;
- cache or replica with independent backup.

It is not assumed to be a GPU server. Do not place the only authoritative task ledger or unscoped provider credentials on it. Verify actual RAM, storage, OS, thermals and network.

### Future remote video server

A separate media node may provide media storage/cataloguing, metadata extraction, thumbnails/proxies, transcoding and GPU inference only if hardware/drivers/VRAM/throughput are measured.

Large source videos remain on that node or approved object storage. Hosted runners receive only bounded inputs/derived artifacts required for a task. Do not expose raw model/media ports publicly. The media node is not a privileged control plane and cannot approve dispatch or change GitHub governance.

### Local model routing

Local models are optional inference providers registered in the same gateway. Record node identity, model/version/quantization/context, measured tokens/sec, peak RAM/VRAM, startup time, concurrency, health, data locality and retention. Require authenticated private endpoints, network allowlists and audit. Hosted/local fallback must be policy-approved and task-compatible; private data must not be sent externally unless the task data policy allows it.

## 5. Microsoft Visual Studio Code — operator workbench

Microsoft Visual Studio Code is the human operator/admin workbench, **not** the Jarvis runtime or control plane.

Intended uses: inspect/edit repositories and reviewed branches; review diffs, tests, CI, Issues and PRs; connect to approved local nodes/video server; inspect logs/metrics/configuration; run diagnostics and maintenance; use source control and terminal workflows.

Controls:
- Remote SSH/Tunnels only after host identity, network exposure, authentication, patching and allowlist are verified.
- No provider/GitHub secret values in workspace settings, dotenv files, screenshots, terminal logs or committed files.
- Use least-privilege OS accounts and per-host access.
- A terminal does not authorize production mutation.
- Extensions are dependencies: review publisher/source, license, permissions, update policy and supply-chain risk; pin/allowlist where feasible.
- Dispatch, credentials, governance and production operations remain subject to policy gates and audit.

Jarvis web UI remains usable when VS Code is closed or disconnected.

## 6. Reference placement

| Component | Placement | Persistence / authority |
|---|---|---|
| Jarvis web UI | Verified free static/edge host | UI only; no direct privileged authority |
| Experience API/control plane | Qualified persistent service | Authenticated projection and gated mutations |
| Task ledger/leases/checkpoints | Qualified durable database | Authoritative task state |
| Artifact store | Qualified object storage/approved media node | Durable objects, digest and retention |
| Model gateway/quota ledger | Persistent policy-controlled service | Account-separated inference routing |
| Claude Code + FCC + ECC | Ephemeral GitHub job first; local worker only after separate qualification | Task-scoped execution |
| API/local models | Gateway-approved provider or registered node | Inference only; no dispatch authority |
| GitHub Actions | Disposable hosted VMs | Compute only |
| Mac mini 2011 | Local utility node | Non-authoritative helper |
| Mac mini 2018 | Candidate local control/data/worker | Only after qualification and backup |
| Remote video server | Media/data plane | Media storage and processing |
| Visual Studio Code | Operator workstation | Human administration |

Cloudflare Workers/D1, R2, GitHub artifacts or another store must be qualified against actual free-tier quotas, durability, object-size/retention limits and restore behavior before becoming the system of record. A diagram is not proof that a persistent service exists.

## 7. Reuse First register

No candidate is approved merely by appearing here.

| Capability | Candidate | Required evidence |
|---|---|---|
| Agent runtime | Claude Code | Official supported auth/runtime, license/terms, headless mode, sandbox, free eligibility |
| Auth/compatibility | FCC (project label; identity unresolved) | Canonical source, expansion, version, license, auth semantics, no quota/terms bypass |
| Tool extensions | ECC (project label; identity unresolved) | Canonical source, expansion, version, license, permissions |
| Local inference | Ollama/compatible runtime | Host support, model license, adapter fit, benchmarks |
| Agent graph/checkpoints | LangGraph | Version, backend, failure semantics, license, footprint |
| Durable orchestration | Temporal (later candidate) | Free-hosting feasibility; defer unless needed |
| Model routing | LiteLLM or minimal gateway | Account isolation, persistent quota enforcement, paid-fallback denial |
| Browser tasks | agent-browser + isolated Chromium | Pinned version, skill review, loopback-only CDP, no secrets by default |
| Remote IDE | Microsoft Visual Studio Code Remote SSH/Tunnels | Official feature, host security, extension governance, network exposure |
| Workflow lint/security | actionlint / zizmor | Exact release, license, maintenance, pinned execution, CI permissions |

Prefer GitHub-native workflow primitives and the smallest proven persistent store before adding brokers/orchestrators. Do not install every toolchain on every runner; use versioned task profiles and measure footprint.

## 8. Qualification plan

**Phase 0 — source/contract verification**
- Resolve canonical FCC/ECC identities and supported Claude Code authentication route.
- Verify provider terms/free quotas without reading secret values.
- Freeze task envelope, lease, checkpoint, artifact and worker identity contracts.
- Verify free-tier storage and restore path.
- Document VS Code remote-access threat model.

**Phase 1 — no-secret executor smoke**
- One ephemeral GitHub-hosted job; no live provider API or Claude account credential.
- Verify pinned installation, sandbox, worktree isolation, tool surface, cleanup and redacted evidence.
- Record target SHA, workflow/run/job IDs, versions and artifact digest.

**Phase 2 — lifecycle state-machine tests**
- Synthetic scheduler and durable-store tests.
- Lease expiry/fencing/idempotency/reconciliation.
- Checkpoint atomicity/corruption handling.
- Cancellation, runner loss, duplicate event and storage-outage fault injection.

**Phase 3 — UI/concurrency**
- Reconnect/replay and stale-snapshot tests.
- Load tests at 1, 3, 5, 10 and 20 concurrent jobs.
- Record queue wait, provisioning/startup, task duration, CPU/RAM/disk peak, checkpoint/replacement latency, RPO/RTO, UI event lag and provider quota use.

**Phase 4 — gated live qualification**
Only after trusted controller provenance, durable admission, worker identity, lease/fencing, quota manager, security review, exact-head CI and governance pass:
- owner-authorized single-task live Claude Code qualification on an approved free route;
- independent test/security review;
- bounded repeated recovery waves;
- no automatic paid fallback.

Metrics: queue wait; dispatch-to-runner-ready provisioning latency; prior-job-terminal-to-next-job-ready replacement latency; checkpoint RPO; fault-to-safe-resume RTO; durable-commit-to-UI freshness; duplicate side effects (must be zero in idempotency tests); independently verified tasks/hour. No numerical SLO is asserted before measurement.

## 9. Security invariants

- Dispatch remains fail-closed until trusted workflow provenance, admission, leases, worker identity, quota enforcement, checkpoint recovery and audit are qualified.
- Never read secret values. Metadata-only checks require explicit authorized gates.
- Never put provider credentials in prompts, artifacts, UI, VS Code workspace files or local model requests.
- Keep Jarvis, ASTRA A0 and MediaHub Product State Authority separate.
- No arbitrary workflow/ref/repository/command/network destination from user or model text.
- No persistent self-hosted runner for untrusted pull-request code.
- No paid service, billing change or production deployment without explicit approval.
- Contour B remains prohibited until Contour A is ACCEPTED.

## 10. Evidence snapshot at documentation start

- Default `Основной`: `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`.
- PR #169 head before this pass: `8198ab29f928429ddd70a43f9361ad741ace96e4`, OPEN/DRAFT/UNMERGED.
- PR #169 exact-head workflow runs: none returned; combined status contexts empty — **NOT VERIFIED**.
- PR #170 runs `45274455569` (D1) and `45274455577` (Pool Contract) are historical evidence for its prior synthetic merge head, not this documentation change.
- PR #171 has Pool Contract Validation run `45448087868` SUCCESS on its head; its workflow remains audit-only/non-dispatching.
- No Claude Code executor was launched or qualified in this pass.
- FCC/ECC canonical source identity was not resolved in this pass.
- No provider calls, secret reads, local-host connections, video-server provisioning, deployment, merge or production writes occurred.

This is an owner-approved target architecture and qualification plan. It does not prove implementation, deployment, runtime availability or qualification.


## 11. ECC preservation and multi-layer Jarvis evolution

ECC is a required named component in the owner-approved Claude Code toolchain. Keep it explicit in executor profiles, architecture diagrams, task contracts, installation/security review and acceptance matrices. Do not silently omit, replace or assume an implementation. Its canonical source, exact identity, version, license, permission model and supported integration remain to be verified.

The strategic evolution is documented in [Jarvis Multi-Layer Agent Organization Roadmap](JARVIS-MULTI-LAYER-AGENT-ORGANIZATION-ROADMAP.md) and tracked in [Issue #173](https://github.com/VlDMlNSh/developer-cloud-pool/issues/173): Level 1 Multi-Agent System; Level 2 AI Corporation; Level 3 Agentic Ecosystem / Agent Economy. These are descriptive project stages, not a claim that the industry has one settled standard name. Later levels remain design/backlog only; Contour A acceptance remains the immediate priority and Contour B stays deferred.


## Pass 75 — canonical FCC/ECC identity and qualification boundary

This addendum supersedes earlier statements in this document that the intended FCC/ECC identities were unknown. The owner-approved executor task [Issue #115](https://github.com/VlDMlNSh/developer-cloud-pool/issues/115) and its source/provenance notes identify:

- **FCC — Free Claude Code:** https://github.com/Alishahryar1/free-claude-code
- **ECC — Everything Claude Code:** canonical repository now https://github.com/affaan-m/ECC (the former `affaan-m/everything-claude-code` URL redirects to this repository).

Pinned provenance already used by the repository's no-secret qualification:
- FCC commit: `eb92e4c07af0d6ad8881dce1cd958c3d072c27c5`; pinned LICENSE declares `AGPL-3.0-only`; pinned `pyproject.toml` requires exactly Python `3.14.10`.
- ECC commit: `e413166c50e85fb205b988b5e78874b5a88ea4d2`; pinned LICENSE declares MIT.
- Current ECC repository metadata read during Pass75: package `ecc-universal` version `2.2.3`, MIT; SECURITY.md currently lists 2.x / RC as supported. This current version is not a replacement for the pinned commit in the historical runner artifact; any new qualification must pin and attest a fresh exact version/commit.
- FCC current README continues to identify the project as an independent, non-Anthropic project and advertises Python 3.14 / AGPL. No dedicated SECURITY.md was found at the checked path; this is not proof of absence of all security processes.

Critical FCC quota boundary: pinned source includes ordered API-key lists and numbered selection; the pinned test suite exercises sequential attempts across keys after 403/429. Never place credentials from distinct accounts/quota domains into one FCC profile. Require exactly one credential/account per isolated FCC profile, one selected model, no `MODEL_FALLBACKS`, no numbered-key fallback/key cycling, and no provider or paid fallback. Keep provider identity and quota ledger separate.

Historical PR #116 no-secret runner evidence:
- PR #116 head `2e944f13818f434cf135602c1c0e82051f1d3fa8`; base at creation `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Runner run `44286955337` SUCCESS; job `134741981861`, all 18 listed steps SUCCESS.
- Pool Contract Validation run `44286955360` SUCCESS; job `134741972786`, all 7 listed steps SUCCESS.
- Artifact `14420066410`, 34,605 bytes, digest `sha256:17638539900909e0c482a1178bfb88a2e301019db06d588f82fc1aefdd0c2d3a`; artifact expiry reported 2026-11-25.
- The proof covers installation, signed Claude Code binary verification, Docker no-egress primitive, FCC loopback health/shutdown, synthetic profile guard and mock CLI handoff, selected ECC skill installation, resource/provenance capture. It does **not** prove actual CODE worker execution inside the container, provider-specific egress allowlisting, a real Claude session, a permitted free provider route/account/quota, or production dispatch.
- PR #116 remains OPEN/DRAFT/UNMERGED and is 74 commits ahead / 12 behind the current observed base `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`. Its successful runs are historical evidence on its own immutable head, not current-base integration evidence.
- FCC must remain loopback-only until qualified legal review resolves AGPL-3.0-only obligations for the intended remote/network deployment. Claude Code hosted-use entitlement and provider terms remain separately NOT VERIFIED.

Disposition: identity and historical source/license provenance are now VERIFIED from owner task records plus upstream repository readback. Installation feasibility has historical exact-head CI evidence. New integration, current-base qualification, provider route, quota, actual worker execution, remote FCC deployment and legal review remain NOT QUALIFIED. No install or runtime was executed in Pass75.
