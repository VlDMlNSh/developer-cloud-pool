# Task Identity and Fenced Delivery Proof — Contour A

Date: 2026-11-08
Status: DESIGN / NOT IMPLEMENTED
Parent proof head: ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833 (PR #39)
Scope: isolated local proof only. No production integration, cloud resource, credential, dispatch, or provider use.

## 1. Finding

The current local claim/outbox schema binds one claim and one outbox row to each approval:
- `pool_task_claims.approval_id` is the primary key and `claim_id` is unique.
- `pool_task_outbox.approval_id` is unique.
- `claim_id` is derived from `approval_id`.

This proves at most one claim/outbox pair per approval. It does not establish one active execution per logical task when two distinct approvals refer to the same repository, issue, target SHA, and worker profile. The existing 12-way test contends on one approval ID and therefore cannot prove task-wide uniqueness.

## 2. Canonical logical task identity

Define a versioned canonical task identity from trusted, normalized fields:
- schema_version
- repository_id
- issue_number
- target_sha
- profile
- task_revision (only if the product explicitly permits multiple independently executable revisions for one Issue)

Compute `task_key = SHA-256(canonical serialization)`. Do not accept a caller-supplied task_key as authoritative. Owner/repository identity and task fields must be derived from the authenticated approval issuer. The approval envelope digest remains a separate immutable authorization digest; task_key is a logical deduplication key, not a substitute for authorization.

Default policy for this proof: one active task per (repository_id, issue_number, target_sha, profile). A new approval for the same tuple attaches to or returns the existing task; it must not create another active task. A different target SHA or profile is a distinct task identity and still requires separate authorization.

## 3. Required state model

Keep approval consumption and task execution lifecycle separate.

Approval ledger:
- READY -> CONSUMED is conditional and single-use.
- Every approval remains individually auditable.

Logical task:
- PENDING -> LEASED -> FINALIZING -> SUCCEEDED | NEEDS_REVIEW | DEAD
- RECLAIM from expired LEASED increments a monotonically increasing generation.
- Terminal tasks cannot be silently reopened. A deliberate rerun requires an explicit new task_revision and fresh authorization policy decision.

Outbox:
- PENDING -> DELIVERED | DEAD
- Delivery is at-least-once. Consumer idempotency is mandatory; do not claim exactly-once external side effects.

## 4. Schema/invariant direction

Candidate local-proof schema (not yet selected for production):
- `pool_tasks(task_key PRIMARY KEY, repository_id, issue_number, target_sha, profile, state, generation, lease_owner, lease_expires_at, attempt_count, active_slot, created_at, updated_at)`
- Enforce at most one active row for a logical identity with a unique partial index over normalized identity fields WHERE state IN ('pending','leased','finalizing'), or use a separate unique active-task slot whose insert/update is transactionally guarded.
- `pool_task_approvals(task_key, approval_id UNIQUE, envelope_digest)` records multiple valid approvals attached to the same logical task.
- `pool_task_outbox(outbox_id PRIMARY KEY, task_key, event_type, generation, status, created_at, delivered_at)` uses a deterministic event identity scoped to task + transition generation.
- A claim/delivery operation must atomically consume the approval (when applicable), attach it to the logical task, and insert/reuse the matching outbox intent.
- Every lease/finalize mutation must predicate on task_key + generation + expected state + lease_owner/worker_run_id + envelope digest as appropriate. A stale generation must update zero rows.
- A conflict between two different immutable bindings for one task_key is DENY + durable audit, never merge.

The exact SQL/index strategy must be proven against the actual local Workers/D1 runtime before adoption. No claim that SQLite partial indexes or transaction semantics are production-qualified until tests and platform docs confirm the intended behavior.

## 5. Mandatory behavioral tests

1. Two distinct approvals for the same logical identity, concurrent: exactly one active task row and one logical pending delivery; both approval decisions auditable.
2. Twelve concurrent attempts across multiple approval IDs for the same task identity: one task identity wins; no duplicate active task.
3. Same Issue but different target SHA: separate task identities; no accidental collision.
4. Same Issue/SHA but different profile: separate identities only if profile is explicitly allowlisted and separately authorized.
5. Exact retry: same task_key and outbox event identity; no second logical delivery.
6. Conflicting immutable binding/digest for an existing task identity: fail closed and audit.
7. Lease acquire increments generation; renew requires current generation and owner.
8. Expired lease reclaim increments generation; old worker generation cannot heartbeat, complete, or enqueue another transition.
9. Wrong worker run ID, wrong target SHA, wrong profile, or wrong digest: zero-row mutation and denial.
10. Duplicate/stale finalizer: idempotent terminal result; no duplicate audit event.
11. Outbox consumer retry after lost response: downstream idempotency key prevents duplicate logical execution.
12. Outbox failure/transaction abort: approval/task/outbox invariants roll back together or produce an explicit recoverable pending-finalization state.
13. Bounded attempts and lease expiry transition to DEAD/NEEDS_REVIEW; no unbounded retry loop.
14. Restart/recovery test: pending outbox and expired leases are reconciled deterministically.
15. Every successful and denied transition emits durable, non-secret audit provenance.

## 6. Security and scope boundaries

- Issuer authentication, trusted clock, revocation, quota reservation, and canonical serialization remain prerequisites.
- Never treat GitHub Issue labels/comments as the authoritative lock.
- No dispatch or provider call in this proof; all adapters must continue returning `dispatch: false`.
- No secrets, keys, tokens, billing, or account entitlements are read or changed.
- No Cloudflare D1 provisioning/deployment is performed.
- This document does not authorize merging PR #36/#37/#39 or enabling the production pool.

## 7. Acceptance criteria for the next implementation pass

A bounded local proof must demonstrate the full test matrix above (or explicitly split it into independently testable slices), pin dependencies, use the existing Workers Vitest harness where appropriate, publish exact-head CI evidence, and preserve a clear ancestry/provenance chain. The integration branch must remain separate from PR #37 until the authorization and worker boundaries are reconciled.
