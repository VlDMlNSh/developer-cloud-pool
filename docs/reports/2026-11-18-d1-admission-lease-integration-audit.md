
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


## Pass 5 — broad integration execution plan and deeper source audit (2026-11-18)

### Verified current evidence
- Current default branch HEAD was re-read and remains `68183828cf7934e89109310c8f99281be4eb7ed8`; no new default commits appeared during this pass.
- PR #139 remains the clean-base legacy-retirement candidate; its exact-head Pool Contract Validation run `44349941243` completed SUCCESS. This removes the legacy label-driven DSH dispatch path only in the proposed PR; it is not yet on default.
- PR #116 (Claude Code + ECC + FCC no-secret runner qualification) is OPEN/DRAFT at `2e944f13818f434cf135602c1c0e82051f1d3fa8`, compares 74 ahead / 2 behind current default (merge base `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`), and has exact-head successful runs `44286955360` (Pool Contract Validation) and `44286955337` (Claude Code + ECC + FCC Runner Qualification). These prove only the scoped no-secret runner/install tests at that head, not a production executor or D1 profile identifier.
- PR #72 is OPEN/DRAFT and its current head is `a391f5c9b08c7ccfc12d966bf8e085c1966bfb31`, stacked on PR #67 head `a53f6232bd5b50d3e150addf528b8e722002f9dd`. No exact-head PR workflow runs were returned for the current #72 head. PR #67's successful runs `43600901063` and `43600901068` belong to its own earlier exact head, not #72's current head.
- The frozen executor is described as Claude Code + ECC + FCC, but no canonical D1/worker profile identifier literal is present in the retrieved prior context or PR #116 source. PR #116's `.fcc` directory is a filesystem profile path, not a declared immutable executor-profile ID. Do not invent a slug or silently equate `.fcc` with a D1 capability profile.

### D1 migration and adapter findings from source
1. Migration 0002 creates the historical per-approval `pool_task_claims` and `pool_task_outbox` path (`pool.task.claimed`). Migration 0003 adds logical `pool_tasks`, `pool_task_approvals`, and task-level `pool_task_delivery_outbox` (`pool.task.ready`) but deliberately retains the old claim/outbox trigger for approvals without `task_key`. The package therefore contains two queue/outbox paths. The composite #72 adapter uses the task-level path, but the old path remains executable through the lower-level claim/consume APIs. The integration must explicitly mark the legacy path non-authoritative or remove it from the admitted flow with regression coverage; do not claim the schema has only one outbox table.
2. Migration 0011 adds only `admission_id` to `pool_approval_ledger`; it does not add the full qualification/evidence/model/idempotency binding columns described in the normative contract. The admission row stores qualification ID and evidence digest, while the remaining identity is reconstructed by joins to approval and qualification rows. Decide whether the normative contract should be narrowed to this normalized binding or the schema expanded; whichever is chosen, enforce immutable binding at the database boundary.
3. Migration 0001 constrains approval `profile` to `dsh-headless-probe`; migration 0011 constrains `capability_profile` to the same retired value. The composite adapter, A0 evaluator, consume/claim adapters and tests also hardcode it. A corrected clean-base proof must change the source migration chain and all 14 identified source/test files together. The exact replacement profile ID is currently UNDEFINED in repository evidence; this is a hard blocker for profile-bound schema/code edits, not permission to invent a value.
4. Migration 0011 creates append-only guards for admissions and receipts, and immutable route identity/revocation guards. It does not add a database trigger freezing all approval identity columns (owner, repository, issue, target SHA, profile, envelope digest, expiry) after issuance/consumption. The next migration must enforce that binding or provide an equally strong schema-level invariant, with tests attempting direct SQL mutation.
5. Migration 0011's route status supports `qualified` and `revoked`; the normative contract also names `suspended` as a deny state. The next schema revision must model suspension explicitly and make qualification status transitions monotonic and fail-closed, or update the contract with an explicit reason why suspension is represented elsewhere.
6. The existing task-level outbox is initially created by the approval-consumption trigger and later bound to admission/attempt/evidence in the same D1 batch. Preserve this transaction sequence and its CHECK-backed receipt assertion; test every intermediate failure and ensure no duplicate queue intent.
7. Migration 0012 lease guard from PR #111 is compatible in intent with migration 0004's lease-acquired trigger: a `prepared -> running` transition must match the task's current attempt, lease attempt, non-null owner, positive generation and unexpired lease at `started_at`. Port it as 0012 only after adding exact migration-upgrade tests for the full 0001–0012 chain.
8. `src/task-attempts.mjs` permits expired-running-attempt takeover when caller supplies `{resumable: true}`. A caller boolean is not independent evidence that the prior executor stopped or that replay is safe. Replace this with a durable, typed, separately authorized reconciliation decision bound to task, attempt and prior lease generation; expiry alone and a boolean must never authorize takeover.
9. The older `src/task-lease.mjs` API can reclaim an expired task lease without the immutable-attempt lifecycle checks. Keep it explicitly segregated as a legacy proof primitive or remove it from any composed/public admission path. Do not mix it with `task-attempts.mjs` semantics.
10. `claimLogicalTask()` and `consumeApproval()` remain callable as separate low-level APIs, so they can create a consumed task/outbox without an immutable attempt. The integrated controller must call only the single composite admission boundary; low-level primitives should be documented/tested as non-authorizing internal proof helpers, not alternative admission routes.
11. The route-qualification row is assumed to have been inserted by a trusted authority. No qualified writer, cryptographic issuer verifier, canonical evidence serialization or live provider/account/quota proof exists in this package. Admission must remain blocked until that authority boundary is implemented or explicitly provided by a separately qualified service.
12. The existing exact retry path checks that route evidence is still active/fresh before returning `ADMISSION_ALREADY_COMMITTED`. Add a test and make the intended semantics explicit for an already-committed receipt whose route later expires or is revoked: a read-only replay may return the immutable historical receipt, but must never authorize new execution or queue delivery.

