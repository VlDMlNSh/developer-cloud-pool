
# D1 admission and lease integration audit

Date: 2026-11-18  
Audit base: 68183828cf7934e89109310c8f99281be4eb7ed8  
Scope: PR #111, #112, #114 and #125. GitHub API source inspection only; no local execution, hosted D1, provider access, secret access, dispatch or deployment.

## Executive result

The existing proofs are useful but cannot be combined by simply stacking their migrations. PR #114/#125 own a receipt-driven logical-task admission model. PR #111 begins with an approval-consume/claim-outbox model and later evolves a second logical-task/attempt model. Their SQL schemas conflict on shared table names and task/outbox semantics. A canonical schema and adapter contract must be designed before porting code.

All four feature branches diverge from the audited default HEAD; their merge base is 35208f0ef28f0ac031a7acdf35fc90ccc9b16845, two commits behind the audit base:
- PR #111 branch: 4 commits ahead, 2 behind.
- PR #112 branch: 3 commits ahead, 2 behind.
- PR #114 branch: 36 commits ahead, 2 behind.
- PR #125 branch: 57 commits ahead, 2 behind.

## File and schema overlap

| Concern | PR #114/#125 | PR #111 | Integration finding |
|---|---|---|---|
| Approval ledger | pool_approval_ledger with approval, actor, target, profile, digest, expiry, task key | Same table name, but migration 0001 constrains profile to dsh-headless-probe; later migration adds task_key | Not safe to apply both migration roots; incompatible constraints and ownership |
| Admission receipt | pool_admission_receipts, keyed by source_comment_id | No equivalent receipt table in the lease package | Keep one admission receipt authority |
| Logical task | pool_tasks includes wave_id and state pending/completed/dead | Migration 0003 creates pool_tasks with lease fields and pending/leased/completed/dead; it has a different schema and trigger history | Requires one canonical superset schema, not CREATE TABLE IF NOT EXISTS |
| Outbox | pool_task_outbox keyed uniquely by task_key, event pool.task.ready | Migration 0002 creates pool_task_outbox keyed by approval_id, event pool.task.claimed; migration 0003 adds pool_task_delivery_outbox keyed by task_key | Two competing outbox concepts and duplicate delivery paths |
| Lease | Not implemented by admission package | pool_tasks lease owner, expiry, generation; claim APIs | Lease must extend the single canonical task row |
| Attempts | Not implemented by admission package | Immutable pool_attempts, append-only events, reconciliation queue and lease guard | Keep attempt history separate from logical task identity |
| Event provenance | PR #125 adapter binds Actions event and runner environment | PR #112 validates webhook envelope read-only | Use one event predicate; #112 alone does not persist admission |

### Concrete conflicts

1. PR #111 migration 0001 creates pool_approval_ledger with profile CHECK (profile = 'dsh-headless-probe'). The owner-frozen first executor profile is Claude Code + ECC + FCC. The legacy DSH profile must not be reintroduced as an accepted executor.
2. PR #114 and #111 both define pool_approval_ledger from independent migration roots. They are not a single ordered migration history.
3. PR #114 defines pool_task_outbox with task_key UNIQUE and event pool.task.ready; PR #111 migration 0002 defines the same table name with approval_id UNIQUE and event pool.task.claimed. These are incompatible schemas and event semantics.
4. PR #111 migration 0003 introduces pool_task_delivery_outbox, another task-level outbox. A unified design should retain exactly one authoritative task-ready outbox and explicitly separate any future worker claim events.
5. PR #111 migration 0003 uses CREATE TABLE IF NOT EXISTS; this cannot retrofit PR #114's existing pool_tasks table with lease columns. Later migrations and triggers assume fields such as lease_owner, lease_generation, lease_expires_at, attempt_count, updated_at and attempt pointers.
6. PR #125 changes the admission migration and adapter to persist controller_run_attempt, but still allows dsh-headless-probe. Its README explicitly says the allowlisted cloud-pool-next-controller.yml workflow does not exist on default branch and that no webhook signature verification, independent API re-read or hosted D1 test is included.
7. PR #125 assigns GITHUB_SHA to both targetSha and trustedDefaultHeadSha. This equality is tautological within the adapter; it does not independently read the current default branch ref. The adapter's own README acknowledges that the pure admission function does not fetch GitHub refs or prove supplied SHA authenticity.
8. PR #112 is a read-only event predicate and workflow. It does not create a durable receipt, consume approval, or persist a task. It should be treated as predicate/test input, not a second controller.

## Canonical integration target

