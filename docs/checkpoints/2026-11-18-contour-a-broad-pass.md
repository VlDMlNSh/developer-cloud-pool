# CURRENT UPDATE — 2026-11-18, Claude Code provenance and Docker no-egress hardening

## Latest P1 evidence
- PR #116 head: `76fa4859503c377ab8122b61223fe809133a3057`; OPEN/DRAFT/UNMERGED.
- Runner Qualification [44277244612](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44277244612): COMPLETED/SUCCESS.
- Pool Contract Validation [44277244629](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44277244629): COMPLETED/SUCCESS.
- Artifact [14415785535](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44277244612/artifacts/14415785535), SHA-256 `afd97c64a8ac02b9719565e3a5a57443916d2c1e15cd1286c49c3abdb42c0d02`; downloaded ZIP digest matched GitHub, all 38 internal SHA256SUMS entries matched.
- Claude Code installed via Anthropic signed stable APT repo: package `2.1.311-1`, CLI `2.1.311`; signing-key fingerprint verified; detached release-manifest signature verified; Linux x64 binary SHA-256 matched signed manifest (`86dc1fcc69498159eaf15f446613e847010f9036bfbbdffd4c49350be8489ada`).
- Docker `--network none` proof PASS using immutable per-run Ubuntu image digest: outbound TCP blocked, no default route, read-only rootfs, dropped capabilities. This proves the no-egress container primitive only, not the real CODE worker.
- Existing PATH/HOME/XDG tests passed; FCC profile guard 15/15 PASS; FCC loopback health HTTP 200 and clean shutdown; synthetic FCC-to-mock-CLI handoff PASS with no provider call.
- User secrets read: none. Provider calls: none. Real Claude session/task: none.

## P1 remaining blockers
- Provider-specific allowlisted egress proxy/gateway NOT IMPLEMENTED.
- GitHub-hosted runner host itself has public internet egress; not isolated.
- Actual CODE executor has not run inside the Docker sandbox.
- Claude Code hosted-use entitlement/account authority NOT VERIFIED.
- FCC AGPL-3.0-only legal review for network-exposed service NOT VERIFIED.
- No provider route/account/free quota/live task/persistent worker qualification.

## New detailed report
[Claude Code provenance and Docker no-egress hardening report](../reports/2026-11-18-claude-code-provenance-docker-egress-hardening.md)

---

# Contour A checkpoint — 2026-11-18 broad pass

## Owner sequencing decision
Independent/external reviews are deferred until the pool is operational and can execute its own bounded review workflow. Continue exact-head CI, deterministic tests, source inspection and evidence checks; do not mislabel these as independent review or acceptance.

## Immutable baseline
- Default branch: `Основной`
- Default HEAD: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`
- Ruleset: `26550182` active; PR required; zero required approvals; review-thread resolution required; no bypass actors.

## Critical finding
Scheduled Supervisor run [44272871545](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44272871545) was a heartbeat-only SUCCESS with `POOL_DISPATCH_ENABLED=false`; it did not execute a task. Default-branch code still had a dormant label-driven DSH dispatch path that could mutate Issues and dispatch the legacy DSH Worker if the variable were enabled. The old Worker was also manually dispatchable and used an issue label rather than the D1 admission receipt.

## Work executed
- Created [PR #126](https://github.com/VlDMlNSh/developer-cloud-pool/pull/126), branch `fix/retire-legacy-label-dispatch-2026-11-18`, base SHA `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- PR final head: `f69f286b5b5a3de8dfdd80ed581859851ce271e5`.
- Supervisor is reduced to scheduled heartbeat; if the old dispatch variable is `true`, it fails closed. Removed Issues/Actions write permissions, GitHub token injection and old issue/workflow-run/manual triggers.
- Legacy DSH Worker now only emits an explicit retirement error; no task inputs, checkout, external action, token, runtime installation or execution.
- Pool Contract Validation now asserts these retirement invariants.
- Exact-head Pool Contract Validation [44275194245](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44275194245): COMPLETED / SUCCESS on final PR head `f69f286b5b5a3de8dfdd80ed581859851ce271e5`; YAML syntax, pinned-action checks and security contract validation passed.
- PR #126 remains OPEN / DRAFT / UNMERGED. No merge, production dispatch, provider call, secret read, paid fallback, Gemini dispatch, deployment or Contour B work.

