# Isolated D1 single-use ledger proof

This package is a local-only proof of D1 transaction and conditional-consume behavior. It is not mounted in the Hono web console, the production Supervisor/Worker workflows, or any deployed Worker.

## Scope

- Uses the official Cloudflare Workers Vitest integration and local Miniflare/workerd runtime.
- Uses a synthetic D1 binding and local SQL migrations.
- Tests concurrent first-consumer-wins, replay, immutable binding checks, expiry, malformed input, unavailable storage, ambiguous storage exceptions, D1 batch rollback, atomic trigger-backed claim-plus-outbox creation, deterministic retry identity, same-timestamp pre-consumed replay rejection, lease reclaim/fencing, and rollback when outbox insertion fails.
- The consume, claim/outbox, lease, and result adapters return `dispatch: false`. No adapter performs a GitHub, provider, or other external call.
- The logical-task adapter conditionally consumes approval; a SQLite AFTER UPDATE trigger creates the durable task and task-ready outbox event in the same transaction.
- The lease adapter uses a unique per-acquisition token, not only a reusable worker ID, for readback.
- The result adapter accepts one immutable result only while task key, worker, generation, attempt token, and lease expiry all match. A trigger completes the task and creates one deterministic result-effect outbox row atomically. A failed outbox insert rolls back the result and completion.
- The result outbox is only a durable intent. There is deliberately no dispatcher or external side-effect executor in this proof.

## Dependency policy

Direct development dependencies are exact-pinned in `package.json`:
- `@cloudflare/vitest-plugin@1.4.7`
- `vitest@4.1.12`

The repository includes a committed `package-lock.json` (lockfileVersion 3). The pull-request workflow uses `npm ci --ignore-scripts --no-audit --no-fund` directly against that lockfile; it does not regenerate the dependency graph. CI also uploads the resolved lockfile as a short-retention artifact for independent comparison. Keep the committed lockfile in sync with `package.json`; do not replace `npm ci` with a lockfile-generating install step.

## Run

From this directory, with Node.js 24:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run check
npm test
```

## Explicit exclusions

No Cloudflare account API, D1 provisioning, billing, deployment, GitHub dispatch, provider/model call, OAuth, secret access, production integration, or Contour B work.

The migration helper is imported from the package public entrypoint (`@cloudflare/vitest-plugin`), matching the current official D1 Vitest fixture.

## Lease acquisition-attempt fencing experiment (2026-11-18)

Migration `0004_add_lease_attempt_identity.sql` adds a nullable `lease_attempt_id` and lookup index. Each successful conditional acquisition writes a fresh UUID and reads back only by task key plus that UUID. Same-worker reclaim between UPDATE and SELECT therefore makes the earlier call fail closed.

## Fenced result and transactional effect-intent experiment (2026-11-18)

Migration `0005_create_fenced_task_result_outbox.sql` adds immutable task results and a result-effect outbox. `commitTaskResult` inserts only when the exact lease tuple is current and unexpired: task key, worker ID, generation, and acquisition-attempt UUID. The insert trigger rechecks that tuple, atomically marks the task completed, clears lease ownership, and creates one deterministic outbox intent. The unique task result and effect ID make identical retries idempotent and conflicting result substitution fail closed.

Tests cover stale worker rejection after same-worker reclaim, current worker acceptance, duplicate retry, result substitution, and rollback if outbox insertion fails. This proves only the local durable commit boundary. It does not prove an external provider or GitHub side effect, because no dispatcher exists and all adapters keep `dispatch: false`.
