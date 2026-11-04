# SentinelX control channel and ephemeral browser runtime — 2026-11-04

## Scope and immutable targets

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch: `Основной`
- Default HEAD: `4597617db0de7cc698cce936a540594ee3d25bf2`
- PR #3 head: `7aa5b27b6e826918eeaa6397afe0378d14359022`
- PR #3 base: `4597617db0de7cc698cce936a540594ee3d25bf2`
- Documentation branch: `docs/continuation-context-2026-11-04`
- This report documents verified state; it does not merge PR #3 or change default branch.

## SentinelX-first control channel

User direction: use SentinelX as the primary host control channel; use Desktop Commander only when SentinelX cannot perform a necessary operation.

Verified SentinelX state:
- Host ID: `host_5f7264034bdf0b51`
- Hostname: `Voktors-Mini.Dlink`
- Agent version: `0.23.30`
- Host architecture: macOS arm64, Darwin 23.6.0
- Plan: Free, active host limit 1; 1 active / 0 parked / 0 free slots.
- `sentinel_ping`: PASS.
- `sentinel_exec("uname -a")`: PASS; returned Darwin arm64.
- Capabilities summary: PASS once; full capabilities calls intermittently returned `duplicate_session` / `read_loop_ended`.
- `node` is not in this host's allowed command list. No allowlist change was made. SentinelX documents `script_run` for one-off Bash/Python work; use that only if host-side execution is needed.
- No Desktop Commander calls were used in this pass.
- This Mac mini remains an administrative/control host, not the cloud pool runtime. No Worker or browser task was run on it.

## GitHub governance

Ruleset `Основной — verified`, ID `26550182`:
- active
- exact branch selector `refs/heads/Основной`
- pull request required; approvals 0
- deletion and non-fast-forward restrictions enabled
- CODEOWNERS review disabled
- extra approval for unattributed changes disabled
- review thread resolution enabled
- bypass actors empty; current user bypass never

Repository Actions variable:
- `POOL_DISPATCH_ENABLED=false` was set and read back through the authenticated GitHub CLI session.
- Latest CI job also received `POOL_DISPATCH_ENABLED: false` in its environment and passed the fail-closed assertion.

## PR #3 exact-head CI

- PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/3
- Exact head: `7aa5b27b6e826918eeaa6397afe0378d14359022`
- Exact-head run: [41881360241](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/41881360241)
- Job ID: `126754359530`
- Status: **COMPLETED / SUCCESS**
- Steps: checkout without persisted credentials; dispatch-disabled assertion; parse workflow YAML; static security-contract validation; all completed successfully.
- Job log confirms five workflow YAML files parsed and:
  - `PASS workflow inputs are not interpolated into shell run blocks`
  - `PASS all external Actions references are pinned to 40-character commit SHAs`
  - `PASS Worker permissions, profile allowlist, checkout and no-secret probe invariants`
  - `PASS Supervisor dispatch is fail-closed and variable-controlled`
  - `PASS DSH and Resource Probe remain manual, read-only and secret-free`
  - `POOL_CONTRACT_VALIDATION=PASS`
- Earlier failed runs were on intermediate heads and exposed false-positive validator assertions; the latest exact-head successful run supersedes those results.
- PR #3 remains OPEN, unmerged; no independent review recorded. Mergeability true at last read.
- CI qualification for this static validation: **VERIFIED**. PR implementation integration/acceptance: **NOT ACCEPTED** until independent review and merge.

## Agent-browser inside the cloud pool

Created issue [#5 — Run agent-browser inside ephemeral GitHub-hosted pool runners](https://github.com/VlDMlNSh/developer-cloud-pool/issues/5).

Target architecture:
- Run `agent-browser` inside a dedicated GitHub Actions job on ephemeral `ubuntu-24.04` GitHub-hosted runners.
- Install pinned `agent-browser` and its supported Chromium during each job; do not depend on a pre-existing browser, external server, persistent VM, Mac mini, or physical hardware.
- Before browser commands, load current CLI workflow using `agent-browser skills get core`; load `--full` when required.
- Browser, Chromium, CDP, profile, downloads and temporary files stay inside the job sandbox. CDP loopback-only; no exposed debugging ports or persistent browser daemon.
- Fresh profile/session per task; no cross-run storage by default.
- Browser job has least-privilege permissions and no secrets by default. Any required credential must be task-scoped and separately authorized.
- Enforce URL/host allowlists, redirect validation, bounded timeouts/downloads, sanitized artifacts and provenance.
- Record target SHA, run/job IDs, agent-browser and Chromium versions, approved domains, operation summary, artifact digests and terminal status.
- Only add a browser Worker profile after independent review, exact-head CI, network controls and pool lifecycle qualification.

Issue #5 is a design/implementation work item, not an installed or qualified browser runtime. No browser package was installed in this pass.

## Execution boundaries

- `POOL_DISPATCH_ENABLED=false`: VERIFIED.
- Worker dispatch: NOT RUN.
- DSH evaluation: NOT RUN.
- Runner Resource Probe: NOT RUN.
- Model/provider calls: NOT RUN.
- Paid fallback: NOT RUN.
- Browser workload: NOT RUN.
- Multi-runner pool: NOT QUALIFIED.
- Agent-browser cloud runtime: PLANNED, not deployed.

## Next bounded steps

1. Obtain independent review for PR #3 and integrate only after current exact-head CI remains green.
2. Execute Resource Probe as a separate, read-only and approved qualification step.
3. Assess DSH headless smoke separately.
4. Implement issue #5 as an isolated browser-smoke workflow on ephemeral GitHub-hosted runners, with pinned versions and no secrets.
5. Integrate browser profile into the Worker only after the security, network, lifecycle and provenance gates pass.
6. Keep dispatch disabled until worker lifecycle and recovery are qualified.
