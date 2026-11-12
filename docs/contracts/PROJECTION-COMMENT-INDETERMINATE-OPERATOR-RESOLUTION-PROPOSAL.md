# Projection comment indeterminate operator resolution — proposal

**Status: DESIGN PROPOSAL / NOT ACCEPTED / NOT IMPLEMENTED / NOT AUTHORIZED FOR RUNTIME**

Date: 2026-11-12

## 1. Purpose and scope

Define a future, separately governed disposition process for a projection outbox row whose durable comment state is `indeterminate` after the single permitted GitHub comment POST opportunity has been consumed.

This proposal does not authorize a second POST, reset of the at-most-once state, live GitHub writes, hosted D1, deployment, issuer implementation, or Recovery Actor expansion.

The proposal applies only to one exact projection outbox record and its immutable identity:
- repository ID;
- outbox ID / event ID;
- attempt ID;
- delivery generation and post-attempt generation;
- event digest;
- issue number.

It must not accept task IDs, wildcard repositories, ranges, arbitrary issue numbers, or batch operations as substitutes for the exact identity.

## 2. Source-bound current state

The current local proof has:
- `comment_post_state`: `not_attempted → indeterminate → verified`;
- a one-use reservation written under the current fenced delivery lease before external POST;
- append-only `post_reserved` and `marker_verified` comment events;
- a database guard requiring `verified` before delivery ACK;
- a separate bounded delivery retry budget and terminal `dead_letter` state.

Relevant implementation refs at PR #67 head `f8280ba5a78ffcf1c18bf33f0dc8932ebb36a81d`:
- migration 0007 dead-letter terminal guard: `767d95a30fa0a14c79e88c8c58392bfec9cdddc2`;
- migration 0010 at-most-once comment guard: `30ac9d0ed0cbede9586c365578c606b47bcce1a7`;
- outbox adapter: `06e80d04b4bb16fbc74028cb716b9167dcc965a1`;
- delivery orchestrator: `b09e9248323a57fff5e1c426eae012e2bb7aa3f0`;
- projection reconciler: `4d440879a850fec1e3313b01df1b139e71d92fd7`;
- integration contract: `e9bca72fd93709638a14e30210154c5c04759a11`.

These are local proof artifacts, not production authorization.

## 3. Core safety invariant

**After `comment_post_state` becomes `indeterminate`, no operator action, retry worker, Recovery Actor, or generic maintenance path may return it to `not_attempted` or authorize another comment POST.**

Absence of a marker from a read is not proof that GitHub did not accept the POST. Eventual visibility, pagination, API failure, permissions, stale reads, or incomplete enumeration can all make absence inconclusive.

The at-most-once guarantee therefore dominates liveness. A permanently indeterminate record may remain quarantined indefinitely.

## 4. Allowed dispositions

| Disposition | Required evidence | Permitted effect |
|---|---|---|
| `marker_confirmed` | Exact unique marker containing the exact outbox/event ID and event digest, read from the configured repository and issue; duplicate/conflicting marker checks; current immutable identity read-back | Request ordinary reconciliation under a new normal delivery lease. Only the existing orchestrator may record `verified` after exact marker and managed-label read-back, then ACK. Operator does not directly edit the state. |
| `unresolved_quarantined` | Exact row identity and current state read-back; bounded record of attempted read locations/times and API outcomes; reason code | Append a separate operator disposition record and keep the outbox terminal/quarantined. No comment POST, no reset, no task/attempt mutation. |
| `duplicate_or_conflict_incident` | Two or more matching event markers, digest mismatch, or inconsistent immutable identity | Append an incident disposition and freeze automated projection actions. Require separate incident handling; do not delete or rewrite comments automatically. |

A marker that becomes visible later can be confirmed by the normal reconciliation path. An operator disposition is not a substitute for the normal exact marker/digest and managed-label verification.

## 5. Explicitly prohibited dispositions

- `retry_post`, `reset_to_not_attempted`, or any state transition that re-enables POST.
- Treating repeated marker absence, elapsed time, an HTTP timeout, or a failed list call as proof that no comment was created.
- Directly setting `comment_post_state='verified'` without exact marker read-back and managed-label verification.
- Directly setting outbox status to `delivered`.
- Deleting, editing, or replacing GitHub comments to resolve duplicates.
- Reopening a dead-letter row or incrementing/resetting its delivery budget.
- Mutating `pool_tasks`, `pool_attempts`, task/attempt terminal state, task lease, task result, or provenance.
- Using Recovery Actor's `dead_letter_expired_projection` operation as a comment-resolution or replay capability.
- Batch, wildcard, cross-repository, or caller-selected target access.

