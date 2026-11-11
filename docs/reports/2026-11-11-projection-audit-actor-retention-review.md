# Projection audit actor retention fix review — 2026-11-11

## Immutable target
- Branch: `fix/projection-audit-actor-2026-11-11`
- HEAD: `b9731547afaefde2d22e704122e73615ce85876c`
- Parent of implementation commit: `ec3f3266ca28c4fb5633a9475cc6f396a4677974`
- Implementation commit: `8776e967688dc891c86f6d3ba50b97e8dc897c83`
- Regression test commit: `46a2ed2777a7fc2b15bd0898c9ceb9a04f5607d9`
- CI wiring commit: `b9731547afaefde2d22e704122e73615ce85876c`
- Branch has no associated PR at audit time. It diverges from current PR #58 HEAD: 3 commits ahead, 12 behind; merge base `ec3f3266ca28c4fb5633a9475cc6f396a467797`.

## Change reviewed
Migration 0006 status-event trigger now records `OLD.lease_owner` when leaving `leased`, rather than `NEW.lease_owner` (which is cleared on terminal/retryable transition). Test asserts terminal delivered event actor is the worker that held the lease, and retryable event retains the previous lease actor/generation.

This is a narrow audit-provenance correction. It does not alter delivery state machine, retry budget, lease fencing, or GitHub projection behavior.

## Exact-head evidence
Push run [43010555851](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43010555851), HEAD `b9731547afaefde2d22e704122e73615ce85876c`: COMPLETED/SUCCESS.
Job [130488783673](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43010555851): syntax check passed; 2 test files / 40 tests passed; lockfile artifact uploaded, SHA-256 `64e3ea398b90155a2e7b914ceb143e706cdc670ad154500705fcd1cf5860ff83`.
This is local Workers-runtime D1 proof on the branch's older base, not current PR #58/#59 integrated validation. No PR-associated run or independent review exists.

## Review notes / limits
- The CASE expression preserves lease owner for `leased → delivered/retryable/dead_letter`. For transitions not originating in `leased`, actor remains `NEW.lease_owner` (normally NULL); system/reaper actor provenance is not defined by this patch.
- It records the previous lease holder, not necessarily the actor who initiated a terminal state transition. This is appropriate only if event actor semantics mean "lease owner whose delivery lease is being closed"; contract should state that explicitly.
- Branch workflow adds itself to push filters. It is not rebased/stacked on current PR #58 and is not a pull request.
- No independent review, combined CI, hosted D1 qualification, trusted issuer/time, or production actor authentication.

## Disposition
Useful, narrow fix candidate; NOT INTEGRATED. Do not merge or cherry-pick into current projection stack until event actor semantics are clarified and a fresh integration candidate is tested against current #58 mapper/reconciler and #59 retry/dead-letter migrations.

## Status
- Static patch review: VERIFIED (scope and behavior as described).
- Exact-head branch CI: SUCCESS (40/40 local D1 tests).
- Current-stack compatibility: NOT VERIFIED.
- Independent review: NOT RUN.
- Hosted qualification / deployment: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

Next: amend integration plan to include this actor-retention patch as a candidate; require explicit contract wording for event actor semantics, then combine on a fresh branch from immutable current PR #58 HEAD and run all tests.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
