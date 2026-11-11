# Media Intelligence and Publishing Architecture

**Status:** DESIGN / NOT INSTALLED / NOT QUALIFIED / PUBLISHING DISABLED
**Date:** 2026-11-04
**Repository:** https://github.com/VlDMlNSh/developer-cloud-pool

## 1. Objective

Provide governed cloud capabilities to collect and analyze permitted public information from web pages, YouTube, Instagram, Telegram, TikTok and other open sources; transform verified findings into media assets and platform-specific drafts; and publish only through explicitly authorized official interfaces.

GitHub Actions remains the execution scheduler. The Pool Supervisor remains fail-closed. An agent, runtime, skill, plugin or collected source never grants itself repository, network, account or publication authority.

## 2. Capability profiles

All profiles are PLANNED, not installed, dispatched, tested or qualified.

| Profile | Responsibility | Candidate components | Boundary |
|---|---|---|---|
| MI-01 Web Reader | Read public pages, capture metadata, extract article text | agent-browser, Crawl4AI | Read-only; per-domain limits; no login/session reuse by default |
| MI-02 Search Research | Discover sources and corroborate claims | Search provider adapter, SearXNG where approved | Search results are leads, not evidence |
| MI-03 Video Metadata | Inspect public video metadata, creator/date/description and captions availability | Browser adapter; official platform APIs | No access-control bypass |
| MI-04 Video/Audio Understanding | Transcribe permitted audio, sample frames, OCR and summarize segments | Docling, Whisper ASR, FFmpeg, OCR adapter | Public/authorized/user-provided media only; bounded duration and resources |
| MI-05 Social Listening | Analyze public posts, topics, mentions and discussion trends | Official platform APIs first; compliant public-page reader | Platform-specific permissions; no private groups or DMs |
| MI-06 Evidence & Fact Check | Normalize evidence, deduplicate, compare claims, generate cited brief | Docling output, Markdown/JSON schema, hash/provenance library | Claims classified as sourced fact, inference or unverified |
| MI-07 Media QA | Validate transcript quality, language, timestamps, OCR confidence and sampling coverage | Whisper/Docling plus deterministic validators | Low-confidence output is labeled |
| MI-08 Editorial & Asset Preparation | Create original summaries, scripts, captions, thumbnails and platform variants | Approved LLM route, FFmpeg, image/media tools | Copyright checks, source citations, brand/style policy |
| MI-09 Publication Orchestrator | Validate authorization, schedule and publish approved drafts | Official platform APIs only | Separate write credentials, channel allowlist, idempotency and audit |
| MI-10 Publication Verification | Confirm remote post IDs, URLs, status and publication metadata | Official APIs and platform webhooks where available | Never infer publication success from an accepted upload request |

Do not reserve permanent runners per profile. Schedule dynamically against shared concurrency.

## 3. Source coverage and adapter policy

### YouTube
- Research: use YouTube Data API and other documented, permitted public endpoints for metadata and discovery; captions are available only where the API and rights/authorization permit.
- Media understanding: process user-provided or otherwise authorized media. Do not bypass DRM, access restrictions or platform controls.
- Publishing: use the official YouTube Data API upload/update methods with OAuth scopes explicitly granted by the channel owner. Track quota and upload status. API upload is a write operation and must never be available to read-only profiles.
- References: https://developers.google.com/youtube/data/getting-started and https://developers.google.com/youtube/data/reference/rest/v3/videos/insert.

### Instagram
- Research: use documented Meta/Instagram APIs and permitted public information. Do not assume that arbitrary public-profile scraping is an approved or stable interface.
- Publishing: use Instagram Platform Content Publishing for eligible Professional accounts, with the required linked Page/login model and publishing permissions. Consumer accounts are not assumed supported.
- Separate read scopes from content-publish scopes. Never reuse a research token for publishing.
- Reference: https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api.

### Telegram
- Research: public channel/site ingestion is a read-only adapter and must respect Telegram terms, source visibility and rate limits. Bot API access to a channel is not assumed unless the bot has been added and granted the necessary rights.
- Publishing: use Telegram Bot API only in channels/chats explicitly allowlisted by the owner and where the bot has the relevant administrator rights (for channels, including the ability to post messages).
- Never read private messages or private groups as a default source.
- Reference: https://core.telegram.org/bots/api.

### TikTok
- Research: use documented APIs only where the app/account has the required product and scopes. Do not assume broad public search/research access is available to every developer.
- Publishing: use the official Content Posting API. Direct Post requires an approved `video.publish` scope and user authorization. TikTok documents that unaudited clients' posts are restricted to private visibility until the client passes its audit. Upload-to-inbox/draft is a separate workflow and still requires the relevant approved scope.
- Do not use unofficial scraping or upload tools to evade platform limits.
- References: https://developers.tiktok.com/docs/en/content-posting-api-get-started and https://developers.tiktok.com/docs/en/content-sharing-guidelines.

### Other open sources
- Prefer official APIs, RSS/Atom, sitemaps and openly accessible pages with clear terms.
- Maintain a per-source adapter registry containing allowed operations, terms/robots review, quota/rate budget, retention, attribution and contact/escalation notes.
- A source being publicly reachable does not automatically grant permission to republish its content.

