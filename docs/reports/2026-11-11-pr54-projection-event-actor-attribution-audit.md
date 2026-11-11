# PR #54 Projection Event Actor Attribution Audit — 2026-11-11

## Scope and immutable target

Read-only audit of the projection outbox event trigger and its review thread.
- PR #54 head: `ec3f3266ca28c4fb5633a9475cc6f396a4677974`.
- Base: `?` (not relied upon in this finding).
- Migration 0006 is part of PR #54.
- Exact-head workflow run: `42537241204`, completed SUCCESS.
- No source, schema, workflow, permission, secret, branch, dispatch, deployment, merge or live API changes.

## Finding P54-F01 — status event actor_id is NULL after lease owner is cleared

**Severity: correctness / audit provenance defect.**

Migration `0006_create_attempt_projection_outbox.sql` defines a status trigger:

```sql
AFTER UPDATE OF status ON pool_attempt_projection_outbox
WHEN NEW.status <> OLD.status AND NEW.status <> 'leased'
...
NEW.lease_owner, NEW.updated_at
```

The PR #54 adapter functions `markProjectionRetryable` and `acknowledgeProjectionDelivered` update the row by setting `lease_owner = NULL` in the same UPDATE that changes status to `retryable` or `delivered`. Therefore, for these transitions, `NEW.lease_owner` is NULL and the trigger writes a NULL `actor_id` into `pool_attempt_projection_events`.

The lease-acquired event uses a separate trigger and records the non-null new lease owner, but that does not repair attribution for the subsequent retryable/delivered/dead-letter status event. The actor that held the lease is available as `OLD.lease_owner` at trigger time. A fix should either use `OLD.lease_owner` for the transition actor, or explicitly persist a validated transition actor in a separate field. Do not infer authentication from this field: it remains attribution only.

### Required tests

1. Acquire a projection lease as worker A, mark retryable, assert the resulting `delivery.retryable` event has `actor_id = worker A`.
2. Acquire a projection lease as worker B, acknowledge delivered, assert `delivery.delivered` has `actor_id = worker B`.
3. Exercise dead-letter transition and assert the documented actor semantics.
4. Verify lease-acquired event actor remains correct.
5. Verify event rows remain append-only.
6. Verify a stale owner/generation cannot create a terminal event.

The PR already has an unresolved inline thread by the repository owner pointing out this defect (review thread `PRRT_kwDOVirI-s61rjeP`, comment database ID `4524475226`). It is not an independent approval or external security review.

## Relationship to the claim-service target decision

The default-branch decision record `docs/decisions/2026-11-11-durable-supervisor-claim-protocol.md` rejects GitHub Issue labels as an authoritative atomic lock and prefers a separately authenticated transactional claim service as a target architecture only. PR #54 is a local D1 proof, not a hosted service or authenticated issuer.

Correct actor attribution in the projection event log is necessary audit hygiene, but it does not provide:
- authenticated actor identity;
- trusted production time;
- a one-use issuer-verified capability;
- hosted D1 contention/failure qualification;
- proof that a projection lease authorizes exactly one GitHub POST.

PR #54 must therefore remain local proof only until the full promotion gates in Issue #38 and the decision record are evidenced.

## Reuse-first disposition

Retain the existing Cloudflare D1 + Workers Vitest local proof and its current schema. No new event framework, queue or audit library is justified by this finding. The correction is a narrow SQL trigger attribution fix plus tests; do not replace the established D1 mechanism.

## Status

- PR #54 exact-head CI: SUCCESS, run `42537241204`.
- PR #54 inline finding: OPEN / UNRESOLVED.
- PR #54 formal review: COMMENTED only; no independent approval.
- Hosted claim service: NOT SELECTED / NOT QUALIFIED.
- Issuer authentication and trusted time: NOT VERIFIED.
- Dispatch: fail-closed.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Next bounded action: fix the trigger attribution in PR #54 on its own head, add the three transition actor tests (retryable, delivered, dead-letter), run D1 proof CI on the exact updated head, and only then continue coordinated stack integration. Do not merge or enable dispatch.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
