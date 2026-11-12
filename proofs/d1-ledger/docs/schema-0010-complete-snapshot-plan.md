# Schema-0010 complete snapshot — isolated implementation plan

**Status:** PLANNED / NOT IMPLEMENTED  
**Parent commit:** `00d806a24c86545e0dfaf2dee47fcfa9747a5b62` (PR #67 exact head at branch creation)  
**Branch:** `proof/schema-0010-complete-snapshot-2026-11-12`  
**Scope:** Local synthetic D1 fixture/test coverage only. No runtime adapter, production schema, hosted D1, dispatch, or v1 writer changes.

## Finding being corrected

The existing `d1-upgrade-fixture.smoke.ts` snapshots seven tables. Migrations 0001–0010 create twelve application tables. Five tables are absent from the canonical `TABLES` snapshot. The current fixture creates four logical-task approvals through `claimLogicalTask`; migration 0003 routes these through `NEW.task_key IS NOT NULL`, populating `pool_task_approvals` and `pool_task_delivery_outbox`. It does not populate the legacy per-approval `pool_task_claims` or `pool_task_outbox` tables, which are empty in the current fixture. The omitted tables therefore comprise `pool_approval_ledger`, the two empty legacy tables, `pool_task_approvals`, and `pool_task_delivery_outbox`. The current golden digest does not establish all-table preservation.

This plan intentionally does not edit the test or golden fixture until the expanded deterministic snapshot can be run locally and its digest independently reproduced. The existing `schema-0010-v1-golden.json` remains a historical seven-table baseline; do not silently redefine it.

## Missing tables and deterministic row projections

Add explicit stable projections to the fixture `TABLES` list, with primary-key ordering. The first three legacy per-approval tables have no task-level identity; `pool_approval_ledger.task_key` was added by migration 0003 and must be included:

| Table | Explicit columns | ORDER BY |
|---|---|---|
| `pool_approval_ledger` | `approval_id, owner_numeric_id, repository_id, issue_number, target_sha, profile, envelope_digest, expires_at, consumed_at, state, task_key` | `approval_id` |
| `pool_task_claims` | `approval_id, claim_id, envelope_digest, status, lease_owner, lease_generation, lease_expires_at, attempt_count, created_at, completed_at` | `approval_id` |
| `pool_task_outbox` | `outbox_id, approval_id, event_type, envelope_digest, status, created_at, delivered_at` | `outbox_id` |
| `pool_task_approvals` | `task_key, approval_id, envelope_digest, attached_at` | `task_key, approval_id` |
| `pool_task_delivery_outbox` | `outbox_id, task_key, event_type, status, created_at, delivered_at` | `outbox_id` |

Keep the seven existing projections unchanged unless source inspection proves a column list is incomplete. The schema-0010 fixture must assert that all twelve expected application tables are present exactly once in the snapshot.

## Required assertions

1. **Fixture setup:** Import both `claimLogicalTask` and `claimAndEnqueue` from `../src/claim-outbox.mjs`. Preserve the four logical-task approvals created through `claimLogicalTask`. Insert a fifth, separate synthetic approval into `pool_approval_ledger` while omitting `task_key` (therefore NULL), then consume it through `claimAndEnqueue`. Assert `CLAIMED_ONCE`, and independently assert the matching claim and per-approval outbox rows. This exercises migration 0003's `NEW.task_key IS NULL` legacy trigger without changing the four task-level fixture states.
2. **Coverage:** Assert the expected twelve-table name set, no duplicates, and a non-empty explicit projection for every table.
3. **Counts:** Assert deterministic expected row counts for each table. With the additional legacy approval, expected counts for the five omitted tables are: `pool_approval_ledger` = 5, `pool_task_claims` = 1, `pool_task_outbox` = 1, `pool_task_approvals` = 4, `pool_task_delivery_outbox` = 4. Keep all four logical approvals/task attachments and one separate legacy approval distinct. Derive and assert counts for the other seven tables from the deterministic fixture.
4. **Relations:** Assert logical approval→task/approval-attachment links; legacy approval→claim→per-approval outbox links; task→delivery outbox cardinality and identities.
5. **Schema invariants:** Snapshot `sqlite_master` definitions for application tables, indexes, and triggers using deterministic `type, name` ordering. Exclude internal SQLite objects by explicit predicate. Keep schema metadata separate from row data in the canonical object.
6. **Replay:** Build the same fixture in both isolated D1 bindings and compare complete row snapshots, schema snapshots, and marker-body bytes.
7. **Negative mutation:** On a disposable replay database after capturing the baseline, mutate or delete one representative row in each legacy table category (approval, claim, per-approval outbox, task approval, task delivery outbox). Re-snapshot and assert the canonical object differs from the untouched baseline. Use independent mutation cases or restore/rebuild between cases; never mutate the reference DB.
8. **Golden:** Only after local execution succeeds, freeze a new fixture artifact with an explicit scope name such as `schema-0010-v1-complete`, canonicalization contract, SHA-256, canonical UTF-8 byte count, migration range, and prohibitions. Keep the previous seven-table golden intact and label its limited scope.

## Acceptance sequence

- [ ] Confirm this candidate branch still has the stated immutable parent ancestry.
- [ ] Implement the expanded projections and schema snapshot in the fixture test only.
- [ ] Run the exact local fixture command and inspect failures.
- [ ] Add and run all negative mutation regressions.
- [ ] Run the fixture twice against isolated local D1 bindings; compare canonical bytes.
- [ ] Independently recompute SHA-256 and byte length from the emitted canonical payload.
- [ ] Update the new complete golden artifact only after repeatability is demonstrated.
- [ ] Run the complete package test suite and relevant workflow on the candidate head.
- [ ] Read back every changed file and record blob SHAs and exact-head workflow run IDs.
- [ ] Keep candidate branch unmerged and PR-less until separate review and governance checks.

## Explicit stop conditions

Stop without updating the golden if any table's expected cardinality or relationship is unclear, if schema metadata is unstable between isolated bindings, if row ordering is not deterministic, if the replay differs, or if a negative mutation does not change the snapshot.

No migration 0011 is in scope. Do not add a v2 writer, modify runtime adapters, change dispatch behavior, provision or access hosted D1, read secrets, call providers/models, deploy, or merge. Contour A remains BLOCKED / NOT ACCEPTED; Contour B remains DEFERRED until their separately defined gates are satisfied.
