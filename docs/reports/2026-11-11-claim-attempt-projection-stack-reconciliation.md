# 2026-11-11 — Reconcile claim, attempt and projection proof stack

## Scope and immutable snapshot

- Date: 2026-11-11.
- Default branch `Основной` HEAD before this report: `b4d2a335d2a89372eb618dcda50b09f97b36a946`.
- PR #39 head `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`, base `9ef7e4aadd6c723fa86b21ea44383f8020643a0c`, OPEN/DRAFT.
- PR #54 head `15a09c910f52553c59796260131a6b5a4a39c15f`, base `b9067dc7d06245893cd4e208f6215438efe5ca64`, OPEN/DRAFT.
- PR #58 head `6f7953e4abec3cc564984ee3635cdb7717ae5d5e`, base `ec3f3266ca28c4fb5633a9475cc6f396a4677974`, OPEN/DRAFT.
- PR #53 head `3458b01c99e0a3ed62e5469dc11631ec5316b0cd`, base PR #37 head `1be8672c1be1a720b6c813dcafff5c020b6456ae`, OPEN/DRAFT.
- Issue #38 remains OPEN.
- This is a read-only architecture reconciliation; no source/runtime/secret/resource/dispatch/deployment/merge changes.

## Existing local components and evidence

### PR #39 — approval consume + claim/outbox

- Implements conditional ready→consumed update and trigger-backed creation of a per-approval claim plus deterministic outbox in the same SQLite transaction.
- Checks full immutable approval binding on retry and rejects pre-consumed approval with a matching timestamp.
- Trigger rollback test verifies approval remains ready and no claim row survives when outbox insertion aborts.
- Exact PR run `42329993548` and push run `42329991471`: COMPLETED/SUCCESS; job `128274072508` succeeded.
- Local Workers Vitest/Miniflare proof only; synthetic database and injected clock. No hosted service, authenticated issuer, trusted time, or production service boundary.

### PR #54 — canonical logical task, attempts and lifecycle

- Adds logical task identity shared by distinct approvals; 50-way task contention proof was previously recorded in Issue #38 comments as run `42537241204` / job `128904147572` SUCCESS. Current PR #54 exact-head run `43010770730` / job `130489510967` COMPLETED/SUCCESS.
- Current branch contains immutable attempt lifecycle, generation-fenced task/attempt leases, exact finalization replay checks, indeterminate-attempt queue, and attempt projection outbox.
- Migration `0005_create_attempt_reconciliation_queue.sql` creates a pending reconciliation record when a running attempt becomes indeterminate and only when it is still the task's current attempt/generation. The queue does not authorize retries.
- Migration `0006_create_attempt_projection_outbox.sql` creates a projection outbox row from an `attempt.finalized` event and append-only delivery events.
- `projection-outbox.mjs` uses conditional updates for lease acquisition, retryable and delivered acknowledgement, with delivery generation fencing.
- Exact-head job confirms the Workers-runtime adversarial test step succeeded. This is still a local proof, not hosted D1 qualification.
- The 50-approval contention result is evidence for canonical logical task identity, not evidence of a deployed claim service or an authenticated owner approval channel.

### PR #58 — GitHub projection reconciler

- Adds an injected fake GitHub adapter for deterministic event markers, comment read-back, delayed visibility, lost POST response and idempotent reconciliation.
- Mutates only managed `pool:*` labels and retains unrelated labels in its fake transport tests.
- Exact PR run `42979949181` and push run `42979945524`: COMPLETED/SUCCESS; PR job `130387805034` completed successfully.
- This is a fake API-boundary proof. It is not live GitHub race qualification, hosted outbox delivery, nor proof of transactional consistency across D1 and GitHub.

### PR #53 — GitHub-native finalizer

- Exact-head runs `43042039819` and `43042039837` succeeded for head `3458b01c99e0a3ed62e5469dc11631ec5316b0cd`; transport suite reports 19/19 tests.
- It verifies the audit marker before terminal label PATCH and reconciles ambiguous POST/PATCH outcomes.
- Its own race test demonstrates GitHub whole-label PATCH can overwrite a concurrent human label while read-back still looks terminal. This is an explicit unresolved non-CAS hazard.

## Architecture reconciliation

The proofs form useful layers but are not yet one integrated authority:

1. PR #39 is the earlier per-approval consume/claim/outbox proof.
2. PR #54 advances the model to one canonical logical task with immutable attempts, fenced leases, indeterminate reconciliation and terminal projection outbox.
3. PR #58 provides a fake GitHub projection protocol, but is not wired to a hosted D1 outbox consumer or production GitHub adapter.
4. PR #53 independently finalizes GitHub Issues directly. It does not condition its terminal projection on an authoritative PR #54 attempt finalization/outbox event.

Therefore PR #53 and PR #54 currently represent parallel finalization paths. They must not both be treated as production authorities. The target composition should make the transactional Claim/Attempt Store the only source of truth; GitHub Issue labels/comments should be a retryable projection driven by the committed outbox. The D1 outbox delivery lease/generation must fence the projection worker; the projection worker must not dispatch or change task/attempt authority.

## Gaps before integration or qualification

- No authenticated issuer service: owner/repository identifiers and timestamps remain caller-provided in local fixtures.
- No production trusted clock, revocation path, nonce replay protection or signed capability verification.
- No hosted D1 database/Worker deployment, account free-tier eligibility or credential custody qualification.
- No actual Supervisor → Claim Service → Outbox → Worker → Attempt Finalizer → Projection Reconciler wiring.
- Local tests do not prove production account concurrency, remote D1 transaction semantics, process restart behavior or external side-effect idempotency.
- PR #53's direct GitHub finalizer retains a known non-CAS label race; do not promote it as authority.
- The active default ruleset `26550182` was previously observed with zero required approvals and no CODEOWNERS review. Its policy does not enforce independent review.
- No merge, dispatch, hosted provisioning or enablement is justified by these local proofs.

## Reuse and external component decision

No new OSS dependency is justified in this pass. Continue using the existing Cloudflare Workers Vitest integration and local D1 proof harness; keep GitHub Issues as projection only. Do not add a second coordination database, Durable Objects or an orchestration framework until a concrete requirement and free-tier/authority evidence justify it.

## Status and next step

- PR #39: local per-approval claim/outbox proof — SOURCE/CI VERIFIED, NOT HOSTED QUALIFIED.
- PR #54: local logical task/attempt/fencing/outbox proof — SOURCE/CI VERIFIED, NOT HOSTED QUALIFIED.
- PR #58: fake GitHub projection reconciliation — SOURCE/CI VERIFIED, NOT LIVE QUALIFIED.
- PR #53: finalizer transport proof — EXACT-HEAD CI VERIFIED, F2 non-CAS risk OPEN.
- Issue #38: OPEN / NOT QUALIFIED.
- Dispatch: FAIL-CLOSED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Next bounded engineering step: create one backend-neutral integration contract mapping the PR #54 authoritative state transitions and outbox identity to the PR #58 projection protocol, then add local cross-module tests proving terminal event → one outbox → idempotent projection and that projection failures never mutate task/attempt state. Keep hosted provisioning and dispatch disabled until issuer, trusted time, account eligibility and governance are qualified.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
