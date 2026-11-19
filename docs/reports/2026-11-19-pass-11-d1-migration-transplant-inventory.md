# 2026-11-19 — Pass 11: D1 migration transplant inventory

**Status:** VERIFIED — source-level inventory at immutable PR heads; no schema changes or tests run.
**Issue:** #140 OPEN; local no-secret qualification only.
**Default target:** `Основной` @ `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5` (re-read).
**Documentation branch:** `docs/next-2026-11-19-integrated-contour-pass`; PR #145 OPEN / DRAFT / UNMERGED.
**Scope:** read-only migration and trigger inventory of PRs #67, #72 and #111.

## 1. Immutable source refs

| PR | Base ref/SHA | Head ref/SHA | Role |
|---|---|---|---|
| #67 | `Основной` / `221f216c00ca7e5596bcc682ba185ad155a10603` | `impl/receipt-bound-projection-2026-11-11` / `a53f6232bd5b50d3e150addf528b8e722002f9dd` | Baseline migrations 0001–0010 |
| #72 | #67 branch / `a53f6232bd5b50d3e150addf528b8e722002f9dd` | `proof/atomic-a0-d1-admission-2026-11-15` / `a391f5c9b08c7ccfc12d966bf8e085c1966bfb31` | Stacked migration 0011 |
| #111 | `Основной` / `35208f0ef28f0ac031a7acdf35fc90ccc9b16845` | `proof/d1-lease-clean-base-2026-11-16` / `687196738782432797bf394f1342cb9df19f478f` | Older-base duplicate 0001–0005 plus lease guard called 0006 |

The current default HEAD is newer than all three PR bases. None is a current-base integration branch.

## 2. Migration ownership map

| Sequence | Source | Objects introduced / altered | Assessment |
|---|---|---|---|
| 0001 | #67 | `pool_approval_ledger`; owner/repository/issue index | Canonical approval ledger foundation |
| 0002 | #67 | `pool_task_claims`, `pool_task_outbox`; consume→claim/outbox trigger; pending indexes | Legacy per-approval claim path |
| 0003 | #67 | `pool_tasks`, `pool_task_approvals`, `pool_task_delivery_outbox`; task-key column; task/dead-letter/consume triggers | Logical-task identity; deliberately preserves legacy path when task_key is null |
| 0004 | #67 | `pool_attempts`, `pool_attempt_events`; current-attempt/lease columns; attempt lifecycle, lease, fencing and append-only triggers | Attempt and lease state machine |
| 0005 | #67 | `pool_attempt_reconciliations`; indeterminate→reconciliation trigger | Durable unresolved-attempt queue; does not authorize retry |
| 0006 | #67 | `pool_attempt_projection_outbox`, `pool_attempt_projection_events`; finalized-attempt→projection trigger | Terminal projection delivery ledger |
| 0007 | #67 | Retry/dead-letter columns and indexes; replaces projection status trigger; retry budget/dead-letter guards | Projection retry hardening |
| 0008 | #67 | Monotonic delivery-attempt trigger | Retry counter cannot decrease |
| 0009 | #67 | Immutable projection identity trigger | Receipt identity binding |
| 0010 | #67 | `pool_attempt_projection_comment_events`; comment state columns and at-most-once/verified-ACK triggers | Comment POST reservation and marker verification |
| 0011 | #72 | `pool_route_qualifications`, `pool_admissions`, `pool_admission_commit_receipts`; admission columns on approval and task outbox; nine guards | Atomic qualified-admission extension, still local-only |
| 0012 (proposed) | #111 selective transplant | One trigger: `pool_attempts_running_requires_current_lease` | Renumber #111's migration 0006 to 0012; add only after compatibility proof |

Migration 0001–0010 file paths and object names were read at #67's immutable head. Migration 0011 was read at #72's immutable head. The proposed 0012 source was read at #111's immutable head.

## 3. Duplicate and collision findings