Use one migration lineage and one authoritative set of tables:

- pool_approval_ledger: approval capability, immutable binding, one-shot state transition. Profile must be the explicitly qualified executor profile, not the retired DSH profile.
- pool_admission_receipts: immutable, unique source-comment receipt with repository/owner/issue identity, event/run provenance, trusted target SHA, controller code SHA and admission digest.
- pool_tasks: one logical task per stable task key; contains wave and immutable target/profile identity plus lease state, lease owner, expiry, monotonically increasing generation, current attempt pointer and timestamps.
- pool_task_approvals: many-to-one approval attachment history, with each approval consumed once.
- pool_task_outbox: exactly one authoritative task-ready event per task key. Do not keep a parallel approval-keyed claim outbox.
- pool_attempts, pool_attempt_events, pool_attempt_reconciliations: immutable execution attempts, append-only events and non-authorizing reconciliation queue.

The receipt insert should remain the sole admission transaction boundary. Its trigger/transaction must consume exactly one ready approval, bind one immutable logical task, attach approval and create one task-ready outbox row atomically. Exact replay must read back the full original receipt, task, approval attachment, consumed approval and outbox; it must not create or consume anything again.

Lease acquisition must be a conditional update on the canonical task row. Every attempt transition to running or terminal must require matching current attempt, lease owner, positive generation and unexpired lease. An expired lease alone must not authorize retry or takeover of an indeterminate attempt. Reconciliation remains non-authorizing.

## Event provenance boundary

- Keep the exact owner-only /next predicate from PR #112 as a pure, adversarially tested predicate.
- Compose it with the PR #125 runner-context checks, but remove the legacy DSH profile.
- The target SHA must come from a trusted current default-branch ref read or equivalent independently authenticated source; do not label the same GITHUB_SHA value as two independent facts.
- Bind run ID and run attempt, workflow code SHA/ref, source comment ID, owner/repository numeric IDs, exact issue #96, exact /next, event type and trusted default branch.
- The local test harness may use synthetic fixtures, but its README and test names must not imply live webhook authenticity or hosted D1 qualification.

## Required next implementation sequence

1. Freeze the current default HEAD and create a new single integration branch.
2. Define the canonical migration sequence once; do not copy either independent migration root wholesale.
3. Port the PR #114 receipt/admission model first, with a profile boundary that cannot admit dsh-headless-probe.
4. Port the PR #111 logical task/attempt/lease invariants into the same pool_tasks schema, removing the approval-keyed legacy claim outbox and duplicate task delivery outbox.
5. Compose the event predicate and Actions context adapter; add an independently sourced target-ref boundary to the interface and tests.
6. Add adversarial local Workers-runtime tests for replay, changed run attempt, stale target SHA, forged owner/repository identity, profile mismatch, concurrent consume, duplicate outbox, lease expiry, stale generation, indeterminate attempt and ambiguous write.
7. Run exact-head CI and inspect the final diff and migration order.
8. Keep every adapter result dispatch: false and executionAuthorized: false.

## Non-goals and limitations

No live webhook controller, signature verification, hosted D1 provisioning/writes, Cloudflare account access, provider invocation, worker execution, secret access, R2 mutation/deletion, GitHub dispatch, deployment, merge, branch-protection changes or external review request. Local Workers-runtime tests cannot prove hosted D1 concurrency semantics, live GitHub event provenance, worker identity, provider quotas or exactly-once external side effects.

## Audit disposition

BLOCKED FOR CODE COMPOSITION until the shared schema is unified. The next safe code change is not a blind PR stack; it is a single clean-base migration/adapter implementation against the canonical target above.


## Follow-up ancestry audit: the earlier canonical D1 proof stack

A deeper read of the current-default design contract and PR #67/#72 changes the preferred integration source. Do not treat PR #114/#125 as the canonical D1 schema. The default-branch design document explicitly identifies the isolated `proofs/d1-ledger` stack from PR #67 and its additive atomic-admission extension in PR #72 as the intended substrate.

### Verified ancestry and migration lineage

