# 2026-11-06 — Default-branch production Supervisor/Worker authorization recheck

## Immutable target
- Repository: VlDMlNSh/developer-cloud-pool
- Default branch Основной HEAD: 64d2636d4500127e635c214ccfb722c6b3fcda80
- Read directly from default branch by GitHub Contents listing + immutable blob SHAs:
  - .github/workflows/pool-worker.yml — fe1ee4c41a86807810a6b6bc85c677b46c3cebb4
  - .github/workflows/pool-supervisor.yml — d4bd23d06c0dc98211cea165cdad30a1861eb3bd
  - scripts/pool-supervisor.mjs — 52bf03ca889edd92fd10c71ae96a2e35e106d43f

## Findings — production default branch, not PR proposals

### Worker workflow
1. Trigger is workflow_dispatch only; it is not workflow_call-only. Any actor with sufficient Actions permission may invoke the Worker directly.
2. Inputs are task_issue, target_sha, profile. Validate job checks open non-PR issue, pool:claimed label, target SHA and allowlisted profile; it does not authenticate the owner approval comment or prove caller is protected Supervisor.
3. The probe job checks out exact target SHA, which is a useful immutable checkout boundary.
4. The report job still has issues:write and mutates issue labels/comments. This violates the intended single-writer Supervisor boundary.
5. Runtime installs DSH ad hoc with npm install, without committed lockfile/npm ci in this workflow.
6. DSH is not a production-qualified runtime; no current execution was performed in this audit.

### Supervisor workflow
1. Default branch still contains privileged workflow_run: completed for Pool Worker, plus schedule, workflow_dispatch and issue triggers. PR #15 removing workflow_run is not merged.
2. Top-level permissions include contents:read, issues:write, actions:write. workflow_run therefore remains a privileged event path in the production default branch.
3. Concurrency group uses queue:max; useful scheduling coordination but not transactional CAS or exactly-once.
4. The workflow exposes POOL_DISPATCH_ENABLED from repository variable. The current variable value was not read and remains NOT VERIFIED. Do not infer that runtime dispatch is enabled or disabled from historic values.
5. Supervisor script is gated on exact string POOL_DISPATCH_ENABLED === "true"; otherwise it exits after heartbeat. This code-level fail-closed check is verified from blob 52bf... but current variable metadata/value is NOT VERIFIED.

### Supervisor script
1. When enabled, it treats pool:ready label as intake authority; validates target SHA and profile from issue body but does not validate owner-authored approval comment, trusted actor numeric ID, approval expiry or single-use marker.
2. It changes issue labels/comments and REST-dispatches pool-worker.yml directly.
3. On dispatch API error, it restores pool:ready, which can permit another attempt without a fresh approval.
4. recoverStaleClaims returns claims to pool:ready after 15 minutes if no matching run appears. This stale-claim auto-requeue is incompatible with a consumed single-use approval; an ambiguous prior dispatch must go needs-review and require fresh owner approval.
5. recoverFailedWorkflowRun is invoked on workflow_run and mutates issue state, while Worker report job also writes issue state: two writers exist.
6. It uses a static allowlisted profile and exact SHA extraction; these are narrow safeguards but do not replace caller/owner authorization.

## PR state correlation
- PR #12 OPEN/DRAFT/UNMERGED; head 6c053bacff29ca8efb5fdb759edd44fcd416b749. Exact-head fixture run 42041946049 SUCCESS; Pool Contract Validation 42041945700 SUCCESS. These are fixture/pure-helper tests, not production workflow authorization.
- PR #15 OPEN/DRAFT/UNMERGED; head c57f2ab3f2b91bf6b3e413640f65ec518008b75e. Exact-head contract run 42038004176 SUCCESS. Its removal of workflow_run is only proposed, not effective on default branch.
- PR #27 OPEN/DRAFT/UNMERGED; current head f10db507660c2945642e99e23f957025058e27c5; no PR-triggered CI runs found for exact head => CI NOT VERIFIED.
- Formal reviews for all three PRs are empty.

## Required remediation sequence (no code changes made)
1. Keep dispatch disabled; current POOL_DISPATCH_ENABLED value is NOT VERIFIED.
2. Implement trusted owner-comment authorization bound to repo/issue/comment/target SHA/profile/scope/budget/expiry/digest; re-fetch before consume.
3. Add durable single-use marker with verified tag protection and exact read-back. Ambiguous create/dispatch -> needs-review, never automatic replay.
4. In one coherent reviewed transition, make Worker workflow_call-only and invoke statically from Supervisor; validate caller/callee repo/workflow/ref/SHA before checkout/install.
5. Remove Worker report-job issue write; Supervisor becomes sole state writer.
6. Remove privileged workflow_run and stale-claim auto-requeue. Any ambiguous dispatch outcome -> needs-review and fresh approval.
7. Exact-head CI for production workflow, independent security review, ruleset/governance read-back and explicit acceptance before runtime dispatch.

## Status
- Default-branch production authorization: BLOCKED / NOT IMPLEMENTED.
- Current dispatch variable: NOT VERIFIED.
- Worker runtime / DSH / provider calls / model calls / secret reads / deployment: NOT RUN.
- No file or repository configuration was changed in this pass.
- Contour A NOT ACCEPTED; Contour B DEFERRED.

## Next bounded step
Prepare a coherent, test-first remediation plan across Supervisor and Worker contracts; do not enable dispatch or modify production workflows until owner-approval provenance, durable consume, caller boundary and independent review can be tested together.
