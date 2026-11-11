# Recovery and projection follow-up review — 2026-11-11

## Scope and immutable targets

Read-only review of new draft PRs:
- PR #56: `0769b6b5d5eda9c7821804b93db21ded6e0985ef`
- PR #58: `6f7953e4abec3cc564984ee3635cdb7717ae5d5`
- PR #59: `22200226da4f1af30645cf441a639db6893e9310`
- PR #60: `234fb2ee40265e26fac00c69ac1b6192766602cb`
- Existing docs branch target before this pass: `6105135a2e7d55f0d96c197673ab066d1e07c47b`

All four PRs remain OPEN/DRAFT/UNMERGED. No runtime, schema, workflow, secret, permission, dispatch, hosted resource, deployment or merge action was performed.

## New evidence and disposition

### PR #56 — expired attempt takeover

The change removes the `resumable` parameter from `acquireAttemptLease`, permits acquisition only for a `pending` task whose current attempt is `prepared`, and tests that a forged extra JS argument `{resumable:true, executorStopped:true}` cannot take over an expired running attempt. Exact-head workflow run `42825872826` COMPLETED/SUCCESS; combined status contexts empty.

Disposition: LOCAL_PROOF that this adapter no longer treats caller metadata as takeover authority. It is not merged, does not retire the parallel legacy task-lease API, and does not provide an authorized resolver for indeterminate attempts. No independent review or hosted qualification evidenced.

### PR #58 — fake GitHub terminal projection reconciler

Adds a local-only injected fake API protocol. Tests cover:
- successful comment POST with lost response, followed by marker readback without a second POST;
- delayed marker visibility, followed by reconciliation-only pass;
- no POST when `allowPost=false`;
- conflicting/duplicate markers;
- preservation of non-`pool:` labels;
- label mutation/readback failure and malformed envelopes.

Exact-head workflow runs/status contexts: none returned; NOT VERIFIED.

Important limits:
1. `allowPost` is a caller-supplied boolean, not a persisted or issuer-authorized state transition. The module comment says reconciliation-only is mandatory after ambiguity, but no trusted composition boundary enforces this across invocations.
2. The fake test is sequential. Two concurrent reconcilers can both read “marker absent” before either POST becomes visible and both create comments; there is no atomic GitHub uniqueness primitive or demonstrated concurrency guard.
3. The tests do not use a real GitHub API, authenticated adapter, production token or hosted outbox consumer. They are a protocol simulation, not external side-effect qualification.
4. Labels are applied as a sequence of add/remove calls, not one atomic GitHub transaction. Readback detects divergence but does not prevent concurrent writers.

Disposition: useful LOCAL_PROTOCOL_PROOF, not end-to-end idempotency or hosted qualification.

### PR #59 — bounded retry and dead-letter

Adds retry metadata, 30/60/120/240-second backoff, five-attempt cap, monotonic attempt guard, durable dead-letter fields/events, and terminal dead-letter SQL guard. Exact-head workflow run `42981807825` COMPLETED/SUCCESS; combined status contexts empty.

The delivery adapter's `deadLetterExpiredProjection(db, outboxId, workerId, generation, now)` still requires the original lease owner and caller-provided time. This prevents an unrelated caller from impersonating the owner but does not solve abandoned-worker recovery. The function is not a trusted Recovery Actor boundary. PR #60 is the proposed design dependency.

Disposition: LOCAL D1 proof for bounded retry/dead-letter invariants only. Not a production recovery authority and not hosted qualification.

### PR #60 — Recovery Actor contract

Defines a distinct projection-recovery grant profile, exact audience `projection-outbox-recovery`, operation `dead_letter_expired_projection`, repository/outbox/attempt/generation/digest binding, issuer/key/revocation/policy epoch requirements, trusted-time constraints, nonce consumption, audit and adversarial tests.

The contract explicitly leaves issuer service, authenticated issuance principal, key custody, revocation source, production clock, audit sink and retention ownership unresolved. It is design-only; exact-head CI absent and independent review not evidenced. The task Resolver grant must not be widened or reused as a projection-recovery grant.

Disposition: useful design contract; issuer and trusted-time dependencies remain PLANNED / NOT IMPLEMENTED / NOT QUALIFIED.

## Mature component reuse

A focused GitHub repository search for Cloudflare D1 transactional outbox consumers and GitHub Actions outbox reconciliation returned no candidate repository results. No evidence supports replacing the existing Workers Vitest + D1 proof substrate. Continue reuse of the in-repository ledger and test harness; do not introduce a new orchestrator based on an unqualified search result.

## Exact-head evidence snapshot

| PR | Workflow evidence | Combined statuses | Result |
|---|---|---|---|
| #56 | 42825872826 COMPLETED/SUCCESS | empty | local proof SUCCEEDED |
| #58 | no run returned | empty | NOT VERIFIED |
| #59 | 42981807825 COMPLETED/SUCCESS | empty | local proof SUCCEEDED |
| #60 | no run returned | empty | NOT VERIFIED |
| #63 | no run returned | empty | NOT VERIFIED |
| #64 | no run returned | empty | NOT VERIFIED |

A missing run/status is NOT VERIFIED. Historical local D1 success is not hosted D1 qualification, independent review, or integration acceptance.

## Required next actions

1. Keep PR #56 unmerged until its tests are reviewed against the complete Supervisor/Worker/legacy lease call graph; add cross-API tests and retire or hard-disable the legacy lifecycle through an authorized change.
2. In PR #58, persist an irreversible “POST may have happened” state before external POST; subsequent attempts must be reconciliation-only unless a trusted, separately authorized policy explicitly grants another POST. Add concurrent two-reconciler tests and test duplicate marker creation races.
3. In PR #59, retain bounded retry/dead-letter, but do not expose expired-dead-letter recovery to caller-supplied worker identity/time. Require the issuer-authorized grant and qualified time composition specified by PR #60.
4. Resolve PR #60 governance ownership: issuer service/principal, key lifecycle, revocation source, trusted clock, audit sink and accountable operators. Do not implement cryptographic code before these dependencies are named and qualified.
5. Connect projection delivery generation and event digest to the real Worker/finalizer boundary; independent security review and hosted D1 qualification remain mandatory.

## Status

- PR #56 local fix proof: SUCCEEDED; integration/merge: NOT ACCEPTED.
- PR #58 fake GitHub protocol: LOCAL PROOF; exact-head CI NOT VERIFIED; concurrency and external API qualification GAP.
- PR #59 bounded retry/dead-letter: SUCCEEDED local proof; hosted qualification NOT RUN.
- PR #60 issuer/time contract: DESIGN ONLY; implementation and qualification NOT RUN.
- Production dispatch: FAIL-CLOSED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
