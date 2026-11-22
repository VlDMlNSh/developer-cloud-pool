# Pass 44 — current-base D1 schema collision map

Date: 2026-11-22  
Scope: read-only forensic integration map for Issue #140. No production code or SQL changes.

## Frozen repository state

- Repository default branch: `Основной`.
- Default HEAD: `81baadbb5944e11ed41a64bd0190bf2c8edd0c41` (commit successfully re-read).
- Default-head Actions runs returned an empty list; combined status returned no status entries. This is **no evidence of a passing exact-head CI run**, not a pass.
- PR #111: OPEN / DRAFT / UNMERGED; base `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`, head `687196738782432797bf394f1342cb9df19f478f`.
- PR #112: OPEN / DRAFT / UNMERGED; base `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`, head `c9a4c0ab2001f01a09632795283071c521e1c99d`.
- PR #114: OPEN / DRAFT / UNMERGED; base `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`, head `ab9461eb84b14fe230918391d5212f19ca25592c`.
- PR #125: OPEN / DRAFT / UNMERGED; stacked on #114, base `ab9461eb84b14fe230918391d5212f19ca25592c`, head `69398d497c8e9be3e9fe7241e4dc6d3bc2e4c973`.
- PR #165: OPEN / DRAFT / UNMERGED; base `83b8e9d3b0bdeeb201e24a7a9d2fe042fb00694a`, head `80dcd602a86ab6df58fb144ecdffaa6266cb9cf0`.
- Issue #140 and Issue #96 remain OPEN. Issue #96 still describes a PLANNED, fail-closed owner control surface; it does not authorize dispatch.

## File-level candidate inventory

GitHub compare API supplied the changed-file lists; the candidate source files were also read from their exact PR branch refs.

| Candidate | Changed source/schema files | Architectural role |
|---|---|---|
| #111 | `proofs/d1-ledger/migrations/0001..0006_*.sql`; `src/claim-outbox.mjs`, `src/task-lease.mjs`, `src/task-attempts.mjs`; tests and package | Approval consumption, per-approval claim/outbox, logical task identity, immutable attempts, lease/fencing and reconciliation queue |
| #112 | `.github/workflows/next-event-controller-readonly.yml`; `scripts/next-event-controller.mjs`; tests | Read-only exact owner/Issue #96/event/ref predicate; no durable admission |
| #114 | `proofs/d1-admission/migrations/0001_atomic_next_admission.sql`; `src/admission.mjs`; tests/package/workflow | Source-comment receipt, one-shot approval consume, logical task, task-level outbox in one trigger transaction |
| #125 | modifies #114 admission migration/adapter/package; adds `src/github-actions-adapter.mjs` and tests/workflows | Synthetic GitHub Actions context binding composed with #114; not a live trusted controller |
| #165 | `proofs/d1-ledger/migrations/0015_issuer_bound_reconciliation_decisions.sql`; `src/record-attempt-reconciliation.mjs`; tests | Issuer-bound durable reconciliation decision over #111 attempt/lease schema |

## Proven schema collisions

1. **Two independent migration roots both create the same authority tables.** #111 migration 0001 creates `pool_approval_ledger`; #114 migration 0001 independently creates `pool_approval_ledger`. These are not additive definitions. #111 requires `profile = 'dsh-headless-probe'`; #114 stores the approved profile as a general binding and ties it to a receipt.
2. **Both roots create `pool_tasks`, `pool_task_approvals`, and `pool_task_outbox`.** #114 creates these as admission-time task/outbox tables. #111 migration 0003 creates another logical-task schema and a distinct `pool_task_delivery_outbox`, while #111 migration 0002 retains the legacy per-approval `pool_task_claims` / `pool_task_outbox` path. Table names and semantics overlap; they cannot be applied together as independent packages.
3. **Lease/attempt model exists only in #111's ledger lineage.** #111 migrations 0004–0006 add immutable attempts, lease generation and a DB guard requiring a current unexpired lease before `running`. #114's task schema has no lease owner, expiry, generation, attempt pointer or attempt tables. A #114 task is therefore not directly consumable by #111 attempt adapters without a deliberate unified schema migration and adapter rewrite.
4. **#165 migration 0015 is downstream of #111, not a standalone add-on.** It references `pool_tasks`, `pool_attempts`, and `pool_attempt_reconciliations`; those are supplied by #111 migrations 0003–0005. Applying 0015 to #114's admission-only schema would fail due to missing attempt/reconciliation tables.
5. **#125 changes the #114 schema in place.** It modifies the admission migration and adapter and adds Actions environment binding. It is a stack on #114, not an independent schema candidate or a clean current-base integration.
6. **#112 is a separate event predicate, not a persistence layer.** It can inform the trusted-event validation seam, but it does not solve receipt idempotency or atomic approval consumption.

