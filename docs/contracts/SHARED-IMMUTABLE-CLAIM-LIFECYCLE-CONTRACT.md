# Shared Immutable Claim Lifecycle Contract — Contour A

Date: 2026-11-08
Status: DESIGN CONTRACT — PROPOSED FOR IMPLEMENTATION
Scope: Issue #38; integration boundary between Supervisor, reusable Worker, durable claim store, Outbox and Finalizer.

## 1. Purpose and guarantees

Define one immutable, single-use authorization envelope and one fenced lifecycle shared by Supervisor, Worker and Finalizer. The contract is backend-neutral. A backend is qualified only after its real deployment demonstrates the guarantees below under contention and failure.

Required guarantees:
- At most one successful claim generation may be active for a given approval/envelope identity.
- Every execution is bound to the same immutable envelope digest and target SHA.
- A stale Worker or Finalizer cannot mutate a newer claim generation.
- Retries are idempotent and cannot create a second logical task.
- Claim state and durable outbox intent are committed atomically by the authoritative state store.
- Terminal state and audit evidence are either committed together or represented as an explicitly recoverable pending finalization; never silently split.
- Dispatch remains disabled unless the selected backend and all issuer, authorization, quota, isolation and recovery gates are qualified.

This contract does not claim exactly-once external side effects. It provides single logical claim identity, fenced state transitions, and at-least-once delivery with idempotency at downstream boundaries.

## 2. Immutable authorization envelope

Canonical envelope fields:
- schema_version
- approval_id (globally unique, immutable)
- issuer_id and issuer_type
- owner_numeric_id
- repository_id and repository_full_name
- issue_number
- target_sha (40 lowercase hex)
- profile (strict allowlist identifier)
- payload_digest / envelope_digest (SHA-256 over canonical serialization)
- issued_at and expires_at
- authorization_policy_version
- quota_reservation_id (when quota is applicable)
- idempotency_key

The authoritative issuer must derive identity from an authenticated owner-approved event or an approved signing/attestation mechanism. Owner/repository IDs, timestamps, profile, digest, and approval status supplied by an untrusted caller are not authoritative merely because they are syntactically valid.

Canonical serialization, digest algorithm, field normalization, issuer authentication, revocation semantics, and trusted clock source must be specified and tested before implementation. No secret or signing key may be exposed in logs or artifacts.

Any change to an immutable field creates a different envelope and requires a new approval. It must never mutate an existing claim in place.

## 3. Durable state model

Suggested states:
- APPROVED: authenticated, policy-valid approval awaiting claim.
- CLAIMED: one claim generation atomically created with its outbox record.
- LEASED: a specific worker run owns the current generation until lease expiry.
- FINALIZING: a fenced terminal transition has been accepted and audit delivery is pending or being committed.
- SUCCEEDED: terminal success, audit provenance committed.
- NEEDS_REVIEW: terminal failure/ambiguity, audit provenance committed.
- EXPIRED / REVOKED: no new lease or dispatch is permitted.
- DEAD: bounded retry policy exhausted; manual review required.

Minimum authoritative claim fields:
approval_id, claim_id, envelope_digest, target_sha, profile, state, generation, lease_owner, lease_expires_at, attempt_count, worker_run_id, supervisor_run_id, created_at, updated_at, terminal_result, audit_event_id.

The generation is a monotonically increasing fencing token. Every lease acquisition/reclaim increments it atomically. Worker and Finalizer mutations must include claim_id + generation + envelope_digest + expected state + worker_run_id as applicable. A stale generation must affect zero rows and be denied.

## 4. Atomic operations

### 4.1 Claim
One conditional transaction:
1. Verify issuer-authenticated approval, expiry/revocation, policy, quota reservation and exact immutable envelope.
2. Transition APPROVED -> CLAIMED only if current state and idempotency constraints match.
3. Insert exactly one claim identity and exactly one Outbox event in the same transaction.
4. Return the existing identity for an exact idempotent retry; deny any mismatched retry.
5. Never dispatch from the claim transaction.

### 4.2 Lease / recovery
- Lease acquisition is conditional on eligible state and current generation.
- Reclaim after expiry increments generation and records recovery provenance.
- The previous worker's token becomes invalid immediately.
- Clock must be trusted and backend semantics for time/transaction ordering must be documented.
- Retry count, lease duration, maximum attempts and dead-letter policy are bounded.
- An ambiguous storage result is fail-closed; reconcile by reading authoritative state, never by guessing.

### 4.3 Worker execution
Worker receives a signed or otherwise authenticated execution capability containing approval_id, claim_id, generation, envelope_digest, target_sha, profile, supervisor_run_id and expiry.
Worker validates repository/workflow caller identity, exact target checkout, profile allowlist, capability authenticity, current generation and lease before execution.
Worker has no authority to mint approvals, change claim generation, or finalize tasks.
No provider/model call is allowed until provider-specific authorization, quota and secret-isolation gates are separately qualified.

### 4.4 Finalization
Finalizer submits a terminal result bound to the same approval_id, claim_id, generation, envelope_digest, worker_run_id, supervisor_run_id and result digest.
The authoritative store conditionally transitions only the current LEASED generation to FINALIZING/terminal. A stale, duplicate, mismatched or already superseded finalization is rejected or returns the prior idempotent result.
Terminal state and durable audit event are committed atomically. If audit is external, the transaction writes an outbox event and the delivery worker retries idempotently; final acceptance is not reported until durable audit delivery is confirmed.
GitHub Issue labels/comments are projections of authoritative state, not the claim lock or source of truth.

