# Authenticated governance read-path — 2026-11-06

## Scope
Bounded, read-only investigation of the next blocker for single-use approval consumption: identifying a safe way to read tag ruleset scope and effective GitHub Actions token permissions. No production changes or dispatches were authorized or attempted.

## Immutable references
- Repository: `VlDMlNSh/developer-cloud-pool` (public).
- Default branch: `Основной`.
- Latest commit search HEAD: `197ba98d0dc7d8437d759dd25bee8750d02e59ae`; preceding commit `64d2636d4500127e635c214ccfb722c6b3fcda80` is historical, not current.
- PR #32 head: `75c83a288d865f1bbeda4905cf817e00084bcc2d`.
- Worker blob: `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`; Supervisor blob: `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`.

## Findings
1. Repository metadata says the linked GitHub connection has admin permission. This does not establish the identity or effective permissions of the GITHUB_TOKEN used by Supervisor.
2. The available GitHub connector exposes no read operation for repository Actions permissions or tag-target ruleset collection. Prior requests for `/actions/permissions` and `/actions/permissions/workflow` were rejected as unsupported. No alternative supported owner-authenticated read route was available in this pass.
3. Last complete ruleset collection evidence (report `2026-11-06-governance-and-tag-consume-readback.md`, blob `3bbe06adc63db24f6a41abf63fd2c3a1b3ee4fd0`) returned one ACTIVE branch-only ruleset #26550182 and no tag-target ruleset. This was not refreshed in this pass; current tag ruleset status is therefore NOT VERIFIED.
4. PR #32 reviews=0 and inline threads=0. Exact-head runs: #42236017811 authorization negative-first validation COMPLETED/FAILURE (expected red baseline); #42236017724 Pool Contract Validation COMPLETED/SUCCESS (not authorization qualification).
5. Worker/Supervisor source remains unchanged at the blobs above. Worker has workflow_dispatch and a report job with issues:write; Supervisor has workflow_run and issues:write/actions:write. These remain dispatch blockers.

## Security decision
- Do not equate repository admin permission with Actions workflow token permission.
- Do not attempt tag creation/race tests with an unidentified token or without an ACTIVE dedicated tag ruleset.
- Do not enable dispatch, run Worker/DSH, deploy, change settings, or read secret values.
- Keep dispatch fail-closed.

## Next step
Establish an explicit metadata-only owner-authenticated read path for: (a) GET repository rulesets, including tag-target scopes; (b) GET Actions permissions/workflow permissions; and (c) effective identity of the token available to the Supervisor workflow. If the connected integration cannot provide these reads, capture only the relevant non-secret metadata via a narrowly scoped owner-side read-only CLI/API invocation. No settings mutation is requested. Only after these facts are verified may a disposable isolated tag-consume test be designed.

## Status
- Default HEAD: VERIFIED.
- Tag ruleset current state: NOT VERIFIED (last complete read found none).
- Actions token identity/effective permissions: NOT VERIFIED.
- PR #32 independent review: NOT RUN.
- Consume experiment: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED; Contour B: DEFERRED.

Canonical unified context: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/context/GITHUB-CONTEXT-WINDOW.md
MediaHub canonical map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
