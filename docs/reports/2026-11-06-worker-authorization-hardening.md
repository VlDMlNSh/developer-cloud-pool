# 2026-11-06 — Worker-side authorization hardening audit

## Scope and immutable evidence

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Work branch: `fix/pool-owner-approval-guard-2026-11-04`
- Code target verified by exact-head CI: `9c8afd2e3530b970e7f26a0b8d3d1bac62636f96`
- PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/7
- Base branch at the PR: `Основной`, prior base `692025e4a039aaf94c6683bb95da38b4f324fce8`
- Current default-branch HEAD observed during this pass: `64d2636d4500127e635c214ccfb722c6b3fcda80`
- Comparison against current default branch: PR branch diverged, 61 commits ahead and 1 commit behind. Rebase/update is still required before merge review.

## Work performed

1. Added Worker-side verification helpers for:
   - exact owner approval marker and immutable task envelope;
   - single-use approval consumption bound to the actual Supervisor run ID;
   - bot-authored claim receipt bound to the same run ID and target SHA;
   - owner-originated `pool:ready` issue event;
   - current bot-authored `pool:claimed` transition;
   - trusted Supervisor workflow identity, event, actor, branch and run state;
   - duplicate Worker run detection for the same issue approval.
2. Added required `supervisor_run_id` input to Pool Worker and passed the current run ID from Pool Supervisor.
3. Worker validation now checks issue state, current claim, task envelope, Supervisor workflow/run metadata, owner label event, consumed approval, claim receipt and prior Worker runs.
4. Worker validation receives only read permissions for contents, issues and Actions. The DSH probe remains secret-free and contents-read-only.
5. Worker authorization code is checked out from the repository default branch, not from the caller-selected dispatch ref. Non-default-ref dispatch is rejected.
6. Added per-issue Worker concurrency to serialize duplicate invocations.
7. Pool Supervisor dispatch is now limited to an `issues.labeled` event where the repository owner applies `pool:ready`. Scheduled and `workflow_run` invocations remain reconciliation-only; they do not dispatch Workers.
8. Approval-event matching permits a still-unconsumed owner approval to wait in the queue; it does not expire solely because the queue waited longer than ten minutes.

## Exact-head verification

- GitHub Actions run: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42193213501
- Exact code head: `9c8afd2e3530b970e7f26a0b8d3d1bac62636f96`
- Job `127810029865`: COMPLETED / SUCCESS.
- Five workflow YAML files parsed successfully.
- Node contract tests: 11 passed, 0 failed.
- Static pool contract validator: `POOL_CONTRACT_VALIDATION=PASS`.
- CI environment observed `POOL_DISPATCH_ENABLED=false`.

This is static contract verification only. No Worker, DSH runtime, Resource Probe, browser, provider API or model call was started.

## Read-back blob SHAs at the verified code head

- `.github/workflows/pool-worker.yml`: `e109724be2e67c7508dda185fa10e7aa2f601507`
- `scripts/pool-approval.mjs`: `f3a3a9f12214bc3ecb16cbe0d268062b47fb19ae`
- `scripts/pool-approval.test.mjs`: `e02e15e1633c7e265697902e595b5237783a6735`
- `scripts/pool-supervisor.mjs`: `930c4bde51be39077bf862a3941fb0d655c4ac39`
- `scripts/validate-pool-contract.mjs`: `07263b3968877c444c62cbe3edf4fc9ecf6bba3e`

## Governance and related work

- Active repository ruleset `26550182` scopes to `refs/heads/Основной`, requires PR integration, blocks deletion and non-fast-forward updates, but requires zero approving reviews. No bypass actors were returned. Formal independent review remains NOT RUN.
- PR #7 remains OPEN and DRAFT. The only recorded review is the repository owner's preliminary COMMENTED finding, not an independent agent review.
- PR #8 (Task Matrix Builder) is based on the old PR #7 head `d60d26ae...`; it is 4 commits ahead and 46 commits behind the current PR #7 head. Rebase/reconciliation is required before integration.
- PR #6 remains a draft static read-only Jarvis dashboard. It has no live API integration; browser/device visual QA and independent review remain NOT VERIFIED.
- No repository secrets were read. The dispatch variable was observed only through the CI job environment.

## Status

- Worker authorization implementation: IMPLEMENTED on the draft PR branch.
- Unit/static contract verification: VERIFIED at code SHA `9c8afd2e...`.
- Live Worker execution: NOT RUN.
- Runtime API actor/timeline behavior: NOT VERIFIED.
- Independent security review: NOT RUN.
- Production qualification / deployment / acceptance: NOT QUALIFIED / NOT DEPLOYED / NOT ACCEPTED.
- Dispatch: BLOCKED; keep `POOL_DISPATCH_ENABLED=false`.

## Next bounded step

Rebase PR #7 onto current `Основной`, rerun exact-head CI, obtain an independent security review of the Worker/Supervisor event and replay checks, then separately qualify a no-secret DSH probe only after all governance gates are satisfied. Rebase PR #8 onto the accepted PR #7 result afterward.

No merge, dispatch, secret access, provider call, model call, deployment or qualification occurred in this pass.


## Documentation alignment — 2026-11-06

After the code verification, README and architecture guidance were corrected to match the implemented trigger boundary: owner `pool:ready` issue events can dispatch; scheduled, `workflow_run` and manual Supervisor runs are reconciliation-only.

- `README.md` blob: `d545b025a12af4c0a8c3637f785e812b50d5f4b4`
- `docs/architecture/GITHUB-POOL-SUPERVISOR-AND-RECOVERY.md` blob: `e136c06669a4387dac56988f37b3356e117c4d3b`

These are documentation-only commits after the verified code head. No code changed after the exact-head CI run; the path-filtered contract workflow was not triggered by these documentation-only updates.
