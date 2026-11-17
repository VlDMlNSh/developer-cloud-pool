# Architecture Assurance Addendum — Cloud Development Pool 1.0

**Date:** 2026-11-17  
**Status:** PROPOSED / REVIEW REQUIRED  
**Applies to:** Reference Architecture 1.0 and Contour A only  
**Parent architecture:** [Cloud Pool Reference Architecture 1.0](../architecture/CLOUD-POOL-REFERENCE-ARCHITECTURE-1.0.md)  
**Parent proposal:** [PR #120](https://github.com/VlDMlNSh/developer-cloud-pool/pull/120)  
**Immutable review baseline:** `9ebb56edd55f5015b66f7b3f17d1114d1884a492` (current PR #120 head used as the rebased baseline)

## 1. Purpose and authority

The measurable acceptance standard for claims of 10/10 architectural potential, technical elaboration and overall prospects is defined by the [Independent 10/10 Scorecard](CLOUD-POOL-10-10-INDEPENDENT-SCORECARD.md). Scores require evidence and independent review; the target is not a self-awarded rating.



This addendum closes the implementation-governance gaps identified during an independent architecture review: over-design risk, unclear minimum delivery path, component proliferation, ambiguity between planning capacity and actual capacity, and the need for objective exit criteria.

The parent Reference Architecture 1.0 remains the sole system-level normative architecture. This addendum is normative for delivery sequencing and architecture change control. It does not replace detailed protocol contracts, grant deployment authority, qualify a provider route, or accept Contour A.

If this addendum conflicts with a detailed protocol contract, stop the affected implementation and resolve the conflict through a dated ADR before changing behavior. Do not silently choose one document.

## 2. Architectural north star

Cloud Development Pool is a **governed engineering control plane with replaceable execution adapters and one user-facing Jarvis console**.

The product is not:
- a new general-purpose agent framework;
- a new IDE or browser engine;
- a universal database abstraction;
- a promise of 20 continuously available machines;
- a model gateway that decides identity, permissions, account ownership, or quota;
- a collection of independent dashboards.

The platform owns only the project-specific integration and governance that upstream tools do not provide: identity binding, capability checks, immutable task envelopes, admission, quota/account isolation, execution fencing, evidence correlation, and acceptance.

Use a mature upstream component when it meets the requirement and its license, provenance, security, operational model, resource limits, and exit path are acceptable. Build a custom component only when a written gap analysis demonstrates that no suitable component meets the requirement or that integration would weaken a required security invariant.

## 3. Minimum viable vertical slice (the implementation order)

Implementation proceeds as vertical slices that prove an end-to-end behavior. Do not create more abstractions before the current slice is executable and evidenced.

| Order | Slice | Required observable result | Must not be claimed |
|---|---|---|---|
| V0 | Contract baseline | One canonical envelope, status model, authority map, policy version and evidence schema; validators pass | Runtime capability |
| V1 | Read-only Jarvis surface | Authenticated user can view redacted task/pool status from a supported phone and desktop browser | Task submission or control authority |
| V2 | Trusted admission and durable state | One hosted transactional authority performs atomic admission, single-use approval, idempotency and read-back; replay/rollback/concurrency tests pass | Worker execution |
| V3 | One bounded no-secret worker | One allowlisted task checks out exact target SHA, executes a deterministic operation, emits digest-bound evidence and cleans up | Provider/model route |
| V4 | Durable supervisor and recovery | Lease fencing, outbox/inbox, ambiguous dispatch reconciliation, crash and stale-worker tests pass | Exactly-once external side effects |
| V5 | One real free provider route | Exact account/issuer/quota domain is independently evidenced; one representative task succeeds under hard budget and no fallback | Other accounts or models |
| V6 | Persistent workspace (separate gate) | Authorized host, identity-aware ingress, persistent filesystem, isolated worktrees and restore drill pass | GitHub runner persistence |
| V7 | Independent Contour A acceptance | All mandatory acceptance gates pass with independent review and published evidence | Contour B authorization unless acceptance is formally recorded |

The order is a dependency order, not a requirement to deploy all components at once. A later slice may be researched in parallel, but it must not become a production dependency or bypass an earlier gate.

### 3.1 First end-to-end proof

The first execution proof must be deliberately small:
1. A human submits one typed task against an immutable repository SHA.
2. Server-side policy validates identity, capability, target, allowed paths and approval.
3. One transactional authority commits admission and outbox intent atomically.
4. One supervisor claims the admitted attempt with a fenced lease.
5. One approved controller starts one allowlisted ephemeral worker.
6. Worker performs one deterministic, no-secret operation.
7. Evidence publisher records exact run/job IDs, checked-out SHA, output digest and test result.
8. Independent verifier checks ancestry, paths, digest and result.
9. Jarvis displays the verified status without acquiring execution authority.

Only after this slice passes should model/provider execution be added. This avoids conflating task orchestration defects with model access, account quotas, or prompt behavior.

## 4. Component selection and anti-proliferation rules

### 4.1 Required decision record before adoption

Every new runtime, framework, database, gateway, IDE, browser automation tool or service must have a short component decision record containing:
- requirement and measurable acceptance test;
- upstream repository and immutable release/commit;
- license and any network-use obligations;
- maintenance and security posture;
- supported OS/runtime and compatibility;
- permissions, isolation and network-egress behavior;
- secrets/data handling and telemetry;
- actual free-tier limits and risk of involuntary billing;
- dependency and operational footprint;
- evidence that the component is needed now;
- replacement, migration and exit path;
- selected / rejected / deferred decision and rationale.

A popularity signal or feature list is not evidence of suitability. Re-evaluate terms and quotas at deployment time; never assume a free tier remains free.

### 4.2 Current component disposition

| Component | Architectural role | Current disposition | Selection boundary |
|---|---|---|---|
| GitHub Actions hosted runners | Ephemeral bounded workers | Selected for first cloud worker path; qualification incomplete | Not a persistent host, database, or guaranteed 20-slot fleet |
| Jarvis Web | Single user experience | Required target; not deployed as authenticated control plane | UI only; server authorizes every operation |
| Hono or equivalent | Thin API adapter | Candidate, not mandatory | Adopt only if it reduces integration cost without duplicating policy |
| Cloudflare D1 | Transactional state candidate | Preferred candidate, NOT production-selected | One state authority only; hosted free-tier, identity, atomicity, backup/restore and security must pass |
| PostgreSQL | Alternative transactional store | Not co-equal with D1 | May replace D1 only through ADR and complete state-boundary migration |
| code-server / Open VSX | Persistent browser IDE | Candidate for separate workspace gate | Authentication on, loopback binding behind qualified ingress; license and marketplace compatibility reviewed |
| Git worktrees / containers | Per-task workspace isolation | Preferred primitives | Single-writer fencing and path isolation still required |
| Playwright | Deterministic browser tests | Preferred candidate where compatible | Test automation, not an autonomous agent or authority |
| LangGraph / OpenHands / LiteLLM | Optional upstream candidates | Evaluation only; not required for first release | No adoption without a demonstrated gap and component decision record |
| Claude Code / FCC / ECC, Codex, Gemini | Execution adapters/toolchains | Individually qualified profiles only | Installation smoke is not provider route or task qualification; Gemini controller-only |

This table does not authorize installation, account use, provider calls, network access, or infrastructure provisioning.

### 4.3 No premature abstraction

Do not implement a generic plugin SDK, universal model router, multi-database layer, dynamic agent marketplace, or distributed cluster manager for the first release. Implement only the adapter interfaces required by the first qualified profiles. Add generality after at least two real, independently qualified implementations demonstrate the same stable interface requirement.

## 5. Capacity and scheduling contract

The phrase “20 slots” is a planning ceiling only. It is not a service-level objective, reserved capacity, number of machines, or promise of simultaneous execution.

The scheduler must:
- select from qualified profiles by declared capabilities, trust level, OS/runtime, resource budget, policy, route and account quota;
- treat GitHub account/repository concurrency and hosted-runner availability as external dynamic constraints;
- apply bounded queue depth, per-profile concurrency and per-account concurrency;
- expose queued, running, throttled, blocked and failed states distinctly;
- never launch a worker solely because a slot appears free;
- never split one account's quota across keys or infer distinct accounts from key count;
- preserve the no-paid-fallback rule under capacity pressure.

Capacity must be measured from actual provider/platform evidence at qualification time. Do not publish fixed throughput estimates without a workload, region, quota and runner-class measurement.

## 6. State and workspace: explicit ownership

There are three separate persistence concerns:

1. **Control-plane transactional state:** one database owns mutable admission, task/attempt, lease, outbox/inbox, quota reservation and reconciliation state.
2. **Repository and durable engineering files:** Git is authoritative for source and reviewed documentation; a persistent workspace is a separate optional service with its own storage and backup/restore gate.
3. **Execution evidence:** immutable run metadata, artifact digests, test results and review records are evidence; they are not a second mutable task database.

No state is silently dual-written to D1 and PostgreSQL. No GitHub Issue label or Actions concurrency group is treated as a distributed lock. No ephemeral runner filesystem is treated as durable. No workspace filesystem is shared for concurrent writes without per-task isolation and single-writer fencing.

## 7. Security qualification is a deployment gate, not a design statement

A documented control is not evidence that the control is enforced. Each production profile must prove, at minimum:
- least-privilege workflow/job permissions and no provider secrets in generic workers;
- trusted checkout and immutable action/tool pins;
- untrusted input separation from privileged jobs;
- explicit network egress policy or a documented residual-risk decision that prohibits secrets and hostile code in that environment;
- credential/account isolation and disabled key cycling/provider/model/paid fallback;
- redaction of logs, artifacts and task metadata;
- path traversal and symlink escape rejection;
- cleanup and absence of residual processes/listeners;
- provenance and digest verification;
- adversarial tests for replay, duplicate delivery, stale lease, ambiguous dispatch and revoked route.

Where GitHub-hosted runners cannot enforce a control (for example, a strict egress firewall at the runner boundary), record the residual risk and compensate by not injecting secrets and by restricting the workload. Never describe a best-effort destination allowlist as a hard network sandbox.

## 8. Status vocabulary and evidence threshold

Use these statuses consistently:
- **PLANNED:** accepted design intent; no implementation evidence.
- **IMPLEMENTED:** source/configuration exists; not necessarily executed.
- **NOT RUN:** execution was deliberately not attempted.
- **NOT VERIFIED:** evidence unavailable, stale, incomplete or not tied to exact target.
- **VERIFIED:** a specified check passed on an identified immutable target; scope is limited to that check.
- **QUALIFIED:** representative end-to-end and adversarial tests pass for a named profile, account, host or service with current evidence and independent review.
- **ACCEPTED:** all mandatory Contour A gates have been independently reviewed and formally accepted.
- **BLOCKED / FAILED:** a known prerequisite or test is not satisfied.

Every status claim must name its subject, exact SHA or revision, evidence URL/digest, timestamp, test scope and reviewer. CI PASS applies only to the checks that ran. A successful installer smoke cannot qualify a provider route. A successful route call cannot qualify durable state or the whole contour.

## 9. Contour A acceptance — conjunctive, no waivers by implication

Contour A is ACCEPTED only when every gate below is independently evidenced:

- [ ] Authenticated Jarvis Web is usable from phone and desktop; authorization is enforced server-side.
- [ ] One canonical transactional state authority is deployed on an approved genuinely free tier; concurrency, replay, rollback, restore and security tests pass.
- [ ] Atomic admission consumes a single-use owner approval bound to the exact task envelope.
- [ ] Durable Supervisor leases are fenced; duplicate delivery, stale workers, crash and ambiguous dispatch are safely reconciled.
- [ ] At least one real allowlisted worker executes an exact-SHA task, emits verifiable evidence and cleans up.
- [ ] At least one genuinely free provider route is qualified for an exact provider/model/issuer/account/quota domain, with observed quota and hard budget; no silent fallback.
- [ ] Provider credentials are isolated from generic workers, untrusted PRs, browser sessions, logs and artifacts.
- [ ] Required security controls and residual risks are independently reviewed.
- [ ] Persistent Engineering Workspace: if it remains in the accepted Contour A scope, its authorized host, ingress, durable storage, shared filesystem behavior, isolation and backup/restore must pass. If excluded from the initial Contour A acceptance boundary, that exclusion must be explicitly approved and recorded; it cannot be represented as deployed.
- [ ] Evidence package is published and linked from Context Window; exact revisions and test artifacts are reproducible.
- [ ] Governance has meaningful independent review and required status checks; an active ruleset with zero required approvals and no required checks is insufficient.
- [ ] Owner records the formal acceptance decision.

All gates are conjunctive. A green CI badge, merged documentation, successful local proof, or owner enthusiasm cannot substitute for missing evidence. Contour B remains deferred until formal Contour A acceptance.

## 10. Architecture change control

Any proposed new component, database, execution route, authority, persistent service or change to the task lifecycle must include:
1. problem statement and evidence that the current architecture cannot meet it;
2. alternatives, including doing nothing or reusing an existing component;
3. security, licensing, free-tier, operational and migration impact;
4. ownership of state and authority before/after the change;
5. compatibility and rollback plan;
6. tests and acceptance evidence;
7. dated ADR and update to the canonical architecture, Context Window and checkpoint.

Historical documents remain immutable evidence. Add a supersession notice rather than silently rewriting historical decisions. The canonical reference architecture and its addenda must not contradict one another; if they do, the implementation is blocked pending an ADR.

## 11. Known unresolved decisions and blockers (2026-11-17)

These are deliberately explicit; architecture completeness does not mean these prerequisites are already satisfied.

| Item | Status | Required evidence / resolution |
|---|---|---|
| PR #120 architecture consolidation | OPEN / DRAFT / UNMERGED at review baseline | Independent review, exact-head CI, merge under governance |
| Default ruleset | ACTIVE but weak: zero required approvals and no required checks observed | Owner-approved governance change; re-read exact rules |
| Hosted transactional state | NOT QUALIFIED | One selected service, identity, free-tier, concurrency, restore and security evidence |
| Durable supervisor | NOT QUALIFIED | Hosted fenced lease, outbox/inbox, recovery and adversarial evidence |
| Provider route | NOT QUALIFIED | Real free account, issuer, quota, cost cap and no-fallback proof |
| Jarvis Web | NOT DEPLOYED as authenticated live control plane | Authenticated deployment and phone/desktop verification |
| Persistent Workspace | BLOCKED; see Issue #118 | Authorized host, Access ingress, storage, isolation and restore proof |
| Claude Code/FCC/ECC | Installation/runtime mock evidence only; no real provider task | License review, one-account FCC profile, disabled fallback, free route and real task qualification |
| Gemini | NOT RUN unless approved controller gates pass | Exact controller input, trusted admission, security gates and correlated evidence |

## 12. Immediate next engineering step

Do not add another architecture layer. The next implementation pass must select and qualify the **smallest no-secret vertical slice** from V1–V4 using the current repository contracts. Before implementation, re-read current default HEAD, open PRs, exact-head CI and governance. Bind the pass to one immutable SHA, use an isolated branch, and publish exact test evidence. If hosted state or governance prerequisites are unavailable, report BLOCKED with the precise missing evidence rather than simulating a successful deployment.

---
This addendum is a proposal until reviewed and merged. It does not deploy services, enable dispatch, call providers, read secrets, qualify any route, or accept Contour A.
