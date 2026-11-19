# Pass 28 checkpoint — 2026-11-19

- Scope: audit and strengthen Pass 27 admission replay integrity only.
- Implementation PR #152: OPEN / DRAFT / UNMERGED.
- Head SHA: `81c1c001f61b29305126ff28500eb47843f6fe1b`.
- Adapter blob: `f00720cf1bedaf46ee9ba79f5bcfb0b38bf0de89`.
- Test blob: `49333aaaa7ee89c0ff8952e91e16d08e165aa091`.
- Finding: replay previously returned `ADMISSION_ALREADY_COMMITTED` without requiring a matching durable receipt and task-ready outbox record.
- Fix: replay readback now validates receipt assertion/executor/dispatch flag, pending outbox identity, evidence digest, and current attempt binding; mismatch returns `ADMISSION_COMMIT_RECEIPT_MISMATCH`.
- Regression test: receipt removed after initial admission must cause replay denial.
- Static GitHub readback: VERIFIED.
- Tests authored: yes. Tests executed: NOT RUN.
- Exact-head CI: NOT VERIFIED (zero PR workflow runs and empty combined status). Workflow PR base filter targets `Основной`; #152 base is Pass 26 feature branch.
- Independent review: NOT VERIFIED.
- No hosted D1, secrets, providers, dispatch, executor, deployment, merge, production mutation or governance change.
- Next: establish an approved exact-head CI path without weakening policy; execute the Workers-runtime suite; continue SQL/migration audit.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.
- Multi-account Jarvis/shared GPU: Issue #151 PLANNED only.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
