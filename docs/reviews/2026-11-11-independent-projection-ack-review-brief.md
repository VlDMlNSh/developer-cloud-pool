# Independent review brief — D1 projection delivery and receipt-bound acknowledgement — 2026-11-11

## Review status

REQUEST PREPARED / INDEPENDENT REVIEW NOT RUN. This document is a bounded hand-off specification, not a review result or approval. The authoring assistant is not an independent reviewer.

## Immutable review targets

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Current default branch: `Основной`
- Default base observed: `221f216c00ca7e5596bcc682ba185ad155a10603`
- PR #58 source head: `5caeb60f7a45d836c6ad1eea2fb86e20995da025`
- PR #59 source head: `22200226da4f1af30645cf441a639db6893e9310`
- Documentation candidate PR #66 head: `3cd1d138c6f620088f49232cb16def953bf825e7` (docs only; not implementation target).
- Relevant source files at exact PR heads:
  - #58: `proofs/d1-ledger/src/projection-reconciler.mjs`
  - #58: `proofs/d1-ledger/test/projection-reconciler.test.ts`
  - #59: `proofs/d1-ledger/src/projection-outbox.mjs`
  - #59: `proofs/d1-ledger/test/claim-outbox.test.ts`
  - #59: migrations `0007_bound_projection_delivery_retries.sql` and `0008_enforce_projection_attempt_monotonicity.sql`
  - #58/#59 combined manifest: `docs/reports/2026-11-11-d1-proof-harness-transplant-manifest.md` (read current documentation branch).

## Review questions — all must be answered

### A. Receipt-free acknowledgement defect
1. Confirm whether `acknowledgeProjectionDelivered(db, outboxId, workerId, generation, now)` can mark an outbox delivered without invoking or verifying the external projection reconciler.
2. Determine whether the current positive ACK test exercises a real verified projection receipt or merely supplies a valid lease tuple.
3. State the exact exploitability and invariant violation; distinguish a local proof harness from a production exploit.

### B. Receipt/orchestration design
1. Is a single exported orchestration boundary preferable to a public ACK function accepting a caller-constructed receipt object?
2. Define the minimum immutable binding: outbox ID, event ID, event digest, lease owner, delivery generation, and trusted lease time.
3. Determine how verified GitHub read-back is represented and how the D1 conditional ACK binds it to the same lease and event.
4. Confirm that caller-supplied booleans/plain objects are forgeable and insufficient as proof.
5. Specify behavior for ambiguous POST response, delayed visibility, duplicate markers, digest mismatch, stale generation, expired lease, and ACK replay.

### C. Concurrency, liveness and recovery
1. Review the conditional SQL update and D1 transaction boundary under concurrent ACK and lease takeover.
2. Assess the orphaned fifth-lease recovery gap. Do not recommend weakening same-owner/generation fencing without a separately qualified recovery issuer and trusted time source.
3. Verify retry/backoff/dead-letter invariants and append-only audit event behavior.

### D. Test and provenance sufficiency
1. Identify negative-first tests needed before implementation is accepted.
2. Assess whether existing fake GitHub tests overstate guarantees or leave gaps.
3. Assess the complete logical patch union and migration/workflow/package compatibility; do not cherry-pick PR ancestry blindly.
4. Separate local Workers-runtime proof from hosted D1, live GitHub API, production clock/issuer and deployment evidence.

## Required test cases for a future implementation

- valid lease, no verified projection => ACK denied;
- verified projection for wrong event ID or digest => ACK denied;
- receipt from old delivery generation after takeover => ACK denied;
- duplicate/conflicting marker => ACK denied;
- ambiguous POST or delayed read-back => retryable, no ACK;
- successful matching read-back => one conditional ACK;
- concurrent ACKs => one state transition;
- replay of the same already-consumed receipt => deterministic idempotent result without a second transition;
- expired lease and stale owner => denied;
- fifth-lease orphan recovery => fail closed unless a separately authorized recovery actor is proven.

## Reviewer output format

Return:
1. verdict: APPROVE / REQUEST CHANGES / REJECT;
2. exact source SHA(s) reviewed;
3. findings ranked Critical/High/Medium/Low with file and line references;
4. invariant-by-invariant reasoning;
5. test gaps and required additions;
6. explicit statement whether review was independent of the author/implementer;
7. explicit non-claims: no hosted D1/live GitHub/deployment qualification unless independently evidenced.

## Safety constraints

- No secrets or credential values; do not inspect or print them.
- No workflow dispatch, provider/model invocation, hosted D1 provisioning, deployment, merge, or enabling of dispatch.
- Do not treat PR #66 documentation review as review of the #58/#59 code.
- Do not claim acceptance from empty CI/review results.

## Current known disposition

Receipt-free ACK is a confirmed source-level correctness gap. The current test suite is source-inspected only in the latest pass; no new test execution occurred. PR #58/#59 remain OPEN/DRAFT/UNMERGED. PR #66 is documentation-only and OPEN/DRAFT. Exact-head CI/review evidence for PR #66 is empty. Contour A remains BLOCKED / NOT ACCEPTED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
