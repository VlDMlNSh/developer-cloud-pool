# OAuth PKCE synthetic proof source audit — 2026-11-11

## Scope and immutable inputs

- Repository: `VlDMlNSh/developer-cloud-pool`.
- PR #30 exact source head: `ad9f9ac598a2414b5209b6923094b16be64630ae`.
- Test file blob: `bc87a8074f2358883b555677934dfc0526ef6cae`.
- Workflow blob: `b73adc79e1de48cc8ece973cb8c466786d54e51d`.
- PR #66 documentation head at revalidation: `be6add0f74d224048e11ce9b21b4b2e0b3ee72a4`.
- Read-only source review plus documentation correction only. No runtime, package, workflow, secret, permission, provider, hosted resource, deployment or merge changes.

## Source findings

The PR #30 test:
1. Generates verifier, S256 challenge and state using oauth4webapi.
2. Constructs a GitHub authorization URL and sets client ID, redirect URI, response_type, state, code_challenge and S256 method.
3. Creates a synthetic callback and tests state match/mismatch using `validateAuthResponse`.
4. Mocks token endpoint and checks POST/form content, client ID/secret, code, redirect URI and presence of code_verifier.
5. Processes a synthetic token response and constructs a Bearer-authenticated synthetic `GET https://api.github.com/user`.

Coverage gaps:
- Constructed authorization URL is never asserted. No assertion verifies exact endpoint origin/path or any query parameter, including the challenge/method.
- The token mock checks verifier presence but does not recompute SHA-256 and compare it to the previously generated challenge. It returns a successful token response regardless of verifier.
- No negative provider-mock test for missing/wrong verifier.
- Consequently, the test is a useful library API/request-construction smoke test, not an end-to-end PKCE binding proof or live GitHub interoperability test.

Required synthetic proof additions before production implementation:
- Assert fixed authorization endpoint origin/path, client ID, callback URI, response_type=code, state, challenge and S256 method.
- Assert challenge equals BASE64URL(SHA-256(UTF-8(code_verifier))).
- Provider mock must recompute challenge and reject missing/wrong verifier; test both cases.
- Keep outbound fetch allowlisted and reject redirects/unrecognized destinations.
- Continue to label mock results synthetic; only a separately authorized live test could prove provider interoperability.

## Authoritative provider capability

GitHub's official OAuth App documentation states that `code_challenge` and `code_challenge_method` are supported and recommends S256; the verifier is required at token exchange when a challenge was sent. GitHub's July 14, 2025 changelog states only S256 is accepted and recommends PKCE for OAuth Apps and GitHub Apps.

Sources:
- https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- https://github.blog/changelog/2025-07-14-pkce-support-for-oauth-and-github-app-authentication/

This confirms the contract's choice of PKCE S256; it does not turn the synthetic PR #30 test into live-provider proof.

## CI and current branch revalidation

- PR #30 run `42216422883`, job `127887461269`, COMPLETED/SUCCESS. Steps read back: checkout without persisted credentials, runtime check, npm ci, pinned oauth4webapi install, synthetic compatibility test. This run's success must be interpreted with the source coverage gaps above.
- PR #66 head: `be6add0f74d224048e11ce9b21b4b2e0b3ee72a4`; PR-triggered run query empty; combined status list empty; CI NOT VERIFIED. Formal reviews 0; inline review threads 0.
- PR #63 remains OPEN/DRAFT/UNMERGED; no formal reviews or inline threads. Its documented Recovery Actor issuer blockers remain independent of OAuth web-console auth: no accepted operational issuer owner, trust custodian, principal/revocation operator, trusted-time owner, audit-sink operator, privacy/legal approver or recovery quorum.

## Disposition

- oauth4webapi reuse: PREFERRED CANDIDATE; synthetic API smoke proof exists.
- PKCE S256 choice: SUPPORTED BY OFFICIAL GITHUB DOCUMENTATION.
- End-to-end PKCE test coverage: INCOMPLETE; targeted test additions required.
- Live OAuth interoperability: NOT RUN.
- Production auth: NOT IMPLEMENTED.
- Hosted D1: NOT AUTHORIZED / NOT RUN.
- Dispatch: FAIL-CLOSED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Next: keep this limitation in the contract; after independent security review, add the missing negative-first synthetic assertions on a narrow immutable candidate. Do not add live OAuth or production credentials.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
