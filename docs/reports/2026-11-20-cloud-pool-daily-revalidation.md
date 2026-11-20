# Cloud Development Pool — daily revalidation

**Date/time:** 2026-11-20 19:04 Europe/Vilnius  
**Repository:** https://github.com/VlDMlNSh/developer-cloud-pool  
**Audit disposition:** SUCCEEDED (read-only repository and evidence audit)  
**Contour A:** BLOCKED / NOT ACCEPTED  
**Contour B:** DEFERRED  
**Runtime dispatch, agent launch, provider calls and deployment:** NOT RUN

## 1. Repository baseline and branch provenance

- Repository metadata confirms default branch **Основной**, public visibility and not archived.
- Observed default HEAD: **7e76bd2ebba5e3a27ccd32ecf7f52c2d10178250**. The current Context Window re-read and latest commit search agree; the commit message is “docs: snapshot Pass 33 D1 SQL hardening”. The connector does not expose a direct branch-ref detail endpoint, so this SHA is recorded as the observed HEAD rather than a newly fetched branch-object payload.
- The default HEAD is not the Pass 35 implementation. The D1 proof README path and the Gemini controller workflow path both return 404 on Основной; the executor registry path also returns 404.
- Branch search returned 100 names on page one and 67 on page two (at least 167 visible branch names). Search results do not provide branch SHAs; comparisons below use current PR API heads or the recorded path-fix commit.
- Documentation branch: docs/next-2026-11-19-integrated-contour-pass, PR #145, head **5fcb29110eb9f5fcb5ed3c2bcded1954324912a8**, base Основной at **b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5**. Compare against current default: **108 ahead / 3 behind**, merge base b81d2b5; PR remains OPEN / DRAFT / UNMERGED and mergeable=false. It remains a working documentation branch, not canonical state.
- Pass 35 implementation branch: feat/pass35-authenticated-d1-lease-adapter-2026-11-20, head **83b8e9d3b0bdeeb201e24a7a9d2fe042fb00694a**. Compare against current default: **69 ahead / 3 behind**, merge base b81d2b5. It is not merged.

## 2. Priority Issues

### Issue #1 — governance gate
OPEN; last updated 2026-11-18. The latest detailed ruleset evidence in the Issue #1 discussion is from 2026-11-18, not this audit:
- Ruleset 26550182, enforcement active, selector refs/heads/Основной.
- Pull request required; deletion and non-fast-forward prohibited; review-thread resolution required.
- Required approving reviews: **0**; CODEOWNERS review and extra approval for unattributed changes are disabled; no required status checks; bypass actors empty.
- This does not enforce an independent approval. The current ruleset detail could not be re-read through the available read-only GitHub connector in this pass; current exact ruleset state is therefore **NOT VERIFIED**.
- Current repository variable POOL_DISPATCH_ENABLED could not be read through the available integration and was not accessed through another route. Its current value is **NOT VERIFIED**. Historical false read-backs are not current evidence.

Evidence: https://github.com/VlDMlNSh/developer-cloud-pool/issues/1

### Issue #22 — secure web console
OPEN; last updated 2026-11-17. The 2026-11-17 owner amendment changes the first-release hosting boundary to GitHub-hosted infrastructure only: static GitHub Pages PWA/read-only status surface, with GitHub-native Issues/PRs/Actions as initial task and status primitives. Cloudflare or another always-on service is not a launch dependency. A static site is not a server-side OAuth/session/API backend; if that capability cannot be implemented securely with GitHub-native primitives, it remains BLOCKED and the UI stays within the read-only boundary.

No authenticated deployed console, live GitHub API, server-side session, browser/iPhone QA or deployment is demonstrated. PRs #24/#25 are old Cloudflare/Hono proposals and do not supersede the owner amendment.

Evidence: https://github.com/VlDMlNSh/developer-cloud-pool/issues/22

