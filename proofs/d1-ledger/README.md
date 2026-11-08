# Isolated D1 single-use ledger proof

This package is a local-only proof of D1 transaction and conditional-consume behavior. It is not mounted in the Hono web console, the production Supervisor/Worker workflows, or any deployed Worker.

## Scope

- Uses the official Cloudflare Workers Vitest integration and local Miniflare/workerd runtime.
- Uses a synthetic D1 binding and local SQL migration.
- Tests concurrent first-consumer-wins, replay, immutable binding checks, expiry, malformed input, unavailable storage, ambiguous storage exceptions, D1 batch rollback, atomic trigger-backed claim-plus-outbox creation, deterministic retry identity, same-timestamp pre-consumed replay rejection, and rollback when outbox insertion fails.
- The consume and claim/outbox adapters return `dispatch: false` even on successful local proofs. The claim/outbox adapter conditionally consumes approval; a SQLite AFTER UPDATE trigger creates the durable claim and deterministic outbox event in the same transaction as the state transition. This prevents a previously consumed approval with a matching timestamp from being attributed to a later claim attempt. It has no GitHub, provider, dispatch, or secret integrations.

## Dependency policy

Direct development dependencies are exact-pinned in `package.json`:
- `@cloudflare/vitest-plugin@1.4.7`
- `vitest@4.1.12`

The repository includes a committed `package-lock.json` (lockfileVersion 3). The pull-request workflow uses `npm ci --ignore-scripts --no-audit --no-fund` directly against that lockfile; it does not regenerate the dependency graph. CI also uploads the resolved lockfile as a short-retention artifact for independent comparison. Keep the committed lockfile in sync with `package.json`; do not replace `npm ci` with a lockfile-generating install step.

## Run

From this directory, with Node.js 24:

```sh
npm install
npm test
```

## Explicit exclusions

No Cloudflare account API, D1 provisioning, billing, deployment, GitHub dispatch, provider/model call, OAuth, secret access, production integration, or Contour B work.

The migration helper is imported from the package public entrypoint (`@cloudflare/vitest-plugin`), matching the current official D1 Vitest fixture.

Final validation note: D1 proof CI completed successfully with 13/13 tests on the immediately preceding source revision; report metadata is also recorded in `docs/reports/2026-11-06-d1-ledger-proof-implementation.md`.

- Experimental logical-task identity migration (0003) introduces a canonical SHA-256 task key separate from approval IDs, permits multiple individually audited approvals to attach to one task, and enforces one task-level outbox row per task key. The `claimLogicalTask` adapter remains local-only and returns `dispatch: false`.
- This is an isolated proof extension, not a production schema decision. Lease acquire/renew/reclaim and generation fencing are implemented as a standalone local adapter; they are not integrated into production execution. Exact-head CI evidence is recorded separately.

- Experimental task lease proof (`src/task-lease.mjs`) adds conditional lease acquisition, expiry-based reclaim with monotonically incremented generation, generation/owner-fenced renewal, and generation/owner/expiry-fenced completion. It is not integrated into a Worker and cannot dispatch work.
- Added local runtime tests for reclaim generation increment, stale worker renewal/finalizer rejection, live-lease non-stealing, and expired lease renewal denial. These tests are authored but remain NOT RUN until exact-head CI returns.

- Hardening pass: task-key binding mismatch now raises a SQLite abort inside the approval-consumption trigger, rolling back the ledger transition rather than leaving a consumed unattached approval. Lease acquisition is capped at five attempts; an expired/pending exhausted task transitions to `dead` and its pending outbox row is dead-lettered in the same database trigger transaction.
- Added tests for conflict rollback and five-attempt dead-letter behavior. Treat these as pending validation until CI runs on the resulting exact head.


## Immutable logical-task attempt lifecycle (experimental)

Migration `0004_create_immutable_task_attempts.sql` and `src/task-attempts.mjs` add an isolated local proof for immutable execution attempts, separate from lease fencing:

- Each execution attempt has an immutable `attempt_id`, per-task `attempt_number`, input digest and unique execution idempotency key.
- Lease generation remains a fencing counter on the logical task. Lease takeover does not increment `attempt_number` or legacy `attempt_count`.
- An expired lease does not prove the previous executor stopped. Takeover is denied unless the caller explicitly declares the attempt resumable; an indeterminate attempt blocks both blind takeover and retry.
- Successful finalization, failed-attempt closure and task projection are committed through the same D1 statement/trigger transaction. A new retry creates a distinct attempt while retaining the old terminal row.
- Attempt events are append-only and locally persisted. They are not yet a production audit pipeline and do not prove exactly-once external side effects.
- All adapter responses retain `dispatch: false`. No provider, model, GitHub dispatch, secret, remote D1, or deployed Worker integration is present.

This is a proof extension only. The previous `attempt_count` field remains a legacy lease-acquisition counter for the older adapter; it is not backfilled into fabricated attempt history. The new adapter uses `attempt_number` and `pool_attempts`. Do not mix the old `task-lease.mjs` API with the new attempt lifecycle when assessing retry semantics.
