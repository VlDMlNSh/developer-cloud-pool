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


## Follow-up audit — 2026-11-16 21:40 Europe/Vilnius

- Fresh default HEAD: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Default workflow tree does not contain a Cloud Pool-native Gemini batch controller.
- Ruleset #26550182 is active on `refs/heads/Основной`, but requires 0 approvals and no status checks; do not treat this as independent review enforcement.
- PR #111 exact-head run 43881396386/job 133347908331: 37/37 tests; artifact 14232471651 SHA-256 independently verified: `08329cbcb0bb479760af4a9dbb7682472180e4bd4431ca2ffaa0cc18612c99d3`.
- PR #112 exact-head run 43882090833: predicate 21/21; event-admission job 133350345738 SKIPPED. Real webhook admission NOT VERIFIED.
- New audit findings and evidence comments: #111 comment 6925663082; #112 comment 6925663801. Legacy expiry-reclaim API and immutable attempt API coexist; worker identity remains caller-supplied; no source-comment durable admission receipt or atomic admission+approval+task+outbox boundary exists.
- Detailed report: [atomic admission integration audit](../reports/2026-11-16-next-atomic-admission-integration-audit.md).
- Decision: do not merge or compose #111/#112 directly. Next is a separate clean-base no-secret integration implementation from the immutable default SHA. Dispatch remains disabled.

- Atomic-admission audit report blob SHA: `72bf1408affd33af3e18340cdd8051591e5a341f`. Documentation remains confined to the unmerged PR #113 branch; no workflow runs were returned for the documentation-only commits.
