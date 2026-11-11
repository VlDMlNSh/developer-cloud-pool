# Provider Credential Inventory and Additive Agent Capacity Plan — 2026-11-11

- Scope: Contour A / Cloud Development Pool only.
- Pool default baseline: `Основной` @ `6fdcedebeba62715122e43a75c6ad6d926321ce7`.
- Documentation branch: `docs/issue38-free-claim-backend-fit-2026-11-11` (working branch; not merged/accepted).
- MediaHub source baseline: `main` @ `41c13e1c2b17ac48dc51c9963a9cda140f79ddb0`.
- Provider registry blob: `8c0f95d33a6fc85128b3a7aa37157c2dca74bbca`.
- Agent registry blob: `0317d1e794aa80cd0fa22bd953b95921b26aafd3`.
- Model router policy blob: `e249333c1c0ce6c1c586a5f498dbfd3979418f6e`.
- Provider qualification workflow blob: `d3160088fbef4fce152ed7335f0acaa3bb440378`.
- Gemini dispatch controller blob: `0a1246f6755020faf8b7e48d07bfff790bbaece3`.

## 1. Executive result

The repository contains a substantial provider inventory and an existing task-scoped agent-role model. This is enough to design additional *logical agent workers* and a safe routing/qualification plan. It is not evidence that all credentials exist, that every provider is reachable, or that their free quotas are currently usable.

No secret values were read. No provider API request, model inference, new dispatch, runner execution, credential copy, or infrastructure provisioning was performed in this pass.

The GitHub repository-content interface available to this audit explicitly does not support GitHub Secrets API endpoints. Consequently, this pass cannot enumerate the actual configured secret names, repository/environment scope, timestamps, or existence. Workflow references are configuration references only; they do not prove that a corresponding secret is configured or valid.

## 2. Live repository state checked

- Cloud Pool repository default branch is `Основной`; default HEAD observed: `6fdcedebeba62715122e43a75c6ad6d926321ce7`.
- Cloud Pool PR #64 remains OPEN/DRAFT/UNMERGED; base is the above default SHA; head observed: `463e9a0b128bf25a1f3afe440dddaff90fc43a69`.
- Cloud Pool Issue #26 (account-isolated multi-provider routing) remains OPEN.
- Cloud Pool Issue #38 (durable Supervisor task claims) remains OPEN.
- Cloud Pool active ruleset collection contains ID `26550182`, name `Основной — verified`, enforcement `active`. Full ruleset conditions were not inspected in this pass; no merge or dispatch decision is inferred.
- Recent Pool Supervisor schedule run `42994815115` completed SUCCESS at default SHA `6fdcedebeba62715122e43a75c6ad6d926321ce7`. This is a workflow run result, not proof of a live provider worker or a deployed cloud pool.
- MediaHub Gemini Wave 478 child PRs #637/#636/#635 are still open; exact-head validation runs observed `action_required`. They are not qualified agent capacity.

## 3. Provider inventory and credential-reference evidence

MediaHub registry `ops/qualification/provider_model_registry.json` defines 24 ordered cloud credential slots plus one local Ollama entry (25 provider records total). The selection order includes distinct slots for SiliconFlow (2), Novita (2), Z.ai (2), Cloudflare (2) and Mistral (2). Distinct slot IDs must remain separate; do not collapse them merely because they share a provider brand.

The registry includes these provider families:
- Xiaomi MiMo
- SiliconFlow (two slots)
- Novita (two slots)
- Z.ai (two slots)
- Kimi / Moonshot
- LLM7
- SambaNova
- Aion Labs
- Cloudflare Workers AI (two account slots)
- NaraRouter
- OrcaRouter
- UnoRouter
- ZeroRouter
- DeepSeek
- Google Gemini
- Groq
- Mistral (two slots)
- OpenRouter
- Hugging Face
- Ollama Local (no cloud credential)

The registry labels several routes `free`, `free_tier`, `permanent_free`, `router`, or `paid_api`. These are repository metadata classifications, not fresh evidence of current provider pricing, account entitlement, quota, or zero-cost eligibility. Model availability and free-tier rules can change independently of this file.

The workflow `.github/workflows/astra-provider-qualification.yml` references provider credential environment variables for most of the cloud registry and two Cloudflare account IDs. It maps them together into one self-hosted provider qualification job labelled `mediahub-provider`, with an explicit hostname/user check for `mh-dev-02`. The workflow's sanitized summary suppresses secret values. However:
- the workflow reference does not prove that each secret exists;
- it does not prove that each referenced key is valid or has quota;
- the job-wide environment creates a broad credential exposure surface for the qualification process;
- a compromised qualification script, dependency, runner, or child process could potentially access all injected credentials in that job;
- the registry and workflow do not by themselves prove that each account/slot has independent quota.

