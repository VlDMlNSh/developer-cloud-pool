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

Official Gemini documentation states that rate limits are applied per project, not per API key. Four keys within one Google project therefore do not create four independent quota allocations. The four-client candidate in PR #107 remains isolated and unmerged. The owner has explicitly stated that each of the four GitHub Gemini API keys represents a separate Google account. The activation matrix now records four separate credential/account/quota ledgers (`gemini-1` through `gemini-4`, `GEMINI_API_KEY_1` through `_4`) with `OWNER_ASSERTED_NOT_INDEPENDENTLY_VERIFIED`; numeric quotas and non-secret project/account evidence remain NOT VERIFIED. The controller candidate uses `gemini-2.5-flash`. No quotas are aggregated or multiplied until evidence is recorded per account.

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


## /next revalidation — 2026-11-16

- PR #29 current head remains `e4c8d642bbc054e7c52b391356965b492dad32b4`; exact-head Pool Contract Validation run `43031920223` SUCCESS. The active-slot eligibility finding is corrected in that head, but the formal CHANGES_REQUESTED review is attached to older head `34fc78921b16359d136db553d8a51b4a4716995d`; PR #29 remains DRAFT / OPEN / UNMERGED.
- PR #29's quota ledger still admits unknown-quota/unknown-account entries in `listEligibleRoutes()`; its test explicitly expects the unknown route in the eligible list. This is not acceptable as a live route admission decision.
- A newer focused correction exists in PR #74 at head `ebcdaeb3421889be0b710a4b6b6e83deeafa0144`. It filters out routes unless `quotaEvidence=provider_verified` and `quotaDomainId` is known, and adds regression tests for unknown account/quota evidence. Exact-head Pool Contract Validation run `43692828719` SUCCESS. PR #74 remains DRAFT / OPEN / UNMERGED with zero formal reviews; it is not accepted for production.
- Gemini candidate PR #107 at head `fb3b01d4759b6903f9d846460bc2d64b1ab2cbbf` maps `GEMINI_API_KEY_1`.. `_4` to four isolated clients, rejects missing/duplicate credentials, uses four fixed roles, and has no automatic retries or cross-account fallback. It explicitly says it does not verify account separation, does not inspect GitHub secrets, and has no production integration. Its candidate source uses `gemini-2.5-flash`; PR-linked run `43864376148` SUCCESS on exact head; the reported job only covered workflow syntax/security invariants. The isolated Gemini unit-test suite remains NOT VERIFIED; formal reviews 0.
- Owner statement received in ChatGPT on 2026-11-16: each Gemini key added to GitHub represents a separate Google account. The matrix records four distinct account/quota ledger identities as OWNER_ASSERTED_NOT_INDEPENDENTLY_VERIFIED; actual non-secret project/account metadata and numeric independent limits remain NOT VERIFIED. The four quota ledgers remain separate; no aggregation or quota multiplication is assumed.
- Updated matrix blob: `4e2090874a07b7f05ea011f471caf0f018278466`, commit `eb2064b76d070bb99d9ecf062b20c2765feecdf3`.
- No provider calls, secret reads, Gemini dispatch, model execution, merge, or deployment occurred.
- Next bounded step: independently review PR #74 and #107, run exact-head CI for the four-account candidate, and reconcile quota admission with the trusted route-registry/A0-D1 boundary before enabling any provider call.


## CI evidence correction — 2026-11-16

PR #107 exact-head run `43864376148` completed SUCCESS. Its job was `Validate workflow syntax and security invariants`; the job steps did not demonstrate execution of `scripts/gemini-four-agent-controller.test.mjs`, and no artifacts were produced. Therefore the workflow run is verified, but the isolated Gemini unit-test suite remains NOT VERIFIED. PR #107 has zero formal reviews and remains Draft/unmerged.


## /next runtime and controller evidence audit — 2026-11-16

### Gemini four-client candidate
- PR #107 head `fb3b01d4759b6903f9d846460bc2d64b1ab2cbbf`, exact-head run `43864376148`, job `133289028904`: SUCCESS.
- Downloaded job log confirms `node --test scripts/gemini-four-agent-controller.test.mjs`; 6 tests, 6 pass, 0 fail. This corrects the prior report's overly cautious NOT VERIFIED label.
- These are injected fake-client tests. No Gemini API/provider request was made. GitHub Actions secret-name presence, account ownership and quota domains remain NOT VERIFIED. PR remains Draft/unmerged with zero formal reviews.

