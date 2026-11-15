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


## Terminal projection delivery proof (local-only)

- Migration 0009 makes the projection outbox identity immutable across updates: outbox ID, task/attempt binding, repository/issue, target SHA, profile, attempt lease generation, terminal outcome and event digest. Delivery state and fenced lease fields remain mutable.
- `createProjectionDeliveryOrchestrator` is the only public delivery boundary. It owns lease acquisition/read-back, envelope derivation, fake GitHub reconciliation, exact event/digest verification, private conditional ACK and D1 read-back. The receipt-free ACK helper is not exported.
- The local Workers-runtime tests cover verified delivery, missing/ambiguous projection, conflicting marker digest, expired lease, takeover by a newer delivery generation, concurrent calls, and immutable event-digest enforcement. All responses retain `dispatch: false`.
- This remains an isolated proof. Runtime identity/clock qualification, live GitHub behavior, hosted D1 and deployment are not implemented.


## A0 admission contract harness (isolated; not production wiring)

- `src/a0-admission-contract.mjs` defines a fail-closed contract for immutable task/attempt binding, owner-approval verification, single-use capability consumption, allowed cost classes, quota-domain evidence and queue-only behavior while dispatch is disabled.
- `test/a0-admission-contract.test.ts` exercises missing/invalid approval provenance, capability replay, paid/unknown cost classes, forbidden provider routes, missing/unverified quota evidence, malformed identity and the no-dispatch invariant.
- The tests use injected in-memory authority adapters. They prove the contract behavior only; they do **not** qualify cryptographic signature verification, durable atomic replay protection, quota-provider truth, trusted time, or production integration. The module is not mounted in the Supervisor or Worker.
- Existing D1 attempt tests remain the local proof for generation fencing, stale finalizer rejection, expiry handling and bounded task-attempt behavior. This A0 contract is not a substitute for connecting those controls to one authoritative durable admission transaction.


## Qualified Route Evidence verifier proof — 2026-11-15

The stacked verifier proof on PR #75 adds:
- Fixed-position canonical v1 evidence bytes and SHA-256 test vector.
- Detached ES256 signature verification against an explicitly supplied issuer-key snapshot.
- Exact route/account/quota-domain/capability/registry/revocation binding, 300-second freshness, expiry and key validity checks.
- Adversarial tests for signature tampering, issuer/key substitution, cross-account/domain replay, stale/expired evidence, revocation watermark mismatch, unknown fields and missing free-quota domain.

The verifier is an isolated cryptographic component, not a trust-root manager. The caller-supplied registry snapshots are not authoritative merely because they are structurally valid. Trusted registry loading, issuer key custody/rotation, durable revocation authority and atomic D1 version re-check remain unimplemented. Dispatch remains false; no provider call, secrets, hosted D1, deployment or merge.


## Root-signed route registry bundle proof — 2026-11-15

The isolated module `src/trusted-route-registry.mjs` verifies a versioned registry bundle using a public P-256 root key loaded from platform environment bindings (`ROUTE_REGISTRY_ROOT_KEY_ID` and `ROUTE_REGISTRY_ROOT_PUBLIC_JWK`). The root public key is not accepted from the request or bundle.

- Fixed-position canonical JSON bundle v1; exact top-level and nested key allowlists.
- Issuer-key and route records must be uniquely and lexicographically ordered; duplicate/unsorted records fail closed.
- Root detached ES256 signature authenticates the complete issuer-key set and all route evidence/signatures.
- Each route evidence record is then independently verified against the issuer key inside that root-signed bundle using the existing canonical evidence verifier.
- Bundle freshness is capped at 300 seconds and bundle lifetime at one hour.
- Registry version, issuer key ID, route/account/credential/quota/capability identity and issuer signature are bound. Output is immutable and retains `dispatch: false`.

This is an isolated cryptographic bundle verifier only. It does NOT persist registry state, enforce monotonic registry epochs across requests, prevent replay/rollback against a durable watermark, provide root-key rotation/custody, or bind registry epoch into the D1 admission transaction. The platform environment binding is a trust anchor only when deployment/configuration permissions and its value are independently controlled. No production root key is configured by this proof. No live provider, secret, hosted D1 or Worker deployment is used.


