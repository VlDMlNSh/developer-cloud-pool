# 2026-11-07 — D1 claim/outbox Workers-runtime CI qualification pass

**Pass time:** 2026-11-07 05:31 Europe/Vilnius  
**Target PR head:** `68e62e5f85da195b3ef2938622e1af00353e1bae`  
**Disposition:** exact PR merge-tree Workers-runtime tests SUCCEEDED (18/18); PR remains DRAFT / UNMERGED; independent security review NOT RUN.

## Repository and stacked PR state

- Repository: `VlDMlNSh/developer-cloud-pool`
- Default branch: `Основной`; last observed default HEAD `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- PR #36 parent branch: `proof/d1-single-use-ledger-retry-2026-11-06`, head `e11fc90e50bd20b166207af64551c49cfa80ffb4`.
- PR #39 child branch: `proof/d1-claim-outbox-atomic-2026-11-07`, head `68e62e5f85da195b3ef2938622e1af00353e1bae`, base PR #36 branch.
- PR #39 remains OPEN / DRAFT / UNMERGED; no independent reviews/threads were recorded in the prior refresh.
- Issue #38 remains OPEN.

## CI trigger repair

The isolated D1 workflow was present on PR #36's branch but its pull_request base filter named only `Основной`; PR #39 targets PR #36's branch. The workflow was updated on the parent and child proof branches to:
- run on pushes to the exact two isolated proof branches, restricted to D1 proof/workflow paths;
- accept pull_request base branches `Основной` and the PR #36 proof branch.

The workflow retains `contents: read`, pinned action SHAs, `npm ci --ignore-scripts`, syntax validation and Workers-runtime tests. No manual workflow dispatch was used.

Parent branch workflow update commit: `e11fc90e50bd20b166207af64551c49cfa80ffb4`, blob `cb31bda7588137baf84a8141aec11024461cf818`.

## Runtime failures found and corrected

First child validation run `42329448502`: FAILED, 15 failed / 3 passed.
- D1 trigger side effects mean the D1 result's `meta.changes` cannot safely be assumed to equal exactly 1. The claim adapter was changed to test for a positive change count, not exact equality.
- Shared test database cleanup in the original consume suite deleted approval parent rows before dependent claim/outbox rows, causing foreign-key failures. Cleanup now deletes outbox, claims, then approval rows.

Second child validation run `42329512608`: FAILED, 2 failed / 16 passed.
- Remaining failures were in the original consume adapter, which also assumed `meta.changes === 1` even after the trigger was installed. It now uses positive-change semantics.

These failures are retained as audit evidence; no failed run was erased or rerun under the same SHA.

## Final exact PR validation

- Workflow: Isolated D1 Ledger Proof
- Run: `42329557589` (run number 38)
- Job: `128272709580`
- Result: COMPLETED / SUCCESS
- Head SHA: `68e62e5f85da195b3ef2938622e1af00353e1bae`
- Actual tested PR merge tree: `63605b63cc1049716cb660a9d76f1ff85a17f902`, merging child head into parent head `e11fc90e50bd20b166207af64551c49cfa80ffb4`.
- Syntax check: SUCCESS.
- Workers-runtime suite: 2 test files, 18 tests PASSED.
- Artifact: `d1-ledger-proof-package-lock`, artifact ID `13556573871`, SHA-256 `c5d5436b4e26fa02b25ba2126a57770a86bd2e1097a43a2e17a7b37348914d50`, retained until 2026-11-14.
- Parent PR #36 D1 workflow run `42329438351`, job `128272331352`: COMPLETED / SUCCESS.

## Current source blobs at child head

- Workflow: `cb31bda7588137baf84a8141aec11024461cf818`
- Migration 0002: `44b8f7e0658296d287269770c5e91b1c3e25973c`
- Claim/outbox adapter: `6eb5fed315307cd644f9bdb15ad45a6ef7a88beb`
- Consume adapter: `f71e559a7c13b9a0242a7f619eba998c5906d95e`
- Claim/outbox tests: `4711bb7a5186807d6618d6dc59af10809caec6f3`
- Consume tests: `ef502247683239d50d3c781240cc5b2595aa0696`
- Package manifest: `398e49660a3dd082299eebc2facd027385e2fd6c`
- README: `faac8cacf27d58362c2acf16006acf8ab973e421`

## Qualification limits

This establishes a successful isolated Workers-runtime test result for the stacked PR merge tree only. It does NOT establish production D1 behavior, production identity/issuer trust, authenticated owner derivation, trusted server time, key rotation/revocation, lease generation/fencing, reclaim, stale acknowledgements, crash recovery, dead-letter behavior, Supervisor integration, or dispatch safety. Independent security review remains NOT RUN. No secrets, live D1 provisioning, deployment, Worker/Supervisor execution, dispatch, DSH, Resource Probe, provider/model calls or paid resources were used.

## Next bounded step

Obtain an independent security review of the trigger/adapter transaction boundary, result semantics, idempotent retry and shared-test isolation. Separately review the parent/child stacked PR diff and governance before any merge. Keep dispatch disabled; do not implement lease/fencing until the security review is complete.
