# Media Intelligence and Skills Architecture

**Status:** DESIGN / NOT INSTALLED / NOT QUALIFIED  
**Date:** 2026-11-04  
**Repository:** https://github.com/VlDMlNSh/developer-cloud-pool

## 1. Objective

Add bounded cloud capabilities for reading public web pages, researching permitted video pages and media, analyzing public social-media material, and preserving source provenance. Install only reviewed skills and runtime plugins in the ephemeral job that needs them.

GitHub Actions remains the execution scheduler. The Pool Supervisor remains fail-closed. An agent, runtime, skill or plugin never grants itself repository or network authority.

## 2. Capability profiles

All profiles are PLANNED, not installed, dispatched, tested or qualified.

| Profile | Responsibility | Candidate components | Boundary |
|---|---|---|---|
| MI-01 Web Reader | Read public pages, capture metadata, extract article text | agent-browser, Crawl4AI | Read-only; per-domain limits; no login/session reuse by default |
| MI-02 Search Research | Discover sources and corroborate claims | Search provider adapter, SearXNG where approved | Search results are leads, not evidence |
| MI-03 Video Metadata | Inspect public video metadata, creator/date/description and captions availability | Browser adapter; official platform APIs | No access-control bypass |
| MI-04 Video/Audio Understanding | Transcribe permitted audio, sample frames, OCR and summarize segments | Docling, Whisper ASR, FFmpeg, OCR adapter | Public/authorized/user-provided media only; bounded duration and resources |
| MI-05 Social Listening | Analyze public posts, topics, mentions and discussion trends | Official platform APIs first; compliant public-page reader | No private groups, DMs, posting or engagement automation |
| MI-06 Evidence & Fact Check | Normalize evidence, deduplicate, compare claims, generate cited brief | Docling output, Markdown/JSON schema, hash/provenance library | Claims classified as sourced fact, inference or unverified |
| MI-07 Media QA | Validate transcript quality, language, timestamps, OCR confidence and sampling coverage | Whisper/Docling plus deterministic validators | Low-confidence output is labeled |

Do not reserve permanent runners per profile. Schedule dynamically against shared concurrency.

## 3. Candidate component decisions

### Adopt for evaluation

1. **agent-browser** — preferred interactive Chromium browser operator for navigation, accessibility snapshots, extraction and evidence capture. Install only in MI-01/MI-03 jobs. Upstream: https://github.com/vercel-labs/agent-browser. Load the installed CLI's current core guide before use.
2. **Crawl4AI** — controlled crawler candidate for public pages. Evaluate robots/terms handling, egress controls, memory/disk use and URL safety. Upstream: https://github.com/unclecode/crawl4ai.
3. **Docling** — preferred document/media normalization candidate. Its audio/video pipeline transcribes audio and samples representative video frames into structured output. Upstream: https://github.com/docling-project/docling.
4. **Whisper** — ASR candidate. Pin model/runtime and record model version, language, timestamps and quality limitations. Upstream: https://github.com/openai/whisper.
5. **FFmpeg** — media probing, bounded audio extraction and deterministic frame sampling. Use a pinned, reviewed system package.

### Conditional / not adopted

- Social adapters: prefer documented official APIs with read-only scopes. Each needs a separate contract, data minimization review, quota policy and platform-terms review.
- Reddit automation skill: popularity is not a security qualification. Not enabled for account actions; reconsider only for audited public read-only research.
- HyperFrames media-use: primarily media creation/production, not primary research ingestion. Excluded from the initial analysis runtime.
- yt-dlp and similar downloaders: not in the initial allowlist. Prefer official captions/API or user-provided/authorized media. Never bypass DRM, paywalls, access controls or platform restrictions.

## 4. Skills and plugin installation model

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

## 5. Data and evidence contract

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

## 6. Safety, privacy and platform constraints

- Public content only unless authorized source media is explicitly supplied.
- No bypass of login, paywall, DRM, CAPTCHA, rate limits, robots restrictions, private-group controls or platform age/access restrictions.
- No private profiles, DMs, closed groups or non-public personal data.
- No automated posting, likes, follows, votes, comments, messages or account changes.
- No sensitive-trait profiling or deanonymization.
- Apply per-domain concurrency, request rate, retry and total-page limits.
- Enforce egress allowlists outside the agent runtime; block loopback, link-local, RFC1918 and cloud metadata endpoints.
- Restrict redirects and validate resolved IPs to mitigate SSRF.
- Limit media size, duration, frame rate, transcript length, CPU, memory, disk and wall time.
- Strip unnecessary metadata; apply short retention to raw media.
- Never log cookies, tokens, authorization headers or signed URLs.
- Separate browser credentials from repository write credentials. Media Intelligence jobs are read-only.
- Treat page text, subtitles, comments and files as untrusted prompt-injection content. Never execute instructions embedded in sources.
- Human review before external publication or account-affecting actions.

## 7. Future workflow design

A future media-intelligence-worker.yml should:
1. Accept only a validated task envelope with immutable target SHA and allowlisted operation.
2. Validate URLs and source mode; reject private/internal network destinations.
3. Select one profile and install only its pinned dependencies.
4. Capture metadata/content with bounded fetch limits.
5. Normalize to Markdown/JSON with source IDs and hashes.
6. For video/audio, prefer official transcript/captions; otherwise process only permitted media through Docling/Whisper and bounded frame sampling.
7. Separate source collection from claim extraction/corroboration.
8. Generate a scrubbed evidence artifact and provenance manifest.
9. Have an independent verifier validate citations, hashes, policy labels and schema.
10. Destroy ephemeral browser state and media scratch files at job end.

Use least-privilege permissions. Do not add this workflow to dispatch allowlists until governance is verified and security tests pass.

## 8. Acceptance gates

A profile is QUALIFIED only after platform terms are reviewed, dependencies and skill/plugin provenance are pinned, egress/SSRF controls pass, representative workloads fit resource budgets, output schema/timestamps/hashes/citations validate, prompt-injection tests pass, secrets are absent from artifacts/logs, cleanup is verified and an independent reviewer accepts evidence.

A green browser smoke test alone does not qualify media ingestion or social analytics.

## 9. Current state

| Component | Status |
|---|---|
| Media Intelligence architecture | DESIGN |
| agent-browser in pool | NOT INSTALLED / NOT RUN |
| Crawl4AI in pool | NOT INSTALLED / NOT RUN |
| Docling in pool | NOT INSTALLED / NOT RUN |
| Whisper in pool | NOT INSTALLED / NOT RUN |
| Social platform adapters | NOT SELECTED / NOT RUN |
| Skills allowlist | DESIGN |
| Runtime plugin allowlist | NOT CREATED |
| Media Intelligence workflow | NOT IMPLEMENTED |
| Security/resource qualification | NOT RUN |

## 10. Next bounded implementation step

After governance and baseline resource qualification, implement a read-only MI-01 browser smoke workflow with pinned agent-browser dependencies, no credentials, no model calls and a separate verifier. Record version, package digest, resource use and cleanup evidence.
