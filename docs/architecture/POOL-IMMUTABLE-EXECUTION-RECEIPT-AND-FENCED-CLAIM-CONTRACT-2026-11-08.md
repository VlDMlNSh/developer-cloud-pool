# Immutable execution receipt and fenced claim protocol

Date: 2026-11-08
Status: DESIGN CONTRACT / NOT IMPLEMENTED / NOT QUALIFIED
Scope: Contour A Supervisor → reusable Worker → Finalizer lifecycle
Authority: This document defines engineering acceptance requirements. It does not authorize dispatch, provisioning, deployment, provider/model calls, or secret access.

## 1. Required invariants

1. **Authenticated authority:** issuer identity and authority are derived from a verified principal and policy, never from caller-supplied JSON fields alone.
2. **Immutable approval:** each approval binds numeric repository/owner identity, task identity, target commit SHA, execution profile, canonical envelope digest, expiry, nonce, issuer key ID and policy version.
3. **Single active task execution:** at most one nonterminal attempt may exist for a task, regardless of how many approval records exist. Approval uniqueness alone is insufficient.
4. **Monotonic fencing:** every successful claim/reclaim increments a durable per-task fencing token. A result carrying an older token is rejected.
5. **Claim-bound execution:** a worker invocation is bound to the immutable envelope digest, task ID, attempt/generation, claim ID, claim owner, fencing token and exact workflow/run identity.
6. **Idempotent terminalization:** a finalizer may commit only a result that matches the current authoritative claim and has not already been terminalized with a conflicting receipt.
7. **No stale resurrection:** expired, superseded, cancelled or terminal attempts cannot be revived by a late worker or replayed approval.
8. **Honest delivery semantics:** atomic enqueue is not exactly-once external execution. Any external side effect requires its own idempotency/reconciliation contract.
9. **Fail closed:** missing, malformed, conflicting, unverifiable or unavailable authority/state means no worker invocation or no terminal write; route to manual review where safe.

## 2. Canonical immutable approval envelope

Canonical serialization must be versioned and deterministic (UTF-8, fixed field names/order, explicit null policy, normalized identifiers, no duplicate keys). Hash the exact canonical bytes using SHA-256. The digest is not a signature.

Required fields:
- schema_version and canonicalization_version;
- issuer: stable issuer ID, authenticated subject, issuer type, key ID, authority/policy reference;
- audience: exact repository numeric ID and service/environment;
- owner numeric ID and repository numeric ID/full name;
- task_id (stable issue/task identity) and approval_id (unique approval identity);
- target_sha (full immutable commit SHA) and allowlisted profile;
- issued_at, expires_at, nonce and policy_version;
- explicit approval decision and scope;
- envelope_digest over all preceding canonical fields.

The verifier must validate signature or equivalent trusted issuer assertion, key status/revocation, audience, repository/owner IDs, task scope, expiry against a trusted clock, nonce/replay state and policy version. Human issue labels/comments may be a projection or trigger, not the authority proof.

## 3. Durable task/attempt state machine

The authoritative store must support conditional writes/transactions. GitHub Issue labels and body PATCH/read-back do not provide compare-and-swap and are not an admissible authoritative claim ledger.

Suggested states:
- APPROVED: verified approval is eligible but not yet claimed;
- CLAIMED: unique active attempt owns a lease and fencing token;
- RUNNING: worker run identity is bound to the claim;
- RESULT_RECORDED: immutable receipt accepted, awaiting terminal projection if needed;
- SUCCEEDED / FAILED / CANCELLED: terminal states;
- NEEDS_REVIEW: ambiguous commit, integrity conflict, expiry/recovery uncertainty or operator intervention.

Atomic claim transaction must:
- lock/conditionally update task_id only if no active attempt exists;
- verify approval_id is unused and envelope digest unchanged;
- create unique attempt_id and claim_id;
- increment task fencing_token monotonically;
- record claim_owner, lease expiry, generation, target_sha, profile and envelope_digest;
- append an audit/outbox event in the same transaction.

A second distinct approval for the same task must not create another active attempt. If a task needs another execution, require an explicit new task revision or a policy-authorized reapproval after the prior attempt is terminal.

