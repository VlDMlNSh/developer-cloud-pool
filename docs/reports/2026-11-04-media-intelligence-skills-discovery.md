# Engineering report — 2026-11-04: Media Intelligence architecture and skills discovery

## Immutable target

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Base branch: Основной
- Base SHA: 4597617db0de7cc698cce936a540594ee3d25bf2
- Work branch: feat/media-intelligence-skills-2026-11-04

## Work completed

Prepared a design for bounded cloud capabilities to read public web pages, inspect permitted public video metadata, transcribe authorized audio/video and analyze public social-media material. Defined seven logical profiles, a source provenance schema, security constraints, workflow stages and acceptance gates.

Created a repository-owned skills/plugin policy. It distinguishes instruction packages from executable runtime plugins, requires explicit allowlists and immutable provenance, and rejects installation based on task text or model output.

## Candidate assessment

- agent-browser: preferred browser automation candidate for isolated MI-01/MI-03 jobs; runtime usage instructions must be loaded from the installed version.
- Crawl4AI: controlled public-page crawling candidate, pending SSRF/egress and resource tests.
- Docling: preferred media/document normalization candidate; upstream documents audio/video transcription and representative frame sampling.
- Whisper: ASR candidate; pin model/runtime and capture language, timestamps and quality limitations.
- FFmpeg: bounded media probing and frame extraction candidate.
- Official platform APIs: preferred social data source; each adapter requires independent policy, scope and quota review.
- Reddit automation and HyperFrames media-use are not enabled; the former is unreviewed for this read-only use case, the latter is primarily a media-creation skill.

## Security constraints

Public/authorized inputs only; no bypass of access controls, DRM, paywalls, age gates, CAPTCHAs, rate limits or platform restrictions. No private groups, DMs, posting, likes, follows, votes or messaging. Block SSRF/private-network targets; enforce per-domain rate limits, media size/duration budgets, prompt-injection isolation, short retention and read-only credentials.

## Evidence and source references

- Skills directory leaderboard: https://www.skills.sh/
- agent-browser upstream: https://github.com/vercel-labs/agent-browser
- agent-browser core guide: https://github.com/vercel-labs/agent-browser/blob/main/skill-data/core/SKILL.md
- Docling audio/video processing: https://docling-project.github.io/docling/usage/processing_audio_media/
- Docling upstream: https://github.com/docling-project/docling
- Whisper upstream: https://github.com/openai/whisper
- Crawl4AI upstream: https://github.com/unclecode/crawl4ai
- HyperFrames media-use skill: https://github.com/heygen-com/hyperframes/blob/main/skills/media-use/SKILL.md

## Status

- Architecture document: CREATED.
- Skills policy: CREATED.
- Runtime installation: NOT RUN.
- Browser smoke test: NOT RUN.
- Video/audio processing: NOT RUN.
- Social API adapters: NOT SELECTED / NOT RUN.
- Security review: NOT RUN.
- Profile qualification: NOT QUALIFIED.
- No credentials, provider secrets, paid APIs or local machines were used.

## Next step

After repository governance and baseline resource qualification, implement only the read-only MI-01 browser smoke workflow with pinned agent-browser dependencies, no credentials and a separate independent verifier.
