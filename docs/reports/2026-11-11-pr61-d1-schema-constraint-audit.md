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
- At report creation: run IN_PROGRESS; install, static checks, API/policy tests, and Workers/D1 test step had completed successfully; final post-checkout cleanup was still running. Overall conclusion not yet returned: CI NOT VERIFIED pending final completion.
- No artifact published.

## Qualification

- PR #61 remains OPEN / DRAFT / UNMERGED and stacked on PR #52.
- Formal reviews: 0; inline threads: 0; independent security review NOT RUN.
- This is local synthetic D1 validation only. PKCE AEAD encryption, key custody/rotation, trusted time, owner allowlist integration, session rotation, browser OAuth callback/cookie/CSRF integration, remote D1 and production deployment remain NOT QUALIFIED.
- Jarvis Experience authentication remains fail-closed. Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

## Next step

Recheck run `42984494769` on exact head `27017a22b2ae8710803034759bc308d730a0ad39`. If successful, continue with a separate bounded review of transaction/session lifecycle and trusted-time ownership. If failed, inspect the exact job log and correct only the evidenced issue.
