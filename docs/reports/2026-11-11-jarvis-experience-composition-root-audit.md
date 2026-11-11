# 2026-11-11 Jarvis Experience composition-root and session-boundary audit

- Date: 2026-11-11 (Europe/Vilnius)
- Scope: read-only cross-PR audit of PR #24 (hosting/API contract), #25 (Hono prototype), #52 (local Workflow/D1 proof base), and #61 (Experience auth D1 proof).
- Immutable heads:
  - PR #24: `7d3a34a1956c6a793f0bcc05ffaaf76c65c416e3`
  - PR #25: `8f0c0c57cf24d476a27d456e80ffd1d8ced7ab85`
  - PR #52: `c430fe4beecf93a20052f0c3efedb5f8539e4faa`
  - PR #61: `58e255880c4cf4dc24fc2f2ee0791a9b121146ae`
- PR states: all OPEN / DRAFT / UNMERGED. Stack order observed: #25 -> #52 -> #61; #24 is a separate documentation branch based on the protected baseline.

## Exact-head CI and review state

| PR | Exact-head workflow evidence | Combined status | Review |
|---|---|---|---|
| #24 | Pool Contract Validation run 42982847600 SUCCESS; Jarvis Experience OpenAPI Validation run 42982847694 SUCCESS | no contexts returned | independent review not established |
| #25 | Pool Contract Validation run 42228269689 SUCCESS; Jarvis Web Prototype Validation run 42228269676 SUCCESS | no contexts returned | independent review not established |
| #52 | Jarvis Web Prototype Validation run 42507524428 SUCCESS | no contexts returned | independent review not established |
| #61 | Experience Auth D1 Local Proof run 42991794791 SUCCESS | no contexts returned | independent review not established |

These runs verify the respective checked-in workflows only. They do not qualify production OAuth, session handling, Cloudflare entitlement, deployment, or browser security.

## Positive findings

1. PR #24's proposed architecture keeps the web console in the Experience plane and reserves task mutation/dispatch to Pool Bridge. It specifies server-side GitHub OAuth, exact immutable numeric owner-ID allowlisting, opaque host-only `__Host-jarvis_session`, server-side expiry/revocation, same-origin GET-only API and no browser-visible provider/GitHub credentials.
2. PR #25 remains fail-closed in the actual Worker entrypoint: `/api/v1/health` is service-only; every other `/api/*` GET/HEAD returns 503; non-GET/HEAD API methods return 405. No OAuth/session or privileged API is wired into the Worker. Static assets route through the Worker first for `/api/*`.
3. PR #25's auth-policy module and tests are test-only, not imported by `src/index.js`. They cover exact string owner-ID matching, one-use state in an in-memory Map, session validity predicates, cookie attribute formatting, exact HTTPS Origin equality and fixed HTTPS upstream origins.
4. PR #61 creates a dedicated synthetic Experience Auth D1 binding, separate from Pool ledger D1. Its module provides conditional one-use OAuth-state consumption and session create/lookup/revoke functions. The current session-revocation predicate includes `created_at <= input.now`, with a matching regression test. The prior apparent omission was from inspecting an older commit, not the current branch tip.
5. PR #52's Workflow runtime proof uses a separate synthetic `DB` binding and has no connection to the Experience auth database or the Hono request path.

## Composition-root and trust-boundary gaps

The four-PR stack does not yet contain a production authentication composition root:

- `src/index.js` has no OAuth start/callback route, no GitHub code exchange, no server-side /user identity fetch, no owner allowlist enforcement, no cookie issuance/clearing, no session-cookie parser, no session lookup middleware, and no protected route integration.
- The PR #61 exported D1 functions are isolated test/proof adapters. They accept caller-provided `createdAt` / `now`, a precomputed browser-binding hash and a precomputed PKCE envelope. There is no trusted clock, cryptographic state/session generator, browser-cookie binding verifier, envelope encryption/decryption, or issuer/token exchange in this branch.
- PR #61 does not define a session cookie issuance boundary, rotation/family lineage, absolute-vs-idle lifetime policy, logout semantics, CSRF defense for callback, cache invalidation, or protection against session fixation. The cookie helper in PR #25 is only a test fixture.
- The OAuth D1 row stores hashes and an envelope, but no runtime contract proves that the envelope is authenticated encryption with correct nonce/AAD/key custody. A string-format check is not cryptographic validation.
- Owner allowlist is only a test fixture. There is no approved source/owner for the production allowlist and no live check against GitHub's authenticated identity endpoint.
- No concrete module-visibility boundary prevents other Worker modules / routes sharing the binding from invoking privileged session transitions. The D1 binding is separated by database, but application-level call authority is not yet composed.
- The API's GET-only policy reduces ordinary CSRF exposure, but OAuth callback remains a state-changing browser navigation and requires one-time state bound to the initiating browser, strict redirect handling, and explicit callback-origin/host validation. SameSite=Lax alone is not the callback CSRF proof.
- Protected API routes correctly remain 503. Do not change them to authenticated success paths until the above is implemented and adversarially tested.

## Mature-component fit

Continue reusing the official Cloudflare Workers / Hono / Workers Vitest / D1 stack already selected. It provides routing, runtime bindings and a synthetic test harness. It does not provide application-specific OAuth trust, exact owner admission, session family semantics or a production issuer automatically. The existing test-only policy fixture is useful as a negative-test catalogue but must not be promoted into production code as an authority source.

No additional dependency is justified in this pass. In particular, do not add an OAuth/session framework before reviewing compatibility with Workers runtime, PKCE/state handling, cookie semantics, key management and free-tier limits.

## Decision

- Preserve PR #25's fail-closed behavior; no auth routes or protected reads enabled.
- Keep PR #61 as synthetic D1 proof only; do not claim it is an authentication implementation.
- Before runtime integration, write a narrowly scoped composition-root contract defining: OAuth start/callback state and browser binding; trusted time; server-side GitHub identity retrieval; owner-ID allowlist authority and refresh policy; PKCE verifier encryption/decryption and key custody; opaque cookie issuance/rotation/revocation; exact session middleware; callback CSRF/redirect checks; logout and session-family semantics; module/binding access boundary; and negative/fault-injection tests.
- Then implement one route slice on a dedicated proof branch, preserving the stack, with all protected routes remaining fail-closed until exact-head CI and security review are complete.
- Workers Free entitlement, account ownership, secrets/callback registration, deployment and browser/iPhone QA remain separate owner-authorized gates. No paid fallback.

## Status

- Static architecture / API contract: PROPOSED.
- Hono prototype: fail-closed synthetic prototype; exact-head CI VERIFIED.
- OAuth/session production composition root: NOT IMPLEMENTED.
- Experience D1 state/session adapter: synthetic local proof only; exact-head CI VERIFIED.
- Owner identity / allowlist / trusted time / PKCE key custody: NOT QUALIFIED.
- Cookie / callback CSRF / session rotation: NOT IMPLEMENTED.
- Cloudflare Free entitlement / deployment / device QA: NOT VERIFIED / NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
- No source changes, merge, deployment, secret/provider access, dispatch or resource mutation.
