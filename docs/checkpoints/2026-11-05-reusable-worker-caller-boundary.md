# Checkpoint — 2026-11-05 reusable Worker caller boundary

- Canonical base: `Основной` / `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Working branch: `feat/reusable-worker-call-boundary-2026-11-05`.
- Branch first commit: `1555b17702f97327d264386289ae3fa75c4f5eda`; one commit ahead, zero behind canonical base.
- Design contract blob: `138953c1c0b09098b009f4da5f4da12df67c65a2`; [contract](../design/reusable-worker-caller-contract-2026-11-05.md).

## Blocking facts
Default Worker `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4` still has `workflow_dispatch` and relies on public issue metadata. Default Supervisor `52bf03ca889edd92fd10c71ae96a2e35e106d43f` still uses REST dispatch. Caller authorization BLOCKED.

Do not reuse PR #8 matrix builder as an authorization gate: it accepts caller-supplied approval data. Do not reuse PR #7 public bot-comment approval marker: comments/labels are not capabilities.

PR #7 OPEN/DRAFT (40 ahead / 1 behind; CI `41921293708` SUCCESS; review NOT RUN). PR #8 OPEN/DRAFT (stale base; CI NOT VERIFIED; review NOT RUN). PR #11 OPEN/DRAFT (CI `41918209585` SUCCESS; review NOT RUN).

## Execution state
Design specified only. No runtime/code changes, no merges, no secrets/variables accessed or changed, `POOL_DISPATCH_ENABLED` NOT VERIFIED, Gemini NOT RUN, Worker/DSH/browser/provider calls NOT RUN, paid fallback NOT USED. Current ruleset/variable state NOT VERIFIED; integration lacks branch-protection API access.

## Next
Verify current GitHub reusable-workflow context semantics, implement pure caller identity checks and static workflow contract tests, then refactor Worker and Supervisor together. Keep dispatch disabled. Require exact-head CI and independent security review.
Detailed record: [2026-11-05 report](../reports/2026-11-05-reusable-worker-caller-boundary.md).
