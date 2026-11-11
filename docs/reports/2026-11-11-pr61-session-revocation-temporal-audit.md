# 2026-11-11 PR #61 session revocation temporal-boundary audit

- PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/61
- Immutable baseline: `f2d225fe8d660bdc9724320080e0d0cd91705f0a`.
- Corrected PR head: `58e255880c4cf4dc24fc2f2ee0791a9b121146ae`.
- PR remains OPEN / DRAFT / UNMERGED, stacked on PR #52.

## Finding

`revokeApplicationSession` previously updated a session when `session_hash` matched and `revoked_at IS NULL`, but omitted the temporal predicate `created_at <= now`. The schema CHECK (`revoked_at >= created_at`) would reject an early revocation write, causing the helper to return `SESSION_REVOCATION_AMBIGUOUS` rather than a deterministic inactive/not-yet-created denial.

## Bounded correction

Added `AND created_at <= ?` to the conditional UPDATE and bound `input.now`. This preserves a single atomic update and makes a not-yet-created session return `SESSION_NOT_ACTIVE_OR_ALREADY_REVOKED`. No expiry predicate was added: revocation of an expired but previously created session remains useful as cleanup and does not reactivate it.

Added a D1 regression:
- Create a session whose creation time is in the future.
- Revocation before creation returns deterministic DENY.
- Lookup at creation confirms it remains active.
- Revocation at creation succeeds.

Read-back:
- Source blob: `f514e69cfac03792bb40a7e4c606c2106ba7d79d`.
- Test blob: `60046e5a55dcd1155755ce0c8a5d8af4e87ee1a3`.
- Both fetched from PR branch and checked for predicate/test.

## Exact-head CI

- Run: [42991794791](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42991794791).
- Target: `58e255880c4cf4dc24fc2f2ee0791a9b121146ae`.
- Status at report creation: IN_PROGRESS. Recheck terminal state before treating this proof as verified.

## Session revocation and rotation boundaries

- Current lookup checks `revoked_at IS NULL` on each D1 lookup; this is a local adapter predicate only. No production request path imports the adapter, no cache invalidation/freshness contract is proven, and no cross-device/global revocation contract exists.
- Current revocation is per-session hash. There is no session family/device lineage, no atomic rotate/replacement operation, no single-active-successor invariant, and no recovery semantics for ambiguous create/revoke outcomes.
- Do not add session-family schema or rotation behavior until authority, concurrent-rotation, and recovery semantics are explicitly defined.
- `now` remains caller-supplied; no trusted-time provenance or maximum session lifetime policy is qualified.
- OAuth callback/cookie/CSRF, owner allowlist, PKCE AEAD/key custody/rotation, hosted D1, production deployment and independent security review remain NOT QUALIFIED / NOT RUN.
- Protected API remains fail-closed; no secrets, OAuth app, production resources, routes, deployment, provider calls or dispatch touched.

## Disposition

- Source correction: COMMITTED / READ-BACK VERIFIED.
- Exact-head CI: PENDING.
- PR #61: OPEN / DRAFT / UNMERGED; independent security review NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
- Next: confirm exact-head CI, then define session-family/revocation authority and rotation/recovery policy before implementing rotation.
