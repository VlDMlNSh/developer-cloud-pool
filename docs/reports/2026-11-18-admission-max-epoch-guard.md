# Admission maximum registry epoch guard — 2026-11-18

## Scope and immutable target

- Parent PR #86 target HEAD: `a218f92274eca5491700d8f72a21172f8ce689dc`.
- Child branch: `fix/admission-registry-max-epoch-guard-2026-11-18`.
- PR #129: https://github.com/VlDMlNSh/developer-cloud-pool/pull/129
- Final child HEAD: `70265bbb21a8419312bc0cfe684d32184cffc497`.
- PR #129 base SHA: `a218f92274eca5491700d8f72a21172f8ce689dc`.

## Finding and implementation

PR #86 migration 0014's admission assertion trigger previously required the route epoch to match the singleton active pointer and its snapshot, but did not independently require that pointer to reference the maximum persisted registry epoch. Exact replay similarly checked the active snapshot without checking whether a newer snapshot had been appended.

Changes in PR #129:

1. Added `s.current_epoch = (SELECT MAX(registry_epoch) FROM pool_route_registry_snapshots)` to the admission assertion trigger.
2. Added the same invariant to exact-replay active trust lookup.
3. Added a test that appends a newer snapshot without advancing the active pointer and proves new admission fails closed. It checks the approval remains ready and no task, delivery outbox, admission, attempt, commit receipt or registry assertion is written.
4. Added a test that commits a valid admission, appends a newer snapshot without advancing the active pointer, and proves exact replay is denied rather than returning the old receipt.

The new test initially assumed task/outbox rows existed before admission. Exact-head CI exposed that fixture error; task and outbox are created inside the admission transaction. The test was corrected to assert both rows remain absent after rollback.

## Verification

- Corrected exact-head CI: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44298085395
- Run ID: `44298085395`, workflow `Isolated D1 Ledger Proof`, COMPLETED / SUCCESS.
- Job: `134780267666`, all steps successful.
- `npm run check`: PASS.
- Workers-runtime D1 suite: 11/11 files, 120/120 tests PASS.
- Isolated second D1 binding/migration smoke: PASS (1 passed; filtered run skips non-target tests).
- Frozen schema-0010 fixture: 2/2 tests PASS.
- Artifact: `14424053695`, 18,253 bytes, SHA-256 `0473cc1032079c90d4cc3332d58bc3898ad5245b785585e880a2b0eb813a5377`, expires 2026-11-25.
- CI checked out merge commit `332dfac1a03c404cc9710868ba489388548f33af`, combining PR #129 with parent PR #86.

## Governance and limitations

- PR #129 OPEN / DRAFT; no independent formal reviews yet.
- PR #86 OPEN / DRAFT; PR #128 OPEN / DRAFT; no merge performed.
- Default branch `Основной`: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Active repository ruleset: `26550182` (`Основной — verified`). Branch API reports `protected=false`; governance enforcement is via the active ruleset.
- No hosted D1, production root key configuration, provider/model calls, secret reads, deployment or dispatch. Dispatch remains false.
- Local D1 tests qualify this invariant within the proof harness only. They do not qualify production D1, root-key custody, provider routing or remote UI.

## Next

Obtain independent review of PR #129 and audit the complete ancestry/integration order across PRs #84, #86, #128 and #77 before any merge. Then continue with revocation/admission race and durable single-use task claim qualification.

Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.
