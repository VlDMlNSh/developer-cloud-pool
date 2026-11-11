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


## Exact-head CI reconciliation — 2026-11-11

The first CI attempt `42984166338` failed at Vitest config loading because the initial migration helper import referenced the uninstalled package `@cloudflare/vitest-pool-workers/config`. Static checks and the 11 Node API/policy tests had passed. The import was corrected to use `readD1Migrations` from the already-pinned `@cloudflare/vitest-plugin`; a setup file now calls `applyD1Migrations` against the dedicated `EXPERIENCE_AUTH_DB` binding. No dependency or lockfile was added.

The subsequent run is bound to the current PR head:
- PR #61 HEAD: `7b018219cf220046a641d3811434014cc63421d4`.
- Workflow run `42984240109`: COMPLETED / SUCCESS, exact head.
- Job `130401521593`: COMPLETED / SUCCESS.
- `npm ci`: PASS.
- `npm run check`: PASS.
- `npm test`: 11/11 PASS.
- `npm run test:workflow`: 3 files passed, 14/14 tests passed.
- Experience auth suite: 6/6 PASS; includes 50 concurrent callbacks with exactly one successful state consumption.
- PR reviews: 0; inline threads: 0.

The failure on the earlier attempt is superseded by the successful exact-head run above. Local D1/Workers runtime proof is now VERIFIED for the tested schema/adapter behavior only. It does not qualify production integration, PKCE AEAD/key management, browser OAuth/cookies/CSRF, session rotation, quota enforcement, remote D1, Free entitlement, deployment or independent security review. PR #61 remains OPEN / DRAFT / UNMERGED.


## Subsequent exact-head CI reconciliation

The proof branch advanced again after the previous exact-head success, adding explicit migration loading in `vitest.config.js` and `tests/apply-experience-auth-migrations.js`. The latest observed branch head was rechecked:

- PR #61 current HEAD: `9b8e35566dfd1aa42df967d5ee65a1759fdcd7c7`.
- Exact-head workflow run `42984373437`: COMPLETED / SUCCESS.
- Job `130401940558`: COMPLETED / SUCCESS.
- `npm ci`, static syntax checks, existing Node tests (11/11) and Workers/D1 Vitest (3 files, 14/14) all passed.
- New Experience auth suite: 6/6 passed.
- PR reviews: 0; inline threads: 0.

This supersedes the earlier exact-head snapshot `7b018219cf220046a641d3811434014cc63421d4` / run `42984240109`. The earlier failure remains a superseded configuration attempt. PR #61 remains OPEN / DRAFT / UNMERGED. Verification is limited to local Workers/D1 emulator semantics; no production or account-level qualification is implied.


## 2026-11-11 — final exact-head verification refresh

The prior report/context entry naming head `7b018219cf220046a641d3811434014cc63421d4` is superseded by a subsequent hardening commit.

- Current PR #61 head: `9b8e35566dfd1aa42df967d5ee65a1759fdcd7c7`; branch head and PR head match.
- Additional negative validation: `revokeApplicationSession` now rejects non-string session digests instead of relying on RegExp coercion. Added an object-with-`toString` adversarial fixture.
- Exact-head workflow run `42984373437`: COMPLETED / SUCCESS; job `130401940558`: SUCCESS.
- Exact-head checks: `npm ci` PASS; `npm run check` PASS; `npm test` 11/11 PASS; `npm run test:workflow` 3 files / 14 tests PASS. Experience auth D1 suite remains 6/6 PASS; concurrent 50-way OAuth state consumption yields exactly one consumer.
- Earlier attempts are retained as history: first run failed because migration was not applied; second failed due duplicate import; the final head uses `readD1Migrations` from the already-pinned `@cloudflare/vitest-plugin` and applies the migration through the Cloudflare test API. No dependency or lockfile change.
- PR #61 remains OPEN / DRAFT / UNMERGED; formal reviews 0, inline threads 0. Independent security review NOT RUN.
- Verification boundary remains local synthetic Workers/D1 only. PKCE AEAD/key custody, browser cookies/CSRF/callback, owner allowlist integration, session rotation, quota, remote D1, free-tier entitlement and deployment remain NOT QUALIFIED / NOT RUN.
- No production resource, secret, OAuth App, route, dispatch or deployment touched. Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## Latest observed head — 2026-11-11

The PR head advanced again; a fresh exact-head query and job readback confirm:
- PR #61 HEAD: `27017a22b2ae8710803034759bc308d730a0ad39`.
- Workflow run `42984494769`: COMPLETED / SUCCESS on that head.
- Job `130402330583`: COMPLETED / SUCCESS.
- `npm ci`, syntax checks, Node tests (11/11), and Workers/D1 Vitest (3 files, 14/14) passed; Experience auth suite 6/6.
- Reviews 0; inline threads 0. PR remains OPEN / DRAFT / UNMERGED.

