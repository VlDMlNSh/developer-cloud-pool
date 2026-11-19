# 2026-11-19 — Pass 24: CODE/executor-bound admission compatibility gate

**Result: VERIFIED source-level blocker; migration implementation NOT RUN.**

## Frozen inputs
- Default branch: `Основной` at `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- Issue #140: OPEN; local, no-secret proof only; no dispatch, hosted D1, provider calls, deployment, merge, or production mutation.
- Implementation PR #148: OPEN / DRAFT / UNMERGED; base SHA `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`; head `613790e739aece5028dca54ae82b2d853fa95642`.
- PR #145 documentation branch remains OPEN / DRAFT / UNMERGED; observed head `45ba2523a298ae1ddc6fa718d23993aff16e81f4`.

## Verified source findings
1. Clean-base migration 0001 fixes approval profile to `jarvis-code-sandbox-v1` (blob `c14951239dfd6f93e20184f46373a8d13b62a69f`).
2. Migration 0003 creates `pool_tasks` with repository, issue, target SHA and profile identity, but no `executor_id`. Its task-creation trigger verifies those fields only and still contains the historical legacy approval-keyed branch when `NEW.task_key IS NULL`.
3. Migration 0004 creates attempts and lease-generation fencing; this is the current schema substrate.
4. Historical PR #72 migration 0011 (blob `39e3da8ccf2f3e82cb7fd8fc858536aa8757b5bc`) declares `capability_profile = 'dsh-headless-probe'`. Its companion adapter (blob `df5e93d9fd60ac90bee2c5f7610634b991428312`) validates the same retired profile.
5. That adapter computes `pool-task-v1` task identity from repository ID, issue number, target SHA, profile and schema version only. It does not bind executor identity into canonical task serialization or compare executor identity during replay.
6. The historical 0011 SQL extends approvals/admission/outbox/receipts but does not add a coherent executor identity to both approval and logical task records. Therefore a literal profile substitution would leave executor-cross-attachment possible at the task-identity boundary.
7. Existing PR #148 tests cover migrations 0001–0010 only; no test validates 0011 or executor-bound admission.

## Decision
Do not transplant historical 0011 or perform a blind DSH-to-CODE string replacement. This would violate the Pass 22 requirement that executor instance identity be distinct from capability profile and included in logical task identity.

## Required contract before migration 0011
- Add a single immutable executor identity binding to approval and logical task records, with a single canonical executor ID source.
- Canonical task-key serialization must include executor ID and profile independently; validate and compare both on initial admission, replay, conflict and attachment.
- Route qualification must require exact CODE profile `jarvis-code-sandbox-v1`; executor instance must not be substituted for capability profile.
- Every success, denial, storage-error and ambiguous-write result must explicitly carry `dispatch:false` and `executionAuthorized:false`.
- Keep task-ready authority exclusively in `pool_task_delivery_outbox`; terminal projection remains `pool_attempt_projection_outbox`; legacy approval-keyed trigger must not remain a positive writer.
- Add negative tests for executor mismatch, profile mismatch, task-key collision, approval reuse, stale/revoked qualification, ambiguous batch/readback and exact replay.
- Only then author forward-only migrations and run fresh-D1 plus frozen schema-0010 upgrade tests.

## Tests and evidence
- No migration was written in Pass 24.
- No local Workers/D1 tests run in Pass 24.
- No hosted D1, secret/variable reads, provider calls, dispatch, agent launch, deployment, merge or governance change.
- Source files were fetched from PR #148 and historical PR #72; blob SHAs are recorded above.
- Exact-head CI remains the Pass 23 evidence only: D1 run 44589681768 SUCCESS and Pool Contract run 44589681751 SUCCESS at PR #148 head `613790e739aece5028dca54ae82b2d853fa95642`. These runs do not validate 0011.

## Status
- Pass 24: VERIFIED source compatibility findings; implementation BLOCKED pending a unified executor-identity contract.
- PR #148: OPEN / DRAFT / UNMERGED.
- Issue #140: OPEN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
- Governance detailed read-back: NOT VERIFIED.
- Gemini / Claude: NOT RUN.
- Actual active time: NOT MEASURED.

## Next bounded step
Implement the executor identity binding in a migration-compatible contract and test its impact on logical task creation before porting atomic admission 0011. Preserve immutable migration history; do not modify 0001–0010.
