# Pass 31 checkpoint — 2026-11-20

- Frozen implementation target: `d56d334d2045d08fd7aa71feb9749aab08d96840`.
- Default branch `Основной`: `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- Added separate local-only `UPGRADE_DB` binding and staged migration-upgrade test: apply 0001–0010, seed synthetic legacy relationships, then apply only 0011–0012.
- Test scope: legacy IDs/links/attempt/outbox preserved; executor ID not fabricated for historical rows; null-identity legacy approval denied; new executor-bound admission and durable receipt/outbox; exact replay; cross-executor task-key collision; idempotent reapplication; invalid FK; missing-receipt replay denial.
- No new dependencies, hosted D1, secret/provider access, dispatch, deployment, production writes, workflow/governance changes or merges.
- CI/local execution remain NOT VERIFIED until the new exact-head run and logs are inspected.
- PR #152 implementation and PR #153 validation must remain OPEN/DRAFT/UNMERGED.
- Issue #140 OPEN; Issue #151 PLANNED; Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Next: inspect exact-head CI and logs; fix only evidenced failures.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
