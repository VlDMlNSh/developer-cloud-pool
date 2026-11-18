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
- Attempt events are append-only and locally persisted with the lease actor and generation captured at acquisition, indeterminate transition, and finalization. They are not yet a production audit pipeline and do not prove exactly-once external side effects.
- All adapter responses retain `dispatch: false`. No provider, model, GitHub dispatch, secret, remote D1, or deployed Worker integration is present.

This is a proof extension only. The previous `attempt_count` field remains a legacy lease-acquisition counter for the older adapter; it is not backfilled into fabricated attempt history. The new adapter uses `attempt_number` and `pool_attempts`. Do not mix the old `task-lease.mjs` API with the new attempt lifecycle when assessing retry semantics.


## Migration 0006 — running-state lease guard

Migration `0006_guard_running_attempt_requires_lease.sql` adds a database-level invariant: a prepared attempt cannot transition to `running` unless its task already has the matching current attempt pointer, lease attempt pointer, non-empty lease owner, positive fencing generation, and unexpired lease. The existing task-lease-acquired trigger satisfies this condition when it projects a legitimate lease into the attempt row.

The adversarial regression test in `test/claim-outbox.test.ts` verifies both sides: direct `prepared -> running` without a lease is rejected and leaves the attempt unchanged; the normal `acquireAttemptLease` path transitions it to `running` with generation 1.

This is a local SQLite/D1 integrity guard, not worker authentication or production dispatch authorization. It does not replace trusted identity binding at the Issue #96 controller boundary.


## Executor identity binding (migration 0007)

Migration `0007_bind_executor_identity.sql` adds an explicit executor instance identity to approval, logical task, and immutable attempt records. Accepted IDs are `claude-code-N`, `codex-N`, and `gemini-N` with a positive numeric suffix. `profile` remains the independent capability profile (`dsh-headless-probe`); it is not an executor identity. The canonical logical task key includes `executor_id`, so separate executor instances cannot silently coalesce into one task. Database triggers reject missing/mismatched identities and prevent reassignment after insertion. Existing historical proof rows are left NULL rather than guessed or backfilled to a particular executor. New inserts must supply an explicit executor ID. All of this remains local-only and `dispatch: false`.


## Trusted executor registry lookup (local-only boundary proof)

`src/trusted-executor-registry.mjs` implements a read-only GitHub API resolver. It first reads the repository's configured default-branch HEAD from the branches API, then reads `.github/pool-executor-registry.json` pinned to that exact commit SHA. It validates repository ID, default branch, executor ID, enabled status, and the requested capability profile. It does not trust a `trustedDefaultHeadSha` copied from `GITHUB_SHA` or a task payload.

The PR adds `.github/pool-executor-registry.json` as an owner-controlled registry scaffold with an empty `executors` array. No executor is registered or enabled. Until this PR is reviewed and the registry is present on the trusted default branch, the resolver fails closed; after merge, every executor still remains ineligible until an owner explicitly adds and reviews an enabled entry. The resolver's positive tests use synthetic API responses only.

A successful result means only that the requested executor assignment is present in the owner-controlled registry snapshot. It does **not** attest the identity of the running process, authenticate a worker, authorize execution, or enable dispatch. Repository branch protection / review policy must protect the registry. The adapter accepts an injected fetch implementation and optional token; this proof stores no token or secret and performs no remote API call in CI. Every result keeps `executionAuthorized: false` and `dispatch: false`.


## GitHub Actions OIDC workflow authentication (local-only proof)

- `src/github-actions-oidc-verifier.mjs` verifies an RS256 JWT signature against GitHub Actions' published OIDC JWKS, then checks issuer, audience, expiry/not-before/issued-at, repository and owner IDs, exact subject, workflow ref, and reusable-workflow ref.
- `src/trusted-executor-auth.mjs` composes the independent default-branch registry lookup with OIDC verification. The expected OIDC claims come from the same owner-controlled registry entry, not from the caller.
- Each future registry entry must include an `oidcBinding` with exact `audience`, `subject`, `workflowRef`, and `jobWorkflowRef`. The current registry remains empty; no workflow principal is enabled.
- Tests generate ephemeral RSA keys and synthetic JWT/JWKS fixtures. CI does not request a real OIDC token or access production credentials.

**Security boundary:** a valid token authenticates the GitHub Actions workflow/job principal represented by the claims. It does not attest the Claude Code/Codex/Gemini executable, its host, or its runtime process. Any process able to obtain the job's OIDC token shares that workflow principal. Stronger process/host attestation remains unresolved and requires a separately designed trusted runner/identity mechanism. The verifier never sets `executionAuthorized` or `dispatch` to true.
