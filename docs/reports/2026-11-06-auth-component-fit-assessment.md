# 2026-11-06 — GitHub OAuth / Hono authentication component fit assessment

## Scope and immutable context

Assess existing maintained components before implementing application authentication for the read-only Jarvis web console. No production code, dependency manifest, secrets, provider configuration, deployment, paid service, or dispatch was changed.

- Repository: `VlDMlNSh/developer-cloud-pool`
- Architecture branch: `docs/jarvis-web-experience-adr-2026-11-06`
- Branch base: `Основной` @ `64d2636d4500127e635c214ccfb722c6b3fcda80`
- Branch snapshot before this report: 55 ahead / 0 behind.
- Existing implementation PR: [#25](https://github.com/VlDMlNSh/developer-cloud-pool/pull/25), fail-closed Hono prototype; current observed HEAD `d8521571ede91d7f6d7fb6d5ee37747ac94385ea`.
- Target identity contract: direct server-side GitHub OAuth, immutable numeric GitHub user-ID allowlist, opaque `__Host-jarvis_session`, server-side expiry/revocation; no browser-held OAuth token; GET-only Experience API.
- Existing runtime remains fail-closed: health is service-only; protected API reads return 503; API mutations return 405.

## Components inspected

### 1. Bezzie — `neilpmas/bezzie`

Repository: https://github.com/neilpmas/bezzie

Read-back evidence from its current `main` branch:
- README blob: `1217e4c4fafdca91f74905fef14c50a835143c92`.
- package.json blob: `f5d38fa52fa815c309cc07a018a99c7153e627d1`.
- CHANGELOG blob: `ee0382ffeecf1907a9b4d23f0fdea9986cdaa208`.
- Declared package version: `1.4.2`; MIT.
- Runtime implementation depends on `oauth4webapi` and Hono peer dependency `^4.0.0`.
- Documented identity providers are Auth0, Okta, Keycloak and Google; configuration is issuer/OIDC-oriented.
- Current integration examples require an identity-provider client secret and a Cloudflare KV session adapter.
- README explicitly notes 1,000 KV writes/day on the free tier and one PKCE-state write per unauthenticated login start.
- README's default session TTL is 30 days; project ADR has not yet selected an acceptable concrete TTL.
- The API exposes an access token on server-side Hono context (`c.var.accessToken`) for upstream forwarding. This is not browser exposure by itself, but consumers must ensure no handler serializes or logs it.

**Fit decision: REJECT AS DIRECT GITHUB OAUTH DROP-IN / RETAIN AS REFERENCE ONLY.**

Reason: the documented providers and issuer contract are OIDC IdPs, while the current project decision is direct GitHub OAuth App authentication. GitHub OAuth App login is not the OIDC issuer flow shown by Bezzie's README. Adding Auth0/Okta/Keycloak as an intermediary would introduce another identity-provider account, configuration, cost/entitlement and GitHub-identity mapping dependency. KV usage and the default 30-day session TTL also need explicit quota/security decisions. Do not install it or add KV bindings on the basis of README claims alone.

### 2. Official Auth0 Hono SDK — `auth0/auth0-hono`

Repository: https://github.com/auth0/auth0-hono

Read-back evidence:
- README was inspected from `main`.
- package.json blob: `6e92d44d45f87022090ebb1070e9da274feee704`.
- Package declares `@auth0/auth0-hono` version `1.0.0`, Apache-2.0, dependency `@auth0/auth0-server-js`, peer dependency Hono `>=3.0.0`.
- Supports Hono/Cloudflare Workers and provides Auth0 login/callback/logout, session middleware, encrypted cookie sessions, optional Cloudflare KV session store and authorization helpers.
- The SDK is explicitly Auth0-domain/client-credential oriented. GitHub would need to be configured as an upstream Auth0 social connection; the project would then need to validate that the returned profile includes the immutable GitHub numeric ID and enforce the exact allowlist.
- This adds an external identity broker and does not establish a free/no-card entitlement.

**Fit decision: NOT SELECTED FOR CURRENT NO-CARD DIRECT-GITHUB-OAUTH DESIGN.**

It may be reconsidered only if the owner explicitly changes the identity architecture and Auth0 pricing/terms, account eligibility, GitHub connection behavior, numeric-ID mapping, data handling and exit strategy are independently verified. No Auth0 account or provider connection was created.

### 3. oauth4webapi

Bezzie declares `oauth4webapi ^3.8.5` as a dependency. This is a standards-oriented OAuth/OIDC protocol implementation, but using it directly would still require a project-specific GitHub OAuth provider adapter, callback/state/PKCE handling, identity lookup, session store and route integration. No direct adoption was made in this pass. A focused evaluation of GitHub's documented OAuth App flow and the library's provider compatibility is the next research step.

## Security and architecture implications

1. Do not equate OIDC discovery/JWKS validation with GitHub OAuth App identity verification.
2. The authorization decision must use the immutable numeric GitHub account ID obtained server-side from GitHub's authenticated-user endpoint, not a login name, browser-supplied field, or unverified token claim.
3. Keep the browser-facing session opaque and host-only. Do not serialize OAuth access tokens into HTML, JSON, logs, or client storage.
4. Keep the current Worker fail-closed until a direct GitHub OAuth implementation and session persistence strategy have negative tests and independent review.
5. Avoid adding KV merely because a candidate library uses it. First verify Workers Free entitlement, KV quota impact, namespace availability and the exact session-consistency/expiry semantics. Workers Free entitlement remains NOT VERIFIED.
6. No authentication library is accepted by this assessment. No production dependency has been added.

## Evidence and source links

- [Bezzie repository](https://github.com/neilpmas/bezzie)
- [Bezzie README](https://github.com/neilpmas/bezzie/blob/main/README.md)
- [Bezzie package manifest](https://github.com/neilpmas/bezzie/blob/main/package.json)
- [Bezzie changelog](https://github.com/neilpmas/bezzie/blob/main/CHANGELOG.md)
- [Official Auth0 Hono repository](https://github.com/auth0/auth0-hono)
- [Auth0 Hono package manifest](https://github.com/auth0/auth0-hono/blob/main/package.json)
- [Hono third-party middleware documentation](https://hono.dev/docs/middleware/third-party)
- [GitHub OAuth App authorization documentation](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)

## Status

- Mature-component reconnaissance: COMPLETED for the two inspected Hono/Workers candidates.
- Direct GitHub OAuth drop-in component: NOT IDENTIFIED.
- Bezzie: REJECTED as direct drop-in; reference only.
- Auth0 Hono SDK: NOT SELECTED; requires an external Auth0 broker.
- oauth4webapi direct GitHub adapter evaluation: PLANNED / NOT RUN.
- Production OAuth/session: NOT IMPLEMENTED.
- Independent security review: NOT RUN.
- Workers Free entitlement: NOT VERIFIED.
- Deployment / browser / iPhone QA: NOT RUN.
- Dispatch / provider routing: DISABLED / NOT RUN.

## Next bounded step

Inspect GitHub's current OAuth App authorization and authenticated-user API contracts, then evaluate whether a small adapter around an established OAuth protocol library can satisfy the project contract without an intermediary IdP. Produce a source-bound threat checklist and no-secret tests before any runtime integration. Keep PR #25 draft and fail-closed.