### Issue #26 — account-isolated routing and quotas
OPEN; last updated 2026-11-17. The owner amendment limits the initial CODE profile to one Claude Code + ECC + FCC executor and only explicitly verified free route(s). The 24-slot provider inventory is not an approved route list. Provider account identity, quota-domain mapping, free eligibility, secret presence and route health remain NOT VERIFIED. A second CODE profile is deferred until measured headroom exists; MEDIA remains a separate local-model-only profile with no API credentials. No secret values or provider calls were used.

Evidence: https://github.com/VlDMlNSh/developer-cloud-pool/issues/26

### Current control and integration Issues
- Issue #96 remains OPEN / PLANNED as the sole intended Cloud Pool owner-only /next admission surface. It states no controller implementation or dispatch is authorized yet. Its earlier four-Gemini-child amendment was superseded on 2026-11-17: Gemini is optional; first CODE executor is the priority. https://github.com/VlDMlNSh/developer-cloud-pool/issues/96
- Issue #140 remains OPEN and explicitly limits work to a local, no-secret D1 admission/lease proof. It prohibits hosted D1, dispatch, provider calls, deployment, merge and production actions. https://github.com/VlDMlNSh/developer-cloud-pool/issues/140
- Search returned 15 open Issues. Open-PR search returned 100 records on its first result page; exact total was not exposed by the connector.

## 3. Priority web-console PRs and read-adapter path fix

All four PRs remain OPEN / DRAFT / UNMERGED, have zero formal reviews and zero inline review threads, and diverge from current default from old merge base 64d2636d4500127e635c214ccfb722c6b3fcda80. Combined commit-status lookups returned zero status contexts for each SHA; the named Actions runs below are the positive CI evidence, not independent acceptance.

| PR | Current API head | Compare vs current default | Exact-head Actions evidence |
|---|---|---:|---|
| #24 | 7d3a34a1956c6a793f0bcc05ffaaf76c65c416e3 | 62 ahead / 149 behind | Pool Contract run 42982847600, job 130397061861, SUCCESS; OpenAPI run 42982847694, job 130397062519, SUCCESS |
| #25 | 8f0c0c57cf24d476a27d456e80ffd1d8ced7ab85 | 29 ahead / 149 behind | Pool Contract run 42228269689, job 127927220340, SUCCESS; Web Prototype run 42228269676, job 127927219846, SUCCESS |
| #30 | ad9f9ac598a2414b5209b6923094b16be64630ae | 35 ahead / 149 behind | Historical push run 42216422883, job 127887461269, SUCCESS; current PR-triggered run lookup returned zero, so this pass did not re-establish the run-to-head association |
| #31 | 5470fccbc4a5fe80a750f402d70d703757fc4c1d | 36 ahead / 149 behind | Web Prototype run 42229917555, job 127932882432, SUCCESS |

PR #30 and #31 are stacked on PR #25's older base d8521571ede91d7f6d7fb6d5ee37747ac94385ea, while PR #25's current API head is 8f0c0c57cf24d476a27d456e80ffd1d8ced7ab85. Do not treat these historical stacks as current-base integration. CI success and mergeable metadata do not replace independent review or a fresh current-base qualification.

### Path-segment branch

The branch fix/github-read-adapter-path-segments-2026-11-06 still exists. Its recorded commit is **dee17350864cb49e8c5dd41cf61859d77d3affca**; compare vs current default is **38 ahead / 149 behind**, merge base 64d2636, 19 changed files. No PR was found for this branch. Exact-head workflow lookup and combined status are empty; no independent review is recorded. CI and test execution are **NOT VERIFIED**.

Read-back:
- Source blob **9f4f9e5918e1c84fc8ad4b4f1369a92207394c63** rejects owner/repository path segments equal to “.” or “..” before URL construction. It retains exact HTTPS GitHub-origin and no-userinfo validation.
- Test blob **bd8ac8d97cdd673bb170a22d67ce08697cf46789** includes negative cases for ../issues, ./repo, owner/.. and owner/..
- PR #31's source blob **97d49834085f9ad4466ffaeae76bb927fe322e3b** does not contain this dot-segment guard; the correction is still isolated on the stale branch.
- Do not transplant its 19-file stack. Rebuild only the narrow guard and tests on a clean current-default branch after a fresh source review and approved exact-head CI path.

