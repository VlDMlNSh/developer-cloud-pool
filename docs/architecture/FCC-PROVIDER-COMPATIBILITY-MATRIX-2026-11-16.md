# FCC Provider Compatibility Matrix — 2026-11-16

Status: DESIGN / SOURCE-REVIEW ONLY. No FCC installation, provider credential, live request, or runtime qualification is claimed.

## 1. Source identity and provenance

The FCC component referred to in the Cloud Pool target architecture is provisionally identified as **Free Claude Code**:

- Repository: https://github.com/Factix/fcc
- Default branch: `main`
- Repository ID: `1253171427`
- Read-only observed latest commit: `8ae7795961f05f425bd3e7418f85f2ccec7f4600`
- README blob SHA: `7e72ee4efcbf98155b523b2fe97b57207d746aa3`
- pyproject.toml blob SHA: `0e823c5ebec237644cfcd7ea9cc29a5e909e4443`
- LICENSE blob SHA: `e1749833921e7e82b674fd5ef752545c53c97547`
- Declared license: MIT
- Declared Python requirement: >=3.14.0
- README describes an Anthropic Messages API compatibility proxy and 17 provider backends.

This is an upstream source identification, not evidence that the repository is installed in Cloud Pool. The latest commit returned by the connected GitHub source was dated 2026-05-24; release freshness and current maintenance cadence must be reassessed before pinning a deployment version. Do not use floating `main` in production: pin an immutable commit and verify the downloaded source digest.

The upstream README contains install examples referring to Alishahryar1/free-claude-code paths while the inspected repository is Factix/fcc. Treat this provenance mismatch as a qualification item: establish canonical upstream ownership, release lineage, and reproducible install artifact before deployment.

## 2. FCC provider adapters documented by upstream

FCC's README enumerates the following built-in providers. “Documented” means the adapter is named and described upstream; it does not mean the current account has a credential, the model is free, or the route has passed a live compatibility test.

| Provider / route | Adapter protocol described by README | Credential / configuration notes | Cloud Pool disposition |
|---|---|---|---|
| NVIDIA NIM | OpenAI-compatible adapter | NVIDIA_NIM_API_KEY; nvidia_nim/ model prefix | Candidate; free entitlement and model-specific limits must be checked |
| OpenRouter | OpenAI-compatible adapter | OPENROUTER_API_KEY; open_router/ prefix | Existing slot candidate; free models are dynamic and rate-limited, no paid fallback |
| Google AI Studio / Gemini | OpenAI-compatible endpoint | GEMINI_API_KEY; gemini/ prefix; free quotas per model | Existing slot candidate; verify data-use terms, quota and tool-call compatibility |
| DeepSeek | Native Anthropic-compatible Messages endpoint | DEEPSEEK_API_KEY; deepseek/ prefix | Existing slot candidate; verify native Messages feature behavior |
| Mistral La Plateforme | OpenAI-compatible Chat Completions | MISTRAL_API_KEY; mistral/ prefix; README refers to Experiment tier | Existing slot candidate; tier/quotas must be checked |
| Mistral Codestral | OpenAI-compatible Chat Completions | Separate CODESTRAL_API_KEY; mistral_codestral/ prefix | Separate candidate slot; do not assume same quota as Mistral general API |
| OpenCode Zen | OpenAI-compatible gateway | OPENCODE_API_KEY; opencode/ prefix | New candidate; classify billing and free eligibility before enablement |
| OpenCode Go | OpenAI-compatible gateway, separate upstream path | Same OPENCODE_API_KEY; opencode_go/ prefix | Same account credential as Zen; not an independent account/quota by default; likely subscription/paid class unless verified otherwise |
| Wafer | Native Anthropic-compatible Messages endpoint | WAFER_API_KEY; wafer/ prefix | New candidate; commercial terms and quota need verification |
| Kimi / Moonshot | Native Anthropic-compatible Messages endpoint; model discovery uses OpenAI-compatible models API | KIMI_API_KEY; kimi/ prefix | Existing slot candidate |
| Cerebras Inference | OpenAI-compatible Chat Completions | CEREBRAS_API_KEY; cerebras/ prefix | Optional evaluation; promotional credit is not permanent free capacity |
| Groq | OpenAI-compatible Chat Completions | GROQ_API_KEY; groq/ prefix | Existing slot candidate |
| Fireworks AI | Native Anthropic-compatible Messages endpoint | FIREWORKS_API_KEY; fireworks/ prefix | New candidate; pricing and free access must be verified |
| Z.ai | Native Anthropic-compatible Messages endpoint | ZAI_API_KEY; zai/ prefix | Existing slot candidate |
| LM Studio | Local provider | Local base URL; lmstudio/ prefix | Local candidate; private network and tool-use qualification required |
| llama.cpp | Local Anthropic-compatible Messages endpoint | Local base URL; llamacpp/ prefix | Local candidate; server build, context and tool-use qualification required |
| Ollama | Local provider | OLLAMA_BASE_URL is server root; ollama/ prefix | Existing local candidate; private authenticated endpoint and model capabilities required |

