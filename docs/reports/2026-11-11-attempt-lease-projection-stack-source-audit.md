# Contour A — attempt/lease and projection stack source audit

- Date: 2026-11-11
- Status: SOURCE AUDIT SUCCEEDED / INTEGRATION NOT AUTHORIZED / NO RUNTIME CHANGE.
- Immutable baseline for accepted source: `Основной@6fdcedebeba62715122e43a75c6ad6d926321ce7`.
- Scope: inspect the exact source artifacts and recorded exact-head CI for the current D1 attempt/lease and projection proof stack; identify a safe integration boundary.

## 1. Source refs and CI evidence

### PR #56 — expired attempt lease takeover denial
- PR body records current head `0769b6b5d5eda9c7821804b93db21ded6e0985ef`; source read-back:
  - `proofs/d1-ledger/src/task-attempts.mjs` blob `d9e5f97b94f0873fbec542a71bc90ea3b62e0e30`
  - `proofs/d1-ledger/test/claim-outbox.test.ts` blob `911945bed6449b45f421786808d57e994d160e71`
  - `proofs/d1-ledger/migrations/0004_create_immutable_task_attempts.sql` blob `0ad590ffdd2589f857257739275c15ed2d54d729`
  - `proofs/d1-ledger/migrations/0005_create_attempt_reconciliation_queue.sql` blob `7a19897f6197c79517170e101e4cbf1db233cac6`
- Exact-head run `42825872826`: COMPLETED / SUCCESS (local Workers-runtime D1 proof only).
- Source removes the caller-controlled `resumable` argument and only leases a pending task with a prepared current attempt. It rejects expired/running/indeterminate takeover and retains `dispatch:false`.
- Reconciliation queue is append/materialization only: it stores attempt, task, input digest, generation and expired owner. It does not authorize retry, resolver action or terminalization.

### PR #59 — bounded projection retry/dead-letter
- Exact head `22200226da4f1af30645cf441a639db6893e9310`.
- Source blobs:
  - `proofs/d1-ledger/src/projection-outbox.mjs`: `1546c2e4172e3767ed8bd5642c7b9c6d95716d11`
  - migration 0007: `767d95a30fa0a14c79e88c8c58392bfec9cdddc2`
  - migration 0008: `1d9385dd371f3404c52ec15fce03b0a14d384ab1`
- Exact-head run `42981807825`: COMPLETED / SUCCESS; recorded 53 Workers-runtime tests.
- Retry budget is capped at five with monotonic attempt counter and terminal dead-letter trigger. Expired fifth lease can be dead-lettered only by the matching original worker and generation; this is not an independent orphan reaper.
- All outcomes remain `dispatch:false`.

### PR #39 / #54
- PR #39 immutable child head `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`; local proof CI run `42329993548` SUCCESS, 19 tests.
- PR #54 head recorded in current Issue #64 as `ec3f3266ca28c4fb5633a9475cc6f396a4677974`; current PR #64 documentation reports run `43010770730` SUCCESS. Its 50-way result remains local Workers/D1 proof, not hosted contention.
- Both remain unmerged proof work; do not treat historical exact-head results as CI for a later aggregate tree.

### PR #57 — read-only GitHub Actions run-attempt evidence verifier
- PR body reports 23/23 fixture tests and contract validation success. Its scope is read-only transport/verifier composition. Terminal evidence describes executor lifecycle only; side effects remain UNKNOWN, retry=false and dispatch=false.
- It cannot prove that a task's external side effects did or did not occur. It is not a Recovery Actor or a task retry authority. Current exact head could not be refreshed through the available PR metadata action in this pass; exact current-head CI is NOT VERIFIED here.

## 2. Material integration conflict found

The PR #56 test suite still imports both:
- `src/task-lease.mjs` — legacy task-level lease API (`acquireTaskLease`, `renewTaskLease`, `finalizeTaskLease`);
- `src/task-attempts.mjs` — attempt-aware lease/finalization API.

The legacy module mutates `pool_tasks.state`, `lease_owner`, `lease_expires_at`, `lease_generation` and `attempt_count` without binding the lease to `current_attempt_id` / `lease_attempt_id`. The attempt-aware module requires a pending task, prepared current attempt and sets `lease_attempt_id` to the current attempt. Migration 0004's triggers bind attempt lifecycle to the latter contract.

