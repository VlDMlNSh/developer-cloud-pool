# Reusable Supervisor→Worker implementation pass — 2026-11-06

## Scope and immutable target

- Repository: `VlDMlNSh/developer-cloud-pool`
- Default branch: `Основной`
- Default HEAD observed before implementation: `197ba98d0dc7d8437d759dd25bee8750d02e59ae`
- Working branch: `feat/reusable-pool-worker-boundary-2026-11-06`
- Exact tested head: `8d848629511ac1b8c379fd6c8d20cc17496f6f54`
- Draft PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/37
- Base compare: 23 commits ahead / 0 behind; merge base equals default HEAD.
- No merge performed.

## Implemented on draft branch

1. `.github/workflows/pool-worker.yml`
   - Replaced `workflow_dispatch` with `workflow_call` only.
   - Removed Worker report job and all issue mutation/comment paths.
   - Worker permissions are read-only: issue read for validation, contents read for the isolated probe.
   - Added caller/callee context checks using caller `github.workflow_ref` / `github.workflow_sha` and reusable callee `job.workflow_repository` / `job.workflow_file_path` / `job.workflow_sha`.
   - Caller repository ID is pinned to `1445644538`; caller and local reusable callee must share the same immutable workflow SHA.
   - Worker requires the claimed task state, exact approved target SHA and allowlisted DSH profile.

2. `.github/workflows/pool-supervisor.yml`
   - Removed privileged `workflow_run` event and `actions: write`.
   - Added a statically declared local reusable Worker job.
   - Supervisor intake/finalizer are the only jobs with `issues: write`; Worker receives read-only permissions.
   - Finalizer records terminal status and provenance; unsuccessful Worker result goes to `pool:needs-review`.

3. `scripts/pool-supervisor.mjs`
   - Removed REST workflow-dispatch implementation and stale-claim auto-requeue.
   - Requires protected default ref, literal `POOL_DISPATCH_ENABLED=true`, and separate `POOL_AUTHORIZATION_CONTRACT_ACCEPTED=true`.
   - Processes at most one task per run.
   - Claims `pool:ready` and performs exact issue read-back before emitting reusable workflow inputs.
   - Ambiguous claim read-back throws and does not invoke Worker. The claim can remain stranded for manual review; no automatic retry path exists.

4. `scripts/validate-pool-contract.mjs`
   - Updated old assertions that required Worker issue-write/report behavior.
   - Enforces reusable-only Worker, read-only permissions, caller/callee identity, no privileged Supervisor workflow_run/actions-write/REST dispatch, dual fail-closed gates, one-task claim/read-back and no stale auto-requeue.
   - Continues to validate manually dispatched, read-only, secret-free DSH and Resource Probe workflows.

5. Added `tests/security/reusable-pool-worker-boundary.test.mjs` and `.github/workflows/reusable-pool-worker-boundary-validation.yml` for static boundary tests and exact-PR-head validation.

## CI evidence

### Earlier failures and corrections

- Run `42279768338` (head `9aaa028517c42ead7ef058856136fa8893fcc070`): FAILED at `node --check scripts/pool-supervisor.mjs`; a missing string concatenation operator was identified in the claim log and corrected.
- Run `42279768127` (same earlier head): FAILED because the pre-existing pool contract validator required the retired Worker issue-write report job, DSH profile choice list, and old heartbeat exit pattern. Validator was updated rather than bypassed.
- Run `42280261974`: dedicated static test failed due an overbroad regex that mistook a label read-back condition for a requeue. Test was narrowed to detect the actual claimed→ready mutation.
- Run `42280261985`: updated contract validator failed for the same overbroad claimed/ready pattern. Validator was corrected.

### Latest exact-head runs

- Exact head: `8d848629511ac1b8c379fd6c8d20cc17496f6f54`
- Reusable Pool Worker Boundary Validation: run `42280397115`, job `contract`, COMPLETED / SUCCESS. Steps: checkout exact PR head, pinned Node setup, Supervisor syntax check, authorization boundary tests — all SUCCESS.
- Pool Contract Validation: run `42280397122`, job `Validate workflow syntax and security invariants`, COMPLETED / SUCCESS. YAML parse and revised contract validator passed.
- Combined commit status endpoint returned an empty statuses array; workflow-run records above are the CI evidence.
- No independent PR reviews or review threads were present at the time of audit.

## Safety and qualification limits

