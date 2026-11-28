# Pass 84 — daily live revalidation and workflow provenance review

- Audit time: 2026-11-25 19:55:54 Europe/Vilnius (UTC+02:00)
- Scope: Contour A only; read-only GitHub revalidation, bounded source-level review, documentation update.
- Audit status: SUCCEEDED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
- Active engineering time: NOT MEASURED.

## 1. Immutable GitHub baseline

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch: `Основной`
- Default HEAD: `565404f84b6b86afb4dc2d8fa939341f42df6eca`
- Default tree: `0e473eee69b3c799a4ba5284103d3ca30e1bcae8`
- Repository visibility: public; archived: false.
- Recursive tree: 70 entries, not truncated.
- Default combined commit statuses: empty.
- Open Issues: 11 returned by `GET /issues?state=open` (PRs excluded).
- Open PRs: first 100 returned by `GET /pulls?state=open&per_page=100`; the page limit was reached, so a complete total is NOT VERIFIED.

The current default tree contains five workflows only: DSH evaluation, Pool Contract Validation, retired Supervisor heartbeat, retired Worker, and manual Resource Probe. It contains no `web/` application, no `proofs/d1-ledger/` package, no `next-event-controller.yml`, no `next-request-intake.yml`, and no Gemini batch-dispatch controller.

## 2. Default-branch history anomaly — governance deviation

The two commits after the prior default SHA `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9` are:

1. `f8dbb46ce4f167bf3e36c9898dd2fc683b8f8311` — `docs: add Pass 76 checkpoint`; added `docs/checkpoints/2026-11-25-pass76-owner-next-intake-verification.md` (10 lines).
2. `565404f84b6b86afb4dc2d8fa939341f42df6eca` — `revert: remove checkpoint written to default branch in error`; removed that file.

Both commits are single-parent commits and unsigned. The current default tree SHA is identical to the tree at the prior baseline (`0e473eee...`), so there is no net content change. The branch history nevertheless advanced by two commits, which makes PRs based on the old SHA two commits behind.

This is a confirmed default-branch write followed by a corrective revert. The Ruleset below says a PR is required, but the observed history contains these single-parent commits. The API does not establish the path or authorization mechanism that allowed them. Do not infer a bypass actor or claim the Ruleset was bypassed; effective enforcement across all write paths is NOT VERIFIED. Treat this as a governance deviation requiring owner review. No default-branch write or policy change was made in this pass.

Current HEAD commit verification: unsigned.

## 3. Governance

