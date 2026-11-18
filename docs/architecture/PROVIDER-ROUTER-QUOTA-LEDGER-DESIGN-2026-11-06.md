# Account-isolated Model Router and renewable quota design

**Status:** DESIGN / NOT IMPLEMENTED / NOT QUALIFIED  
**Date:** 2026-11-06  
**Baseline:** `Основной` @ `64d2636d4500127e635c214ccfb722c6b3fcda80`  
**Controlling issue:** [#26](https://github.com/VlDMlNSh/developer-cloud-pool/issues/26)

## 1. Decision

Use **LiteLLM Proxy as the leading reusable Model Gateway candidate**, not as an already adopted runtime. Do not build a replacement provider adapter/router until a pinned-version, no-secret proof-of-fit demonstrates a concrete gap.

The gateway is the only component permitted to hold upstream provider credentials. Agent workers receive a scoped gateway virtual credential or a task-bound gateway capability; they never receive raw provider API keys. The gateway must expose only the model groups and capabilities authorized for that agent/task.

LiteLLM provides provider adapters, model-group routing, retries, cooldowns, fallbacks, virtual keys, model access controls and spend/rate-limit accounting. Its router is a good fit for provider execution, but its spend ledger is **not** a source of truth for upstream provider free-quota remaining.

## 2. Two quota domains — never conflate them

### 2.1 Upstream provider quota domain

The upstream domain is the provider-defined owner/account/project/organization scope to which a provider applies rate or usage limits. It is identified only from provider documentation or account evidence.

A credential slot has:
- `credential_ref`: opaque reference to a secret held by an approved secret boundary;
- `provider_account_ref`: non-secret provider account/project identifier, when available;
- `quota_domain_id`: stable opaque ID for the confirmed upstream quota scope;
- `quota_evidence_status`: `UNKNOWN | DOCUMENTED | ACCOUNT_VERIFIED | LIVE_VERIFIED`;
- `quota_reset_policy_ref`: reference to evidence for a reset rule, never an inferred schedule.

Multiple credentials may share one upstream quota domain. Separate key names or suffixes do not prove separate accounts or independent quotas. When the domain is unknown, the router must conservatively avoid claiming independent capacity and must not multiply an assumed quota by the number of keys.

### 2.2 Pool operational budget

The pool's own budget is a separate control plane:
- requests and tokens per task/agent/window;
- concurrency and in-flight reservations;
- internal estimated spend and hard maximum;
- retry and fallback ceilings;
- task deadline and remaining execution time.

This budget is enforced by the gateway/ledger and does not claim to reveal the provider's actual remaining free quota.

## 3. Route identity and admission

Every configured credential slot is a separate route identity even where provider/model are shared. A route is admissible only when all relevant evidence is present:

1. Credential reference is configured in the approved runtime boundary (presence metadata only; never reveal value).
2. Provider account and quota domain are identified or conservatively marked unknown.
3. Requested model and capability are allowlisted for this route.
4. Billing class is explicitly allowed by policy and supported by current evidence.
5. Qualification status is accepted for the intended workload.
6. Route is not suspended, cooling down, or over its internal budget.
7. The agent/task budget and task authorization envelope are valid.
8. `paid_fallback_allowed=false` is enforced at the gateway, not merely declared by the client.

Registry labels such as `free`, `permanent_free`, or `free_tier` are inventory metadata, not current proof of free eligibility. Each route must carry dated evidence and an expiry/revalidation requirement.

## 4. Error and cooldown state machine

| Provider result | Route action | Quota-domain action |
|---|---|---|
| 401 / 403 | Suspend credential route; mark auth/config failure; no retry loop | Suspend domain only if provider evidence shows account-wide failure |
| 402 / billing denial | Suspend route from all automatic retries/fallbacks | Mark billing status for confirmed account/domain; never switch to paid route |
| 429 with Retry-After | Cool down route for provider-specified interval | Apply domain-wide cooldown only when response/documentation proves the limit is domain-scoped |
| 429 without reset evidence | Bounded conservative route cooldown; record unknown reset | Do not invent a reset timestamp or claim quota replenishment |
| 5xx / network transient | Bounded retry with exponential backoff and jitter; cap attempts | Do not decrement or replenish provider quota without authoritative evidence |
| Success | Record usage and provider response metadata | Update quota only from an authoritative provider signal |

**Renewal rule:** a route becomes eligible again only when its verified cooldown expires or authoritative quota evidence confirms a reset. A local timer may expire a temporary cooldown; it may not manufacture a provider quota reset. If the provider does not expose remaining quota/reset information, status remains `UNKNOWN` and the route can only be retried under a bounded policy that cannot exceed the internal budget.

## 5. Durable state and concurrency

A production gateway needs durable shared state. GitHub-hosted runners are ephemeral and must not host the persistent gateway or ledger.

- PostgreSQL: durable route/account metadata, agent budgets, task reservations, usage/spend records, quota evidence, audit events and checkpoint references.
- Redis: shared rate-limit/concurrency coordination and fast counters across gateway replicas; not the durable source of truth.
- LiteLLM: provider adapters/router, virtual keys, model access, retries/cooldowns and spend/rate controls.
- Pool task ledger: task lease, immutable task envelope, execution attempt, checkpoint pointer and terminal outcome. The model gateway does not become task/issuer authority.

For LiteLLM, budget enforcement without PostgreSQL is not a hard ceiling. Production budgeted traffic must use PostgreSQL and `fail_closed_budget_enforcement=true`. For multi-instance hard rate limits, Redis coordination and `fail_closed_rate_limit_enforcement=true` are required. If the selected backend cannot verify a required budget/counter, deny the request (503/closed) rather than serving unmetered traffic.

No PostgreSQL/Redis service is currently provisioned or approved. This is an architecture dependency, not permission to create a paid resource.

## 6. Agent execution, resume and renewable quota

An agent task is a bounded state machine, not an unbounded chat loop:

1. Supervisor issues a signed/validated immutable task envelope with task ID, target SHA, allowed repositories/files, agent profile, model capability, deadline, maximum attempts, token/request/spend ceilings and `paid_fallback_allowed=false`.
2. Worker obtains a task-scoped gateway capability. No raw upstream credential enters the worker environment.
3. Gateway selects an eligible route using the task's model/capability and policy.
4. Worker periodically writes a checkpoint containing task/attempt ID, source SHA, agent/runtime version, progress summary, artifact references/digests and last committed operation. It contains no secrets or hidden reasoning.
5. On runner termination, the lease expires and Supervisor reconciles the attempt. A new ephemeral runner resumes only from a validated checkpoint and immutable task envelope.
6. A route cooldown/quota exhaustion pauses or defers the task. It does not reset the task's budget or bypass attempt limits.
7. When verified provider quota becomes available, the gateway can re-admit the route; Supervisor may resume the task if its deadline and remaining budget permit.
8. Terminal success/failure/needs-review is reconciled idempotently in the task ledger with provenance.

A checkpoint is not an authorization token. Resume cannot widen repository scope, model access, task budget, deadline or permissions. Ambiguous provider outcomes must be reconciled before retrying a potentially non-idempotent operation.

## 7. Mature component fit and constraints

### LiteLLM Proxy — candidate

Use for provider adapters, model-group routing, per-deployment cooldown/retry, virtual-key model access, request rate limits and internal spend accounting.

Known constraints from current official docs:
- Virtual keys and spend budgets require PostgreSQL.
- DB-less `max_budget` does not enforce a spend ceiling.
- `fail_closed_budget_enforcement=true` rejects budgeted requests with 503 when spend cannot be verified.
- Redis is needed for shared multi-instance rate-limit coordination; fail-closed rate-limit enforcement must be enabled when hard limits are required.
- Router cooldown/fallback is deployment/model-group health behavior, not upstream quota-account reconciliation.

Official references:
- [Virtual keys](https://docs.litellm.ai/docs/proxy/virtual_keys)
- [Budgets and rate limits](https://docs.litellm.ai/docs/proxy/users)
- [Router and load balancing](https://docs.litellm.ai/docs/routing)
- [Request path and router](https://docs.litellm.ai/docs/proxy/architecture)
- [Fallbacks](https://docs.litellm.ai/docs/proxy/reliability)

### Custom quota ledger — narrow responsibility only

Do not reimplement provider adapters, chat-completions compatibility, load balancing or retries. A small custom ledger/adapter is justified only for account-slot identity, upstream quota evidence, provider-specific reset reconciliation, task budget reservations and auditable resume semantics that LiteLLM does not claim to provide.

## 8. No-secret proof-of-fit — next implementation package

Target: pinned LiteLLM version/image on a standard `ubuntu-24.04` GitHub-hosted runner. No provider credentials, no provider endpoint calls, no PostgreSQL/Redis provisioning, no paid service and no pool dispatch.

Measure:
- exact image/package digest and license;
- pull/install time and bytes;
- disk delta, peak RSS and startup/readiness time;
- config parsing for synthetic distinct route/account/quota-domain references;
- virtual-key and budget behavior in a local disposable test setup, explicitly distinguishing DB-less unsupported behavior from PostgreSQL-backed behavior;
- fail-closed behavior when the budget store is unavailable;
- no-paid-fallback and model allowlist enforcement;
- deterministic route-state tests for 401/403/402/429, cooldown expiry, authoritative reset, unknown reset, shared quota domain and checkpoint resume.

Do not call a provider. Do not supply real or dummy-looking provider secrets. Synthetic credentials must be clearly non-routable test placeholders and all outbound provider egress must be blocked.

## 9. Explicit non-goals and gates

This design does not authorize:
- reading, copying, testing or rotating API keys;
- querying secret presence or secret values;
- cross-repository secret access;
- live provider/model requests;
- provisioning PostgreSQL, Redis, managed services or paid infrastructure;
- enabling Pool Worker/Supervisor dispatch;
- changing MediaHub issuer/capability, Jarvis, ASTRA A0 or Product State Authority;
- declaring any provider route free, independent, qualified or available without evidence.

Before production integration: pinned proof-of-fit; account-isolation and quota-reset evidence per provider; credential broker design; durable ledger design; deterministic tests; exact-head CI; independent security review; explicit qualification authorization.

## 10. Current disposition

- LiteLLM: RESEARCHED / CANDIDATE / NOT INTEGRATED.
- MediaHub registry references: 24 cloud credential slots observed; actual secret presence NOT VERIFIED.
- Provider account/quota-domain independence: NOT VERIFIED.
- Persistent PostgreSQL/Redis: NOT PROVISIONED / NOT APPROVED.
- Agent gateway credentials: NOT ISSUED.
- Live provider/model calls: NOT RUN.
- General agent execution and durable checkpoint/resume: NOT IMPLEMENTED.
- Cloud Pool dispatch: FAIL-CLOSED / NOT ENABLED.
- Production quota renewal: NOT IMPLEMENTED / NOT QUALIFIED.
