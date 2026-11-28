# Jarvis free-compute and model-routing plan

Date: 2026-11-28  
Scope: Contour A only; architecture guidance and qualification backlog. No new provider route or dispatch is enabled.

## Objective

Increase verified engineering throughput and strengthen Jarvis without introducing paid fallback, shared credentials, permanent dependence on ephemeral runners, or a second state ledger.

## Reuse-first resource map

| Resource | Free capacity currently documented | Best use in Cloud Pool | Hard boundary |
|---|---|---|---|
| GitHub-hosted standard runners for this public repository | Standard public-repo runners are free; `ubuntu-24.04` is documented as 4 vCPU / 16 GB RAM / 14 GB SSD; Free-plan standard concurrency is 20 jobs | Parallel CI, clean-room tests, lint/security checks, ephemeral bounded agent tasks | Ephemeral; no GPU; no persistent task state; concurrency/queueing still applies |
| Cloudflare Workers Free | 100,000 requests/day, 10 ms CPU/invocation, 128 MB memory, 50 subrequests/request | Thin API/control plane, auth/policy checks, status streaming/polling | Not an inference host; do not move CPU-heavy model workloads here |
| Cloudflare D1 Free | 10 databases/account, 500 MB/database, 5 GB/account, 7-day Time Travel; 50 SQL queries per Worker invocation | Durable task/admission/receipt/lease metadata after the existing proof is qualified | Daily row read/write limits are enforced; one D1 database is single-threaded; batch statements to reduce per-request overhead |
| Gemini Developer API Free tier | Free token use for eligible models with model/project-specific quotas | Optional low-risk research, test synthesis, documentation drafts after account and route qualification | Quotas vary; free-tier content may be used to improve Google's products; never send secrets or sensitive/private code; paid tier must remain disabled |
| Local Ollama / CPU / future GPU host | No free cloud capacity implied; hardware and availability must be measured | Private-code inference and long-running jobs after host qualification | Host identity, memory/RAM/VRAM, thermal/power, availability and model license must be verified |

Sources (official):
- GitHub public runner billing: https://docs.github.com/en/actions/concepts/billing-and-usage
- GitHub runner specifications: https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/choose-the-runner-for-a-job
- GitHub Actions concurrency: https://docs.github.com/en/actions/reference/limits
- Cloudflare Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- Cloudflare D1 limits: https://developers.cloudflare.com/d1/platform/limits/
- Gemini API pricing and free-tier terms: https://ai.google.dev/gemini-api/docs/pricing

## Jarvis execution improvements

1. **Separate coordinator from executors.** Jarvis owns task decomposition, policy decisions, queue priorities, budgets, status and recovery. Agents receive immutable task envelopes and scoped capabilities only.
2. **Persist before dispatch.** Task envelope, target SHA, role, lease/fencing generation, checkpoints, artifacts and terminal result must be stored outside the runner before a task is considered started/completed. Runner replacement must not lose task state.
3. **Free-first model gateway.** Route only to a qualified provider/account/model/quota-domain tuple. Eligibility requires explicit free-tier evidence, current model availability, privacy classification, RPM/TPM/concurrency limits and remaining quota. No automatic paid fallback.
4. **Role-based parallelism.** Research/design, implementation, tests/contracts and security/provenance can run independently only when task envelopes and worktrees are isolated. Reviewer must not inherit executor write credentials.
5. **Fast CI without quality loss.** Keep contract and D1 suites separate; run independent suites concurrently; cache lockfile-pinned dependencies only; use path filters; upload test summaries and artifact digests; never use cache as durable state.
6. **Evidence-driven routing.** Record queue wait, runner startup, install time, test time, retry count, model latency, quota denials, artifact digest and reviewer outcome. Optimize only after a baseline exists.
7. **Fail-closed fallback.** If free quota is exhausted, model route is unverified, host is offline or state is ambiguous, queue/defer the task or use a qualified local route. Do not silently switch to a paid model.

## OpenAI API key decision

OpenAI API is not a free compute tier. Current published API pricing is usage-based: https://developers.openai.com/api/docs/pricing

No OpenAI API key is required for the current Pass 120 provenance fix or for the existing Cloud Pool CI. Do not create or add one now. If a future task is explicitly approved for a paid OpenAI route, the account owner can manage project keys through https://platform.openai.com/api-keys and the official key guidance at https://developers.openai.com/api/docs/guides/api-keys. Keep any key server-side in a dedicated project/service-account secret; never commit it, put it in a mobile/web client, or paste it into chat. Billing and key ownership must be handled by an eligible adult account owner; no spending or paid fallback is authorized by this plan.

For a no-cost model experiment, Google AI Studio is the official Gemini key entry point: https://aistudio.google.com/app/apikey. Creating a key does not prove free quota or route qualification. Do not configure or dispatch it until the approved Gemini controller, account identity, current free quota, privacy policy and audit gates are verified. The free tier may use submitted content to improve Google's products, so private repository content and secrets are excluded.

## Qualification gates before any new compute route

- Record provider, project/account identity, model ID/version, quota domain, current published free limits and expiry/region conditions.
- Verify the provider's terms and data-use policy; classify payloads before routing.
- Store only credential handles and metadata in the registry; keep values in isolated secret storage.
- Test quota exhaustion, 429, timeout, provider outage, invalid key, model withdrawal and paid-fallback denial.
- Measure latency, token throughput, failure rate and task quality against a fixed benchmark set.
- Require exact controller path, task-scoped capability, lease/fencing, audit event and independent review.
- Keep route disabled until all evidence is complete.

## Recommended order

1. Finish Pass 120 provenance correction and controller → Envelope → Workers → local D1 composition.
2. Qualify Claude Code + ECC + FCC installation on a public ephemeral runner with no provider calls, as already tracked by Issue #115.
3. Implement the free-first route eligibility/quota contract using the existing provider registry and quota ledger; do not create a parallel registry.
4. Add measured parallel CI and bounded role fan-out after durable lease/recovery qualifies.
5. Only after Contour A ACCEPTED, proceed to product/mobile/media work in Contour B.

## Status

- GitHub public-runner capacity: AVAILABLE BY DOCUMENTED PLAN; actual job concurrency/queue metrics NOT MEASURED.
- Cloudflare Workers/D1 free limits: DOCUMENTED; account usage headroom NOT VERIFIED.
- Gemini free tier: AVAILABLE SUBJECT TO ACCOUNT/MODEL QUOTA; account identity/quota NOT VERIFIED.
- OpenAI API: PAID ROUTE; NOT REQUIRED / NOT ENABLED.
- Local GPU capacity: NOT VERIFIED.
- New provider route or dispatch: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
