# D1 finalization replay clock-independence fix — 2026-11-09

## Scope and immutable targets
Corrected the replay timestamp coupling identified in D1-FINALIZE-REPLAY-01. Changes were made only to existing local proof branches:
- PR #51 branch `feat/indeterminate-reconciliation-queue-2026-11-08`, final head `201ccb1282e4e1cd246d6587322ca9379bc166ca`.
- PR #54 branch `test/50-approval-logical-task-contention-2026-11-09`, final head `e1b7a526badf2dbfdbe013889a070affe238f653`.
No default branch changes, merge, dispatch, remote D1, secrets, provider/model calls, permissions, or deployment.

## Change
File `proofs/d1-ledger/src/task-attempts.mjs`:
- Exact terminal replay no longer requires `prior.completed_at === now`.
- It still requires matching status, result digest, provenance digest, terminal reason, lease generation, audit actor, audit generation and event digest.
- Stored `completed_at` must be a positive safe integer.
- Exact replay returns the original `completedAt: prior.completed_at`; it does not rewrite the terminal record or event.

File `proofs/d1-ledger/test/claim-outbox.test.ts`:
- Initial finalization remains at `NOW + 3`.
- Exact replay now occurs at `NOW + 30`.
- Test asserts the replay returns original `completedAt: NOW + 3`.
- Existing conflicting-result replay remains denied and terminal event count remains one.

This simulates the key lost-response shape at API level: the first call commits the terminal state; a later call with a fresh clock reading must recover the same logical result.

## Exact-head CI
PR #51:
- Head `201ccb1282e4e1cd246d6587322ca9379bc166ca`.
- Run `42536163699`, job `128900822479`, COMPLETED / SUCCESS.
- Checkout, pinned Node, dependency install, syntax check, Workers-runtime D1 tests and artifact upload all succeeded.

PR #54:
- Head `e1b7a526badf2dbfdbe013889a070affe238f653`.
- Run `42536179023`, job `128900870199`.
- Checkout, pinned Node, dependency install, syntax check, Workers-runtime D1 tests and artifact upload steps reported SUCCESS; at final poll the job/run remained IN_PROGRESS in post-action cleanup. Therefore overall run is NOT VERIFIED / NOT yet COMPLETED. Do not claim CI success for PR #54 until run conclusion is terminal.

## Readback
Both changed files were fetched again at PR #51 exact head:
- source blob `6cb028e048569700ed623d93462ef55e2392a084`: old equality condition absent; stored timestamp return present.
- test blob `86f26ed10027cb5df3f96065d612ba4b41c2c123`: fresh-time replay at NOW+30 and original timestamp assertion present.
PR #54 branch was updated with the same patch to preserve its cumulative proof; CI is still running as above.

## Disposition
- D1-FINALIZE-REPLAY-01: implementation corrected and regression test passed on PR #51 exact head.
- PR #51 remains OPEN / DRAFT / UNMERGED; no independent review recorded here.
- PR #54 remains OPEN / DRAFT / UNMERGED; exact-head CI overall NOT VERIFIED while cleanup is in progress.
- Local Workers-runtime D1 proof only; hosted D1 qualification, authority model, trusted clock, recovery, quotas, backups and real-backend contention remain NOT QUALIFIED.
- Issue #38 remains OPEN. Dispatch remains FAIL-CLOSED.
- PR #53 GitHub Issues label finalizer still has split-write audit and non-CAS risks.
- Contour A BLOCKED / NOT QUALIFIED / NOT ACCEPTED; Contour B DEFERRED.

## Evidence
- PR #51: https://github.com/VlDMlNSh/developer-cloud-pool/pull/51
- PR #54: https://github.com/VlDMlNSh/developer-cloud-pool/pull/54
- PR #51 exact-head CI: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42536163699
- PR #54 exact-head CI: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42536179023
- Source at PR #51 head: https://github.com/VlDMlNSh/developer-cloud-pool/blob/201ccb1282e4e1cd246d6587322ca9379bc166ca/proofs/d1-ledger/src/task-attempts.mjs
- Test at PR #51 head: https://github.com/VlDMlNSh/developer-cloud-pool/blob/201ccb1282e4e1cd246d6587322ca9379bc166ca/proofs/d1-ledger/test/claim-outbox.test.ts
- Issue #38: https://github.com/VlDMlNSh/developer-cloud-pool/issues/38
- PR #53: https://github.com/VlDMlNSh/developer-cloud-pool/pull/53
- Canonical MediaHub map (reference only): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
