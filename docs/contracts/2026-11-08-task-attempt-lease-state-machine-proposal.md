# Task / Attempt / Lease state machine — implementation decision proposal

Date: 2026-11-08
Status: DESIGN PROPOSAL / NOT IMPLEMENTED / NOT PRODUCTION-APPROVED
Target evidence: PR #40 head `2b7e30aeb8c404d84b2fe8bc36320aaa783520fb`

## 1. Decision

Separate three identities and lifecycles:

1. **Task** — immutable logical work identity, keyed by canonical `task_key`. It owns the immutable task envelope binding (repository ID, source task/issue, target SHA, profile, issuer/approval references and canonical envelope digest).
2. **Attempt** — one authorized execution intent for the task, with a new immutable `attempt_id` and monotonically increasing `attempt_number` for each actual retry. It records the execution idempotency key, dispatch/run correlation, immutable input digest and terminal result/provenance.
3. **Lease** — temporary authority for one executor to mutate the current attempt. Each successful acquisition increments a monotonically increasing fencing `lease_generation`; owner and expiry are mutable lease state, not attempt identity.

An attempt is not created merely because a lease was renewed or ownership transferred. A new attempt is created only by an explicit retry transition after the prior attempt is terminally failed, safely abandoned, or reconciled from an indeterminate outcome.

## 2. Why this is the selected model

PR #40 currently has a single mutable lease slot in `pool_tasks`. Its `acquireTaskLease` increments both `lease_generation` and `attempt_count` on each acquisition, including expiry reclaim. The schema has no immutable attempt table. Consequently:
- lease takeover and execution retry are conflated;
- prior attempt provenance is lost;
- the five-attempt cap measures successful lease acquisitions, not necessarily distinct execution attempts;
- a stale lease is fenced for D1 writes, but that alone cannot fence external side effects.

This proposal separates the counters and preserves auditable history. It does not assert that the current code already implements these semantics.

## 3. Entities and required immutable fields

### Task
- `task_key` primary key;
- immutable `repository_id`, `source_task_id`, `target_sha`, `profile`, `issuer_id`, `approval_id` reference(s), `envelope_digest`;
- current task state and current attempt pointer;
- created/updated timestamps.

### Attempt
- `attempt_id` primary key (random, unguessable stable ID);
- `task_key`, `attempt_number` unique per task;
- immutable `input_digest`, `execution_idempotency_key`, `created_by_authority`, policy/profile version;
- state, creation time, dispatch correlation, workflow/run ID and run_attempt when available;
- terminal reason, result digest, result provenance, completed time;
- unique constraint on (`task_key`, `attempt_number`) and on execution idempotency key.

### Lease
- task key + attempt ID;
- monotonically increasing generation;
- owner identity, expiry and last heartbeat;
- every mutation must compare task, attempt, owner, generation, state and unexpired deadline.

Never store secret values in these records. Store references/identities and non-secret digests only.

## 4. State transitions

### Task states
`pending → active → completed`
`active → retry_wait → active`
`active → needs_reconciliation → retry_wait | dead`
`pending | retry_wait → dead`

Task completion is terminal. Dead is terminal absent an explicitly authorized administrative reopen protocol with a new immutable task version.

### Attempt states
`prepared → dispatching → running → succeeded`
`prepared | dispatching | running → failed`
`dispatching | running → indeterminate`
`indeterminate → succeeded | failed | abandoned` only after evidence-based reconciliation.
`running → abandoned` only when the execution is known stopped or downstream side effects are fenced/idempotent and reconciliation has established a safe retry boundary.

An attempt must never be silently reset to prepared or reused for a different execution intent.

### Lease states
Lease is an orthogonal, expiring ownership tuple, not an attempt status:
- acquire only for the current eligible attempt;
- renew only when owner + generation match and lease has not expired;
- takeover increments generation atomically and invalidates all older generations;
- release/expiry clears active ownership but does not by itself mark an attempt successful or failed.

**Important expiry rule:** expiry means the prior owner has lost authority to mutate the ledger. It does NOT prove the prior process stopped or that external work did not happen. Therefore expiry alone cannot authorize a new execution attempt.

## 5. Expiry, takeover and retry policy

