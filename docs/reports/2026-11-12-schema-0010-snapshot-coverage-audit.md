# 2026-11-12 — Schema-0010 snapshot coverage audit

**Audit time:** 2026-11-12 11:55 Europe/Vilnius  
**Repository:** VlDMlNSh/developer-cloud-pool  
**Immutable implementation target:** PR #67 head `00d806a24c86545e0dfaf2dee47fcfa9747a5b62`  
**Base:** `Основной@221f216c00ca7e5596bcc682ba185ad155a10603`  
**Scope:** Read-only source audit of the frozen schema-0010 fixture and its exact-head evidence. No source, runtime, or security-boundary changes.

## Executive finding

The current schema-0010 golden test is reproducible and passes on the exact PR #67 head, but its snapshot is **not a full-table snapshot of all tables created by migrations 0001–0010**.

The test's `TABLES` list snapshots 7 tables. The migration chain creates 12 application tables. Five legacy/claim tables are omitted from the golden snapshot:

1. `pool_approval_ledger`
2. `pool_task_claims`
3. `pool_task_outbox`
4. `pool_task_approvals`
5. `pool_task_delivery_outbox`

The fixture actively inserts rows into `pool_approval_ledger` and triggers populate related claim/approval/outbox tables. However, the canonical snapshot/digest does not include those rows. Therefore the prior description “full-table baseline” is too broad. The current golden digest proves the seven explicitly selected tables plus marker-body bytes, not preservation of every legacy row/table.

This is a source/test-coverage defect in the proof claim, not evidence that existing rows are corrupt.

## Immutable evidence

PR #67:
- State: OPEN / DRAFT / UNMERGED; mergeable=true at this read.
- Exact head: `00d806a24c86545e0dfaf2dee47fcfa9747a5b62`.
- Base: `Основной@221f216c00ca7e5596bcc682ba185ad155a10603`.
- Compare: 40 ahead / 0 behind.
- Formal reviews: 0.
- Changed-file inventory confirms migration 0010 and fixture test are present.

Relevant source blobs at the immutable target:
- `proofs/d1-ledger/test/d1-upgrade-fixture.smoke.ts`: `d2f875700243c1874fd0c1bd251b4257ba2bb48f`.
- `proofs/d1-ledger/fixtures/schema-0010-v1-golden.json`: `7b5a560a28e1669624981b55141176c393b68191`.
- Migration 0001: `a80524ed839b63dd6483978118619495fa550877`.
- Migration 0002: `44b8f7e0658296d287269770c5e91b1c3e25973c`.
- Migration 0003: `49b0798871429d7961e81eb1d86ad892dba0b9b9`.
- Migration 0004: `0ad590ffdd2589f857257739275c15ed2d54d729`.
- Migration 0005: `7a19897f6197c79517170e101e4cbf1db233cac6`.
- Migration 0006: `660fa9de99ed78fe083bb627d6a61dbf0bd65c25`.
- Migration 0007: `767d95a30fa0a14c79e88c8c58392bfec9cdddc2`.
- Migration 0008: `1d9385dd371f3404c52ec15fce03b0a14d384ab1`.
- Migration 0009: `86919425f498dc634329bb783a3ca6ae7a0ff6a1`.
- Migration 0010: `30ac9d0ed0cbede9586c365578c606b47bcce1a7`.

## Exact-head CI and review

- [Isolated D1 Ledger Proof run 43182768560](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43182768560): COMPLETED / SUCCESS. Job `Local Workers-runtime D1 adversarial tests`; all listed steps, including the frozen fixture replay, succeeded.
- [Pool Contract Validation run 43182768593](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43182768593): COMPLETED / SUCCESS. Dispatch-disabled invariant and contract validation steps succeeded.
- Formal PR reviews: 0.
- The workflow evidence does not expand the snapshot's coverage and is not independent acceptance or hosted D1/runtime qualification.

## Coverage inventory

The migrations create 12 application tables:
- 0001: `pool_approval_ledger`
- 0002: `pool_task_claims`, `pool_task_outbox`
- 0003: `pool_tasks`, `pool_task_approvals`, `pool_task_delivery_outbox`
- 0004: `pool_attempts`, `pool_attempt_events`
- 0005: `pool_attempt_reconciliations`
- 0006: `pool_attempt_projection_outbox`, `pool_attempt_projection_events`
- 0010: `pool_attempt_projection_comment_events`

The fixture `TABLES` array includes only:
- `pool_tasks`
- `pool_attempts`
- `pool_attempt_events`
- `pool_attempt_projection_outbox`
- `pool_attempt_projection_events`
- `pool_attempt_projection_comment_events`
- `pool_attempt_reconciliations`

The fixture inserts four approvals, and migrations 0002/0003 use triggers to create legacy claim/outbox and logical-task approval/delivery rows. Those five tables are not queried into the canonical snapshot. Thus row IDs, consumed state, envelope digests, claim/outbox status, and timestamps in those tables are outside the golden equality assertion.

## Required correction before migration 0011

Do not author migration 0011 yet. First correct the baseline proof on a new isolated candidate branch (or an explicitly scoped PR #67 follow-up after verifying ancestry):

1. Add all five omitted tables to the snapshot with explicit stable column lists and deterministic primary-key ordering.
2. Include relevant indexes/triggers/schema metadata in a separate schema-invariant snapshot, not just row data.
3. Assert expected row counts and relational consistency for all 12 tables.
4. Recompute and freeze a new canonical digest and byte length; preserve the prior golden artifact as historical evidence rather than silently overwriting its meaning.
5. Add a negative regression that mutates/deletes one legacy claim/outbox/approval row in a replay copy and proves the expanded snapshot detects the difference.
6. Re-run exact-head local D1 CI and read back all changed blobs. Do not dispatch or touch hosted D1.

Only after complete schema-0010 coverage is proven should a candidate 0011 migration be designed. Its purpose and required schema delta must be explicit before implementation; no speculative/no-op migration.

## Repository / governance status

- Default Context Window on `Основной` remains stale at blob `8707a0ab0b2f66de9bae3441e0334c1621f89925`; current base SHA is evidenced by PR #67 base refs, not direct branch-ref read.
- Working documentation branch `docs/projection-stack-reconciliation-2026-11-11` compares 177 ahead / 0 behind the recorded base and remains separate from default.
- Effective ruleset, current Actions variables, executors and hosted D1 entitlement are NOT VERIFIED in this pass.
- No code change, workflow dispatch, agent, DSH, Resource Probe, secret read, provider/model call, hosted resource operation, deployment, merge or production mutation occurred.

**Final:** source audit SUCCEEDED; exact-head local fixture CI VERIFIED; snapshot completeness for all 12 tables FAILED (5 tables omitted); populated 0010→0011 compatibility NOT TESTED; hosted D1 NOT RUN; independent acceptance NOT VERIFIED; Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