## Canonical integration decision

Do **not** merge/cherry-pick any candidate wholesale and do not apply the two migration roots together.

Recommended single current-base implementation sequence:

1. Start one new integration branch from frozen default HEAD `81baadbb5944e11ed41a64bd0190bf2c8edd0c41`.
2. Define one canonical migration lineage and one canonical table owner for approvals, admission receipts, logical tasks, approvals-to-task, outbox, leases, attempts, and reconciliation. Retain historical IDs only as explicit migration history; do not create a second copy of the same tables.
3. Port the #112 owner-only event predicate and the #125 Actions-context binding as a pure validation seam, but bind only runner/GitHub-provided context and document that local fixtures do not prove webhook authenticity.
4. Port #114 source-comment idempotency and atomic receipt/one-shot approval/outbox transaction into the canonical ledger schema. Ensure exact replay reads the full durable chain, including attempt/lease projections once created.
5. Port #111 logical task/lease/attempt schema and adapters, removing the legacy `dsh-headless-probe` profile from any new allowlist. The owner-frozen CODE profile remains a later separately qualified profile; no credentials/provider calls.
6. Port #165 reconciliation only after the canonical attempt/reconciliation tables exist. Keep its injected cryptographic verifier explicitly NOT production-qualified until a pinned JOSE verifier, trusted issuer configuration, clock and adversarial tests are integrated.
7. Add negative-first tests for concurrent admission, replay, conflicting readback, ambiguous write, approval reuse, stale target, forged Actions context, lease expiry, generation fencing and outbox rollback. All results must remain `dispatch:false` and `executionAuthorized:false`.

## Evidence and limitations

- Current default HEAD commit readback: `81baadbb5944e11ed41a64bd0190bf2c8edd0c41`.
- Current default-head workflow-run query: empty result. Combined status: empty result. Exact-head CI: NOT VERIFIED.
- PR compare API file inventories were obtained for #111/#112/#114/#125/#165. Relevant SQL and adapter blobs were read from exact candidate refs; examples: #111 migration 0001 blob `a80524ed839b63dd6483978118619495fa550877`, #111 migration 0003 blob `49b0798871429d7961e81eb1d86ad892dba0b9b9`, #114 admission migration blob `20bd330c4c6fe01752e64abb5d3f8b6112e5a66`, #114 adapter blob `e37eef052de0a5daff36c0ffbf873a2fd49d942b`, #125 Actions adapter blob `89f28778dab1ee10c7e39bebeaaf0a6270b9c750`, #165 migration 0015 blob `442db58f7c6ff0463e9a391572a1e45ebccc7df3`.
- A few branch-name guesses returned 404; exact live PR metadata was used to correct refs before reading the candidate files.
- No source code, SQL, workflow, dependency or lockfile was changed. No tests were run. No hosted D1, secrets/variables, provider calls, dispatch, deployment, merge or paid resource was touched.
- Ruleset/governance live readback remains NOT VERIFIED. No approved dispatch controller was re-established in this pass.

## Status

- Issue #140 schema/file collision map: **VERIFIED** as a read-only source inventory and design decision.
- Current-base integrated admission + lease proof: **PLANNED / NOT IMPLEMENTED**.
- Production controller and trusted event provenance: **NOT QUALIFIED**.
- Gemini: **NOT RUN**.
- Contour A: **BLOCKED / NOT ACCEPTED**.
- Contour B: **DEFERRED**.

Next bounded pass: create a clean integration branch from the then-current default HEAD and implement only the unified migration/schema foundation after recording exact parent SHA and a migration compatibility test plan. Do not enable dispatch.
