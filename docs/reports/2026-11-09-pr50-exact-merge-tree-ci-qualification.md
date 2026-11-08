# 2026-11-09 — PR #50 exact merge-tree CI activation and qualification

Date: 2026-11-09 (Europe/Vilnius)

## Scope and immutable target

Bounded CI wiring and validation pass for the D1 attempt-finalization child PR.

- Parent proof PR #49 head before workflow correction: `4ab0fdc4d649736a171faf95b9ab3a24b17217e8`.
- PR #50 original code head: `6e6870e5463f3f67e87a305112b208401d95022d`.
- PR #50 updated exact head after CI wiring correction: `65233f57038a9996e4a6e939abde3642a33d467d`.
- PR #50 remains based on PR #49 branch `proof/immutable-task-attempts-audit-ci-2026-11-08`; current PR is OPEN / DRAFT / UNMERGED / mergeable.

## Root cause found

The existing `.github/workflows/d1-ledger-proof-validation.yml` had a `pull_request.branches` filter that listed #36/#39/#40 target branches but omitted the actual base branch of PR #50: `proof/immutable-task-attempts-audit-ci-2026-11-08`.

GitHub's `pull_request.branches` filter matches the PR's **base/target branch**, not its head/source branch. Therefore #50's earlier green push workflow did not establish PR merge-tree validation; the PR event was not being selected by the workflow filter.

## Bounded correction

Updated the same workflow file on both the #49 base branch and #50 head branch to include the #49 base branch in `pull_request.branches`.

- #49 base-branch workflow commit: `b9067dc7d06245893cd4e208f6215438efe5ca64`; workflow blob `78caf3b5333fef475c7f90f6a4f163eb52b38e17`.
- #50 head workflow commit: `65233f57038a9996e4a6e939abde3642a33d467d`; workflow blob `8891e212f3779e5f36222e0066ed21ba2eea5e49`.
- Permissions remain `contents: read`; actions remain pinned; checkout persists no credentials; no secret or provider access was added.

## Exact-head evidence

- PR #49 workflow run `42533086378`: `pull_request`, COMPLETED / SUCCESS, exact head `b9067dc7d06245893cd4e208f6215438efe5ca64`.
- PR #50 workflow run `42533097813`: `pull_request`, COMPLETED / SUCCESS, exact head `65233f57038a9996e4a6e939abde3642a33d467d`.
- PR #50 push run `42533091887`: COMPLETED / SUCCESS, same exact head `65233f57038a9996e4a6e939abde3642a33d467d`.
- PR #50 mergeability snapshot: `mergeable=true`; no merge was performed.
- PR #50 PR-triggered job completed successfully: dependency install, proof adapter syntax check, Workers-runtime D1 adversarial tests, lockfile artifact upload, and cleanup all SUCCESS.

This establishes a PR-triggered CI run for the current #50 head and its GitHub-generated merge commit context. It remains a local Workers-runtime/Miniflare test, not a remote D1 account/database qualification.

## Boundaries and remaining gaps

- PR #51 remains a sibling child of #49 and still needs its own PR-triggered exact-head validation. Do not infer its status from #50.
- #49 → #50 is a compatible stacked lineage, but PR #50 is not merged.
- No remote D1 provisioning, account entitlement check, real hosted contention test, or production deployment occurred.
- No dispatch, Worker/DSH execution, provider/model call, or secret read occurred.
- Independent security review remains NOT RUN / NOT VERIFIED; formal approvals remain absent.
- F2 GitHub Issue label fencing remains PARTIALLY IMPLEMENTED because label PATCH is not compare-and-swap.
- Cloud Pool runtime NOT RUN; Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

## Next bounded step

Apply the same narrowly scoped base-branch trigger correction for sibling PR #51, then require its PR-triggered exact-head CI success. Keep PR #52's Jarvis/Hono product branch outside Contour A. After both child PRs have their own PR-triggered CI, perform a separate composition and security review; do not merge automatically.

Canonical MediaHub map (separate project): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
