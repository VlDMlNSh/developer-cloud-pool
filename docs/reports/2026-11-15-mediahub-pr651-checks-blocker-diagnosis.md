# MediaHub PR #651 — exact-head checks and merge-blocker diagnosis

Date: 2026-11-15
Scope: read-only diagnosis of MediaHub OS PR #651. No source changes, merge, bypass, secret access, or agent dispatch.

## Immutable target

- PR: https://github.com/VlDMlNSh/mediahub-os/pull/651
- State: OPEN, ready for review (not draft), unmerged
- Head: `ec860a9b7698058d18a0b77efdce1643dd011bc8`
- Base: `main` @ `46e7395cc7a8755a096f1a8667b750177ed42011`
- GitHub PR metadata: `mergeable=true`, `mergeable_state=clean`.

## Exact-head CI

The commit check-runs endpoint returned 11 check runs:
- 9 completed SUCCESS, including all five required ruleset contexts.
- 2 completed SKIPPED: readiness/admission and dispatch jobs in pull_request context. This is expected: PR context must not launch agents.
- No failed or in-progress check runs were present in the check-runs collection.

Exact required contexts in active ruleset #26108066:
1. Astra Cloud Runtime Validation — SUCCESS
2. AI Factory verification — SUCCESS
3. provider contract verification — SUCCESS
4. Astra Verify — SUCCESS
5. Gemini workflow contract validation (Wave 284) — SUCCESS

The active ruleset is `MediaHub-main-autonomous-merge`, applies to the default branch, and enforces strict required status checks. It does not list the Freebuff Web app as a required context.

## Actual pending item

The exact-head check-suites endpoint returned 8 suites:
- 7 GitHub Actions suites: COMPLETED / SUCCESS.
- 1 suite from the `freebuff-web` GitHub App: ID `118402324737`, status QUEUED, conclusion null, and latest_check_runs_count=0.

The legacy commit-status endpoint reports `state=pending` with `total_count=0` and an empty statuses array. This does not identify a failing required context; it is consistent with the commit having no legacy Status API contexts while the GitHub Checks API carries the results.

The Freebuff Web queued suite is the only non-terminal check-suite observed. It is not named in the active ruleset's five required contexts. Its queued state may explain a UI message that checks are still running, but available evidence does not prove that it is the merge-blocking rule.

## Governance / review

- Active ruleset #26108066 was read successfully. It requires zero approving reviews, no CODEOWNER approval, no last-push approval, and resolution of all review threads. No bypass actors are configured.
- PR review submissions: 0.
- Inline review threads: 0.
- Branch-protection detail endpoint returned 403 to this integration; no inference is made about settings outside the readable ruleset.
- Since the PR has no review threads, the thread-resolution requirement is currently satisfied by absence of unresolved threads.

## Diagnosis and disposition

- The previous claim that exact-head CI was pending is stale: all five required contexts now pass on the immutable head SHA.
- No source-code defect is indicated by current exact-head CI. Do not add a meaningless code commit merely to make the UI look greener.
- The remaining visible anomaly is the queued Freebuff Web check suite, with zero check runs. The current GitHub connector exposes no check-suite re-request action, and the authenticated UI is not available in this session. No safe repair of that external app queue could be performed here.
- PR metadata says mergeable/clean, but the user reports the GitHub UI still prevents merge. The precise UI merge-block reason therefore remains NOT VERIFIED; capture the exact GitHub merge-box message or resolve the queued Freebuff App check before treating the PR as merge-ready.
- No Gemini child workflow was dispatched; no child run IDs, job IDs, or artifact digests exist. Three-agent execution remains NOT RUN / NOT QUALIFIED.
- No merge, ruleset mutation, status bypass, secret read, deployment, or paid resource action occurred.

## Evidence

- PR API: https://api.github.com/repos/VlDMlNSh/mediahub-os/pulls/651
- Exact-head check runs: https://api.github.com/repos/VlDMlNSh/mediahub-os/commits/ec860a9b7698058d18a0b77efdce1643dd011bc8/check-runs
- Exact-head check suites: https://api.github.com/repos/VlDMlNSh/mediahub-os/commits/ec860a9b7698058d18a0b77efdce1643dd011bc8/check-suites
- Active ruleset: https://api.github.com/repos/VlDMlNSh/mediahub-os/rulesets/26108066
- Controller PR-context run: https://github.com/VlDMlNSh/mediahub-os/actions/runs/43733462873
- Contract validation: https://github.com/VlDMlNSh/mediahub-os/actions/runs/43733462861
- Previous trusted-main probe failure (root cause already fixed in PR branch): https://github.com/VlDMlNSh/mediahub-os/actions/runs/43732834570

## Next step

Do not change source or merge. Resolve/re-run the queued Freebuff Web app check using its own GitHub App controls, then re-read the exact-head check-suites/check-runs and the PR merge box. If GitHub still blocks merge, record the exact UI message and map it to the active ruleset. After governance allows merge, repeat the owner `/probe` on trusted `main`; only then evaluate the bounded three-agent dispatch gate.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