Provider list is transcribed from the inspected upstream README. It should be checked against the pinned source code and tests during qualification.

## 3. Mapping against the Cloud Pool provider inventory

Historical MediaHub registry contains 24 cloud credential slots plus a local Ollama route. It is an inventory of intended slots, not proof of secret presence, validity, account separation, entitlement, or quota.

### 3.1 Existing slots with an FCC built-in adapter

- DeepSeek
- Gemini / Google AI Studio
- Groq
- Kimi / Moonshot
- Mistral La Plateforme
- OpenRouter
- Z.ai
- Ollama (local)

These are the preferred first candidates for Profile A because no custom FCC provider adapter should be needed according to the upstream README. They still require adapter-level review and live qualification. Do not enable multiple routes simultaneously during the first proof.

### 3.2 Existing slots without a built-in FCC adapter documented in the inspected README

- Xiaomi MiMo
- SiliconFlow (both slots)
- Novita (both slots)
- LLM7
- SambaNova
- Aion Labs
- Cloudflare Workers AI (both slots)
- NaraRouter
- OrcaRouter
- UnoRouter
- ZeroRouter
- Hugging Face Inference Providers

Do not configure these by guessing a provider prefix or by assuming that OpenAI compatibility is sufficient. They require one of:
1. a supported FCC generic/custom OpenAI-compatible adapter with explicit endpoint and request/response tests;
2. a native Anthropic Messages adapter where the provider actually supports that protocol; or
3. a separate, qualified gateway such as LiteLLM, provided the exact FCC-to-gateway protocol and tool semantics pass end-to-end tests.

Do not add custom adapters to upstream FCC until a documented gap and test contract exist. Prefer configuration/reuse over maintaining a fork.

### 3.3 New FCC provider registrations worth evaluating

- NVIDIA NIM — strongest additional candidate for coding workloads; hosted free access is development/evaluation scoped and must not be treated as permanent production-free.
- Cerebras — optional benchmark candidate only; any promotional credit is temporary and not a stable free quota.
- Mistral Codestral — separate API key and endpoint; evaluate only after account terms are verified.
- OpenCode Zen — useful consolidated gateway candidate, but classify the actual plan and provider terms before enabling.
- Wafer — candidate with a native Anthropic Messages endpoint; verify pricing, data handling and rate limits.
- Fireworks AI — candidate with native Anthropic Messages endpoint; verify plan and quota.
- LM Studio / llama.cpp — local alternatives, not cloud registrations.

OpenCode Go is listed by FCC but should not be counted as a free route or independent account. The README states Zen and Go share the same API key; their upstream paths and model catalogs differ.

## 4. Protocol compatibility is not model equivalence

FCC translates Claude Code's Anthropic Messages traffic to provider-specific APIs. Compatibility must be tested feature by feature:

- streaming and partial tool-call deltas;
- tool-use schema and tool-result round trips;
- multi-tool turns and parallel tool calls;
- stop reasons and max-token behavior;
- system/developer prompt mapping;
- thinking/reasoning blocks and signatures;
- prompt caching behavior;
- context window and auto-compaction;
- images and document inputs, where supported;
- cancellation, timeout and retry semantics;
- model discovery and model identifier stability;
- structured output / JSON behavior.

A provider may pass simple text chat and still fail coding-agent workflows. Native Anthropic Messages adapters are not automatically identical to Anthropic's own model API. OpenAI-compatible transports may lose provider-specific reasoning or tool semantics. Each model ID must have its own qualification record.

