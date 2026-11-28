# Platform Intelligence & Engineering Optimization Register

Date: 2026-11-28  
Scope: Cloud Development Pool / Contour A. This register does not authorize Contour B, production changes, paid services, provider dispatch or new credentials.

## Operating rule

Every `/next` includes a bounded Platform Intelligence & Engineering Optimization workstream alongside the implementation work:

1. **Discover**: scan relevant OSS releases, security advisories, project activity and architecture patterns. Prefer primary GitHub repositories, release notes, official docs and advisories.
2. **Filter**: assess problem fit, maintenance/activity, license, security posture, dependency footprint, deployment/compute cost, data handling, provider lock-in and migration cost.
3. **Decide**: record exactly one disposition: `REUSE`, `ADAPT`, `BUILD`, `PILOT`, `DEFER`, or `REJECT`.
4. **Prove**: prototype only behind a bounded branch/feature gate; compare against a baseline; run tests, security checks and resource measurements.
5. **Integrate**: update architecture contracts, dependency inventory/SBOM, threat model, Context Window, checkpoint and decision log. Pin exact versions/digests.
6. **Revisit**: re-evaluate prior decisions when upstream releases, CVEs, license changes, workload data or platform constraints change.

Popularity/stars are discovery signals, not approval. A project is not "top" solely because it is trending. No new runtime dependency is added without a concrete failing requirement and a measured benefit.

## Mandatory evidence card for every candidate

- Repository URL and immutable commit/release inspected
- License and transitive/runtime dependency footprint
- Latest release and recent commit/maintainer activity
- Security policy, advisories, signing/provenance and CI posture
- Fit to an explicit Cloud Pool requirement
- Data flows, secret custody, trust boundaries and privilege needs
- Free-tier/hosting requirements and recurring cost
- Compatibility with current contracts, Node/Workers/D1 and GitHub Actions
- Benchmark hypothesis, baseline, acceptance threshold and rollback
- Disposition, owner, date, target SHA and evidence links

If a field is unknown, mark it `NOT VERIFIED`; do not infer.

## 2026-11-28 candidate review

