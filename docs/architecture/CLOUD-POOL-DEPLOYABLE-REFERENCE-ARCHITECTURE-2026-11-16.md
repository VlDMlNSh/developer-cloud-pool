# Cloud Development Pool — deployable reference architecture and acceptance baseline

Date: 2026-11-16  
Status: DESIGN BASELINE / NOT DEPLOYED  
Contour: A — Cloud Development Pool only  
Target repository: `VlDMlNSh/developer-cloud-pool`  
Documentation branch: `docs/cross-chat-continuation-2026-11-06`  
Design input default-branch SHA observed: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`  
Documentation branch HEAD before this pass: `0ebedb1dff15731cca2dfa1397a898d9f28d2d88`

## 1. Purpose and non-goals

This document is the deployment-oriented baseline for Contour A. It turns the accepted architectural decisions into component boundaries, configuration contracts, rollout stages and verifiable acceptance gates.

In scope:
- Jarvis-facing remote web console and authenticated control-plane API.
- Pool Bridge admission, authorization, task leases, quotas, route selection and audit.
- Two isolated Claude Code + ECC execution profiles.
- API model routes, local model routes and separate media workers.
- Browser-assisted operator research through the ChatGPT Agent Browser/TinyFish integration, without treating browser sessions as API credentials.
- Durable task state and recovery.
- GitHub-based CI, evidence and cross-chat recovery.

Out of scope until Contour A is ACCEPTED:
- MediaHub OS product implementation (Contour B).
- Production use of any provider route that has not passed qualification.
- Public exposure of FCC/OmniRouter admin interfaces.
- Always-on fleets of agents; workers are on-demand and task-scoped.

## 2. Architecture decisions (normative)

1. **Control plane is the authority.** Jarvis UI is a client. Pool Bridge is the only admission and orchestration authority. Agents cannot mint capabilities, override route policy, mutate quota ledgers, issue worker leases or authorize their own deployment.
2. **Two separate Claude Code profiles.**
   - Profile A: Claude Code + ECC → FCC or another qualified Anthropic Messages gateway → explicitly admitted cloud API route.
   - Profile B: Claude Code + ECC → OmniRouter or another qualified Anthropic Messages gateway → local coding/planning model. A separate media worker handles video/image generation.
3. **ECC is a Claude Code harness/plugin capability layer**, not a model, provider or router. Install independently in each profile, pin immutable upstream commit/release and keep plugin/config state separate.
4. **API and browser access are separate planes.** API routes use provider credentials held by trusted gateway processes. Agent Browser/TinyFish uses an explicitly selected browser context profile for interactive website tasks. Cookies/session state never become provider API credentials and must not be exported to workers.
5. **No credential inheritance.** Claude Code child processes receive only a short-lived, scoped gateway token and required non-secret configuration. Provider keys are available only to the trusted gateway process. The known FCC `_claude_child_env()` environment inheritance issue blocks secret-bearing use until corrected and tested.
6. **No paid fallback.** A route without verified account identity, billing class, free quota and remaining budget is disabled. Unknown means deny.
7. **Fail closed.** Unknown route, stale model catalogue, expired lease, missing authorization, quota ambiguity, provider timeout, invalid signature or audit persistence failure must not silently fall back to another provider.
8. **On-demand workers.** A worker is provisioned for a task, receives a single-use lease and scoped capabilities, and is destroyed or returned to a clean pool after task completion. No 30-agent always-on deployment.
9. **Profile isolation.** A and B have separate OS/container identity, home/config directories, workspaces, queues, network policy, gateway credentials, local state and audit attribution.
10. **Contour B remains deferred** until the Contour A acceptance record is independently approved.

## 3. Logical topology

```text
Owner / Browser
      |
      v
Jarvis Web Console (remote UI; authenticated)
      |
      v
Pool Bridge API  <----> Durable State / Task Ledger / Quota Ledger / Audit
      |
      +---- Admission + policy + capability issuer + lease/fencing
      |
      +---- Profile A Supervisor
      |        |
      |        v
      |    Isolated Claude Code + ECC worker
      |        |
      |        v
      |    Local FCC gateway process (provider keys only here)
      |        |
      |        +--> qualified cloud API routes (one route per admission)
      |
      +---- Profile B Supervisor
               |
               v
           Isolated Claude Code + ECC worker
               |
               v
           OmniRouter (local model endpoint)
               |
               +--> qualified local coding/planning model

Pool Bridge --> separate task-scoped Media Worker --> local media runtime/model

