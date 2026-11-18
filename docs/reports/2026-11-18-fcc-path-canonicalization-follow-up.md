# FCC PATH canonicalization follow-up — 2026-11-18

## Scope
One bounded pass: reconcile the live PR #116 head, explain the next FCC loopback failure, and verify the exact-head CI state without weakening the execution policy.

## Immutable refs and repository state
- Default branch `Основной`: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845` (unchanged in this pass).
- PR #116: OPEN / DRAFT / UNMERGED; branch `feat/claude-code-fcc-runner-qualification-2026-11-17`; current observed head `a07cc438237e5c9d5f276e2f42ea9774ee333a56`; base `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- PR #126 legacy dispatch retirement: OPEN / DRAFT / UNMERGED; head `f69f286b5b5a3de8dfdd80ed581859851ce271e5`.
- PR #120 architecture consolidation: OPEN / DRAFT / UNMERGED.
- Issue #118 remains OPEN; persistent workspace host #3, Cloudflare Access/Tunnel and backup/restore evidence remain blocked/not verified.

## Failure analysis
- Runner Qualification run [44283688950](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44283688950) completed FAILURE. Job [134730704545](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44283688950) reached FCC loopback startup; logs state: `Cloud Pool child environment rejected: PATH must not contain duplicate resolved directories`.
- At that time the synthetic FCC bridge exported `PATH=/usr/bin:/bin`; on the Ubuntu runner these resolve to the same canonical directory. This is correctly rejected by the existing policy.
- Commit `4f2b9581b75dab5424a4dbda8f78b6430007783e` changed the remaining synthetic-bridge PATH assignment from `/usr/bin:/bin` to `/usr/bin`. Workflow blob read-back: `7ff0846e7957dba27210a04e29233f3af06be70f`; both FCC startup and bridge now export `PATH=/usr/bin`.
- This is a harness normalization fix only. No allowlist or ownership rule was relaxed.
- Runner run [44284080903](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44284080903) was superseded/cancelled after the next branch update; it is not a qualification result.
- Current PR head `a07cc438237e5c9d5f276e2f42ea9774ee333a56` has Pool Contract Validation [44284216029](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44284216029) COMPLETED / SUCCESS.
- Current-head Runner Qualification [44284216030](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44284216030), job `134732714813`, was IN_PROGRESS at this report's cutoff. The job had passed checkout, child-environment tests, runner baseline and sandbox capability probe; installation and FCC steps had not yet reported completion. Live job-log retrieval returned 404 while the job was running. FCC readiness, exact listener, shutdown, synthetic bridge and artifact remain NOT VERIFIED.

## Security and execution boundaries
- No secret values read; no provider credentials or provider APIs used; no real Claude session/task; no Gemini dispatch; no production dispatch; no merge or deployment.
- Keep `POOL_DISPATCH_ENABLED=false`.
- Docker `--network none` remains only a primitive proof; it is not actual CODE worker execution or provider egress qualification.
- Hosted Claude-use entitlement, FCC AGPL network-exposure assessment, free provider account/quota and provider-specific egress allowlisting remain NOT VERIFIED.

## Next bounded action
Re-read run 44284216030 against immutable target `a07cc438237e5c9d5f276e2f42ea9774ee333a56`. If it completes, inspect every step, FCC loopback HTTP 200/listener/shutdown, synthetic bridge and artifact checksums. If it fails, use the exact job log to isolate the next failure. Do not start provider calls or production dispatch.

## Status
Runner qualification: RUNNING / NOT VERIFIED at cutoff. Contract validation: VERIFIED for the exact current PR head. Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.


## Subsequent exact-head result and diagnostic change — 2026-11-18

