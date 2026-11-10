# 2026-11-10 — GitHub approval adapter REST contract and least-privilege verification

## Immutable target / live project state

- Documentation branch: `docs/cross-chat-continuation-2026-11-06`.
- Default branch `Основной` HEAD: `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- Context before this pass: blob `aa45d583241752d170ad4240ff8bee6c96f37597`, branch HEAD `9e65754b6a3263992a2f46e78d8e89f7071e9f54`.
- Issue #38 remains OPEN. Its embedded baseline/default SHA and older PR references are stale; it remains an open design issue, not current source-of-truth for refs.
- Current PRs #37, #39, #53, #54, #52 and others remain draft/unmerged. Exact-head CI results checked in this pass:
  - PR #39 head `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`: run `42329993548` SUCCESS.
  - PR #37 head `1be8672c1be1a720b6c813dcafff5c020b6456ae`: runs `42484039940` and `42484039932` SUCCESS.
  - PR #53 head `b8a253f06418841d5f0250c9fd550bf3247db040`: current commit-run lookup returned no runs; latest exact-head CI NOT VERIFIED in this pass.
  - PR #54 head `ec3f3266ca28c4fb5633a9475cc6f396a4677974`: run `42537241204` SUCCESS.
  - PR #52 head `c430fe4beecf93a20052f0c3efedb5f8539e4faa`: run `42507524428` SUCCESS.
  - Default branch SHA lookup returned no PR-triggered workflow runs; that wrapper only lists PR-triggered runs, so this is not evidence of default-branch CI failure or success.
- No PR was merged and no production refs changed.

## Official GitHub API documentation verification

The current official GitHub REST documentation establishes:

1. `issue_comment` fires for both Issue and PR conversation comments. The payload has action, comment, issue, repository and sender. The action for creation is `created`. A PR comment is represented by an Issue object with a `pull_request` property. Therefore the Issue-only profile must require absence of that property; event name/action alone is insufficient.
2. `GET /repos/{owner}/{repo}/issues/comments/{comment_id}` returns a comment with `id`, `url`, `html_url`, `body`, `user.id`, `user.type`, `created_at`, `updated_at`, `issue_url`, and `author_association`.
3. The get-comment endpoint requires either Issues: read or Pull requests: read for fine-grained credentials. Since this verifier rejects PRs, Issues: read alone satisfies this endpoint.
4. `GET /repos/{owner}/{repo}` requires Metadata: read.
5. `GET /repos/{owner}/{repo}/issues/{issue_number}` requires Issues: read.
6. GitHub App subscription to `issue_comment` requires Issues: read.

Decision: minimum repository permission set is Metadata: read + Issues: read. Do not add Pull requests: read, Issues: write, Pull requests: write, Contents: write, Actions: write, Administration or Workflows permission. The selected credential type/runtime still needs a separate permission smoke test; no token was inspected here.

Sources:
- https://docs.github.com/en/webhooks/webhook-events-and-payloads
- https://docs.github.com/en/rest/issues/comments#get-an-issue-comment
- https://docs.github.com/en/rest/repos/repos#get-a-repository
- https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens

## Live public identity snapshot

Read-only GitHub API results:
- Repository ID `1445644538`.
- Canonical full name `VlDMlNSh/developer-cloud-pool`.
- Owner numeric ID `157891068`, owner type `User`.
- Default branch `Основной`.
- Issue #38 numeric ID `6249619988`, state OPEN, `repository_url` matches canonical repository API URL, and no `pull_request` property is present.

These are observed public identifiers, not yet protected runtime configuration. The expected approver ID must be separately pinned in protected configuration and checked against the live repository owner ID; never bootstrap it from event payload, issue body or caller-supplied values.

## Contract update

Updated `docs/contracts/CANONICAL-GITHUB-APPROVAL-EVENT-ADAPTER-CONTRACT.md` with section 12:
- exact documented event discriminator and Issue/PR rejection;
- canonical API response fields to compare;
- edit detection using `updated_at === created_at` plus exact body/author/time comparison;
- minimum permission matrix and prohibition on write scopes;
- actual repository/Issue ID snapshot;
- distinction between native Actions event context and a separately HMAC-verified raw webhook. The Actions event JSON is a runner-provided event source, not itself an independently verifiable HMAC envelope.

Contract update commit: `e0de8ddcabf132befae2c36bec4e534bb846e93a`
New contract blob: `0dbde57d3c439aa38ae92c1c9ea2c95a508e73e9`

## Security conclusions and remaining work

- The API contract is now documentation-checked against official GitHub docs.
- No source code or executable API fixture adapter was created.
- No selected runtime token/credential permissions were tested.
- No secret values were read or printed.
- No D1 schema/resource, workflow, permissions, dispatch gate, provider route or deployment was changed.
- No worker, DSH, Resource Probe, provider/model call or production dispatch occurred.
- The GitHub API read sequence and D1 consume are not a distributed transaction; residual edit/delete race between final read and D1 commit remains explicitly disclosed.

Next bounded step: implement a read-only API client fixture harness (Octokit-based, exact-pinned) with synthetic responses and negative tests for repository/Issue/comment binding, PR rejection, edited/deleted comments, owner mismatch and API failures. The harness must expose only DENY/verified-internal-evidence types and no dispatch method. Keep D1 disconnected until those tests pass.

## Status

- REST response fields and permission matrix: VERIFIED against official documentation.
- Live repository/Issue identity snapshot: VERIFIED.
- Current PR #37/#39/#54 exact-head CI listed above: SUCCESS on those exact heads only.
- PR #53 current exact-head CI: NOT VERIFIED (no runs returned by current query).
- Executable API verifier: NOT IMPLEMENTED.
- Credential permission smoke test: NOT RUN.
- Issuer-to-D1 integration: NOT IMPLEMENTED.
- Remote D1/account entitlement: NOT VERIFIED.
- Production dispatch: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
