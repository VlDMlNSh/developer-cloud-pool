# 2026-11-11 — PR #59 Projection Dead-Letter Policy Audit

## Scope and immutable refs

Read-only audit of PR #59 and its dependencies; no code, schema, workflow, secret, permission, dispatch, hosted resource, deployment, or merge changes.

- Default branch `Основной` HEAD at audit: `d350bb4e988eb4e5f01cde02dd86035d3d716c47`.
- PR #58 current head: `5caeb60f7a45d836c6ad1eea2fb86e20995da025`, base `ec3f3266ca28c4fb5633a9475cc6f396a4677974`, OPEN/DRAFT.
- PR #59 head: `22200226da4f1af30645cf441a639db6893e9310`, base `6f7953e4abec3cc564984ee3635cdb7717ae5d5e`, OPEN/DRAFT.
- PR #60 head: `234fb2ee40265e26fac00c69ac1b6192766602cb`, base `864213e2ff5b4fa956ba405dea8137a44d812f49`, OPEN/DRAFT.
- PR #63 head: `4d2f6ac2d96980f28ecbab53b46b2984d7dda9f6`, base `6fdcedebeba62715122e43a75c6ad6d926321ce7`, OPEN/DRAFT.
- Issue #38 OPEN, updated 2026-11-11T08:17:42Z.
- Active ruleset #26550182 targets only `refs/heads/Основной`: PR required, 0 required approvals, thread resolution required, deletion/non-fast-forward blocked, no bypass actors.

## PR #59 source findings

Read source blobs on branch `proof/projection-dead-letter-policy-2026-11-11`:
- `proofs/d1-ledger/src/projection-outbox.mjs`: `1546c2e4172e3767ed8bd5642c7b9c6d95716d11`.
- Migration 0007: `767d95a30fa0a14c79e88c8c58392bfec9cdddc2`.
- Migration 0008: `1d9385dd371f3404c52ec15fce03b0a14d384ab1`.
- Test file: `d572b3d5fdf58c720d9cbfe0990419e7a9bc60f1`.
- Proof workflow: `a72b58c06b7d621a228df86bc2295110c9b5f451`.

Implemented local proof:
1. Maximum five delivery leases.
2. Deterministic backoff: 30/60/120/240 seconds.
3. Retry acquisition blocked until retry_after_at.
4. Fifth failed attempt transitions to dead_letter.
5. DB triggers enforce max attempts, monotonic attempt count, dead-letter evidence and terminal no-requeue.
6. Append-only delivery events record bounded reason codes and actor ID.
7. All adapter outcomes retain dispatch:false.
8. Tests cover backoff, attempt budget, stale ack after lease takeover, dead-letter terminality, and expired fifth-lease transition.

## Exact-head CI and review

PR #59 exact head `22200226da4f1af30645cf441a639db6893e9310`:
- Push run 42981803947: COMPLETED/SUCCESS.
- Pull-request run 42981807825: COMPLETED/SUCCESS; job 130393715595.
- Log: 3 test files, 53 tests passed, 0 failed; syntax check and lockfile artifact steps succeeded.
- Formal reviews: 0. Inline review threads: 0.
- This is local Workers-runtime/D1 proof only, not hosted qualification.

## Blocking design findings

### F1 — expired fifth-lease recovery is not an independent reaper

`deadLetterExpiredProjection(db, outboxId, workerId, generation, now)` requires the original lease owner and matching delivery generation. A different recovery actor cannot recover the row after the original worker disappears. It proves same-owner expiry finalization, not independent orphan-worker recovery. PR #60 correctly records this limitation.

### F2 — identity and time arguments are not authentication/trusted time

The adapter validates caller-supplied `workerId` and `now` syntactically and fences the SQL transition. Neither value proves caller identity, grant scope, revocation status, or trusted current time. The database transition is a state invariant, not an authorization boundary. PR #60's separate issuer/trusted-time contract remains design-only and unqualified.

### F3 — PR #59 does not include the latest PR #58 adapter

PR #59 is based on PR #58's earlier head `6f7953e4abec3cc564984ee3635cdb7717ae5d5e`, not current PR #58 head `5caeb60f7a45d836c6ad1eea2fb86e20995da025`. It therefore does not contain the subsequently added `projection-envelope.mjs` mapper or the latest integration contract. Do not merge/accept as a unified stack without explicit ancestry reconciliation and exact-head revalidation.

## Mature component reuse review

- Cloudflare's official guidance distinguishes Queues (at-least-once message delivery) from Workflows (durable multi-step execution); these are platform primitives, not a reason to replace the existing local D1 ledger without an entitlement and architecture decision.
- Ledgerline is a public Cloudflare Workers/Durable Objects project demonstrating transactional outbox projection and a durable authority/read-model split. Its Durable Object-per-stream ordering model is not a drop-in fit for this existing D1 lease/fencing model and would introduce a second authority/storage pattern.
- Disposition: no new dependency or platform primitive selected. Continue existing Workers Vitest + local D1 harness; preserve the current architecture until a requirement-backed comparison and free-tier eligibility are established.

References:
- https://developers.cloudflare.com/workers/best-practices/workers-best-practices/
- https://developers.cloudflare.com/queues/configuration/dead-letter-queues/
- https://github.com/aaguasvivas/ledgerline

## Status and next step

- PR #59 retry/dead-letter state machine: SOURCE + EXACT-HEAD CI VERIFIED as local proof.
- Independent Recovery Actor: BLOCKED / NOT IMPLEMENTED / NOT QUALIFIED.
- PR #60 issuer/time contract: DESIGN ONLY, no operational issuer, trust anchor, revocation source, or qualified clock.
- PR #59 stack integration with latest PR #58 mapper: NOT VERIFIED.
- Issue #38 OPEN / NOT QUALIFIED.
- Dispatch FAIL-CLOSED.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

Next bounded action: reconcile PR #59 ancestry with latest PR #58 mapper, then implement only a local, injected delivery orchestration proof that acquires a fenced lease, maps the row, invokes fake projection, and acknowledges only verified projection. Do not implement orphan recovery until issuer and trusted-time prerequisites are accepted. Keep dispatch:false.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
