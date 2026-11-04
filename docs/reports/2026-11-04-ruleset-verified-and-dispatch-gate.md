# Ruleset verification and dispatch gate — 2026-11-04

## Scope and immutable targets

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Repository ID: `1445644538`
- Default branch: `Основной`
- Default HEAD: `4597617db0de7cc698cce936a540594ee3d25bf2`
- Documentation branch: `docs/continuation-context-2026-11-04`
- Documentation branch HEAD observed before this report: `b8f01fdd669ad9bece12c16484ae8200cf75f7e5`

This report is committed only to the documentation/evidence branch. It is not an integration into the default branch.

## Governance result

<badge>VERIFIED</badge>

Rulesets collection returned exactly one active repository ruleset:

- Name: `Основной — verified`
- ID: `26550182`
- Target: `branch`
- Enforcement: `active`
- Exact selector: `refs/heads/Основной`
- `deletion`: enabled
- `non_fast_forward`: enabled
- `pull_request`: enabled
- Required approving reviews: `0`
- CODEOWNERS review: `false`
- Extra approval for unattributed changes: `false`
- Required review thread resolution: `true`
- Required reviewers: empty
- Bypass actors: empty
- `current_user_can_bypass`: `never`

The previous Ruleset ID `26535481` now returns HTTP 404. The collection contains only ID `26550182`. This confirms replacement and removal of the prior ruleset, without an observed period in this audit where the replacement was absent.

The classic branch endpoint continues to return `protected: false` and `protection.enabled: false`. This is recorded separately: classic branch-protection metadata is not the same API object as repository Rulesets. The active Ruleset is independently verified with the exact branch selector and required controls.

References:
- [Active Ruleset](https://github.com/VlDMlNSh/developer-cloud-pool/rules/26550182)
- [Rulesets API collection](https://api.github.com/repos/VlDMlNSh/developer-cloud-pool/rulesets?includes_parents=true)
- [Issue #2 — resolved](https://github.com/VlDMlNSh/developer-cloud-pool/issues/2)

Issue #2 received a verification comment and was closed as completed after the live API readback. Issue #1 remains open because the dispatch variable is not independently readable through the available integration.

## Dispatch gate

<badge color="warning">BLOCKED</badge>

- The supervisor source reads `vars.POOL_DISPATCH_ENABLED`.
- `scripts/pool-supervisor.mjs` dispatches only when the value is the literal string `true`; otherwise it exits in heartbeat-only mode.
- The repository Actions variable value is not exposed by the available GitHub integration. Its actual value remains **NOT VERIFIED**.
- The owner previously stated in Issue #1 and Issue #2 that it remains unset/false. This is owner-provided evidence, not an independent API readback.
- No dispatch was triggered.

No Worker, DSH runtime evaluation, Runner Resource Probe, model/provider call, secret access, or paid fallback was run.

## Workflow contract inspection

Read back from the default branch:

| File | Blob SHA | Observation |
|---|---|---|
| `.github/workflows/pool-supervisor.yml` | `d4bd23d06c0dc98211cea165cdad30a1861eb3bd` | Schedule, issue, workflow-run and manual triggers; `actions: write`; dispatch gate passed through repository variable |
| `scripts/pool-supervisor.mjs` | `52bf03ca889edd92fd10c71ae96a2e35e106d43f` | Literal `POOL_DISPATCH_ENABLED === "true"` gate; heartbeat-only exit otherwise |
| `.github/workflows/pool-worker.yml` | `3ddb0038a8336214acc74717804562173c8eaa25` | Allowlist limited to `dsh-headless-probe`; issue claim and immutable SHA validation; separate validation/probe/report jobs |
| `.github/workflows/dsh-runtime-evaluation.yml` | `df8a3788cd8ff4ba5c5b1009298f6bd81b80344d` | Manual headless smoke test, pinned Node and DSH package, no model credentials |
| `.github/workflows/runner-resource-probe.yml` | `3b925d2ff7db77b669a1056b6ec04d4028640edf` | Manual read-only resource inventory |

PR #3 contains the shell-input hardening variant of the worker workflow, blob SHA `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`. The task issue number is passed through `TASK_ISSUE` environment rather than interpolated into Bash source. This change is still unmerged and must not be treated as the default-branch implementation.

## Pull request and CI state

- PR #3 head: `9a21c52afae02ac2b446d4ac1b5ae33fbbdad6df`
- PR #4 head: `ab43af86b63a731202fa0f8fa6f27f009b0d4aac`
- Both PRs remain open.
- Exact-head check-runs: zero for both.
- Exact-head commit statuses: zero contexts; state reported as pending.
- Review submissions: empty for both.
- Associated PR workflow runs: zero for both.

Therefore both PRs remain **NOT VERIFIED** for CI and **NOT REVIEWED** independently. Do not merge either PR based on the available evidence.

The two successful Supervisor workflow runs on the default HEAD are reconciliation/heartbeat runs only. They do not demonstrate Worker, DSH, Resource Probe or model execution.

## Execution status

- Ruleset governance: **VERIFIED**
- Classic branch protection flag: **NOT VERIFIED / reports false**
- `POOL_DISPATCH_ENABLED`: **NOT VERIFIED**
- Supervisor heartbeat: prior successful runs observed
- Worker dispatch: **NOT RUN**
- DSH evaluation: **NOT RUN**
- Resource Probe: **NOT RUN**
- PR #3 CI/review: **NOT VERIFIED**
- PR #4 CI/review: **NOT VERIFIED**
- Pool qualification / acceptance: **NOT QUALIFIED / NOT ACCEPTED**

## Next bounded step

1. Preserve dispatch disabled.
2. Continue read-only validation of workflow contracts and add static validation that does not trigger any runner workflow.
3. Resolve independent visibility of `POOL_DISPATCH_ENABLED` without exposing secrets or changing repository settings.
4. Only after that gate is independently verified, proceed to the isolated read-only Resource Probe; keep DSH and Worker runs separately gated.
5. Re-check exact PR heads and CI before considering integration.

