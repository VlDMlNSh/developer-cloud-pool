# Production authentication implementation contract and negative-first route test plan — 2026-11-11

## Status and immutable scope

- Target documentation base: `docs/projection-stack-reconciliation-2026-11-11@eda1ffe8c09a1a26985165e136f325a8763af16f`.
- Repository default branch observed independently: `Основной@221f216c00ca7e5596bcc682ba185ad155a10603`.
- Scope: define a production-authentication contract for the existing Hono Experience console. Documentation only.
- Explicit exclusions: no source/runtime/schema/workflow/permission/secret/dispatch/hosted-resource/deployment/merge changes; no real OAuth exchange; no provider calls; no hosted D1.
- Existing source stack: PR #25 Hono shell → PR #52 Workers/D1/Vitest foundation → PR #61 isolated Experience auth D1 proof. Exact ancestry and CI are documented in the source compatibility report.
- PR #61 head: `58e255880c4cf4dc24fc2f2ee0791a9b121146ae`; run `42991794791` SUCCESS. This is local Workers/D1 proof, not production auth.

## 1. Design decision: reuse the existing protocol library

Use `panva/oauth4webapi` as the preferred OAuth protocol primitive, subject to dependency pinning and independent review. The repository already has a synthetic-only compatibility proof in PR #30 at `ad9f9ac598a2414b5209b6923094b16be64630ae`, using `oauth4webapi@3.8.8`. That proof validates a mocked Authorization Code + PKCE S256 exchange and synthetic `GET /user`; it does not validate live GitHub interoperability, production key handling, browser cookies, session authorization, or callback deployment.

- Upstream: https://github.com/panva/oauth4webapi
- Do not write a custom OAuth protocol implementation.
- Before production dependency adoption, pin an exact reviewed release, inspect its security policy/release history and API for the selected runtime, and commit it through the existing single package manifest/lockfile in the #25→#52 stack.
- No second package root, lockfile, or Vitest harness.
- Keep protocol library responsibility separate from application policy: OAuth library validates protocol responses; our code owns immutable owner authorization, cookie/session lifecycle, CSRF/Origin, route authorization and audit.

## 2. OAuth transaction contract

### Initiation

1. Accept only a same-origin HTTPS browser request to the fixed login route.
2. Generate independent high-entropy, cryptographically random `state`, PKCE verifier, and browser-binding nonce using the Workers Web Crypto API. Never use `Math.random`.
3. Compute PKCE S256 challenge; never downgrade to `plain`.
4. Persist a single-use transaction through the existing Experience-auth repository interface. Persist hashes or AEAD-protected values only; raw verifier must not be stored in plaintext.
5. Bind the transaction to an independent browser-binding cookie hash and strict expiry. Cookie must be Secure, HttpOnly, Path=/, host-only and appropriately SameSite; use a narrowly scoped transaction cookie name with `__Host-` prefix where compatible.
6. Redirect only to the fixed GitHub authorization endpoint with fixed client ID, exact configured callback URI, `response_type=code`, `scope=read:user` (minimum necessary), state and S256 challenge. No user-supplied redirect URI, scopes, host, or return URL.

### Callback

1. Require HTTPS and exact configured callback path/host. Reject duplicate or missing `state`, `code`, provider error ambiguity, malformed query, unexpected content type, and unexpected method.
2. Atomically consume exactly one unexpired transaction matching state hash and browser-binding hash. Replay, mismatch, expiry, and concurrent second consumption fail closed.
3. Decrypt PKCE verifier only inside the server-side callback using a versioned AEAD envelope; authenticate associated data including transaction ID, purpose, and key version. Reject unknown key version, authentication failure, malformed envelope, or missing key.
4. Exchange the code only against the fixed GitHub token endpoint using the pinned protocol library, exact client ID/secret, exact redirect URI and PKCE verifier. No redirects to untrusted hosts; bound timeout and response size. No token in browser URL, cookie, HTML, JSON, or logs.
5. Validate token response per OAuth library; then call only fixed `https://api.github.com/user` with the access token in the Authorization header. Validate response status, content type, size, schema and canonical positive decimal numeric `id`. Username is display-only and never an authorization key.
6. Compare numeric GitHub ID against a separately provisioned immutable owner-ID allowlist. Exact match only; missing/malformed/duplicate allowlist or mismatch => deny. Do not infer identity from username, email, organization membership, repository write permission, or a caller-supplied claim.
7. Create a fresh server-side session only after owner authorization. Rotate/replace any pre-auth browser state. Revoke previous session if one is being replaced. Never return the OAuth token to the browser.

## 3. Key custody and PKCE verifier encryption

