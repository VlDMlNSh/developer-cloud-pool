# Slot activation policy and renewable-quota capacity assessment

**Date:** 2026-11-06  
**Status:** POLICY IMPLEMENTED AS PURE PLANNER / RUNTIME LEASES NOT IMPLEMENTED  
**Issue:** [#26](https://github.com/VlDMlNSh/developer-cloud-pool/issues/26)  
**PR:** [#29](https://github.com/VlDMlNSh/developer-cloud-pool/pull/29)

## 1. Capacity decision

The pool supports an unbounded registered-slot inventory and a hard maximum of **20 simultaneously active credential slots**.

These are separate quantities:

- Registered: metadata exists in the inventory. No secret is loaded, no provider connection is made, and no quota is consumed.
- Eligible: evidence, credential availability, model capability and billing policy permit use.
- Active: a short-lived task lease allows the gateway to use the credential reference.
- Idle/parked: no active lease; the slot remains registered and can be selected by a later task.

The 20-slot cap is pool-wide and is not the same as GitHub's 20 concurrent hosted-runner planning ceiling. Provider slots are logical upstream routes; runner jobs are execution environments. Either limit can constrain throughput independently.

The gateway alone may resolve upstream credentials. Agent workers receive task-scoped gateway access, never provider API keys. The router should activate only routes needed by the task, and release their leases after completion or verified idle expiry.

## 2. Admission contract

A route may be activated only if:
1. `qualificationStatus=accepted`;
2. `credentialStatus=available` from the approved secret boundary (metadata only);
3. `routeState=ready`;
4. requested model is allowlisted;
5. billing class is explicitly allowed by task policy;
6. pool-wide active lease count remains at or below 20.

Admission must be atomic in a shared durable lease store. If the lease store is unavailable, admission fails closed. The pure planner added in this PR only computes a deterministic plan; it does not acquire leases, resolve credentials or perform provider requests. Production runtime integration remains NOT IMPLEMENTED.

## 3. Renewable quota means provider reset, not key rotation

A slot becomes eligible again only after a provider-documented reset boundary or authoritative provider response. A new key in the same account does not create a new quota. Multiple keys in one account/project may share the same rate/usage budget. Unknown quota domains must not be summed.

## 4. Inventory-derived quota estimate — 24 registered cloud slots

The MediaHub registry has 24 cloud slots. The following are *publicly documented plan ceilings*, not verified balances for the credentials in the repository. They are not safe to add together unless the account and quota-domain independence is established.

| Provider/slot | Publicly documented free allowance | Accounting note |
|---|---:|---|
| Aion Labs `aionlabs-1` | 20,000 tokens/day on Free tier | Official docs; tier and account remain unverified |
| LLM7 `llm7-1` | Up to 100,000 tokens per rolling 24 hours | Official service terms; may be reduced; input + output count |
| Cloudflare `cloudflare-1/2` | 10,000 Neurons/day on Workers Free | Neurons are not tokens; two slots must not be counted twice without account evidence |
| NaraRouter `nararouter-1` | Public pages conflict: 5M/day in docs and 7M/day on pricing | Model `default` does not identify a model class; exclude from numeric total until reconciled |
| UnoRouter `unorouter-1` | Free model request-window limit published as 1 successful request/minute/model | Not a token/day allowance; model availability and user quota are not guaranteed |
| Hugging Face `huggingface-1` | $0.10 monthly credits for Free users | Dollar credit, not a token quota; model/provider-dependent conversion |
| Google Gemini `gemini-1` | Project/model-specific RPM, TPM and RPD | Active limits are shown in AI Studio; no universal fixed daily number |
| Groq `groq-1` | Model/org-specific RPM, RPD, TPM and TPD | Exact row depends on model and current account tier |
| Mistral `mistral-1/2` | Free mode has lowest limits; account/org tier and model determine values | No reliable fixed daily token total in public summary |
| Xiaomi MiMo `mimo-1` | Published RPM/TPM, but listed API pricing is pay-as-you-go | Not counted as free daily capacity |
| SambaNova `sambanova-1` | Free plan requires payment method and purchased credits to run requests | Not treated as free usable quota |
| DeepSeek `deepseek-1` | Concurrency limits are published; no daily free-token allowance established | Registry class `trial` is not proof of free balance |
| SiliconFlow `siliconflow-1/2`, Novita `novita-1/2`, Z.ai `zai-1/2` | Account/model/tier-specific or not independently verified in this pass | Duplicate slots are not independent quotas without account evidence |
| OrcaRouter, ZeroRouter, OpenRouter | No verified free daily allowance for the exact registered model/account | Excluded from numeric total |

### Conservative arithmetic

Two explicit public token allowances can be expressed in the same unit:

- Aion Labs Free: 20,000 tokens/day.
- LLM7 Free: up to 100,000 tokens/rolling 24h.

**Documented potential subtotal: up to 120,000 tokens per day**, conditional on both slots having valid Free-tier accounts, matching current terms, and independent quota domains. This is not a verified allowance for the credentials in GitHub and is not a guaranteed minimum.

Cloudflare's 10,000 Neurons/day is additional compute allowance but cannot be converted into tokens without the model-specific neuron cost and workload mix. Other providers may add capacity, but their current account quotas are not established here.

NaraRouter is deliberately excluded from the subtotal because its official documentation pages disagree (5M vs 7M daily base allowance), and the registry's model is `default`, not a verified model mapping. Do not use the higher number until reconciled.

## 5. What is actually verified now

- 24 cloud slot definitions exist in the registry-derived inventory.
- The registry's declared cost class is metadata only.
- No secret values or secret-presence metadata were read.
- No account IDs, projects, organizations or quota domains were verified.
- No provider API calls were made.
- Actual available daily quota from the GitHub-stored credentials: **NOT VERIFIED / cannot be calculated from secret names or slot count**.

GitHub Secrets are opaque values. A secret does not expose its provider account tier, remaining balance, project, quota reset, or whether another secret belongs to the same quota domain. This assessment does not inspect secret values or test credentials.

## 6. Sources

- Aion Labs rate limits: https://www.aionlabs.ai/docs/rate-limits/
- LLM7 service terms: https://github.com/chigwell/llm7.io/blob/main/TERMS.md
- Cloudflare Workers AI pricing: https://developers.cloudflare.com/workers-ai/platform/pricing/
- NaraRouter docs: https://router.bynara.id/docs
- NaraRouter pricing: https://router.bynara.id/pricing
- UnoRouter free model wait policy: https://unorouter.com/en/blog/server-tag-cuts-free-model-wait
- Hugging Face Inference Providers pricing: https://huggingface.co/docs/inference-providers/pricing
- Gemini API limits: https://ai.google.dev/gemini-api/docs/rate-limits
- Groq rate limits: https://console.groq.com/docs/rate-limits
- Mistral rate limits: https://help.mistral.ai/en/articles/698531-why-am-i-hitting-api-rate-limits-and-how-do-i-increase-them
- Xiaomi MiMo rate limits: https://mimo.mi.com/docs/en-US/api/guidance/rate-limit
- Xiaomi MiMo pricing: https://mimo.mi.com/docs/en-US/pricing
- SambaNova plans: https://cloud.sambanova.ai/plans
- DeepSeek rate limits: https://api-docs.deepseek.com/quick_start/rate_limit/

## 7. Next qualification gate

Obtain non-secret, owner-authorized metadata per slot: provider account/project opaque reference, account tier, exact model entitlement, quota scope, reset policy and dated evidence URL or dashboard export. This must be supplied through an approved metadata process; do not copy API keys or credential values into the inventory. Then reconcile duplicate slots by quota domain and compute a conservative capacity range.
