# Cloud Pool worker topology: 2 Claude Code profiles + on-demand worker pool — 2026-11-16

Status: ARCHITECTURE DECISION PROPOSAL; no deployment or runtime qualification performed.

## Decision

Adopt an on-demand worker pool, not 30 permanently running agents.

Prepare and qualify a catalogue of approximately 30 logical worker/provider slots, but instantiate only the workers needed for a task. Do not equate provider credentials, provider accounts, model routes, worker processes, and agent roles: they are different inventory dimensions.

## Terminology

- Provider: external or local model service (Gemini, DeepSeek, Groq, Mistral, Ollama, etc.).
- Credential/account slot: a specific credential reference and its independently verified account/quota domain. A GitHub Secret name alone does not prove account independence or available quota.
- Model route: provider + model + protocol adapter + billing class + qualification evidence.
- Worker: isolated process/container/session executing one bounded task.
- Role: task responsibility such as researcher, implementer, tester, security reviewer, documentation reviewer, browser operator. A role is a policy/task envelope, not a dedicated permanently running model.
- Profile: an execution path with its own gateway, credentials, workspace, queue, quotas, capabilities and audit boundary.

## Proposed topology

### Always-on / durable control plane (small)

1. Jarvis Web UI — user-facing task entry, visibility and approvals.
2. Pool Bridge — sole privileged admission, policy, capability, routing, quota reservation, dispatch and audit authority.
3. PostgreSQL — durable task ledger, idempotency, leases/fencing, transactional outbox, quota ledger and LangGraph checkpoints.
4. Model gateway(s) — only where justified; provider-specific routing remains fail-closed and cannot bypass Pool Bridge quota decisions.

These are services, not agents. Keep the permanent footprint small.

### Execution profiles

**Profile A:** Claude Code + ECC → FCC → qualified cloud API routes. Primary coding executor. ECC is the shared Claude Code capability layer, not a gateway. FCC must run in a credential-isolated trusted boundary. Claude Code must never inherit provider API keys; the current inspected FCC launcher copies base environment variables to the Claude child and therefore is not approved for secret-bearing execution until fixed or isolated.

**Profile B:** Claude Code + ECC → OmniRouter → qualified local coding/planning LLM; a separate task-scoped media worker invokes the local video-generation runtime. Also supports coding and DevOps. Separate workspace, queue, policy, and audit; no cloud/paid fallback. Do not share Profile A's provider credential environment or privileged control plane.

ECC (Everything Claude Code, official upstream affaan-m/ECC) is installed independently in both Claude Code profiles with a pinned source version and separate config state. ECC supplies agents, skills, hooks and rules; it is not a model router. The two Claude Code profiles are execution paths, not two permanently occupied compute workers. Start their sessions per task and terminate after completion/cancellation. Profile B's OmniRouter must prove Anthropic protocol compatibility; a separate media runtime is required for actual video generation.

### On-demand role catalogue

- Planner / task decomposer (Pool Bridge policy-controlled; not a privileged autonomous authority).
- Researcher / OSS scout.
- Implementer / coding worker.
- Independent test designer and test runner.
- Security / governance auditor.
- Code reviewer / integration reviewer.
- Documentation / provenance recorder.
- Browser operator (Diogen / agent-browser) in a separate browser sandbox with no provider secrets.
- Local inference worker (Ollama) on a qualified node.
- Specialist provider workers selected from the qualified route catalogue.

Gemini roles may be assigned to independent Gemini account/quota slots only after account identity and quota separation are evidenced. Dispatch Gemini exclusively through the approved controller after its security gates pass. Do not claim three independent agents were dispatched unless each receives a distinct task envelope and has its own run/job evidence.

## How to represent “about 30”

Maintain an inventory of up to ~30 logical routes/credential slots (exact count to be reconciled against the current registry). Do not create 30 always-running processes. Each inventory record should include:
- route_id, provider, model_id, adapter and immutable source/version;
- credential_ref (name/reference only; never secret value);
- account_ref and quota_domain_id, both independently verified;
- billing_class: permanent_free / restricted_free / promotional_credit / paid_disabled / local;
- capabilities and protocol test profile;
- concurrency/rate/token budgets and hard daily/monthly caps;
- workspace/security class, allowed tools, network egress policy;
- last qualification evidence, exact source SHA, status and expiry/requalification policy.

A route with unknown billing, account identity, quota, or policy is disabled by default. No paid fallback. A second API key is not automatically a second independent quota.

## Dispatch lifecycle

1. Jarvis submits a task with scope, acceptance criteria and data classification.
2. Pool Bridge decomposes the task into bounded role envelopes and selects only qualified routes.
3. Pool Bridge reserves quota and obtains a durable fenced lease before dispatch.
4. Start only the necessary worker(s), each with isolated workspace and minimum capabilities.
5. Inject only the selected provider credential into the trusted provider-side runtime; never place keys in task envelopes, prompts, artifacts, caches or logs.
6. Execute with timeout, cancellation, concurrency and cost/free-tier limits.
7. Collect artifacts, provenance, test results and immutable target SHA.
8. Independent review; persist accepted/rejected state and audit record.
9. Destroy ephemeral workers and revoke short-lived credentials/tokens.

