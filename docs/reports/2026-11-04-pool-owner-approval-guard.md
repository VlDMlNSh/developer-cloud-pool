# Engineering report — 2026-11-04: owner-bound Pool Supervisor approval

## Immutable target and branch
- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Canonical default branch: `Основной`
- Base HEAD: `692025e4a039aaf94c6683bb95da38b4f324fce8`
- Work branch: `fix/pool-owner-approval-guard-2026-11-04`
- Draft PR #7: https://github.com/VlDMlNSh/developer-cloud-pool/pull/7
- Exact PR head: `87064dd1d8ec1b31196ee4e940bc0a86cfc299f3`
- PR state: OPEN / DRAFT / NOT MERGED; mergeable true at last read.

## Finding
The existing Supervisor treated the `pool:ready` label as sufficient dispatch authority. The task issue template stated that an owner must apply the label, but the Supervisor did not verify the actor that applied it. If a collaborator with issue-label permission applied the label while dispatch was enabled, the scheduled reconciler could have treated the issue as approved. This is a source-level authority gap; no dispatch was enabled or executed.

The active Ruleset protects the default branch but does not itself prove that a particular issue-label event was initiated by the repository owner.

## Implemented on PR #7
1. Added `scripts/pool-approval.mjs`:
   - accepts approval only for an `issues.labeled` event on `pool:ready`;
   - requires the sender login to match the repository owner;
   - validates open issue state, exact 40-character target SHA and the exact allowlisted DSH profile;
   - formats bot-authored approval, consumed and revoked audit markers;
   - validates marker provenance (GitHub Actions bot), issue, owner, SHA and profile;
   - processes approval lifecycle chronologically.
2. Updated `scripts/pool-supervisor.mjs`:
   - reads the GitHub event payload and fails closed if it cannot be parsed;
   - records approval only from an owner-originated label event;
   - rejects non-owner or malformed approval attempts and moves them to review;
   - requires a matching bot-authored approval marker before claiming a ready task;
   - consumes approval before dispatch so it cannot be replayed;
   - records revocation when the owner removes `pool:ready`.
3. Updated `.github/workflows/pool-supervisor.yml` to listen for `unlabeled` so manual removal revokes prior approval.
4. Added `scripts/pool-approval.test.mjs` covering valid owner approval, non-owner rejection, invalid envelopes, bot provenance, exact SHA/profile binding, single-use consumption and revocation.
5. Added the unit test step to `.github/workflows/pool-contract-validation.yml` and extended the static contract validator.

The guard is intentionally restrictive: only the repository owner can approve. Delegated maintainers are not implicitly trusted. A task whose approval is absent, stale, consumed or revoked fails closed and requires a fresh owner label action.

## Read-back blob SHA evidence
All six changed files were fetched back from the work branch:
- `scripts/pool-approval.mjs`: `9442c413c38dc28c67455362e254ff703bcfedd9`
- `scripts/pool-approval.test.mjs`: `685c5106ea8f7d4b9da4e8f896460cb2dca93d07`
- `scripts/pool-supervisor.mjs`: `1e4e5323121f17caa883ebea24415cd0369cce0f`
- `scripts/validate-pool-contract.mjs`: `830d6bd5cfbd3f95e9c319e60764c9c5e9cf6def`
- `.github/workflows/pool-supervisor.yml`: `18e040f95d1d5c2ae5a2cce69d95109bec83947b`
- `.github/workflows/pool-contract-validation.yml`: `65d8ada34950290939d8616b3f57ec22632d617e`

## Exact-head CI
- Run [41908095984](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/41908095984): COMPLETED / SUCCESS.
- Job: `126848040382`, completed successfully.
- Exact head: `87064dd1d8ec1b31196ee4e940bc0a86cfc299f3`.
- Steps verified: dispatch-disabled assertion, YAML parse, owner-bound approval unit tests, static pool security-contract validator.
- The test step and contract validator both completed SUCCESS.
- Independent PR review submissions: 0; NOT RUN.
- PR #7 remains DRAFT and is not integrated or accepted.

## Current governance and runtime recheck
- Ruleset `26550182`: ACTIVE; exact selector `refs/heads/Основной`; PR required; no bypass actors.
- Issue #1 remains OPEN. Its historical acceptance required independent review of PR #3 before merge. PR #3 is now merged as commit `692025e4a039aaf94c6683bb95da38b4f324fce8`, but its review endpoint was empty. Record this as a process deviation; do not retroactively mark independent review as passed.
- PR #4 remains OPEN; base SHA `4597617db0de7cc698cce936a540594ee3d25bf2` is stale relative to current default HEAD; exact-head CI/review remain NOT VERIFIED.
- PR #6 remains OPEN / DRAFT; exact-head static CI SUCCESS; independent review NOT RUN.
- Current `POOL_DISPATCH_ENABLED`: NOT VERIFIED. A read-only SentinelX `script_run` attempt to read it returned exit code 127 with no output; a preceding attempt hit a duplicate session. Do not infer false from historical values.
- SentinelX host `host_5f7264034bdf0b51`: ping PASS; capabilities summary PASS; Free plan 1 active / 0 spare slots. No host mutation or workload was run.
- Worker, DSH, Resource Probe, browser, model calls and dispatch: NOT RUN.

## Limitations and follow-up
- Approval comments use the GitHub Actions bot identity and are bound to issue/SHA/profile. The comments API is read with a bounded page; if the marker is not in the returned page, behavior is fail-closed (task moves to review), never dispatch.
- This guard has static CI evidence only. It has not been exercised against live issue-label events while dispatch is enabled; do not enable dispatch as part of this PR.
- Independent security review must inspect the event actor check, marker provenance, chronological consumption/revocation and concurrency behavior before merge.
- Reconcile Issue #1's acceptance record and the PR #3 review deviation without rewriting history.

## Next bounded step
Obtain independent review for PR #7 and, separately, correct the stale PR #4 base / CI state. Keep `POOL_DISPATCH_ENABLED` disabled or unset until its current value is independently confirmed and all required governance and runtime qualification gates are accepted.

## Links
- [Canonical default branch](https://github.com/VlDMlNSh/developer-cloud-pool/tree/Основной)
- [PR #7 — owner-bound approval guard](https://github.com/VlDMlNSh/developer-cloud-pool/pull/7)
- [Issue #1 — governance gate](https://github.com/VlDMlNSh/developer-cloud-pool/issues/1)
- [Issue #5 — ephemeral browser runtime](https://github.com/VlDMlNSh/developer-cloud-pool/issues/5)
- [Exact-head CI run](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/41908095984)