## 4. Lease, renewal, reclaim and fencing

- Lease expiry alone does not prove the worker stopped. Reclaim requires an authoritative conditional transition from the current generation to generation + 1 and fencing_token + 1.
- Renewal is conditional on task_id, attempt_id, claim_id, owner, generation and current fencing token; it cannot extend an already superseded claim.
- Reclaim records the previous attempt as expired/superseded and emits an audit event.
- Every worker heartbeat, result and side-effect request carries task_id, attempt_id, claim_id, generation and fencing token.
- Every receiver validates these values against the current durable record. Old-generation operations are rejected even if the old worker later resumes.
- If a downstream system cannot enforce fencing/idempotency, do not automatically retry side effects; move the task to NEEDS_REVIEW.

## 5. Worker execution identity and receipt

The invocation record must bind:
- repository numeric ID and immutable workflow source/ref/SHA;
- caller workflow identity separately from reusable callee identity;
- workflow run ID and run_attempt (plus job identity where available);
- task_id, approval_id, attempt_id, claim_id, claim_owner;
- envelope_digest, target_sha, profile, generation and fencing_token.

The Worker returns a bounded, schema-validated execution receipt containing:
- receipt_schema_version and result_id;
- all binding fields above;
- worker run ID/run_attempt and final job conclusion;
- started_at/finished_at from trusted platform evidence where available;
- result status, bounded output/artifact digests and explicit side-effect summary;
- provenance/signature or a trusted platform attestation reference.

A receipt with missing or mismatched binding fields is rejected. A job conclusion alone is not a receipt. Logs/comments are projections, not authoritative evidence.

## 6. Finalizer acceptance predicate

The Finalizer must read the authoritative record and conditionally commit only if all are true:
- task is nonterminal and has the exact active attempt;
- claim_id, claim_owner, generation and fencing_token match;
- envelope_digest, approval_id, target_sha and profile match;
- caller/callee workflow identities and run_id/run_attempt match the invocation record;
- receipt provenance is valid and result_id is not conflictingly consumed;
- lease/state policy permits this result (including an explicit late-result rule);
- terminal transition and immutable audit event are committed atomically/idempotently.

If the conditional commit response is lost, reconcile by reading the exact result_id/receipt digest. Do not rerun the Worker merely because the response was ambiguous. A different receipt for an already committed result moves to NEEDS_REVIEW and must not overwrite the accepted record.

GitHub issue labels/comments may then be updated as an eventually consistent projection. Projection failure must not roll back or duplicate the authoritative terminal result.

## 7. Outbox and external delivery

- Claim state and outbox enqueue must commit in one transaction.
- Each outbox event has a stable event_id, task_id, attempt_id, generation, fencing_token, envelope_digest and payload_digest.
- Delivery is at-least-once unless the receiver provides durable idempotency. Consumer records event_id and rejects stale fencing tokens.
- Acknowledgement is conditional on the exact event_id and current attempt identity.
- Retry policy is bounded; poison events go to dead-letter/NEEDS_REVIEW with retained evidence.
- Never describe the outbox as exactly-once external execution. Exactly-once effects require receiver-side atomic deduplication with the side effect or an explicit reconciliation protocol.

## 8. Recovery and ambiguous outcomes

| Failure point | Required behavior |
|---|---|
| Before claim transaction commits | No claim exists; safe to retry claim transaction |
| Claim committed, response lost | Read by stable task/claim identity; never blindly create a second claim |
| Outbox committed, worker not started | Redeliver same event_id; receiver deduplicates |
| Worker starts, then crashes | Lease/recovery policy; new generation only after conditional reclaim |
| Old worker resumes after reclaim | Fencing token mismatch; reject all writes/results |
| Worker completes, receipt response lost | Reconcile by result_id/receipt digest; do not re-execute automatically |
| Finalizer commit response lost | Read authoritative terminal record; no duplicate terminalization |
| GitHub projection fails | Retry projection only; authoritative state remains unchanged |
| Conflicting receipt or unverifiable clock/provenance | NEEDS_REVIEW; no automatic retry |

