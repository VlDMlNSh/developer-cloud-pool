# Tag ruleset read-back and Actions permission boundary — 2026-11-06

## Scope
Read-only recheck of repository tag rulesets, PR #32, exact-head CI and current branch refs. No settings or workflow changes.

## Immutable refs
- Default branch `Основной`: `197ba98d0dc7d8437d759dd25bee8750d02e59ae` (direct Git ref read).
- Documentation branch `docs/cross-chat-continuation-2026-11-06`: `8ce1e499afad188913a3d96a801fe04623a75a6f` before this report/context update.
- PR #32 head `75c83a288d865f1bbeda4905cf817e00084bcc2d`, base `197ba98d0dc7d8437d759dd25bee8750d02e59ae`, OPEN and UNMERGED.

## Tag ruleset — current direct read
- `GET /repos/VlDMlNSh/developer-cloud-pool/rulesets` returned exactly one ruleset: ID `26550182`, name `Основной — verified`, target `branch`, enforcement `active`.
- Detail endpoint confirms scope only `refs/heads/Основной`; rules are deletion, non-fast-forward and pull_request. No tag-target ruleset is present in the current complete collection.
- The branch ruleset requires 0 approving reviews, has no required reviewers, and does not require code-owner review. It does require review-thread resolution. No bypass actors; current user cannot bypass.
- This direct read supersedes the prior stale tag-ruleset read: dedicated tag ruleset is VERIFIED ABSENT as of this pass.

## Actions permissions — remaining read blocker
- Direct GET `/repos/VlDMlNSh/developer-cloud-pool/actions/permissions` was rejected by the connected GitHub fetch allowlist as not an approved endpoint. Workflow-permissions subresource is likewise not available through this connector.
- Repository connection admin metadata is not evidence of Supervisor GITHUB_TOKEN effective permissions or workflow token identity.
- No token, secret, credential value or workflow runtime was inspected.

## PR #32 and CI
- PR #32 OPEN / UNMERGED; head and base as above. Body confirms head commit and exact test blob references.
- Authorization Negative-First run `42236017811`: COMPLETED / FAILURE, expected red baseline (8/8 assertions fail).
- Pool Contract Validation run `42236017724`: COMPLETED / SUCCESS; does not qualify authorization.
- Independent review remains NOT RUN; no approvals or inline review threads were established in this pass.

## Security decision
- Dedicated tag ruleset is absent, so GitHub tag-create uniqueness/immutability is not currently enforced by a dedicated tag ruleset. No consume-tag experiment is safe or authorized.
- Actions effective permissions and Supervisor token identity remain NOT VERIFIED.
- Keep dispatch fail-closed. Do not run Worker, Supervisor dispatch, Gemini, Claude, or deployment. No production settings or code changed.

## Next bounded step
Find an owner-authorized, metadata-only route to inspect repository Actions default workflow permissions and the actual Supervisor workflow token permissions/identity without exposing the token. If this cannot be established, design a safer consume primitive that does not depend on tag ruleset and keep all execution disabled until independently tested.

## Status
- Default HEAD: VERIFIED `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- Dedicated tag ruleset: VERIFIED ABSENT.
- Actions permissions/token identity: NOT VERIFIED.
- PR #32 authorization contract: FAILED expected negative baseline; general contract CI SUCCESS.
- Independent review: NOT RUN.
- Consume experiment: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED; Contour B: DEFERRED.

Unified context: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/context/GITHUB-CONTEXT-WINDOW.md
MediaHub canonical map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
