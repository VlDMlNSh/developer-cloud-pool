# Clean implementation branch and projection proof lineage audit — 2026-11-11

## Status

VERIFIED branch creation and lineage audit. No source implementation or tests were performed in this pass. This report is author-side evidence, not independent review or qualification.

## Immutable target

- Default branch: `Основной`
- Default HEAD: `221f216c00ca7e5596bcc682ba185ad155a10603`
- New implementation branch: `impl/receipt-bound-projection-2026-11-11`
- New branch HEAD: `221f216c00ca7e5596bcc682ba185ad155a10603`
- Compare `Основной...impl/receipt-bound-projection-2026-11-11`: identical, ahead 0 / behind 0.

## Corrected PR lineage

Current PR metadata:
- PR #58 OPEN/DRAFT/UNMERGED; head `5caeb60f7a45d836c6ad1eea2fb86e20995da025`; base `test/50-approval-logical-task-contention-2026-11-09` at `ec3f3266ca28c4fb5633a9475cc6f396a4677974`.
- PR #59 OPEN/DRAFT/UNMERGED; head `22200226da4f1af30645cf441a639db6893e9310`; base `proof/fake-github-projection-reconciler-2026-11-11` at `6f7953e4abec3cc564984ee3635cdb7717ae5d5e`.
- PR #66 OPEN/DRAFT/UNMERGED; docs branch head `4357feb3771aad3f0d18ff0f1f992e7c592b7a99`, base default `221f216c00ca7e5596bcc682ba185ad155a10603`.

Exact ancestry comparisons:
- PR #58 base `ec3f326...` → head `5caeb60...`: status ahead, 12 commits, 0 behind; exactly 7 changed paths:
  1. `.github/workflows/d1-ledger-proof-validation.yml`
  2. `docs/contracts/ATTEMPT-OUTBOX-GITHUB-PROJECTION-INTEGRATION-CONTRACT.md`
  3. `proofs/d1-ledger/package.json`
  4. `proofs/d1-ledger/src/projection-envelope.mjs`
  5. `proofs/d1-ledger/src/projection-reconciler.mjs`
  6. `proofs/d1-ledger/test/projection-envelope.test.ts`
  7. `proofs/d1-ledger/test/projection-reconciler.test.ts`
- PR #59 base `6f7953e...` → head `2220022...`: status ahead, 10 commits, 0 behind; exactly 5 changed paths:
  1. `.github/workflows/d1-ledger-proof-validation.yml`
  2. `proofs/d1-ledger/migrations/0007_bound_projection_delivery_retries.sql`
  3. `proofs/d1-ledger/migrations/0008_enforce_projection_attempt_monotonicity.sql`
  4. `proofs/d1-ledger/src/projection-outbox.mjs`
  5. `proofs/d1-ledger/test/claim-outbox.test.ts`
- PR #58 head `5caeb60...` → PR #59 base `6f7953e...`: status behind, 0 ahead / 4 behind. Therefore PR #59 base is a descendant of PR #58 head by four commits. The earlier statement that the PR bases are unrelated/divergent is superseded and incorrect.
- The baseline branch `test/50-approval-logical-task-contention-2026-11-09` compared with default is diverged: 132 ahead / 62 behind. It introduces the D1 ledger proof harness (23 paths) that does not exist on default. The projection branch compared directly with default is 141 ahead / 62 behind because it carries that older proof history. Do not merge/cherry-pick the whole branch history.
- The PR #58/#59 patch sets themselves are bounded as listed above; their required baseline harness must be selectively reconstructed from exact baseline commit `ec3f326...` onto the clean implementation branch.

## Implementation blocker still confirmed

The #59 version of `acknowledgeProjectionDelivered(db, outboxId, workerId, generation, now)` accepts no receipt and transitions to `delivered` solely from a live lease tuple. #58's reconciler returns event/digest verification but is not bound to delivery lease generation. The new implementation must not copy this receipt-free ACK unchanged.

## Safe next reconstruction plan

1. Keep the new implementation branch based on default SHA `221f216...`.
2. Selectively reconstruct only the 23-path D1 proof harness baseline from exact commit `ec3f326...` (not its 132-commit history).
3. Apply the exact seven-file #58 patch and five-file #59 patch, preserving migration order 0006 → 0007 → 0008 and package check union.
4. Replace the exported receipt-free ACK with one orchestration boundary that owns lease acquisition/read-back, reconciliation, and conditional ACK bound to outbox ID, event digest, lease owner, delivery generation, expected status and trusted time.
5. Add negative-first tests; run the repository workflow on the exact implementation head. Any empty status or workflow result is NOT VERIFIED.
6. Do not enable hosted D1, live GitHub credentials, dispatch, provider calls or deployment in the proof reconstruction pass.

## Evidence limitations

- The two existing PR workflow runs were previously observed successful on their respective source heads; they do not qualify a new clean branch or prove hosted D1/live GitHub behavior.
- Exact combined-status queries for those PR heads returned zero contexts. No formal reviews/review threads were present at last revalidation.
- This pass created only the clean branch; no code changes, tests, CI, hosted actions or independent reviews were performed.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