### Maximum-width, dependency-ordered next pass

**Gate 0 — freeze immutable inputs and scope**
- Pin current default SHA, owner/repository numeric identity, issue #140, exact profile ID, profile version, allowed model/provider policy and task-key canonicalization.
- Resolve the missing executor profile ID from an owner-authored source. Until then, no D1 profile constraint or allowlist replacement is to be guessed.
- Keep dispatch=false and executionAuthorized=false in all fixtures, adapters, workflow environments and receipts.

**Gate 1 — retire legacy paths**
- Carry PR #139's exact-head retirement changes forward only after rechecking base/head and required checks.
- Explicitly prevent the old per-approval claim/outbox API from acting as a second admission path.
- Confirm the DSH worker remains inert and the supervisor has no label mutation, dispatch, write token or API path even if the old variable is set true.

**Gate 2 — qualify the CODE executor boundary**
- Reconcile PR #116 file-by-file onto current default; retain signed Claude release verification, isolated task HOME, strict child environment, FCC single-account/no-fallback guard, and synthetic secret-redaction tests.
- Verify runtime sandbox/effective egress controls separately from runner inventory; a no-secret install pass is not proof of a task execution sandbox.
- Record pinned tool/runtime versions, image/action digests, runner architecture, and exact workflow run metadata. No provider credential values or live model call.

**Gate 3 — canonical D1 schema and atomic admission**
- Selectively port the complete #67/#72 package, not their stale branch ancestry.
- Correct profile constraints only after Gate 0 supplies the exact profile ID.
- Choose one authoritative task-ready outbox; deprecate the approval-keyed legacy path in code/tests or preserve it only as a clearly isolated legacy fixture.
- Enforce immutable approval identity, route qualification identity, admission identity and task/outbox binding at SQL level.
- Model qualified/suspended/revoked status with monotonic transitions and version fencing.
- Add migration 0012 for current-attempt lease requirement, plus durable reconciliation authorization; remove caller-boolean resumability.
- Preserve one atomic D1 batch: conditional approval consume + trigger-created task/approval/outbox + admission + immutable attempt + outbox evidence binding + CHECK-backed commit receipt. All failures roll back; exact replay resolves durable receipt without creating new attempt/outbox.

**Gate 4 — event and controller provenance**
- Port the pure owner-only `/next` predicate from PR #112 with adversarial tests for sender ID, repo owner/repo IDs, issue number, exact command, event/action and comment identity.
- Port PR #125's GitHub Actions context adapter only after correcting its target-SHA flaw: runner `GITHUB_SHA` is not an independent trusted current-default-head lookup. Read the current default ref through an authenticated GitHub API source and bind both expected ref and actual workflow code SHA separately.
- Bind run ID, run attempt, workflow ref/SHA, event SHA, source comment ID, numeric owner/repository IDs, target SHA, profile ID, approval ID and D1 receipt. Reject stale, cross-repo, replayed and ambiguous context.
- Add a durable controller lease with owner/generation/expiry/read-back and crash recovery. No caller boolean (`lockHeld`, `resumable`, etc.) may grant authority.

**Gate 5 — complete adversarial acceptance matrix**
- Migration upgrade from frozen 0010 fixture through 0012; schema introspection and trigger ordering.
- Concurrent approval consumption/admission (12+ contenders); exact retry after lost batch response; duplicate IDs and idempotency keys.
- Direct SQL mutation of approval, route, admission, task, attempt and outbox identities.
- Route evidence unknown/stale/suspended/revoked, issuer/account/model/provider/quota-domain substitution, evidence digest mismatch and revocation race.
- Task-key collision, attempt insertion failure, outbox bind failure, receipt assertion failure, D1 batch exception/ambiguous outcome.
- Lease expiry, stale owner, stale generation, prepared->running without lease, indeterminate attempt, authorized reconciliation, stale finalizer and retry after indeterminate.
- Event spoofing, non-owner `/next`, wrong repo/issue, stale default SHA, forged workflow context, run-attempt mismatch, duplicate source comment and duplicate admission.
- Confirm no secret values, provider calls, dispatch or external side effects in all tests.

**Gate 6 — exact-head CI and evidence publication**
- Run Pool Contract Validation, isolated D1 Workers-runtime matrix, syntax/security checks, migration upgrade binding, frozen upgrade fixture, CODE runner qualification and provenance/controller tests on one exact candidate SHA.
- Inspect each workflow job and artifact; report exact SHA/run IDs/conclusions. A green PR #67 or earlier #72 SHA is not evidence for a new transplanted head.
- Verify required ruleset status contexts separately; do not equate zero contexts with required checks satisfied.
- Keep all implementation PRs Draft until the acceptance matrix is green. No merge, hosted D1, deployment, dispatch, provider call or independent review request.

### Execution outcome of this pass
This pass completed the full source-level dependency audit and expanded the canonical report and Issue #140. It did not transplant code because two prerequisites are unresolved and changing them by guess would create a false contract: (1) the exact immutable CODE executor profile identifier has not been defined in owner-authored repository evidence; (2) PR #72's current head has no returned exact-head CI evidence, and its D1 package contains the schema/API issues listed above. The next safe code action is to build a clean-base candidate after the profile ID is frozen, then port/fix the entire schema and adapter chain together. No source code, migration, dispatch variable, production resource or default-branch file was changed in this pass.
