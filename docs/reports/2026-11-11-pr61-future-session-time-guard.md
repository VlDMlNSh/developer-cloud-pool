# 2026-11-11 — PR #61 future-created session regression fix and exact-head CI

## Scope and immutable target

- Repository: `VlDMlNSh/developer-cloud-pool`
- PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/61
- Base proof commit: `c430fe4beecf93a20052f0c3efedb5f8539e4faa` (PR #52 branch).
- Initial inspected head: `27017a22b2ae8710803034759bc308d730a0ad39`.
- Finding source: Issue #62, which identified an ACTIVE session being returned before its persisted `created_at`.
- Change was limited to the existing PR #61 source and its Workers-runtime D1 regression test. No migration, workflow, package, production binding, secret, route, deployment, dispatch or provider change.

## Finding and correction

Issue #62 reproduction: create a session with `createdAt = T + 100`, then call lookup at `T`. The previous query checked hash, revocation and expiry but omitted the lower time bound; it could return ACTIVE before the session's creation time.

Correction in `src/experience-auth-session.js`:
- Added SQL predicate `created_at <= ?` to the session lookup.
- Bound the trusted lookup timestamp to both creation and expiry predicates.
- Retained fail-closed behavior and exact session hash lookup.

Regression test in `tests/experience-auth-session.vitest.js`:
- Create a session with future `createdAt`.
- Lookup before creation must return `DENY / SESSION_INACTIVE`.
- Lookup at creation time must return ACTIVE for the expected GitHub numeric subject.

## Exact changes and read-back

- Source commit: `64ebe73e5c1f5c5b82637b85ae7b1be39d50c8a6`; source blob after final PR head: `046111beb31d7c8cf58e623581d2b260fbdad496`.
- Test commit / final PR head: `976cb2ed0b594b39c847921918f182ab6d571344`; test blob: `5ccfb8e662b531d29b6292985d6420b47ef99029`.
- Final PR head re-read from GitHub: `976cb2ed0b594b39c847921918f182ab6d571344`.
- Read-back confirmed both the SQL guard and regression test exist at the final head.

## Exact-head CI

- Workflow: Experience Auth D1 Local Proof.
- Run: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42984644046
- Job: `130402848442`.
- Status: COMPLETED / SUCCESS.
- `npm ci --legacy-peer-deps --ignore-scripts --no-audit --no-fund`: SUCCESS.
- `npm run check`: SUCCESS.
- `npm test`: 11 passed, 0 failed.
- `npm run test:workflow`: 3 files, 15 tests passed, 0 failed. This includes the new future-created session regression test.
- Combined commit status API returned no statuses; the explicit workflow run and job are the evidence used.
- This validates the local Workers-runtime / synthetic D1 proof only. It does not qualify hosted D1, production trusted time, OAuth integration or deployed session handling.

## Review and qualification boundary

- PR #61 remains OPEN / DRAFT / UNMERGED.
- Formal reviews: 0. Inline review threads: 0. Independent security review NOT RUN.
- Issue #62 was subsequently closed by repository owner after verification. The closing comment explicitly links final PR #61 head `976cb2ed0b594b39c847921918f182ab6d571344`, source/test blobs and successful run `42984644046`; it also states PR #61 remains draft and not approved for merge or production.
- `created_at <= now` is a correctness guard, not proof that the supplied `now` is trustworthy. Production trusted-time composition remains unqualified.
- AEAD PKCE envelope encryption, key custody/rotation, OAuth callback/cookie/CSRF integration, owner allowlist composition, session rotation, global quotas/circuit breaker, browser QA, hosted D1 and deployment remain NOT QUALIFIED / NOT RUN.
- No secret values were accessed or changed. No OAuth App, production resource, remote database, deployment, provider call or dispatch was touched.

## Disposition

- Future-created session lookup regression: FIXED in PR branch.
- Regression test: VERIFIED.
- Exact-head CI: VERIFIED (run 42984644046 / job 130402848442).
- PR #61 merge: NOT APPROVED; remains draft pending broader contract/security review and base PR #52 governance.
- Production OAuth/session: NOT IMPLEMENTED / NOT QUALIFIED.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

Next bounded step: continue source-level review of PR #61 for temporal, revocation, replay, ambiguous-write and authority boundaries; do not enable runtime or merge. Keep production trusted-time requirement explicit.

Canonical navigation:
- Context Window: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/cross-chat-continuation-2026-11-06/docs/context/GITHUB-CONTEXT-WINDOW.md
- PR #61: https://github.com/VlDMlNSh/developer-cloud-pool/pull/61
- Issue #62: https://github.com/VlDMlNSh/developer-cloud-pool/issues/62
- MediaHub canonical map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
