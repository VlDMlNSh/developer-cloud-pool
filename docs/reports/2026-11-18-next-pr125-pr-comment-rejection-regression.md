# /next — PR conversation-comment rejection regression — 2026-11-18

## Immutable target
- Repository: `VlDMlNSh/developer-cloud-pool`.
- Implementation PR: #125, branch `proof/d1-github-actions-context-adapter-2026-11-18`.
- Exact code head: `2ca95775982c711a289881e94eb664d5fe14ed5a`.
- Parent PR #114 head/base: `ab9461eb84b14fe230918391d5212f19ca25592c`.
- PR state at read-back: OPEN / DRAFT / UNMERGED; 19 ahead / 0 behind; mergeable=true; formal reviews: 0.

## Bounded change
Added one adversarial regression test to `proofs/d1-admission/test/github-actions-adapter.test.ts`:
- Models a pull-request conversation comment as an `issue_comment` event and supplies the GitHub `issue.pull_request` marker.
- Uses PR #125 as the issue number and its canonical API URLs.
- Requires explicit `DENY / WRONG_CONTROL_ISSUE`, `dispatch:false` and `executionAuthorized:false`.

The adapter already rejected `issue.pull_request`; this pass adds an explicit regression guard for a subtle GitHub event distinction: pull requests share the issue conversation/comment event family. No production code behavior changed.

## Exact-head CI
- Workflow [44255849885](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44255849885): COMPLETED / SUCCESS on `2ca95775982c711a289881e94eb664d5fe14ed5a`.
- Job [134637228939](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44255849885/job/134637228939): SUCCESS.
- The retrieved job log confirms `actions/checkout` fetched/checked out the exact SHA and `git log -1` returned the same SHA (not the PR merge commit).
- Workers-runtime suite: **22/22 PASS** across 2 files (12 D1 admission tests + 10 GitHub Actions context tests).
- `npm ci --ignore-scripts --no-audit --no-fund`, `npm run check` and `npm test` all completed successfully in the job.
- The changed test file was fetched back from GitHub; blob SHA `bf3c439a34c20c48503486b9fc50454de0e07a3e`; inserted regression was present.

## Limits
- This remains synthetic event/context fixtures and local Workers-runtime D1 emulation. It does not prove live GitHub webhook/event delivery, deployed controller workflow provenance or hosted D1.
- Default branch `Основной` remains at `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Production `.github/workflows/cloud-pool-next-controller.yml` and approved `.github/workflows/gemini-batch-dispatch-controller.yml` remain absent on default.
- PR #125 / #114 formal reviews: 0. Ruleset #26550182 requires 0 approvals and 0 status checks.
- Approval issuer, hosted transactional state, Supervisor leases/fencing/recovery, outbox delivery, worker identity, provider route/quota, remote Jarvis UI and persistent Engineering Workspace/restore remain NOT QUALIFIED / NOT VERIFIED.
- No secret values read, provider calls, dispatch, hosted resources, deployment, merge or Contour A acceptance.

## Status and next
- Explicit PR conversation-comment rejection regression: VERIFIED on exact PR head.
- PR #125 local D1 + context proof suite: 22/22 PASS.
- Independent A3 security review: NOT COMPLETE.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
- Next: independent A3 review of PR #125/#114 and governance remediation; retain fail-closed dispatch.

## References
- [PR #125](https://github.com/VlDMlNSh/developer-cloud-pool/pull/125)
- [Parent PR #114](https://github.com/VlDMlNSh/developer-cloud-pool/pull/114)
- [Issue #96](https://github.com/VlDMlNSh/developer-cloud-pool/issues/96)
- [Exact-head CI run](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44255849885)
- [GitHub issue_comment event documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)
- Canonical MediaHub map (separate project): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
