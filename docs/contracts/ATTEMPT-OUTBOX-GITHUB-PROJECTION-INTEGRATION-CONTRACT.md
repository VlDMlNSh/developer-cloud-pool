# Attempt Outbox → GitHub Projection Integration Contract

Status: LOCAL PROOF CONTRACT / NOT HOSTED QUALIFIED

## Authority and data flow

1. `pool_attempt_events` is append-only. A committed `attempt.finalized` event causes migration 0006 to insert exactly one `pool_attempt_projection_outbox` row in the same D1 transaction.
2. The outbox row is the immutable source for projection identity and payload, enforced by migration 0009 against updates to: `outbox_id`, `event_digest`, `repository_id`, `issue_number`, `target_sha`, `profile`, `lease_generation`, `terminal_status`.
3. `projectionEnvelopeFromOutbox(row)` is the pure adapter. It maps:
   - `outbox_id → eventId`
   - `event_digest → payloadDigest`
   - `repository_id → repositoryId`
   - `issue_number → issueNumber`
   - `target_sha → targetSha`
   - `lease_generation → claimGeneration`
   - `terminal_status → terminalOutcome`\n   - The identity fields above cannot be rewritten after insertion; delivery/lease state fields remain mutable.
   - succeeded → `pool:probe-complete`; failed/abandoned → `pool:needs-review`.
4. `reconcileTerminalProjection(api, envelope)` may write only the deterministic audit comment and managed `pool:*` labels. It has no task/attempt storage handle and returns `dispatch:false`.
5. Only `createProjectionDeliveryOrchestrator({ db, api, workerId, clock, leaseSeconds })` is the public delivery boundary. Its per-delivery method accepts only an `outboxId`; it acquires and reads back the lease itself, derives the envelope from that same row, reconciles the projection, validates exact `eventId` and digest, conditionally ACKs using a private SQL helper, and confirms the delivered row by read-back. No receipt-free ACK function is exported. Migration 0009 prevents rewriting the event digest or other projection identity fields after outbox insertion. Retryable projection uses the same fenced lease; stale generations fail closed.
6. Projection failure must not roll back, rewrite, reopen, or otherwise mutate the finalized task/attempt. Projection delivery status is separate from task/attempt terminal status.

## Idempotency and failure semantics

- One finalized attempt has one outbox row because `attempt_id` is unique and the outbox insert is trigger-backed.
- Event identity and digest are deterministic and are checked by the projection marker.
- Lost comment POST response is resolved by read-back; do not blindly POST again during reconciliation-only passes.
- Duplicate marker or digest conflict is DENY.
- Partial label updates or ambiguous GitHub responses are RETRYABLE until read-back proves the managed-label projection.
- Unrelated labels are not intentionally modified by the reconciler.
- GitHub labels/comments are a projection, never the source of task/attempt authority.
- GitHub APIs are not transactional/CAS. Concurrent edits may still race; this local fake adapter is not evidence of live race safety.

## Explicit non-goals and qualification gates

This contract does not implement or authorize a production Worker, live GitHub API adapter, dispatch, hosted D1, issuer authentication, trusted clock, revocation, nonce replay protection, or deployment. The runtime must wire `clock.now()` from a separately qualified trusted-time authority and bind `workerId` from its runtime identity. The local proof factory accepts injected adapters for deterministic tests; callers of `deliver()` cannot supply timestamps, receipts, worker identity or lease generations.

Required before hosted qualification: wire the real outbox lease → mapper → bounded GitHub adapter → verified projection → fenced D1 acknowledgement path; test crash/restart and lost-response windows; qualify issuer/time/secret isolation; obtain independent security/governance review and hosted account entitlement evidence.

## Label ownership correction — 2026-11-12

The reconciler mutates only the explicit projection-owned label set: `pool:claimed` (the pre-terminal claim label evidenced by the local test fixture) and the terminal labels in `ALLOWED_LABELS` (`pool:probe-complete`, `pool:needs-review`, `pool:completed`, `pool:failed`). It must preserve unrelated labels, including unknown `pool:*` labels, because the prefix alone does not establish ownership. Read-back verifies only this explicit managed set. The complete operational label registry still requires source/governance confirmation before live GitHub qualification.

## Remaining duplicate-POST qualification gap

The current orchestrator invokes reconciliation with `allowPost: true` on every acquired delivery lease. A single invocation does not issue a second POST after a lost response, but a subsequent retry can POST again if the first accepted comment remains temporarily invisible to reads. The existing delayed-visibility unit test covers only a manual follow-up with `allowPost: false`; it does not exercise a second orchestrator delivery, which currently re-enables POST. Therefore the implementation cannot yet claim duplicate-POST prevention across retries. A durable post-attempt/indeterminate state or a documented at-most-once/manual-resolution policy is needed before live GitHub writes. Do not solve this by blindly repeating POST or by marking delivery successful without marker read-back.