## Root-signed route registry bundle proof — 2026-11-15

The isolated module `src/trusted-route-registry.mjs` verifies a versioned registry bundle using a public P-256 root key loaded from platform environment bindings (`ROUTE_REGISTRY_ROOT_KEY_ID` and `ROUTE_REGISTRY_ROOT_PUBLIC_JWK`). The root public key is not accepted from the request or bundle.

- Fixed-position canonical JSON bundle v1; exact top-level and nested key allowlists.
- Issuer-key and route rows must be uniquely and lexicographically ordered; duplicate/unsorted records fail closed.
- Root detached ES256 signature authenticates the complete issuer-key set and all route evidence/signatures.
- Each route evidence record is independently verified against the corresponding issuer key from that root-signed bundle using the existing canonical evidence verifier.
- Bundle freshness is capped at 300 seconds and bundle lifetime at one hour.
- Output is immutable and retains `dispatch: false`.

This is an isolated cryptographic bundle verifier only. It does NOT persist registry state, enforce monotonic registry epochs across requests, prevent replay/rollback against a durable watermark, provide root-key custody/rotation, or bind registry epoch into the D1 admission transaction. The platform environment binding is a trust anchor only when deployment/configuration permissions and its value are independently controlled. No production root key is configured by this proof. No live provider, secret, hosted D1 or Worker deployment is used.


## Durable root-signed route registry persistence — 2026-11-15

Migration `0013_persist_verified_route_registry.sql` and `persistTrustedRouteRegistryBundle` add a local D1 persistence adapter for the verified root-signed registry:

- Re-verifies the root signature against platform-bound root key ID/JWK before writing.
- Stores the exact registry bundle JSON and root signature alongside the immutable snapshot digest and metadata.
- Persists issuer key records in a normalized append-only table, bound to the snapshot epoch and digest.
- Persists each verified route qualification with issuer key ID, registry epoch and bundle digest; insert triggers reject partial or mismatched bindings.
- Inserts the snapshot, issuer keys, route qualifications and advances the singleton active pointer in one D1 batch. A failed route insert must roll back the snapshot and pointer changes.
- Exact retries return the existing persisted snapshot; conflicting reuse of an epoch is denied. Every response remains `dispatch: false`.

**Important remaining boundary:** this writer is not yet wired into `admitQualifiedTask`. The A0 admission SQL still needs to re-check the active snapshot pointer, route snapshot binding, issuer-key status/validity and revocation watermark inside the same D1 batch that consumes approval and writes the attempt/outbox/receipt. Therefore this persistence proof does not qualify a route for production admission. No hosted D1, provider call, secret read, dispatch or deployment is included.


## Atomic admission bound to the active durable registry — 2026-11-15

The local A0 adapter now requires every route qualification to carry the exact issuer key ID, registry epoch and registry bundle digest written by the root-signed registry persistence adapter. Inside the same D1 batch as approval consumption, task/outbox binding, attempt creation and commit receipt, it re-checks:

- the route qualification's immutable registry binding;
- the singleton active registry pointer and exact snapshot epoch/digest/version;
- snapshot acceptance and validity window;
- issuer ID + key ID + registry version;
- issuer-key active status, revocation state and validity interval;
- route evidence freshness, validity and revocation version.

The receipt assertion repeats the active snapshot and issuer-key checks, so a missing or stale registry binding cannot yield a committed receipt. Exact retry performs the same active trust checks before returning an existing receipt. Dispatch remains hard-coded false.

The atomic-admission test fixtures now seed registry-bound route rows. Added adversarial cases reject a stale epoch and a revoked issuer key without consuming approval. Synthetic fixture registry records are test-only; the separate registry persistence suite proves root-signature verification and atomic durable writing. This remains a local proof, not a live provider or production trust qualification.


Migration `0014_atomic_admission_registry_assertion.sql` adds an immutable `pool_admission_registry_assertions` row with a database trigger that requires the exact active registry snapshot and active, unrevoked, currently valid issuer key. `admitQualifiedTask` inserts this assertion as the first statement of the same D1 batch as approval consumption and the task/attempt/outbox/receipt writes. Any later batch failure rolls the assertion back as well. The receipt binds to that assertion; exact retries independently re-check the current snapshot and issuer-key validity with a compact join query.
