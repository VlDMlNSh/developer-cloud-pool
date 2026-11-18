# Cloud Pool /next report — 2026-11-16 — D1 lease and read-only admission audit

## Scope and immutable targets
Repository: `VlDMlNSh/developer-cloud-pool`
Default-base SHA used by both proof PRs: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`
- PR #111 head: `687196738782432797bf394f1342cb9df19f478f`
- PR #112 head: `c9a4c0ab2001f01a09632795283071c521e1c99d`

## Exact-head evidence
PR #111:
- D1 proof run 43881396386: COMPLETED / SUCCESS.
- Node 24.9.0, npm ci from committed lockfile, syntax check passed.
- Workers-runtime: 37/37 tests passed (13 consume + 24 claim/outbox).
- Pool Contract Validation run 43881396272: SUCCESS.
- Lockfile artifact 14232471651, SHA-256 `08329cbcb0bb479760af4a9dbb7682472180e4bd4431ca2ffaa0cc18612c99d3`.
- Workflow job log read-back confirms the 37 passing tests and artifact upload.

PR #112:
- Read-only controller run 43882090833: SUCCESS, 21/21 tests.
- Pool Contract Validation run 43882090867: SUCCESS.
- In the PR run, `event-admission` job was SKIPPED; only the contract-tests job executed. Thus the event-envelope code has unit-test evidence, not an observed real `issue_comment` event execution.
- Both PRs have no submitted formal reviews and no inline review threads.

## D1 lease / attempt audit findings
1. Migration 0002 creates per-approval claim and outbox rows through a SQLite trigger coupled to the ready -> consumed transition. Adapter returns `dispatch: false`.
2. Migration 0003 introduces canonical logical task identity bound to repository ID, issue number, target SHA and profile. The trigger checks binding conflicts and creates a task-level outbox row.
3. Migrations 0004–0006 add immutable attempt identity, monotonic lease generation fencing, append-only attempt events, terminal projection, reconciliation records, and a database guard preventing prepared -> running without the matching current, unexpired lease.
4. `task-attempts.mjs` intentionally does NOT reclaim an expired running/indeterminate attempt. It requires explicit reconciliation because lease expiry alone does not prove the old executor stopped or external side effects did not occur.
5. `markAttemptIndeterminate` creates a pending reconciliation record through a trigger. No resolver or retry authorization is implemented. This is fail-closed, but means a task can remain blocked pending a future separately authorized reconciliation process.
6. `task-lease.mjs` is a separate legacy lease API with expiry reclaim and a five-acquisition cap. README explicitly warns not to mix it with the immutable attempt lifecycle. The two APIs must not be wired together without a single canonical state machine.
7. The proof is local Workers-runtime SQLite/D1 emulation. It is not hosted D1 persistence, a production Worker, worker identity authentication, production Supervisor integration, or exactly-once external side-effect protection.

## PR #112 admission audit
- Validates exact newly-created top-level `/next` comment, open Issue #96, repository full name and numeric ID, owner login and numeric ID, OWNER association, default-branch ref and event SHA.
- Workflow permissions are `contents: read`; it does not access secrets, persist admission, mutate GitHub or dispatch.
- Stable event identity derives from repository + Issue #96 + source comment ID.
- It is explicitly `READ_ONLY_NO_DISPATCH` and `executionAuthorized: false`.
- It consumes webhook payload fields; this proof does not itself provide durable one-shot reservation or bind the event to a D1 approval/claim.

## Integration decision
Do not merge either proof as a production controller yet. The minimum safe next step is a design/contract pass that defines one canonical state machine and transaction boundary:
- owner event envelope -> durable, idempotent admission record;
- admission bound to immutable repository/issue/target SHA/profile and trusted owner identity;
- atomic one-shot approval consume + logical task/outbox creation;
- one canonical attempt/lease generation model, avoiding simultaneous use of legacy `task-lease.mjs` and new `task-attempts.mjs`;
- expired/indeterminate attempts remain blocked until a separately authorized reconciliation decision;
- worker authentication and claim/finalize fencing;
- only after independent review, hosted persistence and recovery evidence may a later controller stage dispatch child jobs.

## Status
- PR #111 local proof: VERIFIED by exact-head CI.
- PR #112 read-only event-envelope proof: VERIFIED by exact-head unit tests; actual event job NOT VERIFIED (skipped in PR run).
- Formal independent reviews: none on either PR.
- Hosted D1 / durable production admission: NOT VERIFIED.
- Integrated controller / Gemini dispatch: NOT RUN.
- Contour A: NOT ACCEPTED.
- Contour B: DEFERRED.

## Sources
- PR #111: https://github.com/VlDMlNSh/developer-cloud-pool/pull/111
- PR #112: https://github.com/VlDMlNSh/developer-cloud-pool/pull/112
- D1 run: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43881396386
- D1 contract run: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43881396272
- Event controller run: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43882090833
- Event contract run: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43882090867
- Issue #96: https://github.com/VlDMlNSh/developer-cloud-pool/issues/96