1. **Heartbeat renewal:** same attempt, same owner, same generation; extend expiry conditionally.
2. **Executor process restart with resumable checkpoint:** same attempt may be taken over with generation +1 only if the execution protocol is resumable and all downstream writes validate the fencing generation / idempotency key.
3. **Expired lease with unknown external execution state:** move attempt/task to `indeterminate` / `needs_reconciliation`; do not automatically dispatch another attempt.
4. **Confirmed failed or safely abandoned attempt:** transactionally close old attempt and create a new attempt number with a fresh immutable attempt ID and idempotency key. Preserve old record.
5. **Attempt limit:** count distinct attempt records, not lease acquisitions. Lease takeovers do not consume retry budget. Default max=5 is provisional and must be configured by approved policy.
6. **Ambiguous D1 commit response:** read back by immutable operation/idempotency key. Never blindly create a new attempt or repeat an external side effect.

If the target executor/provider cannot enforce idempotency or fencing for side effects, takeover of an in-flight attempt is prohibited; require reconciliation before retry.

## 6. Atomicity and audit requirements

Each state-changing operation must be a single D1 transaction or an equivalent atomic conditional operation:
- create attempt + set current attempt + append audit/outbox event;
- acquire/takeover lease + increment generation + append lease event;
- finalize attempt + persist result digest/provenance + task transition + append terminal audit/outbox event;
- retry authorization + close old attempt + create new attempt + update task pointer + append retry event.

Use unique idempotency keys and conditional predicates to make retries safe. Audit is append-only. GitHub Issue labels/comments are projections only and must be repairable from the durable ledger. A successful terminal state cannot depend on a later non-atomic comment POST.

## 7. Required adversarial acceptance tests

1. Two concurrent initial lease acquisitions: exactly one owner/generation succeeds.
2. Concurrent expiry takeovers: exactly one new generation succeeds.
3. Old owner renew/finalize after takeover: denied.
4. Lease expiry while old process still runs: old generation denied at every ledger mutation; side-effect gateway rejects stale generation or operation is idempotent.
5. Lost acquire response: readback returns the same operation identity; no duplicate attempt.
6. Lost finalization response: replay returns same terminal result; no duplicate audit/outbox event.
7. Crash after external dispatch but before run-ID persistence: attempt becomes indeterminate; no automatic retry until reconciliation.
8. Crash after terminal DB commit but before GitHub projection: projection repair completes without rerunning worker.
9. Attempt retry: old attempt remains immutable and terminal; new attempt has new ID/number/idempotency key.
10. Lease takeover: generation increments but attempt number and attempt ID remain unchanged only for a formally resumable execution.
11. Retry budget: takeovers do not consume attempts; each new execution attempt consumes exactly one.
12. Task envelope mutation / mismatched target SHA / profile / repository: reject.
13. Cross-task or cross-attempt lease token reuse: reject.
14. Dead-letter transition at policy limit: atomic with audit/outbox.
15. D1 concurrency and restart tests use Workers runtime; synthetic SQLite-only evidence is insufficient for D1 qualification.

## 8. Migration plan from PR #40

Do not mutate or reinterpret existing `attempt_count` as immutable history. Add a new attempt table and explicit lease fields/constraints. For existing proof rows, either:
- preserve legacy `attempt_count` as `legacy_acquisition_count` and mark history as unavailable; or
- migrate only if a complete acquisition history exists in source evidence.

Do not fabricate attempt rows from a scalar counter. Keep the migration local-only until exact schema and tests pass. Update README to state historical limitations.

## 9. Implementation sequence and gates

1. Approve the state machine and exact field/transition contract in code review.
2. Add migration and typed adapter operations behind dispatch=false.
3. Add adversarial Workers-runtime D1 tests listed above.
4. Reconcile Supervisor/Worker run identity and downstream idempotency/fencing.
5. Run exact-head CI and inspect artifacts/source digests.
6. Obtain authorized independent security/governance review; same-account repeated review submissions are not independent evidence.
7. Only after all gates, plan isolated remote D1 qualification. No provider/model execution or production deployment is authorized by this document.

## 10. Current status

- State-machine design: PROPOSED.
- PR #40 implementation: INCOMPATIBLE / NOT IMPLEMENTED.
- PR #37 reusable Worker boundary: exact-head static validation runs SUCCESS, but runtime invocation NOT RUN; PR remains OPEN / DRAFT / UNMERGED.
- PR #37 reviews: all observed submissions are from the same connected reviewer account; independence NOT VERIFIED. No inline threads were returned.
- No remote D1, real worker execution, provider/model call, secret access or deployment.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
