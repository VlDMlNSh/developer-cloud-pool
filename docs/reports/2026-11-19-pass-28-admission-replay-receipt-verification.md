# Pass 28 — admission replay receipt verification — 2026-11-19

## Objective
Perform a bounded source audit of Pass 27 atomic qualified admission and close one concrete replay-integrity gap without enabling dispatch or changing hosted resources.

## Refreshed state
- Default branch: `Основной` @ `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- PR #148 OPEN/DRAFT/UNMERGED: `613790e739aece5028dca54ae82b2d853fa95642`.
- PR #149 OPEN/DRAFT/UNMERGED: `3a64c045a6cdd5890846dbd75bc53952ed1ba718`.
- PR #150 OPEN/DRAFT/UNMERGED: `8b02ea8d120bdcd56bbb9233de5906f02e67a2cb`.
- PR #152 OPEN/DRAFT/UNMERGED; base is Pass 26 branch; new head `81c1c001f61b29305126ff28500eb47843f6fe1b`.
- PR #145 remains documentation-only, OPEN/DRAFT/UNMERGED.
- Issue #140 OPEN; Issue #151 OPEN / PLANNED.

## Audit finding
The Pass 27 idempotent replay path read an existing admission, approval, task, attempt and route qualification, but did not require the durable commit receipt or the task-ready outbox binding to be present and consistent before returning `ADMISSION_ALREADY_COMMITTED`. This made the replay response weaker than the first-commit readback and the stated durable-receipt contract.

The migration's fixed `schema_version = 1` CHECK was also inspected. Although the identity-immutability trigger does not list that column, the CHECK constraint already rejects any value other than 1; no redundant migration was added.

## Change
Implementation PR #152:
- Extended the prior-admission readback with LEFT JOINs to `pool_admission_commit_receipts` and `pool_task_delivery_outbox`.
- Replay now denies with `ADMISSION_COMMIT_RECEIPT_MISMATCH` unless the receipt assertion, executor, dispatch-disabled flags, pending task-ready event, admission/attempt/evidence bindings, and task current-attempt tuple all match.
- Added an adversarial test that removes the receipt after a successful synthetic admission (temporarily dropping the append-only delete trigger in the isolated test fixture) and verifies replay denies rather than claiming success.

## Source evidence
- Adapter blob: `f00720cf1bedaf46ee9ba79f5bcfb0b38bf0de89`.
- Test blob: `49333aaaa7ee89c0ff8952e91e16d08e165aa091`.
- PR #152 head: `81c1c001f61b29305126ff28500eb47843f6fe1b`.
- Files were fetched again from GitHub after writes; replay guard and adversarial test presence confirmed.

## Validation
- Static source assertions: VERIFIED for presence of the new receipt/outbox readback guard and regression test.
- Node/Vitest/Workers-runtime test execution: NOT RUN in this environment.
- Exact-head workflow lookup: zero PR-triggered runs; combined commit statuses: empty. CI NOT VERIFIED.
- Cause: `.github/workflows/d1-ledger-proof-validation.yml` listens for `pull_request` only when the PR base is `Основной`; PR #152 targets the Pass 26 implementation branch. No workflow or branch filter was weakened to manufacture a green check.
- Independent review: NOT VERIFIED.
- Hosted D1, secrets, provider calls, dispatch, executor launch, deployment, merge, production writes and governance mutation: NOT RUN.

## Remaining blockers
- Make exact-head validation possible through an approved workflow/branch strategy without weakening governance.
- Execute fresh-database and frozen-upgrade Workers-runtime tests.
- Independently audit SQL transaction/readback behavior and the migration chain.
- Implement lease fencing and complete legacy-table write denial only after this admission proof is verified.
- Trusted GitHub event provenance, real executor qualification, hosted UI/persistence/routing/quota tests and independent Contour A acceptance remain outstanding.

## Status
PR #152 remains OPEN / DRAFT / UNMERGED. Contour A BLOCKED / NOT ACCEPTED. Contour B DEFERRED. Issue #151 multi-account Jarvis/shared GPU architecture remains PLANNED.

Canonical MediaHub map (reference only): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