Ruleset [#26550182](https://github.com/VlDMlNSh/developer-cloud-pool/rules/26550182) was re-read:

- Enforcement: active; selector exactly `refs/heads/Основной`.
- Rules: deletion restriction, non-fast-forward restriction, pull request required, review-thread resolution required.
- Required approving reviews: 0.
- Required reviewers: none.
- CODEOWNERS review: disabled.
- Last-push approval: disabled.
- Required status checks: no rule configured.
- Bypass actors: empty; current-user bypass: never.

The classic branch API reports `protected=false`; GET classic branch protection returns 403 (Resource not accessible by integration). This does not negate the readable active Ruleset, but it prevents verification of the classic endpoint. More importantly, the Ruleset does not enforce independent approval or successful CI as merge prerequisites.

Issue #140 explicitly excludes branch-protection changes. No Ruleset or branch-protection mutation is authorized or performed. `POOL_DISPATCH_ENABLED` was not read; its current value is NOT VERIFIED. No secrets or credential values were accessed.

## 4. Priority Issues

All remain OPEN:

- [#1 Governance](https://github.com/VlDMlNSh/developer-cloud-pool/issues/1) — independent approval/status-check policy gap.
- [#22 Web Console](https://github.com/VlDMlNSh/developer-cloud-pool/issues/22) — no authenticated live console on default.
- [#26 Routing / Quotas](https://github.com/VlDMlNSh/developer-cloud-pool/issues/26) — account-isolated routing and quota ledger not qualified.
- [#96 Owner-only /next](https://github.com/VlDMlNSh/developer-cloud-pool/issues/96) — canonical control contract; no trusted-main controller on default.
- [#115 Claude Code + ECC + FCC runner](https://github.com/VlDMlNSh/developer-cloud-pool/issues/115) — candidate executor not qualified.
- [#140 D1 admission and lease](https://github.com/VlDMlNSh/developer-cloud-pool/issues/140) — local proof only; branch-protection changes excluded.
- [#172 Runner lifecycle](https://github.com/VlDMlNSh/developer-cloud-pool/issues/172) and [#173 Jarvis evolution](https://github.com/VlDMlNSh/developer-cloud-pool/issues/173) remain design/tracking issues, not runtime authorization.

Issue #94's Gemini controller is not present on default. The owner-approved first executor direction recorded in the current Context Window is Claude Code + ECC + FCC through a separately qualified free route; Gemini is optional, not a first-launch dependency.

## 5. Priority PRs, ancestry, CI and reviews

All listed PRs are OPEN / DRAFT / UNMERGED. Formal reviews and inline review threads are zero for #24/#25/#30/#31/#169/#170/#171. Combined status contexts are empty for the checked heads.

| PR | Head SHA | Ahead / behind current default | Exact-head Actions evidence |
|---|---|---:|---|
| [#24](https://github.com/VlDMlNSh/developer-cloud-pool/pull/24) | `7d3a34a1956c6a793f0bcc05ffaaf76c65c416e3` | 62 / 157 | Contract 42982847600 SUCCESS; OpenAPI 42982847694 SUCCESS |
| [#25](https://github.com/VlDMlNSh/developer-cloud-pool/pull/25) | `8f0c0c57cf24d476a27d456e80ffd1d8ced7ab85` | 29 / 157 | Contract 42228269689 SUCCESS; Web Prototype 42228269676 SUCCESS |
| [#30](https://github.com/VlDMlNSh/developer-cloud-pool/pull/30) | `ad9f9ac598a2414b5209b6923094b16be64630ae` | 35 / 157 | No run returned; NOT VERIFIED |
| [#31](https://github.com/VlDMlNSh/developer-cloud-pool/pull/31) | `5470fccbc4a5fe80a750f402d70d703757fc4c1d` | 36 / 157 | Web Prototype 42229917555 SUCCESS |
| [#169](https://github.com/VlDMlNSh/developer-cloud-pool/pull/169) | `b77a3823275e1e86b4e520c8fc9f22470563fc8f` | 201 / 2 | 0 exact-head runs; NOT VERIFIED |
| [#170](https://github.com/VlDMlNSh/developer-cloud-pool/pull/170) | `40281787c208af2df916f10af1dba073061ff0d3` | 41 / 2 | D1 45556287534 SUCCESS; Contract 45556287686 SUCCESS |
| [#171](https://github.com/VlDMlNSh/developer-cloud-pool/pull/171) | `423da55ca1e2d91c28572f88f60b494b59d56e9e` | 3 / 2 | Contract 45448087868 SUCCESS (historical) |

### CI/job read-back

- #24: jobs 130397061861 and 130397062519; all returned steps SUCCESS.
- #25: jobs 127927220340 and 127927219846; all returned steps SUCCESS.
- #30: no exact-head run returned; NOT VERIFIED.
- #31: job 127932882432; all returned steps SUCCESS.
- #170: run metadata binds both runs to exact head `40281787...`; job 139009015200 (D1) and job 139009016019 (Pool Contract) have all returned steps SUCCESS. The D1 job is local synthetic Workers/D1 validation, not hosted D1 or runtime evidence. The run metadata still reports the PR base SHA as `8c38bb...`, while current default is `565404...`; current-base requalification is therefore NOT VERIFIED.
- #171: job 138637290205 succeeded on the exact PR head, but it was a pull_request validation run, not a real `issue_comment.created` event. No live owner /next event was tested.
- #169: exact-head Actions runs 0; combined statuses empty; reviews 0; threads 0.

PR #169 is documentation-only by changed-path audit (87 changed paths, zero non-documentation paths), but it is a large 201-commit branch and two commits behind current default. Keep it as a working documentation branch, not canonical.

PR #170 is the current D1 candidate, but it remains draft and unreviewed. PR #168 is the older D1 predecessor and must not be independently merged. No merge was performed.

## 6. Bounded source review — GitHub workflow provenance

Reviewed immutable PR source:

- PR #171 workflow blob `9402a803e21987b61813436647e43dac333c866c`: `.github/workflows/next-request-intake.yml`.
- PR #171 contract-validator blob `6f82878beabeb2c0a1f65dfa66dee1c7de253482`.
- PR #170 context adapter blob `574d289964b5d908395573b91c6f890305c94eeb`.
- PR #170 event binder blob `31a254e28f42eee3a3add07ca5fae2c5a46cc8b57`.
- PR #170 inert Worker blob `5429e1abb2049a63562fa411b0d3b041f2f8276b`.

Confirmed:
1. PR #171 is observation-only: `permissions: {}`, no checkout, external Action, secret, D1 write, API call or dispatch. It gates exact `/next`, Issue #96, non-PR comment and owner login; it writes only a step summary.
2. PR #171 does not map numeric actor/owner/repository IDs, default ref/target SHA, workflow ref/SHA, run ID/attempt into the D1 binder. It does not persist a durable source-comment receipt.
3. PR #170's `mapGitHubActionsContext` is a pure adapter. It maps runner context and environment values, but does not authenticate the runner or independently verify GitHub run metadata, workflow-file bytes/digest, workflow ancestry or current default-ref race policy.
4. The binder checks identity fields, exact event/command, expected workflow ref and SHA syntax, and keeps `dispatch:false` and `executionAuthorized:false`. It does not independently resolve the run/workflow/ref provenance.
5. No default-branch workflow invokes this adapter. The D1 Worker entrypoint is inert and returns 404.

Therefore the current D1 work remains a local synthetic proof. The owner-only controller, trusted workflow provenance, durable admission integration and actual execution authorization are NOT VERIFIED / NOT RUN.

## 7. GitHub Read Adapter path-segment branch

Branch `fix/github-read-adapter-path-segments-2026-11-06` remains at immutable HEAD `dee17350864cb49e8c5dd41cf61859d77d3affca`.

- Compare to current default: 38 ahead / 157 behind.
- 19 changed files.
- No PR found/associated.
- Exact-head Actions runs: none returned.
- Combined statuses: empty.
- Static source/tests exist, but test execution remains NOT VERIFIED.

Do not transplant this stale 19-file prototype. If still needed, isolate the minimal path-segment correction on a fresh current-default branch after a separate bounded review.

## 8. Executor and runtime state

- PR #116 remains OPEN/DRAFT/UNMERGED; head `2e944f13818f434cf135602c1c0e82051f1d3fa8`; compare 74 ahead / 14 behind.
- Runner Qualification run 44286955337/job 134741981861 SUCCESS; Pool Contract run 44286955360/job 134741972786 SUCCESS. Four review submissions are COMMENTED by the repository owner, not independent approvals.
- The current workflow-artifact listing for run 44286955337 returned zero artifacts. Historical report records artifact expiry date 2026-11-25; currently downloadable artifact evidence is NOT VERIFIED.
- Existing proof demonstrates installation feasibility only. Actual CODE worker execution inside a no-egress sandbox, provider egress allowlist, real Claude session, free route/account/quota qualification and hosted-use entitlement remain NOT VERIFIED.
- Current default Supervisor run [45597108398](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45597108398) SUCCESS, job 139145990252. Steps only verify retired legacy dispatch state. This is a heartbeat/retirement check, not executor execution.
- Supervisor remains heartbeat-only; Worker remains retired/fail-closed. Gemini controller absent from default. Hosted D1, live routing, web console and production dispatch are NOT VERIFIED / NOT RUN.

## 9. Evidence links

- [Default HEAD](https://github.com/VlDMlNSh/developer-cloud-pool/commit/565404f84b6b86afb4dc2d8fa939341f42df6eca)
- [Temporary checkpoint commit](https://github.com/VlDMlNSh/developer-cloud-pool/commit/f8dbb46ce4f167bf3e36c9898dd2fc683b8f8311)
- [Corrective revert](https://github.com/VlDMlNSh/developer-cloud-pool/commit/565404f84b6b86afb4dc2d8fa939341f42df6eca)
- [Ruleset #26550182](https://github.com/VlDMlNSh/developer-cloud-pool/rules/26550182)
- [Issue #1](https://github.com/VlDMlNSh/developer-cloud-pool/issues/1), [#22](https://github.com/VlDMlNSh/developer-cloud-pool/issues/22), [#26](https://github.com/VlDMlNSh/developer-cloud-pool/issues/26), [#96](https://github.com/VlDMlNSh/developer-cloud-pool/issues/96), [#140](https://github.com/VlDMlNSh/developer-cloud-pool/issues/140)
- [PR #169](https://github.com/VlDMlNSh/developer-cloud-pool/pull/169), [#170](https://github.com/VlDMlNSh/developer-cloud-pool/pull/170), [#171](https://github.com/VlDMlNSh/developer-cloud-pool/pull/171)
- [PR #170 D1 run](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45556287534), [Pool Contract run](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45556287686)
- [PR #171 Contract run](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45448087868)
- [Supervisor heartbeat run](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45597108398)

## 10. Actions, limits and next step

Completed: read Context Window and Pass 83 report/checkpoint first; re-read default branch HEAD/tree, Ruleset, open Issues/PRs, priority PR metadata, exact-head Actions runs/jobs, review submissions/threads, path-fix ref and relevant source blobs; performed one bounded source-level workflow-to-binder provenance review; prepared this report/checkpoint/Context Window update.

Changes made to runtime/source/schema/workflows/dependencies: 0. Tests newly run: 0. Documentation changes only. No workflows were triggered or rerun; no dispatch, agents, DSH, Resource Probe, provider/model calls, secret/variable reads, hosted D1, deployment, merge, branch-policy mutation or production write. No provider identities or credentials were mixed.

Next bounded step (Pass 85): obtain explicit owner-policy authorization before any Ruleset change, because Issue #140 excludes branch-protection changes; if authorized, design required approval and exact status-check contexts. In parallel, keep PR #170 draft until its base ancestry is reconciled and the trusted workflow/run/ref provenance path is independently reviewed. No merge or dispatch. If authorization is not given, preserve the current policy and keep governance BLOCKED.

Contour A remains BLOCKED / NOT ACCEPTED. Contour B remains DEFERRED.
