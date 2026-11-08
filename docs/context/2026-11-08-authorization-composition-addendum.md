# Context Window addendum — 2026-11-08 authorization composition recheck

This is a dated continuation note for the canonical [GITHUB-CONTEXT-WINDOW.md](./GITHUB-CONTEXT-WINDOW.md). The complete source audit is [PR #36/#37/#39 authorization composition audit](../reports/2026-11-08-pr36-pr37-pr39-authorization-composition-audit.md).

- Default baseline: `Основной` @ `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- PR #37 branch `feat/reusable-pool-worker-boundary-2026-11-06`: `5587a4e013507b5be330fd0c49ce1fc836faa946`, 29 ahead / 0 behind. Exact-head Boundary Validation run `42284051309` / job `128122653104` SUCCESS; Contract Validation run `42284051311` / job `128120184802` SUCCESS. PR remains OPEN/DRAFT/UNMERGED.
- PR #36 D1 branch `proof/d1-single-use-ledger-retry-2026-11-06`: 39 ahead / 0 behind. Recorded head `e11fc90e50bd20b166207af64551c49cfa80ffb4`; D1 and contract runs `42329438351` / `42329438308` SUCCESS per current audit report.
- PR #39 branch `proof/d1-claim-outbox-atomic-2026-11-07`: `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`, 55 ahead / 0 behind. D1 proof run `42329993548` SUCCESS on its documented stacked merge tree. Local Workers/Miniflare proof only.
- PR #36/#37/#39 each have 0 formal reviews and 0 inline review threads. Empty combined status contexts are NOT VERIFIED.
- PR #37 improves least privilege but relies on non-CAS GitHub Issue label PATCH/read-back. Issue labels/body do not authenticate signed owner approval. Its finalizer lacks durable claim/run/lease binding.
- PR #36/#39 are not integrated into PR #37. D1 adapter receives owner/repository/time binding from caller; signed issuer, trusted clock, lease/fencing implementation, outbox consumer and recovery remain absent.
- Default branch remains unchanged and still contains the legacy privileged Supervisor/Worker chain. Live dispatch gate values NOT VERIFIED; keep fail-closed.
- No code/config/secrets/variables/rulesets/resources/deployments changed; no dispatch or provider/model call.
- Contour A BLOCKED / NOT ACCEPTED. Contour B DEFERRED.
- Next: independent security review of immutable PR #37 and the stacked D1 proof; then resolve findings and re-run exact-head CI. No merge/dispatch before review, governance and backend qualification.

