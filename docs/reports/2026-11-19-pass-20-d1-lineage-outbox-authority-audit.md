# Pass 20 — D1 migration lineage and outbox authority audit

Date: 2026-11-19
Status: VERIFIED — source inventory and authority conflict identified; canonical migration manifest NOT APPROVED.
Scope: read-only lineage audit of PRs #67, #72, #111 and #146. No SQL/runtime changes.

## Immutable source heads

| PR | Head | Base | State |
|---|---|---|---|
| #67 | `a53f6232bd5b50d3e150addf528b8e722002f9dd` | `221f216c00ca7e5596bcc682ba185ad155a10603` | OPEN / DRAFT |
| #72 | `a391f5c9b08c7ccfc12d966bf8e085c1966bfb31` | PR #67 head | OPEN / DRAFT |
| #111 | `687196738782432797bf394f1342cb9df19f478f` | `35208f0ef28f0ac031a7acdf35fc90ccc9b16845` | OPEN / DRAFT |
| #146 | `4aeb9bddecd747ca533ba5619be83fc4809e2a95` | current default `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5` | OPEN / DRAFT |

Current default branch `Основной` remains `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`, tree `c8c78a26a6359ec868922e4040c2870eec873b66`, signature verified. Issue #140 OPEN. Ruleset #26550182 active; PR and review-thread resolution required, no bypass actors, zero configured approving-review count. No merge.

## Exact migration inventory

Shared historical lineage in #67/#72/#111:
- 0001 approval ledger: blob `a80524ed839b63dd6483978118619495fa550877`; hard-codes retired profile `dsh-headless-probe`.
- 0002 approval-keyed claims/outbox: `44b8f7e0658296d287269770c5e91b1c3e25973c`; creates `pool_task_claims`, `pool_task_outbox`, and trigger `pool_approval_consumed_creates_claim_outbox`.
- 0003 logical task identity: `49b0798871429d7961e81eb1d86ad892dba0b9b9`; creates `pool_tasks`, `pool_task_approvals`, `pool_task_delivery_outbox`, task-key trigger and a second legacy trigger `pool_approval_consumed_legacy_claim_outbox`.
- 0004 attempts: `0ad590ffdd2589f857257739275c15ed2d54d729`.
- 0005 reconciliation queue: `7a19897f6197c79517170e101e4cbf1db233cac6`.

#67/#72 projection chain:
- 0006 projection outbox: `660fa9de99ed78fe083bb627d6a61dbf0bd65c25`.
- 0007 projection retry/dead-letter hardening: `767d95a30fa0a14c79e88c8c58392bfec9cdddc2`.
- 0008 monotonic delivery attempts: `1d9385dd371f3404c52ec15fce03b0a14d384ab1`.
- 0009 projection identity immutable: `86919425f498dc634329bb783a3ca6ae7a0ff6a1`.
- 0010 at-most-once comment gate: `30ac9d0ed0cbede9586c365578c606b47bcce1a7`.
- #72 0011 atomic admission: `39e3da8ccf2f3e82cb7fd8fc858536aa8757b5bc`; still binds route capability profile to `dsh-headless-probe` and must not be transplanted unchanged.

#111/#146 lease guard:
- 0006 running attempt requires current lease: `0610c4ee63f338e9b4d4db30ffe6fdffbaf6d854`. It occupies the same ordinal as #67 projection outbox 0006. It must be renumbered when composed; never install both under the same migration ordinal.
- #146 0001 CODE-profile root: `c14951239dfd6f93e20184f46373a8d13b62a69f`; changes profile CHECK to `jarvis-code-sandbox-v1`.
- #146 0007 executor identity binding: `47c2f0f7db6379e6760317fe3903214f6f31ffee`; binds executor instance separately from capability profile, but leaves historical executor IDs NULL and only enforces new inserts.
- #146 0002–0005 reuse the shared blobs above.

## Decisive outbox finding

Migration 0002 creates approval-keyed `pool_task_claims` + `pool_task_outbox` and a legacy approval-consumption trigger.

Migration 0003 adds the task-keyed `pool_task_delivery_outbox` and two paths:
1. task-keyed trigger when `NEW.task_key IS NOT NULL`;
2. separate `pool_approval_consumed_legacy_claim_outbox` trigger when `NEW.task_key IS NULL`.

Migration #146 0007 drops/replaces only `pool_approval_consumed_creates_claim_outbox`; it does **not** drop `pool_approval_consumed_legacy_claim_outbox`. Therefore the schema still admits two independent task-ready producers and two queue tables. The adapter exports both `claimLogicalTask()` (task-keyed outbox) and `claimAndEnqueue()` (approval-keyed outbox); tests exercise both. This is not a single authoritative task-ready outbox.

## Recommended authority decision (design recommendation; not yet implemented)

- Canonical task-ready authority: `pool_task_delivery_outbox`, unique per logical task, event `pool.task.ready`.
- Keep `pool_attempt_projection_outbox` as a distinct downstream projection-delivery queue; it is not a second task-ready queue.
- Retire approval-keyed `pool_task_outbox` / `pool_task_claims` as legacy proof artifacts: add a forward-only migration that removes the legacy trigger and prevents new writes to retired queue tables; remove/deprecate `claimAndEnqueue()` and its legacy-positive tests. Do not delete historical migration files or infer any hosted data state.
- Preserve one task-keyed approval-consumption trigger, with executor/profile immutable bindings and a single task-ready outbox insert in the same transaction.
- Port #72 admission semantics only after replacing the retired profile with CODE profile and explicitly binding executor identity, route qualification, issuer/account/quota evidence, admission receipt and task/attempt/outbox identities.
- Compose the projection chain after task/attempt substrate and renumber all migrations monotonically. Preserve SQL object names only where no semantic conflict exists.

This is a recommendation for the next implementation candidate, not an approved schema or migration manifest. A clean local migration simulation and regression tests must prove that legacy inserts fail closed, one logical task yields exactly one task-ready row, multiple approvals attach to the same task, and projection outbox remains independent.

## Verification and limits

- Source file and migration blobs were fetched by exact SHA from the four PR heads.
- No local SQLite/Workers migration simulation was run in this pass.
- No D1 schema changes, adapter changes, hosted D1, credentials, provider calls, executor launch, dispatch, deployment, merge, agent dispatch or governance changes.
- Current default combined status remains pending / zero contexts — NOT VERIFIED.
- PR #146 exact-head CI from Pass19 remains candidate evidence only; no formal independent review or Contour A acceptance.

## Next

Create a clean-base migration-composition candidate with an explicit numbered manifest. First implement the legacy-path retirement migration and remove the legacy adapter entry point, then run the full local Workers-runtime migration suite and adversarial one-outbox tests. Only then port admission. Keep `dispatch:false`, `executionAuthorized:false`, and `dispatchAuthorized:false`.

Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

Canonical MediaHub OS map (reference only):
https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
