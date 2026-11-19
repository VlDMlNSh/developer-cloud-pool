# Pass 28 current snapshot — 2026-11-19

- Default branch `Основной`: `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- PR #152 OPEN/DRAFT/UNMERGED; head `81c1c001f61b29305126ff28500eb47843f6fe1b`; base Pass 26 branch.
- Pass 28 hardened idempotent replay: matching durable receipt and task-ready outbox are now mandatory; inconsistent or missing records deny with `ADMISSION_COMMIT_RECEIPT_MISMATCH`.
- Adapter blob `f00720cf1bedaf46ee9ba79f5bcfb0b38bf0de89`; regression test blob `49333aaaa7ee89c0ff8952e91e16d08e165aa091`.
- Static source readback VERIFIED. Tests authored, NOT RUN. Exact-head CI NOT VERIFIED; no PR workflow runs and no combined statuses.
- Workflow limitation: D1 proof workflow's pull_request base filter only includes `Основной`; PR #152 targets feature branch. No workflow policy was changed.
- Independent review NOT VERIFIED. No hosted D1, secrets, providers, dispatch, executor launch, deployment, merge or production changes.
- PR #148/#149/#150 remain OPEN/DRAFT/UNMERGED. Issue #140 OPEN. Issue #151 OPEN/PLANNED.
- Contour A BLOCKED / NOT ACCEPTED. Contour B DEFERRED.
- Next: approved exact-head CI strategy and executed local Workers-runtime tests, then continue SQL/migration audit.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