- PR #67 (`a53f6232bd5b50d3e150addf528b8e722002f9dd`) contains the full isolated `proofs/d1-ledger` package, migrations 0001–0010, logical task, lease, immutable attempts, reconciliation, and projection-delivery proof.
- PR #72 (`a391f5c9b08c7ccfc12d966bf8e085c1966bfb31`) is stacked on PR #67 and adds migration 0011 plus `admit-qualified-task.mjs`, the composite A0/D1 batch adapter and tests.
- PR #111 is a clean-default port of only the lease ledger subset, but its migration 0006 is `0006_guard_running_attempt_requires_lease.sql`. In PR #67, migration 0006 is already `0006_create_attempt_projection_outbox.sql`. Copying #111's migration filename into the #67/#72 chain would collide.
- PR #67 and #72 both have merge base `221f216c00ca7e5596bcc682ba185ad155a10603` against current default `68183828cf7934e89109310c8f99281be4eb7ed8`, and are 81 commits behind. They must be selectively transplanted/reconciled on a clean current base, not merged as-is.
- PR #72 migration 0011 and adapter hardcode `dsh-headless-probe` as the capability profile. That is incompatible with the owner-frozen CODE executor profile and must be removed from SQL checks, adapter validation, fixtures, tests and docs.
- PR #125 is a separate `proofs/d1-admission` package. Its adapter does not independently authenticate the current default ref; it must not become a second D1 admission authority.

### Revised canonical implementation decision

Use PR #67/#72's existing `proofs/d1-ledger` as the sole schema lineage, not the independent `proofs/d1-admission` schema from #114/#125.

1. Selectively port the complete required #67 D1 package and #72 migration 0011/composite batch adapter onto a clean branch from current default, after reconciling all changed files and current package conventions.
2. Preserve the #67 migration history 0001–0011. Port the #111 running-attempt lease guard as migration **0012**, not 0006, and verify it against the actual #67 attempt schema and trigger ordering.
3. Replace every legacy DSH profile restriction with the exact frozen CODE profile, including approval rows, qualification rows, adapter validation, fixtures and adversarial tests. Do not broaden to arbitrary profile strings.
4. Preserve the single logical-task table and task-level outbox already implemented in #67. Do not import #114's second schema or create another controller.
5. Compose owner-only event validation from #112 and Actions provenance only after defining an independent trusted current-default-ref lookup. Do not accept a runner-provided `GITHUB_SHA` as proof of the current branch head.
6. Run all package migrations and Workers-runtime tests, frozen upgrade fixture, syntax/security checks and exact-head CI on the resulting clean-base head. Dispatch and execution authorization stay false.

### Important qualification boundary

This is a source-level integration decision, not proof that the old PR #67/#72 tests pass on the current base. The 81-commit ancestry gap, profile migration, migration 0012 addition, and current dependency/toolchain changes require exact-head requalification. No hosted D1, live GitHub event authenticity, provider credentials, dispatch, deployment or merge is authorized.


## CODE-profile migration inventory on PR #72

A repository-blob scan of the 39-file proofs/d1-ledger package at PR #72 head found 16 literal occurrences of dsh-headless-probe across 14 files. The profile is bound in both SQL and application/test contracts.

Files requiring explicit profile review/update:
- migrations/0001_create_pool_approval_ledger.sql
- migrations/0011_atomic_qualified_admission.sql
- src/a0-admission-contract.mjs
- src/admit-qualified-task.mjs
- src/claim-outbox.mjs
- src/consume.mjs
- test/a0-admission-contract.test.ts
- test/atomic-admission.test.ts
- test/claim-outbox.test.ts
- test/consume.test.ts
- test/d1-upgrade-binding.smoke.ts
- test/d1-upgrade-fixture.smoke.ts
- test/projection-delivery.test.ts
- test/projection-envelope.test.ts

The package README, package manifests, lease/attempt modules, and migrations 0002–0010 did not contain the literal legacy profile in this scan. This is a bounded literal-string inventory, not a semantic guarantee that no profile assumptions exist elsewhere.

### Port checklist before code is changed

- Define one exported constant for the exact frozen CODE profile and use it consistently in JS validators and fixtures.
- Change SQL migration constraints at both approval issuance and route qualification; preserve strict equality, never replace with a permissive allowlist that retains DSH.
- Preserve immutable historical migration semantics: because these migrations are an isolated proof not yet deployed, the clean-base port can carry corrected source migrations; if any environment has applied the old migration, it needs a forward-only corrective migration instead of rewriting history. No hosted D1 state was inspected.
- Update the golden upgrade fixture/schema version and migration smoke tests deliberately; do not mass-replace blindly.
- Add explicit negative tests proving dsh-headless-probe is rejected at approval, qualification, admission, task claim and projection-envelope boundaries.
- Add positive tests proving only the exact CODE profile is admitted.
- Re-run all relevant package suites, migration upgrade smoke, projection delivery/reconciliation and contract validation on exact final head.

This inventory is preparatory evidence only. No profile code or migration has been changed yet.