## 9. GitHub workflow identity correction (F1)

GitHub Actions context availability must be respected. Do not reference `job.workflow_repository`, `job.workflow_file_path` or `job.workflow_sha` in job-level `jobs.<job_id>.env` if those contexts are unavailable there. Move their evaluation to a step-level `env` location documented to support the job context, validate non-empty values inside the step, and retain distinct caller (`github.*`) and callee (`job.workflow_*`) checks.

Acceptance requires an integration workflow run that records only non-secret identity values and proves expected caller/callee repository, path and SHA values at runtime. YAML parsing or static string assertions alone do not close F1.

## 10. Finalizer correction (F2)

The current label-only `pool:claimed` check is insufficient. Finalization must use the authoritative claim record and complete acceptance predicate in §6. If the only available store is GitHub Issues, the implementation must explicitly remain non-qualified: GET/PATCH/read-back is not CAS and cannot prove fenced terminalization under races.

## 11. Required regression and qualification matrix

| Test | Expected invariant |
|---|---|
| Two approvals for one task race | Exactly one active task attempt |
| Duplicate event / replayed approval | No second claim or worker invocation |
| Claim response lost after commit | Reconcile existing claim; no duplicate |
| Lease renewal races reclaim | Exactly one conditional transition wins |
| Old worker returns after reclaim | Rejected by generation/fencing mismatch |
| Wrong envelope digest / target SHA / profile | Receipt rejected |
| Wrong caller/callee workflow identity | Invocation denied |
| Wrong run_id or run_attempt | Receipt rejected |
| Duplicate same receipt | Idempotent read-back, no second effect |
| Conflicting receipt for terminal attempt | NEEDS_REVIEW; no overwrite |
| Outbox redelivery | Receiver deduplicates stable event_id |
| Consumer acknowledges stale generation | Rejected |
| Worker crash before/after external side effect | Explicit reconciliation; no blind retry |
| Finalizer response lost | Read authoritative result; no rerun |
| Projection failure | Retry projection only |
| Key revoked/expired/wrong audience | Approval denied |
| Trusted clock unavailable | Fail closed |
| Restore from backup | State, uniqueness and fencing monotonicity preserved |

All tests must run against the exact immutable implementation SHA. Local SQLite/Miniflare tests are useful unit evidence but do not qualify remote D1, platform concurrency, worker identity or production recovery.

## 12. Acceptance gates and non-goals

Before implementation can be considered qualified:
1. Independent authorized reviewer approves this contract and the threat model.
2. Governance enforces independent approval for every relevant integration branch, including stacked branches.
3. Backend is selected based on verified free/card-free eligibility, conditional-write semantics, restore and account ownership.
4. Exact-head CI includes race/failure regression tests and F1 runtime identity integration test.
5. Disposable remote backend qualification covers contention, ambiguous commit, restart/restore, lease/fencing and outbox consumer recovery.
6. Integrated Supervisor/Worker/Finalizer tests prove no stale result can terminalize a newer attempt.
7. No paid fallback, no secrets exposed, no provider/model calls until separately authorized.

This contract does not authorize production dispatch, D1 provisioning, deployment, DSH/Resource Probe, provider/model calls, secret access or Contour B work.

## Status

- Contract authored on documentation working branch: DESIGN / NOT IMPLEMENTED.
- Independent approval: NOT RUN / NOT VERIFIED.
- F1/F2 remediation: NOT IMPLEMENTED.
- Remote D1 and integrated runtime qualification: NOT RUN.
- Dispatch: BLOCKED / FAIL-CLOSED.
- Contour A: BLOCKED / NOT QUALIFIED / NOT ACCEPTED.
- Contour B: DEFERRED.

## References

- Existing reusable workflow contract: [POOL reusable workflow authorization contract](POOL-REUSABLE-WORKFLOW-AUTHORIZATION-CONTRACT-2026-11-06.md).
- GitHub Actions contexts: https://docs.github.com/en/actions/reference/workflows-and-actions/contexts
- GitHub reusable workflows: https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows
- Cloudflare D1: https://developers.cloudflare.com/d1/
