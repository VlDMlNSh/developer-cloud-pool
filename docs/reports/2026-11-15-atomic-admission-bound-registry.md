# Atomic A0 admission bound to durable route registry — 2026-11-15

## Scope and immutable target

This pass composes the durable root-signed route registry ledger (PR #81) with the local A0 → D1 admission proof. The key requirement is that a route may not consume a single-use approval unless the route's exact registry snapshot is still active and its issuer key is active, unrevoked and within its validity window at admission time.

- Implementation branch: `proof/atomic-admission-bound-registry-2026-11-15`.
- Final implementation HEAD: `a2e02471438104a5502d505995912c9eedb06480`.
- Parent branch / PR #81 HEAD: `68ccf7b5b11857c00c9b5c4250bf95bac361468a`.
- PR #83: https://github.com/VlDMlNSh/developer-cloud-pool/pull/83
- PR #83 was closed by repository owner at 2026-11-15T11:47:29Z after the exact-head Actions run completed successfully. It remains closed; no reopen or replacement PR was created in this pass.

## Implementation

Migration `0014_atomic_admission_registry_assertion.sql` creates an immutable `pool_admission_registry_assertions` ledger and a database guard trigger.

The first statement of `admitQualifiedTask` inserts the admission's registry assertion. The trigger requires, in one SQL guard:
- the exact route qualification, evidence digest, issuer ID and issuer key ID;
- exact registry epoch, bundle digest and registry version;
- the active singleton registry pointer to match that snapshot;
- the durable snapshot to be accepted and not expired;
- the issuer key to be active, unrevoked and within its validity interval;
- the route evidence to be qualified, unrevoked, fresh and unexpired.

The assertion insert, approval consumption, existing task/outbox binding, attempt creation and commit receipt are in the same D1 batch. Any failure later in the batch rolls the assertion and all preceding writes back. The receipt binds to the assertion row; exact retry uses a separate compact join against the currently active snapshot and issuer key, so it cannot return an old receipt after the registry advances or the key is revoked.

The route qualification matching used by approval consumption and admission insertion still checks the complete route/account/capability/evidence binding. All outputs keep `dispatch:false`.

The atomic-admission test fixture now creates a fresh monotonically increasing registry epoch per test, rather than assuming a clean D1 database. This is required because the Workers test suite shares the D1 binding across test files and earlier registry tests leave durable state behind.

## Adversarial coverage

- Stale route registry epoch: denied before approval consumption.
- Revoked issuer key in the active registry: denied before approval consumption.
- Revoked route evidence: denied.
- Stale evidence: denied.
- Account/evidence substitution: denied.
- Single-use replay: exact retry returns the durable receipt; changed bindings are denied.
- Attempt insert failure: entire batch rolls back.
- Concurrent admission: only one single-use approval is admitted.
- Existing task/outbox immutability remains enforced.

The stale-epoch test exercises a route bound to a non-active epoch. A deterministic interleaving test for an epoch advance racing the admission batch is still outstanding; the D1 batch serialization boundary is not independently stress-qualified.

## Exact-head verification

Final exact-head Actions run [43710565281](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43710565281), job `132800985815`:
- COMPLETED / SUCCESS.
- Syntax validation: PASS.
- Workers Runtime: 11 test files, 118 tests PASS / 0 FAIL.
- Second local D1 binding / migration API smoke: PASS.
- Frozen schema-0010 fixture upgrade smoke: PASS.
- Lockfile artifact upload: PASS.
- Artifact ID `14160202640`, SHA-256 `65c6812eacf6d20ae59ff62cae114ecd792e730712d34e9abc837b4d3fd85d03`.

Exact final file blobs:
- Migration 0014: `cb8a47d83faba62981daa8f7320da87baa2c55e2`.
- Admission source: `00e9042ccdbf04cd4ecaf6fbda3c982cf72136ed`.
- Atomic admission tests: `0bd28c6e0af6d416a256bf529c2ff1b735e24ae4`.
- D1 README: `c7d78c857c15cdf67009af51cdb9beff8d87d430`.
- Validation workflow: `c6d9212666a628f918d95b419a97d4294836b488`.

Earlier exact-head runs exposed two defects which were repaired before final SUCCESS:
1. D1 expression-tree depth exceeded SQLite's maximum when the registry joins were duplicated inside the full commit-receipt assertion. The registry check was moved to a dedicated guarded assertion row at the start of the same D1 batch; the receipt binds to that immutable row and the retry path uses a compact join.
2. Test files shared durable D1 state. The atomic admission fixture was updated to advance to a new monotonic registry epoch and synchronize its timestamp for every test, and the revoked-key fixture now advances from the actual active epoch.

## Governance and integration boundary

- PR #83 is CLOSED by repository owner; it is not merged.
- PR #83 formal reviews: 0; inline review threads: 0.
- Combined commit status contexts: 0 / NOT VERIFIED; exact-head GitHub Actions run is SUCCESS.
- PR #81 remains OPEN / DRAFT / UNMERGED.
- Documentation PR #79 remains OPEN / DRAFT.
- Current default `Основной`: `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`.
- Default → implementation HEAD: DIVERGED, 125 ahead / 64 behind; merge base `221f216c00ca7e5596bcc682ba185ad155a10603`. This is a stacked proof branch; do not merge or transplant its history wholesale.
- Active repository ruleset `26550182` applies to `Основной`, blocks deletion/non-fast-forward, and requires PR thread resolution. It does not impose a positive approval count; no bypass actors are configured.
- No hosted D1, provider calls, secret reads, deployment, Supervisor/Worker execution, dispatch, merge or independent acceptance.

## Status and next step

- Durable root-signed registry persistence: IMPLEMENTED / exact-head CI VERIFIED.
- Registry-bound A0 admission: IMPLEMENTED in local proof / exact-head CI VERIFIED.
- Epoch-advance race interleaving and independent security review: NOT VERIFIED.
- Production/hosted D1 qualification: NOT RUN.
- Contour A: IN PROGRESS / NOT ACCEPTED.
- Contour B: DEFERRED.

Next: reconcile the verified migration/source/test changes selectively onto a fresh branch from current default, without importing the divergent 125/64 proof stack. Then add an explicit epoch-advance race test, verify the exact-head CI on the clean integration branch, and only after integration move to hosted D1 qualification. Keep dispatch disabled.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
