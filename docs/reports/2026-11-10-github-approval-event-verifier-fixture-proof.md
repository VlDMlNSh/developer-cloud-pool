# 2026-11-10 — Read-only GitHub approval-event verifier fixture proof

## Immutable target and live refs

- Implementation branch: `proof/github-approval-event-adapter-2026-11-10`.
- Base/default branch `Основной` SHA: `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- Final PR #55 head SHA: `edff010388897f23f58bceb92e5180a09970fdff`.
- PR #55: OPEN / DRAFT / UNMERGED, base remains current default SHA, mergeable reported true, merge state clean at final check.
- PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/55
- Exact-head runs for final head:
  - Fixture run `42797001989`, job `129764618860`: SUCCESS.
  - Existing pool contract validation run `42797001864`, job `129764618337`: SUCCESS.
- Fixture job log confirms 11 tests, 11 passed, 0 failed, 0 skipped.
- Both runs checked against exact head `edff010388897f23f58bceb92e5180a09970fdff`? Canonical final head is `edff010388897f23f58bceb92e5180a09970fdff`; retain the API-returned value `edff010388897f23f58bceb92e5180a09970fdff` as authoritative.
- No merge, production workflow change, dispatch, secret read, provider/model call, D1 connection or deployment.

## Reused components and dependency decision

- Reused GitHub-maintained Octokit REST method shape: `repos.get`, `issues.get`, `issues.getComment`; the adapter is injected with an Octokit-compatible client and does not implement HTTP, retries or pagination.
- Fixture tests use Node's built-in `node:test` and `node:assert/strict`; no package installation or lockfile mutation was necessary.
- Important qualification: tests use synthetic Octokit-shaped fixtures. A real Octokit runtime has NOT yet been instantiated, pinned or permission-tested. GitHub-maintained `actions/github-script` v9 is a candidate transport wrapper; its published release commit is `3a2844b7e9c422d3c10d287c895573f7108da1b3`. It was not added to the workflow in this pass. Reference: https://github.com/actions/github-script/releases
- The fixture workflow has only `contents: read`, uses checkout pinned to `11bd71901bbe5b1630ceea73d27597364c9af683`, does not expose a write token to PR code, and runs Node built-in tests. It does not make GitHub API calls.

## Implementation

Files added:
- `proofs/github-approval-event-adapter/src/verifier.mjs`
- `proofs/github-approval-event-adapter/test/verifier.test.mjs`
- `proofs/github-approval-event-adapter/package.json`
- `.github/workflows/github-approval-event-adapter-fixtures.yml`

Verifier behavior:
- Requires event name `issue_comment` and action `created`.
- Rejects PR comments, missing/malformed identifiers, repository mismatch, organization owner, non-owner author, missing protected approver ID, issue not in the protected allowlist, closed Issue, edited comment, invalid command, wrong immutable target SHA, wrong profile or insufficient nonce.
- Reads canonical repository, Issue and comment by direct IDs via Octokit REST methods.
- Checks repository numeric ID/full name/owner identity, Issue ID/number/state/repository URL, comment ID/URLs/body/author/timestamps/Issue association.
- Re-reads Issue and comment before returning evidence; any changed tuple denies.
- Runner event loader reads only the absolute path in the native `GITHUB_EVENT_PATH` and requires `GITHUB_EVENT_NAME=issue_comment`; caller override of the environment object was removed in the final commit.
- All denials return `dispatch:false`. Positive result is `VERIFIED_EVENT_EVIDENCE` only and also returns `dispatch:false`. No dispatch, D1, capability, provider, model, secret, or deployment API exists in this module.

Tests:
- 11 Node tests covering positive evidence-only behavior, wrong event/action, PR rejection, repository/transfer/organization mismatch, missing or mismatched approver, Issue allowlist and state, edited comment, malformed grammar, SHA/profile/nonce mismatch, second-read changes, incomplete API responses, API failures and non-dispatching denials.
- Exact-head CI passed for both the new fixture suite and existing pool contract validation.

## Boundaries and unresolved qualification

- This is a synthetic fixture proof, not production issuer integration.
- Real Octokit runtime/client pin and credential permission smoke test remain NOT RUN.
- Native Actions event loader has not yet been exercised in an actual issue_comment workflow.
- The expected approver and allowed Issue numbers must be supplied by protected configuration; the fixture policy is synthetic and is not production configuration.
- Trusted clock, expiry, revocation, RFC 8785 canonical envelope + SHA-256, durable D1 consume, transactional claim/outbox and API↔D1 race handling remain NOT IMPLEMENTED / NOT QUALIFIED.
- API 401/403/404/409/422/429/5xx are all caught fail-closed by the generic API failure boundary; status-specific audit classification remains future work.
- No positive test grants execution authority. The module has no dispatch capability.

## Status

- Read-only event/REST fixture verifier: VERIFIED on exact PR #55 head by 11/11 tests.
- Pool workflow contract CI: VERIFIED on same exact PR head.
- Real Octokit transport integration: NOT RUN.
- Native event workflow integration: NOT IMPLEMENTED.
- Protected production policy config: NOT VERIFIED.
- Issuer-to-D1 consume/outbox: NOT IMPLEMENTED.
- Remote D1/account entitlement: NOT VERIFIED.
- Production dispatch: NOT RUN.
- PR #55: OPEN / DRAFT / UNMERGED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Next bounded step: bind this verifier to a pinned GitHub-maintained Octokit transport in a separate non-dispatch workflow or controlled test harness, with protected approver/Issue policy required and a read-only API permission smoke test. Keep D1 and all dispatch gates disconnected.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
