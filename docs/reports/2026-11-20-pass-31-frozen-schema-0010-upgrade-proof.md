# Pass 31 — frozen schema-0010 upgrade proof — 2026-11-20

## Frozen target and repository state

- Default branch `Основной`: `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- Pass 30 implementation target: `d56d334d2045d08fd7aa71feb9749aab08d96840`.
- Validation surface PR #153 remains OPEN/DRAFT/UNMERGED and must not be merged.
- Implementation lineage remains PR #152, stacked on PR #150; PR #145 is the separate documentation branch.
- Issue #140 remains OPEN; Issue #151 remains PLANNED and deferred.

## Research and design

Reviewed Cloudflare's official Workers Vitest integration guidance for `readD1Migrations` and `applyD1Migrations`, plus D1 migration apply/export guidance. The supported test API applies an ordered migration subset to a D1 binding. The upgrade test therefore uses a separate synthetic D1 binding and two explicit stages: migrations 0001–0010, historical row seeding, then migrations 0011–0012. It does not treat a fresh 0001–0012 migration run as upgrade evidence.

## Implementation

- Added an isolated `UPGRADE_DB` binding with a separate synthetic database ID.
- Added `test/migration-upgrade.test.ts`: freezes the schema boundary at 0010, seeds legacy approval/task/approval-link/task-ready-outbox/attempt/projection-outbox records, then applies only 0011–0012.
- The suite checks historical ID and relationship preservation; legacy executor identity remains NULL and cannot be consumed; new executor-bound admission, receipt and task-ready outbox binding; exact replay; cross-executor logical task-key collision; idempotent migration reapplication; invalid foreign references; and replay denial after receipt loss.
- Updated the D1 proof README to distinguish clean-install tests from the staged upgrade proof.
- No dependency added. No hosted D1, secret, provider, dispatch, execution, deployment or production write is used.

## Validation

- Implementation and test source are committed on the Pass 31 feature branch.
- Exact-head CI evidence: PENDING / NOT VERIFIED until PR #153 runs on the new implementation HEAD and job logs are inspected.
- Local execution in this session: NOT RUN.
- Independent review: NOT VERIFIED.
- The fixture is synthetic and migration-driven at a pinned schema boundary; it is not a production database export.

## Governance and status

No workflow filters, permissions, branch protection, rulesets, secrets or governance controls were changed. Dispatch remains disabled and adapter responses remain non-dispatching. Gemini/Claude dispatch NOT RUN.

Contour A remains BLOCKED / NOT ACCEPTED. Contour B remains DEFERRED.

## Next

1. Inspect the exact-head CI run and logs for the Pass 31 feature HEAD.
2. Fix only demonstrated test/runtime failures without weakening governance.
3. Re-read all changed files and record blob/commit SHAs in the canonical Context Window, checkpoint and snapshot.
4. Continue to transaction ambiguity/readback only after the schema-0010 upgrade proof is verified.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
