# 2026-11-11 — Web Console OAuth/session schema and quota design

## Objective and immutable evidence

Prepare a bounded D1 schema and request budget for the read-only Jarvis Experience authentication boundary. This is a design-only pass; do not provision D1, add a binding, register an OAuth App, create secrets, deploy a Worker or enable protected routes.

- Repository: `VlDMlNSh/developer-cloud-pool`
- Default branch: `Основной`; observed HEAD: `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- Hono prototype PR #25 HEAD: `8f0c0c57cf24d476a27d456e80ffd1d8ced7ab85`.
- OAuth compatibility PR #30 HEAD: `ad9f9ac598a2414b5209b6923094b16be64630ae`.
- Experience API contract PR #24 HEAD: `7d3a34a1956c6a793f0bcc05ffaaf76c65c416e3`; contract blob `b542636dc7a5efcf67287c5aa53a230d06a02c6d`.
- Hosting ADR blob on PR #24 branch: `c8cdb46afcddc1baf50c41dea1f9a39dc925c5bd`.

## Existing component fit — reuse, do not rewrite

### Hono prototype (PR #25)

Inspected source:
- `src/index.js`, blob `0b1f066cc49b77f7a3000c562b731b85d5c164f4`.
- `tests/auth-policy.test.js`, blob `9fab2f5aed43057890fd767c6e37ccbaa10d705c`.
- `tests/api.test.js`, blob `cf3662609dd86b802be2c102182ce13d4501db07`.
- `package.json`, blob `a2162f4ae9629c4b6e710906a0b223d737613cce`.
- `wrangler.jsonc`, blob `2544010bb468a94d26043320c45838632997449c`.

The prototype is a good reuse candidate: Hono 4.13.16, Wrangler 4.158.0, committed lockfile, existing vanilla dashboard, restrictive response headers, health semantics, GET/HEAD-only API gate and fail-closed protected reads. It has no OAuth routes or D1 binding.

PR #25 exact-head workflow evidence:
- Hono validation run `42228269676`, job `127927219846`: COMPLETED / SUCCESS; runtime, npm ci, static checks, API negative/fail-closed tests and static dashboard validation passed.
- Pool Contract Validation run `42228269689`, job `127927220340`: COMPLETED / SUCCESS; workflow YAML, dispatch-disabled invariant and pool security contracts passed.
- Reviews 0; inline threads 0. These checks do not qualify authentication or production deployment.

Important limitation: `tests/auth-policy.test.js` tests pure helpers backed by an in-memory JavaScript Map. The fixture is not imported by `src/index.js`, is not D1-backed, and does not prove atomic concurrent consumption or cross-request persistence. Preserve the useful policy tests but replace the Map as a production authority with D1-backed repository tests.

### OAuth protocol library (PR #30)

Inspected `scripts/oauth4webapi-github-compat.test.mjs`, blob `bc87a8074f2358883b555677934dfc0526ef6cae`, and its report blob `6e2f67ed2a81b56a3a9861ae842da0ab35d416ca`.

The harness demonstrates the library's API shape for Authorization Code + PKCE S256, GitHub state validation, form-body client-secret-post, token response processing and Bearer-authenticated `GET /user` using synthetic fetch fixtures. It is a reuse candidate for protocol handling, subject to dependency review and integration tests.

Limitations:
- PR #30 has no workflow run returned for its current HEAD, and no reviews/threads. Compatibility proof is NOT VERIFIED by exact-head CI.
- Test uses synthetic client credentials, code, token and identity; it does not contact GitHub.
- It does not implement persisted OAuth state, browser binding, callback route, D1 sessions, owner allowlisting in Worker middleware, rotation/revocation or CSRF protection.
- The test report says the library was installed ephemerally by workflow and was not committed as a production dependency. Do not assume it is in the production lockfile.

Disposition: reuse Hono scaffold and existing dashboard; evaluate oauth4webapi as the OAuth protocol implementation rather than hand-writing protocol parsing. Do not claim either PR supplies production authentication.

## Proposed minimal D1 schema (design only; no migration applied)

Use one dedicated D1 database and one binding held only by the Hono Experience Worker. Two STRICT tables; no Pool task, attempt, projection, provider, approval or dispatch data.

The following is proposed SQLite/D1 DDL, to be validated in a Workers-runtime migration test before adoption:

```sql
CREATE TABLE oauth_transactions (
  state_hash TEXT PRIMARY KEY
    CHECK (length(state_hash) = 64 AND state_hash NOT GLOB '*[^0-9a-f]*'),
  browser_binding_hash TEXT NOT NULL
    CHECK (length(browser_binding_hash) = 64 AND browser_binding_hash NOT GLOB '*[^0-9a-f]*'),
  pkce_verifier_envelope TEXT NOT NULL,
  encryption_key_version TEXT NOT NULL
    CHECK (length(encryption_key_version) BETWEEN 1 AND 32),
  created_at INTEGER NOT NULL CHECK (created_at > 0),
  expires_at INTEGER NOT NULL CHECK (expires_at > created_at),
  consumed_at INTEGER,
  CHECK (consumed_at IS NULL OR consumed_at >= created_at)
) STRICT;

