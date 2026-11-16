# GITHUB CONTEXT WINDOW ADDENDUM — 2026-11-16 provider model discovery

This addendum supplements the canonical Context Window:
https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/context/GITHUB-CONTEXT-WINDOW.md

## Latest repository evidence
- Repository ID: `1445644538`; default branch: `Основной`.
- Documentation continuation branch: `docs/cross-chat-continuation-2026-11-06`.
- Latest report commit: `c5d5e7d076ab7b1d6922f723dd74631508f0ded4`.
- Report blob SHA (read-back verified): `2caf4e80e8e30ae28366325c064d49b11d782b86`.
- Report: [Provider model discovery — DeepSeek, Gemini, Yandex Alice/YandexGPT](../reports/2026-11-16-provider-model-discovery-deepseek-gemini-yandex.md).
- Repository metadata read-back confirmed default branch and repository identity. The exact current default-branch HEAD and current active ruleset conditions were not fully re-read in this pass; retain prior recorded values as historical, not fresh verification.
- PR collection was read, but the response was too large to reliably normalize every open PR. Exact current PR/CI matrix remains NOT VERIFIED in this pass.

## Browser host state
- SentinelX: 0 connected/operational hosts; free plan active-host limit 1.
- `Voktors-Mini.Dlink` host ID `host_5f7264034bdf0b51`: OFFLINE; last connected 2026-11-09T20:42:39Z.
- `mh-dev-01` and `mh-dev-02`: DISABLED by user in SentinelX.
- Desktop Commander independently reports all three enrolled devices OFFLINE.
- Cloud Pool-installed Diogen/agent-browser could not be launched. Browser runtime, version, profile and authenticated sessions are NOT VERIFIED.

## Model discovery result (all routes remain DISABLED)
- DeepSeek API: official model IDs `deepseek-flash`, `deepseek-v4-pro`; OpenAI- and Anthropic-compatible APIs documented. Consumer web app and API are separate; web free access does not prove free API quota.
- Gemini: official API supports OpenAI-compatible transport; model IDs should be discovered from the official catalogue/API at qualification time. FCC has a source-documented Google AI Studio/Gemini adapter; full tool/reasoning parity NOT VERIFIED.
- Yandex Alice consumer web is not the same product/API as YandexGPT. No official general-purpose Alice API route was established. Do not wrap consumer browser sessions as a provider API.
- YandexGPT / Yandex Cloud Foundation Models: Yandex announced OpenAI API compatibility for YandexGPT 5 Pro/Lite. This is a distinct API, IAM, project/folder and billing/quota domain. No built-in Yandex route was found in the inspected FCC README; custom adapter/separate gateway required and NOT QUALIFIED.
- Source links and full compatibility matrix are in the linked report.
- No provider calls, sign-ins, browser automation, secret reads, dispatch, deployment or runtime tests occurred.

## Blockers and next step
1. Restore the authorized Cloud Pool host connection, then verify Diogen/agent-browser binary/version/engine and permitted browser profile using a non-authenticated smoke test.
2. Create disabled-by-default route manifests for DeepSeek, Gemini and YandexGPT; keep Alice consumer web marked WEB_SESSION_ONLY / NOT QUALIFIED.
3. Run synthetic no-secret protocol tests; resolve FCC provider-key inheritance and source provenance before any live model calls.
4. Verify account identity, free/billing class and quota domains independently. No paid fallback.
5. Contour A remains BLOCKED / NOT ACCEPTED. Contour B remains DEFERRED.

Canonical MediaHub map (reference only): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
