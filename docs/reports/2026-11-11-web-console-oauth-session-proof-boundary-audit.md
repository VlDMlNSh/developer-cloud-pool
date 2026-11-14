# Web console and OAuth/session proof boundary audit — 2026-11-11

## Scope
Read-only reconciliation of the current default branch, documentation continuation PR #66, web-console prototype PR #25, and local OAuth/session D1 proof PR #61. No source-code integration or hosted-resource operation was authorized or performed.

## Immutable references and current state
- Repository default branch: `Основной`.
- Latest default-branch commit observed by repository-scoped commit search: `221f216c00ca7e5596bcc682ba185ad155a10603` (2026-11-11T15:24:47Z).
- Documentation branch: `docs/projection-stack-reconciliation-2026-11-11`.
- PR #66 reported head: `b2060d8932a096f5bffab83d7b9b5edfdf8ec8d8`; base: `Основной@221f216c00ca7e5596bcc682ba185ad155a10603`.
- PR #66 exact-head workflow query: empty result; CI NOT VERIFIED. Formal reviews: 0. Inline review threads: 0. Independent review NOT RUN. Keep OPEN/DRAFT/UNMERGED.

## Findings

### PR #25 — Hono web console prototype
- Reuses the existing graphite static dashboard and Hono/Cloudflare Workers Static Assets.
- Health endpoint is service-only; pool state is unknown.
- Protected reads fail closed with HTTP 503 until authentication is implemented; mutations return HTTP 405.
- It is not a production authenticated web console. OAuth/session runtime, live GitHub adapter integration, browser/iPhone QA, Workers Free entitlement and deployment are not qualified in the supplied PR evidence.

### PR #61 — OAuth/session D1 proof
- Branch: `proof/experience-auth-d1-session-2026-11-11`; intentionally stacked on PR #52 at parent commit `c430fe4beecf93a20052f0c3efedb5f8539e4faa`. Do not merge or transplant it independently of its base.
- Latest documented proof head: `f2d225fe8d660bdc9724320080e0d0cd91705f0a`.
- Exact-head local Workers/D1 run: `42984959975`, job `130403823600`, COMPLETED/SUCCESS. Evidence includes `npm ci`, `npm run check`, 11/11 unit tests, and 17 workflow tests across 3 files.
- Scope: synthetic-only separate `EXPERIENCE_AUTH_DB` binding and migrations, OAuth state consume/create adapter, session create/lookup/revoke adapter, concurrent callback-consumer and expiry/replay/storage-failure tests, plus explicit separation from the pool ledger `DB` binding.
- Explicit non-goals: no production D1, OAuth App, secret/key, route, browser cookie, Worker deployment, provider request, task mutation or dispatch. PKCE envelope is opaque ciphertext; AEAD encryption/key custody/rotation are not qualified. Owner allowlisting remains separate middleware. Session rotation and global quota are not implemented.
- Caller-supplied timestamps are test seams, not trusted production time. Local D1 success does not establish remote D1 behavior, Cloudflare entitlement, deployment, live OAuth interoperability or production security.
- Independent formal review: 0; inline threads: 0 in recorded evidence.

## Compatibility decision
PR #61 is useful reusable local proof, but it does not complete PR #25's production auth integration. It also reuses PR #52's Hono/Workers package, lockfile and local D1/Vitest harness; avoid copying its package infrastructure as a second independent application. Before any integration, inspect the exact #52/#61/#25 source trees and establish:
1. whether the Hono app and OAuth callback/session adapter can be mounted without changing the pool ledger's authority or binding;
2. how separate D1 bindings and migration directories are configured and deployed;
3. how OAuth state/PKCE data is encrypted with qualified AEAD/key custody;
4. where immutable numeric owner-ID allowlisting is enforced;
5. how Secure/HttpOnly/SameSite host-only cookies, CSRF/origin checks, expiry, revocation and session rotation are implemented;
6. how the live GitHub OAuth callback and GET-only Experience API are tested without exposing tokens to browser code;
7. how exact-head CI, independent security review, free-tier entitlement and deployment authorization are evidenced.

No auth library or new dependency is selected by this audit. No mature component is presumed to solve application-specific owner authorization, key custody or session governance.

## Governance and safety
- PR #66's Context Window, checkpoint, manifest and governance report were read from the documentation branch. Context Window's top section still contained a stale 2026-11-08 default HEAD and old continuation references; a dated superseding addendum was appended to correct this drift.
- No source/runtime/schema/workflow/permission/secret/dispatch/hosted-resource/deployment/merge changes.
- No secret values accessed.
- Hosted D1: NOT AUTHORIZED / NOT RUN.
- Dispatch: FAIL-CLOSED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next step
Perform a source-level compatibility audit of exact PR #52/#61 and #25 file trees, preserving ancestry and package ownership. Produce a no-code integration manifest with exact paths, binding/migration separation, auth middleware and cookie/CSRF/owner-ID gaps, and test plan. Do not integrate or deploy before independent review and all governance gates.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
