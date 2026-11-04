# 2026-11-04 — Worker dispatch authorization boundary audit

## Scope
Bounded read-only security pass on PR #7 and its Worker execution boundary. No workflow dispatch, Worker, DSH, Resource Probe, browser, model/provider call, secret access, or repository-variable mutation was performed.

## Live refs and evidence
- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch `Основной` HEAD: `692025e4a039aaf94c6683bb95da38b4f324fce8`.
- PR #7: OPEN / DRAFT / NOT MERGED.
- PR #7 head: `d60d26ae647940e702d646e572c861a8f68f523e`.
- Compare default...PR #7: 15 commits ahead, 0 behind.
- PR #7 exact-head CI run [41909811327](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/41909811327), job `126854055084`: COMPLETED / SUCCESS (static validation only).
- Worker workflow blob on default and PR #7: `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4` (identical).
- Supervisor blob on PR #7: `b2046dd9671c6bd5491f63a006d10239fbd3d3b1`.
- Approval tests blob on PR #7: `c7c7499d9d2bb4c123e72b86adb85369023c4284`.

## Finding — BLOCKING
PR #7 improves Supervisor-side owner approval: the `pool:ready` event is checked against the repository owner, approval is recorded by the Actions bot and bound to issue/SHA/profile, then consumed/revoked; stale-claim and dispatch-failure paths require fresh approval.

However, `.github/workflows/pool-worker.yml` remains unchanged. It still exposes `workflow_dispatch` and its validate job checks only:
- numeric issue number;
- 40-character target SHA;
- allowlisted profile;
- open issue;
- `pool:claimed` label;
- issue body SHA/profile match.

It does not independently verify the trusted dispatch provenance or a non-forgeable authorization bound to the current workflow run/attempt. Thus Supervisor-only enforcement does not close the direct/manual Worker invocation path. A public issue label/comment is not a secret capability.

## Recorded action
- Added a detailed security finding to [PR #7 discussion](https://github.com/VlDMlNSh/developer-cloud-pool/pull/7#issuecomment-6641832357), comment ID `6641832357`.
- Attempted formal REQUEST_CHANGES review; GitHub rejected it because the PR author is the repository owner. Therefore independent review remains NOT RUN; the discussion comment is not a substitute for independent review.

## Required remediation
Redesign the Worker execution boundary so manual/direct dispatch cannot enter the probe job. Worker must independently verify trusted dispatch provenance and bind authorization to issue number, immutable target SHA, exact allowlisted profile, and this workflow run/attempt. Add positive Supervisor-path tests and negative manual/direct-dispatch tests. Validate any proposed actor/provenance mechanism against actual GitHub event semantics before relying on it. Do not treat a publicly readable issue label/comment as a secret capability.

## Other state
- Repository Actions variable `POOL_DISPATCH_ENABLED`: NOT VERIFIED in this pass; do not infer its current value from historical records.
- Ruleset and SentinelX host were not re-read in this bounded pass; their current state is NOT VERIFIED here.
- No dispatch or privileged workload executed.
- Worker authorization: BLOCKED.
- PR #7 merge/acceptance: BLOCKED.
- Browser runtime, DSH qualification, Resource Probe, model routing and pool deployment: NOT RUN / NOT QUALIFIED.

## Next bounded step
Implement and test a Worker-side authorization mechanism on PR #7's branch, without enabling dispatch or running the Worker. Before choosing the mechanism, verify GitHub workflow_dispatch event actor/provenance semantics and ensure the proposed proof cannot be replayed or forged by a user with workflow-dispatch access. Then run exact-head static CI and request genuinely independent review.
