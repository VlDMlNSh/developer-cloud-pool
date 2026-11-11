# Attempt Outbox → GitHub Projection Integration Contract

Status: LOCAL PROOF CONTRACT / NOT HOSTED QUALIFIED

## Authority and data flow

1. `pool_attempt_events` is append-only. A committed `attempt.finalized` event causes migration 0006 to insert exactly one `pool_attempt_projection_outbox` row in the same D1 transaction.
2. The outbox row is the immutable source for projection identity and payload: `outbox_id`, `event_digest`, `repository_id`, `issue_number`, `target_sha`, `profile`, `lease_generation`, `terminal_status`.
3. `projectionEnvelopeFromOutbox(row)` is the pure adapter. It maps:
   - `outbox_id → eventId`
   - `event_digest → payloadDigest`
   - `repository_id → repositoryId`
   - `issue_number → issueNumber`
   - `target_sha → targetSha`
   - `lease_generation → claimGeneration`
   - `terminal_status → terminalOutcome`
   - succeeded → `pool:probe-complete`; failed/abandoned → `pool:needs-review`.
4. `reconcileTerminalProjection(api, envelope)` may write only the deterministic audit comment and managed `pool:*` labels. It has no task/attempt storage handle and returns `dispatch:false`.
5. The caller may acknowledge the outbox as delivered only after `projection_verified:true`, using `acknowledgeProjectionDelivered(db, outboxId, workerId, deliveryGeneration, trustedNow)`. Retryable or ambiguous projection must use `markProjectionRetryable` with the same fenced delivery lease. A stale generation must fail closed.
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

This contract does not implement or authorize a production Worker, live GitHub API adapter, dispatch, hosted D1, issuer authentication, trusted clock, revocation, nonce replay protection, or deployment. D1 delivery lease `now` must be supplied by a separately qualified trusted-time authority; a caller-provided timestamp is not itself trusted.

Required before hosted qualification: wire the real outbox lease → mapper → bounded GitHub adapter → verified projection → fenced D1 acknowledgement path; test crash/restart and lost-response windows; qualify issuer/time/secret isolation; obtain independent security/governance review and hosted account entitlement evidence.
