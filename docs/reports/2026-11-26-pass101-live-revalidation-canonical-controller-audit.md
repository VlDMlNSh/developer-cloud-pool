# Pass 101 — live revalidation and canonical owner /next controller audit

- Audit time: 2026-11-26 19:03:35 Europe/Vilnius (UTC+02:00).
- Scope: Contour A only; read-only GitHub revalidation, bounded source/dataflow review, documentation-only update.
- Audit result: VERIFIED.
- Candidate CI: SUCCEEDED on exact current heads #174/#175/#176.
- Controller-to-D1 composition, workflow-code attestation, live event, governance enforcement, runtime and independent review: NOT VERIFIED / BLOCKED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
- Active engineering time: NOT MEASURED; local tests newly run: 0.

## 1. Frozen canonical baseline

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch: `Основной`
- Direct branch-ref HEAD: `565404f84b6b86afb4dc2d8fa939341f42df6eca`
- Tree SHA: `0e473eee69b3c799a4ba5284103d3ca30e1bcae8`
- Repository: public, not archived.
- Default tree: 70 entries, not truncated.
- Five workflows on default: DSH Runtime Evaluation, Pool Contract Validation, Pool Supervisor, Pool Worker, Runner Resource Probe.
- `.github/workflows/next-event-controller.yml` and `.github/workflows/next-request-intake.yml`: direct Contents API reads at the frozen default SHA both returned 404.
- No web application or D1 proof package exists on the default tree.
- Default combined commit-status contexts: 0. Check-runs returned five successful scheduled Supervisor checks on this same HEAD; they all represent the retired-heartbeat guard, not Pool Contract or executor qualification.
- No new default commit since Pass 84 baseline. The existing two-commit history anomaly remains: `f8dbb46...` added a checkpoint directly to default, then `565404f...` reverted it. Current tree is restored; both commits were reported unsigned. Effective enforcement across all write paths remains NOT VERIFIED.

## 2. Issues and repository queue

GitHub Search API returned 17 open Issues (complete result, no truncation) and 132 open PRs (100 returned on the first page; full PR list not retrieved).

