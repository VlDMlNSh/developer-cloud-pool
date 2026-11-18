# CODE worker sandbox upstream fit and next implementation boundary — 2026-11-18

## Scope and immutable inputs

- Repository: `VlDMlNSh/developer-cloud-pool`
- Default branch `Основной` HEAD: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845` (unchanged in this pass).
- PR #116 current observed head: `570d78b7d3f7972b7458de9e69f6117ae642896a`, base `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`, OPEN/DRAFT/UNMERGED.
- PR #126 head: `f69f286b5b5a3de8dfdd80ed581859851ce271e5`, base `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`, OPEN/DRAFT/UNMERGED.
- Independent/external reviews remain deferred by owner direction. This pass uses source inspection, upstream license inspection and exact-head CI only.

## Current exact-head CI

- PR #116 Pool Contract Validation [44284859281](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44284859281): COMPLETED/SUCCESS on `570d78b7d3f7972b7458de9e69f6117ae642896a`.
- PR #116 Runner Qualification [44284859244](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44284859244): IN_PROGRESS at observation time; NOT VERIFIED. Do not treat it as passed.
- PR #126 Pool Contract Validation [44275194245](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44275194245): COMPLETED/SUCCESS on `f69f286b5b5a3de8dfdd80ed581859851ce271e5`.
- PR #126 changed files are limited to supervisor/worker workflows, supervisor code, contract validator and its dated report. Exact-head job completed all seven steps successfully.
- PR #126 is not merged; the legacy DSH path remains on default branch until integration. Do not claim the default branch is already remediated.

## Repository findings

- The default-branch `.github/workflows/pool-worker.yml` is the legacy DSH workflow. It accepts `workflow_dispatch`, reads issue labels, installs DSH and includes a write-enabled report job. PR #126 makes that workflow inert and removes the corresponding supervisor dispatch path, but has not merged.
- PR #116 changes the runner qualification workflow and Python runtime guard/test modules; it does not yet replace the legacy default-branch worker with a CODE container worker.
- PR #116's latest runner run was still active at observation time. The previous checkpoint records recurring FCC shutdown diagnostics; current run 44284859244 is the authoritative attempt for the current head.

## Upstream component research

### 1. Eclipse Enclave — strongest reusable candidate for a later persistent workspace

- Repository: https://github.com/eclipse-enclave/enclave
- Inspected upstream README blob: `36b937f0206068b988079783bc78ba20cfe9582e`.
- Inspected LICENSE blob: `09ea0c61d381fba5fe0bea1815e2d9d670d7e665` (MIT).
- Upstream describes per-session Docker/Podman containers, allowlist gateway with audit log, credentials held outside the container and substituted by the gateway, persistent host-side session history/configuration, and Theia-based IDE integration.
- Fit: promising reference or later integration candidate for the persistent Engineering Workspace / interactive agent session.
- Not selected for immediate GitHub-hosted worker adoption: it is a broader host-oriented session/IDE product with Docker/Podman prerequisites and persistent host-side state. No compatibility proof exists for running its control plane inside a disposable GitHub Actions runner or fitting the existing A0/D1 task envelope. Do not import it wholesale before a no-secret compatibility spike and threat-model review.

### 2. Anthropic defending-code-reference-harness — strongest directly relevant isolation pattern

- Repository: https://github.com/anthropics/defending-code-reference-harness
- Inspected `docs/agent-sandbox.md` blob: `51aa087742a6337bc9d3743348def9e18be6fdee`.
- Inspected LICENSE blob: `84b83dc8f7700461f3d1917234a03b84cedc63ac` (Apache-2.0).
- The documented pattern separates trusted orchestration from arbitrary agent commands; runs agent and target code inside gVisor; attaches the agent to an internal Docker network without direct internet route; sends egress through a small allowlist proxy; defaults to `api.anthropic.com:443`.
- Fit: use as the primary implementation reference for the CODE worker's isolation topology and verification assertions.
- Limitation: its documented setup installs/configures gVisor and Docker on a Linux machine; no evidence yet that the exact runtime setup is compatible with GitHub-hosted Actions. The existing Cloud Pool proof establishes Docker `--network none` only, not gVisor availability or the complete proxy path. No direct adoption claim.

### 3. Docker Agent — useful sandbox feature reference, not the Cloud Pool worker

- Repository: https://github.com/docker/docker-agent
- Inspected README blob: `d3daeb8ead7e59d1acc0b453d034429d5e0449a7`.
- Inspected LICENSE blob: `7a4a3ea2424c09fbe48d455aed1eaa94d9124835` (Apache-2.0).
- Its sandbox documentation describes default-deny network policy with per-run host allowlists and restrictions on mounted host paths.
- Fit: reference for declarative network policy and audit-friendly allowlist handling.
- Not selected as the worker orchestrator: it is a separate multi-agent/provider framework, requires its own configuration/model/tool abstractions, and would duplicate Cloud Pool's existing task authority and A0/D1 control plane.

## Architecture decision for the next slice

**Decision: reuse the Anthropic reference harness's security topology as a design input; do not import a second agent framework or deploy a persistent sandbox product yet.**

The next CODE worker slice must be a vertical, no-provider-call qualification:

1. Keep trusted admission/orchestration outside the agent container. The container receives only an immutable task envelope, a bounded worktree and the minimum runtime environment.
2. Run the actual CODE executor process inside the isolated container, not merely a network probe in a throwaway container.
3. Keep container root filesystem read-only except explicit task/work/temp mounts; drop all Linux capabilities; enable no-new-privileges; run non-root; bound CPU, memory, PIDs, disk, time and output.
4. Start with no egress. Then test a separately routed gateway with a positive hostname/port allowlist and explicit denial tests for direct outbound bypass, DNS abuse, redirects and unapproved hosts. Do not add provider domains until account/entitlement/legal gates are resolved.
5. Keep credentials outside the worker. If a later provider route is approved, use a broker that injects narrowly scoped credentials at the gateway boundary; do not mount host credential files or pass repository secrets to PR-controlled code.
6. Persist only sanitized task results and digests outside the sandbox. No write-capable GitHub token enters the executor container.
7. The first pass remains synthetic/no-secret. No real Claude session, model call, provider credential, production dispatch or paid fallback.

## Immediate blockers

- PR #116 current Runner Qualification 44284859244: IN_PROGRESS / NOT VERIFIED.
- Actual CODE worker has not run inside the sandbox.
- Provider-specific egress gateway is not implemented or qualified.
- GitHub-hosted runner host egress remains public; container isolation does not isolate the host.
- Claude Code hosted-use entitlement/account authority is NOT VERIFIED.
- FCC AGPL-3.0-only network-exposure legal review is NOT VERIFIED.
- PR #126 legacy-dispatch retirement remains proposed and unmerged.
- Hosted D1, live owner-only controller, durable leases/recovery, Jarvis web API and persistent workspace remain unqualified.

## Next concrete engineering step

After run 44284859244 reaches a terminal state, inspect its exact-head job logs and artifact digests. Then implement one new no-secret worker-container qualification workflow that launches a synthetic executor inside the actual restricted container and verifies (a) exact target SHA and task envelope, (b) no secret/token visibility, (c) read-only filesystem and capability restrictions, (d) no direct egress, (e) deterministic termination and artifact integrity. Keep provider egress disabled. Only then add the separately testable allowlist gateway.

## Safety and status

- No secrets read; no provider calls; no real agent session/task; no Gemini dispatch; no production dispatch; no deployment; no merge; no Contour B.
- PR #116 remains OPEN/DRAFT/UNMERGED; latest runner CI NOT VERIFIED at cutoff.
- PR #126 remains OPEN/DRAFT/UNMERGED; exact-head contract CI SUCCESS.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.


## Follow-up — FCC synthetic bridge shutdown diagnostic correction — 2026-11-18

- PR #116 Runner Qualification [44284859244](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44284859244) completed FAILURE on exact head `570d78b7d3f7972b7458de9e69f6117ae642896a`; job `134734780467`.
- Exact job logs prove Claude Code signed APT install, signed release-manifest/binary verification, Docker no-egress primitive, FCC install/profile tests, and FCC loopback health/shutdown all passed. Synthetic bridge failure occurred after the mock handoff and argument-preservation checks.
- Root cause in the workflow source: bridge shutdown diagnostics referenced `signal_status` but never assigned it. With `set -u`, expansion aborted before diagnostics; additionally SIGINT delivery was not captured under non-errexit mode. This was a test harness defect, not evidence of FCC runtime failure.
- Corrective commit: `3cdfd2801f0a78c22b698dc82c0a668b9c9662c1`; workflow blob `ad29cdf7ac6e5e2597af538f3ebb49abfa89f59b`. The bridge now enters non-errexit mode before SIGINT, records `signal_status=$?`, waits and records `shutdown_status=$?`, then restores strict mode before assertions.
- Read-back verified the exact source block contains the status capture. PR #116 current head is the corrective commit, OPEN/DRAFT/UNMERGED. Commit-associated workflow lookup returned no runs at observation time; exact-head requalification is NOT RUN / NOT VERIFIED.
- No provider calls, secrets read, real Claude session, agent task, Gemini dispatch, production dispatch, deployment or merge.
- Next: wait for/inspect exact-head CI on `3cdfd2801f0a78c22b698dc82c0a668b9c9662c1`; do not start the actual CODE-in-container slice until the complete no-secret qualification is green and artifact integrity is checked.


## Follow-up — exact-head Runner Qualification failure after bridge correction — 2026-11-18

- PR #116 immutable tested HEAD: `3cdfd2801f0a78c22b698dc82c0a668b9c9662c1`; base `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`; PR remains OPEN / DRAFT / UNMERGED.
- Exact-head Pool Contract Validation [44285275314](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44285275314): COMPLETED / SUCCESS.
- Exact-head Runner Qualification [44285275416](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44285275416): COMPLETED / FAILURE; job `134736343006`. The workflow correction fixed the unset signal-status diagnostic, but did not yield a passing qualification.
- Step 12, “Start FCC on loopback and verify local readiness and shutdown”, failed: the process did not establish the expected HTTP 200 on `127.0.0.1:18765/admin/api/status`; logs include connection refusal. Step 13, synthetic FCC-to-mock-Claude bridge, also failed. Therefore the prior statement that FCC loopback lifecycle passed at this exact head is incorrect; it is superseded by this run evidence.
- Steps 3–11 passed: child-environment policy tests, runner baseline, sandbox capability probe, signed Claude package/manifest/binary verification, Docker no-egress primitive, pinned uv install, FCC install/metadata and synthetic profile guard. ECC skill install was skipped because the dependent qualification stage did not pass. These are bounded sub-proofs only.
- Artifact [14418937574](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44285275416/artifacts/14418937574), SHA-256 `ccd3afbade1d3bc6f61f3a3c79bcaa0b02617c66c368a98398e3d286336a5446`; uploaded and available. Artifact presence does not convert the failed job into success.
- Root cause of FCC listener/readiness failure is NOT YET DETERMINED. The workflow source shows FCC is launched through `exec_allowlist.py` with a constrained HOME/XDG/PATH and explicit loopback HOST/PORT. Do not infer the cause from the wrapper or from the earlier signal-variable bug; inspect the artifact's runtime/server logs and reproduce before changing code.
- No provider calls, secret reads, real Claude session/task, Gemini dispatch, production dispatch, deployment, merge or Contour B. Keep all dispatch disabled.
- Next bounded step: inspect artifact contents (including `fcc-server-runtime.log`, bridge server log and diagnostics), isolate why the FCC server does not bind/readiness-check, add a regression test, and rerun exact-head qualification. Do not proceed to CODE-in-container until all required no-secret steps pass.

## Current disposition

- PR #116 Runner Qualification: FAILED; corrective diagnosis remains open.
- PR #116 Pool Contract Validation: SUCCESS.
- PR #126 legacy DSH dispatch retirement: OPEN / DRAFT / UNMERGED; exact-head contract run [44275194245](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44275194245) SUCCESS; default branch still contains the legacy path.
- PR #127 documentation continuation: OPEN / DRAFT / UNMERGED; this update is on its documentation branch only.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.


## Evidence correction — FCC loopback passed; bridge handoff failed — 2026-11-18

The previous overlay incorrectly described workflow step 12 (FCC loopback readiness/shutdown) as FAILED. Direct inspection of artifact `14418937574` disproves that statement. Artifact ZIP SHA-256: `ccd3afbade1d3bc6f61f3a3c79bcaa0b02617c66c368a98398e3d286336a5446`.

- Step 12 “Start FCC on loopback and verify local readiness and shutdown”: COMPLETED / SUCCESS. `fcc-runtime-state.txt` records HTTP 200, listener exactly `127.0.0.1:18765`, clean shutdown, process exit 0, and listener absent afterward. `fcc-server-runtime.log` confirms startup, GET status 200, and clean application shutdown.
- Step 13 “Qualify synthetic FCC-to-Claude CLI handoff without provider access”: FAILED. Bridge server itself started and served `GET /health` with HTTP 200 on loopback port 18766; its runtime log records clean server shutdown. However the step failed before writing `fcc-bridge-result.txt` / the synthetic mock marker into the qualification evidence. Provenance records `fcc_client_launcher_invoked=false`; this is consistent with the mock handoff not being proven.
- Therefore the correct fault boundary is the synthetic CLI handoff / its assertions or child environment, NOT the FCC server startup/readiness path. Exact failing assertion is not yet established because the workflow does not preserve bridge-home marker/args files and the stderr artifact is empty. Do not claim a confirmed root cause.
- Steps 3–12, 14? No: step 14 ECC installation was SKIPPED because step 13 failed. Steps 3–12 succeeded, and steps 15–16 (provenance/evidence upload) succeeded. Exact step list: 3–12 SUCCESS, 13 FAILURE, 14 SKIPPED, 15–16 SUCCESS.
- Next bounded action: improve step 13's failure observability without persisting credential values: record `cli_status`, marker existence, args-file existence, wrapper stderr classification, child HOME path/mode metadata, and shutdown diagnostics into the uploaded qualification directory before each assertion; keep synthetic values ephemeral and redact them. Then rerun exact-head qualification. Do not modify FCC runtime based on this evidence.
- This correction supersedes the earlier erroneous statement that FCC loopback readiness failed. Contour A remains BLOCKED / NOT ACCEPTED; no real Claude session, provider calls, agent task, Gemini dispatch, deployment or Contour B.


## Diagnostic hardening follow-up — 2026-11-18

- Inspected workflow logs and exact step list. Steps 3–12 passed; step 13 is the sole failing qualification step; ECC install step 14 was skipped; provenance/evidence steps 15–16 passed.
- Step 13 starts FCC bridge on loopback and gets `GET /health` HTTP 200. It then attempts the synthetic mock CLI through `exec_allowlist.py`; the failure occurs before the success evidence is written. Exact failed assertion remains NOT DETERMINED because bridge HOME marker/argument files were not copied into the artifact on failure.
- Updated PR #116 workflow on branch `feat/claude-code-fcc-runner-qualification-2026-11-17` to preserve redacted bridge diagnostics and synthetic mock marker/argument/stderr files in the qualification artifact, including CLI status and directory mode/owner metadata. No secret values are copied; the mock contains only fixed non-secret metadata and test arguments. Workflow source blob SHA: `ddb8688f362d66ec41ddf0c4990aa9ff3b40b644`; commit HEAD: `2e944f13818f434cf135602c1c0e82051f1d3fa8`.
- Exact-head CI after diagnostic hardening: Runner Qualification [44286955337](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44286955337) RUNNING at last read (job `134741981861`); Pool Contract Validation [44286955360](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44286955360) RUNNING (job `134741972786`). Earlier run on intermediate commit `a0b725c...` was cancelled by the subsequent corrective commit and is not accepted as verification.
- Next: inspect exact-head CI results and, if step 13 still fails, inspect newly uploaded diagnostic artifact to isolate the precise assertion. Do not modify FCC runtime absent evidence. Contour A remains BLOCKED / NOT ACCEPTED.


## Exact-head Runner Qualification SUCCESS — artifact inspection — 2026-11-18

- Candidate PR #116 exact head `2e944f13818f434cf135602c1c0e82051f1d3fa8`, base `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`; PR remains OPEN / DRAFT / UNMERGED.
- Exact-head Runner Qualification [44286955337](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44286955337): COMPLETED / SUCCESS; job `134741981861`; all 16 steps SUCCESS.
- Exact-head Pool Contract Validation [44286955360](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44286955360): COMPLETED / SUCCESS; job `134741972786`. The contract job asserts dispatch remains disabled/unset, parses all workflow YAML, and passes pinned Action SHA, workflow-input interpolation, Worker/Supervisor permissions, checkout and no-secret probe invariants. The run environment showed `POOL_DISPATCH_ENABLED=false`.
- Artifact [14420066410](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44286955337/artifacts/14420066410), 34,605 bytes, digest `sha256:17638539900909e0c482a1178bfb88a2e301019db06d588f82fc1aefdd0c2d3a`; downloaded and inspected. Internal SHA256SUMS entries match artifact files.
- Artifact proves: official signed APT provenance and binary manifest signature; Claude Code 2.1.311; FCC pinned commit `eb92e4c07af0d6ad8881dce1cd958c3d072c27c5`, Python 3.14.10, FCC loopback HTTP 200 and clean shutdown; FCC profile guard 15 tests; synthetic mock bridge invocation, exact argument preservation, no synthetic ambient provider credentials/proxy overrides forwarded, no provider/completion endpoints, clean bridge shutdown; ECC pinned commit `e413166c50e85fb205b988b5e78874b5a88ea4d2`, selected skills installed; Docker network-none test blocked external TCP, no default route, read-only rootfs, dropped capabilities. Mock CLI returns expected status 37 and workflow treats it as the expected test result.
- Important scope limit from manifest: `runner_network_egress=NOT_VERIFIED_github_hosted_runner_has_public_internet_by_default`; `provider_egress_allowlist=NOT_IMPLEMENTED`; `real_agent_container_execution=false`; `real_claude_session=false`; `agent_task_executed=false`; `production_dispatch=false`. Docker no-egress is a primitive probe, not proof that a real Claude worker runs inside the container or that the host runner has egress isolation.
- FCC is AGPL-3.0-only; ECC MIT; Claude Code proprietary vendor terms remain a legal/use review item before hosted product deployment. FCC remains loopback-only.
- Review API for PR #116 shows four COMMENTED reviews, all authored by repository owner account `VlDMlNSh`; no independent reviewer approval is evidenced. Thus owner-authored review notes are not independent review. Branch protection endpoint returned 403 to this integration; current ruleset enforcement/required reviewers are NOT VERIFIED in this pass. Do not mark Issue #115 accepted/closed based on CI alone.
- Issue #115 remains OPEN. Issue #117 (loopback lifecycle smoke) is CLOSED; exact-head evidence now reconfirmed at PR #116.
- Next sequence: keep dispatch disabled; independently review PR #116 and licensing/hosted-use terms; then address A0 admission/lease/worker qualification, starting with Issue #70 (unknown provider routes must fail closed) and Issue #38 (durable single-use claims). Do not jump to persistent workspace Issue #118 until A0 gates pass.
- Contour A remains BLOCKED / NOT ACCEPTED; Contour B DEFERRED.


## A0 route registry ledger source review — 2026-11-18

- Reviewed PR #77 exact HEAD `e63f1dda4c046d485ae9c2f08392a1943a06553d`, base `096737ec5e1a335b367fc7af67c29f7b71541e66`; OPEN / DRAFT / UNMERGED. Exact-head D1 proof run [43707424040](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43707424040) SUCCESS: 115 Workers-runtime tests; second local D1 migration smoke and frozen schema-0010 fixture smoke passed. Artifact [14158817485](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43707424040/artifacts/14158817485), digest `sha256:261a1eff4d93d58598d1b4495bf2f0e9b1632b71b4c9e03fa33b4b9b249f6e5f`.
- Source review found a bootstrap watermark rollback gap: state INSERT guard binds the initial pointer to any existing snapshot but does not require it to reference the maximum persisted epoch. A database can contain snapshots N and N+1 before singleton initialization, then initialize the state pointer to N. PR #78 changes snapshot insertion to compare against MAX(epoch), but its state INSERT guard is unchanged; this residual case remains. Required regression: insert N and N+1 before state exists; reject state initialization at N; accept N+1. Guard should require initial epoch = MAX(epoch) while retaining digest/version/accepted_at binding.
- Finding posted to PR #77 conversation comment ID `6977025915`. This is a bounded source finding, not independent review.
- PR #78 exact-head run [43708444649](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43708444649) SUCCESS; PR #80 exact-head run [43708731241](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43708731241) SUCCESS. Both PRs are CLOSED but `merged=false`; do not treat them as integrated into default branch. PR #77 remains OPEN/DRAFT/UNMERGED. PR #79 docs branch remains OPEN/DRAFT and diverged.
- Current default branch HEAD remains `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`; PR #116/#126 open drafts; PR #127 open draft with separate base. No change to default branch.
- Next step: correct initial-state max-epoch guard and add adversarial bootstrap test on a clean current-base integration chain; then verify exact-head D1 tests and independent review. Continue to keep dispatch disabled. A0 route evidence is not production qualified; Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
