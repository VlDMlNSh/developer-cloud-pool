# 2026-11-19 — Pass 25 checkpoint

**Status: VERIFIED — migration 0011 and exact-head CI pass; adapter task-key binding still outstanding.**

- Default HEAD: `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- PR #148 clean-base D1 head: `613790e739aece5028dca54ae82b2d853fa95642`.
- PR #149 Pass25 branch head: `3a64c045a6cdd5890846dbd75bc53952ed1ba718`, stacked on PR #148.
- Migration 0011 adds immutable executor identity to approval and task records; no unsafe backfill; replaces task-keyed trigger with executor-bound conflict checks; drops legacy approval-keyed trigger.
- 6/6 Workers-runtime D1 tests passed on exact head. CI: D1 run 44592122672 SUCCESS; Pool Contract run 44592122775 SUCCESS.
- PR #149 OPEN / DRAFT / UNMERGED.
- Adapter canonical task-key serialization does NOT YET include executor ID. Atomic admission, lease integration, legacy write-denial and schema-0010 upgrade fixture remain outstanding.
- No hosted D1, secrets, providers, dispatch, executor launch, deployment, merge or governance mutation.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Next: adapt canonical task-key serialization and adapter replay/conflict tests to bind executor ID independently of capability profile.

Report: [Pass 25 report](../reports/2026-11-19-pass-25-executor-identity-binding.md).