## Existing implementation evidence and gaps
- PR #116 current head `754f42b0b7fa84c73e90cececc6f3d8a65877fab`: no-secret Claude Code/ECC/FCC runner installation and synthetic handoff passed Runner Qualification [44273710771](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44273710771) and Pool Contract Validation [44273710870](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44273710870). No real provider route/account/quota qualification.
- PR #114 D1 atomic admission local Workers-runtime proof, head `ab9461eb84b14fe230918391d5212f19ca25592c`; hosted D1 and live controller NOT VERIFIED.
- PR #125 GitHub Actions context composition proof, head `69398d497c8e9be3e9fe7241e4dc6d3bc2e4c973`; local CI SUCCESS. It still allowlists legacy `dsh-headless-probe`; its expected `cloud-pool-next-controller.yml` is absent from default branch. Not a deployed controller.
- PR #112 validates owner event envelope only; no durable admission.
- PR #120 canonical architecture consolidation is OPEN/DRAFT/UNMERGED.
- Issue #118 persistent Engineering Workspace remains blocked by no active authorized host #3, no verified Access/Tunnel and no backup/restore proof.

## Next dependency-ordered steps
1. P1: harden first CODE executor runtime (PATH ownership, HOME/XDG credential surfaces, installer/binary integrity provenance, actual egress enforcement); resolve hosted-use and license boundaries.
2. P2: qualify one free FCC route with account identity, quota domain, reset/rate-limit semantics and free eligibility. No cross-account fallback or paid fallback.
3. P3: reconcile PRs #112/#114/#125, remove legacy DSH profile from admission and use only the qualified CODE profile; add the real default-branch `issue_comment` controller; provision hosted D1 only after local proof and free-tier/data-retention checks.
4. P4: implement durable claim/lease/fencing/attempt/outbox/finalization/recovery and exact worker identity.
5. P5: authenticated read-only Jarvis Web using mature components; static hosting is not the API/control plane.
6. P6: resolve persistent workspace, Zero Trust, filesystem, worktree isolation and backup/restore. Complete repeated operational qualification before Contour A acceptance.

