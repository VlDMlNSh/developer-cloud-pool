# Pass 11 — PR #146 D1 migration and adapter source audit

Date: 2026-11-19
Status: VERIFIED — source-level audit; implementation NOT RUN.
Target baseline: `Основной` @ `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
Review source: `feat/a1-jarvis-code-sandbox-profile-2026-11-19` (PR #146, OPEN/DRAFT/UNMERGED).
Work branch: `feat/issue140-canonical-admission-lease-2026-11-19`.
Issue #140 remains OPEN and controlling.

## Immutable source evidence

The following GitHub blob SHAs were fetched from the PR #146 source branch:

| File | Blob SHA |
|---|---|
| migrations/0001_create_pool_approval_ledger.sql | `c14951239dfd6f93e20184f46373a8d13b62a69f` |
| migrations/0002_create_task_claim_outbox.sql | `44b8f7e0658296d287269770c5e91b1c3e25973c` |
| migrations/0003_create_logical_task_identity.sql | `49b0798871429d7961e81eb1d86ad892dba0b9b9` |
| migrations/0004_create_immutable_task_attempts.sql | `0ad590ffdd2589f857257739275c15ed2d54d729` |
| migrations/0005_create_attempt_reconciliation_queue.sql | `7a19897f6197c79517170e101e4cbf1db233cac6` |
| migrations/0006_guard_running_attempt_requires_lease.sql | `0610c4ee63f338e9b4d4db30ffe6fdffbaf6d854` |
| migrations/0007_bind_executor_identity.sql | `47c2f0f7db6379e6760317fe3903214f6f31ffee` |
| src/consume.mjs | `7b30f9fa315d7996854685cbe634bd8097677518` |
| src/claim-outbox.mjs | `9da0a05f007a4be26f7588dbd9e82b3bbf8bc825` |
| src/task-lease.mjs | `b41edf89cdf960b2c007f38ba16554dc179f021a` |
| src/task-attempts.mjs | `f40582968a3b25e1a59522c19dd5bc11b007e6b2` |
| CODE profile contract | `21b04b125349441f6296696a4f780d44c33ef896` |
| D1 admission/lease audit | `5ffbe612789984ae8034cb83e3fcf95ddc91e938` |

## Findings

### 1. Two claim/outbox models coexist in the same migration chain

Migration 0002 creates:
- `pool_task_claims`, keyed by approval;
- `pool_task_outbox`, unique by approval, event `pool.task.claimed`.

Migration 0003 then adds:
- `pool_tasks`, keyed by logical task;
- `pool_task_approvals`;
- `pool_task_delivery_outbox`, unique by task, event `pool.task.ready`.

Migration 0003 replaces the approval-consumed trigger for task-key-bearing approvals, but explicitly retains a legacy trigger that creates the approval-keyed claim and outbox when `NEW.task_key IS NULL`. Thus the schema still supports two distinct claim/outbox paths. This may be intentional compatibility for historical proof tests, but it is not yet a single canonical admission path. A production integration must decide whether the legacy tables/API are read-only historical fixtures, removed from the canonical write path, or migrated under an explicit compatibility contract.

### 2. Parallel lease/attempt APIs are exposed

The package exports both the older task-level lease API (`task-lease.mjs`) and the attempt-bound lease API (`task-attempts.mjs`). The test suite imports and exercises both. The latter binds lease acquisition to `current_attempt_id`, `lease_attempt_id` and prepared attempt state; the former leases the task without an attempt ID. Migration 0006 guards transitions of `pool_attempts` to running, but does not by itself prove every exported state transition is reachable only through the attempt-bound API. Canonical authority selection and negative tests against legacy entry points are required before integration.

### 3. Adapter outputs do not uniformly satisfy Issue #140's two-flag contract

Inspected `consume.mjs` and `claim-outbox.mjs` return `dispatch:false` but do not include explicit `executionAuthorized:false` on all success and denial paths. The task lease/attempt modules likewise use `dispatch:false`-only return objects in the inspected paths. Issue #140 requires both flags on every adapter output. Add a shared contract assertion over every exported adapter result; do not infer execution authorization from dispatch being false.

### 4. CODE profile identifier is confirmed; runtime qualification is not

The PR #146 profile contract records the owner-confirmed immutable ID `jarvis-code-sandbox-v1`. It explicitly leaves resource ceilings proposed, profile status proposed, network deny policy to be enforced by a qualified host, and runtime enablement disabled. This resolves the identifier question only; it does not qualify a host, executor, provider route, quota, or sandbox.

### 5. Registry and host identity remain unqualified

The registry file in PR #146 is empty (`executors: []`). The D1 audit states OIDC authenticates a workflow/job principal, not the executable process or host. No executor should be admitted based on the profile ID or OIDC alone.

## Pass 11 decision

PR #146 contains useful local proof components but is not yet a canonical integration candidate without further changes. Do not transplant the package wholesale and do not add another migration root. The next implementation should start from the clean current-default branch, use one logical-task/attempt authority, explicitly quarantine the approval-keyed legacy claim/outbox route, select one attempt-bound lease API, and enforce both `dispatch:false` and `executionAuthorized:false` in every result.

This pass is source inspection only. No SQL or application code was modified; no local tests were run; no CI run was initiated. No secrets/variables, hosted D1, providers, dispatch, deployment, merge or production actions were touched.

## Next bounded pass

Prepare a minimal adapter-contract patch on the clean current-base work branch:
1. Add a shared assertion/test that every exported adapter result has `dispatch === false` and `executionAuthorized === false`.
2. Add tests proving legacy task-level lease entry points cannot bypass attempt binding (or remove them from the canonical exports in a separately reviewed change).
3. Test both task-key and legacy approval-key trigger paths explicitly, and document which is canonical versus compatibility-only.
4. Do not modify existing executor routes or activate registry entries.
5. Run local Workers-runtime tests and exact-head CI after the code patch.

Contour A: NOT ACCEPTED. Contour B: DEFERRED.
