# 2026-11-19 — Pass 26 checkpoint

**Status: IMPLEMENTED / CI NOT VERIFIED.**
- Default `Основной`: `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- PR #149 migration 0011: OPEN/DRAFT, head `3a64c045a6cdd5890846dbd75bc53952ed1ba718`.
- PR #150 canonical task identity v2: OPEN/DRAFT, stacked on #149, head `8b02ea8d120bdcd56bbb9233de5906f02e67a2cb`.
- New module `proofs/d1-ledger/src/task-identity.mjs` binds repository, issue, target SHA, capability profile, executor ID and schema version into versioned SHA-256 task key.
- New tests cover determinism, cross-executor separation, profile separation and invalid input. Tests authored; exact-head CI lookup returned no runs, so execution NOT VERIFIED.
- Historical PR #72 adapter remains unported (legacy DSH + v1 key). Atomic admission, lease, legacy write denial, upgrade fixture and independent review outstanding.
- No hosted D1, secrets, providers, dispatch, deployment or merge.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Next: end-to-end adapt admission adapter + SQL bindings to v2 executor identity and prove replay/concurrency/fail-closed cases.
Report: [Pass 26](../reports/2026-11-19-pass-26-executor-bound-task-identity-v2.md).
