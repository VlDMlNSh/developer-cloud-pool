# 2026-11-19 — Issue #140 current-base D1 lineage and PR overlap audit

**Status:** VERIFIED — source-level dependency/file-overlap audit only; implementation NOT RUN.  
**Contour:** A — Cloud Development Pool. Contour B remains DEFERRED.  
**Immutable baseline:** `refs/heads/Основной` @ `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.  
**Documentation branch:** `docs/next-2026-11-19-integrated-contour-pass`; PR #145, OPEN / DRAFT / UNMERGED.  
**Governance:** Issue #140 OPEN; local no-secret qualification only.

## 1. Live state and provenance

- Repository metadata confirms default branch `Основной`.
- Default ref was read directly and resolves to `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- PR #146 is OPEN / DRAFT / UNMERGED; head `9d32c4943ae87f5855ab05d42a4ba12d1c205211`, base default at `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`. Formal reviews: 0.
- PR #147 is OPEN / DRAFT / UNMERGED; head `0ea6dcd589b914399a66e289190e00addbf6d9a1`, base PR #146 head `9d32c4943ae87f5855ab05d42a4ba12d1c205211`. Changed files are documentation-only (six files); formal reviews: 0. Earlier checkpoint SHA `447ed051...` is stale and must not be used as its current head.
- PR #145 is OPEN / DRAFT / UNMERGED; head `dced5419e9611bdefdec1dfaf314ff513d6d1a42`, base default SHA above. Formal reviews: 0. Exact-head workflow-run lookup returned no runs; CI for this documentation head is NOT VERIFIED.
- PR #146 exact-head workflow runs on `9d32c494...`: Pool Contract Validation run `44522152749` SUCCESS; Isolated D1 Ledger Proof run `44522152799` SUCCESS. Combined commit-status contexts were empty. These CI runs do not qualify hosted D1 or a live executor.
- PR #147 exact-head workflow-run lookup returned no runs: NOT VERIFIED.
- PR #141 remains OPEN / DRAFT / UNMERGED on old base `68183828cf7934e89109310c8f99281be4eb7ed8`; its audit report is useful evidence but not current-base integration.
- Active repository ruleset `26550182` was read directly: enforcement active on `refs/heads/Основной`; PR required; review-thread resolution required; approving-review count 0; CODEOWNERS review disabled; no bypass actors; deletion and non-fast-forward prohibited. Classic branch-protection endpoint returned 403 to the connected integration and is NOT VERIFIED.

## 2. File-overlap and lineage map

| PR | Base / head (abbreviated) | Primary changed paths | Relationship / finding |
|---|---|---|---|
| #67 | base `221f216...`; head `a53f623...` | `proofs/d1-ledger/migrations/0001–0010`, ledger adapters/tests | Historical D1-ledger lineage: approval ledger, claim/outbox, logical tasks, immutable attempts, reconciliation, projection outbox and projection delivery. |
| #72 | base #67 head; head `a391f5c...` | `proofs/d1-ledger/migrations/0011`, `admit-qualified-task.mjs`, tests | Stacked extension of #67 with qualified admission, route qualifications, admission/commit receipts and outbox binding. Still contains legacy profile literal `dsh-headless-probe`. |
| #111 | base `35208f0...`; head `6871967...` | Same `proofs/d1-ledger` paths; own migrations 0001–0006 | Separate ledger root. Its migration 0006 is a lease guard, while #67 migration 0006 is projection outbox. Same path/name, incompatible schema responsibility. |
| #112 | base `35208f0...`; head `c9a4c0a...` | `.github/workflows/next-event-controller-readonly.yml`, `scripts/next-event-controller.mjs`, tests | Event/controller envelope proof only; no D1 schema. Keep conceptually separate from persistence authority. |
| #114 | base `35208f0...`; head `ab9461e...` | New `proofs/d1-admission` package and migration 0001 | Independent admission schema creates another `pool_approval_ledger`, `pool_tasks`, `pool_task_outbox`, receipts and approval/task relationships. Competes with #67/#72 authority if stacked. |
| #125 | base #114 head; head `69398d4...` | Same `proofs/d1-admission`, GitHub Actions adapter/workflows/tests | Extends #114 rather than #67/#72. Adapter equates `GITHUB_SHA` with both `targetSha` and `trustedDefaultHeadSha`, so it does not independently read current default HEAD; it allows legacy `dsh-headless-probe`. |
| #146 | base current default `b81d2b5...`; head `9d32c49...` | Same `proofs/d1-ledger` path; migrations 0001–0007; registry/profile/OIDC | Current-base A1 proposal, but its D1 migrations form another variant: migration 0002 creates `pool_task_claims` and `pool_task_outbox`; migration 0003 adds `pool_tasks` and a second `pool_task_delivery_outbox`; migration 0006 is the lease guard; migration 0007 binds executor IDs. It does not contain #67 projection migrations 0006–0010 or #72 qualified admission 0011. |
| #147 | base #146 head; head `0ea6dcd...` | Six documentation files | Stacked additive candidate research only; no runtime/schema integration. |
| #145 | base current default; head `dced541...` | Acceptance runbook, checkpoint, reports, Context Window | Documentation-only current-base branch; this report extends its evidence. |