CREATE INDEX oauth_transactions_expiry_idx
  ON oauth_transactions(expires_at);

CREATE TABLE application_sessions (
  session_hash TEXT PRIMARY KEY
    CHECK (length(session_hash) = 64 AND session_hash NOT GLOB '*[^0-9a-f]*'),
  github_user_id TEXT NOT NULL
    CHECK (
      length(github_user_id) BETWEEN 1 AND 20
      AND github_user_id NOT GLOB '*[^0-9]*'
      AND github_user_id NOT GLOB '0*'
    ),
  created_at INTEGER NOT NULL CHECK (created_at > 0),
  expires_at INTEGER NOT NULL CHECK (expires_at > created_at),
  revoked_at INTEGER,
  CHECK (revoked_at IS NULL OR revoked_at >= created_at)
) STRICT;

CREATE INDEX application_sessions_expiry_idx
  ON application_sessions(expires_at);
```

Design notes:
- Hash raw high-entropy session IDs and OAuth state/binding values with SHA-256; store lowercase 64-character hex digests only.
- The browser receives only opaque random values in Secure/HttpOnly cookies. The browser-binding cookie is short-lived and separate from the authenticated session cookie.
- PKCE verifier must not be stored in plaintext. The envelope is AEAD ciphertext with nonce/tag and explicit key version; the encryption key is a Worker secret, not D1 data. If key custody/rotation cannot be qualified, do not enable PKCE callback processing.
- Never store OAuth access/refresh tokens, client secrets, provider keys, email, profile, login name, task payloads or raw cookies.
- GitHub numeric subject is stored as a canonical decimal string to avoid JavaScript integer precision loss; exact owner allowlisting remains a separate Worker policy check.
- No `last_seen_at` write per request. No per-request session touch. No event log containing identifiers.
- Expiry checks are authoritative on every request. Cleanup is bounded and non-authoritative.
- No foreign keys to Pool tables or cross-database joins.

### Atomic transaction shapes to prove

OAuth callback consumption must be one conditional write, not SELECT-then-UPDATE:

```sql
UPDATE oauth_transactions
SET consumed_at = ?1
WHERE state_hash = ?2
  AND browser_binding_hash = ?3
  AND consumed_at IS NULL
  AND expires_at > ?1
RETURNING pkce_verifier_envelope, encryption_key_version;
```

Exactly one concurrent callback may receive a row. Zero rows means mismatch, expiry, replay or already-consumed state; all reject. The verifier envelope is decrypted only after successful consumption.

Session validation:

```sql
SELECT github_user_id
FROM application_sessions
WHERE session_hash = ?1
  AND revoked_at IS NULL
  AND expires_at > ?2