Consequences:
- A legacy lease acquisition can move a task out of `pending` without acquiring an attempt-bound lease, making the attempt-aware lease API deny acquisition.
- Legacy renew/finalize paths can mutate the shared task row without the attempt-aware immutable identity/fencing contract.
- Both APIs share the same task and generation fields; test coexistence is not proof of safe production coexistence.
- Migration 0004 protects some attempt-bound invariants but does not make the legacy API an authorized alternate entry point.

**Decision:** keep `task-attempts.mjs` as the candidate canonical lifecycle and quarantine/remove the legacy task lease API from any integrated composition root. Do not delete historical proof code until migration and test provenance is preserved. Add explicit cross-API negative tests demonstrating that legacy entry points cannot mutate tasks once an attempt exists, or remove those entry points from the integrated package and test that they are unreachable.

## 3. Recovery and projection authority remain separate

- Attempt reconciliation queue is a durable work marker, not permission to retry.
- PR #57's run-attempt evidence is read-only executor lifecycle evidence; it does not resolve unknown external side effects.
- PR #59's delivery lease is a separate bounded projection lifecycle; its same-worker expired-lease dead-letter operation does not authorize an independent Recovery Actor.
- PR #60's Projection Recovery Actor contract remains a separate proposal and does not grant operational issuer, trust custodian, time authority, audit sink or quorum.
- Do not conflate task execution retry, terminal GitHub projection delivery, and recovery of orphaned external side effects.

## 4. Mature-component reuse review

No new library or service is justified for this bounded integration seam. Existing D1/SQLite conditional-update and trigger proof already demonstrates the relevant local persistence primitives. Reuse the selected SOPS + age and Cosign roles only where their existing configuration/provenance boundaries apply. GitHub Actions run-attempt verifier remains read-only. Cloudflare Workflows is orchestration, not claim authority. No new dependencies, vault, audit database or provider route selected.

## 5. Next bounded engineering step

Create a fresh implementation branch from the then-current immutable default only after refreshing exact PR refs. Reconstruct a minimal integration branch from verified source commits, not the 106-commit divergent PR #64 stack:
1. include the atomic approval/task claim/outbox contract only as the immutable intake boundary;
2. include one canonical attempt-aware lease lifecycle;
3. exclude legacy task lease mutation from the integrated entry point;
4. preserve the indeterminate reconciliation queue without adding retry authority;
5. keep projection delivery outbox and its retry budget in a separate bounded module;
6. add cross-API denial, stale-generation, replay, expired-lease, indeterminate, orphaned-projection and rollback tests;
7. run local Workers-runtime tests and exact-head CI, with all adapter outputs `dispatch:false`.

No hosted D1 provisioning until Free entitlement/quota, current Ruleset, service issuer/authentication, isolation, resource authorization and remote concurrent HTTP test design are all verified.

## 6. Status

- Source audit: SUCCEEDED.
- Attempt/lease integration: BLOCKED pending branch reconstruction and cross-API tests.
- PR #56 local CI: SUCCESS on recorded exact head; NOT production-qualified.
- PR #59 local CI: SUCCESS on recorded exact head; NOT production-qualified.
- PR #57 current exact head: NOT VERIFIED in this pass.
- Hosted D1: NOT AUTHORIZED / NOT RUN.
- Dispatch: FAIL-CLOSED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
- No secrets, live tokens, dispatch, resources, schema/runtime/permission changes, deployment or merge occurred.

## Canonical links

- PR #56: https://github.com/VlDMlNSh/developer-cloud-pool/pull/56
- PR #57: https://github.com/VlDMlNSh/developer-cloud-pool/pull/57
- PR #59: https://github.com/VlDMlNSh/developer-cloud-pool/pull/59
- PR #39: https://github.com/VlDMlNSh/developer-cloud-pool/pull/39
- PR #54: https://github.com/VlDMlNSh/developer-cloud-pool/pull/54
- Issue #38: https://github.com/VlDMlNSh/developer-cloud-pool/issues/38
- Context Window: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/issue38-free-claim-backend-fit-2026-11-11/docs/context/GITHUB-CONTEXT-WINDOW.md
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
