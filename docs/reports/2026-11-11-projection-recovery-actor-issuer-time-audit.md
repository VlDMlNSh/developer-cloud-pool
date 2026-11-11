# Projection Recovery Actor issuer/time contract audit — 2026-11-11

- Scope: read-only audit of PR #60 and its issuer/trusted-time prerequisite, with cross-check of PR #59/#58 context and Issue #38.
- PR #60: https://github.com/VlDMlNSh/developer-cloud-pool/pull/60
- Branch: `design/projection-recovery-actor-contract-2026-11-11`
- Immutable PR head: `234fb2ee40265e26fac00c69ac1b6192766602cb`
- Base: `Основной@864213e2ff5b4fa956ba405dea8137a44d812f49`
- Issuer/time contract blob: `6c8bc0a06f8eb0f354da397ba2bd9629b348c90c`
- ADR blob: `59a4be21516da0e005114acfe015aee7787524dc`

## Findings

1. PR #60 is OPEN / DRAFT / UNMERGED, 7 commits, 2 files, documentation-only. It records a distinct recovery authority for terminalizing one exhausted projection outbox row; it does not alter task execution, task/attempt state, dispatch, schema, permissions, secrets or runtime.
2. The existing delivery adapter's same-owner requirement is not independent orphan recovery. Caller-supplied actor IDs and D1 conditional SQL are not authentication.
3. The follow-up contract requires a separately governed issuer, exact audience `projection-outbox-recovery`, exact operation/resource binding, one-use nonce, verifier-produced opaque grant, and trusted time. It prohibits reuse of A0 ingress or task Resolver grants.
4. Target controls include capability lifetime <=300 seconds and revocation state age <=30 seconds, but these remain unaccepted design targets. No issuer, service-principal registry, key custody/rotation, revocation source, qualified clock, audit sink/operator or retention approval is evidenced as implemented.
5. Trusted time must evaluate grant validity and lease expiry consistently and fail closed on unavailable, stale, skewed or backwards time. Caller-supplied `now` remains a test seam only.
6. Required recovery transition must atomically bind exact repository/outbox/attempt/generation/event digest, expired lease, exhausted attempt ceiling, nonce consumption, dead-letter terminalization and immutable audit event; read-back is mandatory. Recovery cannot retry/requeue, dispatch, mutate task/attempt state or write GitHub.
7. Exact-head workflow run query for PR #60 head returned no runs. Formal reviews: 0; inline review threads: 0. Exact-head CI is NOT VERIFIED; independent review NOT RUN.
8. PR #61 separately adds local synthetic Experience Auth D1 proof; its successful local tests do not qualify OAuth composition, production keys, trusted time, cookie/CSRF, owner allowlist, hosted D1, free entitlement or deployment.
9. Issue #38 remains OPEN. GitHub Issue labels are not CAS; PR #37/other local proofs do not qualify production durable claim authority.

## Disposition

- PR #60 design: useful prerequisite / NOT ACCEPTED.
- Issuer and trusted-time implementation: NOT IMPLEMENTED / NOT QUALIFIED.
- Recovery actor: NOT IMPLEMENTED / NOT QUALIFIED.
- PR #60 exact-head CI: NOT VERIFIED (no run returned).
- Independent review: NOT RUN.
- Production backend/free-tier qualification: NOT VERIFIED.
- Dispatch: retain fail-closed; do not enable either dispatch gate.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next bounded step

Identify and govern the issuer principal, issuer/key lifecycle, revocation authority, trusted-time source, audit sink and retention owner. Then update the technology-neutral contract with named ownership/evidence before any runtime proof. Do not implement recovery against a fabricated grant object or caller-provided clock.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
