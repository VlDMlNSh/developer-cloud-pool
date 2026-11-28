# Pass 71 — live revalidation and no-secret workflow static-analysis pilot

Audit time: 2026-11-24 19:46:59 Europe/Vilnius  
Audit status: SUCCEEDED (live GitHub revalidation; bounded source review; local YAML/static checks)  
Contour A: BLOCKED / NOT ACCEPTED  
Contour B: DEFERRED

## 1. Immutable repository baseline

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch: `Основной`
- Default HEAD: `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9` (unchanged from Pass 70 baseline)
- Repository: public, not archived.
- Recursive default tree: 70 entries, `truncated=false`.
- Default combined commit statuses: empty.
- Exact-head Actions query returned two scheduled Supervisor runs for this SHA; no default-branch CI qualification was established.

### Current default workflows and runtime

The default tree contains only these five workflow files:

| Workflow | Blob SHA | Trigger / observed boundary |
|---|---|---|
| `dsh-runtime-evaluation.yml` | `df8a3788cd8ff4ba5c5b1009298f6bd81b80344d` | Manual only; no model calls in declared smoke path |
| `pool-contract-validation.yml` | `d6a4e62c1521d09df7835a8a1b918dc83e079504` | PR/push validation |
| `pool-supervisor.yml` | `3942189fc338b73b39627706ea001e1b87dc0ed8` | Scheduled heartbeat-only |
| `pool-worker.yml` | `6833692c45bbb0b6f7bf31c068a30888c53f5471` | Manual retired-worker stub; fails closed |
| `runner-resource-probe.yml` | `3b925d2ff7db77b669a1056b6ec04d4028640edf` | Manual read-only inventory |

Not present on default:
- protected web application / live Experience API;
- `proofs/d1-ledger` package;
- `next-event-controller.yml`;
- Gemini dispatch controller.

Latest observed current-HEAD Supervisor run:
- [Run 45339684803](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45339684803), event `schedule`, head SHA exactly `8c38bb0...`, SUCCESS.
- Job 138260077123, “Verify legacy dispatch remains retired”, SUCCESS; all returned steps succeeded.
- This proves only a heartbeat/retirement check, not an active executor or dispatch.
- The script exits nonzero if `POOL_DISPATCH_ENABLED` is literal `true`; successful run implies it was not literal `true` at that run time. The current variable value was not directly read and remains NOT VERIFIED.

## 2. Issues and governance

