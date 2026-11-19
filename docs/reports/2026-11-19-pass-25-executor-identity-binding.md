# 2026-11-19 — Pass 25: executor identity binding migration

**Status: VERIFIED — migration 0011 and exact-head local Workers/D1 CI passed.** This is a partial schema tranche, not completed admission integration.

## Frozen source and branch lineage
- Default branch `Основной` observed at `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- Issue #140 remains OPEN; its constraints prohibit hosted D1, secrets/variables inspection, provider calls, dispatch, deployment, merge and production mutation.
- PR #148 clean-base proof head: `613790e739aece5028dca54ae82b2d853fa95642`, base default SHA above.
- Pass 25 branch: `feat/pass25-executor-identity-binding-2026-11-19`.
- PR #149 is OPEN / DRAFT / UNMERGED and correctly stacked on PR #148 branch (base SHA `613790e739aece5028dca54ae82b2d853fa95642`).
- PR #149 head SHA: `3a64c045a6cdd5890846dbd75bc53952ed1ba718`.
- Implementation commit SHA (final branch head): `3a64c045a6cdd5890846dbd75bc53952ed1ba718`.

## Implemented
New forward-only file: `proofs/d1-ledger/migrations/0011_bind_executor_identity.sql`.
- Adds nullable `executor_id` to approval ledger and logical task tables. Existing rows are not backfilled because their executor identity is not inferable; null-identity historical rows cannot pass the canonical task-creation trigger.
- New approval and task inserts require an executor ID 1–128 characters from the restricted ASCII set.
- Executor ID is immutable after insert.
- Replaces the task-keyed approval-consumption trigger; it inserts executor ID into logical task identity and includes it in conflict/replay binding alongside repository, issue, target SHA and CODE profile.
- Drops the legacy approval-keyed claim/outbox trigger.
- Adds lookup indexes.
- Updates isolated proof README and adds negative tests.

Test cases now total 6:
1. CODE ledger and independent outbox schemas.
2. Multiple approvals attach to one logical task and one task-ready outbox row.
3. Terminal projection outbox remains independent.
4. Approval without executor ID rejected.
5. Approval executor ID mutation rejected.
6. Cross-executor attachment to an existing task key rejected, with only the original approval attached.

## Exact-head CI evidence
All runs below correspond to PR #149 head `3a64c045a6cdd5890846dbd75bc53952ed1ba718`.
- [Isolated D1 Ledger Proof run 44592122672](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44592122672): COMPLETED / SUCCESS. Job log explicitly reports 6 tests passed, 1 test file passed; fresh local Workers D1 migration chain includes 0011.
- [Pool Contract Validation run 44592122775](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44592122775): COMPLETED / SUCCESS. Workflow syntax and dispatch-disabled/security invariants passed.
- D1 job log: exact checkout of PR merge revision, pinned Node 24.9.0, `npm ci --ignore-scripts --no-audit --no-fund`, inert Worker syntax check and `npm test`; all successful.

## Important limitations / remaining work
- The canonical adapter task-key serialization is NOT YET updated to include executor ID. SQL prevents cross-executor attachment when task keys collide, but it does not calculate or prove the adapter's canonical hash. Do not treat this migration alone as complete executor isolation.
- Atomic qualified admission 0012 (or next agreed ordinal), lease fencing integration, and full legacy table write denial remain outstanding.
- No frozen schema-0010 upgrade fixture or historical data-preservation test yet.
- No independent/external review.
- CI proves the local synthetic D1 proof only; it does not prove hosted D1, live GitHub event authenticity, production lock semantics, provider quota, executor qualification or actual worker execution.

## Safety and governance
- No hosted D1, secrets/variables read, provider calls, dispatch, agent launch, deployment, merge, production action or governance/ruleset mutation.
- Gemini: NOT RUN. Claude: NOT RUN.
- PR #149 remains DRAFT / UNMERGED.
- Detailed governance ruleset read-back remains NOT VERIFIED.
- Contour A remains BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

## Next bounded step
Update the isolated adapter contract and canonical task-key serialization to bind executor ID independently of capability profile. Add replay/conflict tests proving same executor deduplicates and different executor IDs derive different task keys. Only after that integrate atomic qualified admission; preserve migration 0001–0011 as immutable history.
