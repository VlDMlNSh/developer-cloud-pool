# Pass 36 — issuer-bound indeterminate reconciliation evidence

Date: 2026-11-21
Status: VERIFIED — local synthetic Workers/D1 proof and exact-head CI. Production trust qualification: NOT VERIFIED.

## Frozen target and lineage

- Default branch `Основной`: `7e76bd2ebba5e3a27ccd32ecf7f52c2d10178250`.
- Pass 35 parent: `83b8e9d3b0bdeeb201e24a7a9d2fe042fb00694a`.
- Implementation branch: `feat/pass36-issuer-bound-attempt-reconciliation-2026-11-21`.
- Final implementation HEAD: `9bbf3fabf1f9284c58c1dc69cf696d8f3ef4ba79`.
- Validation-only PR #166 merge checkout: `4b98be179411163f57051df567f4b3b424816311`, merging the implementation head into frozen default for CI only.
- Implementation PR #165: OPEN / DRAFT / UNMERGED, stacked on Pass 35.
- Validation PR #166: OPEN / DRAFT / UNMERGED, targets `Основной`; do not merge.

## Reuse research and decision

Reviewed mature transaction/recovery patterns before adding custom code:
- DBOS transactional outbox documents atomic persistence of application state and outbox/workflow progress, with idempotency keys for external effects: https://docs.dbos.dev/python/examples/outbox and https://www.dbos.dev/durable-execution
- River documents transactional enqueueing with the application database, avoiding a separate queue consistency boundary: https://github.com/riverqueue/river/blob/master/docs/README.md

These systems target Postgres/SQLite and are not drop-in D1 reconciliation authorities. Reused the existing D1 reconciliation queue created by migration 0005 and the existing pinned Workers/Vitest/Miniflare harness. No second queue, broker, coordinator, or new dependency was introduced.

## Implementation

Added migration `proofs/d1-ledger/migrations/0015_issuer_bound_reconciliation_decisions.sql`, blob `442db58f7c6ff0463e9a391572a1e45ebccc7df3`.

- Creates append-only `pool_attempt_reconciliation_decisions`.
- Enforces one decision per attempt/fencing generation and one use per issuer/JTI.
- SQL insert guard binds the decision to the exact pending reconciliation queue row, indeterminate attempt, current task pointer, original expired lease owner and generation.
- Update/delete are blocked.
- Capability is fixed to `pool.attempt.reconcile`.

Added `proofs/d1-ledger/src/record-attempt-reconciliation.mjs`, blob `3bf1302d5a773f9f3edf935ab869438f58f30123`.

The adapter:
1. Requires an injected verifier whose issuer and audience are pinned in trusted runtime configuration; the request cannot choose the trust policy.
2. Requires a separate injected trusted clock. Caller-supplied timestamps are not used for expiry checks or verification timestamps.
3. Validates exact task/attempt/generation binding, subject, JTI, capability, evidence digest, issued/expiry/observation times and outcome semantics.
4. Enforces a maximum 300-second evidence-token lifetime and a maximum 3,600-second evidence age.
5. Uses primary-first readback and accepts an ambiguous write only when the exact immutable decision is observed.
6. Returns `dispatch:false`, `executionAuthorized:false`, `stateChanged:false`, `retryAuthorized:false`.

Decision types:
- `safe_to_retry`: evidence says executor stopped and external effects are absent.
- `result_confirmed`: evidence includes result and provenance digests.
- `effects_unknown`: external effects remain explicitly unknown.

Critically, recording a decision does not mutate the task, attempt, lease, queue or outbox. It does not release the lease, create a new attempt, authorize a retry or launch execution. A separate owner-authorized transition is still required and is not implemented.

Added `proofs/d1-ledger/test/reconciliation.test.ts`, blob `8f689cb305c5830f855f2d147cdb7046c68a5254`, with six synthetic tests for successful evidence recording without state mutation, missing trusted clock, task/attempt mismatch, wrong capability, unsafe/expired claims, exact replay/conflicting ID, and append-only SQL enforcement.

Updated frozen schema upgrade proof through migration 0015:
- `proofs/d1-ledger/test/migration-upgrade.test.ts`, blob `a4c4e461bdf17b3f896b92e48c1b77589dc7c448`.
- `proofs/d1-ledger/README.md`, blob `fba6251c0f25cfafa6dd1bf4106752feac1a3883`.

## Exact-head CI evidence

Validation PR #166 tested implementation HEAD `9bbf3fabf1f9284c58c1dc69cf696d8f3ef4ba79` against frozen default `7e76bd2...`:

- Isolated D1 Ledger Proof: run [44881132353](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44881132353), job `136776444525`, COMPLETED / SUCCESS. Node 24.9.0, `npm ci --ignore-scripts --no-audit --no-fund`, inert Worker syntax check, 6 test files / 60 tests passed.
- Pool Contract Validation: run [44881132342](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44881132342), job `136776444551`, COMPLETED / SUCCESS. Six workflow YAML files parsed; shell interpolation/action SHA/inert-worker/supervisor guards passed; `POOL_CONTRACT_VALIDATION=PASS`; dispatch disabled.

A preceding D1 run [44880921488](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44880921488) failed 3 reconciliation tests (56/59 passed). Log review isolated an insert statement with 16 placeholders for 17 columns; the append-only tests then had no inserted row to exercise. The binding count was corrected, and final exact-head CI passed 60/60. The failed run is retained as evidence, not hidden.

## Security boundaries and remaining blockers

- Verifier and clock are injected test seams. No production OIDC signature verifier, trusted issuer/key registry, issuer rotation, or production capability provisioning exists. The synthetic verifier does not qualify cryptographic trust.
- No owner approval flow or state transition from a recorded reconciliation decision to a new attempt exists. A `safe_to_retry` record is evidence only, not retry authorization.
- Pass 35 `acquireAttemptLease` still accepts caller-supplied `input.now`; its trusted-clock gap remains OPEN. Pass 36 removes caller-supplied time only from the new reconciliation adapter.
- Adapter remains local proof code, not wired into the deployed Hono console, Supervisor, Worker or executor runtime.
- Hosted D1, production OIDC, cross-region behavior and actual executor termination/effect evidence remain NOT VERIFIED.
- PR #165 has zero formal reviews; independent review NOT VERIFIED. PRs #159/#161/#163 also remain open with no independent review observed.
- Default combined status lookup returned no status contexts; default CI NOT VERIFIED.
- Ruleset #26550182 was not re-read in this pass; do not infer current settings. No governance changes were made.
- Gemini controller is absent from default; Gemini and Claude NOT RUN. No secret values were read.

## Safety boundary

No hosted D1 provisioning/writes, secret reads, provider calls, GitHub dispatch, executor launch, deployment, merge, production mutation, paid resource, or governance change was performed.

## Next bounded pass

Pass 37: close the Pass 35 lease-adapter trusted-clock gap by injecting a trusted clock and rejecting missing/invalid time; add stale/future-clock and lease-expiry boundary tests, then run exact-head CI. Keep lease identity authentication injected and dispatch disabled. After that, qualify a production issuer verifier and separate owner approval before any reconciliation can authorize a new attempt.

Contour A remains BLOCKED / NOT ACCEPTED. Contour B remains DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
