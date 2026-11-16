# Checkpoint — Cloud Pool Target Architecture 2.0

Date: 2026-11-16
Contour: A — Cloud Development Pool
Status: TARGET DESIGN DOCUMENTED / NOT DEPLOYED / NOT QUALIFIED

## Immutable source state
- Cloud Pool default branch: Основной
- Default HEAD: 35208f0ef28f0ac031a7acdf35fc90ccc9b16845
- Documentation branch: docs/cross-chat-continuation-2026-11-06
- Documentation branch parent before this pass: 3041cce096e25a8bfe4fe9675f8dc6dc51324d10
- Existing reference architecture blob: 98f84dd24814ca91d4ade45fb3cf57535d8884ba
- New target architecture commit: 3c50a1c87ebbbe1f4b94fe1d21eeb296a3fc5cab
- New target architecture blob: 64c44709c937c2db57cc9f698378784a13d2d85b

## Work completed
- Re-read the current Cloud Pool repository metadata, default ref and documentation ref.
- Re-read the existing Jarvis Hybrid Platform Reference Architecture.
- Re-read current Context Window and D1/owner-event checkpoint.
- Revalidated PR #107, #111 and #112: all OPEN/DRAFT/UNMERGED.
- Reviewed existing four-Gemini candidate boundary: four task envelopes, eight mocked tests, no provider calls, no proof of four account identities/quota domains, no production caller.
- Reviewed existing architectural choices: LangGraph, PostgreSQL, LiteLLM, Ollama, GitHub-hosted ephemeral workers, Diogen/agent-browser, Playwright, Docling, SearXNG/Crawl4AI, optional Open WebUI.
- Produced and read back docs/architecture/CLOUD-POOL-TARGET-ARCHITECTURE-2.0.md.
- Defined Jarvis + Pool Bridge control plane; PostgreSQL durable admission, repository-wide lease, monotonic fencing, transactional outbox and quota ledger; LangGraph graph orchestration; LiteLLM model gateway; isolated FCC/ECC Claude profile; separate OmniRouter Claude profile; browser and local inference planes.
- Added provider onboarding policy: reconcile the existing 24 cloud slots first; optional NVIDIA NIM evaluation registration; optional Cerebras evaluation only (promotional credit/payment-method caveat); no mandatory Anthropic/OpenAI API signup as a free route; GitHub Models retired July 30, 2026.

## Evidence and verification
- Documentation commit: 3c50a1c87ebbbe1f4b94fe1d21eeb296a3fc5cab
- Architecture blob SHA: 64c44709c937c2db57cc9f698378784a13d2d85b
- Read-back verified: document title, full content length 22,518 characters, final section and canonical map link.
- No code changed.
- No automated tests run (documentation-only pass).
- No provider API calls, no credential reads, no secret writes, no deployments, no local host actions, no dispatches and no merges.
- Actions secret existence and account/quota identity remain NOT VERIFIED.
- FCC/ECC upstream versions, licenses and live contracts remain NOT VERIFIED.
- No independent security review or Contour A acceptance occurred.

## Decisions
- Keep Contour A as the only active project priority.
- GitHub Actions is an ephemeral worker plane, not durable state or repository lock.
- PostgreSQL is the source of truth for admission, fencing, outbox, quota reservation and audit metadata.
- LiteLLM is a gateway, not the sole quota authority; external quota ledger and fail-closed allowlist are mandatory.
- FCC and ECC are distinct components in one end-to-end qualification profile.
- OmniRouter is a separate second Claude Code profile, with isolated workspace, credentials, queue, quotas and audit.
- Do not add new provider accounts until existing provider slots are reconciled.
- Optional additional evaluations: NVIDIA NIM and Cerebras, with no assumption of permanent free production capacity.
- Do not add Anthropic/OpenAI API keys as supposedly free routes. Paid/credit-controlled access remains disabled unless explicitly qualified and approved.
- Contour B remains DEFERRED.

## Next bounded engineering pass
Implement the durable PostgreSQL admission/lease/fencing/outbox contract and adversarial tests on a clean branch from the current default SHA. In parallel only as a read-only research task, inventory exact FCC/ECC upstream repositories, releases, licenses and API contracts. Do not dispatch agents or provider calls until security and production caller gates pass.

Canonical MediaHub map (separate project; product work remains deferred):
https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