Parallelism is bounded by verified provider quota, host capacity, task risk, and the durable quota ledger—not by the number of registered routes.

## Suggested initial rollout order

1. Complete Cloud Pool control-plane governance, durable admission, lease/fencing, recovery and security boundaries.
2. Qualify one FCC provider route and one end-to-end Claude Code task with no secret inheritance.
3. Qualify Profile B separately with one provider route and isolated workspace/credentials.
4. Qualify three Gemini roles through the approved controller only after its gates exist; retain NOT RUN until then.
5. Add QA, security review, research and browser workers as ephemeral roles, using already-qualified routes.
6. Expand route catalogue one provider/account at a time. Avoid enabling all 30 routes simultaneously.
7. Measure queue wait, task success, cost/quota consumption, retries, concurrency and host resource pressure before increasing parallelism.

## Answer to the deployment question

**Deploy/configure the pool catalogue, not 30 always-on agents.** Keep the control plane and durable storage available; keep provider adapters/routes dormant until qualified; create ephemeral worker sessions on demand. This gives breadth without idle resource use and reduces the blast radius of leaked credentials or compromised agents.

## Current evidence and status

- Existing architecture target defines Jarvis, Pool Bridge, durable state, LangGraph, LiteLLM, FCC Profile A, OmniRouter Profile B, browser isolation and local inference. The dual-profile reference architecture now explicitly requires Claude Code + ECC in both profiles and a separate local video-generation runtime.
- FCC source review found environment-variable support but also provider-key inheritance into the Claude child process; secret-bearing launch remains blocked until isolation is fixed and tested.
- This document is an architecture decision proposal only. No agents were deployed, no routes activated, no provider calls or tests run, and no Gemini controller dispatch performed.
- Contour A remains BLOCKED / NOT ACCEPTED. Contour B remains DEFERRED.

## Owner clarification — binding ECC decision (2026-11-16)

- Both Claude Code profiles use the official open-source ECC (Everything Claude Code) plugin. ECC is a Claude Code harness capability layer (agents/skills/hooks/rules), not a provider, model or router.
- Profile A: Claude Code + ECC → FCC → qualified cloud API routes.
- Profile B: Claude Code + ECC → OmniRouter → qualified local coding/planning LLM; video generation is executed by a separate task-scoped local media runtime/adapter.
- Each profile has independent Claude config/plugin state, workspace, queue, policy and audit. Same ECC source pin may be used in both; install/configure separately.
- Official ECC source: https://github.com/affaan-m/ECC; observed HEAD d2ef2680594f9a17526a6e1a2e18b3d242c5d17b; MIT declared upstream. No install/runtime test performed.
- OmniRouter must pass Claude Code Anthropic protocol/tool-call tests; OpenAI-compatible API support alone is insufficient. Actual video generation requires a separate media runtime; do not assume OmniRouter is a video generator.
- Reference architecture: [CLOUD-CODE-DUAL-PROFILE-REFERENCE-ARCHITECTURE-2026-11-16.md](CLOUD-CODE-DUAL-PROFILE-REFERENCE-ARCHITECTURE-2026-11-16.md).

## Next bounded pass

Reconcile the current provider registry against actual credential references and account/quota evidence (metadata only; never read secret values), then produce a worker-route inventory with disabled-by-default statuses and a minimal dispatch policy. Continue FCC source review of bind/auth/config lifecycle and secret isolation before any live execution.

## References

- Cloud Pool target architecture: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/architecture/CLOUD-POOL-TARGET-ARCHITECTURE-2.0.md
- FCC provider compatibility matrix: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/architecture/FCC-PROVIDER-COMPATIBILITY-MATRIX-2026-11-16.md
- FCC GitHub Secrets / no Admin UI assessment: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/reports/2026-11-16-fcc-github-secrets-no-admin-ui-assessment.md
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## Browser-plane boundary and deployment linkage (2026-11-16)

ChatGPT Agent Browser/TinyFish is the operator's browser channel for user-requested web research and authorized site navigation. It is not an in-pool worker, provider API, credential vault export path, or proof that a model has API access. Browser profiles are isolated; session cookies/storage must never be exported to Pool Bridge, FCC, OmniRouter or task workers. A future browser worker inside the pool is a separate runtime and requires independent host, sandbox, egress and acceptance qualification.

The deployable control-plane, profile, gateway, media-worker and acceptance contracts are consolidated in [CLOUD-POOL-DEPLOYABLE-REFERENCE-ARCHITECTURE-2026-11-16.md](CLOUD-POOL-DEPLOYABLE-REFERENCE-ARCHITECTURE-2026-11-16.md). Deployment remains disabled by default; see [deployment manifest](../../config/deployment/cloud-pool-deployment-manifest.v1.json) and [runbook](../runbooks/CLOUD-POOL-DEPLOYMENT-AND-RECOVERY-2026-11-16.md).
