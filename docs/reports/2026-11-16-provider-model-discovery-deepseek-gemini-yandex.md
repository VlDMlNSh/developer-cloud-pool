# Provider model discovery — DeepSeek, Gemini, Yandex Alice/YandexGPT (2026-11-16)

## Scope and immutable target

- Repository: `VlDMlNSh/developer-cloud-pool`
- Documentation branch: `docs/cross-chat-continuation-2026-11-06`
- Last observed documentation branch HEAD before this report: `3bfd4ab08b4ccb3c6deb10a50838467782473d92`
- Last fetched Context Window blob before this report: `abb6f634bc5ce96f474d845a4ab5085d26aaf0e6`
- Purpose: discover model/provider integration paths and record safe, disabled-by-default candidates. This is not a deployment or live provider qualification.

## Browser and cloud host availability

SentinelX host inventory returned:
- Connected/operational hosts: 0.
- Free plan active-host limit: 1, available slots: 1.
- `Voktors-Mini.Dlink` (`host_5f7264034bdf0b51`): OFFLINE; last connected 2026-11-09T20:42:39Z.
- `mh-dev-01` and `mh-dev-02`: DISABLED by user in SentinelX.
Desktop Commander inventory independently returned all three devices OFFLINE.

Therefore the browser installed on the Cloud Pool host could not be launched or used in this pass. Do not infer that Diogen/agent-browser is operational from prior documentation. Browser runtime, browser profile, authenticated provider sessions and account identity are NOT VERIFIED. No login, cookies, password, API key or account data was accessed. Web research below used public documentation only, not the Cloud Pool browser.

## Provider/model findings

### DeepSeek

