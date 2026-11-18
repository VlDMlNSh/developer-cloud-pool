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


## Artifact inspection supplement — run 44285275416
The run has now completed as FAILED at the synthetic FCC-to-Claude CLI handoff step. Its artifact was downloaded and inspected locally:
- Artifact ID `14418937574`; ZIP size 31,263 bytes; GitHub digest and independently calculated SHA-256 both `ccd3afbade1d3bc6f61f3a3c79bcaa0b02617c66c368a98398e3d286336a5446`.
- All 33 entries listed in `SHA256SUMS.txt` were present and their SHA-256 values verified against the archive contents.
- `fcc-runtime-state.txt` proves the primary FCC server returned HTTP 200 at `127.0.0.1:18765`, exited cleanly with status 0, and left no listener. Provider calls and completion endpoints were false.
- `fcc-bridge-server.log` records application startup, HTTP 200 on `/health`, graceful shutdown and “Finished server process”. `fcc-bridge-stderr.txt` is empty.
- The artifact does NOT contain `fcc-bridge-shutdown-diagnostics.txt` or `fcc-bridge-result.txt`, despite the workflow writing the diagnostic file before assertions. Therefore actual `signal_status`, `shutdown_status`, post-wait process liveness and listener state are NOT independently recoverable from this artifact.
- The step failed with exit code 1, but logs only exposed the shell trace and final generic process exit. It did not expose which strict assertion fired. Do not guess that the process was killed by SIGINT or that a zombie/PID reuse occurred.

## Correct next action
Change only the evidence publication path in a follow-up commit: include both bridge result/diagnostic files in the bounded artifact allowlist and print the exact diagnostic values as structured GitHub step outputs (without printing synthetic token values). Keep all current acceptance assertions unchanged. Re-run exact-head qualification and use the new artifact to determine which predicate failed. No production/provider behavior should be added.

## Follow-up — preserve bridge evidence before fail-closed checks — 2026-11-18

### Artifact reinspection
- Re-downloaded artifact `14418937574` from Runner Qualification run `44285275416`; ZIP SHA-256 independently matched GitHub digest `ccd3afbade1d3bc6f61f3a3c79bcaa0b02617c66c368a98398e3d286336a5446`.
- Archive contains 34 entries, including `SHA256SUMS.txt`; the two expected bridge result/diagnostic files are absent. The existing upload step already targets the complete qualification directory, so the evidence gap is not caused by a narrow upload path.
- Job step sequence confirms steps 1–12 passed, synthetic bridge step 13 failed, ECC installation was skipped, and the always-run provenance/artifact steps completed. Bridge log records HTTP 200 and graceful server shutdown. The exact failed predicate remains NOT VERIFIED because the diagnostics file was never present in the artifact.
- The source trace shows the diagnostic file was created only after the SIGINT/wait/listener-probe sequence. A failure before that write can therefore erase the very evidence needed to explain the failure. This is the bounded defect addressed below; it is not proof of a specific failing predicate.

### Implementation
- PR #116 follow-up commit: `59514f6d1119ca113745f5da861a1195c66da2e5`.
- Workflow blob: `a218c738e640c43f003cd4f24a348ab4b4aa996e`.
- The bridge step now pre-creates bounded result and shutdown-diagnostic files before starting the runtime, records SIGINT/wait/listener-probe statuses with errexit disabled, and emits only non-secret boolean/numeric step outputs through `GITHUB_OUTPUT`.
- Listener-probe failure is now recorded separately and remains fail-closed. Existing shutdown, process-liveness and listener-absence acceptance assertions are preserved; no provider call, live Claude session or production dispatch was introduced.
- Source read-back confirmed the new step ID, pre-created evidence files, outputs and strict assertions.

### Exact-head CI
- Runner Qualification run [44286461561](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44286461561) started on exact HEAD `59514f6d1119ca113745f5da861a1195c66da2e5`; status was IN_PROGRESS at report update.
- Pool Contract Validation run [44286461574](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44286461574) started on the same exact HEAD; status was IN_PROGRESS at report update.
- Both outcomes remain NOT VERIFIED until completion. Do not infer success from workflow dispatch or initial job creation.

### Boundaries
- No secrets read, provider calls, real Claude task, Gemini dispatch, production dispatch, deployment or merge.
- Gemini controller remains absent from default branch (404); Gemini NOT RUN.
- `POOL_DISPATCH_ENABLED=false`; Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

### CI poll update — 2026-11-18
- Pool Contract Validation [44286461574](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44286461574): COMPLETED / SUCCESS on exact HEAD `59514f6d1119ca113745f5da861a1195c66da2e5`.
- Runner Qualification [44286461561](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44286461561): still IN_PROGRESS on the same exact HEAD at the latest poll; job `134740287165` RUNNING. No artifact published yet; runtime outcome NOT VERIFIED.
