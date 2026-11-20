# Context Window refresh — Pass 25 (2026-11-19)

Append-only current snapshot; complements [GITHUB-CONTEXT-WINDOW.md](./GITHUB-CONTEXT-WINDOW.md).

- Default `Основной`: `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- Issue #140 OPEN.
- PR #148 clean-base foundation: OPEN/DRAFT/UNMERGED, head `613790e739aece5028dca54ae82b2d853fa95642`.
- PR #149 executor identity tranche: OPEN/DRAFT/UNMERGED, stacked on #148, head `3a64c045a6cdd5890846dbd75bc53952ed1ba718`.
- Migration 0011 adds immutable executor identity to approval/task rows; rejects missing identity and cross-executor task-key collision; drops legacy approval-keyed trigger; does not backfill historical rows.
- Exact-head CI: D1 run 44592122672 SUCCESS (6/6 Workers D1 tests); Pool Contract run 44592122775 SUCCESS.
- Adapter canonical task-key serialization still omits executor ID; this remains the next integration task. Atomic admission and lease/legacy retirement remain incomplete.
- No hosted D1, secrets, provider calls, dispatch, agent launch, deployment, merge or governance changes.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Next: adapt canonical task-key serialization and adapter replay/conflict tests.
- Full report: [Pass 25](../reports/2026-11-19-pass-25-executor-identity-binding.md); checkpoint: [Pass 25 checkpoint](../checkpoints/2026-11-19-pass-25-executor-identity-binding.md).