This is the latest exact-head evidence at the time of this report update. It supersedes the prior 9b8e/42984373437 snapshot. Local-only qualification boundaries remain unchanged.


## 2026-11-11 — current-head verification supersedes prior snapshot

- PR #61 latest head: `27017a22b2ae8710803034759bc308d730a0ad39`; branch and PR refs match.
- This successor adds stricter D1 CHECK constraints for the PKCE verifier envelope and encryption-key-version character sets, plus direct-SQL negative fixtures. Source adapter and revocation digest coercion guard remain present.
- Exact-head workflow run `42984494769`: COMPLETED / SUCCESS; job `130402330583`: SUCCESS.
- Checks: `npm ci` PASS; `npm run check` PASS; `npm test` 11/11 PASS; `npm run test:workflow` 3 files / 14 tests PASS.
- PR #61 remains OPEN / DRAFT / UNMERGED; reviews 0, inline threads 0. Local synthetic D1/Workers proof VERIFIED only within this test boundary; independent review NOT RUN.
- No production OAuth App, production D1, secret/key, browser cookie/CSRF route, deployment, provider call or dispatch. PKCE AEAD/key custody/rotation, owner allowlist integration, session rotation, quota, remote D1/free-tier entitlement and browser QA remain NOT QUALIFIED / NOT RUN.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## 2026-11-11 — future-time guards and D1 binding isolation

- Issue #62 future-created application session finding was corrected on PR #61: lookup SQL now requires `created_at <= now`; regression proves DENY before creation and ACTIVE at creation time. Issue #62 closed with resolution evidence.
- Follow-up audit found the same temporal boundary should be explicit for OAuth state consumption. Current PR head `f2d225fe8d660bdc9724320080e0d0cd91705f0a` adds `created_at <= now` to the conditional OAuth state UPDATE and a regression test for future-created OAuth state.
- Added a D1 binding-isolation test: Experience Auth DB contains only its two auth tables among the checked set and Pool DB contains neither auth table. Wrangler proof config uses distinct synthetic database IDs and migration directories (`DB` vs `EXPERIENCE_AUTH_DB`).
- Exact-head run `42984959975`, job `130403823600`, on `f2d225fe8d660bdc9724320080e0d0cd91705f0a`: COMPLETED / SUCCESS. `npm ci`, `npm run check`, Node API/policy tests 11/11, Workers/D1 Vitest 3 files / 17 tests PASS. The new future-session, future-OAuth-state, and DB-binding isolation cases are included.
- PR #61 remains OPEN / DRAFT / UNMERGED; reviews 0, inline threads 0; independent security review NOT RUN. Stacked on PR #52 and cannot be merged independently.
- Trusted time remains unqualified: adapters accept caller-supplied `now` / `createdAt` / `expiresAt`; these are deterministic local test inputs, not production time provenance. Revocation uses immediate `revoked_at IS NULL` gating in lookup, but no production cache/revocation freshness integration is proven.
- PKCE AEAD/key custody/rotation, GitHub owner allowlist, browser callback/cookie/CSRF, session rotation, global quota, remote D1, account Free entitlement, deployment and independent security review remain NOT QUALIFIED / NOT RUN.
- No production DB, OAuth App, secret, key, route, deployment, provider request or dispatch touched. Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## 2026-11-11 — continuation and governance recheck

- Current default branch `Основной` HEAD observed: `0bb804df8ba989b7a9c004d093d45c680b165892`.
- Active ruleset `26550182` (`Основной — verified`) still targets only `refs/heads/Основной`, enforcement active, blocks deletion/non-fast-forward, and requires pull requests with resolved review threads. It sets `required_approving_review_count: 0`; therefore it does NOT enforce a mandatory approving review. Branch-protection endpoint returned 403 to the integration, so effective protection beyond the readable ruleset is NOT VERIFIED.
- PR #52 remains OPEN / DRAFT / UNMERGED at `c430fe4beecf93a20052f0c3efedb5f8539e4faa`; its base PR #25 also remains an unmerged parent chain. PR #61 remains OPEN / DRAFT / UNMERGED, base PR #52 exact head `c430fe4...`; do not merge #61 independently.
- Latest PR #61 head and proof branch agree: `f2d225fe8d660bdc9724320080e0d0cd91705f0a`; exact-head run `42984959975` / job `130403823600` SUCCESS; 11 Node tests and 17 Workers/D1 tests passed. Reviews 0, inline threads 0.
- PR #61 auth adapter is not imported by `src/index.js` at this head; protected `/api/*` remains 503 `AUTHENTICATION_NOT_CONFIGURED`, mutations remain 405, health says authentication not configured and dispatch disabled. Thus this proof has not enabled production authentication or routes.
- Context and report are on the documentation continuation branch, not default branch or merged implementation. Current docs branch observed `f088013c314ddb76973aa86c20477a0892b39d5d` at governance check; documentation commits are separate from PR #61 implementation branch.
- Contour A remains BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
