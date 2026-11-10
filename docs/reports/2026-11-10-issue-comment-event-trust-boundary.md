# PR #55 — Native issue_comment Event Trust Boundary

Date: 2026-11-10
Status: VERIFIED DESIGN CONSTRAINT / INTEGRATION BLOCKED

## Immutable target and current state

- PR #55: https://github.com/VlDMlNSh/developer-cloud-pool/pull/55
- PR head: `edff010388897f23f58bceb92e5180a09970fdff`
- PR branch: `proof/github-approval-event-adapter-2026-11-10`
- Base branch: `Основной`
- PR remains OPEN / DRAFT / UNMERGED.
- Exact-head fixture run `42797001989` and Pool Contract Validation run `42797001864` are COMPLETED / SUCCESS.
- Formal reviews: 0; inline review threads: 0.

## Verified GitHub Actions event semantics

GitHub's official event documentation states that an `issue_comment` workflow:
1. Uses the last commit on the repository default branch for `GITHUB_SHA` and the default branch for `GITHUB_REF`.
2. Triggers only if the workflow file exists on the default branch.
3. Covers both issue and pull-request comments; workflow logic must explicitly reject PR-originated comments when only issues are intended.

Source: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows (section `issue_comment`).

## Consequences for this PR

- Adding an `issue_comment` trigger only to PR #55 cannot make that workflow run for comments while the workflow remains unmerged; the event requires the workflow file on the default branch.
- The current PR-only fixture workflow cannot prove native `issue_comment` ingestion.
- A default-branch `issue_comment` workflow executes default-branch workflow code. It must not checkout or execute unreviewed PR-head code in a privileged event context.
- Therefore, do not solve this by adding `pull_request_target` or by checking out PR head SHA from an `issue_comment`/privileged workflow. Keep PR-head tests on the unprivileged `pull_request` event. A future trusted default-branch event handler must execute only reviewed default-branch code and independently validate the event payload, exact issue/repository/actor, immutable target SHA, policy provenance and replay/expiry semantics.
- The current PR verifier is not eligible to become that default-branch handler until reviewed and merged through the repository's normal governance gates.

## Source inspection

At PR head `edff010388897f23f58bceb92e5180a09970fdff`, `readRunnerEvent()` checks `GITHUB_EVENT_NAME === "issue_comment"`, requires an absolute `GITHUB_EVENT_PATH`, and reads the JSON payload. It is not invoked by the current fixture workflow. The verifier is read-only and every result has `dispatch:false`.

## Disposition

- Native event behavior: VERIFIED from official GitHub documentation.
- Current PR workflow native-event coverage: NOT IMPLEMENTED.
- Real Octokit transport: NOT VERIFIED / NOT RUN.
- Replay persistence, trusted expiry/clock, revocation and protected policy provenance: NOT IMPLEMENTED / NOT QUALIFIED.
- No source, workflow, secret, variable, permission, D1, dispatch, provider or deployment changes made.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

## Next bounded step

Keep the PR branch's CI limited to synthetic, read-only transport fixtures. Separately specify and threat-model the default-branch-only native `issue_comment` handler, without implementing privileged execution or dispatch. Do not merge until the PR receives required independent review and all security/governance gates are satisfied.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
