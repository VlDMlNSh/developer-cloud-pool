# Jarvis Operating Model 1.0 — Governed Cloud Engineering OS

**Status:** NORMATIVE ARCHITECTURE ADDENDUM / PROPOSED IN PR #120 / NOT DEPLOYED  
**Date:** 2026-11-17  
**Scope:** Contour A only. Contour B remains deferred.

## 1. Purpose and governing philosophy

Jarvis is the single user-facing operating system for the Cloud Development Pool. It is more than a chat front end or passive dispatcher: it coordinates planning, task decomposition, executor selection, execution supervision, infrastructure health observation, evidence verification, recovery proposals and operational reporting.

> Jarvis owns the workflow; qualified executors perform bounded work; tools expose narrowly scoped capabilities; authoritative stores own durable state; independent gates decide what is trusted.

Jarvis may autonomously perform low-risk, reversible, policy-permitted operations. It may diagnose, plan, create task proposals, select already-qualified routes, observe health, reconcile known states and request bounded work. It must not grant itself authority, approve its own sensitive operations, weaken governance, expand a capability, alter credential/account identity, bypass an approved controller or mark its own work ACCEPTED.

This extends Reference Architecture 1.0; it does not create a competing control plane. Existing A0 admission, capability, transactional state, Supervisor, dispatch-controller, worker, quota and acceptance boundaries remain authoritative.

## 2. Three-plane decomposition

| Plane | Components | Owns | Explicitly does not own |
|---|---|---|---|
| Control Plane | Jarvis, Experience API, Task Orchestrator, Agent Registry, Policy/Identity, Resource Manager, Quality Gate | Intent, plans, authorized task transitions, scheduling requests, policy decisions and operational supervision | Raw provider secrets, independent approval authority or arbitrary worker execution |
| Execution Plane | Claude Code, Gemini CLI/approved agents, Codex CLI, coding runtimes, browser adapters, terminals, CI jobs, ephemeral workers and persistent Engineering Workspace | Bounded task execution inside declared profiles and isolated workspaces | Task admission, owner identity, quota policy or acceptance authority |
| Data Plane | GitHub, one selected transactional state authority, artifact/object storage, logs/telemetry, workspace filesystem and backups | Versioned source, durable task/attempt/lease/outbox state, evidence, operational events and recoverable files | Conflicting mutable task authorities or implicit execution permission |

The planes communicate only through versioned, authenticated contracts. Replacing a model, editor, browser engine, storage adapter or UI must not require redesigning the other planes. The single transactional authority invariant in Reference Architecture §7 is unchanged.

## 3. Jarvis internal services

### 3.1 Task Orchestrator

The Task Orchestrator owns coordination, not underlying authority. It converts intent into typed task proposals and acceptance contracts; decomposes complex work into bounded subtasks and dependency edges; assigns immutable task, attempt and correlation IDs; binds repository, exact target SHA, allowed paths/operations, timeout and resource budget; requests approval and A0 admission; schedules only admitted work and qualified profiles; collects results; requests independent review; handles retries/reconciliation; persists resumable checkpoints through the canonical state store; and emits an audit trail for every transition.

It cannot treat a model response, GitHub label, Actions concurrency group, local cache or in-memory state as an authoritative lock or approval.

### 3.2 Agent Registry

The Agent Registry is a versioned inventory of logical executor profiles. It stores metadata, never raw credentials. Required fields:
- stable `agent_id` and immutable profile revision;
- provider/model and runtime type (CLI, API, browser, CI or other adapter);
- declared capabilities, task classes and input/output schemas;
- execution location and isolation class;
- opaque issuer/account/credential-handle/quota-domain references where applicable;
- permissions, allowed operations, path and network scopes;
- timeout/resource limits and concurrency ceiling;
- qualification evidence, source/version pins and revocation status;
- health/readiness observations, last successful probe and evidence age;
- current availability, queue depth and quota eligibility.

Registry presence is not route qualification. A route is selectable only when current issuer-bound evidence, account isolation, quota and permission checks pass. Health checks are no-secret/no-provider-call unless a separately approved qualification authorizes a live probe.

### 3.3 Resource Manager

The Resource Manager applies hard budgets before scheduling: per-task/global concurrency; per-profile slots and queue limits; runtime, CPU, memory, disk and artifact-size ceilings; per-account request/token/concurrency reservations; cooldowns, rate-limit windows and bounded retries; free-tier eligibility and zero paid-fallback policy.

