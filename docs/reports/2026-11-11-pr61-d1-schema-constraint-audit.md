# 2026-11-11 PR #61 D1 schema constraint audit

- Scope: bounded audit of SQL-level validation for OAuth PKCE verifier envelopes and encryption-key version labels.
- PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/61
- Immutable reviewed baseline before this pass: `9b8e35566dfd1aa42df967d5ee65a1759fdcd7c7`.
- Updated branch head after this pass: `27017a22b2ae8710803034759bc308d730a0ad39`.
- Base remains stacked PR #52 head `c430fe4beecf93a20052f0c3efedb5f8539e4faa`.

## Finding

Application code enforces:
- PKCE envelope: 32–2048 base64url characters.
- Encryption key version: 1–32 characters from `[A-Za-z0-9._-]`.

The original D1 migration enforced only the lengths. A direct database writer could therefore store invalid envelope/key-version characters while satisfying the SQL CHECK constraints. Application validation is not a substitute for storage-level constraints where direct writes are possible.

## Bounded correction

Updated `experience-auth-migrations/0001_create_experience_auth_state.sql`:
- Envelope CHECK now requires length 32–2048 and rejects any character outside `[A-Za-z0-9_-]`.
- Key-version CHECK now requires length 1–32 and rejects any character outside `[A-Za-z0-9._-]`.

Updated `tests/experience-auth-session.vitest.js`:
- Direct D1 insert rejects too-short envelope.
- Direct D1 insert rejects invalid envelope characters.
- Direct D1 insert rejects invalid key-version characters.

No runtime route, OAuth exchange, key handling, secret, deployment, remote D1, provider call, or dispatch was changed.

## Read-back evidence

- Migration blob: `31a919566cd0c07a4e55c34c791acbe45c83e055`.
- Test blob: `6476f4d5962ab267c5870333e710db6cb13bcddb`.
- Both files were fetched from the PR branch after writes and checked for the expected constraints and negative cases.

## Exact-head CI

- New exact-head run: [42984494769](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42984494769).
- Head: `27017a22b2ae8710803034759bc308d730a0ad39`.
- Run completed: SUCCESS. Job `130402330583` completed all steps successfully, including cleanup. `npm ci`, static checks, API/policy tests (11/11), and Workers/D1 tests (14/14 across 3 files) passed. Experience Auth suite 6/6 passed with the new direct-write negative cases.
- No artifact published.

## Qualification

- PR #61 remains OPEN / DRAFT / UNMERGED and stacked on PR #52.
- Formal reviews: 0; inline threads: 0; independent security review NOT RUN.
- This is local synthetic D1 validation only. PKCE AEAD encryption, key custody/rotation, trusted time, owner allowlist integration, session rotation, browser OAuth callback/cookie/CSRF integration, remote D1 and production deployment remain NOT QUALIFIED.
- Jarvis Experience authentication remains fail-closed. Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

## Next step

Recheck run `42984494769` on exact head `27017a22b2ae8710803034759bc308d730a0ad39`. If successful, continue with a separate bounded review of transaction/session lifecycle and trusted-time ownership. If failed, inspect the exact job log and correct only the evidenced issue.


## Exact-head CI closeout

- Exact head `27017a22b2ae8710803034759bc308d730a0ad39` completed GitHub Actions run `42984494769` / job `130402330583`: SUCCESS.
- `npm ci`, static checks, API/policy tests 11/11, and Workers/D1 suite 14/14 across 3 files all passed; Experience Auth tests 6/6 passed including malformed direct D1 write cases.
- Run URL: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42984494769.
- This remains synthetic local D1 proof, not production auth qualification.


## Subsequent PR head and CI reconciliation

- PR #61 advanced after the schema-fix commit with one additional test commit: `976cb2ed0b594b39c847921918f182ab6d571344` (`test: reject sessions before creation time`). This adds a negative-time boundary test proving a session is inactive before `created_at` and active at its creation instant.
- An intermediate run `42984610137` was cancelled by GitHub Actions concurrency after the branch advanced; it is not treated as a failure of the final head.
- Latest exact-head run [42984644046](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42984644046), job `130402848442`, completed SUCCESS on exact head `976cb2ed0b594b39c847921918f182ab6d571344`.
- Latest suite totals: API/policy 11/11; Workers/D1 15/15 across 3 files; Experience Auth suite includes the new pre-creation-time test. Static checks and all workflow steps succeeded.
- PR remains OPEN/DRAFT/UNMERGED; independent security review NOT RUN; production auth remains NOT QUALIFIED and fail-closed.
