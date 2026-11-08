# 2026-11-09 — Reconciliation authority contract design

Date: 2026-11-09

## Decision

Keep reconciliation fail-closed. The current `acquireAttemptLease(..., { resumable: true })` flag is caller input, not proof of authority or evidence that the prior executor has stopped. It must not be treated as a production authorization signal. No production takeover, retry, terminalization, or lease clearing is permitted on the basis of expiry or this boolean.

This record defines the minimum contract for a future isolated resolver proof. It does not implement that resolver and does not authorize dispatch.

## Immutable evidence to bind

Every authorization decision must be bound to all of:
- repository identity (stable numeric repository ID, not owner/name alone);
- logical `task_key`;
- `attempt_id` and `attempt_number`;
- immutable `input_digest`;
- observed `lease_generation`;
- observed expired lease owner and lease expiry timestamp;
- reconciliation record ID;
- action enum, restricted to one explicit operation (e.g. `RESUME_SAME_ATTEMPT`, `ABANDON_ATTEMPT`, or `MARK_TERMINAL`);
- evidence digest and resolver idempotency key.

A capability for one action must not authorize another action. It must not be transferable to another task, attempt, input, generation, repository, or reconciliation record.

## Trusted authority requirements

The resolver must receive a capability issued by a separately trusted authority. Acceptable future implementation patterns are:
1. signed, short-lived capability validated against pinned issuer keys and an explicit issuer allowlist; or
2. opaque, single-use capability ID resolved server-side against an authoritative ledger with immutable issuer, scope, expiry, revocation and consumption state.

A caller-supplied boolean, arbitrary JSON claim, worker identity string, hash/digest without trusted signature, or database row written by the same untrusted caller is not a capability.

Issuer identity and authority must be checked independently from the worker/executor identity. The resolver must not infer authority from GitHub username, repository write access, workflow run ID, a successful hash comparison, or the mere existence of an approval record.

## Mandatory verification sequence

1. Validate capability authenticity and trusted issuer.
2. Validate issuer authorization for the exact action and repository scope.
3. Validate expiry using a trusted server-side clock and a bounded clock-skew policy.
4. Check revocation and single-use state.
5. Read back the reconciliation row, attempt, task pointer, input digest, lease owner, expiry and generation.
6. Require an exact match to the capability's immutable binding. Any drift, missing row, stale generation, or ambiguous storage result returns DENY.
7. Verify external execution evidence independently. Lease expiry alone does not prove the previous executor stopped; a safe resume additionally requires an execution-specific idempotency/fencing guarantee or positive evidence of termination.
8. Consume the capability and record the resolver decision atomically with the reconciliation transition. A duplicate request may return the same recorded decision only when every bound field and evidence digest matches exactly.
9. Re-read all affected rows and audit events. A failed or ambiguous readback remains DENY/NOT VERIFIED; never compensate by issuing a new execution automatically.

## Quota, revocation and audit

- Enforce issuer- and action-scoped quotas before consumption; fail closed if quota state is unavailable.
- Persist immutable issuer ID, capability ID/digest, action, scope, issue/expiry times, evidence digest, resolver ID, prior and resulting generation, decision, and timestamps.
- Do not persist bearer capability secrets in plaintext. Store only a digest or opaque ID where possible.
- Revocation must be checked at decision time; revocation-store outage means DENY.
- Preserve an append-only decision event. Replays must be idempotent and conflict-detecting.
- No fallback to paid providers, alternate accounts, or broader credentials.

## Negative test matrix required before any resolver can be considered

- missing capability; malformed capability; unsigned or wrong-key capability;
- untrusted issuer; issuer authorized for a different action or repository;
- expired capability; future-issued capability outside skew; revoked capability;
- replayed/consumed capability; duplicate capability ID;
- wrong task key, attempt ID/number, input digest, repository ID, reconciliation ID;
- stale or changed lease generation/owner/expiry;
- missing or altered reconciliation row;
- caller-supplied `resumable: true` without a capability;
- capability for RESUME used for ABANDON or MARK_TERMINAL;
- quota exhausted or quota/revocation service unavailable;
- ambiguous transaction result, failed readback, and concurrent capability consumption;
- prior executor still active or external side effects not proven idempotent/fenced.

Every negative case must return `dispatch: false`, make no state transition, and preserve an auditable denial where storage is available.

## Positive test requirements

A positive case must demonstrate:
- valid trusted issuer and exact scoped capability;
- single-use atomic consumption under concurrent duplicate requests;
- immutable task/attempt/evidence binding;
- stale generation rejection;
- no dispatch side effect in the proof adapter;
- idempotent exact replay without duplicate state transition;
- recovery from an interrupted resolver transaction without granting a second authorization.

## Current implementation gap

At immutable source SHA `f50e8fc09a6442b4ca3088194c9d7284c7ffce55`, `acquireAttemptLease` accepts `{ resumable = false }` and allows the expired-running branch when the caller passes true. This value is not cryptographically or ledger-authenticated. Existing tests show that an indeterminate attempt is blocked even with true, but do not establish safe authority for a still-running expired attempt. Therefore the API remains an experimental local adapter only.

The reconciliation migration creates a durable pending row and preserves task/attempt/generation/owner/input digest. It intentionally does not authorize a resolver.

## Scope and status

- Status: DESIGN RECORDED / IMPLEMENTATION NOT STARTED / NOT QUALIFIED.
- No production API or schema contract is adopted by this document.
- No remote D1, secrets, provider calls, dispatch, worker execution, deployment, or merge.
- PR #51 remains OPEN/DRAFT/UNMERGED. PR #54 remains OPEN/DRAFT/UNMERGED.
- Contour A remains BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

## Next bounded step

Translate this contract into a small isolated resolver state machine and SQL constraints only after choosing and documenting the trusted issuer/authority source. First test the single-use capability ledger and concurrent consume semantics locally; keep all resolver outputs `dispatch: false`. Do not implement a fake issuer or treat local test fixtures as production trust.

Related evidence:
- PR #51: https://github.com/VlDMlNSh/developer-cloud-pool/pull/51
- PR #54: https://github.com/VlDMlNSh/developer-cloud-pool/pull/54
- Issue #38: https://github.com/VlDMlNSh/developer-cloud-pool/issues/38
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
