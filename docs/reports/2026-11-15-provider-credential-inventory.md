# Provider credential inventory — 2026-11-15

## Scope and immutable sources

- Cloud Pool repository: `VlDMlNSh/developer-cloud-pool`.
- Inventory source repository: `VlDMlNSh/mediahub-os`, default branch `main`, observed source HEAD: `41c13e1c2b17ac48dc51c9963a9cda140f79ddb0`.
- Registry path: `ops/qualification/provider_model_registry.json`.
- Registry blob SHA-256-independent Git blob identity: `8c0f95d33a6fc85128b3a7aa37157c2dca74bbca`.
- Registry schema: `mediahub.provider-model-registry.v1`.
- Registry `selection_order`: exactly 24 cloud slots. The file also contains one local Ollama route, excluded from the 24 cloud slots.
- Cloud Pool default branch `Основной` observed HEAD before this documentation change: `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`.
- This is a documentation-only inventory. No secrets, values, tokens, GitHub Actions secret metadata, provider endpoints or quota endpoints were queried.

## Inventory: 24 configured cloud slots

The rows below reproduce the registry's slot IDs, provider families, credential *environment-variable references*, configured cost class and persistence class. They do not prove that a GitHub secret exists, that a credential is valid, that two slots belong to separate upstream accounts, or that a free quota is currently available.

| # | Slot ID | Provider | Credential references (names only) | Registry cost class | Persistence class |
|---:|---|---|---|---|---|
| 1 | mimo-1 | Xiaomi MiMo | `MIMO_API_KEY` | paid_api | api |
| 2 | siliconflow-1 | SiliconFlow | `SILICONFLOW_API_KEY_1`, `SILICONFLOW_API_KEY` | free | permanent_free |
| 3 | siliconflow-2 | SiliconFlow | `SILICONFLOW_API_KEY_2` | free | permanent_free |
| 4 | novita-1 | Novita | `NOVITA_API_KEY_1`, `NOVITA_API_KEY` | free | permanent_free |
| 5 | novita-2 | Novita | `NOVITA_API_KEY_2` | free | permanent_free |
| 6 | zai-1 | Z.ai | `ZAI_API_KEY_1`, `ZAI_API_KEY` | free | permanent_free |
| 7 | zai-2 | Z.ai | `ZAI_API_KEY_2` | free | permanent_free |
| 8 | kimi-1 | Kimi | `KIMI_API_KEY`, `MOONSHOT_API_KEY` | free | free_tier |
| 9 | llm7-1 | LLM7 | `LLM7_API_KEY` | free | free_tier |
| 10 | sambanova-1 | SambaNova | `SAMBANOVA_API_KEY` | free | free_tier |
| 11 | aionlabs-1 | Aion Labs | `AIONLABS_API_KEY` | free | free_tier |
| 12 | cloudflare-1 | Cloudflare | `CLOUDFLARE_API_TOKEN_1`, `CLOUDFLARE_API_TOKEN`; account ref `CLOUDFLARE_ACCOUNT_ID_1` | free | workers_ai |
| 13 | cloudflare-2 | Cloudflare | `CLOUDFLARE_API_TOKEN_2`; account ref `CLOUDFLARE_ACCOUNT_ID_2` | free | workers_ai |
| 14 | nararouter-1 | NaraRouter | `NARAROUTER_API_KEY_1`, `NARAROUTER_API_KEY` | router | router |
| 15 | orcarouter-1 | OrcaRouter | `ORCAROUTER_API_KEY` | router | router |
| 16 | unorouter-1 | UnoRouter | `UNOROUTER_API_KEY` | router | router |
| 17 | zerouter-1 | ZeroRouter | `ZEROUTER_API_KEY` | router | router |
| 18 | deepseek-1 | DeepSeek | `DEEPSEEK_API_KEY` | paid_api | api |
| 19 | gemini-1 | Google Gemini | `GEMINI_API_KEY` | free_tier | free_tier |
| 20 | groq-1 | Groq | `GROQ_API_KEY` | free_tier | free_tier |
| 21 | mistral-1 | Mistral | `MISTRAL_API_KEY_1` | free_tier | free_tier |
| 22 | mistral-2 | Mistral | `MISTRAL_API_KEY_2` | free_tier | free_tier |
| 23 | openrouter-1 | OpenRouter | `OPENROUTER_API_KEY` | router | router |
| 24 | huggingface-1 | Hugging Face | `HF_TOKEN` | free_tier | free_tier |

Local route outside the 24-slot cloud inventory: `ollama-local-1` (Ollama Local; local cost/persistence class).

## What is and is not verified

