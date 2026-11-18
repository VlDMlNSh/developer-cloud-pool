# Atomic owner /next admission — local D1 proof

This package tests one bounded admission transaction using the official Cloudflare Workers Vitest integration and local Miniflare/workerd D1.

## State transition

A trusted, newly-created owner top-level `/next` event on Cloud Pool Issue #96 is validated against repository ID, owner ID/login, owner association, issue URL/state, default-branch ref, controller code SHA and target SHA.

The adapter inserts one receipt keyed by the source comment ID. A D1 trigger then performs, in the same SQLite/D1 statement transaction:

1. conditional consumption of the matching, unexpired, one-shot approval;
2. creation of the immutable logical task and wave binding;
3. attachment of the consumed approval to the task;
4. creation of one task-level outbox row.

If any step fails, the receipt insert and trigger effects roll back. Exact replay reads by the stable source comment ID and returns the original wave/task/outbox; it does not consume a second approval or create another task. Ambiguous write outcomes are resolved by read-after-write on the stable source ID; no blind retry is issued.

Admission receipts are append-only. Approval identity/binding and logical task identity are immutable. All adapter outcomes set `dispatch: false` and `executionAuthorized: false`.

## Test and dependency policy

- `@cloudflare/vitest-plugin@1.4.7` and `vitest@4.1.12` are exact-pinned.
- `package-lock.json` is copied byte-for-byte from the separately reviewed PR #111 proof package.
- CI uses `npm ci --ignore-scripts --no-audit --no-fund`, Node 24.9.0, pinned GitHub Actions SHAs and `contents: read` only.
- Tests run against local Workers-runtime D1 emulation; they do not provision or access hosted D1.

## Explicit exclusions

This is not a production webhook workflow or controller. It does not authenticate worker workload identity, implement claim/renew/finalize, deliver the outbox, reconcile child runs, integrate with Supervisor/Worker, invoke Gemini/providers, read secrets, deploy, or dispatch. Those remain separate gates. Local D1 success is not hosted persistence qualification.


## Trusted target SHA boundary

The adapter requires `trustedDefaultHeadSha` and rejects admission unless it is a valid SHA exactly equal to `targetSha`. The caller must obtain this value from trusted GitHub workflow/event metadata or an independently authenticated default-branch ref read. The pure admission function does not fetch GitHub refs, verify webhook signatures, or prove that the supplied value is authentic. The equality check is a contract guard, not standalone event provenance. Stale/mismatched target and pre-consumed approval rejection are covered by the Workers-runtime test suite.


The approval-consumption trigger also requires the UPDATE itself to affect exactly one row (`changes() = 1`). A pre-consumed approval cannot authorize a new receipt even if its timestamp and task key happen to match. The adversarial Workers-runtime test covers this same-second pre-consumption case.


## GitHub Actions context composition proof

The additional `github-actions-adapter.mjs` binds the webhook event payload to runner-provided `GITHUB_*` values instead of accepting target SHA, workflow SHA, run ID, or ref as caller-selected fields. It checks the numeric repository/owner identity against both the runner environment and event payload and allowlists the future `.github/workflows/cloud-pool-next-controller.yml` workflow ref on the default branch.

This is a no-secret local composition test only. The allowlisted production workflow does not yet exist on the default branch, and no live `issue_comment` run has exercised D1. No event signature verification, independent API re-read, hosted D1, admission approval issuer, lease/fencing, worker dispatch or provider call is qualified by these tests. Dispatch remains false.
