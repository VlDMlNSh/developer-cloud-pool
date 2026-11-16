# Checkpoint — 2026-11-16 — D1 lease and read-only admission audit

Canonical context: [GITHUB-CONTEXT-WINDOW.md](../context/GITHUB-CONTEXT-WINDOW.md)

Audit report: [D1 lease and admission audit](../reports/2026-11-16-next-d1-lease-admission-audit.md)

## Immutable targets and CI
- Base: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- PR #111 head: `687196738782432797bf394f1342cb9df19f478f`; D1 run 43881396386 SUCCESS, 37/37 Workers-runtime tests; contract run 43881396272 SUCCESS.
- PR #112 head: `c9a4c0ab2001f01a09632795283071c521e1c99d`; read-only controller run 43882090833 SUCCESS, 21/21 tests; contract run 43882090867 SUCCESS. Event-admission job skipped in PR run.
- PR #111/#112 have no formal reviews or inline review threads.

## Findings
- D1 proof adds transactional consume/outbox, logical task identity, immutable attempts, lease generation fencing, append-only events, indeterminate reconciliation queue, and current-lease guard.
- Legacy `task-lease.mjs` permits expired lease reclaim; newer `task-attempts.mjs` deliberately does not reclaim expired running/indeterminate attempts. Keep APIs separate; define one canonical state machine before integration.
- Reconciliation queue has no resolver; expired/indeterminate work remains blocked, fail-closed.
- Tests use local Workers-runtime SQLite/D1 emulation, not hosted D1 or production Supervisor.
- PR #112 validates event envelopes read-only; no durable admission, persistence or dispatch.
- No dispatch, provider call, secret read, merge, hosted D1 provisioning or deployment.

## Decision / next step
Do not merge or enable dispatch. Define a single canonical contract from trusted owner event to durable idempotent admission, approval consume + task/outbox, immutable attempt/lease, worker authentication and separately authorized reconciliation. Then implement and independently review the minimal integration on a clean immutable base.

Contour A NOT ACCEPTED. Contour B DEFERRED. Gemini dispatch NOT RUN.
