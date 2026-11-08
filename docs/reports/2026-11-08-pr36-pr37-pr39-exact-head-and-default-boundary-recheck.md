# PR #36/#37/#39 exact-head and default-branch boundary recheck — 2026-11-08

## Scope and immutable refs

Repository: `VlDMlNSh/developer-cloud-pool`.
Default branch: `Основной`.
Observed default HEAD: `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
Documentation branch: `docs/cross-chat-continuation-2026-11-06`.
Documentation context blob before this pass: `46bc87a8bf142282250e1036566b15c93f532742`.
No code, workflow, permission, secret, variable, ruleset, cloud resource or deployment changes were made.

## Current exact-head CI evidence

| PR | Exact head | Exact-head workflow evidence | Formal reviews / threads |
|---|---|---|---|
| #36 D1 single-use ledger | `1e278b1601b8a77131118aa5c627c07d663b0e51` | D1 Ledger Proof run `42276981988` COMPLETED/SUCCESS; Pool Contract Validation `42276982111` COMPLETED/SUCCESS | 0 / 0 |
| #37 reusable Worker boundary | `5b45a29ed7869c091741c0037c68bfcd6640de7d` | Reusable Pool Worker Boundary Validation run `42280875294` COMPLETED/SUCCESS; Pool Contract Validation `42280875365` COMPLETED/SUCCESS | 0 / 0 |
| #39 atomic claim/outbox | `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833` | Isolated D1 Ledger Proof run `42329993548` COMPLETED/SUCCESS; tested PR merge tree `77b3ce30a3c90ad564db892cae82076b5c0774c9` | 0 / 0 |

Combined commit-status contexts for the three exact heads are empty. The named workflow-run records above are the positive CI evidence; empty status contexts are not a pass and do not substitute for workflow logs/artifact review. Default HEAD `197ba98d0dc7d8437d759dd25bee8750d02e59ae` has no associated PR-triggered workflow runs and no combined status contexts in the queried endpoints.

All three PRs remain OPEN / DRAFT / UNMERGED. CI success does not qualify or accept the authorization system. No independent review exists in GitHub review submissions or inline review threads.

## Default-branch execution-boundary finding

Read-back from default branch `Основной`:

- `.github/workflows/pool-supervisor.yml` blob `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`.
- `.github/workflows/pool-worker.yml` blob `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`.
- `scripts/pool-supervisor.mjs` blob `52bf03ca889edd92fd10c71ae96a2e35e106d43f`.

The current default Supervisor still declares `workflow_run: completed` for Pool Worker and grants workflow-level `actions: write` plus `issues: write`. The default Worker still exposes `workflow_dispatch` and contains a report job with `issues: write`. This is the legacy privileged dispatch/reporting chain.

PR #37's draft replacement is materially narrower: Worker is `workflow_call` only, has no worker-side issue mutation/report job, and the Supervisor statically calls the local reusable Worker without `workflow_run` or `actions: write`. This is a meaningful least-privilege improvement in the proposal, but remains unmerged and unreviewed.

The default Supervisor script exits before queue processing unless `POOL_DISPATCH_ENABLED === "true"`. Historical Issue #1 reports the variable was set/read back as false on 2026-11-04. Current live variable state was not read in this pass; treat it as NOT VERIFIED, and do not rely on the historical value as current evidence. No dispatch was attempted.

## D1 proof and stacked-branch constraints

- PR #36 is a local Workers-runtime D1 ledger proof; no remote D1 resource was provisioned.
- PR #39 is stacked on the PR #36 proof branch and tests the combined parent/child merge tree. Its local test evidence is 2 files / 19 tests passed, but it does not qualify remote D1, signed issuer identity, trusted clock, leases/fencing, recovery or production dispatch.
- PR #39 adapter and tests still receive the binding object as function input. The proof does not authenticate owner/repository identity or verify a signed approval issuer. Caller-supplied identity is not an authorization proof.
- The adapter's approval transition plus SQLite trigger is a useful local atomicity proof; do not interpret it as an integrated production control plane.
- Issue #38 remains open; A/B/C comparison is documented, but real-backend contention/recovery and independent review remain outstanding.

## Governance read-back

- PR #36 reviews: 0; inline threads: 0.
- PR #37 reviews: 0; inline threads: 0.
- PR #39 reviews: 0; inline threads: 0.
- Repository metadata confirms owner/admin access for the linked account. This does not provide an independent reviewer.
- The previously recorded active ruleset ID `26550182` and its zero-required-approval configuration were not re-read through a ruleset-detail endpoint in this pass; treat effective ruleset details as NOT VERIFIED. Do not change ruleset or approval settings based on this report.

## Decision and next bounded action

1. Keep `POOL_DISPATCH_ENABLED` and `POOL_AUTHORIZATION_CONTRACT_ACCEPTED` fail-closed. Current live values are NOT VERIFIED in this pass.
2. Do not merge PR #36/#37/#39. Do not deploy D1 or Workers, execute Supervisor/Worker/DSH, run Resource Probe, call providers/models, or use paid fallback.
3. The next technical gate is a read-only source review of PR #37 and the combined PR #36/#39 authorization chain against the integrated threat model, with findings recorded for an independent reviewer. An implementation-side audit is not independent acceptance.
4. Obtain an authorized independent security reviewer through repository governance before any merge or implementation of issuer, lease/fencing, dispatcher or runtime integration.

## Status

- Exact-head workflow runs: VERIFIED for the listed immutable SHAs.
- Combined status contexts: empty; not treated as passing evidence.
- Independent review: NOT RUN.
- Default live dispatch variable state: NOT VERIFIED.
- Remote D1 qualification: NOT RUN.
- Production integration/deployment/dispatch: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
