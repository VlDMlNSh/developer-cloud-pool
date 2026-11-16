# Checkpoint — Cloud Pool model-pool architecture and staged activation

Date: 2026-11-16  
Status: ARCHITECTURE RECORDED / PROVIDER ACTIVATION NOT AUTHORIZED  
Contour: A — Developer Cloud Pool

## Repository references
- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch: `Основной`
- Observed default HEAD: `6507823e7ec27caa9b2621daef964dba2d4cf436`
- Documentation branch: `docs/next-2026-11-16-cloudpool-gemini-scope-audit`
- Context Window: `docs/context/GITHUB-CONTEXT-WINDOW.md`
- Matrix: `config/provider-model-activation-matrix.json`
- Architecture report: `docs/reports/2026-11-16-cloud-pool-model-pool-activation-plan.md`

## Decisions
- One shared model gateway; separate credential slots, accounts and quota domains.
- Direct DeepSeek slot `deepseek-1` excluded from activation because owner confirms paid requirement.
- No paid fallback, no unknown-cost calls, no billing activation, no quota-evasion key rotation.
- Four Gemini keys do not multiply quotas when they belong to one Google project; Gemini limits are project-scoped.
- Gemini `gemini-3.8-flash` is the first qualification candidate based on official Free-tier pricing, but remains inactive. `gemini-3.5-flash-lite` requires model-ID correction/review; current official pricing lists `gemini-3.1-flash-lite`.
- Proposed pilot caps are internal safeguards, not provider-published quotas: 1 concurrent request per quota domain, 5 RPM, 100 RPD, 16k input tokens/request, 4096 output tokens/request, USD 0 spend.

## /next revalidation — 2026-11-16

- PR #29 head `e4c8d642bbc054e7c52b391356965b492dad32b4`; exact-head CI `43031920223` SUCCESS. Old active-slot eligibility finding is corrected in current head, but formal CHANGES_REQUESTED review is against older head `34fc78921b16359d136db553d8a51b4a4716995d`. PR remains Draft/unmerged. `listEligibleRoutes()` still returns routes with unknown quota/account evidence; its test explicitly expects this and must not be used as production authorization.
- PR #74 head `ebcdaeb3421889be0b710a4b6b6e83deeafa0144` adds fail-closed unknown quota/account filtering. Exact-head Pool Contract Validation `43692828719` SUCCESS; formal reviews 0; PR Draft/unmerged.
- PR #107 head `fb3b01d4759b6903f9d846460bc2d64b1ab2cbbf` implements four isolated Gemini clients with `GEMINI_API_KEY_1`..`_4` and four roles. Candidate model is `gemini-2.5-flash`; unit tests authored but NOT RUN, formal reviews 0, production integration absent.
- Owner states each GitHub Gemini key represents a separate Google account. Matrix now contains four separate account/quota ledgers and records `OWNER_ASSERTED_NOT_INDEPENDENTLY_VERIFIED`; numeric quotas and non-secret project/account metadata remain NOT VERIFIED. No aggregation of quotas.
- Updated matrix commit `eb2064b76d070bb99d9ecf062b20c2765feecdf3`, blob `4e2090874a07b7f05ea011f471caf0f018278466`.
- No provider calls, secret reads, model execution, dispatch, merge or deployment.

## Current blockers
- Issue #26 OPEN; provider calls not authorized.
- PR #28 and #29 OPEN/DRAFT/UNMERGED. PR #29 formal CHANGES_REQUESTED review references older head; reconcile exact current head and CI.
- PR #107 OPEN/DRAFT/UNMERGED, exact-head CI reported success in PR description, reviews 0, secret/account separation NOT VERIFIED.
- Credential presence, provider account identities, quota domains and current numeric quotas NOT VERIFIED.
- Cloud Pool-native Gemini controller and secret delivery NOT ACCEPTED.

## Work performed
- Re-read MediaHub provider registry blob `8c0f95d33a6fc85128b3a7aa37157c2dca74bbca`.
- Re-read Cloud Pool Context Window, free-route policy and prior checkpoint.
- Refreshed open issues/PR inventory; reviewed PR #29, #107 and PR #28 status.
- Checked official Gemini pricing/rate-limit and Groq rate-limit documentation.
- No secret reads, provider calls, dispatch, merge, deployment or paid operation.

## Next step
Reconcile PR #29's active-slot eligibility finding at exact current head; verify exact-head CI. Keep all model routes inactive until Issue #26 acceptance. Then qualify one model at a time, starting with Gemini `gemini-3.8-flash` if account/project and free quota evidence pass.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