GitHub search returned 15 open Issues. Priority Issues remain OPEN:
- [#1 Governance](https://github.com/VlDMlNSh/developer-cloud-pool/issues/1)
- [#22 Protected read-only web console](https://github.com/VlDMlNSh/developer-cloud-pool/issues/22)
- [#26 Account-isolated routing and quota ledger](https://github.com/VlDMlNSh/developer-cloud-pool/issues/26)
- [#96 Exact owner-only /next admission](https://github.com/VlDMlNSh/developer-cloud-pool/issues/96)
- [#140 Canonical D1 admission and lease proof](https://github.com/VlDMlNSh/developer-cloud-pool/issues/140)
- [#94 Gemini controller](https://github.com/VlDMlNSh/developer-cloud-pool/issues/94)

Ruleset #26550182 was re-read from the GitHub API:
- enforcement active; selector exactly `refs/heads/Основной`;
- pull request required;
- deletion and non-fast-forward prohibited;
- review-thread resolution required;
- required approving reviews = 0;
- CODEOWNERS review disabled;
- last-push approval disabled;
- extra approval for unattributed changes disabled;
- bypass actors empty; current-user bypass = never.

The classic branch-protection endpoint returned 403 and is NOT VERIFIED in this pass. Do not conflate that inaccessible endpoint with the independently readable active Ruleset. The Ruleset does not enforce independent approval. No governance mutation was made.

## 3. Priority PRs, exact-head CI and reviews

All listed PRs are OPEN / DRAFT / UNMERGED. Review and thread counts below are current read results.

| PR | Head SHA | Ahead / behind default | Exact-head CI | Reviews / threads |
|---|---|---:|---|---:|
| [#24](https://github.com/VlDMlNSh/developer-cloud-pool/pull/24) | `7d3a34a1956c6a793f0bcc05ffaaf76c65c416e3` | 62 / 155 | Contract 42982847600 SUCCESS; OpenAPI 42982847694 SUCCESS | 0 / 0 |
| [#25](https://github.com/VlDMlNSh/developer-cloud-pool/pull/25) | `8f0c0c57cf24d476a27d456e80ffd1d8ced7ab85` | 29 / 155 | Contract 42228269689 SUCCESS; Web Prototype 42228269676 SUCCESS | 0 / 0 |
| [#30](https://github.com/VlDMlNSh/developer-cloud-pool/pull/30) | `ad9f9ac598a2414b5209b6923094b16be64630ae` | 35 / 155 | No run returned; NOT VERIFIED | 0 / 0 |
| [#31](https://github.com/VlDMlNSh/developer-cloud-pool/pull/31) | `5470fccbc4a5fe80a750f402d70d703757fc4c1d` | 36 / 155 | Web Prototype 42229917555 SUCCESS | 0 / 0 |
| [#168](https://github.com/VlDMlNSh/developer-cloud-pool/pull/168) | `caaba7345b698cfcfc92ad711ad1ed985980620d` | 107 / 2 | Historical lineage; not the selected current-base candidate | 0 / 0 |
| [#169](https://github.com/VlDMlNSh/developer-cloud-pool/pull/169) | `6db91bfbda955d213119976273dfba6dcaf6ac49` | 141 / 0 | No runs; NOT VERIFIED | 0 / 0 |
| [#170](https://github.com/VlDMlNSh/developer-cloud-pool/pull/170) | `7d900d9fe11b19f048548a3bed657b2549f8091f` | 33 / 0 | D1 45274455569 SUCCESS; Contract 45274455577 SUCCESS | 0 / 0 |
| [#171](https://github.com/VlDMlNSh/developer-cloud-pool/pull/171) | `423da55ca1e2d91c28572f88f60b494b59d56e9e` | 3 / 0 | No runs; statuses empty; NOT VERIFIED | 0 / 0 |

PR #30 and #31 are stacked on the old Hono prototype branch rather than directly on default; their direct comparison with current default shows 155 commits behind. PR #24/#25 are also 155 commits behind.

### PR #170 exact-head evidence

Both run records were re-read. Their metadata binds them to PR #170 head `7d900d9...` and base `8c38bb0...`:
- [D1 Ledger run 45274455569](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45274455569), job 138042499229 — SUCCESS. Steps include exact PR checkout, pinned Node, lockfile install, inert Worker check and fresh local D1 migration/authority tests.
- [Pool Contract run 45274455577](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45274455577), job 138042499753 — SUCCESS. Workflow syntax and security-contract steps succeeded.

These are local synthetic Workers/D1 proof tests, not hosted D1, executor, provider routing or production runtime evidence. No independent review exists.

PR #168 has 33 changed paths; all 33 also appear in PR #170's 38-file diff. PR #170 is the sole current-base D1 candidate. Do not merge or cherry-pick PR #168 independently.

### PR #169 documentation branch

- Branch: `docs/engineering-excellence-2026-11-23`.
- Head: `6db91bfbda955d213119976273dfba6dcaf6ac49`.
- 141 ahead / 0 behind; 57 files, +4,319 / -8.
- Four commits after Pass 70's last recorded docs commit changed only the Pass 70 report, checkpoint and Context Window.
- Exact-head Actions runs: 0; combined statuses empty; reviews/threads 0.
- This remains a working documentation branch, not canonical default.

### PR #171 non-dispatch intake

- Two files; live PR metadata reports +74 / -1.
- Workflow blob: `9402a803e21987b61813436647e43dac333c866c`.
- Validator blob: `6f82878beabeb2c0a1f65dfa66dee1c7de253482`.
- Exact owner-authored `/next` on Issue #96 only; PR comments excluded.
- Explicit `permissions: {}`; no checkout, external action, secret, D1/API write, dispatch or execution; output is audit-only.
- Exact-head Actions API returned 0 runs and combined statuses were empty. Local YAML parsing below is not GitHub Actions CI.
- Workflow exists only on PR branch, not default; it is not a live controller and does not create a D1 receipt.

## 4. GitHub Read Adapter path-segment branch

Branch `fix/github-read-adapter-path-segments-2026-11-06`:
- HEAD `dee17350864cb49e8c5dd41cf61859d77d3affca`.
- 38 ahead / 155 behind current default; 19 files in comparison.
- No PR; no associated CI; combined statuses empty.
- Source and negative tests exist, but test execution is NOT VERIFIED.
- The branch is a broad stale prototype, not a narrow patch. Do not transplant it wholesale; if needed, isolate the minimal fix on a fresh current-default branch.

## 5. D1 proof review — trusted clock improved; GitHub provenance remains blocking

PR #170 contains the trusted-clock correction that was not present in older PR #168 source snapshots.

Read-back source/test blobs:
- `acquire-attempt-lease.mjs`: `0b4798a8a0a38484682165ef8c5265807a04e27b`.
- `lease-fencing.test.ts`: `b7a72828ec4bc60809c37d48ddfc255131b717a9`.
- `admit-qualified-task.mjs`: `f4c788c1d5231cdce3a84d006b07407971ef6491`.
- `atomic-admission.test.ts`: `4f5e1fa8f0aec79936ca7117909f5a8fdddf17a2`.
- `record-attempt-reconciliation.mjs`: `9fc8007f2aad8630417ed0357d4e939777d756f8`.
- `reconciliation.test.ts`: `850f15e1860f775caa351f12e3c7ffdcf80c59f9`.
- `github-next-event.mjs`: `fdec14e9088fd1db186d0ee1541a6085ca84104a`.
- Inert Worker entrypoint: `5429e1abb2049a63562fa411b0d3b041f2f8276b`.

Confirmed improvements:
1. `acquireAttemptLease` requires an injected `trustedClock`, samples after executor authentication and primary pre-read, rejects invalid/rollback time, and derives lease timestamps from the trusted sample. Tests cover caller-supplied future/past timestamps being ignored, invalid clock, rollback and unavailable clock.
2. `admitQualifiedTask` requires trusted time; tests cover future/past caller timestamps, invalid/missing/throwing clocks.
3. `recordAttemptReconciliation` rechecks token lifetime after asynchronous evidence verification and again after the asynchronous primary read; tests cover expiry during verification and clock rollback.
4. All these proof adapters continue to return `dispatch:false` and `executionAuthorized:false`.
5. The D1 Worker entrypoint remains inert and returns 404.

Remaining HIGH trust gap:
- `bindGitHubNextEvent(context)` validates a caller-supplied context object. It checks the expected workflow ref and that `workflowSha` has SHA-40 syntax, but does not independently query authoritative GitHub run metadata, verify workflow file bytes/digest, prove workflow ancestry, or check the current default ref/race policy.
- The PR #171 intake workflow is observation-only and is not on default. It does not authenticate a live run or close the D1 provenance gap.
- Hosted D1, real OIDC/JWKS trust, a live controller, executor runtime and provider routing remain NOT VERIFIED / NOT QUALIFIED.

The older Pass 50 caller-time blocker is remediated in the current PR #170 source candidate; it must not be repeated as an unresolved defect for this candidate. The current main technical blocker is authoritative GitHub workflow/run/ref provenance.

## 6. Reuse First — bounded static-analysis pilot

Local environment:
- `actionlint`: not installed.
- `zizmor`: not installed.
- Outbound DNS/network unavailable in the local container; no binaries or packages were installed.

A bounded local parse/structural scan was still completed using PyYAML BaseLoader against six exact source copies: five default-branch workflows plus PR #171's intake workflow.

All six local files were checked with `git hash-object`; each local blob hash matched the GitHub blob SHA listed in the table above or PR #171 evidence. Results:
- YAML parse: 6/6 PASS.
- All `uses:` references in the six files are pinned to full 40-character commit SHAs.
- No secret/token references found by the bounded scan.
- No write permission scopes found.
- No direct `github.event.*` expression interpolation inside shell `run:` blocks found.
- This is a limited syntax/structural check, not a substitute for actionlint or zizmor semantic/security analysis.
- actionlint and zizmor remain CANDIDATE / NOT RUN; no dependency or CI enforcement was added.

Upstream references:
- actionlint: https://github.com/rhysd/actionlint and https://github.com/rhysd/actionlint/blob/main/docs/install.md
- zizmor: https://github.com/zizmorcore/zizmor (upstream describes GitHub Actions static analysis and MIT licensing)

## 7. Actions, metrics and safety

Completed:
- Read Context Window and latest Pass 70 report/checkpoint first.
- Re-read live repository metadata, default ref/tree, Issues, PR metadata, comparisons, exact-head Actions runs/jobs, reviews/threads and Ruleset.
- Re-read current PR #170 trusted-clock and GitHub event-binding source/tests.
- Completed six-file no-secret YAML/structural pilot with blob-hash verification.
- Prepared this documentation-only Pass 71 report/checkpoint/Context Window update.

Not performed:
- No GitHub workflow or job was started or re-run.
- No dispatch, agent, DSH, Resource Probe, provider/model call, hosted D1, deployment or production write.
- No secret, token or API-key value was read.
- No variable, secret, Ruleset or branch protection mutation.
- No merge, PR state change or source/runtime/schema/dependency change.
- No Contour B / MediaHub OS work.

Metrics:
- Workflow files locally parsed: 6/6.
- Code/schema/dependency changes: 0.
- Active engineering time: NOT MEASURED.
- CI latency / external wait: NOT MEASURED.
- Exact-head CI for PR #171 and PR #169: NOT VERIFIED.

## 8. Next bounded step — Pass 72

First investigate, read-only, why PR #171 has no exact-head Pool Contract Validation run despite changing `.github/workflows/**` and `scripts/**`; do not trigger or rerun a workflow.

Then prepare the authoritative GitHub provenance contract as a separate fail-closed proof task:
- trusted repository/owner/issue/comment identity;
- authoritative run ID and run attempt lookup;
- workflow path, workflow ref, workflow SHA and workflow-byte digest;
- exact target SHA and default-ref ancestry/race policy;
- rerun/replay and wrong-repository/ref negative cases.

Keep `dispatch:false` and `executionAuthorized:false`; do not wire the proof into Worker/Supervisor. Do not merge without exact-head CI, provenance review, active protections and independent review.

Contour A remains BLOCKED / NOT ACCEPTED. Contour B remains DEFERRED.
