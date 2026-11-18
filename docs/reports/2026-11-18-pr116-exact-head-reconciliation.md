# Follow-up — 2026-11-18, exact-head qualification SUCCESS and artifact verification

## Current exact-head result
- PR #116 head `2e944f13818f434cf135602c1c0e82051f1d3fa8`; OPEN/DRAFT/UNMERGED; base `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Pool Contract Validation [44286955360](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44286955360): COMPLETED/SUCCESS.
- Runner Qualification [44286955337](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44286955337): COMPLETED/SUCCESS; job `134741981861`; all 18 steps completed, no failed/skipped steps.
- Artifact [14420066410](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44286955337/artifacts/14420066410), 34,605 bytes. Downloaded archive SHA-256 `17638539900909e0c482a1178bfb88a2e301019db06d588f82fc1aefdd0c2d3a` matches GitHub artifact digest. All 43 internal SHA256SUMS entries passed after stripping the recorded runner temp path prefix.

## Verified evidence
- Tests: `test_exec_allowlist.py` 10/10; `test_task_home.py` 9/9; `test_verify_claude_release.py` 7/7; FCC profile guard 15/15.
- Claude Code package `2.1.311-1`, CLI `2.1.311`; Anthropic release signing key fingerprint `31DDDE24DDFAB679F42D7BD2BAA929FF1A7ECACE`; detached manifest signature verified; Linux x64 binary SHA-256 `86dc1fcc69498159eaf15f446613e847010f9036bfbbdffd4c49350be8489ada` matches signed manifest.
- Docker no-egress proof: TCP blocked, no default route, read-only rootfs, capabilities dropped; image digest `ubuntu@sha256:73b999393d07f2bf65a40373778a44dc9a6d54ad7718d29247d8ff9413c4d6a8`.
- FCC `6.19.35` loopback server readiness HTTP 200 and clean shutdown; no provider/completion endpoint calls.
- Synthetic wrapper-to-mock invocation passed: ambient credentials and proxy overrides stripped; argv preserved; mock exit 37 observed; bridge shutdown exit 0; process dead; listener absent.

## Exact scope and exclusions
- The test now correctly qualifies a wrapper-to-mock invocation. It does NOT invoke FCC's own Claude client launcher; provenance explicitly records `fcc_client_launcher_invoked=false`.
- Docker test proves the no-egress primitive only. The actual Claude Code CLI was installed on the GitHub-hosted runner and was not executed inside the Docker container; `real_agent_container_execution=false`.
- Host runner egress remains public; provider allowlist proxy NOT IMPLEMENTED. No secrets read, provider calls, live Claude session, real agent task or production dispatch.
- Claude hosted-use entitlement/account authority and FCC AGPL-3.0-only network-exposure legal review remain NOT VERIFIED.

## Diagnosis of superseded failure
- Run [44286461561](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44286461561) on SHA `59514f6d1119ca113745f5da861a1195c66da2e5` failed in synthetic wrapper-to-mock qualification.
- Its artifact [14418489783](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44286461561/artifacts/14418489783) was downloaded and inspected: FCC bridge server started and shut down cleanly, but `bridge_result_state=STARTED`, marker absent, and diagnostics were not reached. The mock expected ambient provider base URL/auth token even though `exec_allowlist.py` deliberately strips them. The next code commit changed the mock to assert those variables are absent. Subsequent run on `37d7b4d...` was cancelled by a later push. The current `2e944f1...` run passes.

## Remaining blockers / next step
- Actual CODE execution inside a no-egress container is NOT VERIFIED; provider egress allowlist not implemented; runner host egress not isolated; hosted-use entitlement/account authority and AGPL network-use legal review NOT VERIFIED.
- Next bounded pass: run actual Claude Code CLI inside Docker `--network none` against a synthetic local executable/mock only, with no provider credentials, then verify mount and teardown evidence. Do not connect a provider or enable external egress.
- Contour A remains BLOCKED / NOT ACCEPTED; Contour B remains DEFERRED.

---
# Follow-up — 2026-11-18, PR #116 current head 2e944f1

- Current PR #116 head: `2e944f13818f434cf135602c1c0e82051f1d3fa8`, OPEN/DRAFT/UNMERGED.
- Exact-head Pool Contract Validation [44286955360](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44286955360): IN_PROGRESS at last observation.
- Exact-head Runner Qualification [44286955337](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44286955337): IN_PROGRESS at last observation; job 134741981861, signed APT install active.
- Previous SHA `37d7b4de7b885d278a35d9311a38bc15fac961dc` run [44286730410](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44286730410) was CANCELLED by the later push; it is not a terminal qualification result.
- Commit `2e944f13818f434cf135602c1c0e82051f1d3fa8` fixes literal newline escaping in bridge diagnostic artifact generation. This allows line-oriented diagnostic inspection but does not demonstrate that the bridge passes.
- The prior `59514f6...` runner run failed at synthetic bridge qualification. Exact diagnostic values remain NOT VERIFIED from text logs; do not assert a definitive root cause.
- No secrets/provider calls/real task/production dispatch/deployment/merge; Gemini NOT RUN; Contour A NOT ACCEPTED; Contour B DEFERRED.