The safer next design is one provider/account-slot per isolated job, with only that slot's credential reference injected, a minimal read-only qualification operation, strict output allowlisting, and no raw request/response bodies in artifacts.

## 4. Aion Labs + LLM7 illustrative budget

Owner-provided research figures:
- Aion Labs Free: 20,000 tokens/day.
- LLM7 Free: 100,000 tokens/day.
- Arithmetic sum: 120,000 tokens/day.

Disposition: PLANNING ESTIMATE / NOT VERIFIED.

Do not treat 120,000 as one fungible pool. Track at least:
- provider and account/credential-slot identity;
- model identifier and model-specific limits;
- daily/monthly token budget, if the provider publishes one;
- request-per-minute and concurrency limits;
- input/output token accounting semantics;
- reset timezone and reset boundary;
- context window and max output tokens;
- HTTP 401/403/402/429/5xx classification;
- observed remaining quota only when a provider exposes it authoritatively;
- evidence timestamp and expiry;
- billing mode and a hard paid-fallback deny.

The Aion Labs and LLM7 registry entries are currently classified as free-tier metadata, with one slot each. This is consistent with the illustrative research, but it does not verify the quoted numerical quotas or account state.

## 5. Existing agent architecture — reuse, do not fork role taxonomy

MediaHub's canonical agent registry defines:
- A0 Astra: single coordination authority;
- A1 Architect: architecture/contract work;
- A2 Builder: bounded implementation;
- A3 Verifier: independent verification.

Dynamic workers reuse A1/A2/A3. The registry sets default parallel workers to 3, adaptive hard limit to environment-reconciled, prohibits nested delegation, and blocks conflicting writes. The role table explicitly warns against creating permanent specialist roles without an architecture-change stage proving necessity.

The approved Gemini controller currently supports fixed `probe`, `agents`, and `review` modes. Its `agents` mode dispatches exactly three fixed Gemini child workflows. It does not accept arbitrary task payloads from this chat. Do not bypass it or manually call child workflows.

The MediaHub model-router policy is explicitly `policy_only`: direct provider API calls are false, only named controller transports are allowlisted, paid fallback is false, unknown routes fail closed, and production authorization is human-controlled. This policy must remain authoritative; provider credentials do not authorize new transports.

## 6. Proposed additive task-scoped agent workers

These are bounded task profiles implemented by reusing A1/A2/A3 roles, not new permanent authorities. Initially they can run as static analysis/contract tasks with no provider secrets.

| Task profile | Canonical role | Initial provider class | Bounded deliverable | Credential access |
|---|---|---|---|---|
| Provider Inventory Auditor | A1 Architect | none | Reconcile registry, workflow references, account-slot identities and evidence gaps | none |
| Provider Qualification Verifier | A3 Verifier | none initially | Review per-provider qualification contract, negative cases, sanitized evidence schema | none; live key only in separately approved provider-specific job |
| Quota Ledger Engineer | A2 Builder | none | Implement/test account-isolated quota state machine and reset/cooldown semantics | none |
| Model Capability Evaluator | A1 Architect | none | Map models to coding/reasoning/general/fast/context capability using sourced metadata | none |
| Router Policy Engineer | A2 Builder | none | Implement route selection policy, account isolation, budget guard, paid-fallback deny | none |
| Reliability / Rate-Limit Auditor | A3 Verifier | none | Test 401/403/402/429/5xx handling, cooldown, retry ceilings and circuit breaking | none |
| Agent Task Planner | A1 Architect | Gemini controller only if admitted | Decompose a source-bound issue into non-overlapping task envelopes | no provider secrets |
| Bounded Coding Worker | A2 Builder | one qualified route at a time | Implement exactly one owned-path change per immutable task | gateway-mediated; no raw key |
| Independent Security Reviewer | A3 Verifier | separate read-only workflow | Audit authority, secret scope, prompt/data boundary and provenance | no provider secrets |

Recommended first wave (PLANNED, not dispatched):
1. A1: provider inventory and secret-reference reconciliation — read-only, no secrets.
2. A2: quota ledger and per-account isolation test design — code changes only after exact task envelope and branch ownership.
3. A3: provider qualification workflow blast-radius review — read-only, no secrets.

These three tasks must use disjoint owned paths and an immutable target SHA. The current Gemini controller cannot accept these custom task payloads, so they must not be falsely represented as assigned to Gemini. First implement/review a versioned task-admission contract compatible with the existing controller or use a separately approved transport after governance review.

## 7. Recommended provider assignment policy

For an eventual model gateway, assign routes by capability and policy rather than one provider per permanent agent:
- Fast/general low-risk classification: qualified low-cost/free fast route.
- General reasoning and planning: a separately qualified reasoning route.
- Coding/patch generation: qualified coding-capable route, isolated workspace, bounded paths.
- Independent verification/security: a different provider/account where practical, read-only tools and no shared writer credentials.
- Burst routing: router providers only if the exact underlying model, data route, cost and account quota are known; router labels alone do not establish free use.
- Local inference: Ollama only on a verified local/remote runtime; not counted as cloud API quota.

