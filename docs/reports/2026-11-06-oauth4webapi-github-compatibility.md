# Engineering report — 2026-11-06: synthetic GitHub OAuth protocol compatibility

## Objective and immutable target

Evaluate the established `panva/oauth4webapi` protocol library against the project's direct GitHub OAuth App web flow without creating credentials, contacting GitHub OAuth endpoints, reading secrets, changing production dependencies, or enabling Worker routes.

- Repository: `VlDMlNSh/developer-cloud-pool`
- Source baseline: PR #25 head `d8521571ede91d7f6d7fb6d5ee37747ac94385ea`
- Isolated branch: `proof/github-oauth4webapi-compat-2026-11-06`
- Library pin: `oauth4webapi@3.8.8`
- Scope: synthetic protocol compatibility only; no production integration.

## Source-bound compatibility mapping

GitHub's documented OAuth App web flow specifies the GitHub authorization and token endpoints, state for CSRF defence, PKCE S256, token endpoint client ID/secret/code/redirect URI/code verifier parameters, JSON token responses, and authenticated identity revalidation through `GET https://api.github.com/user`.

References:
- https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- https://github.com/panva/oauth4webapi
- https://github.com/panva/oauth4webapi/blob/main/docs/functions/authorizationCodeGrantRequest.md
- https://github.com/panva/oauth4webapi/blob/main/docs/functions/ClientSecretPost.md
- https://github.com/panva/oauth4webapi/blob/main/docs/functions/protectedResourceRequest.md

The library exposes Authorization Code Grant + PKCE, `ClientSecretPost`, authorization response validation, token response processing, and Bearer-authenticated protected resource requests. Its README documents Cloudflare Workers support and zero runtime dependencies. The synthetic test uses a custom fetch implementation and rejects all unrecognized outbound targets.

## Changes

- Added `scripts/oauth4webapi-github-compat.test.mjs`.
- Added `.github/workflows/oauth4webapi-compatibility.yml`.
- Workflow installs the committed project lockfile first, then installs the pinned OAuth package without saving it to project manifests or changing the lockfile.
- Test exercises state validation and mismatch rejection, PKCE S256 generation, form-encoded client-secret-post token exchange, code/verifier/redirect binding, token response processing, and Bearer-authenticated `/user` identity retrieval using synthetic fixtures only.
- Fake identifiers, client secret, authorization code and access token are used. No real GitHub endpoint is contacted.

## Explicit limitations

- Does not prove GitHub's live token endpoint accepts the exact generated client-auth request; outbound request is inspected locally against GitHub's documented parameter contract.
- Does not implement state persistence, browser cookie binding, callback origin checks, OAuth callback routes, owner-ID allowlisting in the Worker, server-side session storage, session rotation/revocation, or application-session CSRF protection.
- Does not qualify the selected OAuth design or authorize enabling protected API routes.
- No production dependency or lockfile was modified.

## Acceptance criteria

1. Workflow runs on immutable PR head and completes successfully.
2. Synthetic test confirms endpoint, POST form body, required OAuth fields, PKCE verifier, expected state and Bearer header for identity endpoint.
3. Test rejects state mismatch and unrecognized network destinations.
4. No credentials, secrets, provider calls, live OAuth requests, deployment or dispatch.

## Status

- Compatibility harness: IMPLEMENTED / CI PENDING.
- oauth4webapi as production dependency: NOT ACCEPTED.
- GitHub OAuth runtime integration: NOT IMPLEMENTED.
- Independent security review: NOT RUN.
- Protected routes: remain 503 / fail-closed.
- Deployment and Workers Free entitlement: NOT RUN / NOT VERIFIED.
- Pool dispatch: DISABLED / NOT RUN.
