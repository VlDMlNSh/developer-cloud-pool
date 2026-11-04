# Engineering report — 2026-11-04: GitHub Pool Supervisor implementation

## Scope
Implement the first cloud-only task dispatch and recovery scaffold in Developer Cloud Pool. No local host deployment, no provider credentials and no model execution.

## Current hardware boundary
- Only available local device: Mac mini Server 2011, Linux, 4 CPU cores, 16 GB RAM.
- Mac mini 2018 and remote GPU server: future equipment only.
- This pass does not depend on the Mac mini; GitHub hosts the control/event plane.

## GitHub baseline before this pass
- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch: Основной
- Baseline HEAD: 3df19dee67cfc22583152cba045c10eb3ab2b6d0
- Branch protection: disabled.
- Existing Actions workflow runs: 0.
- Existing resource probe and DSH evaluation workflow: IMPLEMENTED, NOT RUN.

## Implementation delivered
1. `.github/workflows/pool-supervisor.yml`
   - Scheduled every five minutes at offset minute marks.
   - Wakes on issue events, worker workflow completion and manual dispatch.
   - Uses a serialized concurrency group with queue support.
   - Checks out supervisor code and runs `node --check` before execution.
   - Fail-closed: requires repository variable `POOL_DISPATCH_ENABLED=true`.
   - Dispatches at most 20 allowlisted tasks per reconciliation.
2. `scripts/pool-supervisor.mjs`
   - Creates/ensures task-state labels.
   - Accepts only open non-PR issues labelled `pool:ready`.
   - Validates a 40-character immutable target SHA and the exact allowlisted profile.
   - Claims task, writes a non-secret audit comment and invokes `workflow_dispatch` for `pool-worker.yml`.
   - Rolls a failed dispatch back to ready.
   - Recovers stale claims after 15 minutes if no matching worker run exists.
   - Marks terminal worker runs for owner review; does not retry failed tasks indefinitely.
3. `.github/workflows/pool-worker.yml`
   - Only supports `dsh-headless-probe`.
   - Validates issue state, claim label, SHA and profile before execution.
   - Checks out exact SHA using a full-SHA-pinned checkout action.
   - Installs pinned `@deepseek-ai/dsh@0.2.1-rc.5` in an ephemeral runner and dumps headless composition only.
   - No model calls, provider credentials or user-supplied shell commands.
   - Separates validation, untrusted package execution and issue-write reporting into distinct jobs with minimal permissions.
4. `.github/ISSUE_TEMPLATE/pool-task.yml`
   - Typed intake for task SHA, profile, objective and acceptance criteria.
   - Owner must apply `pool:ready` after review.
5. `docs/architecture/GITHUB-POOL-SUPERVISOR-AND-RECOVERY.md`
   - Records lifecycle, six-hour boundary, task ledger, security model, geographic limitations and qualification gates.
6. README updated with cloud-only operating instructions and fail-closed status.

## Design corrections
- GitHub-hosted runners are ephemeral jobs, not persistent VMs.
- A neighbour-runner handoff protocol is not reliable because workers do not share guaranteed durable state. The central supervisor handles event-driven dispatch and reconciliation.
- GitHub Actions schedules have a five-minute minimum and can be delayed or dropped under load. Worker completion and issue events provide faster wakeups; schedule is a fallback, not an SLA.
- Standard hosted job execution has a six-hour maximum.
- Free-plan standard runner concurrency is 20 jobs account-wide, not 20 per repository. Jobs across repositories compete for the same account concurrency.
- The supervisor dispatches up to 20 workflows; GitHub remains responsible for actual queueing and capacity.
- GitHub is independent of the local Mac mini for control-plane availability, but GitHub selects standard runner execution regions. This design does not promise a chosen country or data residency.
- Secret values must never be written to logs. Logs may include task IDs, run IDs, SHA, provider/model route identifiers and non-secret key IDs only.

## Security gate / owner dependency
The default branch `Основной` is currently unprotected. The supervisor has a fail-closed feature gate:
- `POOL_DISPATCH_ENABLED` is read from repository Actions Variables.
- Missing or non-`true` value means heartbeat-only; no labels are created, no tasks are claimed and no workers are dispatched.
- Do not set it to true until default-branch governance has been enabled and reviewed.
- Cross-repository dispatch is not implemented. It requires a scoped GitHub App installation and an explicit repository allowlist.
- General-purpose checkpoint/resume is not implemented. The current worker is a short DSH probe only.