## 5. Recommended Profile A architecture

```text
Pool Bridge
   |
   | signed task envelope + route capability
   v
FCC (private loopback service; no public Admin UI)
   |
   +--> provider adapter
   |      |
   |      +--> one allowlisted cloud provider/model
   |      +--> or private local model endpoint
   |
   v
Claude Code process
   |
   v
ECC (separate component; separate qualification)
   |
   v
isolated task workspace -> artifacts -> independent review
```

Important boundary: FCC is a protocol adapter/router for Claude Code, not the Cloud Pool authority plane. It must not own task admission, repository leases, quota truth, owner identity, or final acceptance.

Pool Bridge remains responsible for:
- owner and task authorization;
- immutable target SHA;
- task capability and model allowlist;
- durable quota reservation and settlement;
- provider account/quota-domain selection;
- paid-route denial;
- worker isolation and cancellation;
- provenance and audit.

FCC must bind to loopback or a private authenticated network. Its README describes the Admin UI as local-only. Do not publish its Admin UI directly to the internet or expose provider secrets to Jarvis/browser clients. Admin configuration must be managed by a narrowly authorized operator path, not by arbitrary agents.

## 6. Route qualification record

Create one record per provider-account-model tuple. Minimum fields:

- `route_id`
- `fcc_source_commit`
- `fcc_adapter_id`
- `provider`
- `provider_account_ref`
- `quota_domain_id`
- `credential_ref` (reference only; never secret value)
- `model_id` (exact immutable provider model identifier where possible)
- `protocol` (Anthropic Messages / OpenAI Chat Completions / local)
- `billing_class` (permanent_free / restricted_free / promotional_credit / paid_disabled / local)
- `terms_reviewed_at`
- `feature_test_profile`
- `tool_use_test`
- `streaming_test`
- `reasoning_test`
- `context_limit_test`
- `quota_limit_evidence`
- `last_qualified_at`
- `status`

Unknown billing, unknown account identity, unknown quota domain, missing feature evidence, or unavailable quota ledger => route disabled (fail-closed).

## 7. Recommended enablement order

1. Pin and provenance-check FCC source/release, review MIT license and dependency supply chain.
2. Review configuration storage, local Admin UI authentication, bind address, secret handling, logging redaction and process permissions.
3. Qualify one existing slot: choose a model with a confirmed no-cost or explicitly authorized test allowance; never assume free status from provider name.
4. Test Claude Code text, streaming, tool call, tool result, multi-step coding task, cancellation and context compaction.
5. Repeat for a second provider only after the first route is stable.
6. Add custom provider adapters only for existing inventory gaps and only with upstream protocol contract tests.
7. Qualify FCC -> Claude Code -> ECC as a single execution profile after separate FCC and ECC checks.
8. Keep Profile B (Claude Code #2 -> OmniRouter) independent from Profile A.

No provider call, credential read, installation, or deployment was performed for this report.

## 8. Sources

- FCC repository: https://github.com/Factix/fcc
- FCC README: https://github.com/Factix/fcc/blob/main/README.md
- FCC pyproject: https://github.com/Factix/fcc/blob/main/pyproject.toml
- FCC license: https://github.com/Factix/fcc/blob/main/LICENSE
- LiteLLM provider matrix (useful for evaluating possible separate gateway adapters, not proof of FCC support): https://docs.litellm.ai/docs/providers
- Cloud Pool target architecture: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/architecture/CLOUD-POOL-TARGET-ARCHITECTURE-2.0.md
- MediaHub provider registry: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/ops/qualification/provider_model_registry.json

## 9. Current conclusion

FCC is a promising, relatively direct compatibility layer for Profile A, but it is not yet qualified for Cloud Pool. The best immediate route candidates from the existing inventory are DeepSeek, Gemini, Groq, Kimi, Mistral, OpenRouter and Z.ai, with Ollama as a local candidate. MiMo, SiliconFlow, Novita, LLM7, SambaNova, Aion Labs, Cloudflare Workers AI, the four router services and Hugging Face require a separate supported adapter or a qualified intermediary.

Contour A remains BLOCKED / NOT ACCEPTED. Contour B remains DEFERRED.
