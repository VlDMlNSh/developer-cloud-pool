# Pass 38 — exact-head CI regression and canonical reconciliation replay correction

Date: 2026-11-22
Status: FIX APPLIED; VALIDATION RUNNING; NOT ACCEPTED

## Immutable target and baseline

- Prior implementation target: `fb6c703808f8740f3d3631db3b265e59da8102b7`.
- PR: [#165](https://github.com/VlDMlNSh/developer-cloud-pool/pull/165), OPEN / DRAFT / UNMERGED.
- Implementation branch: `feat/pass36-issuer-bound-attempt-reconciliation-2026-11-21`.
- Frozen PR base: `feat/pass35-authenticated-d1-lease-adapter-2026-11-20`.
- Default branch: `Основной`.

## Initial CI evidence

The GitHub Actions runs returned for the target were:

- [Isolated D1 Ledger Proof #45032152385](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45032152385): FAILURE.
- [Pool Contract Validation #45032152373](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45032152373): SUCCESS.

The D1 job checked out PR #166's merge ref, merge commit `1817d86db7f003bf8e42037bada900db525d81ec`, explicitly showing the tested head commit `fb6c703808f8740f3d3631db3b265e59da8102b7` merged into frozen base `7e76bd2ebba5e3a27ccd32ecf7f52c2d10178250`. This is merge-result validation, not a standalone checkout of the head SHA.

D1 test totals: 60 passed, 1 failed, 61 total. The new non-canonical-ID negative test passed. The failing replay/conflict test used a different non-canonical reconciliation ID and expected a later conflict outcome; the implementation correctly rejected it earlier as `INVALID_RECONCILIATION_REQUEST`.

## Bounded correction

Updated only `proofs/d1-ledger/test/reconciliation.test.ts`:

- Kept the reconciliation ID canonical for the attempt.
- Replayed the same evidence and retained the idempotent replay assertion.
- Changed the conflict case to use the same canonical ID with a different evidence JTI.
- Asserted fail-closed `RECONCILIATION_OUTCOME_UNCONFIRMED`, with dispatch and execution authorization false.

No production implementation, migration, secrets, dispatch gates, or runtime authority were changed.

## Published correction

- Commit: `80dcd602a86ab6df58fb144ecdffaa6266cb9cf0`
- Message: `test(d1): preserve canonical reconciliation identity in conflict case`
- Test blob: `b6cb31bd7e33e5934c005b3268b44de8792e5597`
- Branch: `feat/pass36-issuer-bound-attempt-reconciliation-2026-11-21`
- PR #165 head now points to the correction commit; still OPEN / DRAFT / UNMERGED.
- Re-read the file from GitHub and confirmed the canonical replay/conflict test content.

## Revalidation

New commit-associated workflow runs were observed:

- D1 run `45032534259`, run number 594: IN_PROGRESS at last observation.
- Pool Contract run `45032534262`, run number 835: IN_PROGRESS at last observation.

Exact-head CI for the corrected commit is therefore NOT VERIFIED yet. The initial contract validation success does not substitute for the corrected commit's run.

## Governance and acceptance boundary

- No merge or deployment.
- No live provider calls or executor dispatch.
- No secret values accessed.
- No Gemini controller dispatch; this pass did not require agent execution.
- No independent security review or formal PR approval observed.
- Contour A remains BLOCKED / NOT ACCEPTED; Contour B remains DEFERRED.

## Next step

Poll both workflow runs for commit `80dcd602a86ab6df58fb144ecdffaa6266cb9cf0`, inspect D1 logs and contract results, then request/perform independent review of PR #165. Do not merge on CI alone.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
