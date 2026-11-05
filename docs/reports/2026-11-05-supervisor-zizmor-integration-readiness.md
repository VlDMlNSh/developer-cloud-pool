# 2026-11-05 — Supervisor / zizmor integration readiness audit

## Scope and immutable inputs

- Repository: `VlDMlNSh/developer-cloud-pool`.
- Canonical branch: `Основной`, base SHA `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Zizmor implementation PR #14: head `5a84f037a612dbb065ab9832bd3f6471cc5a551b`, branch `security/introduce-zizmor-audit-2026-11-05`.
- Supervisor remediation PR #15: head `c57f2ab3f2b91bf6b3e413640f65ec518008b75e`, branch `security/remove-supervisor-workflow-run-2026-11-05`.
- Audit lane branch: `integration/zizmor-supervisor-removal-2026-11-05`, created from the exact PR #14 head.
- This report is documentation only. It does not alter production workflows, runtime permissions, secrets, repository variables, Environments, rulesets, or dispatch settings.

## Verified CI and review state

- PR #12 exact head `6c053bacff29ca8efb5fdb759edd44fcd416b749`:
  - Pool Contract Validation run [42041945700](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42041945700): SUCCESS, job `127294775575`.
  - Reusable Worker Context Fixture run [42041946049](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42041946049): SUCCESS, job `127294723519`.
  - These prove the standalone helper/planner tests and context fixture only. They do not prove the production caller boundary.
- PR #15 exact head `c57f2ab3f2b91bf6b3e413640f65ec518008b75e`:
  - Pool Contract Validation run [42038004176](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42038004176): SUCCESS, job `127281084983`.
  - This run did not execute zizmor; exact-head zizmor remains NOT VERIFIED.
- PR #14 current head `5a84f037a612dbb065ab9832bd3f6471cc5a551b`:
  - Associated workflow run lookup returned only older run [42037723023](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42037723023), which FAILED on the earlier dangerous `workflow_run` finding.
  - No exact-current-head CI or zizmor result was returned. Current head status: NOT VERIFIED.
- Independent PR reviews and review threads for PR #12 and PR #14 were empty. Independent security review: NOT RUN.

## Confirmed integration blockers

### 1. PR #15 is not a complete owner-approval implementation

The PR #15 Supervisor removes the privileged `workflow_run` trigger, but it still uses REST `workflow_dispatch` to invoke a Worker that exposes `workflow_dispatch` directly. The production caller boundary remains bypassable. PR #12's caller, owner-approval and gated-dispatch helpers are not wired into that production path.

### 2. Stale-claim recovery conflicts with single-use approval

The PR #15 `scripts/pool-supervisor.mjs` still returns a claimed task to `pool:ready` when no matching Worker run appears after 15 minutes. It also restores `pool:ready` after a dispatch API error.

This conflicts with the PR #12 owner-approval/single-use ADR: after an approval has been consumed or a dispatch outcome becomes ambiguous, the task must move to `pool:needs-review` and require a fresh owner approval. The existing behavior can replay the same label-based approval and must be removed before any integrated dispatch path is accepted.

### 3. Zizmor audit has not been verified on the remediation head

The pinned zizmor action exists on PR #14, but the current PR #14 head has no returned exact-head run. PR #15's successful contract validation is not a substitute for zizmor. The known DSH package provenance warnings remain open pending a verified lockfile and `npm ci` transition.

### 4. DSH lockfile generation has no artifact

PR #16 runs [42038801999](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42038801999) and [42039481919](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42039481919) ended CANCELLED while the temporary lockfile-generation step was in progress. No artifact was returned. The latter run was for the then-current PR head `00bf891729de7c1092a5bde8b09fec6f4c4cbc66`; it is not evidence of a generated lockfile. Do not fabricate or convert the upstream pnpm lock into npm format.

## Integration decision

- Do not merge PR #14, #15, #12 or #16 as a group.
- Do not enable `POOL_DISPATCH_ENABLED`.
- Do not run Worker, DSH, Resource Probe, browser, model/provider calls or paid fallback.
- First reconcile the single-use lifecycle: owner approval -> Environment gate -> post-gate envelope revalidation -> atomic consume marker -> one reusable Worker invocation; all ambiguous outcomes go to needs-review.
- Convert Worker to `workflow_call` only, remove REST workflow dispatch and Worker issue-write reporting, and ensure Supervisor is the sole task-state writer.
- Remove stale-claim auto-requeue and dispatch-error requeue. Require fresh owner approval after any consumed/ambiguous attempt.
- Then run the pinned zizmor audit on the exact integrated head, resolve all findings without suppressions, and obtain independent security review.

## Status

- Audit and evidence review: VERIFIED for the sources and runs listed above.
- Production integration: NOT IMPLEMENTED.
- Zizmor on integrated exact head: NOT RUN.
- Independent review: NOT RUN.
- Qualification / acceptance: NOT QUALIFIED / NOT ACCEPTED.
- Dispatch: remains blocked; no dispatch setting was read or changed in this pass.
