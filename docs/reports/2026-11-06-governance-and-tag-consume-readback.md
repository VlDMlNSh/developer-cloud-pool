# Governance and tag-consume read-back — 2026-11-06

## Immutable references
- Repository: `VlDMlNSh/developer-cloud-pool`, public; default branch `Основной`.
- Default branch HEAD: `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- Context branch: `docs/cross-chat-continuation-2026-11-06`; context prior blob `ec34af2573fc03a52401458b86af95c62df01c86`.
- PR #32 head `75c83a288d865f1bbeda4905cf817e00084bcc2d`, base `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.

## Governance read-back
- Repository ruleset collection returned exactly one ruleset: ID `26550182`, name `Основной — verified`, target `branch`, enforcement `active`.
- Ruleset conditions include only `refs/heads/Основной`; it is not a tag ruleset.
- Rules: deletion restriction, non-fast-forward restriction, pull-request requirement. PR parameters: `required_approving_review_count: 0`, `required_reviewers: []`, `require_code_owner_review: false`, `required_last_push_approval: false`, `required_review_thread_resolution: true`; allowed merge methods merge/squash/rebase.
- Ruleset bypass actors: empty; current connected identity `current_user_can_bypass: never`.
- Branch endpoint reports `protected: false`, protection disabled, required status checks enforcement off and no contexts/checks. Ruleset enforcement remains ACTIVE; do not conflate legacy branch-protection endpoint state with ruleset state.
- No tag-target ruleset was returned. This is confirmed by the complete ruleset collection response, not merely inferred from one ruleset lookup.

## Tag and permission checks
- `GET /git/matching-refs/tags/pool-consume-probe` returned an empty array. No disposable marker exists at that prefix.
- Attempts to read `/actions/permissions` and `/actions/permissions/workflow` through the available read connector were rejected as unsupported endpoints. Effective Actions workflow permissions and token identity therefore remain NOT VERIFIED.
- No tag was created; no ruleset, variable, Environment, secret, workflow, branch, or production setting was changed.
- No disposable create/race/read-back/update/delete-denial experiment was run because no dedicated tag ruleset or verified effective token permissions exist.

## PR #32 current evidence
- OPEN / DRAFT / UNMERGED; head `75c83a288d865f1bbeda4905cf817e00084bcc2d`; base `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- Reviews: 0. Inline review threads: 0. Independent review NOT RUN.
- Authorization negative-first CI run `42236017811`, job `127953700048`: COMPLETED/FAILURE, 8 tests, 0 passed, 8 failed; expected red baseline.
- Pool Contract Validation run `42236017724`, job `127953700415`: COMPLETED/SUCCESS; does not qualify authorization.
- Current production Worker/Supervisor blobs remain `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4` and `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`. Historical branches `feat/reusable-worker-call-boundary-2026-11-05` and `integration/zizmor-supervisor-removal-2026-11-05` resolve to these same unchanged blobs; they are not completed remediation branches.

## Decision and next action
- Tag-based consume is BLOCKED until a dedicated ACTIVE tag ruleset and actual Supervisor token identity/effective permissions are read back.
- Branch governance currently requires PR but zero approvals and has no required status checks in the legacy branch-protection endpoint. This is insufficient for independent security acceptance; no merge is authorized by this review.
- Keep dispatch fail-closed. Do not create a tag, mutate rulesets, enable Worker, run DSH, or deploy.
- Next bounded step: identify a no-cost, owner-authorized way to establish tag-ruleset governance and Actions token permissions; if unavailable, redesign the consume mechanism rather than weakening the invariant.

## Status
- Repository/default refs: VERIFIED.
- Branch ruleset: VERIFIED.
- Dedicated tag ruleset: ABSENT in returned ruleset collection.
- Effective Actions permissions/token identity: NOT VERIFIED.
- Disposable consume experiment: NOT RUN.
- Independent review: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
