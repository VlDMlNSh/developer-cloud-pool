# Projection comment at-most-once implementation — 2026-11-12

## Scope and immutable target

- Bounded author-side implementation in PR #67 only.
- Base: `Основной@221f216c00ca7e5596bcc682ba185ad155a10603`.
- Branch: `impl/receipt-bound-projection-2026-11-11`.
- Final tested head: `f8280ba5a78ffcf1c18bf33f0dc8932ebb36a81d`.
- PR #67 remains OPEN / DRAFT / UNMERGED; 20 commits ahead / 0 behind.

## Decision

Use a durable at-most-once comment POST gate, not an unsupported exactly-once claim.

The external GitHub comment API is not transactional with D1. A POST can be accepted while its response is lost or the marker remains temporarily invisible. Blind retries can create duplicates. Therefore D1 consumes the one automatic POST opportunity before the external side effect. Later leases may only reconcile/read the exact marker. This intentionally sacrifices automatic liveness when a crash occurs after reservation but before the POST; operator resolution remains a separate unimplemented governance decision.

## Implementation

### Migration 0010

Blob: `30ac9d0ed0cbede9586c365578c606b47bcce1a7`.

Adds:
- `comment_post_state`: `not_attempted`, `indeterminate`, `verified`.
- `comment_post_attempted_at` and `comment_post_attempt_generation`.
- Append-only `pool_attempt_projection_comment_events` evidence table.
- Monotonic transition guard: `not_attempted → indeterminate → verified`, with direct `not_attempted → verified` permitted only when an exact marker already exists.
- Active-lease fencing for state transitions.
- ACK guard rejecting `status='delivered'` unless `comment_post_state='verified'`.
- Append-only triggers for comment evidence events.

### Orchestrator and outbox

- Outbox helper blob: `06e80d04b4bb16fbc74028cb716b9167dcc965a1`.
- Orchestrator blob: `b09e9248323a57fff5e1c426eae012e2bb7aa3f0`.
- Integration contract blob: `e9bca72fd93709638a14e30210154c5c04759a11`.

Delivery flow:
1. Acquire the normal fenced D1 delivery lease and read back the immutable outbox identity plus comment state.
2. Always attempt read-only marker reconciliation first. If the exact marker already exists, no POST reservation is needed.
3. Only an exact `EVENT_MARKER_NOT_VISIBLE` result with state `not_attempted` may reserve the one POST opportunity. Reservation is a conditional D1 update under the current lease/generation.
4. Use fenced durable read-back—not UPDATE response metadata—as the authority that the reservation committed before allowing the external POST.
5. On every later lease with state `indeterminate`, use read-only reconciliation. If the marker is absent, record `COMMENT_POST_INDETERMINATE` and retry later without another POST.
6. Once the exact event ID + digest marker and the managed-label set are read back, persist `verified` under the active lease. D1 only ACKs after this state is durable and read back.
7. No automatic reset or second POST is provided. A crash after reservation but before the external call can leave the outbox permanently indeterminate until an explicitly authorized operator resolution is designed.

### Regression tests

Test blob: `a1b96a2e122b25594f75e5eb160c816ffff67812`.

Coverage added:
- First delivery reserves and POSTs once; marker is initially hidden.
- A second, distinct delivery lease sees the marker later, verifies it, and ACKs without another POST.
- If the marker remains invisible on the second lease, the state remains indeterminate and POST count remains one.
- Database triggers reject resetting indeterminate state and reject delivery ACK before marker verification.
- Existing expiry, lease takeover, concurrency, digest conflict, label reconciliation and D1 read-back tests remain in the suite.

## Exact-head CI evidence

Final tested head: `f8280ba5a78ffcf1c18bf33f0dc8932ebb36a81d`.

- Isolated D1 Ledger Proof run [43162121589](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43162121589): COMPLETED / SUCCESS.
  - Job `130995529921`: SUCCESS.
  - Syntax checks passed.
  - Workers-runtime D1 suite: 5 files / 69 tests passed.
  - Artifact ID `13918407008`; SHA-256 `3241473c3fc9835b40b2ea854d1c10f136bbc8d1aaef55b0854b8f828cb25623`.
- Pool Contract Validation run [43162128615](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43162128615): COMPLETED / SUCCESS.
  - Job `130995552690`: workflow syntax, dispatch-disabled assertion, YAML parse and pool security-contract validation passed.
- Earlier D1 runs on intermediate heads failed. Their logs showed that the D1 UPDATE had committed the reservation but response metadata was not a reliable signal for whether POST should proceed. The helper was corrected to use the fenced durable read-back as the authorization decision. The final exact-head run above passed.
- Combined commit status for the tested SHA returned zero contexts / PENDING. Workflow success is not a green required-status context.

## Limits and governance

- Local Workers-runtime D1 only. No hosted D1, live GitHub comment/label writes, real provider adapter, production Worker, dispatch, provider/model calls, deployment, secret reads, paid resources or merge.
- Fake GitHub adapter does not qualify live API visibility/concurrency behavior.
- Trusted clock, runtime worker identity, issuer, key custody, subject registry/revocation, private audit sink and privacy/retention ownership remain unqualified.
- Manual recovery for `indeterminate` must not reset the one-use state or issue a second POST without an explicit authority decision and evidence procedure.
- Independent technical/security/governance review remains deferred until actual Cloud Pool launch by owner direction.
- Recovery Actor remains limited to `dead_letter_expired_projection`; it is not extended by this implementation.
- Hosted D1 NOT QUALIFIED; dispatch FAIL-CLOSED; Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

## Next bounded step

Specify a governed operator-resolution procedure for permanently indeterminate comment POSTs (including proof requirements, actor authority, no-duplicate guarantee and audit evidence) without weakening the at-most-once database guard. Separately continue the remaining projection finalization actor/digest and fifth-lease recovery contract review. Do not enable live GitHub writes or hosted D1.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
