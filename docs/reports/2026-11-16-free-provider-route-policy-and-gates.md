# Free-provider route qualification policy — 2026-11-16

**Contour:** A — Developer Cloud Pool  
**Status:** POLICY RECORDED / ROUTE QUALIFICATION NOT RUN  
**Default branch HEAD checked:** `6507823e7ec27caa9b2621daef964dba2d4cf436`  
**Controlling issue:** [#26](https://github.com/VlDMlNSh/developer-cloud-pool/issues/26)

## Owner direction

The owner requests attempting every registered API credential route as far as possible, retaining routes unless evidence shows authentication is impossible without payment, and using exclusively free routes. This is interpreted as a request to discover free model access, not as permission for any paid request, billing activation, paid fallback, quota-evasion rotation, or secret disclosure.

## Current source evidence

- MediaHub registry blob: `8c0f95d33a6fc85128b3a7aa37157c2dca74bbca`; it declares 24 cloud credential slots plus one local Ollama route.
- Issue #26 remains OPEN and states that provider calls are not authorized until the credential boundary, provider qualification, budget guard, routing tests, provenance and independent review are accepted.
- PR #28 (account-isolated routing/quota design) remains OPEN/DRAFT/UNMERGED; independent review and exact-head CI are not established.
- PR #29 (pure quota ledger) remains OPEN/DRAFT/UNMERGED. A Pool Contract Validation run `43031920223` is SUCCESS for its recorded commit `e4c8d642bbc054e7c52b391356965b492dad32b4`. A formal CHANGES_REQUESTED review exists against an earlier head `34fc78921b16359d136db553d8a51b4a4716995d`; the finding concerns active-slot eligibility bypass and must be reconciled against the current head before qualification.
- PR #107 is an isolated four-account Gemini candidate, OPEN/DRAFT/UNMERGED, head `ae0232c7989822269acd90e25e421579f0be79ed`; exact-head CI run `43863071739` is SUCCESS. Formal reviews: 0. Secret existence, distinct account ownership, and production integration remain NOT VERIFIED / NOT RUN.
- Cloud Pool Issues #94 and #96 remain OPEN. #96 is PLANNED and dispatch-disabled. The Cloud Pool repository does not contain its own production Gemini dispatch controller on the default branch. MediaHub's controller belongs to a separate repository and cannot be treated as Cloud Pool dispatch authority.

## Route classification policy

Never delete a credential slot solely because the registry labels it `paid_api` or `router`. Preserve its inventory record and classify it independently:

1. `CONFIGURED_UNKNOWN`: credential reference exists in source, actual secret presence not verified.
2. `AUTHENTICATED`: safe provider authentication evidence exists; no inference from secret name.
3. `FREE_MODEL_FOUND`: provider catalog/account evidence identifies a zero-cost model.
4. `FREE_QUOTA_VERIFIED`: current free entitlement, quota domain and reset evidence are documented.
5. `FREE_QUALIFIED`: route passed authorized no-secret contract checks and any explicitly approved low-cost free-only qualification request.
6. `AUTH_REQUIRES_BILLING`: provider explicitly requires payment/billing for authentication or model access.
7. `PAID_ONLY`: no free route is available under verified account terms.
8. `BLOCKED_UNKNOWN_COST`: pricing or entitlement cannot be established; deny execution.
9. `AUTH_FAILED`: provider rejects credential; retain evidence and do not delete automatically.
10. `NOT_VERIFIED`: insufficient evidence.

## Mandatory safety rules

- `paid_fallback_allowed=false` at admission and gateway layers.
- Never send a request if the model's current price is unknown or non-zero.
- Treat HTTP 402, billing prompts, payment-required entitlement and ambiguous pricing as hard stop for that route.
- Do not add a card, enable billing, purchase credits, upgrade, or create billable resources.
- Do not read or print secret values. Secret references do not prove secret existence.
- Keep each key/account/project/quota domain separate. Key suffixes do not prove independent quota.
- No automatic key rotation or cross-account retry to evade provider limits. A fallback is allowed only as an explicit policy-selected free route with independently verified entitlement and its own budget.
- Distinguish provider RPM/RPD/TPM/TPD from local pool budgets. Do not infer quota resets from a local timer.
- Provider calls remain disabled until Issue #26 acceptance gates and an approved execution boundary are satisfied.

## Current pass outcome

No provider calls, secret reads, model requests, paid operations, workflow dispatch, merges or deployments were performed. The user preference is recorded as policy, but live key authentication and free-quota qualification remain NOT RUN / NOT VERIFIED because the current Cloud Pool control and credential-boundary gates are not accepted.

## Next bounded step

Reconcile PR #29's active-slot eligibility review finding against its current head, then add deterministic tests proving active and newly selected slots both enforce the free-only billing allowlist, qualification status, credential status and route state. Keep all tests synthetic and provider-independent. Only after the route-admission and secret-boundary gates pass should an explicitly approved free-only qualification request be considered.

Canonical MediaHub map (reference only): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