| Dimension | Status | Evidence / limitation |
|---|---|---|
| 24 configured slot IDs and selection order | VERIFIED | Exact registry read at source HEAD above; 24 IDs parsed and counted. |
| Credential reference names in the registry | VERIFIED | Names only; no values retrieved. |
| GitHub Actions secret existence / metadata / scope | NOT VERIFIED | Connected GitHub interface does not expose repository Actions secret metadata. Secret values were not requested. |
| Credential validity / authentication | NOT RUN | No provider calls or authentication probes. |
| Provider account / project identity per slot | NOT VERIFIED | Registry has no account identity for most slots; Cloudflare has account-ID variable references only. |
| Independent upstream quota domains | NOT VERIFIED | Suffixes such as `_1` and `_2` do not prove separate accounts or quota. |
| Current free-tier eligibility, limits and reset windows | NOT VERIFIED | Registry cost labels are configuration claims, not live provider entitlement evidence. |
| Model availability / route health | NOT RUN | No live inference or model-list calls. |
| Runtime secret placement in Cloud Pool | NOT VERIFIED | This inventory does not prove any secret is available to the Cloud Pool runtime. |

## Immediate architecture findings

1. The 24 slots are logical registry entries, not 24 proven independent credentials or 24 independent quota pools.
2. Same-provider slots must be grouped by independently evidenced provider account/project/org and actual quota domain before parallel use or failover. Unknown domain means conservative shared-domain treatment.
3. Credential references are not all interchangeable. Alias pairs (for example the unsuffixed and `_1` references) are alternative environment lookup names within one slot, not additional slots.
4. Registry cost labels must not authorize routing by themselves. Only currently verified free eligibility may enter the free execution pool. `paid_api` routes remain disabled under the no-paid-fallback project constraint; router products also require evidence that the selected model and route are genuinely free.
5. Each admitted slot needs immutable `credential_ref`, provider/account/project identity, quota-domain ID, model allowlist, billing class, qualification evidence, freshness, and revocation state. Secret material remains in its consuming runtime's secret store.
6. No key rotation to evade 401/403/402/429, no account mixing, no silent paid fallback, and no automatic secret copying/transfer.

## PR reconciliation

- [PR #88 — hybrid parallel development](https://github.com/VlDMlNSh/developer-cloud-pool/pull/88): OPEN / DRAFT / UNMERGED at head `36089f56f19fadeb3ec77b580d22504b1a240540`, base `Основной` at `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`. Exact-head check-runs endpoint returned zero runs; CI is NOT VERIFIED.
- [PR #89 — six logical roles and quota failover](https://github.com/VlDMlNSh/developer-cloud-pool/pull/89): OPEN / DRAFT / UNMERGED at head `290966b7dd17c72411c2f6d8b9db7d9d930f1a2d`, same base SHA. Exact-head run [43715229460](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43715229460), job `132815216309`, reports SUCCESS for workflow syntax/security invariants. This is one check, not independent review or runtime qualification.
- PR #89 correctly distinguishes six logical roles from the 24 credential slots and prohibits quota-evasion rotation. Its quota-ledger integration remains pending; it must not turn all 24 rows into active executors by default.
- Recommended operating model: adaptive logical roles over a dynamic, policy-qualified provider pool. Executor count is selected per task from qualified independent quota domains and resource limits, not from key count.

## Next bounded work

1. Add a machine-readable Cloud Pool provider-slot manifest referencing these 24 slots without secret values.
2. Add metadata-only owner-controlled attestation for secret presence/scope, if a supported authorized interface becomes available; do not infer existence from YAML references.
3. Gather account/project and quota-domain evidence separately for each slot, preserving distinct identities.
4. Add deterministic tests: duplicate aliases, shared/unknown quota domains, paid-route denial, 401/403/402 classification, 429 scoped cooldown, fail-closed ledger unavailability, revocation and stale evidence.
5. Only after these checks should provider qualification probes be considered under the approved governance path. Do not dispatch agents or call providers as part of this inventory pass.

## Canonical references

- [MediaHub provider registry](https://github.com/VlDMlNSh/mediahub-os/blob/41c13e1c2b17ac48dc51c9963a9cda140f79ddb0/ops/qualification/provider_model_registry.json)
- [MediaHub cloud authorization baseline](https://github.com/VlDMlNSh/mediahub-os/blob/41c13e1c2b17ac48dc51c9963a9cda140f79ddb0/docs/architecture/MH-CLOUD-AUTH-BASELINE.md)
- [Cloud Pool Context Window](../context/GITHUB-CONTEXT-WINDOW.md)
- [Canonical MediaHub map](https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md)