A task must declare an allowed provider/model set. Router selection may choose only from that set. No cross-account key pooling, no quota borrowing, no paid fallback, no hidden retries to another provider, and no automatic downgrade to an unknown model.

## 8. Mandatory gates before any live provider-backed agent

1. Confirm the exact secret alias exists and its repository/environment scope through an owner-authorized metadata path that never returns the value. This audit did not have a supported Secrets API reader.
2. Confirm the secret is only available to the intended workflow/job/environment; do not inject the entire registry into a general worker.
3. Bind provider/account slot to an immutable provider manifest entry and account identity. For Cloudflare, account ID and token are a pair.
4. Rework qualification into one slot per job, ideally with a dedicated isolated runner or ephemeral hosted job where policy allows; never share secrets with untrusted PR code.
5. Run a minimal models-list or provider-defined non-billable metadata check only after explicit qualification admission; then a tiny bounded inference only if the provider's pricing and quota behavior is known and approved.
6. Record provider/model, HTTP status, request ID where safe, token counts, quota evidence, timestamp, run/job IDs and artifact digest. Redact authorization headers, keys, prompts containing sensitive data and raw provider bodies.
7. Enforce per-slot quota ledger, request/concurrency limits, daily budget, cooldown, retry ceiling and paid-fallback hard deny.
8. Keep route status separate: CONFIGURED_REFERENCE, SECRET_PRESENCE_VERIFIED, AUTHENTICATED, MODEL_LISTED, INFERENCE_VERIFIED, FREE_ELIGIBILITY_VERIFIED, QUALIFIED.
9. Require exact-head CI, independent security review and governance acceptance before enabling provider calls in Cloud Pool.
10. Do not modify MediaHub issuer/capability, Jarvis, ASTRA A0 or Product State Authority boundaries.

## 9. Next concrete engineering sequence

- P0: source-bound, read-only inventory and reconcile secret aliases to workflow consumers (no secret values).
- P1: design a provider-slot qualification matrix and narrow secret-injection workflow contract.
- P2: reconcile existing quota-ledger PR #29 and routing design PR #28; do not rewrite or transplant their stale branches wholesale.
- P3: implement per-slot quota/account isolation tests and no-paid-fallback policy tests.
- P4: qualify one provider slot at a time; Aion Labs and LLM7 are candidates only after secret-presence and provider quota evidence.
- P5: integrate a single model gateway route into Cloud Pool only after issuer, capability, task lease, budget and audit gates are accepted.

## 10. Status

- Provider registry: VERIFIED AS REPOSITORY FILE; 24 cloud slots plus local Ollama entry.
- Secret values: NOT READ.
- Actual GitHub Secrets inventory/existence: NOT VERIFIED (Secrets API unavailable to this audit interface).
- Workflow secret references: VERIFIED IN SOURCE; not proof of secret existence.
- Provider endpoint/authentication/model reachability: NOT RUN.
- Aion Labs 20k/day + LLM7 100k/day: OWNER-PROVIDED ESTIMATE; NOT VERIFIED.
- New provider-backed agents: PLANNED / NOT DISPATCHED.
- Static task-profile proposal: DOCUMENTED.
- Cloud Pool model gateway: NOT IMPLEMENTED / NOT QUALIFIED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Source links

- Cloud Pool Issue #26: https://github.com/VlDMlNSh/developer-cloud-pool/issues/26
- Cloud Pool Issue #38: https://github.com/VlDMlNSh/developer-cloud-pool/issues/38
- Cloud Pool PR #28: https://github.com/VlDMlNSh/developer-cloud-pool/pull/28
- Cloud Pool PR #29: https://github.com/VlDMlNSh/developer-cloud-pool/pull/29
- MediaHub provider registry: https://github.com/VlDMlNSh/mediahub-os/blob/main/ops/qualification/provider_model_registry.json
- MediaHub agent registry: https://github.com/VlDMlNSh/mediahub-os/blob/main/.github/agent-system/registry.yaml
- MediaHub agent contracts: https://github.com/VlDMlNSh/mediahub-os/blob/main/.github/agent-system/contracts.md
- MediaHub model router policy: https://github.com/VlDMlNSh/mediahub-os/blob/main/.github/ai/model-router.yml
- Provider qualification workflow: https://github.com/VlDMlNSh/mediahub-os/blob/main/.github/workflows/astra-provider-qualification.yml
- Approved Gemini controller: https://github.com/VlDMlNSh/mediahub-os/blob/main/.github/workflows/gemini-batch-dispatch-controller.yml
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