## GitHub evidence
- Architecture document initial commit: b96d313ffdc0bf8b846587b340217d3e999c8bd6
- Supervisor script initial commit: 6f84ea70d1c0d7c31d52ad4682d7908700118494
- Supervisor workflow initial commit: 31e2dee43acb135241be43aa6db91325178e25c8
- Worker workflow initial commit: 73a8d3a1c64c702ab10e92e48aec3e6e0574fb9f
- Issue template commit: 03304bdc4c5442fdea38817b7928c76a294d5e52
- Worker run-name correction: 58a347e1544d679231b063a14e4bc14ecd197550
- Architecture formatting correction: a9c20452e80fe76954993c95409d78006bcb98ad
- Stale claim recovery implementation: c2421954ead72b70521f56af4bd0d9972cb49a9c
- Supervisor checkout and syntax-check correction: 33138ac9bb82665b11dd8180999ea022874a5d12
- Dispatch feature gate: 99e2d7327bc4a1ba996eab4e611e96fbe6f8494f
- Repository variable wiring: 10c0867a9f405368053812066b4f09940e8b9f34
- README activation clarification: e5ff56e4722949df915eb6572e5717a3aa28de38

## Status at report creation
- Supervisor code: IMPLEMENTED SCAFFOLD.
- Worker: IMPLEMENTED for DSH probe only.
- Schedule and event wiring: IMPLEMENTED, NOT VERIFIED.
- Dispatch: BLOCKED by branch governance and unset owner-controlled variable.
- Workflow YAML acceptance by GitHub: NOT VERIFIED.
- Actions run: NOT RUN at last baseline check; must re-check current run list.
- DSH runtime probe: NOT RUN.
- Runner resource probe: NOT RUN.
- General task checkpoint/resume: NOT IMPLEMENTED.
- Cross-repository dispatch: NOT IMPLEMENTED.
- Local Mac mini inventory: NOT RUN.
- No agent profile qualified or accepted.

## Next engineering pass
1. Re-read all five implementation files and verify blob SHAs.
2. Re-check latest HEAD, branch protection, Actions runs and exact-head statuses.
3. Validate workflow YAML and JavaScript syntax. GitHub's own run is required to confirm workflow acceptance.
4. Keep dispatch disabled until branch governance is enabled.
5. After owner enables branch protection and the repository variable, test the idle supervisor first; then create one approved DSH probe issue and inspect the full lifecycle.
6. Only after that design the durable checkpoint/resume contract and multi-repository GitHub App dispatch.

## Upstream and platform references
- DeepSeek Harness: https://github.com/deepseek-ai/deepseek-harness
- DeepSeek Harness safety notice: https://github.com/deepseek-ai/deepseek-harness/blob/master/SAFETY.md
- GitHub hosted runner limits: https://docs.github.com/en/actions/reference/limits
- GitHub scheduled events: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule
- GitHub GITHUB_TOKEN workflow dispatch exception: https://docs.github.com/en/actions/concepts/security/github_token
- GitHub workflow concurrency: https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency
- GitHub self-hosted runner autoscaling and ephemeral guidance: https://docs.github.com/en/actions/reference/runners/self-hosted-runners


## Final post-commit verification
- Final HEAD at verification: `d08ea731e88477dc748e6369f9573879c7c21e28`.
- Branch: `Основной`; GitHub reports `protected=false`.
- Actions workflow runs: `total_count=0`.
- Combined commit statuses for final HEAD: empty; CI is NOT VERIFIED, not PASS.
- Re-read implementation blobs:
  - `scripts/pool-supervisor.mjs`: `52bf03ca889edd92fd10c71ae96a2e35e106d43f`
  - `.github/workflows/pool-supervisor.yml`: `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`
  - `.github/workflows/pool-worker.yml`: `3ddb0038a8336214acc74717804562173c8eaa25`
  - `.github/ISSUE_TEMPLATE/pool-task.yml`: `0406d241a92a675756eeb073a44060ee84f69c32`
  - `docs/architecture/GITHUB-POOL-SUPERVISOR-AND-RECOVERY.md`: `3ac28f2f105a20a4eed5d93168bbe84d2d5273b8`
  - `README.md`: `fea44c2485b604432ab9ee20293c3e1f7ee8bdec`
  - This report before this append: `704ea779f4310ce4e9f4d2c7cb0fb6324e39cec7`
- Workflow YAML acceptance and Node execution remain NOT VERIFIED because no Actions run exists.
- `POOL_DISPATCH_ENABLED` is not configured; the supervisor therefore exits in heartbeat-only mode and does not create labels, claim tasks or dispatch workers.
- No task issue was created or dispatched. No provider keys or other secrets were accessed.
