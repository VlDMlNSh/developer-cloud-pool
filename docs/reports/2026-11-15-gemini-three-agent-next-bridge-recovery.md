# Gemini three-agent /next bridge recovery — 2026-11-15

Status: VERIFIED for the existing MediaHub issue-comment controller path. No controller or child workflow code change was required.

## Executive result

The earlier conclusion that the Gemini bridge was not working is superseded by direct inspection of GitHub Actions job logs. Four owner-authored `/next` comments on MediaHub Issue #301 each caused one successful controller run and exactly three successful signed child workflow dispatches. All twelve child workflows completed successfully, with two successful jobs and one non-expired `gemini-output` artifact digest per child.

The existing mechanism is already the required three-agent system. The missing operational convention for a ChatGPT `/next` turn is to create exactly one owner-authored `/next` comment on MediaHub Issue #301. The controller consumes that comment event. Do not dispatch the child workflows directly from ChatGPT, do not post more than one comment per turn, and do not post a comment when the current turn is not a `/next` request.

## Immutable source baseline

- MediaHub repository: https://github.com/VlDMlNSh/mediahub-os
- MediaHub main HEAD observed: `1694cde38c7b7d69baf9676b4908c1bb6e197fbe`
- Controller path: `.github/workflows/gemini-batch-dispatch-controller.yml`
- Controller blob SHA: `7799f0fc713c5bd772ce6820df40a926a83445c8`
- Agent 1 path: `.github/workflows/gemini-autonomous-engineering.yml`
- Agent 2 path: `.github/workflows/gemini-agent-2.yml`
- Agent 2 blob SHA: `fa3b4c407d3c583cbd33133aea89e4bd8a496b69`
- Agent 3 path: `.github/workflows/gemini-agent-3.yml`
- Agent 3 blob SHA: `bad0d5baf9b9cf1e8e5d7cdd2ab80f12052b047e`
- Agent 1 historical blob SHA observed earlier: `ed9ae2200debe76e39e3e5dfb5816ba94db3950c`; re-read the current file before relying on this SHA as current.
- Controller event path: owner-authored `issue_comment.created` on issue #301 with exact body `/next`.
- Admission: `vars.MEDIAHUB_GEMINI_BATCH_ENABLED` must equal `true`; all further checks still apply.
- Child dispatch requires `secrets.MEDIAHUB_GITHUB_TOKEN` and `secrets.MEDIAHUB_DISPATCH_HMAC_KEY`; their values were not read. Successful live dispatch proves they were usable for these runs at that time, not that they remain unchanged.
- The controller validates the immutable target SHA, signs each child payload with HMAC, uses unique UUID correlation IDs, checks duplicate source comment IDs, monitors exact child run IDs/jobs/artifacts and fails if any evidence is missing.

## Four verified waves on 2026-11-15

All child workflows used target SHA `1694cde38c7b7d69baf9676b4908c1bb6e197fbe`. Every child run completed with conclusion `success`; each had both authorization and Gemini execution jobs successful and a recorded artifact digest.

| Source comment ID | Controller run | Agent 1 run / artifact SHA-256 | Agent 2 run / artifact SHA-256 | Agent 3 run / artifact SHA-256 |
|---|---:|---|---|---|
| 6898434080 | 43741451816 | 43741475380 / `ea9fb4e1c93af0f7f329480365b5c2207944dad940e052a2800d14ab53132742` | 43741477715 / `13a5058798e48b1e3af884f34dfaac2bd6c4c9866ab04c497c22dbca743a47f8` | 43741479932 / `0d5bb4e6ab14a8d8785efe238ba084d611f26ea12689766c03becccd4dbe15dc` |
| 6898453275 | 43741600025 | 43741694350 / `b61aaec4d31293a18bb63afe28a264fc61fa6b0c38563c7cee61d50cdd09d4d7` | 43741696633 / `c2bde6209382fdffa9c46d9ed1855eb66bc16da36f54f749a2ad552e01628fb6` | 43741698600 / `4c9c365effb879fd0a0bc04301ea4584c28cadcd27428336ade775832d530ab8` |
| 6898479858 | 43741803725 | 43742062642 / `877258185bfb0eb1238cdcb12c8ca320bec77d7d3f3dd97e3eb169840521ad6c` | 43742064365 / `ec3c1b597b11e3439938d27bd45c8fbcc00d0275da836586b492e8c4f326b791` | 43742065892 / `779d499b8dae5060d85c91db80b1126f60c8fb7095f92e10a8ee5ecf5b0cf2f4` |
| 6898513683 | 43742063927 | 43742248259 / `c3566c5279646f44a8868f89389677bd81aa2717e526eaf90e241ecffba82ba5` | 43742249899 / `448695aeb26d6b6657d1cd8b1ca5a29d634a9e1d2614c9b84f01a18d1a522763` | 43742251541 / `87088ed4a9ffd4f7af21e3cfe588638e25f629fef40bd4fec1d7f5331c9116ef` |

