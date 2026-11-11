# PR #37 current-head remediation recheck — 2026-11-11

## Scope and immutable references

- PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/37
- Branch: `feat/reusable-pool-worker-boundary-2026-11-06`
- Last documented current head: `1be8672c1be1a720b6c813dcafff5c020b6456ae`.
- Compare against current default `Основной`: 36 ahead / 19 behind; merge base `197ba98d0dc7d8437d759dd25bee8750d02e59ae`; status DIVERGED.
- Exact-head PR-triggered runs for 1be8672: `42484039940` Reusable Pool Worker Boundary Validation SUCCESS; `42484039932` Pool Contract Validation SUCCESS.
- Branch workflow blobs read back: `.github/workflows/pool-worker.yml` `04d63d815d2f7d15cfa80c932b614d559385ff0a`; `.github/workflows/pool-supervisor.yml` `4a176e5ebb3cf1e7ef29b00164498e34a4f9fafc`; security test `9667f4cab3d9312425e6818fc1e8bc8fb5b3419c`; supervisor script `2d0611851ff738b2aeb377f464e5fa7d821f3696`.

## Recheck of prior findings

### F1 — Worker job context placement

- The current Worker workflow puts `job.workflow_repository`, `job.workflow_file_path`, and `job.workflow_sha` in the environment of the named validation step under `steps[].env`, not under job-level `jobs.<job_id>.env`.
- The current workflow blob was read directly and confirms the placement. The previously reported F1 context-placement defect is therefore SOURCE-CORRECTED in the current branch snapshot.
- The existing static test asserts the presence of the expressions, but does not itself prove GitHub expression-context validity. Exact-head CI SUCCESS is supporting validation evidence, not a live reusable Worker invocation.
- No Worker, DSH, Resource Probe or provider/model call was executed.

### F2 — Finalizer authority / task binding

- The current Supervisor Finalizer reads the issue and checks only that `pool:claimed` is present before computing a terminal label.
- It does not verify issue open state, immutable task-envelope digest, target/profile equality against the claim, unique managed-state cardinality, claim generation/owner, Worker run identity, or authoritative claim record before terminal PATCH.
- It then PATCHes labels and verifies terminal-label read-back; this is not atomic CAS and does not bind the result to an immutable claim generation.
- PR #53 describes an immutable envelope/generation fencing layer, but it is a separate stacked draft and does not establish that PR #37 alone is safe or that the integrated stack is accepted. The durable claim decision remains: labels/read-back are not authoritative CAS.
- F2 remains OPEN / HIGH / ACCEPTANCE BLOCKER for PR #37's current source scope.

## Governance and review

- PR #37 formal reviews read back: two `CHANGES_REQUESTED` submissions by `maxkorolskiy88-ship-it` on 2026-11-08 and one `COMMENTED` continuation by the same account. No APPROVED review was observed; no inline review threads were returned.
- The review is one account's repeated audit submissions, not multiple independent approvals. Organizational independence and reviewer authority remain NOT VERIFIED.
- Issue #1's latest recorded Ruleset snapshot (2026-11-04) reports required approvals=0, CODEOWNERS review disabled, and review-thread resolution enabled. The active live Ruleset was not independently read in this pass; current governance enforcement remains NOT VERIFIED.
- Issue #38 remains OPEN. Its acceptance criteria require real concurrent one-winner behavior or a documented keep-disabled decision, recovery tests, least privilege, independent review and exact-head CI.

## Decision

- F1: SOURCE-CORRECTED in current PR #37 branch snapshot; no live reusable invocation claim.
- F2: OPEN / HIGH / NOT ACCEPTED.
- PR #37: OPEN / DRAFT / UNMERGED; exact-head CI for documented head SUCCESS, but branch is 36 ahead / 19 behind current default and requires controlled reconciliation plus new exact-head CI.
- Independent approval: NOT VERIFIED.
- Current default still must not be treated as containing this PR's implementation.
- Keep `POOL_DISPATCH_ENABLED=false`; do not enable either authorization gate; no merge, dispatch, Worker execution, DSH, Resource Probe, provider/model call, secret read, deployment, or resource provisioning.

## Next

1. Complete authoritative claim-service threat model and interface: trusted issuer, signed approval provenance, claim owner/generation, lease/fencing, conditional terminal transition, idempotent audit, revocation and trusted time.
2. Reconcile the PR #37 → #53 stack against current default without force-push or merge until a bounded plan and target SHAs are established.
3. Resolve F2 with the selected transactional claim backend; then run adversarial concurrency/failure tests and exact-head CI.
4. Obtain enforceable independent review/governance before merge or dispatch.

- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
