# Pass 32 — D1 ambiguous batch outcome and primary-first readback — 2026-11-20

## Frozen target and repository state

- Default branch `Основной`: `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5` (re-read; unchanged).
- Pass 31 implementation parent: `b90f386814436552f9e4b0c2b54050731cb9859e`.
- Pass 32 final implementation HEAD: `ae0bf4fce7e4fb3a2482603bad2c940eff0a555a`.
- Intermediate implementation commits: `ed7e4db0eb5f4cbce2ac2f50df2bd78e8d6aea9a` (initial change), `6a93c8dbbd9f93e109ab90b99a8e0c056e7ec05a` (test-contract correction).
- PR #157 implementation: OPEN / DRAFT / UNMERGED, stacked on `feat/pass27-atomic-admission-executor-v2-2026-11-19`.
- PR #158 validation-only: OPEN / DRAFT / UNMERGED, targets `Основной`; do not merge.
- PR #154/#156 Pass 31 remain OPEN / DRAFT / UNMERGED. PR #155 closed/superseded.

## Mature-project and component assessment

### Adopted/reused

- `cloudflare/workers-sdk`: official Cloudflare Workers SDK repository; Apache-2.0, not archived, actively updated 2026-11-20. Its maintained D1 Vitest fixture demonstrates the supported `@cloudflare/vitest-plugin`, `readD1Migrations`, and `applyD1Migrations` setup.
- The Cloud Pool already uses the same official Workers Vitest integration (`@cloudflare/vitest-plugin@1.4.7`) and D1 migration setup. Pass 32 keeps that dependency and extends the existing test harness; no duplicate testing framework or extra dependency was introduced.
- Cloudflare D1's official binding contract documents that `batch()` statements execute sequentially as one SQL transaction and the sequence is rolled back if a statement fails.
- Cloudflare D1 Sessions documentation explains asynchronous replica lag and `withSession("first-primary")` for starting a sequentially consistent session at the primary.
- `temporalio/sdk-typescript` (MIT, active) and Temporal's official idempotency/retry guidance were reviewed as design references. Temporal is NOT integrated: adding a separate workflow service/runtime would exceed the narrow D1 transaction-proof scope and introduce unnecessary infrastructure/dependencies.

Sources:
- https://github.com/cloudflare/workers-sdk
- https://github.com/cloudflare/workers-sdk/tree/main/fixtures/vitest-plugin-examples/d1
- https://developers.cloudflare.com/d1/worker-api/d1-database/
- https://developers.cloudflare.com/d1/best-practices/read-replication/
- https://github.com/temporalio/sdk-typescript
- https://docs.temporal.io/activity-definition

## Finding

Before Pass 32, the admission adapter used direct `db.prepare(...).first()` reads before/after a D1 batch and mapped every exception to a rollback-or-ambiguous denial. This did not explicitly require primary-first read-after-write verification and did not resolve a lost batch acknowledgement by checking whether the transaction had actually committed.

## Implementation

Changed:
- `proofs/d1-ledger/src/admit-qualified-task.mjs`
- `proofs/d1-ledger/test/atomic-admission.test.ts`
- `proofs/d1-ledger/README.md`

Behavior:
1. Prior-admission reads and exact replay validation use `db.withSession("first-primary")`.
2. Post-batch durable readback starts a fresh primary-first session.
3. If `batch()` throws or the success readback fails, the adapter starts a new primary-first session and reads the full immutable admission/approval/task/executor/attempt/route/receipt/outbox tuple.
4. It returns `ADMISSION_ALREADY_COMMITTED` only when all identity fields, receipt assertion, pending task-ready outbox, current attempt tuple, prepared attempt state, dispatch-disabled flags and current route qualification match.
5. If no complete durable state can be confirmed, it returns `ADMISSION_OUTCOME_UNCONFIRMED`; it does not claim rollback. Callers must retain the same immutable admission identity for retry/reconciliation and must not mint a new one.
6. Pre-admission read failure returns a distinct fail-closed denial.
7. Dispatch remains disabled.

