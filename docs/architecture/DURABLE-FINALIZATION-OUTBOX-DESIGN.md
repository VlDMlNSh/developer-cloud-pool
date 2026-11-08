# Durable finalization outbox design decision — 2026-11-09

## Status

PROPOSED / DESIGN ONLY. Not implemented, not selected as production storage, not qualified, and not authorized for dispatch.

This note addresses PR #53 findings F2-R1 (terminal Issue mutation can succeed while audit comment fails) and F2-R2 (GitHub Issue label PATCH is not compare-and-swap).

## Immutable evidence reviewed

- PR #53 head: `b8a253f06418841d5f0250c9fd550bf3247db040`.
- PR #53 runner blob: `b0af6b4d97ac497315ac90978518cb63efd6e3ac`.
- Existing local D1 attempt adapter blob: `6cb028e048569700ed623d93462ef55e2392a084`.
- Existing local D1 attempt migration blob: `0ad590ffdd2589f857257739275c15ed2d54d729`.
- Existing local D1 claim/outbox adapter blob: `37d75e2b31d9214b04398527eb08dce296f1ff27`.
- Existing local D1 tests already prove transactional claim/outbox creation and that terminal attempt update, append-only terminal audit event, and task projection occur in one SQLite transaction through triggers.
- PR #53 runner performs GitHub Issue label PATCH, reads back the terminal state, then POSTs an Issue comment. The runner has no durable intent or retry/reconciliation state spanning those two API calls.

The local D1 package uses the official Cloudflare Workers Vitest integration and Miniflare/workerd. It is a local proof only; it does not prove hosted D1 entitlement, availability, account quotas, or production authority.

## Decision

Keep the authoritative task lifecycle and audit event in one conditional-write transactional state store. Treat GitHub Issue labels and comments as external projections, never as the authoritative claim/finalization record.

D1 is the leading implementation candidate because the repository already has a local D1 schema, trigger-backed atomic transitions, an outbox precedent, and Workers-runtime tests. This is a candidate architecture, NOT a production selection. Production use remains blocked until account entitlement, isolated credentials, quotas, backup/recovery, and real hosted contention are independently qualified.

Do not try to make GitHub Issues label PATCH act as a lock or transaction. Do not grant broad `Contents: write` to the current Supervisor to obtain a Git-ref workaround.

## Proposed transaction boundary

One D1 transaction must commit all of the following together:

1. Fenced attempt terminal transition, validating task key, attempt ID, lease owner, lease generation, and unexpired lease.
2. Immutable terminal audit event, keyed by deterministic event ID such as `attempt-finalized:<attempt_id>`.
3. Task lifecycle projection (completed or pending/reconciliation state).
4. One immutable projection-outbox row keyed by the same terminal event ID, containing the GitHub repository ID, Issue number, target SHA, claim generation, terminal outcome, event digest, schema version, and canonical payload digest.

A uniqueness constraint on the terminal event ID / outbox event ID prevents a second logical event. The event payload and identity fields are immutable. No provider secrets, tokens, raw credentials, or sensitive execution output belong in the event.

If any insert/update/trigger fails, the entire transaction rolls back. A caller-observed lost response is recovered by reading the terminal event and outbox row by deterministic ID; exact replay returns the original result. Conflicting replay is denied.

## Outbox state machine

Suggested delivery record states:

- `pending`: committed with the terminal event, not yet leased.
- `leased`: a delivery worker owns a bounded lease and monotonically increasing delivery generation.
- `delivered`: required projection actions have been read back and reconciled.
- `retryable`: a transient failure or ambiguous response needs reconciliation/retry.
- `dead_letter`: bounded retry policy exhausted; operator reconciliation required. This state must never silently mark the task as unfinalized or permit execution replay.

Every lease acquisition/renewal/acknowledgement is a conditional D1 write fenced by outbox ID, lease owner, generation, and expiry. A stale worker cannot acknowledge a newer generation. Delivery attempts and outcomes are appended to a separate immutable delivery-event log.

## GitHub projection protocol

GitHub remains a projection target with weaker guarantees than the D1 transaction:

1. Validate the immutable outbox payload against the task's repository ID, Issue number, target SHA, and claim generation.
2. Reconcile only labels in the managed `pool:*` namespace. Do not replace the entire label set; preserve unrelated human labels. Prefer additive label operations and per-label removals over full-set PATCH, while recognizing that these calls are not a cross-request transaction.
3. Use a deterministic comment marker derived from the immutable event ID and payload digest. Before posting, list comments and search for the exact marker. If found, verify the digest and treat the comment as already projected.
4. If not found, post the comment. After success OR an ambiguous response, list comments again and verify the marker before acknowledging delivery.
5. If the marker is absent after a bounded reconciliation delay, retry with backoff. If a marker exists with a different digest, stop and dead-letter for investigation.
6. Read back the managed labels and comment marker; only then mark the outbox row delivered.

Important limitation: GitHub Issue comment creation has no demonstrated idempotency-key/CAS primitive in this design. A timed-out POST followed by delayed visibility can still produce duplicate comments. Therefore comment delivery is at-least-once with deterministic markers and duplicate detection/reconciliation, NOT exactly-once. The D1 audit event is the authoritative exactly-once logical record. If the product contract requires exactly one GitHub comment, this protocol is insufficient and dispatch must remain disabled until a qualified idempotent sink exists.

