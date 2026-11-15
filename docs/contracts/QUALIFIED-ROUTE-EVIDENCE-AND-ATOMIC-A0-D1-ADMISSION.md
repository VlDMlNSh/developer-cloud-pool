# Qualified Route Evidence and Atomic A0/D1 Admission Contract

**Status:** IMPLEMENTED IN ISOLATED PROOF / NOT QUALIFIED  
**Date:** 2026-11-15  
**Contour:** A only  
**Dispatch:** MUST remain disabled

## 1. Purpose

Define the minimum evidence and transaction boundary required before a provider route can be admitted to a Cloud Development Pool task. This contract closes the gap between the pure quota ledger selector, the isolated A0 admission evaluator, and the isolated D1 approval/task/attempt/outbox proof.

This document is normative for subsequent implementation. It does not authorize provider calls, dispatch, deployment, or production use.

## 2. Trust boundaries

The following values are not authority by themselves:

- inventory declarations such as `declared_cost_class: free`;
- a caller-supplied route ID, provider ID, quota-domain ID, or billing class;
- presence of a credential handle or repository secret;
- a local quota-ledger state transition;
- a successful pure `verifyQuotaEvidence` callback whose implementation and provenance are not qualified;
- a successful isolated D1 proof test.

A route selector is a filter, not an authorization authority. Admission must resolve the requested route against a trusted, versioned qualification record.

## 3. QualifiedRouteEvidence record

The admission adapter must accept one immutable, schema-versioned evidence record with at least:

| Field | Requirement |
|---|---|
| schemaVersion | Exact supported integer version |
| qualificationId | Unique stable ID for this qualification revision |
| routeId | Exact route registry key |
| providerId | Canonical provider identity |
| modelId | Exact allowed model identifier |
| issuerId | Authority that issued the qualification |
| accountRef | Opaque, non-secret account identity; never raw credential material |
| credentialHandleRef | Opaque secret-manager handle reference; never secret value |
| quotaDomainId | Canonical quota/account scope; mandatory for external free-quota routes |
| costClass | Explicitly allowed class; free quota requires provider evidence |
| capabilityProfile | Exact allowlisted execution profile |
| evidenceRef | Immutable provider evidence reference or signed evidence digest |
| evidenceDigest | SHA-256 digest of canonical evidence bytes |
| observedAt | Provider-evidence observation time |
| validUntil | Expiry; must be later than admission time |
| revocationVersion | Monotonic revocation/version watermark |
| status | Must equal `qualified`; revoked/suspended/unknown deny |
| registryVersion | Immutable route registry revision |

The evidence verifier must authenticate issuer provenance, bind every identity field to the registry record, validate the evidence digest, enforce freshness and revocation, and return a typed result. Caller-provided fields must never override the registry record.

## 4. Admission binding

The evidence digest and qualification ID must be bound to the exact admission envelope:

- owner/tenant identity;
- repository ID and issue number;
- immutable target commit SHA;
- allowlisted capability profile;
- logical task key;
- attempt ID and attempt number;
- approval ID and envelope digest;
- route qualification ID and evidence digest;
- idempotency key.

Any mismatch, missing value, expired evidence, revoked qualification, unknown account/domain, ambiguous issuer, unsupported model/profile, or evidence-verification error must deny admission before consuming approval.

## 5. Atomic D1 transaction boundary

The desired single D1 transaction must perform the following ordered logical operations:

1. Read and validate the current route qualification/revocation version under the admission transaction's consistency boundary.
2. Conditionally consume the exact unexpired, unrevoked, single-use owner approval with matching owner/repository/issue/target SHA/profile/envelope digest.
3. Insert an immutable admission record containing the route qualification ID, evidence digest and all task/attempt bindings.
4. Create or attach the canonical logical task, rejecting task-key binding conflicts.
5. Create the immutable attempt row and update the task's current-attempt pointer using the existing trigger/fencing invariants.
6. Insert exactly one durable queue-intent/outbox record bound to the same admission/task/attempt/evidence digest.
7. Read back all rows and verify exact identity bindings before returning a queue-only success result.

All writes must commit or roll back together. A failed, partial, or ambiguous result must return DENY / NEEDS_RECONCILIATION with `dispatch:false`. A retry must resolve state by durable read-back and deterministic idempotency keys; it must not consume another approval or create a second attempt/outbox item.

No external provider or GitHub network call belongs inside this D1 transaction. Evidence is authenticated before transaction entry, then the immutable digest and registry/revocation version are checked within the transaction. If the current D1 consistency model cannot guarantee that version check, admission must fail closed until a suitable authority store/transaction boundary exists.

## 6. Required invariants and adversarial tests

