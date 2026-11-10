# 2026-11-10 — Canonical GitHub approval-event adapter contract

## Immutable target and live refs

- Documentation target branch: `docs/cross-chat-continuation-2026-11-06`.
- Default branch `Основной`: `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- Documentation branch before this change: `2328d93fc307aa3e0f057e9a47138e039982b4d5`.
- Issue #38 remains OPEN. Its embedded baseline SHA and some historical PR references are stale; the current immutable lifecycle contract and Autonomous-First policy on the documentation branch are controlling for this iteration.
- PR #39 remains OPEN/DRAFT/UNMERGED at `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`; exact local D1 proof run `42329993548` SUCCESS. PR #37 exact-head runs `42484039940` and `42484039932` SUCCESS. PR #54 exact-head run `42537241204` SUCCESS. These runs are evidence for their own exact heads only, not production qualification.
- Active Ruleset #26550182 targets only `refs/heads/Основной`, requires PR and thread resolution, but requires zero approving reviews and no CODEOWNERS approval. It does not enforce independent review.

## Mature components checked

GitHub's own REST documentation recommends Octokit.js for JavaScript REST API integration. The official `octokit/octokit.js` SDK and GitHub-maintained `actions/github-script` are mature transport/client options. They can provide REST requests, authentication plumbing, pagination/retry behavior, and request handling; they do not prove owner intent or mint an authorization capability. The contract therefore reuses these instead of creating a custom GitHub REST client.

Sources:
- https://docs.github.com/en/rest/guides/scripting-with-the-rest-api-and-javascript
- https://github.com/octokit/octokit.js
- https://github.com/actions/github-script

## Contract published

New document:
`docs/contracts/CANONICAL-GITHUB-APPROVAL-EVENT-ADAPTER-CONTRACT.md`

Commit: `d0629b4a3f798e1cac6ac618ef4eba2de330b22a`

The contract defines:
- only native GitHub Actions `issue_comment.created` as an approval locator; no workflow_dispatch or caller override;
- canonical read-back of repository, Issue and comment by direct resource IDs;
- numeric actor/owner verification against protected policy, with personal-owner profile and organization fail-closed behavior;
- rejection of edited/deleted comments, event/API mismatch, issue/PR confusion, bot authors, API errors, rate limits, malformed/incomplete results and ambiguous reads;
- exact versioned approval command grammar, immutable target SHA/profile/nonce;
- RFC 8785 canonical JSON and SHA-256 envelope binding; no hand-rolled canonicalization;
- trusted backend clock for expiry; event timestamps are provenance only;
- provenance fields and one trusted verifier-to-D1 consume boundary; no public `verified:true` object;
- explicit cross-system race limitation between GitHub API read and D1 commit;
- negative-first adversarial test matrix;
- read-only permission and no-dispatch constraints.

## Important security disposition

The native event payload is a locator/correlation input, not authority by itself. The adapter must re-fetch canonical resources and compare the immutable event snapshot. Direct-by-ID reads avoid search/pagination discovery. The API verifier and D1 transaction are not one distributed transaction; the document explicitly records the residual edit/delete race after final read. Stronger semantics require a separately authenticated signed webhook/attestation issuer and qualified key lifecycle.

No code, workflow, permissions, secrets, variables, D1 schema, resources, dispatch gates, provider routes, or deployments were changed. No secret values were inspected. No provider/model/Worker/DSH/Resource Probe execution occurred.

## Verification and next step

The contract is design-only and NOT IMPLEMENTED. It has not yet been independently validated by executable tests. Next bounded pass: turn the contract into a source-level API fixture test plan and verify the exact REST response fields/permission model against the official GitHub API documentation, then implement a negative-first isolated adapter with no dispatch capability. First resolve any ambiguity in the approval grammar and the trusted approver policy.

- Canonical owner-event verifier: NOT IMPLEMENTED.
- Durable issuer-to-D1 integration: NOT IMPLEMENTED.
- Remote D1/account entitlement: NOT VERIFIED.
- Production dispatch: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
