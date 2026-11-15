# Per-/next Gemini orchestration — current gate reconciliation (2026-11-15)

## Result

**IMPLEMENTED IN CONTROLLER / NOT AUTOMATIC FROM CHAT / NEXT DISPATCH BLOCKED.**

The approved MediaHub controller already contains a three-child dispatch path. A ChatGPT conversation message /next is not a GitHub Actions event and does not invoke it. The supported event bridge is one exact owner-authored /next comment on MediaHub Issue #301. The controller then resolves one immutable MediaHub main SHA, signs three distinct bounded task envelopes, dispatches the three fixed child workflows, and monitors child runs/jobs/artifact digests.

This pass did not create an Issue #301 comment and did not dispatch any agent. No gate was bypassed.

## Immutable source and current evidence

- MediaHub main snapshot: 41c13e1c2b17ac48dc51c9963a9cda140f79ddb0.
- Controller path: .github/workflows/gemini-batch-dispatch-controller.yml.
- Controller blob read from main: 0a1246f6755020faf8b7e48d07bfff790bbaece3.
- The controller supports issue_comment created, restricted to Issue #301, exact body /next, author association OWNER; trusted controller ref refs/heads/main; MEDIAHUB_GEMINI_BATCH_ENABLED == true; controller secrets MEDIAHUB_GITHUB_TOKEN and MEDIAHUB_DISPATCH_HMAC_KEY; one shared full 40-hex target SHA; three signed child dispatches (Agent 1 engineering, Agent 2 contract/research, Agent 3 security/provenance); unique UUID dispatch IDs; duplicate-comment suppression; child run/job correlation and artifact digest collection.
- workflow_dispatch alternative requires mode=agents and explicit confirm=true; this is not a chat-message trigger.
- Non-launching probe [43722469665](https://github.com/VlDMlNSh/mediahub-os/actions/runs/43722469665) ran in PR context. Probe and assertion succeeded; dispatch/admission jobs were SKIPPED. This is not evidence of trusted-main probe or live credential readiness.
- PR caller-context denial probe [43722469720](https://github.com/VlDMlNSh/mediahub-os/actions/runs/43722469720) succeeded and exercised the non-trusted PR context.
- MediaHub PR [#649](https://github.com/VlDMlNSh/mediahub-os/pull/649) repairs branch collisions for all three children using dispatch-ID-specific branches. Exact head 38aafbe40c6a6d55913f13ae9bf1691fa6b2221e had 11 checks at last recorded inspection: 9 SUCCESS, 2 expected SKIPPED in PR context, no failed/pending checks. Formal independent reviews: 0. Actual controller-dispatched exercise of repaired children: NOT RUN.
- MediaHub PR [#650](https://github.com/VlDMlNSh/mediahub-os/pull/650) proposes a separate single-agent review mode for #649. It is OPEN/DRAFT/UNMERGED and does not itself dispatch a reviewer.
- Current variable/secret metadata and effective scope: NOT VERIFIED; secret values were not read. Trusted-main no-secret probe: NOT VERIFIED. Independent security review and effective governance approval for controller repair: NOT VERIFIED.

## Gate decision

| Gate | Status |
|---|---|
| Controller three-child orchestration code | IMPLEMENTED / SOURCE VERIFIED |
| Chat /next directly triggers Actions | NO — requires explicit Issue #301 comment bridge |
| Issue #301 owner-comment trigger contract | IMPLEMENTED |
| Current variable/secret metadata and scope | NOT VERIFIED |
| Trusted-main no-secret probe | NOT VERIFIED |
| PR #649 exact-head PR-context checks | 9 SUCCESS / 2 SKIPPED (last observed) |
| PR #649 independent review | NOT VERIFIED (0 reviews) |
| Repaired 3/3 child dispatch exercise | NOT RUN |
| Automatic invocation on every chat /next | NOT IMPLEMENTED in this chat integration |
| Contour A acceptance | NOT ACCEPTED |

## Why no dispatch was performed

The project contract forbids bypassing the approved controller. The controller repair is still unmerged and unreviewed; trusted-main readiness and secret/variable metadata are not established. A new Issue #301 comment now would be a real dispatch request, but preconditions are not met. Correct state: BLOCKED / NOT RUN.

## Next bounded steps

1. Obtain independent security review and verify effective governance for MediaHub PR #649.
2. Integrate the branch-collision repair only after review/governance gates pass.
3. Verify Actions variable and secret metadata/scope only, without reading values; run the trusted-main non-launching probe.
4. Run exactly one controlled three-agent wave through the Issue #301 owner-comment trigger.
5. Reconcile all three child run IDs, job IDs, unique branch names, PRs, artifacts/digests, exact-head CI and independent reviews. Require 3/3 before marking the wave VERIFIED.
6. For every ChatGPT /next, the chat integration must be authorized and implemented to create exactly one owner-authored Issue #301 comment per eligible turn, then reconcile the existing comment/run before retrying. The current chat connector does not do this automatically.

No secrets, provider calls, merge, deployment, paid fallback, or Contour B work occurred.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
