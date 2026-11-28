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

## Metrics
- New runtime dependencies: 0.
- New hosted services: 0.
- New authority/mutation surfaces: 0.
- Automated CLI tests authored: 5.
- Active engineering time: NOT MEASURED.
- CI status: PENDING at report creation.

## Next
1. Open a Draft PR against canonical `Основной`.
2. Verify exact-head Pool Contract CI and inspect logs/test counts.
3. Correct any test/contract failures and re-read final diff.
4. Obtain independent security review before merge.
5. Keep CLI read-only; only expand after Controller/API/attested-D1 composition is verified.

Contour A remains BLOCKED / NOT ACCEPTED. Contour B remains DEFERRED.