| Project | Useful capability | License / activity evidence | Fit and risk | Decision |
|---|---|---|---|---|
| [LangGraph](https://github.com/langchain-ai/langgraph) | Stateful graph workflows, checkpointing, human-in-the-loop | MIT; GitHub repository active, 45k+ stars in current repository snapshot | Strong conceptual fit for recoverable agent workflows, but adopting the runtime now duplicates the D1 task/receipt/lease state machine and expands runtime/dependency surface | **ADAPT concepts; DEFER runtime** |
| [Temporal Python SDK](https://github.com/temporalio/sdk-python) | Durable long-running workflows and activities | MIT; repository describes fault-tolerant durable orchestration; SDK changelog shows ongoing 2026 work | Technically strong for retries/recovery, but requires a Temporal service/operational model and risks a second source of task truth beside D1 | **DEFER; benchmark only if D1 workflow limits are demonstrated** |
| [Dagger](https://github.com/dagger/dagger) | Reproducible containerized CI, content-addressed caching, tracing | Apache-2.0; active public repository, current README documents incremental execution and OpenTelemetry spans | Could improve repeatability and cache behavior, but requires Linux container runtime and adds a second CI abstraction | **PILOT one non-critical CI job only after baseline proves need** |
| [Pydantic AI](https://github.com/pydantic/pydantic-ai) | Typed model-agnostic agent interfaces, tools and structured outputs | MIT; current releases page shows v2.75.0 dated 2026-11-25 | Useful for a future Python executor, but current Cloud Pool proof is Node/Workers; adding Python now does not solve controller-to-D1 gap | **DEFER; reuse schema/contract ideas** |
| [OpenTelemetry Collector](https://github.com/open-telemetry/opentelemetry-collector) | Vendor-neutral telemetry ingest/process/export | Apache-2.0; active project; official repo documents vendor-neutral collector | High strategic value for queue, worker, model and CI observability; running a collector adds service cost and operational work | **ADAPT semantic conventions and trace model first; runtime DEFER** |
| [LiteLLM](https://github.com/BerriAI/litellm) | Unified model gateway, routing, usage and audit | Active release stream; v1.108.20 LTS published 2026-11-27; security page documents release verification and scanner controls | Relevant to model routing, but gateway is credential-bearing critical infrastructure and adds another auth/routing plane; paid fallback remains prohibited | **REUSE routing/usage patterns; DEFER deployment pending threat model and route qualification** |

### Immediate architectural conclusions

1. **Do not replace the current D1 state machine with an agent framework.** First complete and qualify the existing immutable task envelope, admission, lease/fencing, receipt, retry and reconciliation chain.
2. **Keep Jarvis as policy coordinator, not an omnipotent executor.** It decomposes work, creates scoped task envelopes, selects qualified routes and evaluates evidence. Executors receive only task-scoped capabilities and isolated worktrees/sandboxes.
3. **Persist-before-dispatch remains invariant.** No worker starts without a durable task/attempt/lease record. No result is accepted without artifact digest, target SHA and independent verification.
4. **Separate control plane from data plane.** Workers/D1 handle thin policy, identity, admission and state. Model inference and builds run on qualified isolated executors; do not push inference into Workers CPU limits.
5. **One source of truth for state.** D1 remains the current candidate ledger. GitHub is source for code, workflow provenance, reviews and CI evidence. Do not add Redis/Temporal/another database until measured constraints justify it.
6. **Provider-neutral routing contract.** Route identity includes provider, account/issuer, model/version, quota domain, cost class, capability, privacy class and qualification evidence. Credential values remain outside the registry. No silent paid fallback.
7. **Evidence-first observability.** Add stable correlation IDs across task → attempt → lease → model request → artifact → review. Start with structured event fields and CI summaries; later export OTel spans/metrics if a free, qualified sink exists.
8. **Independent quality gates.** Implementation agent cannot approve its own work. Test/contract and security/provenance roles receive separate task envelopes and no inherited write credentials.
9. **CI optimization must be measured.** Establish queue wait, startup, dependency install, test duration, cache hit, retry, failure and artifact upload baselines before adopting Dagger or adding parallelism.
10. **Docs are contracts, not aspirations.** Mark each capability as implemented/tested/qualified/accepted separately. No plan document upgrades implementation status.

## Platform-wide optimization backlog (Contour A only)

| Priority | Workstream | Proposed change | Measurable acceptance |
|---|---|---|---|
| P0 | Provenance and controller | Compose issue_comment → API collector → exact Envelope/digest → Workers verifier → local D1 attested adapter | Same serialized payload crosses all layers; tamper/replay/rerun tests pass; dispatch remains false |
| P0 | State and recovery | Complete lease fencing, idempotency, persist-before-dispatch, ambiguous outcome reconciliation | Fault-injection tests prove no duplicate attempts or lost committed state |
| P0 | Security boundaries | Prove legacy adapter unreachable from production entrypoints; least-privilege workflow permissions; independent review | Static import-graph test, adversarial tests, reviewer evidence |
| P1 | Jarvis orchestration | Task DAG/dependency edges, role-scoped envelopes, bounded retries, checkpoint/artifact manifest | Reproducible task replay and explicit state transitions |
| P1 | Model gateway | Provider/account/model/quota registry, privacy class, cost class, circuit breaker, 429 handling, paid-fallback deny | Contract tests for quota exhaustion, invalid key, outage, model withdrawal and cross-account isolation |
| P1 | Observability | Correlation IDs, structured events, queue/test/model latency, error and quota metrics | Baseline dashboard/report generated from real CI/task data |
| P1 | CI efficiency | Parallelize independent jobs, lockfile caching, path filters, artifact digest, deterministic test split | Improvement against measured baseline without reducing required checks |
| P2 | Executor isolation | Disposable worktrees/containers, scoped filesystem/network, no shared credentials, bounded resource/time | Isolation tests and verified teardown/recovery |
| P2 | OSS intelligence | Automated weekly metadata/release/security scan feeding human-reviewed candidate cards | No auto-merge; each candidate has license, activity, security and cost evidence |
| P2 | Web UI | Responsive remote task console with task state, logs, artifacts, approvals and audit history | Verified phone/desktop flows and authorization tests |
| Deferred | MediaHub OS / Contour B | Media classification, mobile app, local assistant, media generation | Not started until Contour A ACCEPTED |

## Governance and adoption gates

- Reuse-first and license review before code import.
- Pin dependencies to exact versions; pin GitHub Actions to immutable commit SHAs.
- Record SBOM/dependency diff and scan results for every added runtime dependency.
- Threat-model any component that can see provider credentials, source code, task state or network access.
- Verify release signatures/provenance where supplied; do not equate a GitHub verified tag with a full security audit.
- No credentials in logs, artifacts, task prompts or client code.
- No paid service, paid API fallback or account mixing.
- No production mutation without explicit authorization.
- Gemini/Claude/provider dispatch only through approved controller and verified account/quota/privacy gates.
- If qualification cannot be completed in the current pass, mark `NOT RUN` or `NOT VERIFIED` and keep the route disabled.

## Per-/next checklist

- [ ] Read Context Window and previous checkpoint; reconcile current HEAD/refs/PRs/CI/governance.
- [ ] Inspect relevant OSS releases/advisories and update candidate register only when there is a material change.
- [ ] Select one bounded engineering task on Contour A critical path.
- [ ] Freeze target SHA, scope, non-goals, risk and DoD.
- [ ] Record Reuse First decisions and why alternatives are deferred/rejected.
- [ ] Implement one bounded pass; test exact head and clean base as applicable.
- [ ] Review diff, provenance, security and governance before merge.
- [ ] Update report, checkpoint, Context Window, metrics and next step.
- [ ] Keep Contour B deferred until Contour A is ACCEPTED.

## Sources reviewed (2026-11-28)

- LangGraph repository and MIT license: https://github.com/langchain-ai/langgraph ; https://github.com/langchain-ai/langgraph/blob/main/LICENSE
- Temporal Python SDK and changelog: https://github.com/temporalio/sdk-python ; https://temporal.io/changelog/product-area/python-sdk
- Dagger repository and Apache-2.0 license: https://github.com/dagger/dagger
- Pydantic AI repository, releases and MIT license: https://github.com/pydantic/pydantic-ai ; https://github.com/pydantic/pydantic-ai/releases ; https://github.com/pydantic/pydantic-ai/blob/main/LICENSE
- OpenTelemetry Collector repository and Apache-2.0 license: https://github.com/open-telemetry/opentelemetry-collector
- LiteLLM releases and security posture: https://github.com/BerriAI/litellm/releases ; https://www.litellm.ai/security

## Status

- OSS landscape review: COMPLETED for this bounded shortlist; not exhaustive.
- Runtime dependencies added: 0.
- Provider routes enabled: 0.
- Benchmarks of candidate projects: NOT RUN.
- Dagger pilot: NOT RUN.
- OTel runtime: NOT RUN.
- Independent security review of candidate adoption: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.


## Owner-approved daily adaptation policy — effective Pass 123 (2026-11-28)

The repository owner explicitly approved the previously proposed engineering directions and requested that technology intelligence and mature-project adaptation become a continuous, daily operating responsibility. This approval authorizes architecture evaluation, documentation, bounded non-production prototypes, tests and integration behind the existing gates. It does not authorize paid services, secret access, production mutation, credential creation, provider dispatch, executor launch, or bypass of governance.

### Daily cadence and per-request execution

- **Daily scan (calendar-day cadence):** review the strongest relevant mature OSS projects, releases, security advisories, maintainer activity, license changes and proven engineering patterns across agent orchestration, workflow durability, model routing, CI/CD, observability, auth, state, sandboxing and developer UX. Avoid repetitive broad searches when no material upstream change exists; retain a dated scan record and state what was checked.
- **Every /next:** perform a short delta scan against the last dated scan and the current critical-path task. A new conversation/request must not silently skip this workstream. If the same-day scan is still current, verify its sources and record NO MATERIAL CHANGE rather than manufacture novelty.
- **Adaptation, not collection:** for every accepted idea, identify the exact Cloud Pool contract/component it improves, choose REUSE, ADAPT, BUILD, PILOT, DEFER or REJECT, and implement one bounded improvement when safe and useful. Do not add a project merely to increase the dependency count.
- **Priority:** Contour A critical path first. Platform-wide improvements must strengthen the cloud pool, Jarvis coordination, execution reliability, security, routing, quota accounting, persistence, auditability, UI or measured developer throughput. Contour B remains prohibited until Contour A is ACCEPTED.
- **Daily deliverable:** dated candidate/decision entries, source/release identifiers, material changes, integration status, measured benefit or explicit NOT MEASURED, risks, and next revisit trigger. Update this register and Context Window/checkpoint after a material change; a no-change scan can be logged in the pass report/checkpoint without rewriting all architecture sections.

### Approved architecture directions

Owner accepts these as target directions for Contour A engineering, subject to technical proof and existing security/governance gates:

1. Jarvis is a policy coordinator and task decomposer, not an unrestricted executor. It creates bounded role-specific task envelopes and evaluates evidence.
2. Persist task, attempt, lease and authorization state before any dispatch. Results require immutable target SHA, artifact digest and independent verification.
3. Keep one authoritative candidate task/state ledger (currently D1 candidate) and keep GitHub authoritative for source, workflow provenance, reviews and CI. Add another state engine only after a measured limitation is documented.
4. Separate control plane from inference/build data plane; use isolated, disposable executors with least-privilege capabilities.
5. Adopt provider-neutral route qualification: provider, account/issuer, model/version, quota domain, cost class, capability, privacy class and evidence. Keep credential values outside registries. Paid fallback is denied.
6. Add correlation IDs and structured events across task → attempt → lease → model request → artifact → review. Establish real baselines before adopting telemetry infrastructure or CI acceleration tools.
7. Separate implementation, test/contract and security/provenance roles. Reviewers must not inherit implementation write credentials.
8. Optimize CI using observed queue/startup/install/test/cache/retry/failure/artifact timings; preserve all required checks and free-tier constraints.

### Adoption and evidence gates

A candidate is not top based on stars or social attention. Record exact repo and immutable release/commit, license, activity, security advisories/policy, provenance/signing, dependency footprint, compatibility, data flows, privilege, cost/free-tier, benchmark baseline/threshold, rollback and disposition. Unknowns are NOT VERIFIED. Pin versions and GitHub Actions SHAs. New runtime dependencies require explicit requirement, SBOM/dependency diff, vulnerability review, tests and measurable benefit. Security-sensitive or credential-bearing components require threat modeling and independent review before enablement. Pilot in a non-critical isolated path first. No auto-merge and no autonomous adoption based solely on an LLM recommendation.

### Status semantics

- DISCOVERED: candidate identified, not yet vetted.
- ASSESSED: evidence card complete enough for a disposition.
- PILOT: bounded non-production experiment approved by existing project gates.
- INTEGRATED: code/config/docs merged or present in a working branch; does not mean qualified.
- QUALIFIED: acceptance tests, security and operational evidence pass.
- ACCEPTED: only the formal Contour A acceptance state, never a synonym for a successful OSS pilot.

If a daily scan or implementation cannot run, record NOT RUN and why. If upstream evidence, free entitlement, security posture or compatibility is inaccessible, record NOT VERIFIED. Never claim a scan, benchmark or integration that was not performed.


## Daily OSS delta scan — 2026-11-28 (Pass 123)

This is the fresh delta scan performed after the owner-approved policy was recorded. Sources below include upstream GitHub release/advisory pages; no package was installed and no runtime benchmark was run.

| Candidate | Fresh primary evidence | Assessment | Decision |
|---|---|---|---|
| [Bifrost](https://github.com/maximhq/bifrost) | Official repo states Apache-2.0; official releases show Bifrost HTTP v2.6.0 (2026-11-19) and Helm chart v2.1.50 (2026-11-25). Release notes include Go/toolchain and dependency security updates. | Strong gateway alternative worth evaluating for provider routing and account/usage controls. Need inspect edition boundaries, exact dependency graph, auth/credential isolation, persistence, quota enforcement semantics, and actual free deployment footprint. Release signing observed on release page; full SBOM/provenance and independent security posture NOT VERIFIED. | **PILOT candidate only** — contract-level comparison/synthetic benchmark; no runtime integration or credentials. |
| [agentgateway](https://github.com/agentgateway/agentgateway) | Official repository identifies Apache-2.0; official v1.7.0 release page (2026-10-27) documents model catalog capability metadata, cost by service tier, per-model/user analytics, CEL policy, prompt/tool-output guards and session encryption behavior. | Strong control/policy gateway candidate for LLM + MCP/A2A traffic. Adds a Rust/Go stack, configuration complexity and potentially external guardrail data flows; does not replace our D1 task ledger or Jarvis policy coordinator. Need threat model and test exact standalone vs Kubernetes scope. | **ADAPT concepts; DEFER runtime**. Consider capability/privacy/cost metadata and fail-closed policy semantics in our route contract. |
| [LangGraph](https://github.com/langchain-ai/langgraph) | Official release page shows v1.2.24 (2026-11-20), signed GitHub release; v1.2.23 includes state propagation fixes and dependency updates. | Mature graph/checkpoint concepts remain useful; adopting runtime would duplicate D1 state/receipt/lease model and add Python runtime. | **ADAPT concepts; DEFER runtime**. |
| [LiteLLM](https://github.com/BerriAI/litellm) | Official GitHub security advisories include multiple recent issues: high-severity Azure credential parameter secret exfiltration (Nov 12), critical enterprise proxy file read/master-key exposure (Oct 27), and November 23 cross-tenant data visibility / deployment-poisoning advisories. | This materially raises the bar for a credential-bearing gateway. Even if patched versions exist, broad attack surface and repeated supply-chain/security incidents make a new deployment inappropriate for our current small, fail-closed control plane. This is not a claim that all versions/configurations are vulnerable. | **REJECT deployment for current Contour A; REUSE only protocol/usage patterns**. Revisit only after independent security assessment and strong need. |
| [Temporal Python SDK](https://github.com/temporalio/sdk-python) | Pass 122 evidence remains the current reviewed snapshot; no new primary release/advisory verification performed in this delta scan. | No new reason to introduce a second durable workflow engine beside D1. | **DEFER**. |
| [Dagger](https://github.com/dagger/dagger) | Pass 122 evidence remains current; no new primary release/advisory verification performed in this delta scan. | CI acceleration still needs our own queue/install/test/cache baseline before pilot. | **PILOT remains conditional on baseline**. |
| [OpenTelemetry Collector](https://github.com/open-telemetry/opentelemetry-collector) | Pass 122 evidence remains current; no new primary release/advisory verification performed in this delta scan. | Adopt correlation/metric semantics first; no qualified free telemetry sink demonstrated. | **ADAPT semantics; DEFER collector runtime**. |
| [Pydantic AI](https://github.com/pydantic/pydantic-ai) | Pass 122 evidence remains current; no new primary release/advisory verification performed in this delta scan. | No demonstrated Python executor requirement on current Node/Workers path. | **DEFER**. |

### Concrete architecture adaptation from this scan

- Extend route qualification to include model capability metadata (modalities/context window), actual serving service tier, per-route cost/quota domain, and user/task correlation. This is an adaptation of the useful model-catalog/analytics concepts from agentgateway, not adoption of its runtime.
- Require outbound destination allowlists and immutable provider endpoint selection; never accept caller-controlled base URLs, model-list overrides, or credential parameters. This guardrail is reinforced by the published LiteLLM SSRF/credential-exfiltration advisory history.
- Treat prompt/tool-output inspection as an explicit policy stage with privacy classification and failure mode; do not forward tool outputs to third-party guardrail services unless data flow and entitlement are approved.
- Keep the gateway behind the policy coordinator and a provider-neutral contract; it must not own task lifecycle, approval, durable execution state, or authority to dispatch by itself.

### Evidence limitations

- No candidate code was cloned, built, installed or benchmarked.
- Bifrost full SBOM, transitive dependency scan, runtime memory/CPU, free-tier suitability and enterprise feature boundaries: NOT VERIFIED.
- agentgateway complete threat model, SBOM, standalone persistence and outbound data flows: NOT VERIFIED.
- LiteLLM advisory applicability is version/configuration-specific; this scan is a deployment-risk assessment, not a forensic audit of every release.
- No new runtime dependency or provider route was added. All candidates remain unqualified.


## Pass 124 — read-only controller implementation and security-driven OSS decisions (2026-11-28)

### Reuse First and upstream delta

- **Bifrost:** prior Pass 123 PILOT candidate is superseded by **DEFER runtime/pilot**. The official GitHub security advisory index currently lists high-severity unauthenticated RCE in custom plugin HTTP path for dynamically linked builds, critical MCP stdio RCE, and high-severity SSRF deny-list gaps. Affected/fixed version ranges and exploit preconditions have not been fully verified for our intended topology. Do not install, run or expose Bifrost until an advisory-by-advisory version analysis, SBOM, build provenance, threat model and independent review are complete. This is a risk-based hold, not a claim that every release is vulnerable.
  - Primary sources: https://github.com/maximhq/bifrost/security/advisories ; https://github.com/maximhq/bifrost/security
- **agentgateway:** continue **ADAPT concepts / DEFER runtime**. Its v1.7 release documents model catalog capabilities/modalities/context window, service-tier cost accounting, per-model/user analytics and prompt guards that include tool outputs by default. Tool-output inspection can increase data sent to vendor guardrail APIs; do not enable external guardrails by default. Adopt capability/cost metadata and explicit privacy/failure-mode policy only.
  - Primary source: https://github.com/agentgateway/agentgateway/releases
- **LiteLLM:** continue **no deployment in current Contour A**; reuse only generic routing/usage patterns. Official advisories and the disclosed 2026 release-pipeline incident justify a credential-bearing gateway threat review before any reconsideration. Advisory applicability remains version/configuration-specific; no claim that every release is compromised.
  - Primary sources: https://github.com/BerriAI/litellm/security/advisories ; https://docs.litellm.ai/blog/tags/security ; https://docs.litellm.ai/blog/trail-of-bits-patch-the-planet

### Implemented: read-only owner /next controller

- Reused the existing bounded GitHub API collector and canonical API-attested Envelope v1 / digest / Workers verifier; no parallel schema, ledger or runtime dependency was introduced.
- Added `.github/workflows/next-event-controller.yml`: only `issue_comment.created`; exact Issue #96; exact `/next` body; numeric repository-owner ID checked against both comment author and sender; OWNER association; pull-request conversation comments excluded.
- Workflow permissions are limited to `contents: read`, `issues: read`, `actions: read`. No workflow_dispatch, workflow_run, workflow_call, write scope, provider or executor path.
- Checkout pins source to `github.workflow_sha` and disables persisted credentials. This keeps the controller code on the immutable workflow revision while the collector separately binds workflow bytes to `GITHUB_WORKFLOW_SHA`.
- Added `scripts/owner-next-controller.mjs` to read the event file, call the fixed-origin bounded API collector, map trusted Actions context, recompute the canonical Envelope v1 digest, and write only base64-safe outputs (serialized envelope, digest, trusted context) plus explicit false authorization flags.
- Added adversarial CLI tests for exact serialization, digest substitution, dispatch escalation, trusted-context mismatch and GitHub output injection. Pool Contract validator now executes the CLI tests and statically checks the workflow's identity/permission/pinning invariants.
- All external Actions references in the new workflow are pinned to full commit SHAs.

### Verification state

- PR #188: OPEN / DRAFT / UNMERGED, base `Основной` at `565404f84b6b86afb4dc2d8fa939341f42df6eca`; head code/test SHA `359302ea4082b36b5c5be7af4bdb03d5037daeed`; merge-result SHA `4731e2d21fde8a328ec6dbbc14791da40980f0e7`.
- Pool Contract Validation run `46170933384`, job `141058959300`: SUCCESS; workflow YAML parse and security-contract validation passed; Node tests 32/32 passed.
- Isolated D1 Ledger run 46171241176, job 141059915920: SUCCESS on merge-result 9be990c45ee6fafef45e92ff78df38830c9e01ac; 9/9 files and 139/139 tests passed. This validates the existing D1 migration/authority suite, but its fixtures do not yet consume the exact controller-produced serialized JSON/digest; that end-to-end composition remains NOT RUN.
- PR #188 formal reviews: 0; inline threads: 0; independent security review: NOT RUN.
- Controller workflow has not been invoked on the default branch; no live issue event, API collection, hosted D1, provider call, executor, dispatch, deployment or production mutation occurred.
- PR #188 is a large cumulative clean-default integration candidate carrying the D1 proof and Pass 120–124 stack. Refresh exact diff metrics from GitHub before any merge decision. Pass 124's bounded code delta from Pass 120 is five files. Keep Draft and do not merge until D1 composition, independent security review and governance gates pass.

### Next critical-path task

Feed the exact collector-produced serialized JSON and digest plus the independently mapped trusted Actions context into the Workers-native verifier and local D1 attested adapter in one integration test. Prove receipt persistence and replay readback, and prove legacy synthetic adapter imports cannot enter the production worker graph. Keep `dispatch=false`, `executionAuthorized=false`; no hosted D1 or executor.

## Daily OSS delta scan — Pass 125 (2026-11-28)

No material change to the previous security dispositions was found in this delta scan.

- **Cloudflare Workers Vitest integration** — official docs updated 2026-08-20 describe local Workers-runtime unit/integration tests, direct binding access and Miniflare execution. **REUSE** the existing pinned `@cloudflare/vitest-plugin` / Vitest / D1 harness; no new dependency or hosted database. Source: https://developers.cloudflare.com/workers/testing/vitest-integration/
- **Bifrost** — official advisories still expose high/critical issues covering custom-plugin HTTP RCE, MCP stdio RCE and SSRF deny-list gaps. **DEFER runtime** until affected/fixed version ranges, SBOM, threat model and independent review are verified. Source: https://github.com/maximhq/bifrost/security/advisories
- **agentgateway** — v1.7.0 remains the reviewed release in this scan; capability/context metadata and service-tier cost concepts remain **ADAPT**, runtime **DEFER**. Tool-output guard defaults retain a privacy/data-flow implication. Source: https://github.com/agentgateway/agentgateway/releases
- **LiteLLM** — official advisory page continues to list the Nov 12 high-severity Azure Entra credential-parameter exfiltration advisory and Oct 27 critical enterprise proxy file-read/master-key advisory. **Do not deploy** in current Contour A pending independent assessment; applicability remains version/configuration-specific. Sources: https://github.com/BerriAI/litellm/security/advisories and https://www.litellm.ai/security

No package was installed, no runtime benchmark was performed, and no runtime dependency or provider route was added.

## Pass 126 OSS and platform delta — 2026-11-28

### Reuse / adapt decisions
- **Cloudflare Workers Vitest** — **REUSE** existing pinned harness for local Workers/D1 behavior. Cloudflare recommends Workers Vitest for unit tests and its test harness for integration coverage. Do not equate Miniflare with a hardened sandbox: official docs explicitly warn against executing untrusted code directly in Miniflare. Sources: https://developers.cloudflare.com/workers/testing/vitest-integration/ and https://developers.cloudflare.com/workers/testing/
- **GitHub Actions first-party actions** — **ADAPT / DEFER exact pin migration to Pass 127**. Current pinned checkout/setup-node SHAs pass but emit Node20-targeting deprecation warnings while runners force Node24. GitHub states Node20 was removed from Actions runners on 2026-09-23. Current checkout v7 includes safer fork PR handling and dependency/security updates; setup-node v7.1.0 is a current release. Before changing the security-critical controller workflow, verify exact immutable full SHAs, signed release/provenance and input compatibility. No floating tags. Sources: https://github.blog/changelog/2026-09-23-node-20-is-no-longer-available-in-github-actions/ ; https://github.com/actions/checkout ; https://github.com/actions/setup-node/releases
- No new package, runtime, hosted service, provider or paid resource was introduced.

### Security architecture finding
Pass 125's Actions-context mapper echoed several identity/ref/run values from the API-derived envelope. Pass 126 corrected this to independently map raw webhook payload + runner environment and added adversarial tests. See `docs/reports/2026-11-28-pass126-independent-actions-provenance.md`.

### Activation constraint
GitHub's `issue_comment` workflow only triggers when the workflow file exists on the default branch. The controller file is absent from current default branch `Основной` (Contents read NOT_FOUND), so live event execution is NOT RUN until approved integration. Do not add a manual or privileged bypass. Source: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows


## Pass 127 OSS and platform delta — 2026-11-28

### First-party GitHub Actions refresh

- **actions/checkout v7.0.1 — REUSE**: immutable release commit `3d3c42e5aac5ba805825da76410c181273ba90b1`; GitHub release page marks the release immutable and its commit signature verified. Exact-commit `action.yml` declares `runs.using: node24`; `ref` and `persist-credentials` inputs are present. MIT license verified from exact release commit.
- **actions/setup-node v7.1.0 — REUSE**: immutable release commit `949feb2413d6458794dcd2491c4babbbce0c15c1`; GitHub release page marks the release immutable and its commit signature verified. Exact-commit `action.yml` declares `runs.using: node24`; `node-version` and `check-latest` inputs are present. Upstream v7 release notes state no input/output/behavior changes; MIT license verified from exact release commit.
- Controller workflow pins both actions by full SHA and sets `package-manager-cache: false`; retains `persist-credentials: false`, read-only permissions and workflow-pinned checkout.
- No new dependencies, package manifests, services, provider routes or paid resources.
- Sources: https://github.com/actions/checkout/releases ; https://github.com/actions/setup-node/releases ; https://github.com/actions/checkout ; https://github.com/actions/setup-node

### Activation contract

- Added `docs/architecture/OWNER-NEXT-ISSUE-COMMENT-ACTIVATION-CONTRACT.md` and test/validator checks. The contract records the GitHub requirement that an `issue_comment` workflow must exist on the default branch before it triggers.
- Fresh default-branch Contents read for `.github/workflows/next-event-controller.yml` remains NOT_FOUND. The tests verify policy structure/documentation but do not replace the live default-branch Contents check.
- Pass 127 exact PR merge-result `1dc7db175f4eec559053cae536536911b0117df2` is verified by both job logs: D1 140/140 PASS and Pool Contract 37/37 PASS (`POOL_CONTRACT_VALIDATION=PASS`). CI still emits Node20 deprecation warnings from separate validation workflows' legacy action pins; controller workflow itself has Node24 pins but is not yet triggerable from default branch. Local tests NOT RUN. Independent security review NOT RUN.
- PR #188 remains OPEN/DRAFT/UNMERGED; independent review and effective governance remain NOT VERIFIED.


## Pass 128 OSS, security and CI delta — 2026-11-28

### Node 24 validation workflows
- Reused the official immutable GitHub Actions already evaluated in Pass 127:
  - checkout v7.0.1 SHA `3d3c42e5aac5ba805825da76410c181273ba90b1`
  - setup-node v7.1.0 SHA `949feb2413d6458794dcd2491c4babbbce0c15c1`
- Migrated `.github/workflows/d1-ledger-proof-validation.yml` and `.github/workflows/pool-contract-validation.yml`; setup-node package-manager cache explicitly disabled.
- Final CI logs contain no Node20 action deprecation warning for these workflows.
- No new dependencies, services, provider routes or paid resources.

### Import-graph security guard
- Added `scripts/check-worker-import-graph.mjs` and tests.
- Recursively resolves local static imports/exports, rejects dynamic import/require and non-relative imports, forbids reachability of event/controller adapters and blocks symlink realpath escapes.
- Current Worker entrypoint graph: 1 module, 0 edges. This is a source-policy guard, not a hostile-code sandbox.
- Replaced previous direct-import-only inspection with the recursive graph check in Pool Contract validation.

### Source-level review and evidence
- Reviewed owner-only workflow admission, read-only permissions, bounded API collector, independently mapped raw Actions context, envelope verifier, D1 receipt linkage and migration 0018 constraints.
- Local collector → verifier → D1 composition remains synthetic API fixtures on Workers Vitest/Miniflare. No live GitHub event or hosted D1 claim.
- Exact merge-result `a1a6e41eb16bcd63d72f18bbb3cf7ee5911cc1bf`:
  - D1 run `46176960877`: 9/9 files, 140/140 tests PASS.
  - Pool Contract run `46176960864`: 42/42 Node tests, `POOL_CONTRACT_VALIDATION=PASS`, `WORKER_IMPORT_GRAPH=PASS modules=1 edges=0`.
- Independent external security review remains NOT RUN. Default-branch controller workflow remains NOT FOUND; live controller NOT RUN.

## Pass 136 — Engineering Optimization Loop, maturity scale and effort ledger (2026-11-28)

### Owner request and operating change
The owner requested that every /next optimize the whole Cloud Pool platform, scan current AI/OSS developments, reuse stable components and code patterns, expand meaningful tests, review architecture/security/cost, and increase the depth gradually toward a 15–20 minute engineering work budget.

This is now normative for subsequent /next passes. It applies to the whole platform architecture, but Contour A remains the only implementation priority until formal ACCEPTED. Contour B can be tracked in a read-only technology radar, but no Contour B implementation begins early.

### Maturity scale (not a fabricated percentage)
| Stage | Gate | Evidence required |
|---|---|---|
| 0 — Scope and governance foundation | PLANNED | Owner requirements, authority boundaries, free-tier constraints, threat model and acceptance criteria |
| 1 — Architecture/contracts | VERIFIED DESIGN | Architecture decisions, API/task/provider/state contracts, data-flow and trust-boundary diagrams |
| 2 — Local integration proof | VERIFIED | Exact-SHA CI, adversarial/contract tests, local D1/Workers composition, source/provenance checks |
| 3 — Governance and independent review | QUALIFIED GATE | Effective ruleset, independent approval/security review, resolved findings, provenance and merge-readiness |
| 4 — Controlled runtime | QUALIFIED | Authorized controller activation, task admission, lease/fencing, isolated executor, durable state/recovery, audit |
| 5 — User surface and model operations | QUALIFIED | Authenticated responsive UI, live read API, account-isolated routing, quota/cost controls and no-paid-fallback tests |
| 6 — End-to-end operational qualification | QUALIFIED | Phone/desktop journeys, fault injection, concurrency/replay/recovery, security, cost/free-tier and independent acceptance evidence |
| 7 — Contour A acceptance | ACCEPTED | All required capabilities work together; independent acceptance report and owner acceptance evidence |

Current position: Stage 2 — Local integration proof, with a blocking Stage 3 governance gate. The latest verified target at the start of Pass 136 is PR #188 head 9521094a65cf6bb4fafa5b9b6348110338cf6cba, base 565404f84b6b86afb4dc2d8fa939341f42df6eca, exact merge-result 73d4269384cd1cd4c1945dd7f4bd296753a308fe. Pool Contract 42/42 and D1 140/140 both passed on that same merge-result. This is not a running cloud pool and not acceptance.

Stage 3 blocker: active ruleset #26550182 still requires 0 approvals; PR #188 has 0 formal reviews and 0 inline threads; independent security review NOT RUN. The controller workflow is absent from default branch Основной (Contents API 404), so live issue_comment activation is NOT RUN.

### Engineering-hours ledger and remaining estimate
Historical actual engineering hours across earlier chat passes were not recorded with a reliable timer or timesheet. They cannot be reconstructed from the number of /next messages, Git commit timestamps, CI duration or calendar time.
- Cumulative actual engineering hours before Pass 136: NOT MEASURED / NOT RECOVERABLE.
- Pass 136 active engineering hours: NOT MEASURED. CI runtimes are test metrics, not engineering hours.
- This is not a claim that zero hours were spent.
- Future passes must record actual active minutes only when a reliable start/end measurement exists; otherwise keep NOT MEASURED. Never backfill guessed actual time.

Planning estimate to reach Contour A ACCEPTED from current evidence: 52–95 additional focused engineering hours, excluding external review/owner waiting time, provider quota waiting, and newly discovered infrastructure/legal constraints. This is a rough work-breakdown estimate, not a delivery promise:

| Remaining work package | Estimated active engineering effort |
|---|---:|
| Governance remediation, independent security review coordination, integration readiness | 3–6 h |
| Controller activation contract and end-to-end admission proof after governance gate | 5–9 h |
| Durable task/attempt state, leases, fencing, idempotency, ambiguous outcomes and recovery | 10–18 h |
| Executor lifecycle, isolation, resource limits and evidence/artifact handling | 8–14 h |
| Responsive web console, server-side auth/session, live read API and browser QA | 10–18 h |
| Provider-neutral route qualification, account isolation, quota/cost ledger and no-paid-fallback tests | 8–14 h |
| End-to-end fault/security/operational qualification, fixes, docs and independent acceptance | 8–16 h |
| TOTAL | 52–95 h |

The range must be revised after each work package using measured task durations and actual defects. Any hosting limitation that cannot be satisfied on the approved free GitHub-only path must be recorded as BLOCKED rather than silently solved with paid or unapproved hosting.

### Per-/next Engineering Optimization Loop (mandatory)
1. Context and governance sync: refresh Context Window, default/current HEAD, branches, PRs/issues, exact-head CI and logs, reviews/threads, rulesets, permissions and executor availability. Distinguish current facts from historical snapshots.
2. Technology intelligence delta: inspect primary GitHub releases/tags, security advisories, official docs and standards for relevant agent/model SDKs, orchestration, MCP/A2A, state/storage, routing, UI, CI/CD, sandboxing, observability and hardware/edge architecture. Use a prior scan as baseline; log NO MATERIAL CHANGE when appropriate. Do not equate stars or social posts with maturity.
3. Reuse First: search maintained, license-compatible OSS and stable code patterns. Inspect exact version/commit, license, release provenance, activity, advisories, dependency footprint, supported runtime, resource use, data flows and operational cost. Record REUSE / ADAPT / BUILD / PILOT / DEFER / REJECT. Do not import snippets without license/attribution review.
4. Architecture-wide optimization review: assess UI/Experience, API/auth, policy/authority, task DAG, admission, queue, lease/fencing, executor, model routing, quota/cost, durable state, audit/observability, CI and free-tier footprint. Contour B is radar-only until Contour A ACCEPTED.
5. Select by measurable leverage: choose one high-value improvement using risk reduction, critical-path acceleration, defect reduction, runtime/cost impact and implementation scope. Avoid broad refactors without measured need.
6. Freeze target: record target SHA, scope, non-goals, permissions, risks, rollback and Definition of Done before changes.
7. Implement and test: prefer existing mature components and existing contracts. Expand tests where they close an identified gap: unit, schema/contract, adversarial/security, property/fuzz, integration, fault-injection/recovery, browser/accessibility, performance/resource and regression. Do not inflate test counts with low-value assertions.
8. Verify: inspect full diff and changed files; run relevant tests; inspect exact checkout SHA in CI logs; validate clean-base/merge-result as appropriate; run security/provenance checks. Empty/incomplete/inaccessible results are NOT VERIFIED.
9. Update evidence: append a dated technology decision, work report, checkpoint, Context Window, metrics and next step. Record commit/blob SHA and links. Keep old evidence immutable and mark superseded records instead of silently rewriting history.
10. Safety gates: no secret reads, paid fallback, account mixing, provider/model call, dispatch, executor launch, deployment, production mutation or governance bypass without its own explicit authorization and passed gates.

### Gradual per-request work-budget ramp
The requested target is 15–20 minutes of substantive engineering work per /next, but actual duration must not be claimed without measurement. Ramp scope rather than padding a pass:
- Passes 136–138: target 8–10 minutes of focused work.
- Passes 139–141: target 10–12 minutes.
- Pass 142 onward: target 15–20 minutes, subject to tool availability, context budget and a single bounded DoD.
- If blocked by owner action or unavailable API, continue safe independent work rather than bypassing the gate.
- Do not keep a pass open merely to consume time; evidence quality and completed DoD take precedence over duration.

### Metrics required on every pass
- Stage and gate status; critical-path work package.
- Target HEAD/base/merge-result SHA and PR size.
- Tests passed/failed/skipped, exact-SHA status and coverage where available.
- Security findings by severity; unresolved governance/review blockers.
- Actual active minutes (measured) and estimated effort (separate).
- Remaining estimate range and confidence / assumptions.
- CI queue, startup, dependency install, test and artifact durations where logs expose them.
- Defect count, retries, recovery/fencing outcomes, resource use and cost/free-tier impact where measured.
- OSS candidates scanned, dispositions and exact upstream versions/commits.
- New dependencies/services/provider routes and paid spend (must remain 0 unless separately authorized).
- Next action and acceptance evidence required.

### Pass 136 technology delta scan — primary-source evidence
| Candidate | Fresh upstream evidence | Cloud Pool decision |
|---|---|---|
| LangGraph | v1.2.24 (2026-11-20) fixes message reducer handling and null checkpoint behavior; CLI v0.4.44 (2026-11-25) adds JSON output for deploy listing and fixes secret-list handling. | ADAPT strict checkpoint/recovery and machine-readable operations ideas; DEFER runtime because current Node/Workers + D1 ledger should remain one state authority until a concrete limitation is measured. |
| OpenAI Agents SDK | v0.26.0 (2026-11-24), MIT; release notes include bounded TAR path validation, Docker CPU/path inspection and storage mount privilege restrictions, MCP metadata precedence and queued-tool guardrail handling. | ADAPT sandbox path/resource/guardrail acceptance patterns; DEFER Python runtime because it does not replace the current Node/Workers controller or task ledger. |
| Google ADK Python | v2.15.1 (2026-11-24), Apache-2.0; fixes streamed A2A output persistence and dynamic instruction gating. | ADAPT stream-completion/persistence tests and routing-gate semantics; DEFER runtime pending a demonstrated Python executor requirement and threat-model fit. |
| zizmor | v1.33.1 (2026-11-22), MIT; immutable GitHub release and published binary SHA-256 digests; static analysis for GitHub Actions injection, token permissions, credential persistence and impostor commits. | PILOT candidate for an additional workflow-security CI check after install path and exact release asset provenance review. Not installed or run in this pass. |
| OpenSSF Scorecard | v5.7.0 (2026-11-19), Apache-2.0; release includes an in-toto provenance artifact. | PILOT candidate for a read-only supply-chain baseline and recurring trend; score is not a substitute for threat modeling or mandatory review. Not run in this pass. |

Primary sources:
- https://github.com/langchain-ai/langgraph/releases
- https://github.com/openai/openai-agents-python/releases/tag/v0.26.0
- https://github.com/openai/openai-agents-python/blob/main/LICENSE
- https://github.com/google/adk-python/releases/tag/v2.15.1
- https://github.com/google/adk-python/blob/main/LICENSE
- https://github.com/zizmorcore/zizmor/releases/tag/v1.33.1
- https://github.com/zizmorcore/zizmor/blob/main/LICENSE
- https://github.com/ossf/scorecard/releases/tag/v5.7.0
- https://github.com/ossf/scorecard/blob/main/LICENSE
- https://cheatsheetseries.owasp.org/cheatsheets/GitHub_Actions_Security_Cheat_Sheet.html
- https://owasp.github.io/DevSecOpsGuideline/2-Process/2-3-Build/2-3-6-Supply-Chain-Security/2-3-6-3-CICD-Pipeline-Security/

### Pass 136 disposition
- Technology delta scan: COMPLETED for this bounded shortlist; not exhaustive.
- New dependencies installed: 0.
- Runtime components integrated: 0.
- Security scanners executed: NOT RUN.
- New test suites added: 0; this pass changes the process/measurement contract.
- Actual engineering time: NOT MEASURED.
- Current stage: 2 — VERIFIED local integration proof; Stage 3 BLOCKED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
