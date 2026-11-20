# Pass 31 — frozen schema-0010 upgrade proof — 2026-11-20

## Frozen target and repository state

- Default branch `Основной`: `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- Pass 30 implementation target: `d56d334d2045d08fd7aa71feb9749aab08d96840`.
- Pass 31 implementation/test head: `07de06e4f48984d5130d4e4a3bc8ae81750be4bf`.
- Exact integrated CI checkout: `b87ea5ea4121729762d80b305981052d98b966f4`, parents default `b81d2b52...` and Pass 31 head `07de06e4...`.
- PR #154 implementation and PR #156 validation-only remain OPEN/DRAFT/UNMERGED. PR #156 must not be merged.
- Issue #140 remains OPEN; Issue #151 remains PLANNED and deferred.

## Research and design

Reviewed Cloudflare's official Workers Vitest integration guidance for `readD1Migrations` and `applyD1Migrations`, plus D1 migration apply/export guidance. The supported test API applies an ordered migration subset to a D1 binding. The upgrade test therefore uses a separate synthetic D1 binding and two explicit stages: migrations 0001–0010, historical row seeding, then migrations 0011–0012. It does not treat a fresh 0001–0012 migration run as upgrade evidence.

## Implementation

- Added an isolated `UPGRADE_DB` binding with a separate synthetic database ID.
- Added `test/migration-upgrade.test.ts`: applies only 0001–0010, seeds historical synthetic approval/task/approval-link/task-ready-outbox/attempt/projection-outbox records at the schema-0010 boundary, then applies only 0011–0012.
- Tests cover historical ID and relationship preservation; default comment-post state; intentionally-null legacy executor identity and fail-closed consumption; new executor-bound admission, receipt and task-ready outbox linkage; exact replay; cross-executor task-key collision; idempotent migration reapplication; invalid foreign reference; missing and forged receipt replay denial; malformed outbox event rejection.
- Updated the D1 proof README. No new dependencies.
- First CI attempt at the initial draft found a test assertion that passed a prepared statement rather than its `.run()` promise to Vitest `.rejects`. Corrected it and added the additional adversarial cases. The initial failure is retained as evidence, not hidden.

## Exact-head validation

Final exact source HEAD: `07de06e4f48984d5130d4e4a3bc8ae81750be4bf`.

- D1 run [44701738713](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44701738713), job `136171500229`: COMPLETED / SUCCESS.
- Job log confirms checkout merge `b87ea5ea4121729762d80b305981052d98b966f4`, Node.js 24.9.0, `npm ci --ignore-scripts --no-audit --no-fund`, `npm run check`, and `npm test`.
- Test summary: 4 files passed; 36 tests passed; 0 failed. Upgrade suite: 7 tests passed.
- Pool Contract Validation [44701738592](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44701738592), job `136171500702`: COMPLETED / SUCCESS.
- Contract log confirms `POOL_DISPATCH_ENABLED=false`, all workflow YAML parsed, and `POOL_CONTRACT_VALIDATION=PASS`.
- Earlier run [44701503787](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44701503787) failed 1/35 due the test harness assertion issue; the correction was followed by the successful final exact-head runs above.
- Source files and blob SHAs are recorded in the Pass 31 checkpoint and repository tree; the test file blob at the final code commit is `bfe955f52398d13311f1a85d9402b1604b1721cc`.

## Validation boundary

- Frozen synthetic schema-0010 staged upgrade through 0011–0012: VERIFIED by final exact-head CI.
- Fresh install 0001–0012: VERIFIED as part of the same full test suite.
- Hosted D1, credentials/secrets, provider calls, dispatch, executor launch, deployment, merge and production writes: NOT RUN.
- Independent review: NOT VERIFIED.
- Gemini/Claude dispatch: NOT RUN. No secrets or secret values were read.
- Detailed ruleset conditions were not changed; no workflow filters, permissions, branch protection or governance controls were modified.

## Status

Pass 31 migration-upgrade proof: VERIFIED / SUCCEEDED. PR #154 and #156 remain OPEN/DRAFT/UNMERGED. Contour A remains BLOCKED / NOT ACCEPTED because runtime deployment, real executor, model routing, quotas, account isolation, recovery and independent acceptance remain outstanding. Contour B remains DEFERRED.

## Next

1. Preserve the Pass 31 evidence and review the full PR diff independently.
2. Continue with bounded transaction ambiguity, retry safety and durable readback proof (candidate Pass 32), without hosted D1 mutations or enabling dispatch.
3. Continue full SQL/trigger and lease fencing review only after exact-head source reconciliation.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
