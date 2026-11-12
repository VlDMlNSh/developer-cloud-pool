# 2026-11-12 — Complete schema-0010 snapshot plan

**Audit time:** 2026-11-12 11:55 Europe/Vilnius  
**PR #67 source head:** `00d806a24c86545e0dfaf2dee47fcfa9747a5b62`  
**Candidate branch:** `proof/schema-0010-complete-snapshot-2026-11-12`  
**Candidate commit:** `01f9e088e66a7c9233b68dc8fb20f23dbe0e4822`  
**Candidate plan blob:** `85e7757a4083b3e91c89b4932373d91f8e19e0d1`

## Work completed

- Re-read the working Context Window, continuation checkpoint and prior schema-0010 coverage audit before starting.
- Rechecked PR #67 metadata: OPEN / DRAFT / UNMERGED, mergeable=true at time of read; current head SHA `00d806a24c86545e0dfaf2dee47fcfa9747a5b62`, base `Основной@221f216c00ca7e5596bcc682ba185ad155a10603`, 40 commits ahead / 0 behind.
- Rechecked exact-head workflow runs: D1 Ledger Proof `43182768560` SUCCESS and Pool Contract Validation `43182768593` SUCCESS. Formal reviews remain 0.
- Created isolated candidate branch from the exact PR #67 head; added one plan document only. The candidate branch is 1 commit ahead / 0 behind its stated parent and changes no code.
- Read the plan back and verified its blob SHA and all five omitted table names.

## Planned implementation detail

The candidate plan specifies deterministic projections for:
- `pool_approval_ledger`
- `pool_task_claims`
- `pool_task_outbox`
- `pool_task_approvals`
- `pool_task_delivery_outbox`

It also requires an application schema snapshot from `sqlite_master`, expected row counts, relationship assertions, two-binding replay equality, negative mutation tests for all five omitted tables, and a new golden artifact that preserves the old seven-table baseline as historical evidence.

## What was not done

- No test source or golden fixture modified.
- No local test execution from this environment; no new CI run was triggered or observed for the candidate branch.
- No migration 0011, v2 writer, runtime adapter, dispatch, hosted D1, secrets, provider/model calls, deployment, merge or production mutation.
- Effective ruleset, Actions variables, executors and hosted D1 access remain NOT VERIFIED.

## Status

- Source/coverage audit: VERIFIED.
- Candidate implementation plan: CREATED / READ-BACK VERIFIED.
- Complete 12-table snapshot implementation: NOT RUN.
- New golden digest: NOT RUN.
- Migration 0011: NOT RUN.
- Hosted D1/runtime: NOT RUN.
- Independent acceptance: NOT VERIFIED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Next bounded action: implement only the fixture/test coverage on the isolated candidate branch, run it locally and in exact-head CI, and freeze a new digest only after deterministic replay and negative mutation tests pass.


## Fixture-path correction — 2026-11-12

A follow-up source-level trace of `claimLogicalTask` and migration 0003 corrected one overstatement in the preceding audit/plan: the current fixture's four logical-task approvals set `task_key` before the consume-trigger fires. Consequently they populate `pool_task_approvals` and `pool_task_delivery_outbox`, but do **not** populate legacy `pool_task_claims` or `pool_task_outbox`; those two tables are empty in the current fixture. The five omitted tables are still absent from the golden snapshot, but only three of them currently contain fixture rows (`pool_approval_ledger`, `pool_task_approvals`, `pool_task_delivery_outbox`).

The candidate plan was corrected to add a fifth, separate synthetic approval consumed through the existing `claimAndEnqueue` compatibility adapter, with `task_key` NULL. This explicitly exercises and populates the legacy claim/outbox path. Planned omitted-table counts after that addition: approval ledger 5; claims 1; per-approval outbox 1; task approvals 4; task delivery outbox 4. These are source-derived expectations, NOT yet runtime-tested. Candidate plan update: commit `214dceac0c208c57ee6a3239876e670f75fce7e3`, blob `7e61e80e190babc5b0985e2ac4831c2d22416d3f`.

No source/test/golden file was changed; no tests or CI were run. Preserve the previous report as an audit trail, but use the corrected candidate plan as the current implementation specification.