- PR #37 remains DRAFT / OPEN / UNMERGED. No merge or default-branch change.
- No workflow dispatch, Worker execution, DSH probe, Resource Probe, provider/model call, secret read, Cloudflare deployment or external server use occurred.
- Dispatch is not enabled by this pass. The new acceptance variable is a separate required gate; its live repository value was not inspected or changed.
- GitHub Issues labels do not provide compare-and-swap. Supervisor serialization plus exact read-back is a risk-reduction claim-consumption boundary, not database-grade atomic exactly-once. Ambiguous claim transitions intentionally stop before Worker invocation and may require manual review.
- The current static tests do not prove concurrent race behavior or exactly-once execution. Independent security review and explicit governance verification remain required.
- The new Worker identity check depends on GitHub.com reusable-workflow `job.workflow_*` context properties; not suitable for GHES without an alternate contract.

## Status

- Production boundary implementation: IMPLEMENTED ON DRAFT BRANCH.
- Exact-head CI: VERIFIED / PASS for the two listed workflows.
- Independent security review: NOT RUN.
- Governance / live dispatch variable state: NOT VERIFIED.
- Runtime Worker: NOT RUN.
- Web console: NOT DEPLOYED.
- Contour A: BLOCKED / NOT QUALIFIED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next bounded step

Perform a security-focused review of PR #37, especially repository/workflow identity binding, claim transition semantics, finalizer recovery, GitHub concurrency guarantees and reusable-workflow permissions. Re-read Issue #1 governance/ruleset and verify the new acceptance variable without reading secrets. Keep PR draft and dispatch fail-closed until review findings are resolved.

## Follow-up governance and validation-gate amendment — 2026-11-06

- Re-read Issue #1 and its latest comment (2026-11-05). Last recorded active Ruleset evidence: ID `26550182`, exact selector `refs/heads/Основной`, PR required, but required approving reviews = 0, CODEOWNERS review = false, and extra approval for unattributed changes = false. This does not enforce independent review. The ruleset was not freshly read through API in this pass; treat its live state as NOT RE-VERIFIED.
- The exact-head Pool Contract Validation run `42280397122` exposed `POOL_DISPATCH_ENABLED=false` in the workflow environment and passed the explicit guard. This is fresh CI evidence that the existing dispatch variable was false at that run.
- Added a second required gate `POOL_AUTHORIZATION_CONTRACT_ACCEPTED` to the Supervisor workflow. Updated Pool Contract Validation to expose that non-secret variable and fail if it is literal `true` before independent review/governance acceptance. This additional guard was committed after the last passing exact-head CI.
- Latest working branch head after this follow-up: `5b45a29ed7869c091741c0037c68bfcd6640de7d`. Exact-head CI for this latest head: NOT VERIFIED. Prior exact tested head `8d848629511ac1b8c379fd6c8d20cc17496f6f54` has both CI workflows SUCCESS.
- `POOL_AUTHORIZATION_CONTRACT_ACCEPTED` live value: NOT VERIFIED. It was not read or changed. The new validator guard requires it not to be literal true until independent review and governance acceptance.
- PR #37 remains DRAFT / OPEN / UNMERGED; reviews and review threads are empty. Do not merge.

## Final exact-head verification — 2026-11-06

- Latest PR #37 head: `5b45a29ed7869c091741c0037c68bfcd6640de7d`.
- Reusable Pool Worker Boundary Validation run `42280875294`: COMPLETED / SUCCESS. Checkout exact PR head, Node setup, Supervisor syntax check and authorization boundary tests all passed.
- Pool Contract Validation run `42280875365`: COMPLETED / SUCCESS. Workflow YAML parse and updated pool contract validator passed.
- Latest contract run environment showed `POOL_DISPATCH_ENABLED=false` and `POOL_AUTHORIZATION_CONTRACT_ACCEPTED` empty/unset. Both are non-secret repository variables; no secret values were read.
- Therefore both Supervisor gates are presently fail-closed as observed in this CI run.
- The later follow-up changes are now CI-verified at the exact current PR head; supersedes the earlier NOT VERIFIED note for head `5b45a29...`.
- Independent review remains NOT RUN. Issue #1's latest stored Ruleset snapshot (2026-11-05) shows 0 required approvals and CODEOWNERS review disabled; current live Ruleset state not freshly read via API. PR #37 remains DRAFT / OPEN / UNMERGED.
- No Worker execution, DSH, Resource Probe, provider/model call, secrets read, or deployment.
