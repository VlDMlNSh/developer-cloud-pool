# MediaHub Gemini Controller PR #651 — exact-head probe CI (Wave 318)

Date: 2026-11-15
Status: **PR-context probe VERIFIED; trusted-main owner probe NOT VERIFIED; three-agent batch NOT RUN.**

## Scope and repository boundary

This report records a cross-repository dependency relevant to the Cloud Pool's desired three-Gemini orchestration. The implementation under review is in `VlDMlNSh/mediahub-os`; this does not mean the independent Developer Cloud Pool is deployed or accepted. Do not merge repository state, authority, credentials, quotas, or acceptance status.

## Immutable refs observed

- MediaHub PR #651: https://github.com/VlDMlNSh/mediahub-os/pull/651
- Head: `ec860a9b7698058d18a0b77efdce1643dd011bc8`
- Base/main: `46e7395cc7a8755a096f1a8667b750177ed42011`
- PR remains OPEN / DRAFT / UNMERGED; mergeable=true, mergeable_state=blocked.
- No formal PR reviews or inline review threads were returned.
- Main branch reports protected=true, but protection.enabled=false and required status checks enforcement off in the returned branch metadata; this is not a substitute for full governance verification.

## Historical trusted-main issue_comment evidence

- Owner comment `/probe` on Issue #301, comment ID `6897245259`, triggered controller run #43732834570 on trusted `main` SHA `46e7395cc7a8755a096f1a8667b750177ed42011`.
- Run conclusion: FAILURE. Observer job #132868885854 passed; `assert_probe_context` job #132868906005 failed; readiness and dispatch jobs were skipped. The job log shows the reusable workflow lacked the original event payload through `github.event_path`, so trusted caller context could not be asserted. No child agent dispatch occurred.
- This is the exact production-trigger failure PR #651 is designed to fix. The corrected PR-head probe below is a pull_request-context test only; the owner issue_comment event must be repeated after the fix is merged to trusted `main`.

## Exact-head evidence

All listed checks below completed successfully on the exact PR head:

- Gemini workflow contract validation run #43733462861, job #132870808729: SUCCESS. YAML lint, legacy context tests, Wave 292 context-security tests, reusable-workflow contracts, transport contracts, child HMAC authorization contracts, trigger-path coverage and dispatch provenance adversarial contracts all passed.
- Controller PR-context probe run #43733462873:
  - observer job #132870831424: SUCCESS
  - assert_probe_context job #132870855225: SUCCESS
  - readiness_gate: SKIPPED
  - dispatch_and_monitor: SKIPPED
- Astra Verify run #43733462850: SUCCESS.
- Astra Cloud Runtime Validation run #43733462886: SUCCESS.
- Provider contract verification run #43733462875: SUCCESS.
- AI Factory verification run #43733463463: SUCCESS.
- Exact-head check-run collection returned all executed checks completed successfully; the two dispatch-related jobs were intentionally skipped.

## Security interpretation and remaining gates

The evidence proves the PR-context negative probe and contract suite only. It does not prove an owner-authored `/probe` issue_comment event against the trusted controller on `main`. No Gemini child workflow was dispatched, no secret values were inspected, and no merge or deployment occurred.

Next gates:
1. Obtain independent review.
2. Merge PR #651 only through normal repository governance.
3. Repeat owner `/probe` against trusted `main`; verify the actual issue_comment workflow run and caller-context assertions.
4. Verify required secret/variable presence without reading or disclosing values.
5. Only then perform an explicitly authorized, bounded three-agent controller dispatch and capture all three child run IDs, job outcomes, and artifact digests.

The PR's successful PR-context probe is not permission to dispatch agents. The three-agent batch remains **NOT RUN / NOT QUALIFIED**.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## 2026-11-15 follow-up — Wave 319: trusted-main failure diagnosis and /next trigger boundary

### Exact trusted-main probe diagnosis

- Re-read `main` ref: `46e7395cc7a8755a096f1a8667b750177ed42011`.
- Re-read the trusted-main `/probe` run [#43732834570](https://github.com/VlDMlNSh/mediahub-os/actions/runs/43732834570), jobs and logs. Observer job #132868885854 succeeded. Its log shows `EVENT_PATH` was empty inside reusable workflow `gemini-reusable-context-probe-wave284.yml`; Python raised `FileNotFoundError: ''`. The caller assertion job #132868906005 consequently failed with `OBSERVED_TRUSTED_CONTROLLER=false`. Readiness and dispatch jobs were skipped. No child dispatch occurred.
- PR #651 modifies the reusable workflow to pass caller event attributes explicitly as `workflow_call` inputs, removing dependence on `github.event_path`; PR-context probe and all contract checks remain green on PR head `ec860a9b7698058d18a0b77efdce1643dd011bc8`.

### Actual `/next` trigger audit

- Read the controller workflow source on trusted `main`. The only issue-comment launch predicate requires all of: issue number 301, not a pull request, comment body exactly `/next`, author association `OWNER`, and `MEDIAHUB_GEMINI_BATCH_ENABLED=true` at the readiness gate. Dispatch then additionally requires `github.ref == refs/heads/main` and both controller secrets to be present; missing credentials fail closed before child dispatch.
- Recent issue_comment runs [#43733619144](https://github.com/VlDMlNSh/mediahub-os/actions/runs/43733619144) and [#43733729653](https://github.com/VlDMlNSh/mediahub-os/actions/runs/43733729653) were generated by comments on PR #651, not by a command comment on Issue #301. Their comment IDs #6897353958 and #6897368632 point to PR #651; the controller correctly skipped all jobs because the event was not Issue #301. These are not three-agent dispatch attempts.
- The ChatGPT message `/next` does not itself create a GitHub Issue #301 comment. The connected GitHub actions available in this pass expose PR conversation commenting but no issue-comment creation or workflow-dispatch action for Issue #301. Therefore no trusted Issue #301 `/next` event was generated by this pass.
- The readiness variable's value and secret presence were not inspected; they remain NOT VERIFIED. No child workflow run IDs or artifacts exist for this attempted ChatGPT `/next` pass.

### Current disposition

- PR #651: OPEN / DRAFT / UNMERGED; head `ec860a9b7698058d18a0b77efdce1643dd011bc8`; exact-head contract and PR-context checks SUCCESS; formal independent review absent; merge not performed.
- Trusted-main owner `/probe`: FAILED on old main due empty `EVENT_PATH`; fix awaits normal governance merge and post-merge re-probe.
- ChatGPT `/next` → GitHub controller event: NOT CONNECTED / NOT VERIFIED. To invoke the existing controller without bypassing it, an owner must post the exact comment `/next` on [Issue #301](https://github.com/VlDMlNSh/mediahub-os/issues/301). The workflow will check the batch-enabled variable and required secrets and fail closed if unavailable.
- Three Gemini agents: NOT RUN / NOT QUALIFIED. No claim of dispatch, task execution, artifacts or independent review.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