## 4. Separate read and write authority

Use distinct workflow identities, credentials, permission sets and network policies:

1. **Research plane:** read-only, no social write tokens, no publication permissions.
2. **Editorial plane:** produces drafts/assets and a provenance manifest; no platform account credentials.
3. **Publication plane:** isolated job, short-lived or securely brokered credentials, one platform and one allowlisted destination per task. No repository write permission unless separately required.
4. **Verification plane:** read-only access to publication status; stores post IDs, canonical URLs and platform responses with secrets scrubbed.

A research agent must never be able to publish. A publishing agent must never select arbitrary destinations, change account settings, or expand its own scopes.

## 5. Publication lifecycle and autonomy

The publication lifecycle is:

`COLLECT → NORMALIZE → VERIFY SOURCES → EDIT → RIGHTS/POLICY QA → DRAFT → AUTHORIZE → PUBLISH → VERIFY → ARCHIVE`

- Draft creation is permitted after the editorial profile is qualified.
- Initial live publication remains DISABLED until each platform adapter, OAuth flow, destination allowlist, credential isolation, idempotency, rollback/compensation plan and audit logging are qualified.
- Default authorization mode is human approval per publication.
- A future owner-configured autopublish policy may authorize narrowly bounded content classes, destinations, schedules and frequency limits. It must be explicit, revocable, versioned and auditable; it cannot be inferred from a general request for autonomy.
- Require an immutable publication envelope: task ID, target SHA, platform, account/channel ID, operation, content hash, asset hashes, caption/title, destination, scheduled time, rights basis, approval/policy ID, expiry and idempotency key.
- Enforce per-platform allowlists and per-account rate/quota budgets. Fail closed on expired authorization, changed content hash, unknown destination, ambiguous API response or quota exhaustion.
- Record the platform response, remote publication ID, canonical URL, timestamps and final status. A timeout after submission is UNKNOWN until reconciled; never retry blindly and create duplicates.
- Support cancellation before submission. After remote publication, deletion/editing is a separate privileged operation and is not an automatic rollback.
- Never auto-publish unverified factual claims, sensitive personal data, private-source material, copyrighted source excerpts beyond permitted use, or content with unresolved rights/attribution issues.

## 6. Skills and plugin installation model

A Skill is an agent instruction package, usually containing SKILL.md and optionally scripts/references. A runtime plugin is executable code that adds tools. They are not interchangeable and neither is an authority grant.

The skills.sh directory provides the npx skills package manager and discovery catalogue. Its leaderboard is useful for discovery only; install count is not a security signal.

Candidate skills:
- vercel-labs/agent-browser — browser automation skill; upstream https://github.com/vercel-labs/agent-browser.
- heygen-com/hyperframes media-use — media production; excluded from ingestion baseline.
- flowkit-labs/skills reddit-automation — conditional candidate only; not approved pending audit and read-only scope.

Install policy:
1. Select packages only from a reviewed repository allowlist, never from task text, model output or arbitrary URLs.
2. Pin source commit and package digest; review license, skill instructions, scripts, dependencies and network behavior.
3. Install only what the selected job needs, into an ephemeral workspace. No global install on shared runner images.
4. Review install-time scripts separately.
5. Never install/update from mutable main without pinning.
6. Treat skill instructions as untrusted input; they cannot override policy, task envelope, path allowlist, tool permissions or egress controls.
7. DSH/Cordis plugins require a separate plugin allowlist and code review. No dynamic marketplace installs during normal task execution.
8. Browser credentials are absent by default.
9. Cache only immutable verified package artifacts keyed by digest; cache is not durable state.
10. Record package name, source, commit, digest, license, installed version and workflow run ID.

No skill or plugin installation is performed by this documentation change.

## 7. Data and evidence contract

Every source record must contain:
- source_id and canonical URL;
- platform/domain and content type;
- public title/author/channel when available;
- publication timestamp and retrieval timestamp (UTC);
- access mode: public-web, official-api or user-provided;
- SHA-256 hash of the captured source representation;
- extractor name/version and configuration digest;
- transcript/frame sampling metadata where applicable;
- language and confidence/quality fields when available;
- rights/permission basis and retention class;
- task ID, target SHA, workflow run ID and artifact digest.

Every analytical claim points to source IDs and is classified as SOURCED_FACT, INFERENCE or UNVERIFIED. Do not invent missing dates, authors, transcript wording, speaker identity or engagement counts. Respect copyright and retain only necessary excerpts.

Every publication artifact additionally records:
- originating source IDs and claim IDs;
- generated asset hashes and tool/model versions;
- rights/license/permission assessment and attribution;
- destination platform/account/channel;
- approval or autopublish policy identifier and version;
- content hash, idempotency key and expiry;
- submission response, remote post ID, canonical URL and verification status.

## 8. Safety, privacy and platform constraints