Controller run details:
- All four controller runs had the admission-gate job completed successfully.
- All four `dispatch_and_monitor` jobs completed successfully.
- Latest controller job: run `43742063927`, job `132897717838`.
- Latest child job IDs: Agent 1 authorization `132897750062`, execution `132897770124`; Agent 2 authorization `132897755382`, execution `132897774760`; Agent 3 authorization `132897761267`, execution `132897782971`. All six conclusions were `success`.
- Latest source comment: `6898513683`.
- Latest source target SHA: `1694cde38c7b7d69baf9676b4908c1bb6e197fbe`.

## Operational instructions for each ChatGPT /next

1. When the user sends the exact command `/next`, first check the current latest source comment/run state on MediaHub Issue #301. If the event for this turn already exists, reuse it; never create a second comment for the same turn.
2. If no event exists for this turn, create exactly one owner-authored comment with body exactly `/next` on https://github.com/VlDMlNSh/mediahub-os/issues/301 using the authorized GitHub issue-comment action. This comment is the event; it is not a manual owner step.
3. Do not invoke `workflow_dispatch` directly and do not dispatch child workflows directly. The trusted controller performs HMAC signing, allowlist checks and dispatch.
4. Capture the newly created comment ID; correlate it to controller run title `next-comment-<comment-id>`.
5. Check controller admission gate, controller run status, then exact child run IDs, job conclusions and artifact digests. Record DISPATCHED/RUNNING/SUCCEEDED/VERIFIED separately.
6. Continue the main Cloud Pool pass independently; Gemini must not block the ChatGPT work. On the next /next, reconcile the prior wave before dispatching the next unique event.

If the GitHub comment action is unavailable, or the controller event does not start, report the exact blocker and do not pretend the wave ran. Do not ask the owner to manually post comments while the authorized GitHub connector can perform that action.

## Scope boundaries and safety

- The Gemini controller belongs to MediaHub OS; it is not a Cloud Pool-native supervisor or worker.
- Cloud Pool Supervisor remains a separate queue reconciler. Its dispatch gate is `POOL_DISPATCH_ENABLED`; current default-branch workflow reads this variable and must remain fail-closed until Cloud Pool's own authorization/qualification criteria pass.
- Do not set or modify Cloud Pool dispatch, secrets, provider keys, account identities, quotas or billing as part of this bridge.
- Do not read or print secret values. No paid fallback. No merge or deployment by Gemini.
- Agent 2 is explicitly instructed not to claim review of Agent 1 changes created concurrently in the same wave.
- The four waves prove the controller/three-child execution path on 2026-11-15. They do not qualify Cloud Pool runtime, persistent state, routing, quota isolation, web console, or Contour A acceptance.

## Current conclusion

- MediaHub three-agent dispatch path: VERIFIED on four consecutive `/next` comment events.
- Admission flag: operationally confirmed true by successful gate jobs during those runs; no direct variable value read.
- HMAC and GitHub dispatch credentials: operationally confirmed for those runs only; values never read.
- Per-turn ChatGPT-to-GitHub event bridge: documented operational action; must be performed once per future ChatGPT `/next` turn.
- Cloud Pool-native three-agent controller: NOT IMPLEMENTED / NOT QUALIFIED; do not conflate it with MediaHub bridge.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