- Official API documentation: https://api-docs.deepseek.com/en/
- Current API model identifiers in official docs: `deepseek-flash` and `deepseek-v4-pro`.
- Official API offers both OpenAI-compatible and Anthropic-compatible interfaces. Anthropic endpoint documented as `https://api.deepseek.com/anthropic`; verify exact endpoint path/version and request semantics against the live official API reference before implementation.
- DeepSeek's 2026-11-13 changelog documents web search, deep-thinking search, file input and URL reading capabilities in the API.
- The consumer web app (https://chat.deepseek.com/) and API are separate service surfaces. A free web experience does NOT establish a free API quota. The API is treated as BILLING/QUOTA UNVERIFIED and DISABLED until the account's free allowance, billing class and quota are independently established.
- FCC README lists a built-in DeepSeek adapter. This is source-level compatibility only; no live route or Claude Code compatibility test was performed.

### Google Gemini

- Official model catalog: https://ai.google.dev/gemini-api/docs/models
- Official OpenAI-compatible endpoint documented at `https://generativelanguage.googleapis.com/v1beta/openai/`.
- Official docs list stable model identifiers including `gemini-3.8-flash`, `gemini-3.7-flash`, `gemini-3.6-flash`, `gemini-3.5-flash`; specialized image, live/audio and video model families have separate identifiers and API surfaces.
- Use the official model-list API at qualification time rather than hardcoding a stale catalogue. Record model ID, modality, lifecycle (stable/preview/experimental), region, quota and billing class.
- FCC README lists Google AI Studio/Gemini as a built-in provider. OpenAI-compatible Gemini is documented by Google, but this alone does not prove that FCC's Anthropic translation preserves every Gemini capability.
- API free-tier eligibility and model-specific rate limits remain NOT VERIFIED for the connected account. Route stays DISABLED pending no-secret metadata checks and controlled qualification.

### Yandex Alice vs YandexGPT

- These must be represented as two distinct products, not one provider route.
- **Alice consumer web/app**: browser UI and consumer assistant experience. No supported public general-purpose Claude Code/API endpoint was established in this research. Treat as WEB_SESSION_ONLY / NOT ROUTABLE through FCC until an officially supported API contract is documented. Do not automate consumer-account browser sessions as a substitute for a provider API.
- **YandexGPT / Yandex Cloud AI Studio Foundation Models**: developer API product. Yandex Cloud announced OpenAI API compatibility for YandexGPT 5 Pro/Lite. Official documentation: https://yandex.cloud/ru/blog/posts/2025/02/yandex-gpt-5-0 and https://yandex.cloud/en/docs/overview/api
- Yandex Cloud API is a separate credential, project/folder, IAM and billing/quota domain. It is not automatically a free route and is not currently listed as a built-in FCC provider in the inspected FCC README.
- Candidate integration: dedicated OpenAI-compatible adapter or separate gateway, subject to verifying the current official endpoint, auth scheme, streaming/tool-call support, model IDs and region. Do not call it “Alice API”.
- Status: API route CANDIDATE / DISABLED; consumer Alice browser route NOT QUALIFIED.

## FCC compatibility implications

Inspected FCC source README candidate: https://github.com/Factix/fcc
The README documents built-in adapters for Google AI Studio/Gemini and DeepSeek, but not Yandex Cloud/YandexGPT or consumer Alice. FCC's extension contract allows OpenAI-compatible providers via an OpenAI chat transport and Anthropic Messages providers via an Anthropic transport. That is a code extension path, not proof of feature compatibility.

Before enabling any provider/model route, require:
1. exact provider/account/project identity and quota-domain evidence (metadata only);
2. explicit billing class and no-paid-fallback policy;
3. immutable adapter/runtime version and source provenance;
4. model discovery and lifecycle pinning;
5. streaming, tool calls (including parallel calls), stop reasons, reasoning blocks, context limits, cancellation, timeout/retry and error mapping tests;
6. secret isolation: provider key only in trusted provider process; never inherited by Claude Code child;
7. no-secret synthetic tests first; then owner-authorized controlled live smoke only after security gates pass.

## Route catalogue proposal (all DISABLED)

| Route ID | Product | Transport candidate | Model candidates | Status |
|---|---|---|---|---|
| `deepseek-api` | DeepSeek API | FCC built-in Anthropic adapter or direct official API | `deepseek-flash`, `deepseek-v4-pro` | DISABLED; billing/quota and runtime NOT VERIFIED |
| `gemini-api` | Google AI Studio Gemini API | FCC built-in Google adapter; official OpenAI-compatible API | model IDs discovered from official API at runtime | DISABLED; account quota and FCC feature parity NOT VERIFIED |
| `yandexgpt-api` | Yandex Cloud Foundation Models | custom OpenAI-compatible adapter or separate gateway | current YandexGPT model URIs discovered from official catalog | DISABLED; adapter, IAM, billing and quotas NOT VERIFIED |
| `alice-web` | Yandex Alice consumer web | isolated browser session only; no API route assumed | UI-selected models only if the product exposes them | NOT QUALIFIED; Cloud Pool browser host OFFLINE |

## Security and operational decisions

- Browser UI sessions are not interchangeable with API credentials. Do not scrape browser cookies, export session storage, or inject consumer web sessions into model workers.
- Do not send prompts or files to public consumer web apps during qualification; use synthetic non-sensitive test content only if a later browser test is explicitly authorized.
- Model/provider != account != credential slot != quota domain != route != worker.
- Keep all routes disabled until the account-specific free/billing state and protocol qualification are evidenced. No paid fallback.
- No secrets were read; no provider calls, account sign-ins, browser automation, model route activation, deployment, agent dispatch or runtime tests were performed.

## Evidence and sources

- DeepSeek API first-call / protocol docs: https://api-docs.deepseek.com/en/
- DeepSeek changelog, 2026-11-13 application API release: https://api-docs.deepseek.com/updates/
- DeepSeek web tools: https://api-docs.deepseek.com/guides/web_tools/
- Gemini models: https://ai.google.dev/gemini-api/docs/models
- Gemini OpenAI compatibility: https://ai.google.dev/gemini-api/docs/openai
- YandexGPT 5 OpenAI API compatibility announcement: https://yandex.cloud/ru/blog/posts/2025/02/yandex-gpt-5-0
- Yandex Cloud API overview: https://yandex.cloud/en/docs/overview/api
- FCC adapter inventory and extension contract: https://github.com/Factix/fcc/blob/main/README.md

## Result

- Public documentation discovery: VERIFIED.
- Cloud Pool browser availability: BLOCKED (no connected host; all enrolled hosts offline or disabled).
- DeepSeek/Gemini/YandexGPT provider route qualification: NOT RUN.
- Alice consumer browser route: NOT QUALIFIED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
- Next: restore the authorized Cloud Pool host/browser connection; then verify Diogen/agent-browser binary, version, browser engine and allowed profile without opening authenticated provider sessions. In parallel, create disabled-by-default route manifests and synthetic protocol tests; fix FCC child environment secret inheritance before any live model call.

Canonical MediaHub map (reference only; Contour B remains deferred): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
