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


## Source schema audit refinement — 2026-11-12

A read-only comparison of migrations 0001–0010 against the seven existing fixture projections and the five proposed projections found no column-list mismatch. The application table set is exactly:

- Existing seven: `pool_tasks`, `pool_attempts`, `pool_attempt_events`, `pool_attempt_projection_outbox`, `pool_attempt_projection_events`, `pool_attempt_projection_comment_events`, `pool_attempt_reconciliations`.
- Five additions: `pool_approval_ledger`, `pool_task_claims`, `pool_task_outbox`, `pool_task_approvals`, `pool_task_delivery_outbox`.

Migration source blobs reviewed: 0001 `a80524ed839b63dd6483978118619495fa550877`; 0002 `44b8f7e0658296d287269770c5e91b1c3e25973c`; 0003 `49b0798871429d7961e81eb1d86ad892dba0b9b9`; 0004 `0ad590ffdd2589f857257739275c15ed2d54d729`; 0005 `7a19897f6197c79517170e101e4cbf1db233cac6`; 0006 `660fa9de99ed78fe083bb627d6a61dbf0bd65c25`; 0007 `767d95a30fa0a14c79e88c8c58392bfec9cdddc2`; 0008 `1d9385dd371f3404c52ec15fce03b0a14d384ab1`; 0009 `86919425f498dc634329bb783a3ca6ae7a0ff6a1`; 0010 `30ac9d0ed0cbede9586c365578c606b47bcce1a7`.

### Required schema-introspection detail

The `sqlite_master` snapshot alone is not a complete structural comparison: SQLite's implicit primary-key/UNIQUE indexes may have `sql IS NULL` and `sqlite_autoindex_*` names. Preserve the table DDL, but also capture deterministic metadata for every application table:

- `PRAGMA table_info(table)`: column ordinal, name, declared type, nullability, default and primary-key position.
- `PRAGMA foreign_key_list(table)`: referenced table/columns and update/delete/match actions.
- `PRAGMA index_list(table)` plus `PRAGMA index_xinfo(index)`: uniqueness, origin/partial flags, key columns, order and collation, including implicit indexes.
- `PRAGMA foreign_key_check`: assert zero violations after fixture construction and on both isolated replay databases.

Keep metadata records sorted by stable table/index/column identifiers. For `sqlite_master`, compare the exact expected application table/index/trigger object set and definitions, using an explicit predicate for excluding SQLite-internal objects; do not accidentally drop implicit index metadata from the separate PRAGMA capture. Compare all metadata structures between the two isolated databases. These checks are additional to, not a replacement for, the existing twelve-table row snapshot.

This refinement is a source-level specification only. No fixture/test code, golden, migration, runtime or CI was changed or executed.


### Legacy approval seed contract (source-derived)

The fifth approval row must satisfy migration 0001 and `validInput()` in `src/claim-outbox.mjs`:

- `approval_id`: unique non-empty text, at most 128 characters.
- `owner_numeric_id` and `repository_id`: non-empty decimal-digit text (not arbitrary labels).
- `issue_number`: positive integer.
- `target_sha`: exactly 40 lowercase hexadecimal characters.
- `profile`: exactly `dsh-headless-probe`.
- `envelope_digest`: exactly 64 lowercase hexadecimal characters.
- `expires_at`: positive integer strictly greater than the supplied `now`.
- Initial `state`: `ready`; `consumed_at`: NULL. Omit `task_key` entirely from the INSERT so it remains NULL and selects the legacy trigger.
- Pass a `claimAndEnqueue` binding whose `approvalId`, owner/repository IDs, issue, target SHA, profile and envelope digest exactly match that inserted row; use the same valid `now` value and ensure `expires_at > now`.

Assert the returned decision is exactly `CLAIMED_ONCE`, `dispatch === false`, and that the returned claim/outbox IDs match the database rows. Assert the ledger row becomes `consumed` while `task_key` remains NULL; the claim and outbox rows both reference the same approval, claim ID equals approval ID, outbox ID equals `pool-task:<approval_id>`, and both begin in `pending`. This makes the fixture's legacy-path setup and its expected row relationships explicit rather than relying on the adapter call alone.

All values remain deterministic synthetic fixture data. This is a specification refinement, not runtime evidence.


### Cloudflare D1 PRAGMA compatibility refinement — 2026-11-12 12:20 Europe/Vilnius

The official Cloudflare D1 SQL statements reference documents the required metadata PRAGMAs as supported through the D1 Worker Bindings API: `table_info`, `table_xinfo`, `index_list`, `index_xinfo`, `foreign_key_list`, `foreign_key_check`, and `quick_check`. This removes the concern that the metadata plan relies only on generic SQLite behavior without checking D1's supported subset.

Refine implementation as follows:

- Prefer `PRAGMA table_xinfo("<table>")` as the canonical column metadata capture; it includes the `hidden` field and generated/hidden columns that `table_info` omits. Retain all prior fields (ordinal, name, declared type, nullability, default, primary-key position) and include `hidden` in canonical metadata.
- Keep `PRAGMA foreign_key_list("<table>")`, `PRAGMA index_list("<table>")`, and `PRAGMA index_xinfo("<index>")`; sort returned records by stable identifiers, not provider-return order.
- Run `PRAGMA foreign_key_check` and require zero rows on each isolated replay database.
- Add `PRAGMA quick_check` and require the single result `ok` on each isolated replay database.
- Optionally use `PRAGMA table_list` as a supplementary inventory (filter to the intended `main` application tables and exclude D1/SQLite system objects); the exact application object-set assertion against `sqlite_master` remains authoritative.
- Quote only fixed, source-derived table/index identifiers when constructing PRAGMA statements. Do not interpolate fixture/user-controlled values into identifiers.
- D1 documents that PRAGMA statements apply only to the current transaction. The fixture must not assume stateful PRAGMA settings persist across separate D1 calls; the checks above are read-only introspection/integrity statements.

Official reference: https://developers.cloudflare.com/d1/sql-api/sql-statements/ (last updated 2026-04-21; accessed 2026-11-12). Relevant sections document D1 Worker Bindings API execution, `table_xinfo` generated-column coverage, index metadata, `foreign_key_check`, and `quick_check`. This is a documentation-backed implementation refinement only; no fixture/test code, golden, migration, D1 runtime, or CI was changed or executed.


### Whole-database foreign-key integrity scope — 2026-11-12 12:22 Europe/Vilnius

For each isolated replay database, execute exactly `PRAGMA foreign_key_check` **without a table-name argument** and require zero result rows. Cloudflare's D1 reference describes the optional table argument as limiting the check to the selected table; omitting it is necessary for a whole-database integrity assertion. This is a diagnostic read-back and must not replace D1's normal foreign-key enforcement during fixture writes. Run it after all fixture rows and trigger effects have been written, on both replay databases. Retain the separate `PRAGMA quick_check` requirement (one result row whose value is `ok`).

Official reference: https://developers.cloudflare.com/d1/sql-api/sql-statements/ (sections for `foreign_key_check` and `quick_check`; accessed 2026-11-12). Documentation refinement only; no test/source/golden/migration/runtime/CI changes or execution.