1. PR #111 migrations 0001–0005 have exactly the same Git blob SHAs as #67 migrations 0001–0005. Do not copy them again.
2. PR #67 migration 0006 creates projection outbox/events and five projection triggers. PR #111 migration 0006 creates only `pool_attempts_running_requires_current_lease`. Same migration ordinal, different filename and semantics: a literal transplant under ordinal 0006 collides and would create a non-linear migration history.
3. Safe candidate: retain #67's 0001–0010, #72's 0011, then transplant only #111's guard as migration 0012 with a new unique filename. This is a proposed map, not yet validated SQL.
4. #67 0002 and 0003 both define the consume→claim/outbox trigger; 0003 intentionally DROP/CREATE replaces the 0002 definition and adds task-key behavior. Preserve order and do not flatten/drop either migration.
5. #67 0007 intentionally DROP/CREATE replaces `pool_attempt_projection_status_event` created in 0006. Preserve this replacement sequence.
6. #111's 0001–0005 are identical to #67 but its source branch is based on a different, stale default SHA. Its adapter and test package must not be wholesale copied over the richer #67 projection implementation.
7. #72 is stacked on #67, not directly on current default. Its 0011 references tables/columns introduced in #67 0003/0004 and is not independently portable without that exact predecessor chain.

## 4. Candidate migration 0012 compatibility contract

The #111 guard requires:
- `pool_attempts` and `pool_tasks` from #67 0003/0004;
- `current_attempt_id`, `lease_attempt_id`, `lease_generation`, `lease_owner`, `lease_expires_at`, `state`;
- a transition of `pool_attempts.status` to `running` to have the matching current attempt and a live lease with positive, matching generation.

#67 migration 0004 already contains `pool_tasks_attempt_lease_acquired`, which updates prepared attempts to running after task lease acquisition and copies the generation. The #111 trigger is additive and should accept that legitimate transition while denying direct unleased transitions. However, trigger ordering/interaction, timestamp semantics (`NEW.started_at`), all direct status-update paths, and the #72 admission flow still require combined Workers-runtime tests. No claim of compatibility is made until those tests run on one integrated head.

## 5. Exact-head CI evidence

- #67 head `a53f623...`: Pool Contract Validation run `43600901063` SUCCESS; Isolated D1 Ledger Proof run `43600901068` SUCCESS.
- #111 head `6871967...`: Pool Contract Validation run `43881396272` SUCCESS; Isolated D1 Ledger Proof run `43881396386` SUCCESS.
- #72 head `a391f5c...`: workflow-run lookup returned no runs; NOT VERIFIED.
- These results belong to the exact historical PR heads only. They do not validate the proposed combined chain or current default HEAD.

## 6. Tables, indexes and trigger ownership summary

- Approval/authorization: `pool_approval_ledger`, `pool_approval_owner_repository_issue`, admission_id unique index.
- Task identity and legacy claims: `pool_task_claims`, `pool_task_outbox`, `pool_tasks`, `pool_task_approvals`, `pool_task_delivery_outbox`, task pending and claim/outbox indexes.
- Attempt lifecycle: `pool_attempts`, `pool_attempt_events`, `pool_attempt_reconciliations`, associated by-task/pending indexes.
- Projection delivery: `pool_attempt_projection_outbox`, `pool_attempt_projection_events`, `pool_attempt_projection_comment_events`, pending/retry/event indexes.
- Admission qualification: `pool_route_qualifications`, `pool_admissions`, `pool_admission_commit_receipts`.
- Migration 0012 adds no table/index; one running-state lease guard trigger.

## 7. Decision and next implementation gate

**Selected candidate lineage:** #67 migrations 0001–0010 → #72 migration 0011 → #111 guard re-authored as migration 0012.

Before implementation:
- freeze a clean integration branch directly from current default `b81d2b5...`;
- re-check whether existing default already contains any D1 files or objects (do not assume empty);
- import #67/#72 migrations byte-for-byte only after confirming no existing path/object conflict;
- rename/re-author #111 guard as `0012_guard_attempt_running_requires_current_lease.sql`;
- run migration application from empty D1 and from the frozen schema-0010 fixture through 0012;
- run the complete combined Workers-runtime suite, including admission + attempt lease + projection-delivery interactions;
- preserve `dispatch:false` and `executionAuthorized:false`.

No code/schema change, test run, hosted D1 access, secret read, provider call, dispatch, deployment or merge occurred in this pass. Contour A NOT ACCEPTED; Contour B DEFERRED.
