# Protocol-to-implementation gap review

Date: 2026-11-08 (Europe/Vilnius)  
Scope: Static comparison of the immutable execution receipt/fenced claim design contract against the current draft PR #37 workflow and Supervisor implementation, plus the PR #39 local claim/outbox proof.  
Disposition: DESIGN REVIEW COMPLETE / IMPLEMENTATION NOT QUALIFIED. No dispatch, deployment, remote D1, provider/model calls, secrets access, or paid resources.

## Immutable targets read

- Default branch baseline observed in PR metadata: `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- PR #37 head: `5587a4e013507b5be330fd0c49ce1fc836faa946` (OPEN / DRAFT / UNMERGED).
- PR #37 Worker workflow blob: `4f57e8eef4a40d14b8d1df467cfac07e39e490a2`.
- PR #37 Supervisor workflow blob: `4a176e5ebb3cf1e7ef29b00164498e34a4f9fafc`.
- PR #37 Supervisor script blob: `2d0611851ff738b2aeb377f464e5fa7d821f3696`.
- PR #39 head: `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`; stacked base PR #36 branch SHA `9ef7e4aadd6c723fa86b21ea44383f8020643a0c`.
- Design contract blob: `435534e4c02e62e19758428611eee9941ec85abc`.

## Findings

### G1 — F1 is correctly specified by the contract but not implemented

The Worker still declares `CALLEE_REPOSITORY`, `CALLEE_FILE_PATH`, and `CALLEE_WORKFLOW_SHA` from `job.workflow_*` in job-level `jobs.validate.env`. The contract §9 correctly requires moving these expressions to a step-level environment supported by the GitHub Actions context availability table, then validating non-empty runtime values. Static YAML validation does not close this issue.

Status: OPEN / NOT RUNTIME-VERIFIED.

### G2 — F2 remains a label-only finalizer

The Supervisor finalizer reads the Issue and checks only that `pool:claimed` is present. It does not verify a durable claim record, claim owner, attempt/generation, fencing token, envelope digest, approval ID, or a claim-bound execution receipt before changing labels. The Issue label is not a conditional-write authority.

Status: OPEN / NOT QUALIFIED.

### G3 — Worker result is not an execution receipt

The finalizer receives `needs.worker.result` (a job conclusion) and the Supervisor run ID. It does not receive or validate a structured receipt binding task/attempt/claim/envelope, worker run and run_attempt, workflow identities, fencing token, result ID, provenance, or artifact digests. A successful job conclusion is not sufficient evidence for a claim-bound result.

Status: OPEN / NOT IMPLEMENTED.

### G4 — PR #39 proves only approval-scoped atomic enqueue, not task-wide single-active execution

The PR #39 description and review evidence bound deterministic claim/outbox IDs to approval ID and test same-approval retry. Review evidence explicitly records that two distinct approvals for one task can create two claims. The design contract §3 correctly requires task_id-wide uniqueness across approvals, but this invariant is not implemented by the local proof.

Status: OPEN / NOT QUALIFIED.

### G5 — Lease, reclaim, fencing and consumer lifecycle are design-only

The PR #39 adapter and migration do not implement lease acquisition/renewal/reclaim, monotonically increasing fencing, outbox consumer delivery/acknowledgement, dead-letter handling, stale worker rejection or restart recovery. Lease columns alone do not implement the protocol.

Status: OPEN / NOT IMPLEMENTED.

### G6 — Governance and reviewer authority remain external blockers

Live review submissions on PR #36/#37/#39 are from the same reviewer account `maxkorolskiy88-ship-it`; no APPROVED review or second reviewer identity was found in the latest reconciliation. Organizational independence and authorization are NOT VERIFIED. Ruleset 26550182 requires zero approvals and does not enforce CODEOWNERS review. This design-only review cannot satisfy the independent approval gate.

Status: BLOCKED.

## Required implementation sequence

1. Obtain approval/rejection of the protocol and threat model from a genuinely independent, authorized reviewer; record identity, authority, conflict-of-interest declaration, exact contract SHA and decision.
2. Correct F1 on a dedicated implementation branch; move callee context reads to step-level env and add a minimal runtime identity proof that emits only non-secret values.
3. Replace label-based claim/finalization with a selected, qualified conditional-write authority. Enforce task-wide active-attempt uniqueness across distinct approvals.
4. Implement lease/renew/reclaim with monotonic generation and fencing, durable outbox consumer/ack/dead-letter, and stale-worker rejection.
5. Pass a structured immutable execution receipt from Worker to Finalizer and validate the complete contract predicate before an idempotent terminal transition.
6. Add the contract regression matrix, including two-approval same-task race, lost claim/receipt/finalizer response, stale worker after reclaim, lease/reclaim race, conflicting receipt, outbox redelivery, crash after side effect and restore preserving fencing monotonicity.
7. Only after governance and free-only backend eligibility gates, perform separately authorized disposable remote D1 contention/failure/restore qualification. No production dispatch during qualification.

## Evidence and limits

- Read-only source inspection only; no source or workflow files changed.
- No tests were run in this pass. Previously reported PR CI remains scoped to its recorded commits and test suites.
- No GitHub variables, rulesets, secrets, branches, PR states, or runtime resources were changed.
- No remote D1 was provisioned; no Worker/Supervisor/DSH/Resource Probe execution occurred.
- This review is not an independent organizational review and does not approve the contract.

## Decision

The design contract is directionally complete as a requirements document, but its critical invariants are not implemented in the current draft workflows or local claim/outbox proof. Do not merge PRs #36/#37/#39, enable dispatch, provision remote D1, or claim Contour A readiness on this evidence.

Contour A: BLOCKED / NOT QUALIFIED / NOT ACCEPTED.  
Contour B: DEFERRED.