- Use Web Crypto AEAD (AES-GCM with a unique 96-bit nonce per encryption under a key, or an independently reviewed approved equivalent). No home-grown cipher or unauthenticated encryption.
- Master key material must be provided through a dedicated runtime secret binding; never store it in D1, repository, workflow output, config, browser, or test fixture. This contract does not authorize secret creation or reading.
- Store a versioned envelope: algorithm identifier, key version, nonce, ciphertext+tag. Store no plaintext verifier.
- Bind AEAD additional authenticated data to a domain-separation label, transaction ID, schema/purpose version, and key version.
- Rotation: support an explicitly bounded active write key and read-key set; new writes use active key, old transactions can be decrypted only while their key version is in the approved rotation window. Unknown/retired key versions fail closed. Document key destruction and outstanding transaction expiry before activation.
- Tests must inject deterministic test-only keys and nonces; production keys never appear in tests, snapshots, logs, or artifacts.
- Do not claim KMS/HSM-backed custody unless a real available, free, approved facility is demonstrated. If runtime secret binding is the only mechanism, document its operational limitations and rotation procedure.

## 4. Session and cookie contract

- Session identifier: cryptographically random opaque value with at least 256 bits of entropy. Browser receives only the raw opaque value; D1 stores only a one-way cryptographic hash.
- Cookie: `__Host-jarvis_session`; Secure; HttpOnly; Path=/; no Domain; explicit SameSite policy (Lax is the default candidate for top-level OAuth callback); bounded Max-Age/Expires. Never expose session ID in URL, HTML, JS, JSON, logs or analytics.
- Session row: hash, canonical numeric owner ID, created/last-seen/absolute expiry, revocation timestamp, rotation predecessor/successor metadata, schema version. No OAuth access token unless a separate reviewed requirement establishes necessity; current console read scope should prefer server-side short-lived exchange and discard token after identity verification.
- Validate expiry using a trusted server runtime clock, not a caller-provided `now` argument. Clock abstraction may exist for tests only; production clock must be internal and monitored for invalid/backward movement.
- Rotation: rotate on authentication and at defined security boundaries; old hash revoked atomically when successor is created. Concurrent requests must not resurrect revoked sessions.
- Logout is POST, exact Origin + CSRF protected, idempotently revokes current session and clears cookie with matching attributes.
- Session lookup and revocation must use conditional SQL and fail closed on D1 errors, malformed records, unknown schema, clock failure, or missing bindings.

## 5. Request integrity and route authorization

- Exact HTTPS Origin allowlist for browser state-changing requests. Reject missing Origin for browser mutation/logout routes unless a separately specified non-browser authenticated channel is approved. Do not use substring/suffix matching.
- CSRF token: synchronizer token or reviewed double-submit construction bound to session; never rely on SameSite alone.
- OAuth callback is protected by one-time state + PKCE + browser binding; it must not accept arbitrary post-login return URLs.
- Set secure response headers, `Cache-Control: no-store` on auth/session responses, `Referrer-Policy: no-referrer`, restrictive CSP for the static console, and prevent caching of user-specific API responses.
- All protected API routes default deny. Only explicit GET/HEAD read routes may be enabled after acceptance. Mutations remain 405 until a separately approved control-plane contract exists.
- Read API upstream is fixed to GitHub API origin and allowlisted repository paths. No arbitrary URL, owner, repo, path, redirect target, or header from the browser. Bound pagination, body size, response size and timeout.
- Health route remains service-only and must not leak owner/session state. No auth cookie or bearer token in health output.
- Audit events are structured and redacted: transaction created/consumed/rejected, owner denied, session created/rotated/revoked, route denied, upstream failure. Never log code, state, verifier, cookie, token, secret, full Authorization header or sensitive query.

## 6. Negative-first route test matrix

| Area | Required negative cases | Positive boundary case |
|---|---|---|
| Login initiation | HTTP; wrong Host/Origin; open redirect; arbitrary scope/redirect; RNG failure; storage unavailable | Fixed GitHub endpoint, fixed callback, PKCE S256 |
| State | missing/duplicate/malformed state; mismatch; expired; replay; concurrent double consume; wrong browser binding | Exactly one transaction consumed once |
| PKCE | missing verifier; wrong challenge; plain downgrade; AEAD tamper; unknown key version; missing key; decrypt failure | Correct S256 verifier accepted |
| Token exchange | wrong endpoint; redirect; timeout; oversized/malformed response; wrong content type; OAuth error; invalid token response | Protocol library validates synthetic success |
| GitHub identity | non-200; redirect; oversized response; invalid JSON/schema; missing/zero/noncanonical ID; username-only; owner mismatch | Exact immutable numeric owner ID accepted |
| Session | random failure; hash mismatch; expired; revoked; unknown schema; D1 unavailable; caller clock spoof; backward clock; concurrent rotation | Opaque cookie maps to active owner-bound row |
| Cookie | missing Secure/HttpOnly/Path; Domain present; wrong SameSite; session in URL/body; cookie fixation | Correct __Host- cookie attributes |
| CSRF/Origin | missing Origin; HTTP Origin; wrong port/host/scheme; suffix/subdomain lookalike; CSRF missing/mismatch/replay | Exact HTTPS origin and bound CSRF accepted |
| Routes | unauthenticated; non-owner; expired/revoked; unsupported method; unknown route; auth DB binding absent | Owner GET route returns minimized data |
| Upstream | arbitrary host/repo/path; redirect; 401/403/429/5xx; oversized page; pagination abuse; timeout | Fixed allowlisted GET succeeds |
| Leakage | token/cookie/code/verifier in HTML/JSON/URL/log/error/artifact; cache hit across sessions | Redacted audit and no-store response |
| Isolation | auth D1 accidentally bound to Pool ledger DB; cross-binding query; migration mismatch | Separate Experience auth binding and migration namespace |