## 5. Backend decision (not yet selected)

A. Serialized Supervisor + GitHub Issue labels:
- Low implementation cost and uses existing GitHub permissions.
- GitHub label PATCH is not compare-and-swap; other actors/workflows can race.
- Can be used only with explicit residual-risk acceptance and dispatch disabled for any guarantee requiring strict single-winner semantics. Not selected as the durable authority.

B. Dedicated state repository with immutable reservation refs:
- Git ref creation can provide conflict detection, but requires Contents: write and careful rules for delete/recreate, ref namespace, issuer authority, retention and audit.
- Do not grant Contents: write to the current Supervisor as a shortcut.
- Candidate only after a separate least-privilege threat model and real contention/recovery tests.

C. Conditional-write database/store (D1 candidate):
- Local SQLite/Miniflare proof in PR #39 demonstrates trigger-backed atomic claim + outbox behavior in a local runtime.
- Real Cloudflare account currently has no D1 database/Worker scripts in the previously observed read-only inventory; billing/plan entitlement was not verified. No remote D1 resource or entitlement is currently qualified.
- Candidate only after account eligibility, no-cost constraints, binding identity, ACL, quota, migration, backup/recovery, trusted issuer and production contention tests are verified.
- PR #39 is evidence for a local proof adapter, not evidence of remote D1 deployment.

Decision: retain a backend-neutral contract. Do not select or provision a backend in this pass. Continue using local tests to validate state-machine semantics; dispatch remains disabled until one backend is actually qualified.

## 6. Required behavioral tests

The test suite must exercise the real selected backend, not only source regexes:
1. Concurrent claim storm: exactly one logical claim and one Outbox event.
2. Exact retry: same immutable binding returns same claim; no duplicate event.
3. Mutated owner/repository/issue/SHA/profile/digest/issuer: deny.
4. Expired or revoked approval: deny; no claim/outbox.
5. Forged or unauthenticated issuer: deny.
6. Pre-consumed approval with matching timestamp: deny unless exact prior claim exists.
7. Outbox insert failure: claim transition rolls back.
8. Claim succeeds but response is lost: retry reconciles to same identity.
9. Lease expiry and reclaim: generation increments exactly once.
10. Old worker generation after reclaim: all mutations affect zero rows.
11. Wrong repository/workflow/run identity: deny.
12. Target checkout differs from envelope SHA: deny before execution.
13. Duplicate Finalizer: idempotent same result; conflicting result denied.
14. Finalizer from stale generation or wrong worker run: deny.
15. Audit/outbox delivery failure: terminal acceptance withheld; retry recovers without duplicate logical event.
16. Process interruption at each transition boundary: restart/reconciliation reaches a defined state without duplicate dispatch.
17. Quota reservation and release/charge accounting are atomic or reconciliable and idempotent.
18. Secret values never appear in logs, summaries, artifacts or error text.

## 7. Qualification gates and evidence

Before dispatch can be enabled:
- exact backend deployment identity and access policy verified;
- issuer authentication, revocation and trusted clock verified;
- contention and recovery tests pass against the real backend;
- stale generation and wrong-run fencing tests pass;
- outbox/audit durability and retry behavior pass;
- quotas, cost ceilings and no-paid-fallback constraints verified;
- secret isolation and workflow permissions reviewed;
- exact-head CI and immutable artifact digests recorded;
- all ambiguous states fail closed.

The adopted Autonomous-First policy applies: routine external APPROVE is not a prerequisite for each engineering iteration. Structured multi-role audits after safe activation are required qualification evidence. Such self-audits do not establish external independence and cannot self-assign ACCEPTED. Final Contour A acceptance remains a separate evidence-based decision.

## 8. Explicit non-goals

- This document does not enable either dispatch gate.
- It does not authorize provider/model calls, DSH execution, Resource Probe, deployment, or privileged GitHub mutations.
- It does not claim remote D1 availability or free-tier entitlement.
- It does not merge PR #36, #37 or #39.
- It does not authorize Contour B / MediaHub product development.


## 9. Trusted reconciliation authority extension

The detailed, backend-neutral extension is maintained in [TRUSTED-RECONCILIATION-AUTHORITY-CONTRACT.md](TRUSTED-RECONCILIATION-AUTHORITY-CONTRACT.md).

Normative boundary:
- Lease expiry, missing heartbeat, absent Workflow instance, or executor terminal status alone never authorizes takeover or retry.
- Bind each attempt to immutable native executor identity, including GitHub Actions `run_id` + exact `run_attempt` + repository/workflow/path/event/SHA, or Cloudflare account/workflow/instance/version identity.
- Use read-only fixed-origin evidence adapters. Missing, stale, inaccessible, mismatched or unknown status is `UNRESOLVED`.
- Resolver capability is separate from owner approval, worker execution and dispatch. It is short-lived, audience/scope/subject/binding/policy/revocation/jti constrained and single-use.
- External effects require destination-level idempotency/fencing or authoritative receipts. A terminal run is not proof that an effect did not commit.
- Resolution is a conditional atomic state transition plus append-only receipt/outbox. A retry-candidate receipt is not a new approval or a dispatch authorization.
- Cloudflare Workflows remains an orchestration/evidence candidate, not the claim ledger. Its local Miniflare proof is not hosted qualification; explicit restart cancels in-progress steps and erases intermediate state.
- Until selected hosted backend and all evidence, contention, interruption, side-effect, security and governance gates are qualified: resolver authority disabled and dispatch false.
