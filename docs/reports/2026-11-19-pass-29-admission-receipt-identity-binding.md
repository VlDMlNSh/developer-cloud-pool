# Pass 29 — admission receipt identity binding — 2026-11-19

## Objective
Continue the source-level audit of Pass 27/28 idempotent admission replay and close one independently reproducible receipt-integrity gap.

## Refreshed state
- Default branch `Основной`: `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- PRs #148/#149/#150/#152 and documentation PR #145 remain OPEN / DRAFT / UNMERGED.
- PR #152 targets `feat/pass26-executor-bound-task-key-2026-11-19`; current head `31de5a3dc1d06c83611ebc10565fa134a4c9eded`.
- Issue #140 OPEN; Issue #151 OPEN / PLANNED.

## Finding
Pass 28 required a durable receipt row on replay and checked its assertion, executor ID and dispatch-disabled flag. The migration's receipt insert trigger, however, only binds the receipt's admission/approval/task/executor tuple. The replay adapter did not compare the receipt's own `attempt_id`, `qualification_id` or `evidence_digest` to the authoritative admission row. A receipt with a matching admission ID/executor but substituted attempt/evidence identity could therefore pass the replay receipt checks.

## Change
- Replay SELECT now projects receipt approval ID, task key, attempt ID, qualification ID and evidence digest.
- Replay guard compares all five receipt identity fields with the corresponding admission row before returning `ADMISSION_ALREADY_COMMITTED`.
- Added adversarial Workers-runtime test: after first admission, the test fixture drops the append-only receipt delete trigger, replaces the receipt with a row carrying a forged attempt ID and evidence digest (while preserving the admission/executor binding), and requires replay denial with `ADMISSION_COMMIT_RECEIPT_MISMATCH`.

## Evidence
- PR #152 head: `31de5a3dc1d06c83611ebc10565fa134a4c9eded`.
- Adapter blob: `59978808b0b1210ef5d9e5012a8814b58c7f18c7`.
- Test blob: `014425f4e51123bd13340d3580d870e68245c7bf`.
- Both files fetched again from GitHub; all receipt identity projections and the adversarial test presence confirmed.
- Exact-head workflow lookup: zero PR-triggered runs; combined commit statuses empty. CI NOT VERIFIED.
- Tests authored, NOT RUN. No local Node/Vitest/Workers runtime execution in this pass.
- No hosted D1, secrets, provider calls, dispatch, executor launch, deployment, merge, production writes or governance changes.

## Remaining blockers
- Exact-head CI strategy for stacked PR #152 without weakening governance.
- Execute fresh-D1 and frozen-upgrade Workers-runtime suite.
- Independent review and full SQL/migration-chain audit.
- Lease fencing, complete legacy-table write denial, trusted event provenance, real executor qualification, hosted UI/persistence/routing/quota tests and independent Contour A acceptance remain outstanding.

## Status
PR #152 OPEN / DRAFT / UNMERGED. Contour A BLOCKED / NOT ACCEPTED. Contour B DEFERRED. Multi-account Jarvis/shared GPU remains PLANNED under Issue #151.

Canonical MediaHub map (reference only): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
