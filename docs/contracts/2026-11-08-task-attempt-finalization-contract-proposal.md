# Task Attempt, Finalization and Durable Audit — Contract Proposal

Status: PROPOSED / NOT IMPLEMENTED / NOT APPROVED FOR PRODUCTION

This document defines the next integration contract for the Cloud Development Pool. It reconciles the current GitHub Issues Supervisor/Worker draft (PR #37) with the isolated D1 logical-task and generation-fenced lease proof (PRs #39/#40). It does not authorize dispatch, deployment, provider access, or production D1 provisioning.

## 1. Authority and scope

- A task is the logical unit of approved work. An approval is an immutable authorization record attached to a task; it is not the task identity.
- An attempt is one bounded execution generation for one task. Every attempt is immutable after creation except for append-only lifecycle events.
- The D1 ledger is the proposed authoritative source for task identity, attempt ownership, lease generation, idempotency, terminal result and audit events. GitHub Issue labels/comments are projections for operator visibility, not the authority or concurrency primitive.
- The current D1 package is explicitly local-only. This proposal does not imply that the schema is production-ready or deployed.
- Supervisor may create/claim an attempt only after all issuer, approval, branch, capability and governance checks succeed. Worker must not mint authority or broaden capability.
- Fail closed on missing, stale, ambiguous, conflicting or unavailable state. Never infer success from a GitHub label or a successful HTTP response alone.

## 2. Canonical identities

### Logical task

`task_key = SHA256(canonical_task_envelope)`

The canonical envelope must include at least:
- repository immutable ID;
- task source ID and source revision/digest;
- exact target commit SHA;
- allowlisted worker profile/capability;
- issuer identity and authorization-contract version;
- normalized requested operation and bounded resource policy.

Canonicalization must be versioned and deterministic. The task key is not an approval ID and not a run ID. Distinct approvals for the same identical task envelope attach to the same task key; a changed target SHA, profile, capability or requested operation produces a different key.

### Attempt

`attempt_id = SHA256(task_key || attempt_number || attempt_nonce)`

- `attempt_number` is monotonically increasing per task and bounded by the configured retry policy (the isolated proof currently uses five attempts).
- `attempt_nonce` is generated once at attempt creation and persisted before execution.
- `lease_generation` is monotonically increasing each time an expired lease is reclaimed. It fences old workers even when task and attempt IDs remain the same.
- GitHub Supervisor run ID + run attempt, reusable Worker run ID + run attempt, repository ID and workflow SHA are provenance fields, not substitutes for task/attempt identity.

## 3. Minimum durable records

### `pool_tasks`

- `task_key` (primary key, 64 lowercase hex)
- `envelope_version`, `envelope_digest`
- `repository_id`, `source_issue_number`, `source_revision`
- `target_sha`, `profile`, `capability_id`
- `issuer_id`, `authorization_contract_version`
- `state`: `pending | leased | completed | dead | cancelled`
- `attempt_count`, `created_at`, `updated_at`

### `pool_attempts`

- `attempt_id` (primary key), `task_key` (foreign key)
- `attempt_number`, `attempt_nonce` (unique per task)
- `state`: `created | leased | running | succeeded | failed | abandoned | rejected`
- `lease_owner`, `lease_generation`, `lease_expires_at`
- `supervisor_run_id`, `supervisor_run_attempt`, `supervisor_workflow_sha`
- `worker_run_id`, `worker_run_attempt`, `worker_workflow_sha`
- `result_digest`, `failure_code`, `created_at`, `updated_at`

Unique constraint: (`task_key`, `attempt_number`). A retry creates a new attempt; it does not rewrite the prior attempt's result.

### `pool_approvals`

- immutable approval ID, `task_key`, issuer/approver identity, decision, policy version, evidence digest and timestamp.
- Multiple independent approvals may attach to one task where policy requires them.
- Enforce unique approval ID and unique attachment; reject an approval already consumed/attached incompatibly.

### `pool_audit_events`

Append-only:
- `event_id` (deterministic idempotency key, unique)
- `task_key`, `attempt_id`, `lease_generation`
- `event_type`, `actor_id`, `source_run_id`
- `payload_digest`, `created_at`

The event payload is immutable. Corrections are new events referencing the prior event; never update or delete an audit event.

## 4. State transitions

1. `pending → leased`: one conditional transaction creates the attempt, increments task attempt count, assigns owner, increments generation, sets expiry and appends `ATTEMPT_LEASED`.
2. `leased → running`: only the same owner + generation + unexpired lease may record worker start and append `ATTEMPT_STARTED`.
3. `running → succeeded|failed`: only the current owner + generation + unexpired lease may submit a result digest. Terminal result and audit event are committed in one D1 transaction/batch with uniqueness constraints.
4. `leased|running → abandoned`: expiry/reclaim is recorded as a distinct event. Reclaim increments generation and creates a new attempt or a new generation according to the selected retry model; the implementation must choose one model and test it consistently. This proposal prefers a new immutable attempt per retry, with generation fencing retained within that attempt for lease takeover.
5. `pending|abandoned → dead`: bounded retry exhaustion is a conditional transaction that marks task dead, dead-letters any pending outbox item and appends `TASK_DEAD_LETTERED`.
6. `completed|dead|cancelled` are terminal task states. No implicit requeue from terminal state.

A late result from an older generation, different owner, wrong attempt, wrong workflow SHA or expired lease is rejected and audited as `STALE_RESULT_REJECTED`; it cannot change terminal task state.

## 5. Idempotent finalization protocol

Finalizer receives only a result envelope containing:
- task key, attempt ID and attempt number;
- lease owner and generation;
- exact target SHA and envelope digest;
- Supervisor and Worker run IDs/attempt numbers;
- workflow SHA values;
- terminal result and result digest.

The D1 transaction must:
1. Validate all immutable identity fields against persisted task/attempt records.
2. Verify current lease owner, generation and expiry.
3. Verify attempt is non-terminal.
4. Insert terminal audit event using a deterministic unique event ID.
5. Update attempt and task terminal states conditionally.
6. Mark outbox/result-delivery record complete or pending projection delivery.

All database mutations occur in one transaction or transactional D1 batch with constraints/triggers that roll back the entire operation on any conflict. A repeated identical request returns the previously committed terminal result (`ALREADY_FINALIZED_SAME_DIGEST`). A different digest for the same attempt returns `FINALIZATION_CONFLICT` and does not mutate state.

GitHub Issue label/comment projection happens only after authoritative commit. Projection failure is retried from an outbox; it does not roll back or duplicate the authoritative terminal event. A projection reconciler can safely repeat updates by event ID.

## 6. Failure and recovery matrix

| Failure | Required behavior |
|---|---|
| D1 unavailable before claim | No claim, no Worker invocation; retry later |
| Claim response lost/ambiguous | Read authoritative attempt by idempotency key; never create a second active attempt blindly |
| Worker crashes / lease expires | Mark old attempt abandoned; increment fencing generation; retry only within bounded policy |
| Old Worker returns after reclaim | Reject stale generation; append rejection event |
| Finalizer response lost after commit | Retry same idempotency key; return already-committed result |
| Audit insert conflicts | Entire state transition rolls back |
| GitHub label/comment API fails | Keep authoritative event; outbox remains pending; reconcile projection later |
| Duplicate result, same digest | Return prior result without a second terminal event |
| Duplicate result, different digest | Conflict; preserve first committed result; quarantine for review |
| Retry limit reached | Atomic dead-letter + terminal task state + audit event |
| Task source edited/closed after approval | Recompute source revision/envelope; reject mismatch before claim/finalization |

## 7. Required adversarial tests

- Two concurrent attempts cannot both own the same active task.
- Same task envelope with different approval IDs maps to one task key; changed target SHA maps to a different task key.
- A stale generation cannot renew, finalize or overwrite a newer attempt.
- Wrong repository ID, task source revision, target SHA, profile, capability or workflow SHA is rejected.
- Duplicate identical finalization is idempotent; duplicate conflicting digest is rejected.
- Inject failure between audit insert and state update: transaction rolls back both.
- Inject failure after authoritative commit but before GitHub projection: outbox replay converges without duplicate audit.
- Lost claim/finalizer responses can be reconciled by deterministic idempotency key.
- Exhausted retries atomically dead-letter task and outbox; no later lease acquisition.
- Closed/edited source task cannot be finalized by a stale run.
- Process restart between every transition recovers from durable state without relying on in-memory state.
- Verify all tests in the local Workers/D1 runtime and record exact source SHA. Local CI is not evidence of remote D1 behavior.

## 8. Integration sequence and gates

1. Review this contract against the current D1 schema, approval-consume/outbox triggers and task lease adapter.
2. Resolve the retry model explicitly (new attempt per retry; lease generation only for takeover within one attempt).
3. Implement schema + adapters + tests on an isolated draft branch. Preserve `dispatch: false`.
4. Add a GitHub projection outbox adapter with idempotent event IDs; no provider credentials.
5. Integrate Supervisor/Worker/Finalizer only after contract tests pass. GitHub Issues remains a projection.
6. Obtain automated independent contract/security review from separate identities/workers after the pool's review path is operational; a same-account review is not independent.
7. Only then consider live D1/Worker qualification, with separate environment/governance authorization. No deployment or dispatch is authorized by this proposal.

## 9. Current evidence and known gaps

- PR #37: OPEN/DRAFT; current head `1be8672c1be1a720b6c813dcafff5c020b6456ae`. Static exact-head runs passed, but actual reusable Worker invocation is NOT RUN. Its Finalizer still performs separate GitHub label PATCH and comment POST and does not bind immutable attempt ID/generation.
- PR #40: OPEN/DRAFT, stacked on PR #39; local Workers-runtime D1 proof exact-head CI passed on `2b7e30aeb8c404d84b2fe8bc36320aaa783520fb`. The lease adapter is isolated and returns `dispatch: false`; it is not production-integrated.
- No remote D1, production Supervisor/Worker/Finalizer integration, real executor, provider/model call, secret access or deployment has been verified.
- Independent review of PR #37/#40 is not established by the current evidence.

Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