## 3. Direct source checks that establish the conflicts

1. #67 `0006_create_attempt_projection_outbox.sql` creates `pool_attempt_projection_outbox`, projection delivery events and triggers on attempt finalization.
2. #111 `0006_guard_running_attempt_requires_lease.sql` creates `pool_attempts_running_requires_current_lease`. It is a different migration occupying the same ordinal in a separate root. Do not combine both as migration 0006.
3. #72 migration 0011 extends #67's approval ledger and task delivery outbox, adds `pool_route_qualifications`, `pool_admissions` and `pool_admission_commit_receipts`; its profile constraint is hardcoded to `dsh-headless-probe`, which conflicts with the frozen CODE profile direction.
4. #114 migration 0001 independently creates approval/task/outbox authority tables. Its `pool_task_outbox` semantics are not the same as #67's `pool_task_delivery_outbox` or #67 projection outbox.
5. #125 adapter uses `GITHUB_SHA` for both task target and trusted default head and accepts only legacy `dsh-headless-probe`; both violate the Issue #140 current-ref/profile requirements.
6. #146 current-base migrations 0002 and 0003 create two different task delivery/outbox representations. The A1 branch's migration 0006 has the lease guard but lacks #67's projection-outbox sequence; migration 0007 adds executor ID binding. The current-base A1 profile/registry/OIDC work is valuable input, but the D1 schema must not be presumed canonical merely because its PR base is current.

## 4. Canonical direction and bounded recommendation

- Retain the Issue #140 direction: one canonical `proofs/d1-ledger` authority, one approval ledger, one logical task authority, one task-ready outbox, immutable attempts/events, and a non-authorizing reconciliation queue.
- Use #67 migrations 0001–0010 plus #72 migration 0011 only as a selective source lineage, not as merge-ready branches; they are old-base and #72 has a legacy profile constraint.
- Reconcile #111 lease guard as a later migration (Issue #140 comments identify migration 0012 in the #67/#72 lineage), after trigger/schema compatibility review. Do not reuse the conflicting ordinal.
- Port the owner-frozen `jarvis-code-sandbox-v1` profile and PR #146's registry/OIDC work as separately reviewed components only after checking their dependencies against the canonical schema. Keep executor ID distinct from capability profile, provider/account/quota, host, lease owner and issuer.
- Do not adopt #114/#125 as a second admission store. Their event-binding ideas may be reviewed selectively, but #125's current-head and legacy-profile defects must be corrected in a new proof.
- Keep #112's read-only event predicate/controller proof separate; bind trusted Actions context and independently resolve current default ref/SHA. No worker execution without a current, unexpired lease and positive fencing generation.
- Negative-first tests must cover replay/full durable-chain verification, stale target SHA, forged context, duplicate/concurrent events, approval reuse, expired lease, stale fencing, ambiguous writes, partial outbox and invalid/legacy profile.
- Every adapter must continue to emit `dispatch:false` and `executionAuthorized:false`.

## 5. Governance and executor disposition

Issue #140 remains OPEN and controlling. This pass performed source-level GitHub reads only. No secrets or variables were inspected; no hosted D1 was provisioned or written; no provider/model call, workflow dispatch, agent launch, deployment, merge or production action occurred.

- Gemini: NOT RUN — dispatch prohibited by Issue #140; no controller bypass.
- Claude Code server executor: NOT RUN — no host/capability/allowlist qualification performed in this pass.
- Other candidate runtimes (OpenChamber, DeepSeek Harness, CUA, llama-modchip, Stanford OpenJarvis, isair/Jarvis): preserved as research-only/additive; no install or integration.
- Tests: NOT RUN — documentation/source-audit pass only. Exact-head CI for PR #145 is NOT VERIFIED.

## 6. Result and next step

**Pass result:** VERIFIED source-level overlap map; canonical D1 implementation remains BLOCKED pending clean-base selective integration and negative-first local Workers-runtime tests. No schema or runtime code changed.

Next bounded pass: create a clean implementation branch from the frozen current default SHA; port one migration lineage without duplicate tables/outboxes; reconcile lease guard and CODE executor identity/profile binding; then run local Workers-runtime tests with dispatch and execution authorization false. Preserve PR #146's profile/registry evidence separately from its non-canonical D1 migration decisions.

Contour A: NOT ACCEPTED. Contour B: DEFERRED.

Canonical MediaHub map (separate project; not in scope before Contour A acceptance): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