## Canonical references
- [Context Window](../context/GITHUB-CONTEXT-WINDOW.md)
- [Broad Contour A plan and legacy dispatch retirement report](../reports/2026-11-18-contour-a-broad-plan-and-legacy-dispatch-retirement.md)
- [PR #126](https://github.com/VlDMlNSh/developer-cloud-pool/pull/126)
- [Owner Architecture Freeze](../architecture/CLOUD-POOL-OWNER-ARCHITECTURE-FREEZE-2026-11-17.md)
- [Canonical architecture PR #120](https://github.com/VlDMlNSh/developer-cloud-pool/pull/120)


---

## Follow-up — root-owned executable PATH hardening — 2026-11-18

- Report: [runner PATH ownership hardening](../reports/2026-11-18-runner-path-root-owned-hardening.md).
- PR #116 branch head advanced to `6088a5d1e52191004c3228ed4cf6f3b72dabd116`; default branch remains unchanged at `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Child-process PATH policy now requires root-owned canonical directories; private runner-owned directories are rejected to prevent same-UID executable replacement after validation.
- Focused child-environment test step passed on exact head. Pool Contract Validation [44278168854](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44278168854) COMPLETED/SUCCESS.
- Runner Qualification [44278168889](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44278168889) was RUNNING when this checkpoint was written; final result and artifact digest remain NOT VERIFIED.
- PR #116 OPEN/DRAFT/UNMERGED. No secret reads, provider calls, real Claude session, dispatch, merge or deployment.
- Remaining P1 gates: actual CODE worker inside sandbox; provider-specific default-deny egress gateway; Claude hosted-use entitlement; free provider account/quota proof; FCC AGPL legal assessment.
- Next step: re-read exact-head run 44278168889, inspect job logs/artifact/digests, then implement the worker-container + egress boundary without enabling provider calls.
- Contour A BLOCKED / NOT ACCEPTED. Contour B DEFERRED.


---

## Follow-up — runner PATH qualification failure and corrective change — 2026-11-18

- Full Runner Qualification [44278168889](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44278168889), job 134711549798: COMPLETED / FAILURE on exact target `6088a5d1e52191004c3228ed4cf6f3b72dabd116`.
- Root cause: FCC lifecycle step placed runner-owned `$UV_PROJECT_ENVIRONMENT/bin` in PATH. The new root-owned PATH policy correctly rejected this. Focused suites passed (10/10 child environment, 9/9 task HOME, 7/7 release verifier); Claude signature/binary verification, Docker no-egress primitive and FCC 15/15 guard passed. FCC readiness failed before HTTP health; synthetic bridge was skipped.
- Failed-run artifact [14414274574](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44278168889/artifacts/14414274574), SHA-256 `7abf25036bed9a9538c105f21ada775d3b3c6e6bf042158e0de082a49779d7b0`.
- Corrective PR #116 commit: `fa4e42f4c2d23f4eedd36cf574e87cf361810972`; workflow blob `23ca0d9c472486095c2b7b13b27fbb4229190867`. Both FCC steps now use `/usr/bin:/bin`; FCC server and synthetic mock are invoked by absolute path. The security policy was not weakened.
- Read-back confirmed both edits. Commit-associated workflow query returned no run; exact-head requalification is NOT RUN / NOT VERIFIED. PR #116 remains OPEN/DRAFT/UNMERGED.
- Detailed report: [runner PATH qualification failure and fix](../reports/2026-11-18-runner-path-qualification-failure-and-fix.md).
- No secret values read, provider calls, real Claude session, Gemini/production dispatch, merge or deployment. Keep `POOL_DISPATCH_ENABLED=false`.
- Next: obtain exact-head Runner Qualification and Pool Contract Validation for `fa4e42f4c2d23f4eedd36cf574e87cf361810972`; inspect all steps/artifact before starting actual CODE-in-container work.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.


---

## Follow-up — FCC PATH canonicalization and exact-head CI — 2026-11-18

- Report: [FCC PATH canonicalization follow-up](../reports/2026-11-18-fcc-path-canonicalization-follow-up.md).
- PR #116 current observed head: `a07cc438237e5c9d5f276e2f42ea9774ee333a56`; base `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`; OPEN/DRAFT/UNMERGED.
- Runner Qualification [44283688950](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44283688950) failed at FCC startup because `/usr/bin:/bin` resolves to duplicate canonical PATH directories. This is a correctly enforced policy, not a reason to relax validation.
- Commit `4f2b9581b75dab5424a4dbda8f78b6430007783e` normalized the remaining synthetic-bridge PATH to `/usr/bin`; workflow blob `7ff0846e7957dba27210a04e29233f3af06be70f`; both FCC PATH assignments read back as `/usr/bin`.
- Superseded Runner Qualification [44284080903](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44284080903) was cancelled after a subsequent branch update; do not count it as a pass.
- Current-head Pool Contract Validation [44284216029](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44284216029): COMPLETED/SUCCESS.
- Current-head Runner Qualification [44284216030](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44284216030), job `134732714813`: IN_PROGRESS at cutoff. Checkout, child-environment tests, runner baseline and sandbox capability probe passed; later installation/FCC steps not yet verified. Live log endpoint returned 404 while the job was still running.
- No secrets read, provider calls, real Claude session, Gemini or production dispatch, merge or deployment. Keep `POOL_DISPATCH_ENABLED=false`.
- Next: verify run 44284216030 on immutable target `a07cc438237e5c9d5f276e2f42ea9774ee333a56`, including FCC loopback, synthetic bridge and artifact checksums. Contour A BLOCKED/NOT ACCEPTED; Contour B DEFERRED.


## Follow-up — FCC loopback passes; synthetic bridge shutdown diagnostic — 2026-11-18

- Report: [FCC PATH canonicalization follow-up](../reports/2026-11-18-fcc-path-canonicalization-follow-up.md).
- PR #116 exact target `a07cc438237e5c9d5f276e2f42ea9774ee333a56`: Runner Qualification [44284216030](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44284216030) COMPLETED/FAILURE. FCC loopback startup/readiness/clean shutdown passed; synthetic bridge step failed during its shutdown assertions.
- Mock CLI handoff itself passed expected exit 37, marker/argument persistence, argument comparison and synthetic-value log checks. Process-liveness check did not print its explicit failure message; logs narrow the issue to nonzero bridge shutdown status or listener still present, but do not distinguish the two.
- Artifact [14418332371](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44284216030/artifacts/14418332371), 31,250 bytes, GitHub digest `sha256:951c8017003f59e4d0125ae17c0c79cb9fed1498cc4e5e01edbc6349698194e0`; archive contents not independently inspected.
- Diagnostic-only workflow commit `52339ee70e00b9905710d411404b55778f68c70a`; workflow blob `5b18bdbe59ca52022a74b072fdd5674e0b11b497`. It captures shutdown exit status, process liveness and listener state and prints logs on failure; security policy and pass criteria remain unchanged.
- Exact-head Runner Qualification [44284614737](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44284614737) and Pool Contract Validation [44284614733](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44284614733) on `52339ee70e00b9905710d411404b55778f68c70a` were IN_PROGRESS at cutoff; NOT VERIFIED.
- Next: read the new diagnostics, isolate exit status vs listener cleanup, and only then change behavior. No provider calls, secret reads, real Claude task, Gemini/production dispatch, merge or deployment. Contour A BLOCKED/NOT ACCEPTED; Contour B DEFERRED.


## Follow-up — FCC bridge SIGINT diagnostic capture — 2026-11-18

- Report: [FCC PATH canonicalization follow-up](../reports/2026-11-18-fcc-path-canonicalization-follow-up.md).
- PR #116 head `52339ee70e00b9905710d411404b55778f68c70a` Runner Qualification [44284614737](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44284614737) FAILED. FCC loopback passed; bridge shutdown step exited before emitting diagnostic output.
- Log sequence is consistent with `kill -INT` failing under Bash `set -e` before `set +e` was enabled. Signal exit status was not captured, so this is a hypothesis, not a proven root cause. Artifact [14419215372](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44284614737/artifacts/14419215372), 31,127 bytes, GitHub digest `sha256:3406b3d043829991a406455b1b94cd4c7da2533d1231d92ef320f934d33b9c5d`; contents not independently inspected.
- Commit `570d78b7d3f7972b7458de9e69f6117ae642896a`; workflow blob `cde20dddcb9687d0797df7e099693a713ce71c31`: captures SIGINT and wait statuses before evaluating, with fail-closed diagnostics. No policy weakening.
- Exact-head Pool Contract Validation [44284859281](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44284859281): SUCCESS. Runner Qualification [44284859244](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44284859244): IN_PROGRESS at cutoff; NOT VERIFIED.
- Next: inspect signal/wait/listener results on exact head `570d78b7d3f7972b7458de9e69f6117ae642896a`. Keep provider calls, real agent tasks and production dispatch disabled. Contour A BLOCKED/NOT ACCEPTED; Contour B DEFERRED.


### Agent dispatch and final current poll — 2026-11-18

- Approved Gemini controller path `.github/workflows/gemini-batch-dispatch-controller.yml` returned 404 on default branch `Основной`; Gemini agents NOT RUN. No bypass or direct provider calls.
- PR #126 OPEN/DRAFT/UNMERGED (`f69f286b5b5a3de8dfdd80ed581859851ce271e5`); PR #120 OPEN/DRAFT/UNMERGED (`e93fb34a1f3430ca2db32fbf2e631903aac9570f`); Issue #115 OPEN; Issue #118 OPEN.
- At latest poll, Runner Qualification [44284859244](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44284859244) remained IN_PROGRESS and Pool Contract Validation [44284859281](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44284859281) SUCCESS. Exact-head runner result NOT VERIFIED.


## Follow-up — explicit FCC shutdown diagnostics and current run — 2026-11-18

- Report: [FCC PATH canonicalization follow-up](../reports/2026-11-18-fcc-path-canonicalization-follow-up.md).
- Exact-head Runner Qualification [44284859244](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44284859244) failed on `570d78b7d3f7972b7458de9e69f6117ae642896a`; FCC loopback passed; bridge shutdown failed. Artifact [14418074350](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44284859244/artifacts/14418074350), 31,271 bytes, digest `sha256:3c94c889560b7a3c8e40a1d88d10fbdf6a5ad94977331ef9bc2c5ad0865a910f`; contents not independently inspected.
- The diagnostics file was written but not visible in job logs. Commit `c4839850a5b015a56a8ca2f591c11e0aeee7c950`; workflow blob `34a3f73909d2b637112b77cc5fb0e54580d84417` now prints it to stdout before fail-closed checks.
- Current-head Runner Qualification [44285187440](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44285187440) and Pool Contract Validation [44285187389](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44285187389) were IN_PROGRESS at cutoff; NOT VERIFIED.
- Next: read diagnostic output from 44285187440 and isolate signal status, wait status and listener state. Do not relax shutdown requirements or enable provider calls. Contour A BLOCKED/NOT ACCEPTED; Contour B DEFERRED.


## Follow-up — bridge shutdown SIGINT fix correctly targeted — 2026-11-18

- Report: [FCC PATH canonicalization follow-up](../reports/2026-11-18-fcc-path-canonicalization-follow-up.md).
- Audit correction: commit `570d78b7d3f7972b7458de9e69f6117ae642896a` changed the first FCC lifecycle block, not the synthetic bridge's signal block. It did not resolve the bridge failure.
- Current PR #116 head `3cdfd2801f0a78c22b698dc82c0a668b9c9662c1`; workflow blob `ad29cdf7ac6e5e2597af538f3ebb49abfa89f59b`. Read-back confirms bridge now sets `+e` before SIGINT, captures signal and wait statuses, then restores strict mode; diagnostics are printed.
- Exact-head Pool Contract Validation [44285275314](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44285275314): SUCCESS. Runner Qualification [44285275416](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44285275416): IN_PROGRESS at cutoff; NOT VERIFIED.
- Next: inspect current run's bridge diagnostic values and complete artifact; no provider calls or production dispatch. Contour A BLOCKED/NOT ACCEPTED; Contour B DEFERRED.


## /next checkpoint — 2026-11-18 (FCC bridge shutdown)
- PR #116 exact current head: `3cdfd2801f0a78c22b698dc82c0a668b9c9662c1`, OPEN/DRAFT/UNMERGED.
- Exact-head Pool Contract Validation run `44285275314`: SUCCESS.
- Exact-head Runner Qualification run `44285275416`: IN_PROGRESS at cutoff; job `134736343006` had passed checkout, environment allowlist, runner baseline and sandbox capability probe. No install/runtime result available yet; log download returned NOT_FOUND while running.
- Prior full runtime run `44284859244`: FCC loopback and primary shutdown passed, synthetic bridge shutdown strict check failed. Artifact `14418074350`, 31,271 bytes, digest `sha256:3c94c889560b7a3c8e40a1d88d10fbdf6a5ad94977331ef9bc2c5ad0865a910f`; archive not independently inspected.
- Commit `3cdfd2801f0a78c22b698dc82c0a668b9c9662c1` separately captures SIGINT delivery and wait exit statuses without weakening fail-closed checks. Superseded run `44285187440` cancelled before install; NOT a result.
- Gemini controller path returned 404 on default branch; Gemini NOT RUN. No secrets/provider calls/real Claude task/production dispatch/merge/deployment. `POOL_DISPATCH_ENABLED=false`.
- Issue #118 remains OPEN/BLOCKED; PR #126/#120 remain OPEN/DRAFT/UNMERGED. Contour A BLOCKED/NOT ACCEPTED; Contour B DEFERRED.
- Detailed report: [FCC bridge shutdown diagnostics follow-up](../reports/2026-11-18-fcc-bridge-shutdown-diagnostics-follow-up.md).
- Context Window updated in the same docs branch; always re-read live refs before continuing.
- Next: inspect run `44285275416` after completion and verify signal, process exit, process liveness, listener absence, plus provenance artifact. Do not enable provider calls or relax shutdown assertions.


### Run 44285275416 artifact inspection — 2026-11-18
- Runner Qualification completed FAILURE at synthetic bridge step; Pool Contract Validation `44285275314` SUCCESS.
- Artifact `14418937574`, 31,263 bytes, digest `sha256:ccd3afbade1d3bc6f61f3a3c79bcaa0b02617c66c368a98398e3d286336a5446`; downloaded, SHA256SUMS all 33 entries verified.
- Primary FCC runtime proof is PASS: HTTP 200, loopback-only `127.0.0.1:18765`, exit 0, listener absent after shutdown. No provider/completion calls.
- Bridge log shows HTTP 200 and graceful shutdown; stderr empty. However diagnostic/result files are missing from artifact. Exact signal/wait status, post-wait process liveness and listener state are NOT VERIFIED; failure assertion remains unidentified.
- Next bounded action: include `fcc-bridge-shutdown-diagnostics.txt` and `fcc-bridge-result.txt` in the artifact allowlist and surface non-secret numeric/boolean diagnostics as step outputs. Keep acceptance checks unchanged; rerun exact-head qualification.
- Report: [FCC bridge shutdown diagnostics follow-up](../reports/2026-11-18-fcc-bridge-shutdown-diagnostics-follow-up.md).


## Follow-up — artifact-backed FCC proxy environment contract finding — 2026-11-18

- Report: [FCC PATH canonicalization follow-up](../reports/2026-11-18-fcc-path-canonicalization-follow-up.md).
- Current PR #116 head `3cdfd2801f0a78c22b698dc82c0a668b9c9662c1`; Runner Qualification [44285275416](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44285275416) FAILURE; Pool Contract Validation [44285275314](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44285275314) SUCCESS.
- Artifact [14418937574](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44285275416/artifacts/14418937574), 31,263 bytes; downloaded SHA-256 matched GitHub digest `ccd3afbade1d3bc6f61f3a3c79bcaa0b02617c66c368a98398e3d286336a5446`; all 33 internal SHA256SUMS entries matched.
- Artifact confirms FCC loopback health and clean shutdown. Bridge server log records only `GET /health`; mock did not produce result/expected-argument files. Root cause: test expects `ANTHROPIC_BASE_URL` and `ANTHROPIC_AUTH_TOKEN`, but generic `exec_allowlist.py` intentionally strips non-allowlisted ambient variables and workflow does not call a trusted FCC proxy-env builder.
- Pinned FCC upstream commit `eb92e4c07af0d6ad8881dce1cd958c3d072c27c5` has `build_claude_proxy_env` which removes ambient `ANTHROPIC_*` and injects trusted proxy URL/token; managed Claude invocation uses it. This is the reference contract, subject to AGPL license boundary. Current CI step is not a real FCC-to-Claude proxy handoff.
- Next: implement a separate trusted proxy-env injection contract (loopback URL validation, managed token source, no argv/log/artifact exposure, ambient credential scrubbing) or rename the test to sanitization-only and keep proxy integration NOT VERIFIED. Never add ambient Anthropic variables to the generic allowlist.
- Provider route/quota, egress gateway, actual Docker worker, hosted-use entitlement, FCC AGPL network review and persistent workspace remain NOT VERIFIED/BLOCKED. Gemini NOT RUN because approved controller path is absent on default branch. Contour A BLOCKED/NOT ACCEPTED; Contour B DEFERRED.

---

## Follow-up checkpoint — 2026-11-18, FCC bridge evidence preservation

- Current PR #116 HEAD: `59514f6d1119ca113745f5da861a1195c66da2e5`; base `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`; OPEN/DRAFT/UNMERGED.
- Focused change: pre-create `fcc-bridge-result.txt` and `fcc-bridge-shutdown-diagnostics.txt` before bridge runtime startup; capture SIGINT, wait, process-liveness and listener-probe statuses while errexit is disabled; expose only non-secret numeric/boolean step outputs; retain all fail-closed assertions.
- Workflow blob: `a218c738e640c43f003cd4f24a348ab4b4aa996e`. Read-back verified new step ID, pre-created files, GITHUB_OUTPUT records and unchanged shutdown gates.
- Previous artifact #14418937574 (run #44285275416) re-downloaded: ZIP SHA-256 `ccd3afbade1d3bc6f61f3a3c79bcaa0b02617c66c368a98398e3d286336a5446`, matching GitHub digest; 34 entries. Bridge diagnostic/result files absent because they were only written after the shutdown/listener-probe sequence. Exact failing predicate remains NOT VERIFIED.
- Exact-head Runner Qualification [44286461561](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44286461561) and Pool Contract Validation [44286461574](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44286461574) were IN_PROGRESS at checkpoint creation. Results NOT VERIFIED.
- Report: [2026-11-18-fcc-bridge-shutdown-diagnostics-follow-up.md](../reports/2026-11-18-fcc-bridge-shutdown-diagnostics-follow-up.md).
- Context Window overlay updated on the documentation branch. Documentation branch changes remain separate from default branch and are not accepted production changes.
- Gemini NOT RUN: approved controller workflow path returned 404 on default branch. No secrets, provider calls, real Claude task, production dispatch, merge or deployment. `POOL_DISPATCH_ENABLED=false`.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Next: poll exact-head CI; inspect new artifact even if Runner Qualification fails; determine signal/wait/listener predicate from captured evidence before changing runtime behavior.

### CI poll update
- Pool Contract Validation [44286461574](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44286461574): COMPLETED / SUCCESS on exact HEAD `59514f6d1119ca113745f5da861a1195c66da2e5`.
- Runner Qualification [44286461561](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44286461561): IN_PROGRESS at latest poll; job `134740287165` RUNNING; no artifact yet. NOT VERIFIED.

### Root cause and correction follow-up
- Runner Qualification run #44286461561 failed on exact HEAD `59514f6d1119ca113745f5da861a1195c66da2e5`. Artifact #14418489783 was independently downloaded; SHA-256 `cb50a586a895f91a773b43e2c8f26caea606972e7ef55ff492a8e3538c946267` matched GitHub, 36 files present.
- Pre-created evidence files now survive failure. Result remains `bridge_result_state=STARTED`, shutdown diagnostics `bridge_shutdown_state=NOT_REACHED`; server started, returned HTTP 200, and was gracefully cleaned up by EXIT trap.
- Source review found a deterministic harness mismatch: child environment allowlist excludes `ANTHROPIC_BASE_URL` and `ANTHROPIC_AUTH_TOKEN`, but the mock incorrectly required them. No actual provider routing or FCC defect is established; numeric CLI exit status remains NOT VERIFIED.
- Corrective commit #116: `37d7b4de7b885d278a35d9311a38bc15fac961dc`; workflow blob `f4c892c57b9994dc598436471a8e130c7998861a`. The test now accurately names wrapper-to-mock invocation and asserts ambient provider routing/auth variables are absent. No credential forwarding or policy weakening.
- Exact-head Runner Qualification check `134741199311` and Pool Contract Validation check `134741199298` queued at latest poll; NOT VERIFIED.
- Report and Context Window updated on documentation branch; still separate from default branch.
- Next: poll exact-head checks and inspect new artifact. Keep provider calls, production dispatch and Gemini disabled.

### Latest exact-head CI poll
- Pool Contract Validation [44286730365](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44286730365): COMPLETED / SUCCESS on `37d7b4de7b885d278a35d9311a38bc15fac961dc`.
- Runner Qualification [44286730410](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44286730410): IN_PROGRESS on same HEAD; job #134741199311 is at signed APT installation. Later steps pending; NOT VERIFIED.

### Exact-head qualification update — 2026-11-18
- PR #116 HEAD `2e944f13818f434cf135602c1c0e82051f1d3fa8`, OPEN / DRAFT / UNMERGED.
- Pool Contract Validation [44286955360](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44286955360): SUCCESS exact-head.
- Runner Qualification [44286955337](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44286955337): SUCCESS exact-head; job #134741981861, all 18 steps succeeded.
- Artifact #14420066410, 34,605 bytes, digest `sha256:17638539900909e0c482a1178bfb88a2e301019db06d588f82fc1aefdd0c2d3a`; content/SHA256SUMS audit pending (NOT VERIFIED).
- This verifies hosted-runner installation/runtime/synthetic wrapper qualification only; no real Claude task, provider calls, provider egress allowlist, production dispatch or persistent workspace.
- Issue #118 OPEN: server #3 and Zero Trust/persistence evidence absent. Gemini NOT RUN; `POOL_DISPATCH_ENABLED=false`.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Next: artifact integrity/content audit, then re-evaluate workspace/access gates.
