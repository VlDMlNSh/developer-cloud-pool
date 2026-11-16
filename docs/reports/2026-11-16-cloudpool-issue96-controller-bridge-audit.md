# Cloud Pool Issue #96 — trusted /next controller scope and bridge audit
Date: 2026-11-16
Repository: VlDMlNSh/developer-cloud-pool
Immutable default-branch target: 35208f0ef28f0ac031a7acdf35fc90ccc9b16845 (`Основной`)
Status: VERIFIED (source inspection and documentation only); runtime dispatch NOT RUN; Contour A NOT ACCEPTED.

## Executive finding
The Cloud Pool control plane and the MediaHub Gemini controller are separate systems. Cloud Pool Issue #96 is the control issue for Cloud Pool `/next`; its implementation must remain in `VlDMlNSh/developer-cloud-pool`. The MediaHub workflow `.github/workflows/gemini-batch-dispatch-controller.yml` is scoped to MediaHub Issue #301 and has its own dispatch authority, credentials and child workflows. It is not an approved cross-repository bridge for Cloud Pool Issue #96. Do not dispatch Cloud Pool work by reusing the MediaHub workflow or its secrets.

## Cloud Pool candidate inventory observed
- Issue #96 remains OPEN: https://github.com/VlDMlNSh/developer-cloud-pool/issues/96
- PR #97 is a pure fail-closed admission predicate. It validates event, exact command, owner association, issue, trusted ref and immutable SHA, but explicitly does not persist idempotency state and does not dispatch.
- PR #102 is a Cloud Pool-native `issue_comment.created` read-only admission probe restricted to Issue #96. It has read-only contents permission, derives source-comment identity and includes negative tests, but explicitly has no durable ledger, distributed lock, dispatch, child jobs or provider calls.
- PR #107 is a four-slot Gemini client candidate with four isolated tasks/credential slots and eight fake-client contract tests. It explicitly has no production Supervisor/Worker integration, live provider calls, durable recovery, SDK runtime qualification or proof of four distinct upstream accounts.
- PR #108 is bounded client hardening (fixed model allowlist, 45-second request abort, 8,000-character output cap) stacked on #107.
- PR #109 integrates 11 fake-client contract tests on the default-branch validation workflow. Its own evidence states SDK dependency/lockfile and runtime are not verified; no provider calls, dispatch or independent security review.
- The four-role candidate and the read-only /next admission candidate are separate pieces. Their presence in separate PRs does not establish an integrated controller.

## Cross-repository boundary
The MediaHub workflow currently accepts Issue #301 `/next` (OWNER association) and dispatches three fixed child workflows for the three named agent roles. Its controller blob observed during this pass: `7799f0fc713c5bd772ce6820df40a926a83445c8`. It is not a four-agent Cloud Pool controller and must not be treated as one. Cloud Pool needs its own trust boundary and its own permissioned execution path.

## Required integration sequence (fail-closed)
1. Rebase/reconcile Cloud Pool PR #102 admission probe and PR #97 predicate on the same immutable default-branch base; do not assume their tests compose.
2. Define a durable idempotency/lease primitive with atomic create/claim, expiry, fencing generation, owner/task/SHA binding, and compare-and-swap finalization. Ambiguous dispatch outcomes must transition to NEEDS_REVIEW, never release the same approval for replay.
3. Keep the event receiver read-only. A separately authorized dispatcher must re-fetch and validate the original comment, issue state, actor numeric ID/OWNER association, default branch, target SHA, policy and dispatch gate immediately before consuming a single-use approval.
4. Integrate four isolated child tasks from PR #107 into the Cloud Pool controller only after the production caller boundary, quota policy, runtime SDK/lockfile and secret metadata gates are verified. Each child must receive a distinct bounded task, fixed role, same immutable target SHA, and least-privilege credentials; never pass secret values in task payloads.
5. Record source comment ID, event/run IDs, target SHA, fencing generation, child run/job IDs, terminal conclusions and artifact digests. Reconcile incomplete/unknown dispatch outcomes without duplicate execution.
6. Require exact-head CI, independent security review, effective ruleset/governance read-back and an authorized live no-paid-fallback qualification before enabling provider calls.

## Evidence and limits
- Source refs inspected: Cloud Pool default HEAD `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`; Issue #96; PR candidates #97, #102, #107, #108, #109; MediaHub Issue #301 and controller file.
- The source PR descriptions identify their own scope and limitations; none authorizes live dispatch.
- No secret values were read. No Gemini API calls, workflow dispatches, child jobs, deployments, merges, or paid resources were invoked.
- No code or workflow was modified in this pass. This is a source-bound architecture/scope audit and decision record, not an implementation of durable locking.
- Tests run in this pass: none. Existing PR test evidence is historical/source-described and must be refreshed against exact current heads before acceptance.

## Decision
Keep Cloud Pool Issue #96 as the only Cloud Pool /next intake. Do not bridge to MediaHub Issue #301 or its controller. Continue with a Cloud Pool-native durable admission/lease/fencing implementation, then integrate four Gemini roles behind that controller. Current status: admission probe PARTIAL; four-agent client candidate PARTIAL; durable lease/fencing NOT VERIFIED; integrated four-agent dispatch NOT RUN; Contour A NOT ACCEPTED.