## Canonical references

- Cloud Pool Context Window: https://github.com/VlDMlNSh/developer-cloud-pool/blob/main/docs/context/GITHUB-CONTEXT-WINDOW.md
- Cloud Pool Issue #94: https://github.com/VlDMlNSh/developer-cloud-pool/issues/94
- MediaHub Issue #301: https://github.com/VlDMlNSh/mediahub-os/issues/301
- MediaHub Controller: https://github.com/VlDMlNSh/mediahub-os/blob/main/.github/workflows/gemini-batch-dispatch-controller.yml
- MediaHub canonical map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## Live ChatGPT-to-GitHub bridge smoke test — 2026-11-15 18:21 UTC

A real GitHub issue comment was created through the authorized GitHub connector to validate the per-turn bridge action:
- MediaHub Issue #301 comment ID: `6899094688`, exact body `/next`, author `VlDMlNSh`.
- Controller run: `43746281426`, run title `MediaHub Gemini controller — next-comment-6899094688 — Wave 317`, event `issue_comment`, target SHA `1694cde38c7b7d69baf9676b4908c1bb6e197fbe`.
- Admission gate job `132910179205`: SUCCESS.
- `dispatch_and_monitor` job `132910206815`: RUNNING at last observation.
- Three child workflows were observed in GitHub Actions, all `workflow_dispatch` / RUNNING:
  - Agent 1 run `43746301766`, correlation ID `12bb36e0-d4bd-4704-9354-152647cb9bf4`; authorization job `132910245758` SUCCESS; Gemini job `132910285304` RUNNING.
  - Agent 2 run `43746303789`, correlation ID `a0945539-acef-4914-93bf-c41e49ff6767`; authorization job `132910251604` SUCCESS; Gemini job `132910269920` RUNNING.
  - Agent 3 run `43746305744`, correlation ID `e344fa9c-74ba-4066-a3d6-e5a4305f5644`; authorization job `132910258105` SUCCESS; Gemini job `132910281559` RUNNING.
- This validates that the GitHub connector can create the owner-authored issue event and that it causes exactly three child dispatches. Final child conclusions and artifact digests are pending; do not mark this smoke wave SUCCEEDED/VERIFIED until those are read back.
- This test was one intentional event and not a duplicate. For the next user-issued `/next`, create one new comment and reconcile it independently.


## Live bridge smoke test — final reconciliation

The smoke test described above is now complete and VERIFIED:
- Controller run `43746281426`: COMPLETED / SUCCESS. Admission job `132910179205` SUCCESS; dispatch-and-monitor job `132910206815` SUCCESS.
- Agent 1 run `43746301766`: COMPLETED / SUCCESS; jobs `132910245758` and `132910285304` SUCCESS; artifact `gemini-output`, SHA-256 `d3d7e7d5ea27d1656dbee67b9481554626df8e6704d9a0873f46790e3ce5505f`.
- Agent 2 run `43746303789`: COMPLETED / SUCCESS; jobs `132910251604` and `132910269920` SUCCESS; artifact `gemini-output`, SHA-256 `44971fc923161b1a8d8f0360340412de2825d58cfad5b1a86c1bb053a0f37bab`.
- Agent 3 run `43746305744`: COMPLETED / SUCCESS; jobs `132910258105` and `132910281559` SUCCESS; artifact `gemini-output`, SHA-256 `438906bfc7ce4b737de802b28c3ae27b6d6cd43a18b80c709a9ca293dabeda56`.
- Controller log confirms all three dispatches were ACCEPTED and correlated to these exact child runs, with the shared immutable target SHA unchanged. No dispatch error or timeout was reported.
- End-to-end status for this live ChatGPT connector → Issue #301 comment → Controller → three Gemini children path: VERIFIED.
