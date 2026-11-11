# 2026-11-11 PR #61 moving-head revocation boundary audit

- Date: 2026-11-11
- Scope: verify the current tip of the stacked Experience Auth D1 proof branch and reconcile prior checkpoint evidence.
- PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/61
- Branch: `proof/experience-auth-d1-session-2026-11-11`
- Verified current branch tip: `58e255880c4cf4dc24fc2f2ee0791a9b121146ae` (commit message: `test: reject session revocation before creation`).
- Parent stack: PR #52 branch `proof/cloudflare-workflows-vitest-2026-11-08`; PR #61 remains stacked and must not be merged independently.

## Moving-head correction

An initial read of immutable commit `f2d225fe8d660bdc9724320080e0d0cd91705f0a` found the pre-creation guard absent from `revokeApplicationSession()`. That SHA was not the current PR branch tip. A subsequent branch-ref read established the branch had advanced to `58e255880c4cf4dc24fc2f2ee0791a9b121146ae`, which includes the guard and regression test. The earlier discrepancy is therefore resolved as a stale-target comparison, not a defect at the current branch tip.

## Current implementation evidence

- Source `src/experience-auth-session.js` blob: `f514e69cfac03792bb40a7e4c606c2106ba7d79d`.
- Current `revokeApplicationSession()` conditional UPDATE includes `created_at <= ?` bound to `input.now`, alongside exact session hash and `revoked_at IS NULL`.
- Test `tests/experience-auth-session.vitest.js` blob: `60046e5a55dcd1155755ce0c8a5d8af4e87ee1a3`.
- Regression creates a future-dated session, asserts revoke-before-creation returns DENY, verifies it remains ACTIVE at creation time, then verifies revocation succeeds at creation time.
- The same test file also covers 50-way OAuth-state consumption (one winner), pre-creation OAuth-state denial, expiry/replay, session lookup time boundaries, and cross-binding isolation.
- Exact-head PR CI run `42991794791`, job `130426199809`: COMPLETED / SUCCESS. All nine reported steps completed successfully, including lockfile install, static checks, API/policy tests, and local Workers/D1 tests.
- Combined commit status contexts are empty; the successful exact-head Actions run is the available CI evidence.
- Formal PR #61 reviews: none returned. Independent security review remains NOT RUN.

## Qualification gaps

- This remains synthetic local D1/Workers evidence only. No hosted D1, Cloudflare account entitlement, production binding, deployment, or production access boundary is qualified.
- `input.now` remains caller-supplied by this isolated adapter/test seam; it is not a production trusted-time source.
- PKCE verifier envelope is opaque ciphertext only. AEAD algorithm, key custody, rotation, and decryption boundary are not implemented/qualified.
- Owner allowlisting is a separate middleware responsibility and is not proven by this repository adapter.
- Browser cookie issuance/validation, CSRF/origin protections, OAuth callback integration, GitHub token exchange, and production route wiring are not implemented here.
- Session rotation/family lineage, one-active-successor invariant, ambiguous rotate/revoke recovery, global revoke-all, cache invalidation/freshness, and quota remain unimplemented.
- PR #61 is OPEN / DRAFT / UNMERGED and stacked on PR #52; do not promote or merge independently.

## Disposition

The specific pre-creation revocation regression is VERIFIED at the current branch tip and exact-head local CI. No code change is required in this pass. The prior apparent mismatch came from reading the older `f2d225f...` commit before resolving the moving branch tip.

Next bounded step: audit the trusted composition root and owner-allowlist/session-cookie/CSRF boundary in the parent web-console stack (PR #25/#24/#52/#61), keeping the review read-only and requiring exact immutable refs. Session rotation and production time/crypto remain explicit blockers.

## Project status

- PR #61 pre-creation session revocation: VERIFIED (synthetic local D1).
- PR #61 exact-head CI: VERIFIED SUCCESS, run `42991794791`.
- Independent security review: NOT RUN.
- Production OAuth/session security: NOT QUALIFIED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
- Dispatch: FAIL-CLOSED.
- No source change, merge, deployment, secret/provider access, dispatch, or resource mutation in this pass.
