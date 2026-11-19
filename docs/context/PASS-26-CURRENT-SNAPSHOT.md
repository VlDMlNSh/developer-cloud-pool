# Context Window refresh — Pass 26 (2026-11-19)

Append-only current snapshot supplementing [GITHUB-CONTEXT-WINDOW.md](./GITHUB-CONTEXT-WINDOW.md).

- Default `Основной`: `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- Issue #140 OPEN; local/no-secret D1 qualification only.
- PR #148 clean-base D1 migrations 0001–0010: OPEN/DRAFT/UNMERGED, head `613790e739aece5028dca54ae82b2d853fa95642`.
- PR #149 migration 0011 executor identity: OPEN/DRAFT/UNMERGED, head `3a64c045a6cdd5890846dbd75bc53952ed1ba718`.
- PR #150 Pass26 identity v2 module/tests: OPEN/DRAFT/UNMERGED, stacked on #149, head `8b02ea8d120bdcd56bbb9233de5906f02e67a2cb`.
- v2 tuple includes repository ID, issue, target SHA, capability profile, executor ID and schema version; executor identity is a separate field.
- Exact-head CI lookup for #150 returned no runs: NOT VERIFIED; tests authored only.
- Historical PR #72 adapter still uses DSH/v1 and must not be transplanted unchanged.
- No hosted D1, secret reads, provider calls, dispatch, deployment, merge or governance changes.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Next: end-to-end adapter/SQL integration for executor-bound v2 identity and adversarial replay/concurrency tests.
- Report: [Pass 26](../reports/2026-11-19-pass-26-executor-bound-task-identity-v2.md); checkpoint: [Pass 26](../checkpoints/2026-11-19-pass-26-executor-bound-task-identity-v2.md).
