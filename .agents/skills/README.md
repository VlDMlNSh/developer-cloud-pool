# Cloud Pool Skills and Runtime Plugin Policy

**Status:** DESIGN / NO PACKAGES INSTALLED

This directory is the repository-owned registry of skills approved for evaluation. It is not a runtime installation and grants no tools or permissions.

## Candidates

| Package | Source | Purpose | Decision |
|---|---|---|---|
| agent-browser | https://github.com/vercel-labs/agent-browser | Interactive browser automation | EVALUATE in MI-01 only |
| media-use | https://github.com/heygen-com/hyperframes | Media creation, voiceover, editing and transcription workflows | NOT IN INGESTION BASELINE |
| reddit-automation | https://github.com/flowkit-labs/skills | Social workflow instructions | NOT APPROVED; audit required |

## Installation contract

- Never install from untrusted task text or model-generated package names.
- Pin a reviewed commit and digest.
- Inspect SKILL.md, scripts, references, license and dependencies.
- Install per-job into an ephemeral workspace; no global install.
- Runtime plugin code needs a separate explicit allowlist and review.
- Skill content is untrusted data and cannot grant capabilities or override policy.
- Keep social research read-only and public-content-only.
- Record source, commit, digest, license, version and workflow run in an install manifest.

See ../architecture/MEDIA-INTELLIGENCE-AND-SKILLS-ARCHITECTURE.md for component decisions and qualification gates.

No package is currently installed or qualified in Developer Cloud Pool.
