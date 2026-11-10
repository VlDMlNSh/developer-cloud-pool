# Octokit Transport Component Selection — Bounded Qualification

Date: 2026-11-10  
Status: COMPONENT SELECTED / INTEGRATION NOT IMPLEMENTED / NO RUNTIME CLAIM

## Immutable target and scope

- Target proof branch: `proof/github-approval-event-adapter-2026-11-10`
- Target head: `edff010388897f23f58bceb92e5180a09970fdff`
- Verifier blob: `80bbb2c93691be3eaf89466d6638a9795dafe6fb`
- Fixture tests blob: `aa704bf07af0587df25c41affc1a6d93f9cc6f16`
- Workflow blob: `e191856f0a37dcd21383ebf8cd65c06330f4815d`
- Package manifest blob: `9fd2d41f4d9cabf91ebe6b5238e4712dfb75ab6d`

## Mature component evaluation

Selected candidate: GitHub-maintained `octokit/rest.js`, npm package `@octokit/rest`, release `22.0.1`. GitHub's official repository identifies it as the GitHub REST API client for JavaScript; its v22.0.1 release is dated 2025-10-31 and the release tag is shown as signed/verified. The npm package page reports 22.0.1 as the latest tag in the current lookup. Sources:
- https://github.com/octokit/rest.js
- https://github.com/octokit/rest.js/releases/tag/v22.0.1
- https://www.npmjs.com/package/@octokit/rest

Alternative considered: GitHub-maintained `actions/github-script` v9, immutable action SHA `3a2844b7e9c422d3c10d287c895573f7108da1b3`, already noted in the prior Context Window. It bundles Octokit for workflow scripts, but is a workflow action rather than a directly importable library dependency for the current Node proof package. Do not add both implementations.

## Compatibility finding

The current verifier already expects the Octokit REST surface `octokit.rest.repos.get`, `octokit.rest.issues.get`, and `octokit.rest.issues.getComment`. These correspond to the official REST client surface; a narrow adapter can pass the client through without writing a custom HTTP client, retry engine, pagination implementation, or API URL builder.

Current proof package has no runtime dependencies and no lockfile. The fixture tests use a hand-written fake Octokit-shaped object. The existing workflow runs `node --test` only. No real Octokit instance, HTTP transport, synthetic Fetch response, or request method/URL assertion has been exercised.

## Qualification gate — why integration is deferred

A production-quality proof must commit an npm lockfile with integrity hashes for the full transitive dependency graph and use `npm ci`; pinning only `@octokit/rest@22.0.1` in `package.json` is insufficient. This execution surface can edit repository text but cannot run npm to produce and verify a canonical lockfile. Fabricating a lockfile or committing an unverified dependency graph would weaken supply-chain guarantees. Therefore no dependency or workflow changes were made in this pass.

## Required next bounded pass

1. Generate `package-lock.json` with npm against `@octokit/rest@22.0.1`; retain exact resolved versions and integrity hashes.
2. Add an adapter that accepts an injected Octokit instance and exposes only the three read methods required by the verifier.
3. Instantiate the real `Octokit` with a synthetic `request.fetch` implementation; assert GET-only methods, exact API paths, repository/Issue/comment reads, response parsing, error handling, and zero network egress.
4. Run `npm ci` and `npm test` in the PR-only workflow with `contents: read` and `issues: read` only; do not expose write-capable credentials to PR-controlled code.
5. Keep native approval consumption, nonce persistence, D1, dispatch, provider/model calls and deployment disabled until policy provenance, replay/expiry/revocation and trusted runtime integration are independently qualified.

## Disposition

- Mature component selection: VERIFIED by official repository/release and npm metadata.
- API-surface compatibility: VERIFIED by source inspection only.
- Dependency graph lock/integrity: NOT VERIFIED.
- Real Octokit transport with synthetic fetch: NOT RUN.
- Runtime integration: NOT IMPLEMENTED.
- Native issue_comment execution: NOT IMPLEMENTED.
- Dispatch: NOT RUN; all verifier outcomes remain `dispatch:false`.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