Priority Issues remain OPEN:
- [#1 Governance](https://github.com/VlDMlNSh/developer-cloud-pool/issues/1): active Ruleset still has zero required approvals and no required status-check rule. Last issue comment is 2026-11-18; no newer owner authorization to change the Ruleset was found.
- [#22 Secure Web Console](https://github.com/VlDMlNSh/developer-cloud-pool/issues/22): no authenticated/live console on default.
- [#26 Account isolation / routing / quotas](https://github.com/VlDMlNSh/developer-cloud-pool/issues/26): no qualified provider router or account-quota runtime.
- [#96 Owner-only /next](https://github.com/VlDMlNSh/developer-cloud-pool/issues/96): remains OPEN and PLANNED; no live `issue_comment` workflow runs returned.
- [#140 D1 admission/lease](https://github.com/VlDMlNSh/developer-cloud-pool/issues/140): remains OPEN. Its scope explicitly lists branch-protection changes among prohibited actions; no Ruleset mutation was attempted.

`POOL_DISPATCH_ENABLED`: NOT VERIFIED. No repository variables or secrets were read or changed.

## 3. Governance

Ruleset [#26550182](https://github.com/VlDMlNSh/developer-cloud-pool/rules/26550182) was read directly:
- enforcement active; selector exactly `refs/heads/Основной`;
- PR required; deletion and non-fast-forward restrictions enabled;
- review-thread resolution required;
- required approvals = 0; CODEOWNERS review disabled; last-push approval disabled;
- no required status-check rule;
- bypass actors empty; current-user bypass = never.

Classic branch-protection GET returned 403 (Resource not accessible by integration); branch API had previously reported `protected=false`. Keep these endpoints distinct. Ruleset enforcement is confirmed from the readable ruleset object, but it does not enforce independent approval or successful CI as merge prerequisites. No policy changes were made.

## 4. Priority PRs and branch divergence

All listed PRs are OPEN / DRAFT / UNMERGED; GitHub reports mergeable=true for the checked PR metadata. Formal reviews and inline review threads are 0 on every checked PR.

| PR / branch | Head SHA (prefix) | Ahead / behind current default | Exact-head Actions |
|---|---|---:|---|
| [#24](https://github.com/VlDMlNSh/developer-cloud-pool/pull/24) | `7d3a34a1` | 62 / 157 | Contract + OpenAPI SUCCESS |
| [#25](https://github.com/VlDMlNSh/developer-cloud-pool/pull/25) | `8f0c0c57` | 29 / 157 | Contract + Web Prototype SUCCESS |
| [#30](https://github.com/VlDMlNSh/developer-cloud-pool/pull/30) | `ad9f9ac5` | 35 / 157 | No run returned — NOT VERIFIED |
| [#31](https://github.com/VlDMlNSh/developer-cloud-pool/pull/31) | `5470fccb` | 36 / 157 | Web Prototype SUCCESS |
| [#168](https://github.com/VlDMlNSh/developer-cloud-pool/pull/168) | `caaba734` | 107 / 4 | Historical D1 + Contract SUCCESS; stale-base predecessor |
| [#169](https://github.com/VlDMlNSh/developer-cloud-pool/pull/169) | `eb35d292` | 260 / 2 | 0 exact-head runs |
| [#170](https://github.com/VlDMlNSh/developer-cloud-pool/pull/170) | `40281787` | 41 / 2 | Historical D1 + Contract SUCCESS; stale-base predecessor |
| [#171](https://github.com/VlDMlNSh/developer-cloud-pool/pull/171) | `423da55c` | 3 / 2 | Contract SUCCESS; superseded intake candidate |
| [#174](https://github.com/VlDMlNSh/developer-cloud-pool/pull/174) | `a8809c1d` | 10 / 0 | Contract SUCCESS |
| [#175](https://github.com/VlDMlNSh/developer-cloud-pool/pull/175) | `3d69bc94` | 40 / 0 | D1 + Contract SUCCESS |
| [#176](https://github.com/VlDMlNSh/developer-cloud-pool/pull/176) | `ca53ed9e` | 24 / 0 | Contract SUCCESS |

Exact run/job evidence:
- #24: [42982847600](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42982847600), job 130397061861 — SUCCESS; [42982847694](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42982847694), job 130397062519 — SUCCESS.
- #25: [42228269689](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42228269689), job 127927220340 — SUCCESS; [42228269676](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42228269676), job 127927219846 — SUCCESS.
- #30: no exact-head run returned — NOT VERIFIED.
- #31: [42229917555](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42229917555), job 127932882432 — SUCCESS.
- #174: [45677997233](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45677997233), job 139430608357 — SUCCESS.
- #175: [45690428935](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45690428935), job 139474112922 — SUCCESS; [45690428805](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45690428805), job 139474113226 — SUCCESS.
- #176: [45705794330](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45705794330), job 139527312668 — SUCCESS.

These are candidate-head CI results only. Combined commit-status contexts for default and #174/#175/#176 are empty (0); empty contexts are NOT VERIFIED, not a pass. No merge-result CI or independent review was observed.

### GitHub Read Adapter path-segment branch

- Branch `fix/github-read-adapter-path-segments-2026-11-06`.
- HEAD `dee17350864cb49e8c5dd41cf61859d77d3affca`.
- Compare: 38 ahead / 157 behind; 19 changed files.
- No PR associated; no exact-head workflow run returned.
- Keep the stale 19-file branch intact. If still needed, isolate only the path-segment correction on a fresh current-default branch in a separate bounded pass.

## 5. New canonical controller candidate — PR #176

PR #176 adds `.github/workflows/next-event-controller.yml` on its feature branch; it is still absent from default. The workflow blob is `822cc29c1b773ccff34ac7cbe4fa61cf94dce55a`.

Read-only source blobs:
- controller workflow: `822cc29c1b773ccff34ac7cbe4fa61cf94dce55a`;
- verifier: `0b84d907d5662b13f84a11f324c11d306a36ce32`;
- verifier tests: `e6f01267ba4ca11102853ce3e5e712b68683f0be`;
- Pool Contract workflow: `fea24191dea8273c1c9affb5f777e8bf22fe1b8f`;
- contract validator: `a1a5808baef1fd59b88387db5be9169219a6a1c5`.

Positive findings:
- `issue_comment.created` only; job gate requires exact `/next` on non-PR Issue #96.
- workflow/job permissions are read-only `contents/issues/actions`;
- checkout and setup-node actions are pinned to full commit SHAs;
- verifier reads repository, Issue #96, source comment, current Actions run, workflow metadata and default-branch ref;
- it rejects non-owner identity, wrong issue/body/event, wrong run/attempt/ref/SHA and reruns;
- result is `OBSERVED_ONLY`, `admission: NOT_CREATED`, `dispatch: NOT_AUTHORIZED`.

Blocking findings:
1. The workflow exists only in PR #176. GitHub returned zero `issue_comment` workflow runs repository-wide; no live event qualification exists.
2. PR #176 invokes only the API audit verifier. It does not call D1, create an admission or persist a source-comment receipt.
3. PR #175's `bindGitHubNextEvent(context)` still accepts a flat Actions-context object. The workflow API verifier result is not passed to this binder in the same run.
4. PR #175 migration 0017 binds the canonical workflow path and durable receipt, but SQL constraints cannot authenticate the caller's API observations.
5. PR #176 reads workflow metadata but does not fetch and bind the workflow file bytes/blob SHA at an immutable ref. Workflow-code identity/ancestry is NOT VERIFIED.
6. `workflowRun.path` format: the official GitHub REST workflow-run response example uses `.github/workflows/build.yml@main`; the verifier's `<workflow-path>@<default-branch-name>` expectation is consistent with the documented response shape. This is API-schema corroboration, not a live `issue_comment` run from this repository; event-specific runtime qualification remains NOT RUN.
7. Pass100 checkpoint/report on PR #176 record an earlier PR #176 head `6f9289e0...`; current actual head is `ca53ed9e...`. Candidate documentation needs exact-head refresh.

PR #175 remains the clean current-base D1 proof candidate (40 ahead / 0 behind) with exact-head D1 and Pool Contract SUCCESS. It is not hosted D1 or runtime evidence. PR #168/#170 are older-base D1 predecessors; do not merge them independently. PR #174's `owner-next-event-audit.yml` is a separate audit-only path and is not the canonical controller.

## 6. Documentation branch reconciliation

Working documentation branch: `docs/engineering-excellence-2026-11-23`.
- Current head before this Pass101 update: `eb35d292c7a5d89f7c36aec3668760e837e482ef`.
- PR #169 base SHA: `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`; compare 260 ahead / 2 behind current default.
- 115 changed files; exact-head Actions runs 0; formal reviews 0; review threads 0.
- Its Context Window blob `7f8f87c927bad1f72c94b7600fa3b3ef7740edde` begins with Pass75, while Pass97 report/checkpoint files are present. Thus the working branch's unified context header was stale.
- PR #176 contains a newer Context Window candidate (blob `7850036ebdd2061b6377d7798e253d81bbc93fe7`) and Pass100 docs, but those candidate docs still contain stale head references. Neither branch is canonical/default.

This Pass101 report/checkpoint and the Context Window header are being published only to the existing documentation branch. No merge is performed.

## 7. Runtime and executor state

- Latest default Supervisor run: [45811637973](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45811637973), job 139880704125 — SUCCESS. Its only functional step verifies legacy dispatch remains retired; this is not task execution.
- Worker remains retired/fail-closed.
- No canonical controller on default; no live `issue_comment` runs.
- Gemini controller absent from default.
- Claude Code/ECC/FCC runtime and provider routes: NOT RUN / NOT QUALIFIED.
- Hosted D1, live routing, quota ledger, authenticated Web Console, durable user-visible state and recovery: NOT VERIFIED.
- Issue #22 remains OPEN; Issue #26 remains OPEN.

## 8. Actions, safety and next step

Completed:
- Read the working Context Window and latest Pass97 report/checkpoint first; also read Pass100 report/checkpoint and Context Window from PR #176.
- Re-read live default ref/tree, repository metadata, open Issue/PR search, Ruleset, priority Issues, PR metadata, compare results, exact-head runs/jobs, reviews/threads and path-fix branch.
- Performed one bounded source/dataflow audit of PR #176 verifier/workflow against PR #175 D1 binder, context adapter, migration 0017 and integration tests.
- Prepared a documentation-only Pass101 update and read-back verification.

Not performed:
- no dispatch, workflow trigger/rerun, agent, DSH, Resource Probe, provider/model call, secret/token/API-key read, variable read/write, Ruleset mutation, D1 write, deployment, merge or production write;
- no local tests or live webhook test;
- no code/schema/workflow/dependency change;
- no provider identities or account quotas were mixed.

Next bounded step (Pass102): implement one same-run immutable API-attested envelope plus workflow-file blob identity, then pass that exact object into the D1 admission/receipt adapter. Add tests for authoritative `workflowRun.path` shape, workflow blob substitution, stale default-ref race, replay/rerun, actor/repository identity and ambiguous D1 acknowledgement. Keep `dispatch=false` and `executionAuthorized=false`. Do not change Ruleset or branch protection; Issue #140 excludes those changes.

Contour A remains BLOCKED / NOT ACCEPTED. Contour B remains DEFERRED.
