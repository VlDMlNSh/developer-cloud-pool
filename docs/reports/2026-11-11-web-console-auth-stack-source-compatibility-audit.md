# Source compatibility audit — Hono web console and OAuth/session D1 stack — 2026-11-11

## Scope and immutable refs
Read-only source audit of PR #25, #52 and #61. No code integration, merge, deployment, secret access, hosted D1 or dispatch.

| Layer | PR | Base | Current head |
|---|---:|---|---|
| Hono console | #25 | `Основной@64d2636d4500127e635c214ccfb722c6b3fcda80` | `8f0c0c57cf24d476a27d456e80ffd1d8ced7ab85` |
| Workers/D1/Vitest foundation | #52 | `#25@8f0c0c57cf24d476a27d456e80ffd1d8ced7ab85` | `c430fe4beecf93a20052f0c3efedb5f8539e4faa` |
| OAuth/session D1 proof | #61 | `#52@c430fe4beecf93a20052f0c3efedb5f8539e4faa` | `58e255880c4cf4dc24fc2f2ee0791a9b121146ae` |

All three PRs are OPEN / DRAFT / UNMERGED. Independent formal reviews: 0; inline review threads: 0 on each PR.

## Exact-head CI revalidation
- PR #25 head `8f0c0c57cf24d476a27d456e80ffd1d8ced7ab85`: Pool Contract run `42228269689` / job `127927220340` SUCCESS; Jarvis Web Prototype run `42228269676` / job `127927219846` SUCCESS. Steps include lockfile install, static checks, API negative tests and dashboard validation.
- PR #52 head `c430fe4beecf93a20052f0c3efedb5f8539e4faa`: run `42507524428` / job `128813275338` SUCCESS. Steps include npm ci, static checks, API tests, UI contract and local Cloudflare Workflow/D1 proof.
- PR #61 current head `58e255880c4cf4dc24fc2f2ee0791a9b121146ae`: run `42991794791` / job `130426199809` SUCCESS. Steps include npm ci, static checks, existing API/policy tests and local Workers/D1 tests.
- Important correction: the previously recorded #61 head `f2d225fe8d660bdc9724320080e0d0cd91705f0a` is stale. Current PR metadata reports `58e255880c4cf4dc24fc2f2ee0791a9b121146ae`; use the latter for subsequent work.

## Source-level compatibility

### PR #25: application shell
- `src/index.js` exports Hono `app` and default Worker. API security headers are middleware-scoped to `/api/*`.
- `GET /api/v1/health` is service-only and explicitly says pool status unknown, auth not configured, dispatch disabled.
- Remaining API requests fail closed with 503 for GET/HEAD; all other API methods return 405.
- Static dashboard is offline/demo-only. UI validator rejects fetch/XHR/WebSocket/EventSource, browser persistence, GitHub API references, external script/style references and inline event handlers.
- `wrangler.jsonc` is the web Worker entrypoint with static assets and `run_worker_first: ["/api/*"]`. No D1 binding exists in this production-facing config in the PR #25 patch.

### PR #52: shared local proof foundation
- Keeps Hono dependency `4.13.16`, Wrangler `4.158.0`; adds `@cloudflare/vitest-plugin@1.6.0`, Vitest `4.1.12`, `test:workflow`, local Workers test config and synthetic D1 binding `DB`.
- Adds `migrations/0001_attempt_ledger.sql`, attempt-ledger and Workflow proof modules/tests.
- Extends the existing web validation workflow's path filters for package lock, proof Wrangler config and migrations, and invokes the local workflow proof.
- Uses a single committed package-lock and `npm ci`; no second application/package root required.

### PR #61: isolated Experience auth data adapter
- Reuses #52 package, lockfile, Vitest plugin and local Workers runtime; extends `check` to include auth adapter/test files.
- Adds a distinct synthetic binding `EXPERIENCE_AUTH_DB` and separate `experience-auth-migrations` directory. It does not put auth tables into the Pool ledger's `DB` binding.
- Adds STRICT tables for `oauth_transactions` and `application_sessions`.
- Adapter functions: issue/consume one-time OAuth transaction; create/lookup/revoke application session. Conditional SQL enforces one-time consumption, browser-binding hash match, expiry and created-at boundaries; sessions require canonical numeric GitHub ID strings and expiry/revocation checks.
- New workflow tests the isolated auth D1 proof. It uses the same project package/lockfile and shared Vitest config.

## Integration boundary and unresolved requirements
The ancestry and package ownership are compatible: #61 is a true stack on #52, and #52 is a true stack on #25. Preserve this stack; do not cherry-pick #61 onto #25 alone and do not create a second package/lockfile/Vitest harness.

However, PR #61 is only a D1 repository proof. The inspected adapter has no OAuth provider exchange, PKCE encryption/decryption implementation, callback route, cookie issuance/parsing, browser-binding cookie, CSRF/origin middleware, immutable owner allowlist, session rotation or route-level authorization. It returns a GitHub user ID after a session lookup but does not itself authorize that ID. `now` is caller-supplied and is not a trusted production clock. The schema's PKCE envelope and key-version fields are opaque storage, not evidence of AEAD or key custody.

Required integration layers, in order:
1. Keep `wrangler.jsonc` (web runtime) and `wrangler.proof.jsonc` (synthetic test runtime) distinct. Design a separately reviewed production binding/migration strategy; never deploy the synthetic proof database IDs.
2. Add a narrowly scoped OAuth callback/state service using an approved maintained OAuth/OIDC protocol library where suitable; implement PKCE verifier AEAD with key versioning, custody, rotation and failure tests.
3. Add exact immutable numeric GitHub owner-ID authorization after successful provider identity validation; default deny.
4. Add high-entropy opaque session cookie issuance and lookup: `__Host-`, Secure, HttpOnly, Path=/, SameSite policy, host-only; store only a hash; implement expiry, revocation and rotation.
5. Add exact HTTPS Origin/CSRF protections for callback and every state-changing route; keep Experience API GET-only until separately approved.
6. Mount middleware/routes into existing Hono app; do not expose OAuth access tokens or provider credentials to browser code.
7. Add route-level negative tests for unauthenticated, non-owner, expired/revoked, CSRF/origin mismatch, callback replay, key failure, session fixation/rotation and cross-binding isolation.
8. Obtain independent security review and exact-head CI before any deployment or enabling protected reads.

No mature dependency was selected by this pass. The source audit supports reusing the existing stack, not accepting the current proof as production-ready authentication.

## Disposition
- Source compatibility / ancestry: VERIFIED.
- PR #25/#52/#61 exact-head CI: VERIFIED at the SHAs and run IDs above.
- Independent security review: NOT RUN (0 reviews / 0 threads per PR).
- Production OAuth/session integration: NOT IMPLEMENTED.
- Hosted D1, Worker deployment, browser/mobile QA: NOT RUN / NOT AUTHORIZED.
- Dispatch: FAIL-CLOSED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