### Cloud Pool /next controller
- PR #102 head `e6613c152c5334db04f520cfe069f3bbd1c57772`; runs `43825389908` and `43825390133` SUCCESS.
- Read-only event test job `133158008841` completed; the PR-event run correctly returned `EVENT_NOT_ISSUE_COMMENT` and the event-admission job was skipped. This proves the negative PR-event path, not a live owner-authenticated Issue #96 comment probe.
- Issue #96 remains OPEN / PLANNED. No child dispatch, durable idempotency ledger, controller/child run correlation, or three-agent wave has been demonstrated. Dispatch remains disabled.
- Important scope distinction: PR #107's four API clients are not the three bounded GitHub child jobs required by Issue #96. Do not treat one as proof of the other.

### Browser and agent skills
- PR #106 head `afd3dba8bc9db37c8e07b8becf128233f46e4533`; exact-head Pool Contract Validation run `43861948322` SUCCESS.
- Browser job `133280713541` SUCCESS: pinned agent-browser 0.43.0 and Chromium installed, fixed `https://example.com` opened, title `Example Domain` verified, screenshot created in ephemeral runner. The screenshot was not published as an artifact; its SHA-256 is only written to step summary, not available in the retrieved job log. Browser close is configured as cleanup trap but explicit close completion is NOT independently evidenced. No authenticated sites, cookies, or persistent browser session were tested.
- Agent skills job `133280713473` SUCCESS and logs confirm `ALL_11_SKILLS_CONTENT_VALIDATED`. This verifies pinned skill bootstrap/content checks on an ephemeral runner, not live Gemini agent execution.
- PR #106 remains Draft/unmerged, zero formal reviews. Its worker dispatch was not run; it does not create persistent remote browser sessions or a phone-accessible web dashboard.

### Evidence and disposition
- PR #74 head `ebcdaeb3421889be0b710a4b6b6e83deeafa0144`, run `43692828719` SUCCESS; still Draft, no formal reviews.
- All inspected PRs #74, #102, #103, #106 and #107 remain open Draft/unmerged with zero formal reviews.
- No secret values read, no provider calls, no Gemini dispatch, no owner /next event probe, no child agents, no merge or deployment.
- Contour A remains BLOCKED / NOT ACCEPTED. Immediate next step: complete owner-event admission and durable replay/ledger qualification for Issue #96, obtain independent review, then dispatch exactly the authorized child count through the Cloud Pool controller. Separately keep four Gemini clients isolated and unactivated until secret metadata and quota evidence are verified.


## /next pass — PR #100 provenance and runtime fail-closed audit — 2026-11-16

### Exact-head evidence
- PR #100 current head: `cb952a915093a4aaafb8f878954503d2460c4008`; base: PR #98 head `f23cdb5484d5923e02242b3ea142397f9e1f0270`; PR remains Draft/open/unmerged, formal reviews 0.
- Exact-head Cloud Pool Next Admission Contract run `43826793313`, job `133162447332`: SUCCESS. Retrieved raw job log confirms 38 tests, 38 pass, 0 fail, 0 skipped.
- Tests cover exact owner admission, negative event cases, trusted owner provenance for ledger records, tamper detection, API adapter pagination, and exact controller-run identity matching.
- This is mocked API/unit-test evidence only; Issue #96 was not mutated and no real controller run or child dispatch occurred.

### Security posture change
- PR #100 now ignores ledger-marker comments unless GitHub server metadata reports owner login `VlDMlNSh`, association `OWNER`, and exact Issue #96 API URL.
- Crucially, the PR removes the unsafe caller-asserted `lockHeld` authorization path. `planNextDispatch()`, `authorizeSingleDispatch()`, `reconcileVerifiedOwnerNextEvent()`, and `reconcileNextLedgerEvent()` now fail closed with `DURABLE_LOCK_NOT_IMPLEMENTED` before any GitHub API access. Pure state planning remains available for tests, but grants no runtime permission.
- This is a deliberate safe regression in capability: the controller cannot dispatch or mutate the ledger through these runtime entry points until a real durable lease/lock with fencing and crash recovery is implemented and independently qualified.
- Design item to resolve before enabling writes: define a trusted ledger-writer identity/provenance contract compatible with GitHub automation. Current parser trusts only owner-authored comments; bot-authored write records would not be accepted. Do not weaken the check to solve this—design and test an explicit, verifiable bot identity or use a separately authenticated durable store.

### Issue #96 live-state check
- Issue #96 remains OPEN. It contains six owner-authored progress comments, all historical wave notes; none is a fresh exact `/next` trigger. A live owner-trigger probe was therefore NOT RUN.
- No secrets read, provider calls, workflow dispatch, child agents, deployment or merge.

### Next bounded step
Implement and adversarially test a real durable serialization primitive (monotonic fencing, lease expiry/recovery, and single-writer provenance) on a branch based on the current default HEAD. Keep runtime authorization hard-disabled until that primitive is verified; then add a trusted-default-branch no-secret integration probe and independent security review.
