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
- PR #107 head `fb3b01d4759b6903f9d846460bc2d64b1ab2cbbf` implements four isolated Gemini clients with `GEMINI_API_KEY_1`..`_4` and four roles. Candidate model is `gemini-2.5-flash`; PR-linked run `43864376148` SUCCESS on exact head, but its reported job covered workflow syntax/security invariants; isolated Gemini unit suite NOT VERIFIED. Formal reviews 0, production integration absent.
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


- Additional exact-head evidence: PR #107 run `43864376148` SUCCESS; job `Validate workflow syntax and security invariants` completed successfully. It did not provide evidence that `gemini-four-agent-controller.test.mjs` executed; unit tests remain NOT VERIFIED. No artifacts were produced.


## /next controller, Gemini and browser revalidation — 2026-11-16

- PR #107 exact head `fb3b01d4759b6903f9d846460bc2d64b1ab2cbbf`; run `43864376148`, job `133289028904` SUCCESS. Retrieved job log confirms `node --test scripts/gemini-four-agent-controller.test.mjs`: 6 tests, 6 pass, 0 fail. Fake injected clients only; no provider calls. Secret existence/account/project/quota verification NOT VERIFIED. PR remains Draft, reviews 0.
- PR #102 head `e6613c152c5334db04f520cfe069f3bbd1c57772`; run `43825390133` read-only event contract tests SUCCESS. Its PR event correctly produced `EVENT_NOT_ISSUE_COMMENT`; event-admission job skipped. Live owner-authenticated Issue #96 comment probe NOT RUN. Issue #96 OPEN / PLANNED; no dispatch or durable idempotency proof.
- PR #106 head `afd3dba8bc9db37c8e07b8becf128233f46e4533`; run `43861948322` SUCCESS. Browser job `133280713541` installed pinned agent-browser 0.43.0/Chromium, opened fixed `https://example.com`, verified `Example Domain`, and created an ephemeral screenshot. No artifact available; hash value not retrieved; explicit close completion NOT independently verified. No authenticated Web access or persistent session.
- Agent skills bootstrap job `133280713473` SUCCESS; logs confirm all 11 pinned skill files validated. This is bootstrap verification only, not Gemini execution.
- PR #74 exact-head run `43692828719` SUCCESS; PR remains Draft, reviews 0. PR #103 documentation PR has no workflow runs returned. PRs #74/#102/#103/#106/#107 all remain OPEN/DRAFT/UNMERGED; formal reviews 0.
- Four Gemini API clients (PR #107) are not equivalent to three GitHub child jobs required by Issue #96. Maintain this distinction in controller design.
- Corrected prior evidence: Gemini unit suite is VERIFIED as 6/6 passing on PR #107 exact head. Provider calls remain NOT RUN.
- No secrets read, owner event probe, child dispatch, provider calls, merge or deployment.

## Updated next step

Qualify Issue #96 owner-event admission on trusted default-branch workflow, durable idempotency/replay and owner-only provenance; obtain independent security review and ruleset evidence. Only then dispatch exactly the controller-authorized number of child jobs. Keep four Gemini clients unactivated pending secret-name presence and independent account/quota evidence. Persistent remote browser/dashboard remains a separate unqualified requirement.


## /next PR #100 owner-provenance and lock audit — 2026-11-16

- PR #100 current head `cb952a915093a4aaafb8f878954503d2460c4008`, base PR #98 head `f23cdb5484d5923e02242b3ea142397f9e1f0270`; Draft/open/unmerged, formal reviews 0.
- Exact-head run `43826793313`, job `133162447332`: SUCCESS; raw log confirms 38/38 tests, 0 failures, 0 skipped.
- Ledger parser trusts only GitHub server metadata for owner login, OWNER association and exact Issue #96 URL; untrusted marker comments are ignored.
- Runtime ledger and dispatch entry points now fail closed with `DURABLE_LOCK_NOT_IMPLEMENTED`. No caller-supplied `lockHeld` boolean grants authorization. This is safe but not operational.
- Open design requirement: bot-authored ledger records will not pass the owner-only parser. Define a verifiable automation identity or authenticated durable store; do not relax provenance checks.
- Issue #96 has six owner-authored progress notes and no fresh exact `/next` trigger; live probe NOT RUN.
- No secrets read, provider calls, dispatch, child runs, deployment or merge.

**Next:** design and test a real durable serialization primitive with monotonic fencing, lease expiry/recovery and single-writer provenance. Keep runtime authorization disabled until independent qualification.


## /next durable coordinator component selection — 2026-11-16

- Reuse audit: PR #36 D1 single-use approval proof (head `e11fc90e50bd20b166207af64551c49cfa80ffb4`; exact-head CI runs `42329438351` and `42329438308` SUCCESS); PR #39 D1 transactional claim/outbox proof (head `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`; 19/19 Workers-runtime tests, exact-head runs SUCCESS); PR #92 exact replay integrity proof (head `7014961587759b27d2ef6e91c60ce098d077ae83`; exact-head D1 + contract CI SUCCESS).
- Source inspection of PR #39 confirms `lease_generation` and `lease_expires_at` are only schema fields. `claimAndEnqueue()` performs approval consume + atomic claim/outbox creation but does not implement lease acquisition, fencing, expiry takeover, stale-holder rejection, or crash recovery. All these proofs keep dispatch disabled.
- Platform selection: preferred candidate is a single named Cloudflare Durable Object as serialized controller coordinator, with D1 retained for immutable audit/admission and transactional outbox. DO SQLite storage provides the durable state boundary; monotonic fencing generation is advanced atomically there. External GitHub dispatch remains outside the transaction; ambiguous outcomes require exact-run reconciliation and no blind retry.
- Upstream reference evaluated: `losfair/dlock` demonstrates monotonically increasing lease/fencing numbers on Cloudflare Durable Objects; reference only, not adopted or independently qualified: https://github.com/losfair/dlock.
- Official platform sources: Durable Objects Free-plan availability and strongly consistent durable storage: https://developers.cloudflare.com/durable-objects/ ; D1 single-threaded behavior and Free limits: https://developers.cloudflare.com/d1/platform/limits/ .
- No Cloudflare resource, secrets, billing, deployment, provider calls, dispatch, child agents or merge.
- Next: local-only DO SQLite coordinator proof with concurrency, fencing, expired lease, stale owner, crash recovery, duplicate source and ambiguous external-dispatch tests. Keep `dispatch:false` until independent review and free-tier eligibility are verified.


### Git ref status at checkpoint

- Default branch `Основной` HEAD: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- This documentation branch HEAD after its latest context update: `4820c3700bb9b3708d01d127dad4bcae6e4d00e5`.
- PR #103 remains Draft/open/unmerged and GitHub reports `mergeable=false`; it targets stale base `6507823e7ec27caa9b2621daef964dba2d4cf436`. Compare against default: diverged, 60 ahead / 13 behind. No merge or force update attempted.