ChatGPT Agent Browser / TinyFish
      |
      +--> operator-authorized public web research / browser UI sessions
      +--> never a worker credential source; no cookie/session export
```

The browser integration shown here is an operator tool channel, not an assumed service running inside GitHub Actions or the pool host. A future in-pool browser worker requires a separate implementation and qualification; the ChatGPT plugin does not imply a callable in-pool API.

## 4. Component contracts

### 4.1 Jarvis Web Console
- Mobile/desktop responsive UI; no direct provider calls.
- Authenticates owner/operator identity and requests operations from Pool Bridge.
- Displays task state, worker state, route qualification, quota metadata and audit references.
- Never displays provider secret values or browser cookies.
- All mutating actions require server-side authorization and idempotency keys.

### 4.2 Pool Bridge (control plane)
Responsibilities:
- Validate actor, repository, issue/comment identity and task envelope.
- Persist admission before dispatch.
- Issue immutable task ID, target SHA, capability set, expiry and monotonically increasing fencing generation.
- Enforce queue and per-account quota admission.
- Resolve only routes with a current signed qualification record.
- Dispatch worker using exact immutable image/version and task-scoped workspace.
- Reconcile ambiguous dispatch outcomes before retry.
- Persist terminal state and audit receipt before releasing lease.

Pool Bridge is not an agent and does not accept authorization assertions from workers. Workers may return result evidence but cannot set their own trusted terminal state.

### 4.3 Profile A — cloud API coding path
- Dedicated runtime identity, workspace, home directory and queue.
- Claude Code + pinned ECC plugin/source.
- FCC is a candidate gateway, currently BLOCKED by provider-key inheritance and provenance concerns.
- Provider key mounted/injected only into a separate trusted gateway process/container.
- Claude Code receives only local gateway URL and short-lived gateway token.
- Gateway admin UI binds loopback/private interface only; no public exposure.
- Per-route policy includes account ID alias, credential reference, provider, model IDs, allowed modalities, billing class, quota domain, request/token limits and health state.
- One request is pinned to one provider/account route; no silent cross-account retry.

### 4.4 Profile B — local model coding path
- Separate runtime identity, workspace, home directory, queue and policy.
- Claude Code + separately pinned ECC install.
- OmniRouter endpoint must implement the Anthropic Messages protocol used by Claude Code, including streaming and tool-use semantics. OpenAI chat compatibility alone is insufficient.
- Local model server is independently inventoried and pinned by model digest/quantization and runtime version.
- No network path to Profile A secrets, provider gateway sockets, or A workspace.
- Cloud fallback is disabled. If local model is unavailable, task stops with a typed unavailable status.
- Media worker is a separate service with explicit media task schema, model/runtime pin, resource/time budget, output location and cancellation. It is not assumed to be part of OmniRouter.

### 4.5 Browser research and web-session plane
- Agent Browser/TinyFish is used from ChatGPT for operator-requested public research and user-authorized website navigation.
- Use separate browser profiles per purpose; profile identity and sign-in domain metadata are not proof of account identity.
- No browser cookie, local storage, session token, password or OTP may be copied into Pool Bridge, GitHub, FCC, OmniRouter or worker environments.
- A logged-in consumer web session does not create API access, API quota, a model route or permission to automate bulk interactions.
- Browser-derived facts must be cited/recorded with URL, timestamp, task ID and evidence summary.
- Provider web UI can be used for manual exploration, but model execution in the pool requires an official API or separately qualified local endpoint.

### 4.6 Durable state
Minimum entities:
- `tasks`: task_id, actor_id, source_event_id, target_sha, profile_id, status, created_at, deadline.
- `admissions`: task_id, policy_version, decision, decision_reason, idempotency_key.
- `leases`: task_id, worker_id, generation, expires_at, heartbeat_at, state.
- `routes`: route_id, provider, account_alias, quota_domain_id, model_id, protocol, qualification_ref, state.
- `quota_events`: route_id, task_id, request_units, token_units, reservation_id, result, observed_at.
- `artifacts`: task_id, immutable URI, digest, media_type, provenance.
- `audit_events`: append-only event_id, actor, action, resource, decision, timestamp, correlation_id, evidence_ref.

Do not store secret values in these records. Credential references point to secret storage by opaque identifier only.

## 5. Model/provider route contract

Every route is disabled until its qualification record contains:
- Stable route ID and provider/product distinction (e.g. Alice web != YandexGPT API).
- Verified account/project identity alias and independent quota-domain evidence.
- Credential reference only; never credential value.
- Explicit billing class: FREE_VERIFIED, PAID_AUTHORIZED, or UNKNOWN. Contour A default policy allows only FREE_VERIFIED unless owner explicitly authorizes a paid route in a future policy change.
- Exact API protocol and endpoint family.
- Immutable adapter/gateway image digest and source commit.
- Model IDs, lifecycle state, region, modality and context limits.
- Streaming, tool-call, parallel tool-call, stop reason, reasoning block, cancellation, timeout, retry and error mapping test results.
- Secret isolation proof, quota reservation evidence and audit receipt.
- Expiry/revalidation date and signed verifier identity.

Initial disabled candidates:
- DeepSeek API: FCC adapter candidate; API billing/quota and feature parity NOT VERIFIED.
- Gemini API: FCC adapter candidate; official OpenAI-compatible API exists, but Anthropic translation parity NOT VERIFIED.
- YandexGPT API: separate Yandex Cloud route/custom adapter candidate; not the same as Alice and not found as built-in FCC adapter in inspected README.
- Alice consumer web: WEB_SESSION_ONLY / NOT A MODEL ROUTE.
- Other provider slots from the registry remain DISABLED pending the same contract.

## 6. Security boundaries

| Boundary | Required enforcement |
|---|---|
| Browser → operator | Explicit user authorization; isolated browser profile; no secret extraction |
| UI → Pool Bridge | Authenticated identity, CSRF/origin controls, rate limit, idempotency |
| Pool Bridge → worker | Single-use signed capability, immutable task envelope, expiry, fencing generation |
| Worker → gateway | Scoped short-lived virtual token; private network only |
| Gateway → provider | Provider credential only in trusted gateway process; per-account quota |
| Profile A ↔ Profile B | Separate identities, filesystem, network, queues, secrets and state |
| Worker → GitHub | Minimum token permissions; PR branch only; no governance bypass |
| Media worker → storage | Task-scoped output path, size/time limits, digest and cleanup policy |

Additional requirements:
- Do not mount Docker socket into agent containers.
- Drop root; read-only root filesystem where feasible; temporary writable workspace only.
- Explicit egress allowlist; deny metadata endpoints and private network by default.
- No privileged capabilities, host PID namespace, host network, or host filesystem mounts.
- Pin OCI images by digest; dependencies by lockfile and hashes.
- Raw prompts/responses, SSE payloads, credentials and browser session data are not written to logs by default.
- Audit log is append-only and does not contain secrets.
- Secrets are not available to untrusted fork PRs or arbitrary shell steps.
- Any process that can read provider credentials must be outside the agent's command-execution trust boundary.

## 7. Deployment topology and stages

### Stage 0 — repository and policy baseline
- Default branch protected; docs/work branch separate.
- CI contract tests and security checks run on exact immutable SHA.
- No provider route or worker dispatch enabled.

### Stage 1 — control-plane proof
- Deploy Pool Bridge in private environment.
- Configure durable state backend only after free-tier and persistence semantics are verified.
- Prove idempotent admission, lease expiry, fencing, reconciliation and append-only audit with synthetic data.
- No model providers or secrets.

### Stage 2 — browser/UI proof
- Deploy responsive UI behind authentication.
- Verify mobile and desktop access, authorization, CSRF, session expiry and audit.
- Browser plugin remains an operator research tool; in-pool browser runtime is a separate optional worker.

### Stage 3 — Profile B local-only qualification
- Verify host resources, local model, OmniRouter protocol and media runtime independently.
- Synthetic tests first; cloud fallback disabled.
- No external provider credentials mounted.

### Stage 4 — Profile A gateway isolation qualification
- Resolve FCC provenance and provider-key inheritance, or select a reviewed alternative gateway.
- Demonstrate Claude Code child environment contains no provider credentials.
- Synthetic protocol tests first, then one owner-authorized provider smoke test after account/billing/quota verification.

### Stage 5 — on-demand workers and integration
- Integrate supervisors, single-use leases, task artifact collection and cleanup.
- Prove no duplicate dispatch after ambiguous outcomes.
- Verify two profiles remain isolated under adversarial tests.

### Stage 6 — independent Contour A acceptance
All gates below must pass with immutable evidence. No acceptance based on design docs alone.

## 8. Acceptance gates

| Gate | Evidence required | Current status |
|---|---|---|
| G0 Governance | protected default branch, review/CI policy, exact-head CI | PARTIAL / RECHECK REQUIRED |
| G1 Pool Bridge | durable admission, idempotency, fencing, reconciliation | PARTIAL PROOFS; NOT QUALIFIED |
| G2 Web UI | live remote UI from mobile + desktop, auth and audit | NOT VERIFIED |
| G3 Browser research | plugin profile/session policy; in-pool browser only if deployed | PARTIAL DESIGN; runtime NOT VERIFIED |
| G4 Profile A | Claude Code + ECC + isolated gateway + qualified route | BLOCKED |
| G5 Profile B | Claude Code + ECC + OmniRouter + local model | NOT VERIFIED |
| G6 Media | separate local media runtime, bounded execution and output audit | NOT VERIFIED |
| G7 Quotas | per-account independent quota domains, reservation and no paid fallback | NOT VERIFIED |
| G8 State | durable state, recovery, backup/restore, no duplicate task execution | PARTIAL PROOFS; NOT QUALIFIED |
| G9 Security | least privilege, secret isolation, egress, provenance, audit | BLOCKED |
| G10 Independent acceptance | independent reviewer evidence package and signed decision | NOT RUN |

Contour A may be ACCEPTED only when every gate is VERIFIED/QUALIFIED and an independent acceptance record is published. A green unit test suite alone is insufficient.

## 9. OSS component selection policy

Prefer mature self-hostable components, but select only after a pinned-source and threat-model review.

- **LiteLLM Gateway** is a serious alternative/candidate for Profile A/B gateway compatibility: its docs explicitly describe Claude Code using Anthropic Messages at `/v1/messages`, model routing and virtual keys/budgets. It does not automatically solve free-tier, provider account, secret isolation or feature parity; no adoption/install decision is made here.
- **FCC** remains a candidate for Profile A due existing adapter inventory, but stays blocked until provenance and child environment credential inheritance are fixed.
- **OmniRouter** remains the Profile B candidate; its exact upstream source/version and Anthropic Messages compatibility still require verification.
- **Agent Browser/TinyFish** is the current operator browser tool. It is not selected as an in-pool browser runtime.
- For worker isolation, compare OCI container isolation and stronger sandbox runtimes against actual host capabilities. Do not deploy a sandbox technology based only on marketing claims. Verify kernel/host prerequisites, network policy, filesystem isolation, resource controls, license, maintenance and free-tier fit.

## 10. Recovery and /next protocol

At the beginning of every new /next:
1. Fetch this Context Window and this architecture baseline from the docs branch.
2. Re-fetch default branch SHA, docs branch SHA, open PRs/issues, ruleset, exact-head CI and governance state.
3. Read the latest checkpoint and latest report; do not trust old state without revalidation.
4. Select exactly one next bounded engineering task.
5. Search for mature OSS before implementing a new subsystem.
6. Record immutable target SHA, files, test commands and acceptance criteria.
7. Perform only actions permitted by current gates; no secrets or live provider calls while blocked.
8. Read back every changed file and record commit/blob SHA.
9. Update Context Window and dated checkpoint/report.
10. Report VERIFIED vs NOT VERIFIED explicitly, plus blockers and next task.

### Current continuation point
Next engineering task: create machine-readable disabled-by-default profile and route manifests, then add no-secret contract tests. Start with schema validation and negative tests for profile cross-access, provider-key inheritance, cloud fallback from Profile B, expired leases, duplicate admission and browser-session-to-API credential confusion. Do not deploy until those tests and source reviews pass.

## 11. Evidence and external references

- Anthropic Claude Code gateway documentation: https://code.claude.com/docs/en/llm-gateway
- LiteLLM Claude Code client setup: https://docs.litellm.ai/docs/proxy/client_setup/claude_code
- LiteLLM project documentation: https://docs.litellm.ai/
- DeepSeek API docs: https://api-docs.deepseek.com/
- Gemini API docs: https://ai.google.dev/gemini-api/docs
- Yandex Cloud AI Studio: https://yandex.cloud/ru/docs/ai-studio/
- FCC candidate: https://github.com/Factix/fcc
- ECC upstream: https://github.com/affaan-m/ECC

## 12. Verification boundary

This document is a design baseline only. It does not prove that the UI, Pool Bridge, gateway, browser, worker, local model, media runtime, quotas or provider routes are deployed or operational. No secrets, provider calls, browser sign-ins, worker dispatch or deployment are authorized by this document.
