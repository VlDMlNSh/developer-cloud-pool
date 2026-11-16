# 2026-11-16 — Dual Cloud Code execution-plane architecture synchronization

## Scope and immutable starting point

- Repository: `VlDMlNSh/developer-cloud-pool`
- Documentation branch: `docs/cross-chat-continuation-2026-11-06`
- Starting Context Window blob: `6fe53e819e0202b8501087456f714dc366592624`
- Default branch observed in repository metadata: `Основной`
- Default HEAD observed in the latest context evidence: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`
- Related open work: Issues #22, #26, #94, #96; PRs #95, #107–#112 include draft/unmerged proposals and evidence. No PR state is treated as acceptance.

## Work completed in this pass

- Consolidated the user's two-profile proposal into one Jarvis control plane and two isolated execution profiles: Development Cloud Code and Media Cloud Code.
- Defined the distinction between an orchestration runtime and actual media generators/renderers/GPU workers.
- Documented profile isolation, model/provider adapters, account-slot quota identity, secret references, no-paid-fallback, task provenance and cancellation/recovery requirements.
- Clarified FCC as an unqualified candidate gateway/compatibility path and ECC as an extension bundle, not a model provider.
- Explicitly preserved Contour A as the only active implementation/acceptance priority. Contours B/media deployment remain deferred until Contour A is ACCEPTED.
- Added an ADR, updated the unified Context Window, and created a dated checkpoint.

## Evidence and limits

- This is a documentation-only architecture pass.
- No secrets or credential values were read.
- No model/provider calls, Gemini dispatch, GPU provisioning, paid resource use, runtime code changes, merge or deployment occurred.
- No tests were run because no executable code changed.
- FCC/ECC/provider compatibility and candidate component versions are not qualified by this report.
- Contour A remains BLOCKED / NOT ACCEPTED. Four-account Gemini identity/quota separation and live dispatch remain NOT VERIFIED / NOT RUN as recorded in the existing context.

## Next bounded step

Continue Contour A, not media implementation: resolve the exact-head Gemini SDK/runtime and trusted Issue #96 durable admission/lease/fencing/reconciliation gates, obtain exact-head CI and independent review, then continue the web console and remaining acceptance evidence. Only after formal Contour A ACCEPTED may Development Cloud Code rollout begin; Media Cloud Code/GPU workers require a separate budget and security approval.

Canonical MediaHub map (separate project/control plane): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
