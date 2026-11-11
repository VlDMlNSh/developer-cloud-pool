# PR #37 Finalizer Fencing Audit — 2026-11-11

## Scope and immutable target

- Repository: `VlDMlNSh/developer-cloud-pool`
- PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/37
- Current PR head: `1be8672c1be1a720b6c813dcafff5c020b6456ae`
- PR base SHA: `197ba98d0dc7d8437d759dd25bee8750d02e59ae`
- Worker workflow blob at target: `04d63d815d2f7d15cfa80c932b614d559385ff0a`
- Supervisor workflow blob at target: `4a176e5ebb3cf1e7ef29b00164498e34a4f9fafc`
- Status at audit: OPEN / DRAFT / UNMERGED; GitHub mergeable=true (not an acceptance signal).

This pass was source/API inspection only. No workflow dispatch, Worker/DSH execution, provider call, deployment, secret read, or production resource mutation was performed.

## Exact-head CI evidence

Both PR-triggered runs resolve to the exact current head:

- [Reusable Pool Worker Boundary Validation #42484039940](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42484039940): COMPLETED / SUCCESS; job `contract`, checkout exact PR head, syntax check, authorization boundary tests all succeeded.
- [Pool Contract Validation #42484039932](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42484039932): COMPLETED / SUCCESS; YAML syntax and static contract checks succeeded.

These runs do not demonstrate an actual reusable Worker invocation or end-to-end task execution.

## Findings

### F1 — Worker job-context placement: FIXED at current head

At the previously reviewed head `5587a4e013507b5be330fd0c49ce1fc836faa946`, the three `job.workflow_*` expressions were in job-level `env`, where GitHub rejects the `job` context. At current head `1be8672c1be1a720b6c813dcafff5c020b6456ae`, they are under the validation step's `env`. The exact-head static workflows pass. This closes the previously observed YAML context-placement defect; it does not establish live reusable execution.

### F2 — Finalizer does not fence the task/result binding: OPEN / HIGH

At `.github/workflows/pool-supervisor.yml` blob `4a176e5ebb3cf1e7ef29b00164498e34a4f9fafc`, lines 86–105:
- Finalizer fetches the current Issue and checks only that `pool:claimed` is present.
- It does not reject a closed Issue, conflicting/duplicate managed lifecycle labels, or changed task body/envelope.
- It does not compare the current target SHA/profile to the values consumed by the Worker.
- It does not bind finalization to a durable claim ID, run attempt, claim generation/fencing token, or immutable task-envelope digest.
- It PATCHes terminal labels based on that incomplete check. A read-back confirms the resulting labels, not that the result belongs to the same immutable task/claim.

A task can therefore change after Worker validation and before Finalizer; a result for the old target may be recorded against the changed Issue. This is a source-level race analysis; live reproduction was NOT RUN.

Required remediation: finalization must consume an immutable task/attempt/claim envelope and verify repository/task identity, canonical envelope digest, target SHA, profile, issuer/approval identity, claim ID, Supervisor run ID/run_attempt, generation/fencing and Worker result digest/provenance. The state transition and audit event must be conditional/idempotent against the authoritative claim store. GitHub labels/comments should be projections only. Reject changed/closed/conflicting tasks and stale/duplicate results. GET-before-PATCH is not CAS and cannot close the race.

### F10 — terminal label update and audit comment are separate side effects: OPEN

The Finalizer performs the terminal label PATCH/read-back and then a separate comment POST. If the comment POST fails after the label update, the issue can appear terminal without the corresponding audit comment. Conversely, an ambiguous response can leave the caller uncertain whether the comment was created. There is no transactional coupling or durable outbox/idempotency key in this workflow. The separate D1 claim/outbox proofs are not integrated with this Finalizer.

Required remediation: persist the terminal transition and audit event atomically in the authoritative state store; project the event to GitHub using deterministic idempotency and reconciliation. Do not treat a successful label read-back as proof that the audit comment was delivered.

### Claim protocol limitation — OPEN / HIGH

Issue #38 decision and the 2026-11-11 durable claim protocol decision reject Issue label PATCH + workflow concurrency/read-back as an atomic single-winner claim. PR #37 still uses the Issue label as claim state. GitHub concurrency only serializes runs in its group; label PATCH is not compare-and-swap. The local D1 claim/outbox tests are synthetic/local and do not qualify a hosted claim service or issuer boundary.

Decision record: https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/docs/decisions/2026-11-11-durable-supervisor-claim-protocol.md
Issue #38: https://github.com/VlDMlNSh/developer-cloud-pool/issues/38

### Review status

The formal CHANGES_REQUESTED review currently visible on PR #37 was submitted against the earlier head `5587a4e013507b5be330fd0c49ce1fc836faa946`. It identified F1/F2 and other findings. F1 is corrected in the current head; F2 remains. No formal review approving the current head was observed. Review history against an earlier SHA is not approval of the current SHA.

## Related Recovery Actor PR #60

PR #60 head: `234fb2ee40265e26fac00c69ac1b6192766602cb`, OPEN / DRAFT / UNMERGED, base `864213e2ff5b4fa956ba405dea8137a44d812f49`, formal reviews 0.

Changed documents:
- `docs/contracts/PROJECTION-RECOVERY-GRANT-ISSUER-AND-TRUSTED-TIME-CONTRACT.md`
- `docs/decisions/2026-11-11-projection-recovery-actor-capability-contract.md`

The design correctly separates projection recovery from task Resolver/Supervisor/Worker authority, requires an exact outbox/attempt/generation-bound single-use grant, atomic nonce consumption + dead-letter transition + immutable event, and rejects caller-supplied timestamps or caller-shaped "verified" objects as trust. It explicitly leaves issuer ownership, signing/key custody/rotation, trusted time, hosted backend/free-tier, and production isolation unresolved. This is a design contract, not an implemented or qualified Recovery Actor. No dispatch/requeue/task mutation authority should be granted to it.

## Governance and production status

- Current-head formal independent approval: NOT VERIFIED.
- Current live ruleset/branch protection and required independent approval: NOT VERIFIED in this pass; historical evidence indicates zero required approvals, which must not be silently promoted to current state.
- Hosted claim service, trusted issuer, production D1, lease/fencing/recovery integration, Worker execution, UI deployment, model routing/quota enforcement, secret/account isolation, persistent restore and mobile/desktop qualification: NOT VERIFIED / NOT RUN.
- Both dispatch gates must remain fail-closed.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next bounded step

Resolve F2/F10 by specifying and implementing a fenced, idempotent finalization transition against the selected authoritative claim/outbox store; do not attempt a label-only patch. Before implementation, reconcile the exact claim envelope and trusted issuer/time contract with Issue #38 and the separate projection Recovery Actor contract. Then rerun exact-head CI and audit the new immutable SHA. Do not merge or enable dispatch.
