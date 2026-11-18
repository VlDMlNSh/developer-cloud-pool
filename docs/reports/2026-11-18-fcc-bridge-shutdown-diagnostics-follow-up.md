# FCC bridge shutdown diagnostics follow-up — 2026-11-18

## Scope
One bounded pass: restore the current PR #116 state, inspect the latest exact-head qualification and prior bridge-shutdown failure, and record what is and is not proven. No runtime policy or shutdown acceptance condition was weakened.

## Immutable target and current refs
- Repository: `VlDMlNSh/developer-cloud-pool`.
- PR #116 branch: `feat/claude-code-fcc-runner-qualification-2026-11-17`.
- PR #116 current head at inspection: `3cdfd2801f0a78c22b698dc82c0a668b9c9662c1`.
- Base: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- PR #116: OPEN / DRAFT / UNMERGED.
- PR #126: OPEN / DRAFT / UNMERGED at `f69f286b5b5a3de8dfdd80ed581859851ce271e5`.
- PR #120: OPEN / DRAFT / UNMERGED at `e93fb34a1f3430ca2db32fbf2e631903aac9570f`.

## Evidence inspected
- Prior Runner Qualification run `44284859244` failed after the FCC loopback readiness/shutdown stage had passed; the synthetic FCC-to-mock-Claude bridge failed at strict shutdown verification. Artifact `14418074350` was reported as 31,271 bytes with digest `sha256:3c94c889560b7a3c8e40a1d88d10fbdf6a5ad94977331ef9bc2c5ad0865a910f`, but its contents were not independently inspected in this pass.
- Diagnostic follow-up commit `c4839850a5b015a56a8ca2f591c11e0aeee7c950` made the shutdown diagnostic file print to stdout before fail-closed checks. The next attempted run `44285187440` was superseded/cancelled before installation completed; it is NOT a runtime result.
- Current PR #116 head `3cdfd2801f0a78c22b698dc82c0a668b9c9662c1` changes the bridge test to enter non-errexit mode before sending SIGINT and separately capture `signal_status` and `shutdown_status`. It retains the existing fail-closed checks.
- Exact-head Pool Contract Validation run `44285275314`: COMPLETED / SUCCESS.
- Exact-head Runner Qualification run `44285275416`: IN_PROGRESS at the latest readback. Job `134736343006` had passed checkout, child environment allowlist tests, runner baseline capture, and sandbox capability probe; remaining install/runtime steps had not yet completed. No success/failure conclusion is claimed.
- A subsequent attempt to retrieve live logs for the in-progress job returned NOT_FOUND (GitHub log blob not yet available); this is not evidence of a pass or fail.
- The approved Gemini controller path `.github/workflows/gemini-batch-dispatch-controller.yml` returned 404 on default branch `Основной`; Gemini agents NOT RUN. No alternative dispatch was attempted.

## Security and scope boundaries
- No secrets read or printed; no provider API call or real Claude task.
- No Gemini dispatch, paid fallback, production dispatch, merge, or deployment.
- Keep `POOL_DISPATCH_ENABLED=false`.
- Issue #118 remains OPEN: persistent workspace host #3, Cloudflare Access/Tunnel and backup/restore are unverified.
- Contour A remains BLOCKED / NOT ACCEPTED; Contour B remains DEFERRED.

## Reuse research
GitHub repository discovery was attempted for gVisor, Kata Containers, Firecracker and Cilium/network-policy projects. Search results surfaced candidate repositories but did not provide sufficient verified license/version/compatibility evidence for adoption in this pass. No new sandbox or egress implementation was introduced. Any future egress boundary design must compare mature runtimes and network-policy components, including licensing and threat-model fit, before custom implementation.

## Next bounded action
Re-read exact-head run `44285275416` and its job/artifact after completion. Verify bridge signal delivery, child exit status, process liveness and listener absence independently. If failure persists, isolate the measured process/signal semantics; do not relax shutdown checks or enable provider access. Only after the entire no-provider qualification passes should actual CODE-worker isolation and provider-specific egress qualification proceed.
