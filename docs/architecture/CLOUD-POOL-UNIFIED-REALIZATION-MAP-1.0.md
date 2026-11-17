# Cloud Development Pool — Unified Realization Map 1.0

**Status:** PROPOSED IN PR / REVIEW REQUIRED / NOT ACCEPTED  
**Date:** 2026-11-17  
**Scope:** Contour A only  
**Parent:** [Reference Architecture 1.0](CLOUD-POOL-REFERENCE-ARCHITECTURE-1.0.md)  
**Delivery controls:** [Architecture Assurance Addendum](CLOUD-POOL-ARCHITECTURE-ASSURANCE-ADDENDUM-2026-11-17.md)  
**Evaluation standard:** [Independent 10/10 Scorecard](CLOUD-POOL-10-10-INDEPENDENT-SCORECARD.md)  
**Immutable integration parent:** `b3b5cb3724139939342335ea95c46cc717485f16` (PR #120 head at pass start)

## 1. Architectural decision

Preserve the existing architecture and its sound security invariants. Do not restart the project. Change the integration method and delivery order.

Cloud Development Pool is a **governed engineering operating environment**: one user experience coordinates specialist tools, while the platform itself owns identity, policy, admission, resource allocation, supervision, durable state, evidence and acceptance. AI models are replaceable execution resources, not the platform's authority.

The six architecture layers are logical boundaries, not six separately deployed services:

1. Experience — one responsive Jarvis Web for phone and desktop.
2. Control and orchestration — one compact modular-monolith Control Plane.
3. Governance — identity, capabilities, approvals, routes, account/quota policy and audit.
4. Execution — replaceable, individually qualified adapters and ephemeral workers.
5. Workspace — separately authorized persistent Engineering Workspace.
6. State and evidence — one operational transaction authority, project history and immutable evidence.

## 2. Invariants retained

- GitHub is the source of truth for reviewed source, documentation, PRs and immutable revisions.
- Jarvis is the only user-facing console; it never grants itself authority.
- Control Plane and Execution Plane remain separate trust zones.
- Fail-closed authorization; unknown identity, capability, route, quota or SHA means deny.
- Atomic admission, single-use approval, idempotency, fenced leases, outbox/inbox and ambiguity reconciliation are mandatory before production dispatch.
- Every task is bound to an immutable target SHA, policy revision, task envelope, execution profile and attempt identity.
- Provider, model, issuer, account, credential reference and quota domain remain distinct. Key count is not account count.
- No paid fallback, no cross-account key cycling and no provider secrets in generic workers.
- Gemini remains controller-only through the approved `.github/workflows/gemini-batch-dispatch-controller.yml`; this document does not authorize dispatch.
- Independent verification and formal Contour A acceptance precede Contour B.

## 3. One canonical integration route

`Jarvis → Experience API → Control Plane identity/policy/admission → one transactional state authority + outbox → capability Scheduler/Supervisor → approved dispatch boundary → isolated worker adapter → evidence publisher/verifier → GitHub + read projection → Jarvis`

Planner, Policy, Admission, Registry, Quota, Scheduler, Supervisor, Outbox, Projection and Recovery remain distinct logical responsibilities with testable contracts. They do **not** become separate network services by default. Start with a modular monolith and extract a service only when measured scale, independent deployment, fault isolation or a hard trust boundary demonstrates the need.

### Authority boundaries

| Component | Owns | Must never own |
|---|---|---|
| Jarvis | User intent, plan presentation, approval UX, status/evidence view | Identity authority, policy override, direct worker dispatch |
| Experience API | Session authentication, typed API, redacted projections | Durable leases, provider secrets |
| Control Plane | Policy decisions, admission requests, route/profile eligibility | Arbitrary task execution |
| Transactional state | Mutable task/attempt/lease/outbox/approval/quota-reservation state | Git history or project files |
| Scheduler/Supervisor | Profile matching, fenced claims, lifecycle and reconciliation | Owner approval or authority escalation |
| Worker adapter | One bounded authorized task | Policy, quota, route or approval changes |
| Evidence verifier | SHA ancestry, path/digest/test/provenance checks | Self-acceptance of its own output |

## 4. Three persistence domains

| Domain | Authoritative store | Data |
|---|---|---|
| Operational state | Exactly one selected transactional DB | Tasks, attempts, approvals, leases, fencing generations, outbox/inbox, quota reservations, recovery |
| Project and Workspace state | GitHub for source/docs; separately qualified persistent storage for working files | Commits, branches, PRs, worktrees, project files, snapshots and backups |
| Evidence | Append-only/digest-bound evidence and artifact records | Target/checkout SHA, run/job IDs, tool pins, logs, test reports, digests, reviews and acceptance |

D1 remains the preferred candidate from existing proofs, not a production selection. PostgreSQL remains an alternative selected only by ADR and full migration. Do not dual-write two stores as co-equal authorities. GitHub Issues, labels, Actions artifacts and concurrency groups are not distributed locks. Ephemeral runner filesystems are not durable storage.

## 5. Execution Pool is not Engineering Workspace

**Cloud Execution Pool:** ephemeral GitHub-hosted jobs, one bounded task per isolated runner. GitHub concurrency is dynamic and quota-bound. “20 slots” is a planning ceiling, not 20 machines, reserved concurrency or an SLA.

**Engineering Workspace:** a separate persistent service/host with durable files, Git worktrees, terminal, browser IDE and optional SSH/desktop IDE access. It requires owner-authorized host identity, qualified ingress, durable storage, per-task isolation, single-writer fencing and a tested backup/restore path. It is not simulated by Actions runners.

Issue #118's last recorded evidence identifies missing authorized host, Access/Tunnel, storage and restore proof. Workspace is NOT VERIFIED/BLOCKED; no deployment is authorized by this map. It remains a final Contour A gate while in scope.

## 6. Capability-based dynamic scheduling

Do not allocate fixed numbered agent slots. Scheduler selects a **qualified execution profile** by capabilities, trust tier, supported runtime/OS, repository and path scope, resource limits, provider route/account quota, concurrency and policy.

Each profile revision must declare: immutable tool pins; capabilities; permitted operations; input classification; isolation class; network policy/residual risk; resource/time limits; account/quota binding where applicable; secret policy; output schema; cleanup contract; qualification evidence and revocation state.

Claude Code, Codex CLI, Gemini, agent-browser, Playwright, research, build/test and security workers are candidate profile families, not claims of availability or qualification. Three independent Gemini agents mean three separate task envelopes, contexts, permissions and evidence chains—not three calls sharing one mutable context.

## 7. One Jarvis application

One responsive application and API with coherent surfaces:

- **Chat:** intent capture and typed task proposal.
- **Agents:** capabilities, qualification and availability.
- **Tasks:** queue, attempts, progress, blocked reasons and history.
- **Workspace:** same persistent files, Git, terminal and IDE.
- **Models:** redacted provider/model/account references, route and quota evidence.
- **Artifacts:** diffs, tests, manifests and output digests.
- **Infrastructure:** capacity, queue and health.
- **Security & Audit:** approvals, capabilities, policy decisions and provenance.

These are sections of one application, not eight products or vendor-specific dashboards. Hidden UI controls are not security; every mutation is authorized server-side.

## 8. Reuse mature tools, do not recreate them

Prefer upstream projects when a measured requirement exists. Before adoption, record immutable upstream revision, license, provenance, maintenance/security posture, compatibility, permissions, egress, secrets/telemetry, free-tier/billing exposure, footprint, test fit and exit path.

| Component | Intended role | Decision boundary |
|---|---|---|
| Claude Code | Specialist coding executor | Candidate; install/FCC smoke is not a real provider-backed task |
| Codex CLI | Independent coding/testing executor | Candidate; qualification required |
| agent-browser | Browser automation | Reuse candidate; browser and security qualification required |
| Playwright | Deterministic UI tests | QA primitive, not an authority |
| Hono | Thin API | Candidate only if it reduces integration cost |
| LangGraph | Complex durable graph orchestration | Defer until first vertical slice demonstrates need |
| code-server/Open VSX | Browser IDE | Separate Workspace gate; auth and license review required |
| Git worktrees/containers | Per-task isolation | Preferred primitives; fencing still required |
| D1 | Transactional state | Preferred candidate, not production-selected |
| PostgreSQL | Alternative state store | Not co-equal with D1 |

No generic plugin SDK, universal model router, Kubernetes cluster, multi-database abstraction or new orchestration framework until an actual gap is demonstrated.

## 9. Security qualification gates

Before production executor use, prove or explicitly bound:
- runner network egress; do not describe GitHub-hosted runner networking as a hard sandbox unless enforceable isolation is evidenced;
- no secrets or hostile untrusted code in environments without enforceable isolation;
- trusted minimal PATH; reject writable/untrusted PATH entries and test shadowing, symlink and executable substitution;
- installer and dependency provenance; version pinning alone is not a cryptographic integrity proof;
- immutable Actions/tool/source pins, least-privilege permissions and trusted checkout;
- path traversal/symlink escape rejection, cleanup, bounded resources and redacted artifacts;
- replay, duplicate delivery, stale lease, revoked route and ambiguous dispatch adversarial tests;
- independent reviewer who did not author the evaluated change.

PR #116 records useful no-secret installation and FCC loopback lifecycle evidence on earlier exact heads. It does not qualify real Claude task execution, a free provider route, account/quota identity, production egress, installer integrity or Contour A. Re-read the current PR head and exact-head runs before relying on those results.

## 10. Delivery sequence — evidence before abstraction

| Stage | Deliverable | Exit evidence |
|---|---|---|
| S0 | One canonical architecture, task envelope, status/authority model and validator | Contradiction review and exact-SHA documentation checks |
| S1 | Authenticated read-only Jarvis status/task projection | Server-side auth tests, redaction tests, phone/desktop browser evidence |
| S2 | Trusted admission and one hosted transactional state authority | Atomicity, replay, concurrency, rollback and restore tests |
| S3 | One deterministic no-secret worker | Exact SHA, run/job provenance, digest, tests and cleanup |
| S4 | Durable Supervisor and recovery | Fencing, crash, stale worker, duplicate and ambiguous-dispatch tests |
| S5 | One real free provider route | Exact provider/model/issuer/account/quota evidence, bounded real task, no fallback |
| S6 | Persistent Engineering Workspace | Authorized host, ingress, shared filesystem, isolation and restore drill |
| S7 | Parallel execution | Independent task envelopes, concurrency, isolation, quota and recovery evidence |
| S8 | Contour A acceptance | All mandatory gates, independent review and formal owner acceptance |

A new architecture component is accepted only when it improves an observable slice or closes a documented risk. Each engineering pass must increase executable capability or publish inspectable test evidence. A document-only pass is permitted to remove a concrete integration/governance blocker, not as the default mode of progress.

## 11. Repository integration discipline

There must be one accepted system architecture, one live Context Window and one primary integration route.

- `Основной`: accepted implementation only.
- One `integration/*` branch: bounded near-term stack against one immutable base.
- Short-lived `feature/*` branches: one independently testable change.
- Architecture alternatives are ADRs or historical proposals, not competing canonical documents.
- Every dependent PR records parent PR, immutable parent SHA and rebase condition.
- When a parent moves, child PRs must be rebased/regenerated before review; stale base SHA or `mergeable=false` blocks integration.
- Triage open Draft PRs into integrate, cherry-pick/migrate, supersede/close or retain as historical evidence. Do not leave parallel proposals with equal authority.
- Do not merge documentation stacks solely because mergeable=true. Require exact-head CI, independent review, provenance and effective governance.

### Current integration snapshot (2026-11-17)

| PR | Observed state | Finding |
|---|---|---|
| #120 | OPEN/DRAFT; head `b3b5cb3724139939342335ea95c46cc717485f16`; mergeable=true | Parent architecture candidate |
| #122 | OPEN/DRAFT; head `4f5b2e9d5b7c434dcbd18d056fbaea6ee3f4b406`; base `435a1838f7e22f0f5ec08611bd24608066fd5d79`; mergeable=false | Stale dependent stack |
| #123 | OPEN/DRAFT; head `da9812cd670d92e014f9f7e3c087b0a253f7005f`; base `35b47e0e0fd576dc0552934f733548a05cbcb435`; mergeable=false | Stale dependent stack |
| #116 | OPEN/DRAFT; head `caa4a9b80f598d08087a6fd5bedfb7d90c08e5bc` | Bounded toolchain evidence; real provider route NOT QUALIFIED |

Combined status reads for PR #120 and #123 returned zero contexts; that is NOT VERIFIED, not CI success. Current ruleset details must be re-read before merge; the earlier observed ruleset had zero required approvals and no required status checks.

## 12. Context Window freshness contract

The Context Window is the single recovery point, not a diary of unlabelled snapshots. Its top section must contain:
- refreshed timestamp and default branch HEAD;
- current branch and PR heads/bases, mergeability and exact-head CI state;
- open blocker Issues and current governance read;
- current execution/Workspace/Jarvis/provider qualification states;
- immutable evidence links, limitations and next action.

Older snapshots remain below as historical evidence and must be explicitly marked superseded when contradicted. A freshness validator should fail or warn when the Context Window's recorded default HEAD, latest checkpoint or PR references do not match live GitHub metadata. Empty API results are NOT VERIFIED. Update the Context Window and checkpoint in the same integration pass as architecture changes.

## 13. Evidence-based quality scoring

Do not lower the score of the underlying architecture merely because its implementation is incomplete. Score separately:
- architectural potential and internal coherence;
- technical elaboration and implementability;
- actual component readiness;
- operational readiness;
- overall prospects.

A high design score requires coherent authority boundaries, state ownership, failure semantics and a realistic implementation path. A high implementation score requires code and exact-head tests. A high operational score requires live authenticated deployment, real worker execution, durable state/recovery, a real free route and Workspace evidence. Docs-only changes cannot raise runtime readiness. Missing evidence is NOT VERIFIED and must not be represented as success. A 10/10 is a conclusion from independent evidence, not a target label.

## 14. Contour A acceptance remains conjunctive

Contour A is ACCEPTED only after authenticated Jarvis; one hosted transactional authority; trusted atomic admission; durable fenced Supervisor/recovery; one real allowlisted worker; one real free provider route with account/quota proof and no fallback; secret isolation; independent security/governance review; persistent Workspace and restore if it remains in scope; reproducible evidence; effective branch governance; and a recorded owner acceptance decision. Until then: **Contour A NOT ACCEPTED; Contour B DEFERRED.**

---
This map is a proposed subordinate implementation baseline. It does not deploy services, qualify profiles, enable dispatch, read secrets, call providers or accept Contour A.
