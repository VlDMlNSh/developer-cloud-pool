# PR #53 F2 Finalizer Fencing Review — 2026-11-11

## Immutable scope

- Repository: VlDMlNSh/developer-cloud-pool
- PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/53
- Head SHA: b8a253f06418841d5f0250c9fd550bf3247db040
- Base PR #37 head: 1be8672c1be1a720b6c813dcafff5c020b6456ae
- State: OPEN / DRAFT / UNMERGED; mergeable=true is not acceptance.
- Formal reviews: 0.
- Exact-head workflow-run lookup: empty; CI NOT VERIFIED.
- Issue #38 remains OPEN and its claim-protocol decision rejects Issue-label PATCH + Actions concurrency as atomic CAS.

This was source/metadata inspection only. No workflow dispatch, Worker/DSH execution, provider call, secret read, deployment, or production mutation was performed.

## What PR #53 improves

PR #53 is a stacked implementation attempt specifically addressing F2:
- hashes the complete task Issue body with SHA-256 at Supervisor claim time;
- attaches a unique pool:claim-<run_id>-<run_attempt> generation label;
- passes envelope digest and generation to the reusable Worker;
- Worker re-fetches the task and checks exact body digest and unique matching generation before the probe;
- extracts finalization logic into scripts/pool-finalizer.mjs;
- rejects a closed Issue, wrong Issue number, changed body digest, duplicate/conflicting managed state or generation, and stale run/attempt generation;
- Finalizer re-reads before mutation and verifies terminal state/body read-back;
- adds adversarial unit tests for body mutation, closed issue, stale/wrong generation, duplicate generation, duplicate finalization and invalid envelope.

These are meaningful defense-in-depth improvements and make the previous F2 failure mode detectable across more stages.

## Findings

### F2a — Immutable envelope and attempt fencing: PARTIALLY ADDRESSED

The digest and run/attempt generation bind Worker and Finalizer to the task body and Supervisor attempt. The pure policy function rejects changed/closed/ambiguous tasks. This is a significant improvement over PR #37's label-presence-only Finalizer.

However, the implementation still uses mutable GitHub Issue labels as the claim state and a sequence of GET → GET → PATCH → GET. The source itself explicitly acknowledges that GitHub Issue label PATCH has no atomic compare-and-swap and a narrow external concurrent-mutation race remains. A mutation can race between the last validation read and the label PATCH. The read-back detects some outcomes after the fact; it cannot make the state transition conditional on the version that was validated.

Disposition: F2 is NOT CLOSED. PR #53 reduces the race surface and detects many stale/mutated states, but it does not provide an authoritative fencing primitive or prove single-winner task finalization.

### F2b — Claim generation is not an authoritative claim token: OPEN

pool:claim-<run_id>-<run_attempt> is a deterministic workflow-attempt label, not a nonce issued by an atomic claim store. The label can be changed by any actor with Issue-label write permission and does not establish durable single-winner ownership. It is not tied to a transactionally consumed claim ID or monotonically fenced generation in the authoritative state store.

This is consistent with Issue #38's decision: Actions concurrency + Issue label PATCH/read-back is not an atomic claim protocol. PR #53 does not supersede that decision.

### F10 — Terminal state and audit event remain separate side effects: OPEN

The runner writes terminal labels, verifies them, then POSTs a GitHub Issue comment. The terminal transition and audit comment are not one transaction. If comment creation fails or returns ambiguously after labels are changed, terminal projection can exist without the required audit record. There is no durable transactional outbox/idempotency/reconciliation path in this PR.

### Test and execution evidence

- New adversarial tests are present in the PR patch, but exact-head CI lookup returned no workflow runs. Tests are NOT VERIFIED as executed.
- No live reusable Worker invocation, real GitHub Issue race test, concurrent claimant test against hosted state, or hosted D1 integration test was performed.
- PR #53 has zero formal reviews.
- PR #37 remains the base draft and retains its own earlier review history; PR #53 cannot be merged independently as a substitute for resolving the full stack and claim protocol.

## Required disposition

- Keep PR #53 OPEN / DRAFT.
- Treat F2 as PARTIALLY ADDRESSED, not fixed.
- Treat F2b and F10 as OPEN.
- Do not merge #53 or #37; do not enable either dispatch gate.
- Use the selected durable claim architecture from Issue #38: dedicated authenticated claim service with transactional conditional-write store, subject to hosted entitlement, issuer, isolation, quotas and trusted-time qualification. The local D1 proof alone is insufficient.
- Finalization should atomically consume the exact claim generation and persist terminal state plus immutable audit/outbox event in the same authoritative store. GitHub Issue labels/comments should be projections with idempotent reconciliation.
- Do not grant broad Contents: write or introduce a local issuer substitute.

## Status

- PR #53 source-level improvement: VERIFIED.
- F2 complete closure: NOT VERIFIED / BLOCKED.
- Exact-head CI: NOT VERIFIED.
- Independent review: NOT RUN.
- F10 atomic terminal/audit: OPEN.
- Durable authoritative claim: NOT IMPLEMENTED / NOT QUALIFIED.
- Dispatch: DISABLED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next bounded step

Do not add more label/read-back checks. Define the transactional finalization record against the authoritative claim/outbox store chosen by Issue #38, including claim ID, monotonic generation, task-envelope digest, Worker result/provenance digest and an immutable audit event. Then implement only after the hosted issuer/store and authority boundaries are qualified. In the meantime, PR #53's static changes can be retained as a draft candidate, but must not be described as closing F2.
