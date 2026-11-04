# Live checkpoint — 2026-11-04: owner-bound Pool Supervisor approval

- Canonical default branch `Основной`: `692025e4a039aaf94c6683bb95da38b4f324fce8`.
- Ruleset 26550182: ACTIVE; exact selector `refs/heads/Основной`; PR required; no bypass actors.
- PR #7: OPEN / DRAFT / NOT MERGED; branch `fix/pool-owner-approval-guard-2026-11-04`; exact head `87064dd1d8ec1b31196ee4e940bc0a86cfc299f3`; base `692025e4a039aaf94c6683bb95da38b4f324fce8`.
- Finding: Supervisor previously trusted `pool:ready` label presence without checking who applied it. PR #7 adds repository-owner event verification, bot-authored approval marker bound to issue/SHA/profile, single-use consumption, revocation and unit tests.
- PR #7 exact-head CI run `41908095984` SUCCESS; job `126848040382`; YAML parse, owner-approval unit tests, dispatch-disabled assertion and pool contract validator passed.
- PR #7 independent review: NOT RUN. Do not merge or enable dispatch.
- Changed-file blob SHAs:
  - `scripts/pool-approval.mjs`: `9442c413c38dc28c67455362e254ff703bcfedd9`
  - `scripts/pool-approval.test.mjs`: `685c5106ea8f7d4b9da4e8f896460cb2dca93d07`
  - `scripts/pool-supervisor.mjs`: `1e4e5323121f17caa883ebea24415cd0369cce0f`
  - `scripts/validate-pool-contract.mjs`: `830d6bd5cfbd3f95e9c319e60764c9c5e9cf6def`
  - `.github/workflows/pool-supervisor.yml`: `18e040f95d1d5c2ae5a2cce69d95109bec83947b`
  - `.github/workflows/pool-contract-validation.yml`: `65d8ada34950290939d8616b3f57ec22632d617e`
- PR #3 is MERGED as default HEAD `692025e4a039aaf94c6683bb95da38b4f324fce8`; review endpoint was empty. Its Issue #1 pre-merge independent-review criterion was not met; record as process deviation, not a verified review.
- PR #4 remains OPEN with stale base SHA `4597617db0de7cc698cce936a540594ee3d25bf2`; CI/review NOT VERIFIED.
- PR #6 remains OPEN / DRAFT; static CI SUCCESS; independent review NOT RUN.
- Current `POOL_DISPATCH_ENABLED`: NOT VERIFIED. SentinelX script read attempt returned exit code 127/no output; earlier call had duplicate session. Historical false value is not current evidence.
- SentinelX `host_5f7264034bdf0b51`: ping PASS; capabilities summary PASS; Free plan 1 active / 0 spare slots.
- Worker, DSH, Resource Probe, browser, model calls and dispatch NOT RUN.

Report: [Owner-bound Pool Supervisor approval guard](../reports/2026-11-04-pool-owner-approval-guard.md)
Full context: [Developer Cloud Pool context](../context/DEVELOPER-CLOUD-POOL-CONTEXT.md)
Canonical default branch: https://github.com/VlDMlNSh/developer-cloud-pool/tree/Основной
PR #7: https://github.com/VlDMlNSh/developer-cloud-pool/pull/7
Exact-head CI: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/41908095984

Next: independent security review PR #7; reconcile Issue #1 history; update PR #4 base and re-run exact-head CI/review. Keep dispatch disabled until all gates are accepted.