LIMIT 1;
```

Logout:

```sql
UPDATE application_sessions
SET revoked_at = ?2
WHERE session_hash = ?1
  AND revoked_at IS NULL
  AND expires_at > ?2;
```

The Worker must verify exactly one row changed before reporting successful logout. A database error or ambiguous result is not success.

Session rotation needs a single D1 transaction with a database-enforced one-successor invariant; do not implement as independent revoke/insert calls. The exact transaction/constraint design remains OPEN and must be demonstrated under concurrent Workers-runtime tests before rotation is enabled. Initial v1 may issue a session only after OAuth and revoke it on logout/expiry; no silent refresh.

## Initial operational budget proposal

Published Workers Free D1 ceilings are plan maxima, not operating targets: 5,000,000 rows read/day, 100,000 rows written/day, 5 GB total account storage and 500 MB per database. Actual account entitlement remains NOT VERIFIED.

Proposed conservative application budget (operational stop thresholds, not yet an enforceable global limiter):
- 20,000 D1 rows read/day.
- 2,000 D1 rows written/day.
- At most 300 successful OAuth logins/day.
- At most 300 explicit logout writes/day.
- Cleanup deletes at most 100 expired rows/day, in batches.
- At most 10,000 authenticated API requests/day, one indexed session lookup per request.
- No per-request writes; no unbounded retries; no write amplification for telemetry.

Worst-case planned writes under these caps: 300 transaction inserts + 300 one-use consumes + 300 session inserts + 300 logout updates + 100 cleanup deletes = 1,300 rows written/day, leaving 700 writes of the 2,000-row application budget for bounded exceptional operations. The remaining margin is not permission to add features.

The 20,000-read and 2,000-write values are budget thresholds only. D1 usage metadata can be aggregated, but a reliable account-wide preemptive circuit breaker has not been designed. Do not describe these thresholds as hard-enforced until a separate, bounded enforcement design is tested. D1's own hard quota exhaustion must still fail closed; no KV, stateless-cookie or paid fallback.

## Required tests and acceptance gates

1. Apply migration to ephemeral local D1; run schema checks and migration replay/rollback tests.
2. Run 50+ concurrent OAuth callback attempts for one state; exactly one consumes.
3. Test state mismatch, wrong browser binding, expiry, replay, malformed digest, malformed envelope and unknown key version.
4. Verify PKCE envelope AEAD authentication and key-version rotation; never log envelope/plaintext verifier.
5. Verify session create, digest lookup, exact numeric subject, expiry boundary and logout; revoked session denied on a fresh Worker request.
6. Simulate D1 unavailable, timeout, ambiguous write/readback and quota error; no fallback and no protected response.
7. Prove session rotation's single-successor invariant under concurrent attempts before enabling rotation.
8. Verify only Hono Worker source has the binding; browser/static assets, Supervisor, Pool Worker and generic routes cannot query it.
9. Validate CSP, cookie attributes, Origin/CSRF policy, same-origin callback, rate limits, no token/cookie leakage in logs/artifacts.
10. Measure rows_read/rows_written for each flow; ensure workload remains within budget with safety margin.
11. Re-run exact-head CI; browser QA on desktop and iPhone; independent security review.
12. Verify account-specific Workers Free entitlement before any provisioning.

## Status and next step

- Hono scaffold: reusable candidate; exact-head CI SUCCESS; not independently reviewed or deployed.
- oauth4webapi: protocol harness exists; exact-head CI NOT VERIFIED; not accepted as production dependency.
- D1 schema: PROPOSED, not migrated or tested.
- Quota budget: PROPOSED; global hard enforcement design OPEN.
- OAuth/session runtime: NOT IMPLEMENTED / NOT QUALIFIED.
- D1 database/binding: NOT PROVISIONED.
- Workers Free entitlement: NOT VERIFIED.
- Web Console deployment: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B remains DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
