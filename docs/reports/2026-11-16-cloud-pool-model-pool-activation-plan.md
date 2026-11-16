# Cloud Pool model-pool target architecture and staged activation plan

Date: 2026-11-16  
Contour: A — Developer Cloud Pool  
Status: ARCHITECTURE RECORDED / PROVIDER ACTIVATION NOT AUTHORIZED  
Working documentation branch: `docs/next-2026-11-16-cloudpool-gemini-scope-audit`  
Default branch: `Основной`; observed HEAD from latest Context Window: `6507823e7ec27caa9b2621daef964dba2d4cf436`

## Executive decision

Build one shared model gateway with independent provider credential slots, explicit account/quota-domain identity, model compatibility, free-tier evidence, internal budgets, durable quota accounting, and an audit trail. Do not run one long-lived process per API key. Do not treat multiple keys as multiple quota pools unless provider evidence proves separate quota domains.

This plan is a target and staged activation order. It does not authorize live provider calls. Issue #26 remains OPEN and explicitly prohibits provider calls until credential boundary, qualification, budget guard, routing tests, provenance, and independent review are accepted.

## Owner billing decision

- Exclude direct DeepSeek API slot `deepseek-1` from activation: owner confirms it requires payment.
- Keep the inventory record for audit, but set `EXCLUDED_OWNER_CONFIRMED_PAID`.
- Do not confuse DeepSeek-branded models hosted by other providers with the direct DeepSeek API. They may be evaluated only under that host provider's own verified free entitlement.
- No billing enablement, card addition, paid credits, paid fallback, or quota-evasion key rotation.

## Source reconciliation

- MediaHub registry: `ops/qualification/provider_model_registry.json`, blob `8c0f95d33a6fc85128b3a7aa37157c2dca74bbca`; 24 cloud slots plus local Ollama.
- Cloud Pool Issue #26 is OPEN; 24 slots are inventory, not proof of secret presence, account identity, free entitlement, or working route.
- PR #28 is OPEN/DRAFT/UNMERGED; useful account-isolation and renewable-quota design, not accepted runtime.
- PR #29 is OPEN/DRAFT/UNMERGED. Its patch now includes a shared eligibility predicate for active and new slots and regression tests, but the formal CHANGES_REQUESTED review is attached to an older commit. Exact current head, CI and review reconciliation still required before relying on it.
- PR #107 is OPEN/DRAFT/UNMERGED, four-client Gemini candidate. The PR description reports exact-head CI run `43864376148` SUCCESS (6 tests), but formal reviews are 0; secret existence, account separation, runtime pinning, production integration and security review are NOT VERIFIED.
- Issues #94/#96 remain open; the Cloud Pool-native /next dispatch controller is not accepted. MediaHub's controller is not Cloud Pool authority.

## Model and credential policy

The machine-readable matrix at `config/provider-model-activation-matrix.json` preserves all 24 cloud slots and their registry model candidates. Every slot remains inactive until it has:
1. a verified secret reference (without reading or printing the value);
2. a verified provider account/project identity;
3. a verified quota-domain identity;
4. current official model availability and exact zero-cost entitlement;
5. provider-specific RPM/RPD/TPM/TPD/concurrency/reset evidence;
6. a passing free-only admission path and no-paid-fallback tests;
7. approved secret delivery, audit provenance and independent review.

The registry's `cost_class` and `persistence_class` are inventory metadata, not proof of current price or free entitlement. Router suffixes such as `:free` are also not sufficient evidence.

## Gemini finding

Official Gemini documentation states that rate limits are applied per project, not per API key. Four keys within one Google project therefore do not create four independent quota allocations. The four-client candidate in PR #107 remains isolated and unmerged. Only `gemini-1` is present in the 24-slot source registry; the other three credential identities must be reconciled from approved secret-name metadata and project ownership without exposing values.

The registry model IDs include `gemini-3.8-flash` and `gemini-3.5-flash-lite`. Current official pricing material lists `gemini-3.8-flash` as a Free-tier model and `gemini-3.1-flash-lite`; do not activate the unverified `gemini-3.5-flash-lite` string. Correct the candidate model identifier only through a reviewed registry change.

Official sources:
- Gemini rate limits (project-scoped): https://ai.google.dev/gemini-api/docs/rate-limits
- Gemini pricing/model availability: https://ai.google.dev/gemini-api/docs/pricing
- Gemini billing tiers: https://ai.google.dev/gemini-api/docs/billing
- Groq rate limits: https://console.groq.com/docs/rate-limits

Gemini's published Free tier does not establish the account's current numeric limits. Read the exact project limits from AI Studio only after the credential and execution gates are accepted. Google documents that Free tier and paid tier are distinct; do not infer that a configured API key is attached to Free tier.

## Groq finding

Groq publishes RPM/RPD/TPM/TPD limits and states that limits apply at organization level. The rate-limit table is not proof that a particular credential is entitled to a free plan. The GPT-OSS candidate remains disabled until plan entitlement and current account limits are independently verified.

## Pilot guardrails (internal, not provider quotas)

After all gates pass, begin with one route at a time and conservative Cloud Pool caps:
- max concurrency per verified quota domain: 1;
- max 5 requests/minute;
- max 100 requests/day;
- max input: 16,000 tokens/request;
- max output: 4,096 tokens/request;
- paid spend: USD 0;
- HTTP 402, billing prompt, unknown cost, unknown account, or missing quota evidence: hard deny.

The effective limit is always the lower of the internal cap and the provider's verified current limit. These are proposed internal controls, not claimed provider allowances.

## Activation order

1. Gemini `gemini-3.8-flash`: first candidate because official pricing lists Free-tier availability; still BLOCKED pending Issue #26 gates, account/project metadata, exact quotas and corrected registry mapping. Four keys must share one project quota ledger if they share a project.
2. SiliconFlow: test candidate catalog/entitlement, then quota domain and exact per-model limits.
3. Novita.
4. Z.ai.
5. SambaNova.
6. Groq GPT-OSS only after Free-plan entitlement is proven.
7. Cloudflare Workers AI with separate account IDs and account quota domains.
8. Remaining Kimi, LLM7, Aion Labs, router, Mistral and Hugging Face candidates after model-specific cost/limit proof.

This order is a qualification queue, not permission to invoke providers. Each model is enabled separately only after the preceding route has an immutable evidence bundle and review.

## Immediate blocking conditions

- Issue #26 is still OPEN / NOT ACCEPTED.
- PR #28/#29 are draft and unmerged; PR #29's old formal review must be reconciled with its latest source and exact-head CI.
- PR #107 has no formal review and is not production-integrated.
- Secret presence, actual account identities, quota domains and numeric provider quotas are not verified.
- Cloud Pool-native dispatch/controller and secret delivery are not accepted.
- No provider calls were made in this pass.

## Acceptance definition for one model

A model may move from PLANNED to QUALIFIED only when the evidence record binds provider, exact model ID, credential slot reference, account/project, quota domain, current zero-price source, RPM/RPD/TPM/TPD/concurrency/reset, verification timestamp/expiry, no-paid-fallback test result, auth result, CI SHA, reviewer and revocation state. Activation remains disabled if any field is unknown.

## Next bounded engineering step

Reconcile PR #29 at its current immutable head, run exact-head tests, and close the active-slot eligibility finding. In parallel, prepare a no-secret Gemini credential metadata/account-domain reconciliation contract; do not read secret values or make provider calls. Only after Issue #26 acceptance can one model be activated under the pilot caps.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
