
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
