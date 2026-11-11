# 2026-11-11 — PR #58/#59 projection outbox integration audit

## Scope and immutable targets

Read-only audit of the stacked proof changes:
- PR #58: `proof/fake-github-projection-reconciler-2026-11-11`, HEAD `6f7953e4abec3cc564984ee3635cdb7717ae5d5e`, base `test/50-approval-logical-task-contention-2026-11-09` at `ec3f3266ca28c4fb5633a9475cc6f396a4677974`.
- PR #59: `proof/projection-dead-letter-policy-2026-11-11`, HEAD `5c47cda4394d0381315bc16182799a09bf861797`, base PR #58 at `6f7953e4abec3cc564984ee3635cdb7717ae5d5e`.
- Default branch `Основной` HEAD observed: `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- PRs #58/#59 are OPEN, DRAFT, mergeable=true; formal reviews 0 and inline review threads 0 for both. Mergeable is not approval.

## Verified CI evidence

- PR #58 exact-head workflow run `42979949181`: COMPLETED / SUCCESS.
- PR #59 exact-head workflow run `42980783397`: COMPLETED / SUCCESS; job `130390442001`. The earlier run `42980650499` failed one test and is superseded only for current-head CI status, not erased from history.
- Existing PR #59 run log recorded checkout of exact PR head merged into exact base; syntax PASS; 3 test files / 53 tests PASS; lockfile artifact SHA-256 `7dbc1b8b34dcdf4d03868df27168857b250eed43f6798990419042c9fccb8ebc`.
- These are local Workers-runtime D1 proof tests, not live GitHub API, deployed D1, hosted runtime or production qualification.

## Positive findings

1. PR #58 fake GitHub adapter handles a lost POST response by read-back and does not immediately post twice; delayed marker visibility remains retryable and can be reconciled without another POST.
2. Event markers are bound to event ID and payload digest; duplicate markers and digest conflicts fail closed.
3. Managed label reconciliation is scoped to `pool:*` labels and preserves unrelated labels.
4. PR #59 introduces a five-attempt cap in the acquisition adapter, deterministic retry delays (30/60/120/240 seconds), bounded dead-letter transition, generation-fenced expired-fifth-lease recovery, and a terminal dead-letter trigger.
5. The migration recreates the status-event trigger so non-lease status changes create delivery events with a reason code.

## Finding — attempt counter is capped but not monotonic at database level

**Status: STATIC CONTRACT GAP — requires adversarial test and remediation before qualification.**

Migration `proofs/d1-ledger/migrations/0007_bound_projection_delivery_retries.sql` creates:
- `pool_attempt_projection_attempt_budget_guard`: rejects `NEW.delivery_attempts > 5`;
- dead-letter evidence guard;
- terminal dead-letter update guard.

The attempt-budget guard does not reject a decrease (`NEW.delivery_attempts < OLD.delivery_attempts`). The adapter increments attempts on acquisition and filters acquisition by `delivery_attempts < 5`, but the migration's stated database-level bypass protection does not establish monotonicity. A direct SQL update to reduce the counter while the row is not dead-lettered could restore retry budget if no earlier schema trigger independently prohibits it. That prior-schema condition was not established in this pass; therefore classify the exploitability as NOT VERIFIED, while the missing monotonic predicate in migration 0007 is directly observed.

Required remediation/test:
- Add a database trigger rejecting `NEW.delivery_attempts < OLD.delivery_attempts` (and preferably constrain transitions to increments of exactly one only when a valid delivery lease is acquired, if compatible with the existing adapter).
- Add a Workers-runtime adversarial test: after at least one failed delivery, attempt to decrement the counter directly; assert SQLite abort and unchanged row. Also test no counter reset via status transition.
- Re-run exact-head CI on the resulting PR head and inspect migration application order and trigger interactions.

## Trigger and state-transition review

- The recreated status event trigger fires on changed status except transition to `leased`; it records retryable, delivered and dead_letter events. Event ID includes status, outbox ID and delivery lease generation.
- The dead-letter evidence trigger requires five or more attempts, timestamp/reason, and cleared lease owner/expiry.
- The terminal trigger blocks every subsequent update once OLD.status is dead_letter.
- The expired-fifth-lease path checks outbox ID, status, worker ID, delivery generation, expiry and attempt budget before transition; stale worker recovery is denied by the adapter predicate.
- Full production concurrency semantics, remote D1 transaction behavior and live GitHub projection remain NOT VERIFIED.

## Disposition

- PR #58 fake GitHub reconciliation proof: CI SUCCEEDED; review NOT RUN.
- PR #59 bounded retry/dead-letter proof: CI SUCCEEDED at exact head; review NOT RUN; one database-level monotonicity gap identified.
- Neither PR is ACCEPTED or merged. Do not treat these proof PRs as production code.
- No merge, branch mutation, dispatch, deployment, secret access, provider call or paid resource creation occurred.
- Contour A BLOCKED / NOT ACCEPTED. Contour B DEFERRED.

## Next bounded step

Prepare a narrowly scoped follow-up to PR #59 adding the database-level monotonic attempt-counter guard and adversarial D1 test; then run exact-head CI. Keep PR #59 draft and unmerged pending integration and review.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