- Public content only unless authorized source media is explicitly supplied.
- No bypass of login, paywall, DRM, CAPTCHA, rate limits, robots restrictions, private-group controls or platform age/access restrictions.
- No private profiles, DMs, closed groups or non-public personal data.
- No automated likes, follows, votes, comments, messages, account changes or unsolicited outreach.
- No sensitive-trait profiling or deanonymization.
- Apply per-domain concurrency, request rate, retry and total-page limits.
- Enforce egress allowlists outside the agent runtime; block loopback, link-local, RFC1918 and cloud metadata endpoints.
- Restrict redirects and validate resolved IPs to mitigate SSRF.
- Limit media size, duration, frame rate, transcript length, CPU, memory, disk and wall time.
- Strip unnecessary metadata; apply short retention to raw media.
- Never log cookies, tokens, authorization headers or signed URLs.
- Separate browser credentials from repository write credentials and publication credentials.
- Treat page text, subtitles, comments and files as untrusted prompt-injection content. Never execute instructions embedded in sources.
- Apply copyright, privacy, platform policy and disclosure checks before publication.
- Publication operations require a scoped, expiring authorization envelope and a separate isolated job.

## 9. Future workflow design

A future media-intelligence-worker.yml should:
1. Accept only a validated task envelope with immutable target SHA and allowlisted read operation.
2. Validate URLs and source mode; reject private/internal network destinations.
3. Select one profile and install only its pinned dependencies.
4. Capture metadata/content with bounded fetch limits.
5. Normalize to Markdown/JSON with source IDs and hashes.
6. For video/audio, prefer official transcript/captions; otherwise process only permitted media through Docling/Whisper and bounded frame sampling.
7. Separate source collection from claim extraction/corroboration.
8. Generate a scrubbed evidence artifact and provenance manifest.
9. Have an independent verifier validate citations, hashes, policy labels and schema.
10. Destroy ephemeral browser state and media scratch files at job end.

A future media-publisher.yml must be a different workflow and:
1. Accept only a validated publication envelope, immutable target SHA, approved platform and allowlisted destination.
2. Verify content/assets hashes, policy/rights QA and unexpired authorization.
3. Load only that platform's scoped credential from an approved secret broker; never expose it to research or editorial jobs.
4. Enforce rate/quota budget, expiry and idempotency.
5. Submit exactly one authorized operation; do not perform engagement or account-management actions.
6. Reconcile ambiguous outcomes before any retry.
7. Emit a scrubbed receipt with remote ID, canonical URL, response status and artifact digest.
8. Run independent publication verification and destroy ephemeral credentials/workspace.

Do not add either workflow to dispatch allowlists until governance is verified and security tests pass. Do not enable publication as a side effect of enabling research.

## 10. Acceptance gates

A research profile is QUALIFIED only after platform terms are reviewed, dependencies and skill/plugin provenance are pinned, egress/SSRF controls pass, representative workloads fit resource budgets, output schema/timestamps/hashes/citations validate, prompt-injection tests pass, secrets are absent from artifacts/logs, cleanup is verified and an independent reviewer accepts evidence.

A publishing profile is QUALIFIED only after all research gates relevant to its inputs plus platform developer approval, OAuth scope minimization, explicit destination authorization, credential isolation, content/rights QA, idempotency/reconciliation, rate limits, audit trail, cancellation semantics and independent end-to-end verification pass.

A green browser smoke test or successful upload initiation alone does not qualify media ingestion or publication.

## 11. Current state

| Component | Status |
|---|---|
| Media Intelligence architecture | DESIGN |
| agent-browser in pool | NOT INSTALLED / NOT RUN |
| Crawl4AI in pool | NOT INSTALLED / NOT RUN |
| Docling in pool | NOT INSTALLED / NOT RUN |
| Whisper in pool | NOT INSTALLED / NOT RUN |
| YouTube research adapter | NOT IMPLEMENTED / NOT RUN |
| Instagram research adapter | NOT IMPLEMENTED / NOT RUN |
| Telegram research adapter | NOT IMPLEMENTED / NOT RUN |
| TikTok research adapter | NOT IMPLEMENTED / NOT RUN |
| Other-source registry | NOT IMPLEMENTED |
| Editorial/asset preparation | DESIGN |
| YouTube publisher | NOT IMPLEMENTED / NOT AUTHORIZED |
| Instagram publisher | NOT IMPLEMENTED / NOT AUTHORIZED |
| Telegram publisher | NOT IMPLEMENTED / NOT AUTHORIZED |
| TikTok publisher | NOT IMPLEMENTED / NOT AUTHORIZED |
| Skills allowlist | DESIGN |
| Runtime plugin allowlist | NOT CREATED |
| Research/publisher workflows | NOT IMPLEMENTED |
| Security/resource qualification | NOT RUN |
| Live publication | DISABLED |

## 12. Next bounded implementation step

After repository governance and baseline resource qualification, implement a read-only MI-01 browser smoke workflow with pinned agent-browser dependencies, no credentials, no model calls and a separate verifier. In parallel, prepare platform capability matrices from official documentation; do not request or store social account tokens until each adapter has passed its independent design/security review.