Fault injection:
- Batch commits locally, then its acknowledgement is deliberately lost: primary readback resolves the durable admission and returns already-committed; one attempt remains.
- Batch fails before commit: outcome remains unconfirmed; approval remains ready; exact same-key retry can create one admission/attempt.
- Primary readback unavailable after commit: fail closed as outcome-unconfirmed; a subsequent exact retry finds the one durable admission.
- Existing revoked-route negative test now expects outcome-unconfirmed rather than asserting rollback based only on a caught error.

No dependency changes, migration changes, workflow filter changes, permission changes, ruleset changes or governance changes.

## Exact-head CI

Final implementation HEAD: `ae0bf4fce7e4fb3a2482603bad2c940eff0a555a`.

- D1 run [44703757450](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44703757450), job `136178133556`: COMPLETED / SUCCESS.
- Exact run head SHA equals final implementation HEAD. Job log confirms checkout of the PR merge revision against default `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5` (checkout line begins `badba84`).
- `npm ci`, inert Worker syntax check and local Workers-runtime D1 tests completed.
- Test summary: 4 files passed; 39 tests passed; 0 failed. Atomic admission suite: 15 tests.
- Pool Contract Validation [44703757544](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44703757544), job `136178133732`: COMPLETED / SUCCESS; `POOL_DISPATCH_ENABLED=false`; all six workflow YAML files parsed; `POOL_CONTRACT_VALIDATION=PASS`.
- Initial run [44703493347](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44703493347) failed 1/39 because an existing revoked-route test expected the old rollback reason. The code's new unresolved-outcome reason was correct; test expectation was updated. Intermediate corrected run [44703595383](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44703595383) passed 39/39; final state-validation amendment was then checked again by final run 44703757450.
- Initial Pool Contract run [44703493152](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44703493152) and corrected run [44703595403](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44703595403) also passed.

Final blob SHAs:
- Adapter: `9943d6dc8ba5602eec48bc9edf121c1db9d189d2`.
- Atomic admission tests: `4a8184a5fd08fd3bcbb43920aa7a57270d301524`.
- D1 proof README: `08a67c701dc07ee89e2416401bf526bdc68503b1`.

## Validation boundary and caveats

- Local Miniflare/Workers Vitest fault-injection proof: VERIFIED by final exact-head CI.
- D1 primary-first session API use in local Workers runtime: VERIFIED by tests.
- Live Cloudflare D1 with read replication enabled, real network acknowledgement loss, and deployed read-after-write behavior: NOT VERIFIED.
- The absence of a readback row after a transport error is intentionally treated as OUTCOME_UNCONFIRMED, not proof of rollback; retry must preserve the same admission identity.
- Hosted D1 mutations, credentials/secrets, provider calls, dispatch, executor launch, deployment, merge and production writes: NOT RUN.
- Independent review: NOT VERIFIED.
- Gemini/Claude dispatch: NOT RUN. Gemini controller workflow remains absent from default branch. No secret values were read.

## Current PRs, Issues and governance

- PR #157 implementation and #158 validation-only: OPEN / DRAFT / UNMERGED. Do not merge.
- PR #154 and #156 Pass 31 remain OPEN / DRAFT / UNMERGED.
- Issue #140 OPEN; Issue #151 OPEN / PLANNED.
- Default HEAD unchanged at `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- Active ruleset #26550182 unchanged: exact target `refs/heads/Основной`; PR required; review-thread resolution required; deletion/non-fast-forward prohibited; zero required approvals; no bypass actors.
- Contour A remains BLOCKED / NOT ACCEPTED. Contour B remains DEFERRED.

## Next

Pass 33 candidate: full SQL/trigger audit for receipt/outbox uniqueness, append-only enforcement, attempt/admission/evidence binding and concurrent/failure-state transitions. Start with independent review of PR #157 if an approved independent reviewer becomes available; otherwise label self-review NOT INDEPENDENT and keep independent qualification outstanding. Continue to avoid hosted D1 writes and dispatch.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
