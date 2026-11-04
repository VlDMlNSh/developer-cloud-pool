# Live checkpoint — 2026-11-04: Pool approval intake follow-up

- Canonical default branch `Основной`: `692025e4a039aaf94c6683bb95da38b4f324fce8`.
- Active Ruleset 26550182: exact selector `refs/heads/Основной`; PR required; no bypass actors.
- PR #7: OPEN / DRAFT / NOT MERGED; branch `fix/pool-owner-approval-guard-2026-11-04`; exact head `8dc7252d8151da2c8f30926c3564074ecaebae92`; base `692025e4a039aaf94c6683bb95da38b4f324fce8`.
- Change: owner approval intake now runs before the dispatch-disabled exit. When dispatch is disabled, Supervisor may record/reject owner label approval and audit it, then exits before recovery or Worker dispatch.
- Changed `scripts/pool-supervisor.mjs` blob SHA: `85f3997a4be723735d8eab1c06e6a52b938b33d3`.
- Exact-head CI [41908966334](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/41908966334), job `126851105703`: COMPLETED / SUCCESS; YAML parse, approval unit tests and pool contract validator passed.
- PR #7 independent reviews: 0 / NOT RUN. PR remains draft; no merge.
- Remaining fail-closed inconsistency: stale-claim expiry and immediate dispatch API failure still return a task to `pool:ready` after the approval marker was consumed. The next reconciliation rejects the consumed approval and moves the task to review, so this is not an approval replay, but state/comment handling is inconsistent and needs a regression-tested fix.
- Current `POOL_DISPATCH_ENABLED`: NOT VERIFIED by live read; do not infer from historical false value.
- SentinelX host `host_5f7264034bdf0b51`: operational; Free plan 1 active / 0 spare slots.
- Worker, DSH, Resource Probe, browser and model execution: NOT RUN.

Latest report: [Approval intake while dispatch is disabled](../reports/2026-11-04-approval-intake-disabled-dispatch.md)
Previous report: [Owner-bound approval guard](../reports/2026-11-04-pool-owner-approval-guard.md)
Full context: [Developer Cloud Pool context](../context/DEVELOPER-CLOUD-POOL-CONTEXT.md)
Canonical default branch: https://github.com/VlDMlNSh/developer-cloud-pool/tree/Основной
PR #7: https://github.com/VlDMlNSh/developer-cloud-pool/pull/7

Next: fix stale-claim and dispatch-failure recovery to transition directly to `pool:needs-review` after approval consumption; add tests; run exact-head CI; obtain independent security review. Keep dispatch disabled until all governance and runtime qualification gates are accepted.
