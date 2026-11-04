# Engineering report — 2026-11-04: single-use approval recovery consistency

## Scope
One bounded follow-up on draft PR #7. Re-read the current Supervisor, approval module, unit tests, workflow and current GitHub state before editing.

## Change
Corrected both recovery paths that previously restored `pool:ready` after consuming the one-time owner approval:
- stale claim with no matching Worker run after 15 minutes;
- immediate GitHub workflow-dispatch API failure.

Both now transition from `pool:claimed` to `pool:needs-review`, remove any stale `pool:ready` label, and explain that a fresh owner approval is required. No automatic retry or approval replay is introduced.

Added a regression test that reads the Supervisor source and asserts both transitions target `pool:needs-review` and neither recovery path restores `pool:ready`.

## Immutable target and evidence
- PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/7
- Branch: `fix/pool-owner-approval-guard-2026-11-04`
- Exact head: `d60d26ae647940e702d646e572c861a8f68f523e`
- Base: `692025e4a039aaf94c6683bb95da38b4f324fce8`
- `scripts/pool-supervisor.mjs` blob: `b2046dd9671c6bd5491f63a006d10239fbd3d3b1`
- `scripts/pool-approval.test.mjs` blob: `c7c7499d9d2bb4c123e72b86adb85369023c4284`
- PR description refreshed to include the recovery fix and remaining gates.

## Exact-head CI
- Run [41909811327](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/41909811327): COMPLETED / SUCCESS.
- Job `126854055084`: SUCCESS.
- Steps passed: dispatch-disabled assertion, workflow YAML parse, owner-bound approval tests (including new recovery assertions), static pool security-contract validation.
- The check's head SHA matches the exact PR head above.

## Current repository and governance snapshot
- Default branch `Основной`: `692025e4a039aaf94c6683bb95da38b4f324fce8`.
- Documentation branch before this report update: `5aeef262c47bd5d73a139f0bf3cec8759a519cf5`.
- Ruleset 26550182 remains ACTIVE for exact selector `refs/heads/Основной`, PR required, no bypass actors.
- PR #7 remains OPEN / DRAFT / NOT MERGED; independent reviews: 0 / NOT RUN.
- PR #4 remains OPEN, head `ab43af86b63a731202fa0f8fa6f27f009b0d4aac`, base `4597617db0de7cc698cce936a540594ee3d25bf2`; exact-head check-runs absent, therefore NOT VERIFIED. Its base is stale and should be reconciled only after reviewing its current diff and dependencies.
- PR #6 current head `2f6e7592dc4d2af4f1c76b28372d9c94354ef591`; static checks SUCCESS, but independent review and browser/device validation remain NOT RUN.
- Issues #1, #4, #5 remain OPEN in this snapshot.
- SentinelX host `host_5f7264034bdf0b51`: ping PASS, capabilities summary PASS, Free plan has 1 active / 0 spare slots. A read-only `POOL_DISPATCH_ENABLED` check failed because SentinelX returned `duplicate_session` / agent_disconnected; current value remains NOT VERIFIED.
- The docs tree does not contain the separately named Bootstrap, canonical tree map or Master Roadmap files referenced by the broader project instruction. The repository README, full Developer Cloud Pool context and dated checkpoints are the available in-repository continuation sources.

## Safety status
- No dispatch variable changed.
- No Worker, DSH, Resource Probe, browser or model job launched.
- No secrets/provider credentials accessed.
- No independent security review, live enabled-dispatch event test, runtime qualification or acceptance claimed.

## Next
1. Obtain an independent security review of PR #7; author self-review is not a substitute.
2. Reconcile PR #4's stale base after reviewing its diff and exact dependency history, then rerun exact-head CI.
3. Keep dispatch disabled until governance, owner approval and runtime gates are independently accepted.

## Links
- [PR #7](https://github.com/VlDMlNSh/developer-cloud-pool/pull/7)
- [Exact-head CI](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/41909811327)
- [Canonical default branch](https://github.com/VlDMlNSh/developer-cloud-pool/tree/Основной)
- [Full project context](../context/DEVELOPER-CLOUD-POOL-CONTEXT.md)
- [Current checkpoint](../checkpoints/2026-11-04-live-checkpoint-jarvis-mobile-shell.md)
