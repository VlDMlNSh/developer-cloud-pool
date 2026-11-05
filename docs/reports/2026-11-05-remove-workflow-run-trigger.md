# 2026-11-05 — remove privileged workflow_run from Pool Supervisor

## Immutable scope
- Repository: `VlDMlNSh/developer-cloud-pool`.
- Canonical base: `Основной` at `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Working branch: `security/remove-supervisor-workflow-run-2026-11-05`.
- PR: [#15](https://github.com/VlDMlNSh/developer-cloud-pool/pull/15), OPEN / DRAFT / NOT MERGED.
- Supervisor workflow blob: `d05fc4037f5663a64bb82d9ff67afe95e20c73da`.
- Supervisor script blob: `66bac1839a0cdbd8d12655852b7c7476f8dcc4d7`.
- Architecture contract blob: `cad3ea2c99e4f5f62bd82b6f4247dc5ca655b5ae`.

## Finding and change
- zizmor exact-head run [42037723023](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42037723023), job `127280177651`, flagged `pool-supervisor.yml:9` for the privileged `workflow_run` trigger.
- Removed the `workflow_run` trigger and its event metadata from Supervisor.
- Removed event-specific `recoverFailedWorkflowRun`; scheduled `recoverStaleClaims` already queries Worker workflow runs and handles completed runs.
- Kept the five-minute scheduled reconciliation, issue-label wakeups, and manual supervisor invocation.
- This intentionally trades immediate Worker-completion wakeup for periodic reconciliation, removing a privileged event trust boundary.

## Verification
- All three changed files were re-read from GitHub; blob SHAs above match the post-write content.
- PR #15 metadata: OPEN / DRAFT / MERGEABLE; exact-head workflow run query returned empty at last read.
- Exact-head CI: NOT VERIFIED.
- Local or hosted runtime tests: NOT RUN.
- Worker/DSH/Resource Probe/browser/model execution: NOT RUN.
- Independent security review: NOT RUN.
- No secrets, repository variables, Environment settings or dispatch controls were changed.

## Remaining security findings
The same zizmor run identified two package provenance warnings that remain unresolved:
- `pool-worker.yml`: ad-hoc installation of `@deepseek-ai/dsh@0.2.1-rc.5` without a committed lockfile.
- `dsh-runtime-evaluation.yml`: same class of installation warning.
Do not suppress these warnings. Next task: produce deterministic lockfiles for both DSH install paths and switch to `npm ci`, with exact dependency graph and integrity hashes reviewed.

## Acceptance boundary
This PR is a security remediation proposal, not qualification or production authorization. Keep `POOL_DISPATCH_ENABLED` fail-closed. The direct Worker `workflow_dispatch` caller-boundary issue remains separate and unresolved.
