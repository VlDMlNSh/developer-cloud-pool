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