## 6. Proposed authority and grant requirements

No issuer or operational owner for this capability is currently accepted. Any future implementation is blocked until governance names and approves:
- the issuer service owner;
- the operator principal registry owner;
- signing-key custodian and rotation/revocation authority;
- trusted-time source and maximum skew policy;
- private append-only audit sink and operator;
- privacy/legal retention owner;
- incident escalation owner.

A future one-use grant should bind all of:
- exact repository ID, outbox ID, attempt ID, issue number;
- exact event digest and post-attempt generation;
- exact subject/operator principal;
- issuer and key ID;
- audience identifying this operator-resolution service;
- one exact operation from the allowed disposition set;
- issued-at, not-before, expiry, policy epoch and one-use nonce;
- evidence-manifest digest and reason code.

The service must verify issuer trust, subject authorization, audience, exact scope, expiry against qualified trusted time, current revocation/policy epoch, and atomic nonce consumption. Caller-supplied identity or timestamps are not authority. A valid grant cannot authorize a prohibited POST retry or state reset.

No current draft A0 issuer contract is assumed to authorize this Cloud Pool capability; it is a separate audience and authority boundary.

## 7. Proposed audit record

A future append-only operator-resolution ledger should record:
- immutable outbox identity and event digest;
- prior outbox status, comment state, delivery generation and post-attempt generation;
- disposition and bounded reason code;
- operator principal, issuer, key ID, grant digest and nonce-consumption result (never secret material);
- evidence-manifest digest, evidence source identifiers, observation timestamps and API outcome classifications;
- trusted decision time, policy epoch and correlation ID;
- resulting state read-back and any normal orchestrator delivery generation;
- whether escalation was opened and its reference.

The ledger must reject UPDATE and DELETE. It must not store comment body contents or secret values. Evidence retention and access controls require privacy/legal approval before implementation.

## 8. Separation from Recovery Actor

Recovery Actor remains restricted to one exact operation: `dead_letter_expired_projection` for one expired, exhausted projection-delivery outbox lease.

Operator resolution is a different authority, principal, audience, grant operation and audit path. The two capabilities must not share a generic `recover`, `replay`, or `resolve` permission. Recovery Actor cannot issue grants, confirm comments, change comment state, reopen dead letters, or invoke GitHub APIs.

## 9. State and transaction model (future design only)

- The operator service may append a disposition record only after verifying the one-use grant and immutable outbox identity.
- `marker_confirmed` must enqueue or request the ordinary read-only reconciliation path; it must not write `verified` itself.
- `unresolved_quarantined` and `duplicate_or_conflict_incident` append records only; they do not mutate task/attempt authority or reset comment state.
- Any future schema change must preserve migration 0010's monotonic state trigger and migration 0007's dead-letter terminality.
- A separate append-only disposition ledger is preferable to weakening the current outbox state machine. Its schema, atomicity and idempotency contract require independent design review before code.

## 10. Acceptance gates before implementation

1. Named governance owners and operational responsibilities accepted.
2. A dedicated issuer, principal registry, revocation and trusted-time model approved for this exact capability.
3. Private audit sink, retention, access and incident procedures approved.
4. Formal threat model covers delayed visibility, incomplete pagination, stale reads, duplicate marker, digest conflict, grant replay, stale policy, operator compromise and concurrent lease takeover.
5. Database design proves no path resets the one-use POST guard or mutates task/attempt authority.
6. Tests cover grant replay, wrong repository/issue/digest, expired/revoked grant, duplicate evidence, ambiguous read, concurrent operators, and normal orchestrator-only verification.
7. Exact-head CI, independent security/governance review and hosted entitlement evidence completed.
8. Explicit separate acceptance before any live GitHub writes or deployment.

## 11. Current disposition

- Proposal: DOCUMENTED / NOT ACCEPTED.
- Runtime / issuer / operator ledger: NOT IMPLEMENTED.
- Recovery Actor: unchanged; NOT IMPLEMENTED / NOT QUALIFIED.
- Hosted D1: NOT QUALIFIED.
- Dispatch: FAIL-CLOSED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
- Independent review remains deferred until actual Cloud Pool launch by owner direction.

Next: resolve remaining source-level questions in the projection finalization actor/digest and fifth-lease recovery semantics. Do not implement operator resolution until the acceptance gates above have named owners and approved authority.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