Branch: https://github.com/VlDMlNSh/developer-cloud-pool/tree/fix/github-read-adapter-path-segments-2026-11-06  
Source: https://github.com/VlDMlNSh/developer-cloud-pool/blob/fix/github-read-adapter-path-segments-2026-11-06/src/github-read-adapter.js  
Tests: https://github.com/VlDMlNSh/developer-cloud-pool/blob/fix/github-read-adapter-path-segments-2026-11-06/tests/github-read-adapter.test.js

## 4. Current D1 admission/lease chain

- PR #159 head deb14d34ce7387dec217cd79fc29403a91542c44: exact-head D1 run 44709527918 / job 136197384963 SUCCESS; Pool Contract run 44709527912 / job 136197385216 SUCCESS.
- PR #161 head 13cf7d43b7bdf645b1336498f32f449035994e7f: exact-head D1 run 44711819163 / job 136205134465 SUCCESS; Pool Contract run 44711819175 / job 136205134889 SUCCESS.
- PR #163 head 83b8e9d3b0bdeeb201e24a7a9d2fe042fb00694a: exact-head D1 run 44718354234 / job 136227400079 SUCCESS; Pool Contract run 44718354072 / job 136227400255 SUCCESS.
- PRs #159, #161 and #163 are OPEN / DRAFT / UNMERGED. Each has zero formal reviews and zero inline threads.
- PR #164 is a validation-only OPEN / DRAFT / UNMERGED PR against the frozen default. It must not be merged.

Pass 35 source/test read-back:
- Adapter blob **1b6232137dc53998d3efda36a32c809916e9d316**.
- Lease tests blob **22a3c0050f2a93969efb981a450a1027c92de7f6**.
- README blob **e88e020bcbd52695f64fc358b259db5e26db5f06**.
- The local Workers/Miniflare D1 suite reported 5 test files / 54 tests passed. The adapter requires an injected authenticator, binds principal executor/profile to task and attempt, uses conditional acquisition and primary-first readback, and keeps dispatch=false and executionAuthorized=false.
- This remains a local synthetic proof. The authenticator is an injected dependency; production GitHub Actions/OIDC issuer provenance is NOT VERIFIED. Hosted D1, real network acknowledgement loss, production executor identity and sandbox qualification are NOT VERIFIED. The adapter is not mounted into a deployed runtime. Lease renewal and explicit indeterminate-attempt reconciliation are absent; automatic takeover remains prohibited.

### Additional static finding — lease clock trust

The Pass 35 adapter accepts input.now from its caller and uses it for updated_at, started_at and lease expiry. The Pass 34 SQL trigger checks that expiry is after updated_at and no more than 900 seconds after updated_at, but does not compare either value to a trusted current clock. The injected authenticator does not return or validate time. Therefore the bounded TTL is only relative to caller-supplied time; a caller-controlled future timestamp is not rejected by the inspected adapter/trigger contract. This is a source-level finding, not a live exploit test. Before qualification, bind time to a trusted runtime clock or database-side time and add future/stale-clock negative tests.

## 5. Executor and controller state

