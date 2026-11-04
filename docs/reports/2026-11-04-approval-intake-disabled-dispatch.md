# Engineering report — 2026-11-04: approval intake while dispatch is disabled

## Scope
Follow-up review of draft PR #7 after re-reading the complete Supervisor workflow, script, approval module, tests and validator.

## New finding
The Supervisor previously exited immediately when `POOL_DISPATCH_ENABLED` was not literal `true`. Because this exit happened before `recordOwnerApproval()`, an owner who applied `pool:ready` while dispatch was disabled did not receive a recorded approval marker. Enabling dispatch later would not recover that approval; the task would fail closed for a missing marker.

## Change
On PR #7 branch `fix/pool-owner-approval-guard-2026-11-04`, moved the dispatch-disabled exit to after:
1. GitHub API helper initialization;
2. label initialization;
3. `recordOwnerApproval()`.

The disabled path now supports owner approval intake and audit comments, then exits before failure recovery, stale-claim recovery or Worker dispatch. The gate is still literal-true only.

- Commit: `8dc7252d8151da2c8f30926c3564074ecaebae92`
- File: `scripts/pool-supervisor.mjs`
- Blob SHA after read-back: `85f3997a4be723735d8eab1c06e6a52b938b33d3`
- PR #7: https://github.com/VlDMlNSh/developer-cloud-pool/pull/7

## Verification
- Exact-head CI run [41908966334](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/41908966334): COMPLETED / SUCCESS.
- Job `126851105703`: all steps SUCCESS, including YAML parsing, owner-approval unit tests and static pool contract validation.
- Exact PR head: `8dc7252d8151da2c8f30926c3564074ecaebae92`.
- PR remains OPEN / DRAFT / NOT MERGED.
- Independent reviews: 0; NOT RUN.

## Remaining defect / follow-up
The same source read-back found two recovery branches that still return a task to `pool:ready` after the single-use approval has already been consumed:
- stale claim without a matching Worker run after 15 minutes;
- immediate workflow-dispatch API failure.

The next reconciliation will reject the task because its approval marker is consumed, then move it to `pool:needs-review`. This is fail-closed (no approval replay), but the intermediate `pool:ready` state and the recovery comments are inconsistent with the single-use approval contract. This follow-up was not changed in this pass because the attempted additional repository write was blocked; do not treat those recovery paths as fixed. Independent review must explicitly assess this behavior.

## Current safety state
- `POOL_DISPATCH_ENABLED`: NOT VERIFIED by current live read; do not infer from historical false value.
- No Worker, DSH, Resource Probe, browser or model execution was launched.
- SentinelX host `host_5f7264034bdf0b51` remains operational but the Free plan has 0 spare slots.
- PR #7 is not merged or accepted.

## Next
1. Correct the two stale/dispatch-failure recovery branches to move directly to `pool:needs-review` after consumed approval, and add regression assertions.
2. Re-run exact-head CI.
3. Obtain independent security review for PR #7.
4. Keep dispatch disabled until governance and runtime qualification gates are independently accepted.

## Links
- [PR #7](https://github.com/VlDMlNSh/developer-cloud-pool/pull/7)
- [Exact-head CI](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/41908966334)
- [Canonical default branch](https://github.com/VlDMlNSh/developer-cloud-pool/tree/Основной)
- [Full project context](../context/DEVELOPER-CLOUD-POOL-CONTEXT.md)