---
# Follow-up — 2026-11-18, PR #116 head advanced to 37d7b4d

- PR #116 current head: `37d7b4de7b885d278a35d9311a38bc15fac961dc`, OPEN/DRAFT/UNMERGED.
- Exact-head contract validation [44286730365](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44286730365): SUCCESS.
- Exact-head runner qualification [44286730410](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44286730410): IN_PROGRESS at last observation, job 134741199311.
- Superseded head `59514f6d1119ca113745f5da861a1195c66da2e5` run [44286461561](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44286461561) failed. Artifact [14418489783](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44286461561/artifacts/14418489783), digest `sha256:cb50a586a895f91a773b43e2c8f26caea606972e7ef55ff492a8e3538c946267`.
- The failing step is synthetic wrapper-to-mock CLI handoff/shutdown. Job text log records process exit code 1 but does not expose runtime values from the diagnostics file. `exec_allowlist.py` calls `os.execvpe`, replacing its wrapper process; test assertions must distinguish expected signal-derived exit status from a still-running process or a listener leak. Root cause remains provisional pending artifact diagnostic inspection.
- Latest commit aligns mock expectations with strict allowlist: no ambient provider credential variables or proxy overrides are forwarded.
- No secrets/provider calls/real Claude session/task/production dispatch/deployment/merge. Gemini NOT RUN. Contour A NOT ACCEPTED; Contour B DEFERRED.

---
# /next — PR #116 exact-head reconciliation — 2026-11-18

## Immutable target and repository state
- Repository: `VlDMlNSh/developer-cloud-pool`.
- Default branch `Основной` HEAD: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- PR #116 current head: `59514f6d1119ca113745f5da861a1195c66da2e5`; base `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`; OPEN/DRAFT/UNMERGED; mergeable true.
- PR #126 head: `f69f286b5b5a3de8dfdd80ed581859851ce271e5`; OPEN/DRAFT/UNMERGED.
- PR #127 documentation branch head before this update: `3dc5ef35d99457a73046b561bcc416e56c462f81`; OPEN/DRAFT/UNMERGED; mergeable false.

## Exact-head CI
- PR #116 Pool Contract Validation [44286461574](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44286461574): COMPLETED / SUCCESS.
- PR #116 Runner Qualification [44286461561](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44286461561): IN_PROGRESS at last observation. Job `134740287165`; checkout, child environment tests, runner baseline, sandbox capability probe, signed Claude Code APT install, signed release-manifest/binary verification and Docker no-egress proof passed. uv installation was in progress; FCC runtime, bridge, ECC and final artifact pending. Overall status NOT VERIFIED.
- Historical failure [44285275416](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44285275416) belongs to superseded SHA `3cdfd2801f0a78c22b698dc82c0a668b9c9662c1`, not current PR head. It failed during synthetic FCC-to-mock-CLI bridge shutdown. Artifact [14418937574](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44285275416/artifacts/14418937574), digest `sha256:ccd3afbade1d3bc6f61f3a3c79bcaa0b02617c66c368a98398e3d286336a5446`.
- Current workflow source blob `a218c738e640c43f003cd4f24a348ab4b4aa996e` pre-creates bounded bridge diagnostics and captures SIGINT/wait/listener results before assertions. This preserves evidence; it does not itself prove the bridge passes.

## Governance and execution boundary
- `.github/workflows/gemini-batch-dispatch-controller.yml` returned GitHub 404 on default branch. Approved Gemini controller availability at the required path is NOT VERIFIED / NOT PRESENT at queried path; Gemini NOT RUN.
- No secrets or credential values read; no provider calls, live Claude session, real agent task, production dispatch, deployment or merge.
- Independent/external reviews remain DEFERRED per owner sequencing. Exact-head CI is not independent review.
- PR #126 remains unmerged; legacy DSH retirement is not yet on default branch.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

## Next step
Re-query run 44286461561 to terminal status. If successful, verify its artifact digest and internal checksums, then qualify an actual CODE executor invocation inside the hardened no-egress Docker container using only a local synthetic mock. If failed, use preserved bridge diagnostics for one targeted correction. Keep provider egress disabled pending account, quota, hosted-use and FCC license gates.

## Canonical MediaHub architecture reference
https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
