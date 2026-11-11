# Projection Recovery Actor Cross-Authority Audit — 2026-11-11

## Immutable scope

- PR #60: https://github.com/VlDMlNSh/developer-cloud-pool/pull/60
- PR head: `234fb2ee40265e26fac00c69ac1b6192766602cb`
- PR base: `864213e2ff5b4fa956ba405dea8137a44d812f49`
- PR state: OPEN / DRAFT / UNMERGED; GitHub mergeable=true is not acceptance.
- Capability contract blob: `59a4be21516da0e005114acfe015aee7787524dc`
- Issuer/time contract blob: `6c8bc0a06f8eb0f354da397ba2bd9629b348c90c`
- Formal PR #60 reviews: 0.
- This was a read-only contract/metadata audit. No runtime, issuer, clock, secret, deployment, database mutation, dispatch or provider call was performed.

## Findings

### R60-1 — Projection Recovery authority is correctly separated from task execution: DESIGN VERIFIED

The capability contract limits the Recovery Actor to one exhausted projection outbox row and explicitly prohibits:
- task retry/requeue/dispatch;
- task or attempt state mutation;
- changing target SHA, repository/issue binding, result/provenance digests or terminal task status;
- GitHub writes by the Recovery Actor.

It distinguishes Delivery Worker, Projection Recovery Actor and Task Supervisor/Worker. It also explicitly rejects reuse of the task Resolver grant as a projection recovery grant. This is a sound least-authority design boundary at document level.

### R60-2 — The grant is not a runtime capability and issuer is not operational: BLOCKED

The contract explicitly states that a caller-supplied actor string, `verified: true` object, TypeScript brand, workflow identity or D1 binding does not authenticate a capability. It requires either verification at the storage entrypoint or an opaque process-local capability minted by a trusted composition root.

The issuer/time interface contract further states that MediaHub Security Issuer Authority is only an owner-directed target in PR #599 / #600, both OPEN/DRAFT/UNMERGED in the referenced snapshot. No deployed issuer, service-principal registry, key custody/rotation, revocation source, policy epoch, or audit sink is evidenced. PR #60 has zero formal reviews. Therefore the contract cannot be implemented as an operational grant flow without inventing authority or credential ownership.

### R60-3 — Trusted time and revocation values are design targets, not qualified runtime guarantees

The issuer contract carries target defaults:
- maximum grant lifetime: 300 seconds;
- revocation freshness: no older than 30 seconds;
- generation must not roll back.

These are cross-project target requirements, not verified live service guarantees. The D1 adapter's caller-provided `now` remains a deterministic test seam only. The contract prefers database time in the same transaction, but explicitly requires testing exact local and hosted D1 semantics before relying on it. No production time source or revocation service is qualified.

### R60-4 — Atomic recovery transaction is well specified but not implemented

The capability contract requires one transaction to validate exact outbox/attempt/generation/scope, expired lease and exhausted attempts; consume a unique nonce; mark only the projection outbox dead-letter; and append one immutable event. Ambiguous commit must remain NOT VERIFIED. This is a clear acceptance target, but the PR is documentation-only and no implementation or hosted contention evidence was found in this audit.

### R60-5 — Supervisor task claim/finalization remains a separate unresolved authority problem

PR #60 does not solve Issue #38 or PR #37. Projection outbox recovery must not be used as a route to task claim recovery or task retry. PR #37 still has F2/F10 open: finalization lacks immutable envelope/claim fencing and terminal projection plus audit comment are separate side effects. Issue #38 rejects Issue label PATCH + Actions concurrency as an atomic single-winner claim. These need a separate task-claim authority and atomic finalization design; do not merge the two grant audiences.

### R60-6 — Independent review and governance: NOT VERIFIED

PR #60 is OPEN/DRAFT/UNMERGED with zero formal reviews. PR #37 formal CHANGES_REQUESTED reviews remain on record against earlier reviewed heads; current head has no observed approval. Current effective mandatory-approval governance is not verified in this pass. Historical ruleset evidence has zero required approving reviews and cannot be treated as current enforcement.

## Disposition

- PR #60: keep DESIGN / PROPOSED / NOT IMPLEMENTED / NOT QUALIFIED.
- Do not add runtime code, credentials, issuer endpoints, production time authority, recovery routes, D1 binding exposure or dispatch authority.
- Do not reuse Task Resolver or Supervisor grants for projection recovery.
- Keep all dispatch gates fail-closed.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next bounded step

Treat the issuer and trusted-time contracts as upstream governance dependencies, not a coding task. Reconcile their status against the actual MediaHub PR #599/#600 and owner-selected Security Issuer Authority target; until that authority is accepted and operationally evidenced, keep PR #60 documentation-only. In parallel, continue the separate PR #37 F2/F10 task-claim/finalization design against Issue #38's durable claim decision. No dispatch or production recovery should be enabled.