- Default Supervisor source blob 2ae99f9efe1f59b22cfac1f5bf4780148228a233 is heartbeat-only. The scheduled workflow has contents:read and fails closed if POOL_DISPATCH_ENABLED is literal true. Current variable value remains NOT VERIFIED.
- Default Worker workflow remains a manual workflow_dispatch stub with permissions {} that immediately fails closed; it accepts no task and executes no DSH work.
- The Gemini batch-dispatch controller workflow is absent from Основной (404). Issue #96 is PLANNED; no controller or dispatch was launched.
- PR #107 Gemini candidate head 027492668e7721a5371b38997bc76a6cd6a50cd4 has one Pool Contract run 43868830501 SUCCESS, zero reviews and zero threads. Four secret-name existence, distinct Google account identity, quota independence, SDK/runtime and trusted caller provenance remain NOT VERIFIED. Gemini is optional, not the first executor.
- PR #116 Claude Code + ECC + FCC candidate current API head 2e944f13818f434cf135602c1c0e82051f1d3fa8. Exact-head Runner Qualification run 44286955337 / job 134741981861 SUCCESS; Pool Contract run 44286955360 / job 134741972786 SUCCESS. The no-secret job verified signed Claude Code distribution provenance, a Docker network-none sandbox primitive, FCC loopback readiness/shutdown, synthetic mock CLI handoff and selected ECC skills. It did not call a provider or prove free route/quota eligibility. PR #116 remains OPEN / DRAFT / UNMERGED, 74 ahead / 6 behind current default, mergeable=false. Its four COMMENTED review submissions are all authored by VlDMlNSh; they are not independent reviews. Inline threads: 0.
- No executor/controller has been dispatched or qualified for production task execution.

## 6. Governance, CI and acceptance boundary

- Exact-head Actions runs above completed SUCCESS with their listed jobs/steps.
- Combined commit-status endpoint returned zero contexts for PRs #24/#25/#30/#31, PR #163 and current default. Empty contexts are NOT VERIFIED, not a pass.
- Default-branch PR-triggered run lookup returned zero runs; this connector endpoint filters to PR-triggered runs and does not establish scheduled heartbeat runtime status. Default exact-head CI is NOT VERIFIED in this audit.
- Active ruleset details and POOL_DISPATCH_ENABLED were not re-read today. The last detailed ruleset read is the 2026-11-18 Issue #1 comment; the current values remain NOT VERIFIED.
- No authenticated web console, live GitHub OAuth/session, hosted D1, trusted production issuer, persistent runtime state, production worker, verified provider route/quota, independent security approval or published Contour A acceptance evidence exists in this evidence set.

## 7. Work performed and safety

1. Re-read the working-branch Context Window, Pass 35 report, checkpoint and current snapshot.
2. Re-read repository metadata, branch inventory, current Issues #1/#22/#26/#96/#140, PR metadata, exact-head workflow runs/jobs, review submissions and review threads.
3. Performed one bounded source-level audit of the GitHub read-adapter path-segment branch and the Pass 35 lease adapter/SQL guard. Verified source and test blob SHAs; no local tests were run for the path-segment branch.
4. No source/runtime/workflow/schema changes were made in this pass. Documentation publication is separate.
5. No secrets, token values, API keys or provider credentials were read. No workflows, agents, DSH, Resource Probe, provider/model calls, dispatch, deployment, production writes, variables/rulesets changes or merges were performed.

## 8. Blockers and next step

1. Governance: current ruleset detail and dispatch variable are NOT VERIFIED; the last known ruleset required zero approvals.
2. Web console: no authenticated server-side session/API and no deployed or browser-qualified surface; PR #24/#25/#30/#31 are stale, unreviewed stacks.
3. Read adapter: path-segment correction remains an unreviewed, untested stale branch.
4. Admission/lease: Pass 35 remains unmerged local synthetic proof; production issuer provenance, trusted clock, hosted D1, renewal and indeterminate reconciliation are missing.
5. Executor: PR #116 only proves bounded no-secret installation/sandbox primitives; no provider/account/quota qualification or independent review.
6. Independent acceptance: no independent review for the current D1 implementation chain; no Contour A acceptance evidence.

**Next bounded step:** close the Pass 35 clock-trust gap and define issuer-bound reconciliation for indeterminate attempts in a no-secret, test-first Pass 36 proof. Require a trusted time source, future/stale-clock negative tests, immutable reconciliation evidence and exact-head CI. Obtain independent review before any runtime integration. Keep all dispatch paths fail-closed.

**Final disposition:** Contour A BLOCKED / NOT ACCEPTED. Contour B DEFERRED.