- Current PR #116 head advanced to `52339ee70e00b9905710d411404b55778f68c70a`; base remains `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`; OPEN/DRAFT/UNMERGED.
- Exact-head run [44284216030](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44284216030) on prior target `a07cc438237e5c9d5f276e2f42ea9774ee333a56): COMPLETED/FAILURE. Runner qualification stages through FCC loopback lifecycle passed, including startup/readiness/shutdown. Signed Claude APT/release manifest/binary checks, Docker no-egress primitive and FCC 15/15 synthetic profile guard passed.
- Synthetic FCC-to-mock-CLI step failed after the mock had returned expected exit code 37, written marker and arguments, and passed argument comparison plus synthetic-string log checks. Failure occurred in bridge server shutdown validation. The process-liveness check did not emit its explicit failure message; available log therefore narrows the failure to shutdown exit status or listener-absence assertion, but does not yet distinguish them.
- Artifact [14418332371](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44284216030/artifacts/14418332371), 31,250 bytes, GitHub digest `sha256:951c8017003f59e4d0125ae17c0c79cb9fed1498cc4e5e01edbc6349698194e0`. Artifact contents have not been independently inspected; digest is metadata from GitHub.
- Diagnostic-only workflow update commit `52339ee70e00b9905710d411404b55778f68c70a`; workflow blob `5b18bdbe59ca52022a74b072fdd5674e0b11b497`. It records bridge shutdown exit status, process liveness and listener state, and prints server/stderr logs on failure. It does not weaken environment policy or relax the clean-shutdown requirement. Source read-back confirmed the change.
- New exact-head Runner Qualification [44284614737](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44284614737) and Pool Contract Validation [44284614733](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44284614733) were IN_PROGRESS at this report update; results NOT VERIFIED.
- Next: inspect run 44284614737 diagnostics, determine whether nonzero SIGINT exit or lingering listener caused failure, then apply only evidence-based correction. No provider calls or real Claude task.


## Signal-delivery diagnostic refinement — 2026-11-18

- Diagnostic workflow commit `52339ee70e00b9905710d411404b55778f68c70a` exact-head run [44284614737](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44284614737) completed FAILURE. FCC loopback lifecycle again passed; failure remained in synthetic bridge shutdown.
- The new log shows the step stopped after issuing `kill -INT "$server_pid"` and before any shutdown diagnostics were emitted. This is consistent with Bash `set -e` terminating the step if the signal command returns nonzero, because the previous script enabled `set +e` only after the signal. The exact signal result was not captured, so this remains a strong hypothesis, not a verified root cause.
- Artifact [14419215372](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44284614737/artifacts/14419215372), 31,127 bytes, GitHub digest `sha256:3406b3d043829991a406455b1b94cd4c7da2533d1231d92ef320f934d33b9c5d`; archive contents not independently inspected.
- Follow-up diagnostic fix commit `570d78b7d3f7972b7458de9e69f6117ae642896a`; workflow blob `cde20dddcb9687d0797df7e099693a713ce71c31`. It moves `set +e` before SIGINT, records both signal and wait exit statuses, then evaluates each explicitly and prints server diagnostics on failure. This preserves fail-closed shutdown qualification while preventing an unrecorded errexit exit.
- Exact-head Pool Contract Validation [44284859281](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44284859281): COMPLETED/SUCCESS. Exact-head Runner Qualification [44284859244](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44284859244): IN_PROGRESS at cutoff; NOT VERIFIED.
- Current PR #116 head at this update: `570d78b7d3f7972b7458de9e69f6117ae642896a`; OPEN/DRAFT/UNMERGED; base `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Next: inspect run 44284859244 and captured signal/wait/listener diagnostics. Do not treat FCC qualification as passed until the entire runner job and artifact are verified.


## Explicit diagnostic stdout and latest exact-head run — 2026-11-18

- Exact-head Runner Qualification [44284859244](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44284859244) completed FAILURE on `570d78b7d3f7972b7458de9e69f6117ae642896a`. FCC loopback passed; synthetic bridge still failed. The artifact [14418074350](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44284859244/artifacts/14418074350) is 31,271 bytes with GitHub digest `sha256:3c94c889560b7a3c8e40a1d88d10fbdf6a5ad94977331ef9bc2c5ad0865a910f`; artifact contents not independently inspected.
- Exact job log did not show runtime values for SIGINT status, wait status or listener state, even though the diagnostic code wrote them to the artifact. No precise shutdown root cause is claimed.
- Commit `c4839850a5b015a56a8ca2f591c11e0aeee7c950`; workflow blob `34a3f73909d2b637112b77cc5fb0e54580d84417` adds an explicit `cat` of the shutdown diagnostics file to stdout before fail-closed assertions. Source read-back confirmed the change.
- Current PR #116 head `c4839850a5b015a56a8ca2f591c11e0aeee7c950`; OPEN/DRAFT/UNMERGED; base `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Exact-head Runner Qualification [44285187440](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44285187440) and Pool Contract Validation [44285187389](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44285187389) were IN_PROGRESS at cutoff; NOT VERIFIED.
- Next: inspect the explicit diagnostic output and artifact from run 44285187440. Keep the clean shutdown criteria and all security boundaries unchanged.
