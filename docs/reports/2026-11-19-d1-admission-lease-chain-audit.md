# 2026-11-19 — D1 admission, executor identity and lease-chain audit

**Scope:** read-only engineering qualification pass for PR #146 / Contour A.  
**Default branch:** `Основной` @ `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.  
**PR #146 head:** `9c0cb7ea73f1ad3413fddeb119b8cab4fcfcc714` (OPEN / DRAFT / UNMERGED).  
**Base:** `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.

## Verified evidence

- Exact-head Pool Contract Validation run [44502134638](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44502134638), job 135484343884: SUCCESS. YAML syntax and pool security contract steps passed; dispatch-disabled assertion passed.
- Exact-head Isolated D1 Ledger Proof run [44502134762](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44502134762), job 135484344351: SUCCESS. Pinned Node setup, npm ci, syntax check, Workers-runtime D1 tests and lockfile artifact upload all completed successfully.
- Combined commit status endpoint returned no status contexts; this is not a failure and is not a substitute for the two named Actions runs.
- Active ruleset [26550182](https://github.com/VlDMlNSh/developer-cloud-pool/rules/26550182) targets only `refs/heads/Основной`, requires PR and review-thread resolution, has zero required approvals and no bypass actors. Classic branch protection endpoint reports protected=false.
- PR #146 has zero submitted reviews and zero review threads. It remains draft and unmerged.
- Migration 0001 does not define `executor_id`; migration 0007 adds it to approval, task and attempt tables and enforces required/immutable/cross-entity bindings. The original missing-column suspicion is not a defect when migrations 0001–0007 are applied in order.
- `consume.mjs` binds approval consumption to profile, executor, immutable task/issue/SHA and envelope digest, and fails closed on replay/expiry/storage ambiguity. It is a local proof adapter only; no Worker entrypoint, GitHub client, provider client, secret access or dispatch capability.
- Test inventory confirms coverage for concurrent single-winner consume, replay, expired approvals, storage ambiguity, concurrent claim/outbox, deterministic retry, outbox rollback, lease expiry, stale generation, immutable attempts, indeterminate attempts, executor substitution, disabled/unregistered executor, profile mismatch, OIDC signature/audience/workflow/repository mismatch and JWKS failure.
- Executor registry is empty (`executors: []`). No executor is currently owner-enabled by this registry.

## Gaps and limits

- No explicit test case named for a *revoked* executor/profile state was found in the inspected test inventory. Add a dedicated revocation test and define whether revocation is represented as registry status, profile status, or a separate revocation record before claiming that case qualified.
- The OIDC proof authenticates a GitHub Actions workflow/job principal, not the executable process or host. It is synthetic test coverage, not a live OIDC run.
- Workers-runtime tests do not establish hosted D1 concurrency/transaction guarantees, production deployment, provider quota, real worker execution or end-to-end web console behavior.
- PR #143 remains an independent OPEN/DRAFT proof on an older base and must not be merged or composed implicitly with #146. Issue #140 requires a deliberate canonical current-base integration and explicitly forbids live dispatch, hosted D1, provider calls, secrets inspection, deployment and merge.
- Independent review is absent. Contour A remains NOT ACCEPTED; Contour B remains deferred.

## Result

This pass verifies that the current PR #146 head has successful exact-head contract and local D1 proof workflows and that the inspected proof code contains broad negative-path coverage. It does **not** complete all Issue #140 acceptance criteria or qualify production execution. No code, secrets, provider routes, hosted resources, deployment or dispatch were changed or invoked.

## Next bounded step

Add an explicit revoked-executor/profile denial test with a documented revocation source of truth, then validate the test on a new immutable code SHA. Separately plan the canonical current-base integration required by Issue #140; do not merge stacked PRs by assumption.
