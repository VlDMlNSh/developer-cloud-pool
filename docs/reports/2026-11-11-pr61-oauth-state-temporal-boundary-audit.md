# 2026-11-11 PR #61 OAuth state temporal-boundary audit

- Date: 2026-11-11
- Scope: exact-head source audit of OAuth transaction consumption, temporal boundaries, D1 binding isolation, and test evidence.
- PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/61
- Immutable baseline inspected: `823c0416850cd0367a890e36d1bc025daa5f03d5`.
- Corrected PR head: `f2d225fe8d660bdc9724320080e0d0cd91705f0a`.
- Base remains stacked on PR #52 head `c430fe4beecf93a20052f0c3efedb5f8539e4faa`.

## 1. Finding

`lookupApplicationSession` already requires `created_at <= now`, but `consumeOAuthTransaction` originally checked only:
- state hash;
- browser-binding hash;
- `consumed_at IS NULL`;
- `expires_at > now`.

It did not require `created_at <= now`. A valid future-created OAuth transaction could therefore be consumed early if the adapter's caller-supplied `now` preceded the row's creation time. This is the same temporal-boundary class previously fixed for application sessions.

## 2. Bounded correction

In `src/experience-auth-session.js`, added `AND created_at <= ?` to the atomic UPDATE predicate and bound the supplied timestamp as a second temporal boundary. Consumption remains a single conditional UPDATE with RETURNING; no read-then-write race was introduced.

Added a Workers-runtime D1 regression test:
- issue a transaction with `created_at = NOW + 100`;
- attempt consumption at `NOW`, expect DENY;
- consume at `created_at`, expect CONSUMED_ONCE.

## 3. Additional isolation evidence observed

The latest baseline added a test asserting that `oauth_transactions` and `application_sessions` exist only in the dedicated `EXPERIENCE_AUTH_DB` binding and are absent from the Pool ledger `DB` binding. This is synthetic Miniflare/Workers test evidence, not a production Cloudflare binding/deployment attestation.

## 4. Read-back evidence

- Source blob after correction: `90ec8a9b2e7dba2f367c96ca37fa41b5f6b0b5e3`.
- Test blob after correction: `c6f75fd554081173a5de972396cbe2aea9ee1fb7`.
- Both were fetched from the PR branch and checked for the temporal predicate and regression test.
- PR current head at read-back: `f2d225fe8d660bdc9724320080e0d0cd91705f0a`.

## 5. Exact-head CI

- Exact-head workflow run: [42984959975](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42984959975).
- Completed SUCCESS on exact head. Job `130403823600`: checkout, runtime, lockfile install, static checks, API/policy tests, Workers/D1 tests and cleanup all succeeded. API/policy 11/11; Workers/D1 17/17 across 3 files; Experience Auth suite 9/9, including future-created OAuth state regression and binding-isolation test.
- CI must be rechecked on exact head `f2d225fe8d660bdc9724320080e0d0cd91705f0a`. Prior-head successes are not transferable.
- No artifacts or production evidence claimed.

## 6. Remaining trust and lifecycle boundaries

- The adapter accepts caller-provided `now`; there is no trusted-time provider or freshness guarantee in this module. Temporal tests prove predicate behavior for supplied timestamps, not clock authenticity.
- No maximum OAuth transaction TTL or application-session TTL is enforced here. A policy owner must approve concrete bounds before implementation; do not invent them.
- Revocation freshness/distribution is not implemented; the D1 row is a local state model only.
- PKCE envelope syntax validation is not AEAD encryption proof. Encryption algorithm/profile, key custody, rotation, compromise response and audit evidence remain NOT QUALIFIED.
- Session rotation/single-active-successor semantics are not implemented.
- Owner Allowlist integration, OAuth callback/cookie/CSRF flow, provider token exchange, browser QA, hosted D1 and production Worker binding/deployment remain NOT RUN / NOT QUALIFIED.
- PR #61 remains OPEN / DRAFT / UNMERGED; formal reviews 0, inline threads 0, independent security review NOT RUN.
- No secrets, OAuth app, production resources, provider calls, deployment, routes, or dispatch were touched. Protected API remains fail-closed.

## 7. Disposition and next step

- Source correction: COMMITTED / READ-BACK VERIFIED.
- Exact-head CI: VERIFIED SUCCESS — run `42984959975`, job `130403823600`; API/policy 11/11 and Workers/D1 17/17.
- Production OAuth/session: NOT QUALIFIED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
- Next: confirm exact-head CI. If successful, prepare an explicit temporal policy decision request for trusted-time authority and maximum OAuth/session TTL, and continue auditing revocation/rotation boundaries without enabling production auth.


## Exact-head CI closeout

- Exact PR head `f2d225fe8d660bdc9724320080e0d0cd91705f0a` passed [run 42984959975](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42984959975), job `130403823600`.
- API/policy: 11/11 passed. Workers/D1: 17/17 across 3 files. Experience Auth: 9/9. Static checks and all workflow steps including cleanup succeeded.
- Test log contains expected synthetic uncaught-error diagnostics from existing workflow failure-path tests; Vitest reported 3 files passed / 17 tests passed and the job concluded SUCCESS.
- This remains local synthetic Workers/D1 proof only; no production qualification follows.
