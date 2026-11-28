# Pass 114 — CLI-Anything methodology adoption and poolctl MVP

Date: 2026-11-28

## Frozen target and scope
- Canonical default SHA: `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- Created branch `feat/pass114-agent-native-poolctl-2026-11-28` from that exact default SHA.
- Scope: adapt CLI-Anything's agent-native CLI methodology to one read-only Pool Contract command; add subprocess tests and wire them into existing Pool Contract CI.
- Exclusions: no D1/API/controller integration, no hosted D1, no credentials, no provider calls, no dispatch, no execution, no plugin installation, no deployment, no merge.

## Reuse First and upstream review
- Reviewed HKUDS/CLI-Anything README blob `8a78b5420911eff5e7cc219bf1ecb2a12b562874`, HARNESS blob `4fd881137c280cf33fcbf9342b91629524906136`, SECURITY blob `5135f80daa19d48325b9c6f0f27204930664f40b`, LICENSE blob `ee86799f79a1dd41bd82923f4dbf40cfb336684d`.
- Upstream license verified as Apache-2.0.
- Adapted command taxonomy, machine-readable output, bounded subprocess execution, test-first workflow and agent-readable help.
- Rejected dynamic CLI-Hub installation, unreviewed third-party skills, Click/Python scaffold and stateful REPL for the control plane. Existing Node ESM and Node test runner reused; no dependency added.
- Claude Code plugin was not installed or invoked; authorized server-3 host/session was not established. Status NOT RUN.

## Implementation
- Added `scripts/poolctl.mjs`: read-only command `contract validate [--json]`; wraps fixed `scripts/validate-pool-contract.mjs` using `process.execPath`, fixed argv, `shell:false`, 10-second timeout, 64 KiB output cap and minimal child environment.
- JSON result schema version 1 includes command, PASS/FAIL, checks/failures, `dispatch:false`, `executionAuthorized:false`.
- Unsupported commands/options fail closed. No arbitrary path, shell expression, credential, API, D1 or dispatch interface.
- Added `scripts/poolctl.test.mjs`: subprocess tests for help, JSON success, unsupported command, unknown option and environment non-disclosure.
- Updated `.github/workflows/pool-contract-validation.yml` to run `node --test scripts/poolctl.test.mjs` alongside the existing contract validator.
- Added architecture/adoption document `docs/architecture/CLI-ANYTHING-ADOPTION-AND-POOL-CLI.md`.

## Security and qualification boundary
- The CLI is a local presentation/diagnostic adapter, not a scheduler, admission authority, executor, D1 client or credential broker.
- It does not restore retired label-driven dispatch or alter the Supervisor.
- No third-party code was installed or executed.
- No secrets were read; no hosted D1 writes, API mutation, provider calls, dispatch, execution, deployment or merge occurred.
- Dispatch=false and executionAuthorized=false are preserved in all CLI JSON outputs.
- Exact-head CI and independent review are pending until the PR is opened and checks complete.

## CI evidence and governance
- Draft PR #183: OPEN / DRAFT / UNMERGED; current head was advanced by documentation-only commits after validation; base `Основной` @ `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- Validated source/workflow head: `2b9d9d51712a1e45b5c77233d4a45952a0fe4e51`. Later commits update only report/checkpoint/Context Window; no CLI source, tests or workflow changes occurred after the successful run.
- Pool Contract run [46164275649](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/46164275649): SUCCESS; job `141038230498`; run metadata binds validated source/workflow head `2b9d9d...` and base `565404f...`; merge-result checkout `cda3a56...`.
- Job log: dispatch gate disabled/unset; all 5 workflow YAML files parse; existing `POOL_CONTRACT_VALIDATION=PASS`; CLI subprocess suite 5/5 passed, 0 failed.
- PR #183 formal reviews: 0; inline review comments: 0. Active ruleset #26550182 is active on `refs/heads/Основной`, requires PR and thread resolution, has 0 required approvals and no bypass actors. Independent security review remains NOT RUN.
- CI emits a non-failing warning: pinned `actions/checkout` commit `11bd719...` targets Node 20 while runner forces Node 24. Track as separate action-runtime maintenance; no action version changed in this pass.

## Metrics
- New runtime dependencies: 0.
- New hosted services: 0.
- New authority/mutation surfaces: 0.
- Automated CLI tests authored: 5.
- Active engineering time: NOT MEASURED.
- CI: SUCCESS on PR head `2b9d9d51712a1e45b5c77233d4a45952a0fe4e51` / merge-result `cda3a56...`; 5/5 CLI tests pass.

## Next
1. Keep PR #183 Draft/unmerged until independent security review.
2. Re-read final diff and exact-head/merge-result evidence before any merge decision.
3. Track the Node 20→24 action-runtime warning as separate maintenance.
4. Keep CLI read-only; expand only after Controller/API/attested-D1 composition is verified.

Contour A remains BLOCKED / NOT ACCEPTED. Contour B remains DEFERRED.

