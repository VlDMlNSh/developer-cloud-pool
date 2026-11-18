# PR #129 independent source and ancestry audit — 2026-11-18

## Immutable target

- PR #129 branch: `fix/admission-registry-max-epoch-guard-2026-11-18`.
- Target HEAD: `70265bbb21a8419312bc0cfe684d32184cffc497`.
- PR #129 base / PR #86 HEAD: `a218f92274eca5491700d8f72a21172f8ce689dc`.
- PR #86 base / PR #84 HEAD: `390ef0a09af2585c79f7e15d789343eb23fa370f`.
- Compare PR #84 HEAD..PR #129 HEAD: ahead 9, behind 0; 9 commits. This confirms the child contains the complete PR #86 stack plus its child change.

## Source review

Read back the exact PR #129 migration, adapter and test files.

- Migration `0014_atomic_admission_registry_assertion.sql` adds `s.current_epoch = (SELECT MAX(registry_epoch) FROM pool_route_registry_snapshots)` to the BEFORE INSERT trust assertion guard.
- `admit-qualified-task.mjs` adds the same max-persisted-epoch predicate to exact-replay active-trust lookup.
- Tests cover a newer persisted snapshot with a stale active pointer for both first admission and exact replay. The first-admission case verifies approval remains ready and no task, outbox, admission, attempt, receipt or assertion rows survive the rejected batch.
- The corrected test fixture matches the implementation's transaction boundary: task/outbox rows are created by the admission batch, so both are expected absent after rollback.
- The reviewed SQL predicate is consistent with the existing active-pointer/snapshot join. No source defect was established in this bounded review. This is an engineering source audit, not an independent formal approval.

## Exact-head CI

- Run [44298085395](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44298085395): COMPLETED / SUCCESS.
- Job `134780267666`: all listed steps completed successfully, including syntax check, Workers-runtime D1 tests, second local D1 binding/migration smoke, frozen schema-0010 fixture and lockfile artifact preservation.
- Workers-runtime suite: 11/11 files, 120/120 tests PASS.
- Frozen schema-0010 fixture: 2/2 PASS.
- Artifact [14424053695](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44298085395/artifacts/14424053695), 18,253 bytes, digest `sha256:0473cc1032079c90d4cc3332d58bc3898ad5245b785585e880a2b0eb813a5377`; expires 2026-11-25.
- Workflow checked out merge commit `332dfac1a03c404cc9710868ba489388548f33af` for PR #129 plus PR #86. CI success is exact to the PR's tested merge context, not a production deployment.

## Ancestry and governance

- PR #129 is stacked on PR #86; PR #86 is stacked on PR #84. PR #84 is based on PR #81's verifier-issued capability persistence work. Preserve this order.
- PR #128 is a separate sibling chain on PR #77 (compare #77 base `e63f1dda4c046d485ae9c2f08392a1943a06553d` to #128 HEAD `c17a6026323e5ba1be7a2ae3345f387df6d12f25`: 8 ahead / 0 behind). It is not a parent of PR #86/#129 and must not be folded into that stack without a deliberate ancestry/schema reconciliation.
- PR #129 is OPEN / DRAFT; formal reviews: 0; inline review threads: 0. PR #86 formal reviews: 0. No merge performed.
- Default branch `Основной` remains at `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Active ruleset previously identified as `26550182` (`Основной — verified`); no ruleset mutation or merge was attempted in this pass.
- Gemini controller workflow path on default branch returned 404; Gemini dispatch NOT RUN. No secret values inspected, no hosted D1, provider calls, deployment or production dispatch.

## Limits and next action

This review verifies the local D1 proof and stack topology only. It does not qualify hosted D1, production root-key custody, provider account/quota identity, secure provider routing, durable worker execution, remote Web UI, persistent workspace/recovery or independent acceptance.

Next bounded engineering pass: model and test the revocation-vs-admission race plus durable single-use task claim/fencing against the exact integrated parent chain. Before implementation, re-fetch refs and determine whether the separate PR #128 registry-bootstrap correction must be integrated first. Keep PR #129 draft/unmerged until independent review and ordered stack integration.

Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.