- Unknown, stale, revoked, malformed, issuer-mismatched or account-mismatched evidence is denied.
- Route ID, model ID, accountRef, issuerId and quotaDomainId must all match one registry qualification.
- Caller billing allowlists cannot promote unknown quota evidence.
- A free-quota route without a verified quota domain is denied.
- A capability for one target SHA/profile/repository cannot be replayed against another.
- Concurrent admission attempts with the same approval have exactly one winner.
- A task-key collision with different immutable bindings rolls back approval consumption.
- Failure after approval update but before attempt/outbox insertion rolls back the whole transaction.
- Ambiguous transaction outcome returns no dispatch authorization; durable read-back resolves the result.
- Attempt IDs and execution idempotency keys are immutable and unique.
- Stale lease generations cannot finalize or renew.
- Outbox identity is unique per admitted attempt (or per explicitly defined task event); no duplicate dispatch intent.
- Revocation racing admission is deterministic and fail-closed.
- Every denial is auditable without logging secret material.

## 7. Compatibility with existing proof components

Reuse, do not duplicate, the isolated mechanisms where their contracts remain valid:

- A0 admission contract: immutable task binding and owner approval checks, but its callback-based quota verifier is not sufficient as final route authority.
- D1 consume adapter: conditional single-use approval transition; it must be composed into the larger transaction rather than invoked as a separate preflight.
- Logical task claim/outbox: task identity and durable intent trigger; extend its schema/binding to include admission and route evidence digests.
- Immutable task attempts: retain attempt identity, fencing and read-back checks.
- Quota Ledger: retain pure cooldown and provider outcome transitions; never treat its selector output as authorization.

## 8. Explicit non-goals

This contract does not create or reveal provider credentials, verify that any current provider account has usable free quota, provision hosted D1, enable dispatch, call a model/provider, deploy a Worker, or qualify any executor. No production route is admitted by this document.

## 9. Acceptance criteria for implementation

- Migration design reviewed for SQLite/D1 transactional semantics and trigger ordering.
- Typed evidence schema and canonical digest format published with fixtures.
- Atomic admission adapter implemented without external side effects inside the transaction.
- Adversarial concurrency, rollback, replay, revocation and ambiguous-outcome tests pass on exact head.
- Exact-head CI and required branch-protection checks verified.
- Independent review after the pool itself is operational.
- Dispatch remains false until separate explicit qualification and authorization.

## 10. Source evidence reviewed

- PR #67 A0 source blob: `14c31d66995d6f99ceb6ea5df060ba8e00848464`.
- PR #67 D1 consume source blob: `f71e559a7c13b9a0242a7f619eba998c5906d95e`.
- PR #67 logical-task migration blob: `49b0798871429d7961e81eb1d86ad892dba0b9b9`.
- PR #67 immutable-attempt migration blob: `0ad590ffdd2589f857257739275c15ed2d54d729`.
- PR #67 A0 tests blob: `0070fffdf0595b5ebd9edced0b0e92bebf3af38c`.
- Quota Ledger fail-closed PR #71: https://github.com/VlDMlNSh/developer-cloud-pool/pull/71

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## 11. Implementation evidence — 2026-11-15

An isolated local D1 proof has been implemented on stacked PR #72:
https://github.com/VlDMlNSh/developer-cloud-pool/pull/72

- Exact implementation HEAD: `16aa4cc2d3265bd4d7a10e4581a57cfe0baf5875`.
- Additive migration 0011 introduces schema-versioned route qualification rows, immutable admission records, commit receipts and one-way task-outbox binding to admission ID, attempt ID and evidence digest.
- The composite adapter performs approval consumption, existing task/outbox trigger, admission insertion, existing immutable attempt trigger, outbox binding and a CHECK-backed commit receipt in one D1 batch. The final receipt assertion aborts the batch if any required row/binding is missing. Durable read-back follows commit.
- The persisted route row includes schemaVersion, qualificationId, routeId, providerId, modelId, issuerId, accountRef, credentialHandleRef, quotaDomainId, costClass, capabilityId, capabilityProfile, evidenceRef, evidenceDigest, observedAt, validUntil, revocationVersion, registryVersion and qualification status. Freshness is capped at 300 seconds. Revocation is monotonic.
- One admission per logical task is enforced in this proof to preserve the existing task-level outbox's one-to-one admission binding.
- Exact-head workflow run 43689591339: SUCCESS at the exact HEAD above. Workers-runtime: 7 files / 91 tests passed, including rollback, replay, revocation, stale-evidence, binding-substitution and concurrency cases. Upgrade-binding smoke 1 passed; frozen schema-0010 fixture smoke 2 passed.
- Dispatch remains false. No provider call, secret access, hosted D1, deployment or executor qualification.

### Remaining acceptance blockers

This is not a qualified route or production admission. The proof assumes route qualification rows were inserted by a trusted authority. It does not implement or qualify that writer, cryptographically authenticate issuer provenance, prove canonical evidence-byte serialization/digest generation, verify current provider-account identity or establish live quota availability. Synthetic evidence fixtures are not provider evidence. Combined commit status has zero contexts and required status checks remain NOT VERIFIED. No independent technical/security/governance review has been performed; per project decision, independent review remains deferred until the pool is operational.

Therefore Sections 3–9 remain normative acceptance requirements. Status remains NOT QUALIFIED; dispatch must remain disabled; Contour A is not accepted.
