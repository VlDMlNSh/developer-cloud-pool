# PR #39 stack graph versus content and combined-tree CI correction — 2026-11-08

## Purpose
Correct the interpretation in the earlier branch-provenance report. The graph comparison is still accurate, but graph divergence alone was incorrectly treated as a requirement to synchronize/rebase the child branch before integration.

## Verified facts
- PR #36 parent branch: `proof/d1-single-use-ledger-retry-2026-11-06` @ `e11fc90e50bd20b166207af64551c49cfa80ffb4`.
- PR #39 child branch: `proof/d1-claim-outbox-atomic-2026-11-07` @ `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`.
- Graph comparison parent HEAD → child HEAD remains DIVERGED, 17 ahead / 1 behind, merge base `9ef7e4aadd6c723fa86b21ea44383f8020643a0c`.
- The parent-only commit `e11fc90...` modifies `.github/workflows/d1-ledger-proof-validation.yml`.
- The workflow file at both current branch heads has the exact same blob SHA: `cb31bda7588137baf84a8141aec11024461cf818`. Thus the content change is already present in the child tree (equivalent content), even though the commit graph does not contain the parent commit.
- PR #39 records combined merge-tree SHA `77b3ce30a3c90ad564db892cae82076b5c0774c9`, with parent `e11fc90...` and child `ecc7193...`.
- Exact PR run `42329993548`, job `128274072508`: all steps SUCCESS, including checkout PR merge commit, dependency install, syntax check, Workers-runtime D1 tests and lockfile artifact preservation.
- Exact push run `42329991471`, job `128274065481`: all steps SUCCESS for the branch push validation.
- PR #36/#37/#39 each remain OPEN/DRAFT/UNMERGED with 0 formal reviews and 0 inline review threads.

## Corrected interpretation
The graph remains one commit behind, but the workflow content is byte-identical at both branch heads, and PR #39 has a successful CI run that checks out the combined PR merge commit. Therefore:
- Do NOT rebase or merge the child solely to eliminate the 17-ahead/1-behind graph shape.
- Treat stack graph divergence as a metadata/ancestry condition, not a demonstrated file-content conflict.
- Before any future parent/child source change or retargeting, re-check the generated PR merge tree and rerun exact-head combined-tree CI.
- This correction does not authorize merging. Independent security review, governance approval, remote D1 qualification, issuer/clock trust, lease/fencing, dispatcher/recovery and integration remain open.

## Status
- Branch graph: VERIFIED (diverged 17/1).
- D1 validation workflow content equality: VERIFIED (same blob SHA).
- Combined-tree PR #39 CI: VERIFIED for recorded merge tree and run.
- Independent security review: NOT RUN.
- PR review submissions / inline threads: 0 / 0 each.
- Contour A: BLOCKED / NOT ACCEPTED; Contour B: DEFERRED.
- No code, workflow, branch, settings, secret, variable, resource, deployment or dispatch changes were made.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
