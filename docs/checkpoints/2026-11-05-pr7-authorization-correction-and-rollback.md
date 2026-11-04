# Live checkpoint — 2026-11-05 PR #7 authorization rollback

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch `Основной` HEAD: `64d2636d4500127e635c214ccfb722c6b3fcda80`; compare against `Основной` returned identical.
- PR #7: https://github.com/VlDMlNSh/developer-cloud-pool/pull/7
  - Current head after rollback: `e7a1d20bc123f9f3cc6e6651b6335bebd802e333`.
  - Base `692025e4a039aaf94c6683bb95da38b4f324fce8`; compared with current default: 40 ahead, 1 behind, diverged.
  - OPEN / DRAFT / NOT ACCEPTED.
  - Exploratory actor/comment provenance approach was rejected because owner architecture comment #issuecomment-6641873962 explicitly says actor is not calling-workflow identity and public comments/labels are not capabilities.
  - All five modified paths were restored to their exact baseline blobs from `d60d26ae647940e702d646e572c861a8f68f523e`:
    - Worker workflow `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`
    - approval module `9442c413c38dc28c67455362e254ff703bcfedd9`
    - approval tests `c7c7499d9d2bb4c123e72b86adb85369023c4284`
    - Supervisor script `b2046dd9671c6bd5491f63a006d10239fbd3d3b1`
    - contract validator `830d6bd5cfbd3f95e9c319e60764c9c5e9cf6def`
  - Exploratory CI run `41921136505`: FAILURE in owner approval test step; not acceptance evidence.
  - Restored exact-head CI run `41921293708`, job `126894183572`: COMPLETED / SUCCESS.
  - Independent security review NOT RUN.
- PR #8: OPEN / DRAFT; head `0a8dba68aa12070b3768d6fb834bedf404ed5d99`, base stale at former PR #7 head `d60d26a...`, mergeable false. Matrix builder max 20, 9 tests, but approval authenticity is caller responsibility; not wired into Supervisor; CI NOT VERIFIED.
- PR #11: OPEN / DRAFT, head `7b3bd8d8840e122f03326299444a921e3ba5f425`; exact-head CI `41918209585` SUCCESS; reviews/threads empty.
- Reusable Worker architecture is documented at [2026-11-04 Worker authorization architecture decision](../reports/2026-11-04-worker-authorization-architecture-decision.md): `workflow_call`, static call from protected Supervisor, verify caller/workflow contexts; two-phase bounded matrix planner plus reusable Worker and terminal recovery.
- Dispatch remains disabled/not qualified. No secrets, variables, paid services, Worker, DSH, browser, model/provider or privileged dispatch were used.

## Next
1. Start a fresh implementation branch from current default HEAD; reconcile PR #7's 1-commit divergence before any integration.
2. Review/evolve PR #8's matrix builder so caller-supplied approval is not treated as authenticated authority.
3. Implement bounded Supervisor planning + reusable Worker `workflow_call` in separate, testable stages.
4. Keep dispatch disabled; require independent security review and exact-head CI.
  
Detailed evidence: [2026-11-05 PR #7 authorization correction and rollback](../reports/2026-11-05-pr7-authorization-correction-and-rollback.md).