Labels are also a convergent projection, not an atomic lock. A reconciler may need to repair stale managed labels after concurrent external changes. The D1 task/lease generation remains authoritative.

## Authority and security boundary

- The current Supervisor must not receive broad `Contents: write` as a shortcut.
- The projection writer should have only the minimum GitHub Issue permissions required for the target repository and issue operations. Its identity must be separate from task-state authority and must not be able to alter the authoritative D1 ledger.
- The D1 binding/credential must be a dedicated least-privilege runtime identity; do not use the currently observed Cloudflare Super Administrator identity as a runtime credential.
- Keep repository ID, owner numeric ID, task key, Issue number, target SHA, claim generation, and event digest bound to the immutable envelope.
- A technical permission does not grant authority. Dispatch stays fail-closed until issuer/capability, identity, quota, and governance gates are satisfied.
- No secrets are read or copied by this design exercise.

## Failure matrix and required tests

| Failure point | Required recovery / expected invariant |
|---|---|
| D1 transaction fails before commit | No terminal event, task projection, or outbox row survives |
| D1 commit succeeds; caller loses response | Exact read/replay returns original event and outbox ID; one logical terminal event |
| Outbox worker crashes before external call | Lease expires; new generation safely reclaims |
| Worker crashes during GitHub comment POST | Reconcile deterministic marker before retry; possible duplicate is detected, never treated as a second logical event |
| GitHub returns success but response is lost | Comment/labels are read back; ack only after digest-verified projection |
| Old worker returns after lease reclaim | Fenced D1 ack rejected; its external side effect is reconciled by the current worker |
| GitHub API unavailable | Outbox remains retryable; authoritative terminal state remains committed |
| Marker exists with conflicting digest | Dead-letter; no overwrite or silent acceptance |
| Managed labels conflict or human labels change | Reconcile only managed namespace; preserve unrelated labels; no claim of CAS |
| Retry budget exhausted | Dead-letter + explicit operator signal; no blind execution retry |

Required automated tests: transaction rollback, one outbox row under concurrent finalizers, exact replay after lost commit response, conflicting replay denial, single-winner outbox lease under concurrent workers, stale-generation ack rejection, retry/backoff, comment success/lost-response, delayed marker visibility, duplicate marker reconciliation, conflicting marker, unrelated-label preservation, managed-label repair, and dead-letter recovery.

Tests must run against the selected real backend. Local Miniflare tests are necessary but insufficient for production qualification.

## Alternatives considered

- GitHub Issue labels/comments as the sole authority: rejected. Label PATCH is not CAS and split label/comment writes are not atomic.
- Dedicated Git repository with immutable reservation refs: not selected. Create-ref requires `Contents: write`; giving this to the current Supervisor is an unacceptable privilege expansion. A separate narrowly scoped authority would require its own threat model and hosted contention proof.
- D1 as authority + transactional outbox: preferred candidate for further qualification because the repository already contains a matching local proof. It remains unqualified until hosted account and credential boundaries are verified.
- GitHub Actions concurrency alone: insufficient as a global lock; it serializes only workflows sharing the same concurrency group and is not an atomic condition on external Issue state.

## Gate and acceptance criteria

No dispatch gate changes, workflow enablement, production integration, deployment, remote database creation, provider/model invocation, or secret access are authorized by this design note.

Before adoption:
1. Qualify a dedicated Cloudflare account/runtime identity, actual free-tier entitlement, quotas, isolation, backup/restore, and resource lifecycle without inspecting billing secrets.
2. Implement schema/adapter/outbox worker only on an isolated proof branch with exact immutable target SHA.
3. Prove concurrent single-winner finalization and outbox lease against hosted D1.
4. Prove recovery from every failure matrix row, including delayed comment visibility and stale worker side effects.
5. Independently audit least privilege, provenance, issuer/capability, and data handling.
6. Obtain exact-head CI and review evidence; preserve dispatch fail-closed until accepted.

## Current disposition

- F2-R1: design path defined; NOT FIXED in PR #53.
- F2-R2: GitHub labels explicitly demoted to projection; NOT FIXED in PR #53.
- D1 outbox design: PROPOSED, NOT IMPLEMENTED, NOT QUALIFIED.
- Issue #38: OPEN.
- PR #53: OPEN / DRAFT / UNMERGED.
- PR #51 and #54: local D1 proof PRs, OPEN / DRAFT / UNMERGED.
- Dispatch: FAIL-CLOSED.
- Contour A: BLOCKED / NOT QUALIFIED / NOT ACCEPTED.
- Contour B: DEFERRED.

## References

- PR #53: https://github.com/VlDMlNSh/developer-cloud-pool/pull/53
- Issue #38: https://github.com/VlDMlNSh/developer-cloud-pool/issues/38
- Local D1 proof PR #54: https://github.com/VlDMlNSh/developer-cloud-pool/pull/54
- Local D1 source: https://github.com/VlDMlNSh/developer-cloud-pool/blob/ded780c6aeea6cdd88b253a2087692eecbbce7c7/proofs/d1-ledger/src/task-attempts.mjs
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
