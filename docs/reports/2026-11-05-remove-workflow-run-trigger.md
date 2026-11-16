# 2026-11-05 — remove privileged workflow_run from Pool Supervisor

## Immutable scope
- Repository: `VlDMlNSh/developer-cloud-pool`.
- Canonical base: `Основной` at `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Working branch: `security/remove-supervisor-workflow-run-2026-11-05`.
- PR: [#15](https://github.com/VlDMlNSh/developer-cloud-pool/pull/15), OPEN / DRAFT / NOT MERGED.
- Code change commit: `17fda11001288cc0123b667251c712af13d55f9a`.
- Supervisor workflow blob: `d05fc4037f5663a64bb82d9ff67afe95e20c73da`.
- Supervisor script blob: `66bac1839a0cdbd8d12655852b7c7476f8dcc4d7`.
- Architecture contract blob: `cad3ea2c99e4f5f62bd82b6f4247dc5ca655b5ae`.

## Finding and change
- zizmor run [42037723023](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42037723023), job `127280177651`, flagged `pool-supervisor.yml:9` for the privileged `workflow_run` trigger.
- Removed the `workflow_run` trigger and its event metadata from Supervisor.
- Removed event-specific `recoverFailedWorkflowRun`; scheduled `recoverStaleClaims` already queries Worker workflow runs and handles completed runs.
- Kept five-minute scheduled reconciliation, issue-label wakeups, and manual supervisor invocation.
- This trades immediate Worker-completion wakeup for periodic reconciliation and removes the privileged event trust boundary.

## Verification
- All five PR files were re-read from GitHub; source blob SHAs above match the post-write content.
- Exact code-head CI: [run 42037929298](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42037929298), job `127280825826`, COMPLETED / SUCCESS.
- The successful job passed the dispatch-disabled assertion, YAML parsing and `scripts/validate-pool-contract.mjs`.
- The tested code head was `17fda11001288cc0123b667251c712af13d55f9a`; subsequent commits only added the report/checkpoint and updated PR metadata. Workflow and script blobs are unchanged.
- Runtime Supervisor/Worker tests: NOT RUN.
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