Reservations and settlement are written to the canonical quota/state authority or a transactionally consistent adapter. If quota state is unavailable, stale or ambiguous, new admission is denied. No hidden cross-account pooling, key cycling or paid failover is allowed.

### 3.4 Quality Gate

No executor can self-certify its output. Quality Gate validates task/attempt/target SHA and workflow provenance; artifact digests, commit ancestry and allowed paths; required tests and policy assertions; independent reviewer results and unresolved findings; security/license/dependency/secret-scanning evidence where required; and acceptance-contract completeness.

CI success is evidence for one check, not blanket qualification or acceptance. Implementer and reviewer must be independent for critical changes. Only the designated acceptance authority may mark QUALIFIED or ACCEPTED.

## 4. Logical agent roles and dynamic team sizing

Agent roles are logical responsibilities, not separate vendors, API keys, machines or independent upstream quotas.

| Role | Responsibility | Typical deliverable |
|---|---|---|
| Agent 1 — Research / Implementation | Research reusable components; implement bounded changes | Source change, provenance and rationale |
| Agent 2 — Contract / Test Review | Independently inspect contracts, edge cases, tests and regressions | Test results and review findings |
| Agent 3 — Security / Authority Audit | Review trust boundaries, permissions, secrets, provenance and governance | Threat findings and gate disposition |
| Agent 4 — Alternative / Independent Implementation | Produce a competing design or isolated implementation for high-risk/ambiguous work | Comparison, independent patch or challenge |

Jarvis selects roles based on risk, complexity, budget, deadline, qualified capacity and independence requirements. A small task may use one implementer plus deterministic checks. Critical security/architecture changes require independent review and security scrutiny; Agent 4 is used when an independent alternative materially reduces uncertainty.

Four roles are not four API keys and do not imply four simultaneous agents. The registry resolves each role to a qualified profile at dispatch time. An unavailable role is recorded NOT RUN/BLOCKED, never silently substituted with an unqualified or paid route. Gemini remains optional and exclusively behind the approved controller after its gates pass.

## 5. Executor adapter contract

All runtimes are exposed through a common versioned adapter contract:
- `describe_capabilities()` — immutable profile metadata;
- `health_check()` — bounded readiness result with explicit probe class;
- `submit(task_envelope)` — accepts only a canonical admitted envelope;
- `get_status(task_id, attempt_id)` — redacted execution state;
- `collect_result(task_id, attempt_id)` — result manifest and digests;
- `cancel(task_id, attempt_id)` — best-effort stop request, never proof execution stopped;
- `reconcile(task_id, attempt_id)` — correlated read-back after ambiguous outcomes.

Adapters are pinned, reviewed, isolated and least-privileged. They cannot mint admission receipts or update authoritative state without the current service contract and fencing token.

Planned adapter families include Claude Code, Gemini CLI/approved controller, Codex CLI, specialized browser automation, deterministic Playwright tests, CI workers and compatible runtimes. Each remains PLANNED until exact runtime and security evidence qualifies it. The Claude Code + ECC + FCC profile remains governed by its own license, account-isolation, no-fallback and runtime gates; this document does not promote it to production.

## 6. Four-layer memory model

| Layer | Contents | Authoritative storage | Update/retention |
|---|---|---|---|
| Project Memory | Architecture, ADRs, contracts, roadmap, accepted decisions and provenance | GitHub versioned documents/commits | Reviewed and versioned; superseded decisions explicitly marked |
| Task Memory | Intent, plans, subtasks, attempts, checkpoints, results and reviewer findings | Transactional task store plus digest-bound GitHub evidence/artifacts | Per-task lifecycle; resumability and retention/deletion policy |
| Agent Memory | Profile capabilities, specialization and approved non-secret operational notes | Versioned Agent Registry/profile store and scoped context references | No cross-account secret/private-task leakage; scoped, revocable and provenance-tagged |
| Operational Memory | Health, heartbeats, quota observations, resource use, incidents, audit and recovery state | Transactional operational store plus append-only redacted telemetry | Bounded retention, redaction, integrity and restore policy |

Memory is not a free-form shared prompt. Every item needs owner, source, timestamp, schema/version, sensitivity, retention and revocation semantics. Unverified model-generated claims remain proposals, not Project Memory. Secrets, tokens, cookies, private keys and raw credentials are never memory content.