All negative cases must assert: no session created, no protected data returned, no side-effect beyond safe transaction consumption, no secret/token leakage, redacted audit result, and deterministic fail-closed response. Add property/concurrency tests for single-use transaction consumption and atomic session rotation.

## 7. Integration and review gates

1. Independent security reviewer accepts this contract and test matrix.
2. Revalidate exact PR #25/#52/#61 ancestry and current heads; retain shared Hono/package/lockfile/Vitest stack.
3. Implement only on an immutable candidate branch with explicit source SHA, narrow file allowlist, no production bindings and no secret reads.
4. Add local Workers-runtime negative-first tests and static checks; run exact-head CI and inspect job steps/logs for accidental secret exposure.
5. Independent code review must inspect OAuth library use, AEAD envelope, owner-ID authorization, cookie/session lifecycle, CSRF/Origin, route middleware, logging and binding separation.
6. Production binding, secret provisioning, live OAuth, hosted D1 and deployment require separate explicit governance approval and verified free-tier eligibility. This document grants none of these permissions.
7. Keep protected GET routes 503 and mutation routes 405 until all gates pass.

## 8. Current evidence and disposition

- PR #25/#52/#61 ancestry and exact-head CI: VERIFIED in source audit report.
- PR #61 local D1 test: run `42991794791`, job `130426199809`, SUCCESS.
- PR #30 oauth4webapi compatibility proof: synthetic-only; no live provider requests.
- PR #66 current documentation head: `eda1ffe8c09a1a26985165e136f325a8763af16f`; exact-head Actions runs 0; combined status records 0; formal reviews 0; inline threads 0. Documentation branch only.
- PR #61 formal reviews 0; inline threads 0.
- Production OAuth/session: NOT IMPLEMENTED.
- Hosted D1 / Worker deployment / live browser QA: NOT RUN / NOT AUTHORIZED.
- Dispatch: FAIL-CLOSED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next action

Request independent security review of this contract and negative-first matrix. Do not implement runtime code until that review is recorded. Keep synthetic and production D1 configurations separate.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## 9. Compatibility-proof limitation — PR #30 source audit (2026-11-11)

A source-level re-read of PR #30's exact test file `scripts/oauth4webapi-github-compat.test.mjs` (blob `bc87a8074f2358883b555677934dfc0526ef6cae`) found a test-coverage gap:

- The test constructs an authorization URL and sets `state`, `code_challenge`, and `code_challenge_method=S256`, but does not assert the resulting URL's origin/path or query parameters and does not pass that URL through a provider simulation.
- The mocked token endpoint asserts that `code_verifier` is present, but does not recompute S256 and compare it with the challenge generated for the authorization URL. The mock always returns a token for the inspected request.
- Therefore PR #30 demonstrates oauth4webapi API use, callback state validation, form-body client authentication request construction, token response parsing and synthetic `/user` request construction. It does not prove end-to-end challenge/verifier binding or provider enforcement of PKCE.

Before production integration, extend the isolated synthetic proof to assert: exact authorization endpoint origin/path; exact fixed client ID and redirect URI; `response_type=code`; nonempty unpredictable state; `code_challenge_method=S256`; challenge equals BASE64URL(SHA256(code_verifier)); token request verifier matches that challenge; wrong verifier and missing verifier are rejected by a deterministic provider mock; and no unrecognized outbound URL is accepted. Keep the limitation explicit: a mock cannot prove live GitHub enforcement.

This finding does not invalidate the use of PKCE or the library. GitHub's official documentation (retrieved 2026-11-11) states that OAuth Apps support PKCE and only S256 is accepted. Source: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps and GitHub Changelog 2025-07-14: https://github.blog/changelog/2025-07-14-pkce-support-for-oauth-and-github-app-authentication/.

## 10. Updated evidence disposition

- PR #30 synthetic workflow run `42216422883`, job `127887461269`, COMPLETED/SUCCESS; observed steps include npm ci, pinned oauth4webapi install, and the synthetic test. This is an exact recorded run for PR #30 head `ad9f9ac598a2414b5209b6923094b16be64630ae`, but its assertions have the source-coverage limits above.
- PR #66 current head revalidated as `be6add0f74d224048e11ce9b21b4b2e0b3ee72a4`; exact-head workflow run list and combined status list empty. CI NOT VERIFIED. Reviews 0; inline threads 0.
- Historical report `2026-11-11-web-console-oauth-session-proof-boundary-audit.md` contains stale PR #61 head/run data and predates the later corrected compatibility report. Treat it as historical only; current source compatibility report and this addendum supersede those fields.
- No source/runtime/schema/workflow/permission/secret/dispatch/hosted-resource/deployment/merge changes. No live OAuth request or secret access.
