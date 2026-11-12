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


## Follow-up source and PR revalidation — 2026-11-12 12:03 Europe/Vilnius

- Re-read the Context Window, checkpoint and latest complete-snapshot report before independent checks. Their read-back blobs at audit start were respectively `7a2f016c481d4f892115205dc261270f84022762`, `374f8b48b55531291da682ad7fd52dd9fc9b456d`, and `192885d362e10c2aabf43ad1c565a5fc6ac41e56`.
- Independently re-read migrations 0001–0003 and `claim-outbox.mjs` at PR #67 source SHA `00d806a24c86545e0dfaf2dee47fcfa9747a5b62`. Migration 0003 has distinct trigger paths: `NEW.task_key IS NOT NULL` writes task/approval/delivery-outbox records; `NEW.task_key IS NULL` writes the legacy claim and per-approval outbox. `claimAndEnqueue` updates approval state without setting `task_key`, so the plan's separate fifth NULL-key approval exercises the legacy trigger. Source blob SHAs: migration 0001 `a80524ed839b63dd6483978118619495fa550877`; migration 0002 `44b8f7e0658296d287269770c5e91b1c3e25973c`; migration 0003 `49b0798871429d7961e81eb1d86ad892dba0b9b9`; adapter `37d75e2b31d9214b04398527eb08dce296f1ff27`.
- Revalidated PR #67: OPEN / DRAFT / UNMERGED, mergeable=true, head `00d806a24c86545e0dfaf2dee47fcfa9747a5b62`, base `Основной@221f216c00ca7e5596bcc682ba185ad155a10603`, 40 commits / 38 changed files; formal reviews 0. Exact-head runs `43182768560` and `43182768593` remain COMPLETED / SUCCESS. Read back the D1 job's Workers-runtime tests, isolated second local D1 binding, migration API and frozen schema-0010 fixture steps as SUCCESS; contract job's dispatch-disabled, workflow-YAML and security-contract steps as SUCCESS. These runs predate the corrected candidate plan and do not qualify it.
- Candidate branch exists. Compared with PR #67 source parent, candidate was 4 commits ahead / 0 behind and changes only the plan document. Updated the plan to explicitly import `claimAndEnqueue`, insert a fifth approval with NULL `task_key`, assert `CLAIMED_ONCE`, and assert matching claim/outbox rows. Latest plan update commit `0eae1acf576338a9df575107e94541688641c951`, plan blob `e8cfa9319cd321b26a6c969910dbd4d350b968b4`. The branch remains documentation-only; no test/source/golden change and no candidate CI run.
- Source-derived omitted-table expected counts after the additional legacy fixture are approval ledger 5, claims 1, per-approval outbox 1, task approvals 4, task delivery outbox 4. These remain PLANNED / NOT RUNTIME-VERIFIED.
- No test execution, CI dispatch, hosted D1, runtime/executor access, secrets, provider/model calls, deployment, merge or production mutation. Rulesets, Actions variables, executor status and hosted D1 entitlement NOT VERIFIED. Complete snapshot, new digest, migration 0011 and independent acceptance NOT RUN / NOT VERIFIED. Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.


## Current state at 2026-11-12 12:03 Europe/Vilnius

- Candidate plan now includes an explicit import of `claimAndEnqueue`, insertion of a fifth approval with NULL `task_key`, and assertions for `CLAIMED_ONCE` plus matching legacy claim/outbox rows. Candidate commit: `0eae1acf576338a9df575107e94541688641c951`; plan blob: `e8cfa9319cd321b26a6c969910dbd4d350b968b4`.
- Candidate branch compare against immutable parent `00d806a24c86545e0dfaf2dee47fcfa9747a5b62`: 5 ahead / 0 behind; exactly one added file (the plan document), 56 additions, no source/test/golden changes. No candidate CI exists/was triggered.
- PR #67 remains OPEN / DRAFT / UNMERGED, mergeable=true, head `00d806a24c86545e0dfaf2dee47fcfa9747a5b62`, base `221f216c00ca7e5596bcc682ba185ad155a10603`, 40 commits / 38 files, formal reviews 0. Its two exact-head workflow runs remain SUCCESS; all reported steps in both jobs read back SUCCESS. They predate the corrected candidate plan.
- Additional PR spot-check: #24 OPEN/DRAFT/UNMERGED, head `7d3a34a1956c6a793f0bcc05ffaaf76c65c416e3`, base `64d2636d4500127e635c214ccfb722c6b3fcda80`, reviews 0, two exact-head runs SUCCESS. #25 OPEN/DRAFT/UNMERGED, head `8f0c0c57cf24d476a27d456e80ffd1d8ced7ab85`, same base, reviews 0, two exact-head runs SUCCESS. #30 OPEN/DRAFT/UNMERGED, head `ad9f9ac598a2414b5209b6923094b16be64630ae`, base `d8521571ede91d7f6d7fb6d5ee37747ac94385ea`, reviews 0, no PR-triggered runs returned (CI NOT VERIFIED). #31 OPEN/DRAFT/UNMERGED, head `5470fccbc4a5fe80a750f402d70d703757fc4c1d`, same base, reviews 0, one exact-head run SUCCESS. Successful CI is not independent acceptance.
- Open issue search continues to show governance #1, secure web console #22, account-isolated routing/quota #26, and the durable single-use Supervisor claims issue, plus mobile and ephemeral agent-browser runner work. No issue was changed.
- No source/test/golden edits, no local test execution, no workflow dispatch, no hosted D1, no runtime/executor checks, no secrets/provider/model calls, no deployment, merge or production mutation. Rulesets, Actions variables, executor status and hosted D1 entitlement remain NOT VERIFIED.
- Status: source trigger-path analysis VERIFIED; candidate plan READ-BACK VERIFIED; complete 12-table snapshot implementation NOT RUN; new golden digest NOT RUN; migration 0011 NOT RUN; hosted D1/runtime NOT RUN; independent acceptance NOT VERIFIED; Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
