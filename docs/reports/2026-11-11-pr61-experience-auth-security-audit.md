# PR #61 source-level security audit — 2026-11-11

## Scope and immutable target

- Repository: `VlDMlNSh/developer-cloud-pool`
- PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/61
- Head branch: `proof/experience-auth-d1-session-2026-11-11`
- Audited head: `9b8e35566dfd1aa42df967d5ee65a1759fdcd7c7`
- Base: PR #52 branch at `c430fe4beecf93a20052f0c3efedb5f8539e4faa`
- Adapter blob: `14236350b99f4f8629b64db6e6b81ff881d4465f`
- Review scope: source, migration, tests, workflow metadata. No production binding, secret, OAuth app, provider request, deployment, or dispatch touched.

## CI evidence

- Exact-head workflow run: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42984373437
- Run `42984373437`: COMPLETED / SUCCESS.
- Job `130401940558`: COMPLETED / SUCCESS.
- Checkout, npm ci, static checks, existing API/policy tests, and local Workers/D1 tests all succeeded.
- This is local synthetic D1 proof only; it is not production OAuth or deployment qualification.

## Finding — future-created sessions can be accepted

Severity: security/correctness boundary; fail-closed defect.

In `src/experience-auth-session.js`, `lookupApplicationSession` filters by session hash, `revoked_at IS NULL`, and `expires_at > now`, but omits `created_at <= now`. The migration permits a row with a future `created_at` as long as `expires_at > created_at`.

Reproduction:
1. Let current lookup time be `T`.
2. Create a session with `createdAt = T + 100` and `expiresAt = T + 3600`.
3. Look it up at `now = T`.
4. Current SQL can return the session as `ACTIVE`.

Expected behavior: deny until `now >= created_at`.

Recommended correction: add `AND created_at <= ?` to the lookup predicate, bind the lookup timestamp, and add a Workers-runtime D1 regression test.

Tracked as https://github.com/VlDMlNSh/developer-cloud-pool/issues/62.

## Review and qualification status

- PR #61 remains OPEN / DRAFT / UNMERGED.
- Exact-head CI is VERIFIED.
- Formal review submissions observed: none.
- The future-created-session finding is outstanding.
- AEAD encryption/key custody, key rotation, production OAuth integration, owner allowlisting integration, session rotation, global quota enforcement, production D1 and deployment remain outside this proof or NOT VERIFIED.
- Do not merge or adopt this proof in production until Issue #62 is fixed and exact-head CI passes again, followed by review of the stacked base chain.

## Result

PR #61: CI VERIFIED, security review INCOMPLETE, qualification NOT VERIFIED.
Contour A: BLOCKED / NOT ACCEPTED.
Contour B: DEFERRED.
Dispatch remains disabled.

## Next

Fix Issue #62 on the PR branch, add the future-created-session regression test, rerun exact-head CI, then continue auditing the full stacked PR chain and authority boundaries.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## Follow-up ref check — 2026-11-11

- PR #61 advanced after the initial audit to head `27017a22b2ae8710803034759bc308d730a0ad39`.
- Re-read `src/experience-auth-session.js` at the branch tip: adapter blob remains `14236350b99f4f8629b64db6e6b81ff881d4465f`; the lookup predicate still omits `created_at <= now`. The test file still lacks a future-created-session regression case.
- New exact-head run `42984494769` / job `130402330583`: COMPLETED / SUCCESS. This verifies CI on the newer head but does not resolve Issue #62.
- PR remains OPEN / DRAFT / UNMERGED; review submissions remain empty. Finding remains outstanding.

## Resolution candidate — fix and regression test landed, CI pending

- PR #61 advanced to head `64ebe73e5c1f5c5b82637b85ae7b1be39d50c8a6`.
- Adapter blob `046111beb31d7c8cf58e623581d2b260fbdad496` now includes both `created_at <= ?` and `expires_at > ?` in the session lookup predicate.
- Test blob `5ccfb8e662b531d29b6292985d6420b47ef99029` adds a Workers-runtime D1 case that creates a future-dated session, expects DENY before creation, and ACTIVE at creation time.
- Exact-head workflow run `42984610137` / job `130402696252` was observed IN_PROGRESS during this recheck; installation was still running and later checks were pending. Fix is source-verified but not yet CI-verified.
- Issue #62 remains OPEN pending exact-head CI success and final recheck. PR #61 remains OPEN / DRAFT / UNMERGED; independent review submissions remain empty.