## 7. Agent Observability and operational supervision

Jarvis presents a unified redacted view of tasks, plans, dependencies, attempts and checkpoints; executor profile, logical role, runtime and status; target SHA, changed paths and artifact evidence; workflow/job IDs, timestamps, duration and bounded resource use; quota reservations/usage/cooldowns by account domain; health/readiness, heartbeat age, queue depth and retry/failure counts; Quality Gate findings, approvals and blocked reasons; and audit/recovery disposition.

Every event uses stable task/attempt/agent/profile/run correlation IDs. Telemetry excludes credentials, private prompts, session cookies and unnecessary personal data. Health is time-bounded; stale observations are visibly STALE.

Jarvis may detect anomalies and initiate pre-authorized reversible recovery (e.g. pause scheduling to an unhealthy profile or request reconciliation). It may not delete evidence, force-release a lease without fencing/reconciliation, reroute to an unqualified account, change governance or perform destructive remediation without explicit authorization.

## 8. Six Jarvis work areas

1. **Jarvis Chat** — intent, task proposals, plans, approvals and progress.
2. **Agent Center** — registry, profiles, capabilities, health, assignments and qualification evidence.
3. **Workspace** — terminal, browser IDE, editor, Git worktrees and persistent filesystem through separately authorized Workspace controls.
4. **Development Center** — repositories, branches, commits, PRs, CI, diffs, tests and review evidence.
5. **Operations Center** — queues, budgets, quotas, telemetry, incidents, governance and audit.
6. **Knowledge Center** — Project/Task/Agent/Operational Memory, architecture, artifacts and checkpoints.

All views consume the same identity-aware Experience API and redacted projections. UI visibility grants no operation. The initial GitHub-only milestone remains static/read-only; write, approval and dispatch controls remain unavailable until their independent gates pass.

## 9. Autonomy and approval matrix

| Operation | Jarvis autonomy |
|---|---|
| Read allowlisted status, logs and public project metadata | Allowed after authenticated read authorization |
| Draft plans, decompositions and architecture proposals | Allowed; proposals are not approvals |
| Select already-qualified profile within existing capability/quota policy | Allowed through admission service |
| Schedule bounded, pre-approved reversible work | Allowed after A0 admission and current lease |
| Pause new scheduling for stale/unhealthy profile | Allowed as fail-safe |
| Retry after proven safe reconciliation within bounded budget | Allowed through a new attempt and idempotency controls |
| Merge protected code, change governance, enable dispatch, alter secrets or identity | Explicit owner approval and independent gate required |
| Add/upgrade paid services, use paid fallback, alter account/quota ownership | Prohibited |
| Expand capabilities, bypass controller, self-approve or self-accept | Prohibited |

The owner remains strategic authority. Jarvis can propose improvements and execute bounded work only through approved authorization paths. It must expose why an action is permitted, which policy/profile revision applies and what evidence establishes completion.

## 10. Qualification roadmap and non-claims

Contour A implementation order:
1. Registry schema and canonical contracts, without secret values.
2. Read-only Jarvis PWA and Agent/Operations projections.
3. Task Orchestrator integration with existing A0, state and fenced-lease contracts.
4. One qualified executor profile and deterministic result/evidence verification.
5. Resource Manager and per-account quota ledger integration.
6. Four-layer memory persistence, recovery and retention controls.
7. Authenticated persistent Workspace and shared filesystem qualification.
8. Independent security/governance review and full Contour A acceptance.

This is design, not runtime evidence. No registry service, four-agent team, general CLI adapter set, persistent memory subsystem, full observability UI or autonomous remediation is claimed deployed or qualified. Existing Contour A gates remain unchanged; Contour B stays deferred.

## 11. Binding invariants

- Jarvis is the sole user-facing operating system, not the root of trust.
- Three planes are separated by authenticated, versioned contracts.
- Registry metadata is not credential material and does not prove route health.
- Logical roles do not imply provider/account/quota independence.
- Execution is immutable-SHA-bound, capability-scoped, budgeted and fenced.
- Four memory layers have distinct owners and retention policies.
- Quality Gate and acceptance authority are independent from implementers.
- No paid fallback, secret exposure, controller bypass or Contour B before Contour A ACCEPTED.
