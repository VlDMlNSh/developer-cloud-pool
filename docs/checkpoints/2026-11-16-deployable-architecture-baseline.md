# Cloud Pool checkpoint — deployable architecture baseline — 2026-11-16

## State
- Contour: A — Cloud Development Pool.
- Status: DESIGN BASELINE PUBLISHED; DEPLOYMENT NOT STARTED; ACCEPTANCE NOT GRANTED.
- Default branch: `Основной`; last observed default HEAD `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Documentation branch: `docs/cross-chat-continuation-2026-11-06`.
- Latest documentation commit from this pass: `9c0a0feba4e44bbbdba283605a6613dbf497c022`.
- Repository ID: `1445644538`.
- Active ruleset observed: `26550182`, active on default branch. Exact rule details were previously recorded in Context Window; this pass did not re-read the ruleset body due an API URL error.
- PR #111 and #112 were previously observed OPEN/DRAFT, unmerged; their descriptions and exact-head historical CI evidence remain as recorded in Context Window. Current status should be revalidated next /next.
- No production CI was triggered by this documentation-only pass.

## Published deliverables (read-back verified)
1. Deployable reference architecture:
   `docs/architecture/CLOUD-POOL-DEPLOYABLE-REFERENCE-ARCHITECTURE-2026-11-16.md`
   Blob SHA `58ecea462538b02f4c7445cd994018332fa225af`.
2. Machine-readable deployment manifest (all profiles/routes/workers disabled):
   `config/deployment/cloud-pool-deployment-manifest.v1.json`
   Blob SHA `10a7e22d09430aeda4f276b7d57261babf088e42`.
3. Deployment and recovery runbook:
   `docs/runbooks/CLOUD-POOL-DEPLOYMENT-AND-RECOVERY-2026-11-16.md`
   Blob SHA `393bc704ad3435440ddf700b9a59edf366225e47`.
4. Dual Claude Code profile architecture cross-linked to deployable baseline:
   `docs/architecture/CLOUD-CODE-DUAL-PROFILE-REFERENCE-ARCHITECTURE-2026-11-16.md`
   Blob SHA `59f6ec2d79be4aafd62fa6ae11cc5b0304898040`.
5. Worker topology updated with explicit Agent Browser operator-plane boundary:
   `docs/architecture/ON-DEMAND-WORKER-POOL-TOPOLOGY-2026-11-16.md`
   Blob SHA `33f267b70f405d09779753dd12065ce5014e65da`.

## Architecture decisions now consolidated
- Jarvis UI is a client; Pool Bridge is sole admission/lease/capability authority.
- Profile A: Claude Code + pinned ECC → trusted FCC/qualified Anthropic Messages gateway → cloud API route. FCC remains blocked until provider-key inheritance and source provenance are resolved.
- Profile B: Claude Code + separately pinned ECC → OmniRouter-compatible Anthropic Messages endpoint → local model. No cloud fallback.
- Video/media generation is a separate task-scoped local media worker/runtime, not assumed to be OmniRouter.
- ChatGPT Agent Browser/TinyFish is an operator browser channel, not an in-pool runtime or API route. Browser cookies/session state never flow into workers.
- All route/profile/worker defaults are DISABLED; no paid fallback.
- Route qualification requires account identity, independent quota domain, billing class, immutable adapter provenance, protocol test matrix, secret-isolation proof and audit evidence.
- LiteLLM is documented as an OSS alternative candidate for Anthropic Messages gateway; no adoption or deployment decision made.

## Verification and tests
- Read-back verification: all five changed/new docs read back and expected architecture terms checked.
- Manifest: JSON content retrieved; structural parse/test was not run by a dedicated CI workflow.
- No code/runtime tests, no CI, no browser sign-in, no API provider calls, no agent dispatch, no deployment, no secret reads.
- External docs consulted: Anthropic Claude Code gateway documentation and LiteLLM docs. Their gateway protocol statements are source-level documentation, not a Cloud Pool runtime qualification.

## Blockers
1. Agent Browser profiles have no signed-in sites recorded; new browser profile creation was proposed but not authorized by user.
2. SentinelX/Remote Desktop host inventory: no connected host; browser runtime in Cloud Pool NOT VERIFIED.
3. FCC source provenance and child environment provider-key inheritance block Profile A.
4. OmniRouter exact source/version and Anthropic Messages protocol compatibility NOT VERIFIED.
5. Profile B host/GPU/model/media runtime inventory NOT VERIFIED.
6. Pool Bridge durable admission and production dispatch are not yet qualified; PR #112 remains a read-only controller proof according to its current recorded description.
7. No independent acceptance evidence for Contour A.

## Next bounded engineering pass
Create machine-readable profile/route contracts and a no-secret synthetic test suite. Negative tests must cover:
- Profile A provider-key isolation from Claude Code child process.
- Profile B network/filesystem isolation from Profile A.
- Profile B cloud fallback denied.
- Browser session/cookie cannot be transformed into an API credential.
- expired/stale lease and fencing generation cannot mutate state.
- duplicate event and ambiguous dispatch cannot create duplicate task execution.
- disabled/unqualified routes cannot be selected.
Then revalidate OSS gateway alternatives and decide whether FCC remediation or a replacement gateway is the lower-risk path. No live provider call until all security and account/quota gates pass.

## Canonical links
- Context Window: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/context/GITHUB-CONTEXT-WINDOW.md
- Deployable architecture: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/architecture/CLOUD-POOL-DEPLOYABLE-REFERENCE-ARCHITECTURE-2026-11-16.md
- Manifest: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/config/deployment/cloud-pool-deployment-manifest.v1.json
- Runbook: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/runbooks/CLOUD-POOL-DEPLOYMENT-AND-RECOVERY-2026-11-16.md
- Canonical MediaHub map (reference only; Contour B deferred): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
