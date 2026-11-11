# 2026-11-11 — Experience OAuth state and session D1 local proof

## Objective and immutable target

Add an isolated local Workers/D1 proof for the Jarvis Experience authentication-state boundary, reusing the existing Hono + Cloudflare Workers Vitest harness. No production resources or authentication routes.

- Repository: `VlDMlNSh/developer-cloud-pool`
- Default branch `Основной` observed HEAD: `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- Parent proof PR #52 head: `c430fe4beecf93a20052f0c3efedb5f8539e4faa`.
- New PR #61: `proof/experience-auth-d1-session-2026-11-11`.
- PR #61 current observed HEAD: `7d30a55d8a90fb14f2516a57e458b0a660630499`.
- PR #61 base: `proof/cloudflare-workflows-vitest-2026-11-08`, parent PR #52 head.
- PR #61 is OPEN / DRAFT / UNMERGED; reviews 0; inline review threads 0.

## Reused mature infrastructure

Reused the existing project-level Cloudflare Workers Vitest harness and pinned dependencies from PR #52 rather than creating another package project:
- `@cloudflare/vitest-plugin@1.6.0`
- `vitest@4.1.12`
- `wrangler@4.158.0`
- existing root `package-lock.json`
- existing `vitest.config.js` with Cloudflare test runtime and `tests/*.vitest.js` discovery
- existing `npm run test:workflow` CI path.

The parent PR #52 had a completed successful Hono validation run `42507524428`; its D1/Workflow local proof harness was inspected and reused. Earlier isolated D1 proof PRs #36 and #39 also show completed successful local D1 CI runs `42329438351` and `42329993548`, but those runs do not validate this new auth schema.

## Changes on PR #61

1. `experience-auth-migrations/0001_create_experience_auth_state.sql`
   - STRICT `oauth_transactions` table with unique state digest, browser-binding digest, opaque PKCE verifier envelope, key version, creation/expiry and one-time consumption timestamp.
   - STRICT `application_sessions` table with unique session digest, canonical GitHub numeric subject as TEXT, creation/expiry and revocation timestamp.
   - indexed expiry columns.
   - DDL is local proof schema only.

2. `wrangler.proof.jsonc`
   - added distinct synthetic `EXPERIENCE_AUTH_DB` binding and its own `experience-auth-migrations` directory.
   - retained existing `DB` binding for the unrelated Pool attempt ledger. The two local D1 bindings are separate.

3. `src/experience-auth-session.js`
   - fail-closed issue and atomic consume of OAuth state via conditional `UPDATE … RETURNING`.
   - fail-closed session create, indexed active-session lookup and conditional revocation.
   - strict input type/format validation; GitHub numeric subject must be a canonical decimal string, not a JS number.
   - adapter does not import or expose Pool task/dispatch capabilities.

4. `tests/experience-auth-session.vitest.js`
   - 50 concurrent OAuth callbacks: exactly one expected consumer.
   - mismatch, browser binding mismatch, expiry and replay rejection.
   - malformed digest, noncanonical GitHub IDs and invalid lifetimes.
   - session creation, lookup, expiry, revocation and repeated revocation.
   - missing storage and synthetic storage exceptions fail closed.
   - direct SQL constraints reject malformed rows.

5. `.github/workflows/experience-auth-d1-proof.yml`
   - added a PR path-triggered workflow with read-only contents permission, concurrency cancellation, pinned checkout and the existing lockfile/test scripts.
   - necessary because the parent Hono validation workflow only targets the default/Hono branches and would not run for this stacked proof branch.

6. `package.json`
   - added syntax checks for the new adapter and test file; no dependency or lockfile change.

## Verification status

- Branch created from immutable PR #52 HEAD: SUCCEEDED.
- PR #61 created as draft, stacked on PR #52: SUCCEEDED.
- Migration, adapter, test, Wrangler config, workflow and package script were read back from the branch.
- Current PR #61 HEAD: `7d30a55d8a90fb14f2516a57e458b0a660630499`.
- Exact-head workflow runs returned by GitHub: none.
- Combined commit statuses returned: none.
- Exact-head CI: NOT RUN / NOT VERIFIED (no run record is available; do not infer a pass).
- Reviews: 0; inline threads: 0.
- Local interactive runtime tests: NOT RUN; no connected execution host is available in this pass.
- No D1 database provisioned, no remote binding, no OAuth App, no secrets/keys, no provider request, no Worker deployment, no browser route, no dispatch or production change.

## Qualification limitations

- The PKCE envelope is opaque test data. AEAD encryption/decryption, nonce/tag format, key custody, key rotation and key-erasure policy are not implemented or qualified.
- Owner numeric-ID allowlisting remains a separate authorization middleware responsibility.
- Session rotation's atomic single-successor invariant is not implemented.
- Global daily budget/circuit-breaker enforcement is not implemented; the previously proposed quota numbers remain planning thresholds, not enforced limits.
- D1 outage and exception handling are tested synthetically at adapter boundary; account-level quota exhaustion, remote consistency, backup/restore and account entitlement remain unverified.
- Browser cookies, OAuth callback route, CSRF/Origin middleware and protected API integration are not implemented.
- No security qualification or independent review has occurred.

## Status and next step

- Local schema/adapter proof: IMPLEMENTED on PR #61; exact-head CI NOT VERIFIED.
- Production OAuth/session runtime: NOT IMPLEMENTED / NOT QUALIFIED.
- D1 provisioning and Workers Free entitlement: NOT RUN / NOT VERIFIED.
- Web Console deployment: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Next: obtain the exact-head run for PR #61; inspect job logs and fix any migration/runtime/test failure on the same branch. Only after CI passes should the schema/adapter proof be considered locally verified and advanced to cookie/PKCE integration design. Do not merge or provision.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
