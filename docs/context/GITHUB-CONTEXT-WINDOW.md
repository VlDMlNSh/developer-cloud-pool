# GITHUB CONTEXT WINDOW — DEVELOPER CLOUD POOL

## CURRENT RECONCILED SNAPSHOT — 2026-11-18

GitHub is the persistent source of truth for Cloud Pool. Before each /next pass, re-read live refs, current issue comments, PR heads/bases/reviews, exact-head CI, governance and active blockers. Historical reports are evidence only; they do not supersede live GitHub state.

### Repository and canonical refs
- Repository: `VlDMlNSh/developer-cloud-pool`, public.
- Default branch: `Основной`; observed HEAD: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- PR #120 — Reference Architecture 1.0 parent: OPEN / DRAFT / UNMERGED; head `67a0cb1b84f7829bb3fc95e8e9f88b509c401bc8`; base default HEAD above.
- PR #124 — Unified Realization Integration: OPEN / DRAFT / UNMERGED; head immediately before this context/checkpoint refresh was `401d1a13166eca581ff8e0b59bf6e2f77c8a74fb`; base PR #120 head above; mergeable=true. Contains Unified Realization Map, Architecture Assurance Addendum, independent scorecard and reports/checkpoints. All remain proposed until reviewed/merged.
- PR #114 — Atomic D1 Owner /next Admission parent: OPEN / DRAFT / UNMERGED; head `ab9461eb84b14fe230918391d5212f19ca25592c`; base default HEAD; mergeable=true. Local Workers-runtime D1 atomic admission proof, 12/12 tests on its verified head; not hosted DB or live webhook qualification.
- PR #125 — GitHub Actions Context Adapter: OPEN / DRAFT / UNMERGED; branch `proof/d1-github-actions-context-adapter-2026-11-18`; exact latest code head `edfeaef277fe709a9acc37d99b7bd3cda3003774`; base PR #114 head above; 18 ahead / 0 behind; mergeable=true; formal reviews 0.
- Issue #96 is the only intended Cloud Pool owner-only `/next` control surface. Latest owner instruction reiterates that four Gemini roles are requested per /next but do not override gates; controller must be the approved Cloud Pool default-branch workflow. Four live dispatches are NOT RUN while controller/security gates remain unqualified.

### PR #125 implementation and evidence
- `bindGitHubActionsContext` composes the existing D1 admission predicate with runner-provided `GITHUB_*` context values.
- Validates GitHub Actions marker/server, repository and owner IDs against the event payload, exact `issue_comment.created`, exact open Issue #96 URL, owner numeric ID/login/OWNER association and exact body `/next`.
- Requires default ref `refs/heads/Основной`, the fixed future controller workflow reference `.github/workflows/cloud-pool-next-controller.yml@refs/heads/Основной`, valid `GITHUB_SHA` / `GITHUB_WORKFLOW_SHA`, positive `GITHUB_RUN_ID` and `GITHUB_RUN_ATTEMPT`.
- Derives target/default-head SHA only from `GITHUB_SHA`, controller code SHA from `GITHUB_WORKFLOW_SHA`, and run identity from `GITHUB_RUN_ID` + `GITHUB_RUN_ATTEMPT`. Persists run attempt in the D1 receipt and binds it into the envelope digest.
- Regression test covers one source comment admitted at run attempt 1 and replayed at attempt 2 with the same run ID. It verifies the original immutable receipt/task/approval/outbox remain singletons and receipt retains attempt 1.
- All outcomes preserve `dispatch:false` and `executionAuthorized:false`.
- Exact-head PR CI [44253572758](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44253572758), job [134629803561](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44253572758/job/134629803561): COMPLETED / SUCCESS on exact head `edfeaef277fe709a9acc37d99b7bd3cda3003774`. Job log proves checkout and `git log -1` both returned that SHA, not the PR merge commit.
- Workers-runtime suite: **21/21 PASS** across 2 files (12 D1 transaction tests + 9 GitHub Actions context tests). `npm ci --ignore-scripts --no-audit --no-fund` and `npm run check` passed.
- Exact-head push validation [44253567272](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44253567272): COMPLETED / SUCCESS on the same SHA.
- PR #125 has 0 formal reviews. A top-level verification comment was added: [PR #125 evidence comment](https://github.com/VlDMlNSh/developer-cloud-pool/pull/125#issuecomment-6971317677).
- Report: [2026-11-18 GitHub Actions context adapter proof](../reports/2026-11-18-next-github-actions-context-adapter.md).
- Checkpoint: [2026-11-17 independent audit integration checkpoint, appended 2026-11-18](../checkpoints/2026-11-17-independent-audit-integration-pass.md).

### GitHub Actions event semantics (verified against official docs)
- For `issue_comment`, GitHub documents `GITHUB_SHA` as the last commit on the default branch and `GITHUB_REF` as the default branch.
- The `issue_comment` workflow triggers only when its workflow file exists on the default branch. Therefore the current PR #125 context adapter is synthetic composition evidence, not a deployed controller.
- Official references: [Events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows); [Default environment variables](https://docs.github.com/en/actions/reference/workflows-and-actions/variables).

### Governance, security and runtime blockers
- Active ruleset #26550182 targets `refs/heads/Основной`; enforcement active; requires PR and review-thread resolution; deletion and non-fast-forward prohibited. It still requires **0 approving reviews and 0 status checks**; no bypass actors. Classic branch protection API reports `protected=false`. Governance is insufficient for critical acceptance.
- PR #125 and PR #114 formal independent reviews remain 0. No independent A3 review is complete; do not merge.
- The future controller path `.github/workflows/cloud-pool-next-controller.yml` is **not present on default branch**. PR #112 is read-only event validation; PR #114/#125 are local proof proposals, not a deployed owner-event controller.
- Synthetic event/context tests do not authenticate live webhook signatures, re-read the default branch via GitHub API, or prove hosted workflow provenance. No live /next webhook path is enabled.
- D1 tests use local Workers-runtime emulation only. Hosted D1 persistence, backups/restore and hosted contention remain NOT VERIFIED.
- Production approval issuer, Supervisor claim/lease/fencing/recovery, outbox delivery, worker identity, end-to-end execution and real free provider route/account/quota remain NOT QUALIFIED.
- Issue #118 persistent Workspace remains deferred; latest recorded evidence has no active authorized host, Cloudflare zone/Tunnel/Access or restore proof. Do not install/deploy until its gates pass.
- Default-branch `.github/workflows/gemini-batch-dispatch-controller.yml` is absent (404). Four Gemini assignments are NOT RUN; do not substitute MediaHub's controller, call Gemini APIs directly, read secrets or bypass gates.
- No secrets read, provider calls, dispatch, hosted resources, deployment, merge or Contour A acceptance occurred in the latest pass.

### Architecture invariants and priority
- Contour A is the absolute priority; Contour B / MediaHub OS remains DEFERRED until Contour A is formally ACCEPTED.
- One Jarvis user surface; modular-monolith Control Plane; one canonical Jarvis-to-evidence path; exactly one transactional operational-state authority.
- Separate ephemeral GitHub Actions execution from persistent Engineering Workspace.
- Immutable task SHA/evidence, single-use admission, owner-issued approval, idempotent outbox, fenced leases, recovery, least privilege and provenance.
- Isolate provider accounts, quotas and capabilities; no paid fallback or credential cycling. Gemini is controller-only/supplementary and may run only through an approved, qualified controller.
- Reuse mature upstream tools after license/provenance/security/free-tier qualification; avoid premature microservices and duplicate frameworks.
- GitHub-hosted Actions runners are ephemeral, not persistent web hosting or workspace storage.

### Current statuses and next step
- PR #125 GitHub Actions context composition + local D1 tests: **VERIFIED on exact PR head only**.
- PR #125 independent A3 review: NOT COMPLETE.
- Production webhook/controller: NOT IMPLEMENTED / NOT QUALIFIED.
- Hosted D1 and end-to-end task execution: NOT QUALIFIED.
- Authenticated Jarvis remote web UI, persistent Workspace and real provider route: NOT VERIFIED / BLOCKED.
- Gemini child dispatch: NOT RUN.
- Contour A: **BLOCKED / NOT ACCEPTED**.
- Contour B: **DEFERRED**.
- Next bounded step: independent security/contract review of stacked PRs #125 and #114; do not enable dispatch or merge. Then continue trusted live-event provenance and hosted transactional authority qualification only after governance review.

Canonical MediaHub map (separate repository/control plane): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


### CURRENT RECONCILIATION — /next admission-boundary read-through — 2026-11-18
- Fresh default ref read: `Основной` HEAD remains `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`. PR #120 remains OPEN/DRAFT/UNMERGED at `67a0cb1b84f7829bb3fc95e8e9f88b509c401bc8`. PR #124 was `84e543cf42ddded8a9aa2d59fc88a5591e22578a` before this documentation update; PR #125 is unchanged at `edfeaef277fe709a9acc37d99b7bd3cda3003774`, stacked on PR #114 `ab9461eb84b14fe230918391d5212f19ca25592c`.
- PR #125 and #114 remain OPEN / DRAFT / UNMERGED, mergeable=true at read, formal reviews 0 each.
- Scoped maintainer-side static read-through completed for the GitHub Actions context adapter, pure admission logic, migration, tests, README and CI workflow. No code-level defect was confirmed in this narrow inspection. This is **not an independent A3 review**, security qualification or merge approval. Report: [2026-11-18 PR #125 admission-boundary read-through](../reports/2026-11-18-next-pr125-admission-boundary-readthrough.md); PR comment: [6971481706](https://github.com/VlDMlNSh/developer-cloud-pool/pull/125#issuecomment-6971481706).
- Exact PR CI remains [44253572758](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44253572758) / job [134629803561](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44253572758/job/134629803561): SUCCESS on exact `edfeaef277fe709a9acc37d99b7bd3cda3003774`; 21/21 local Workers-runtime tests PASS. Push validation [44253567272](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44253567272): SUCCESS on same SHA. This proves the local proof only.
- Ruleset #26550182 remains active but has 0 required approving reviews and 0 status checks. Classic branch protection reports `protected=false`; do not treat empty combined status contexts as passing CI.
- `.github/workflows/cloud-pool-next-controller.yml` and `.github/workflows/gemini-batch-dispatch-controller.yml` are both absent on default (404). The four owner-requested Gemini roles remain NOT RUN; do not use the MediaHub controller or direct provider APIs.
- Production event provenance, hosted D1, approval issuer, Supervisor lease/fencing/recovery, outbox delivery, worker identity, route/account/quota, Jarvis remote UI and persistent Workspace/restore remain NOT VERIFIED / NOT QUALIFIED. No secrets read, dispatch, provider call, deployment or merge.
- Contour A: **BLOCKED / NOT ACCEPTED**. Contour B: **DEFERRED**.
- Next bounded step: secure independent A3 review of PR #125/#114 plus meaningful required-approval/status-check governance. Keep all dispatch fail-closed.


### CURRENT RECONCILIATION — PR conversation-comment rejection test — 2026-11-18
- PR #125 exact code head is now `2ca95775982c711a289881e94eb664d5fe14ed5a`, parent/base PR #114 head `ab9461eb84b14fe230918391d5212f19ca25592c`; 19 ahead / 0 behind; OPEN/DRAFT/UNMERGED; mergeable=true; formal reviews 0.
- Added explicit adversarial test for a GitHub `issue_comment` payload whose `issue.pull_request` marker identifies a PR conversation comment. The adapter rejects it as `WRONG_CONTROL_ISSUE`, with `dispatch:false` and `executionAuthorized:false`. Test blob `bf3c439a34c20c48503486b9fc50454de0e07a3e`.
- Exact-head CI [44255849885](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44255849885), job [134637228939](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44255849885/job/134637228939): SUCCESS; logs prove checkout and git log exact SHA; **22/22** Workers-runtime tests pass across 2 files. npm ci and syntax check pass.
- Report: [2026-11-18 PR comment rejection regression](../reports/2026-11-18-next-pr125-pr-comment-rejection-regression.md); PR comment [6971614420](https://github.com/VlDMlNSh/developer-cloud-pool/pull/125#issuecomment-6971614420).
- Default branch remains `Основной@35208f0ef28f0ac031a7acdf35fc90ccc9b16845`. PR #120 `67a0cb1b84f7829bb3fc95e8e9f88b509c401bc8`; PR #124 docs branch pending this Context Window update; PR #114 `ab9461eb84b14fe230918391d5212f19ca25592c`.
- Active ruleset #26550182 has zero required approvals and zero required status checks; classic branch protection reports disabled. PR #114 and #125 formal reviews remain zero.
- Production owner-event controller and approved Gemini controller are absent from default (404). Gemini dispatch: NOT RUN; no substitution or bypass. Hosted D1, live provenance, approval issuer, lease/fencing/recovery, outbox delivery, worker identity, provider route/quota, remote UI and persistent workspace/restore remain NOT VERIFIED / NOT QUALIFIED.
- No secrets read, provider calls, dispatch, deployment or merge. Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Next bounded step: independent A3 review and meaningful governance remediation before implementing live controller provenance. Keep dispatch fail-closed.


### CURRENT RECONCILIATION — first executor FCC account/fallback isolation — 2026-11-18
- Default branch `Основной` remains `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- PR #116 first executor runner qualification: OPEN/DRAFT/UNMERGED; exact head `a956129f6cf426c887e755c563740fe1813161d9`; base default SHA above; mergeable=true. Added child-environment regression test blob `dcf6000f9475a0bef598f175663475a12a787927`.
- The test rejects inherited FCC provider-key aliases, `MODEL_FALLBACKS`, `FCC_CUSTOM_PROVIDERS` and `ANTHROPIC_AUTH_TOKEN` from the allowlisted child environment. Synthetic sentinels only; no credential values accessed.
- Exact-head Claude Code + ECC + FCC no-secret runner qualification [44257088134](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44257088134), job [134641259169](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44257088134/job/134641259169): COMPLETED / SUCCESS; Python suite **9/9 PASS**, full runner/lifecycle/mocked handoff steps passed.
- Exact-head Pool Contract Validation [44257088139](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44257088139), job 134641259701: SUCCESS. Dispatch-disabled invariant retained.
- Evidence artifact [14406183728](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44257088134/artifacts/14406183728), 26,805 bytes; SHA-256 `17e510f0d5c8b45862bc0f34e9bf7e33cf82ccfa5f9bf292c07bd70900dafad8`; expires 2026-11-25T07:13:22Z.
- Upstream FCC pinned commit `eb92e4c07af0d6ad8881dce1cd958c3d072c27c5` supports ordered key arrays, numbered selection and model fallback sequences after 403/429. One-account-per-FCC-profile, no fallback/key cycling remains mandatory. The new test covers inherited environment only; persisted FCC settings remain NOT VERIFIED.
- Issue #115 remains OPEN because actual permitted free route, account identity and quota behavior are not qualified. FCC AGPL-3.0-only deployment obligations remain unresolved; keep FCC loopback-only, no network exposure.
- Issue #94 latest owner scope correction makes Gemini supplementary/optional, not a mandatory per-/next or first-release gate. Cloud Pool Gemini controller is absent on default; no Gemini dispatch performed.
- PR #116 review submissions remain COMMENTED, not independent approval. PR #114/#125 review and ruleset governance blockers remain unchanged; no independent A3 acceptance.
- Authenticated Jarvis remote UI, hosted D1, production owner controller, approval issuer, Supervisor lease/fencing/recovery, worker identity, production provider routing/quota, persistent Engineering Workspace/restore remain NOT VERIFIED / NOT QUALIFIED.
- No secret values read, provider calls, dispatch, deployment or merge. Contour A: **BLOCKED / NOT ACCEPTED**. Contour B: **DEFERRED**.
- Next bounded step: define/test a persisted FCC single-account configuration boundary without revealing credential values; then separately qualify a real permitted free route and quota accounting. Resolve AGPL exposure obligations before remote FCC service.
- Reports: [FCC provider key/fallback isolation regression](../reports/2026-11-18-next-fcc-provider-key-isolation-regression.md); [Issue #115 evidence](https://github.com/VlDMlNSh/developer-cloud-pool/issues/115#issuecomment-6971842639).


### Documentation branch reconciliation — 2026-11-18
- PR #124 documentation candidate head: `8b90b8b3290e9fdfd40977b3e7570dac8532c255`; base PR #120 head `67a0cb1b84f7829bb3fc95e8e9f88b509c401bc8`; OPEN / DRAFT / UNMERGED.
- GitHub pull request endpoint currently reports `mergeable=false` / `mergeable_state=dirty` for PR #124. Do not merge; the dirty state needs separate reconciliation before the docs candidate can be accepted.
- Architecture Documentation Validation [44257717873](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44257717873) completed SUCCESS on exact docs branch head `8b90b8b3290e9fdfd40977b3e7570dac8532c255`; job [134643313753](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44257717873/job/134643313753).
- The report, checkpoint and Context Window were re-fetched from GitHub and contain the PR #116 exact-head evidence. Documentation CI does not resolve PR mergeability or independently accept the architecture.


### CURRENT RECONCILIATION — persisted FCC profile boundary — 2026-11-18
- Default branch `Основной` observed HEAD remains `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- PR #116 exact latest code head `6620a1557f14d26756dcb3bc11c8ab3d5e57c746`, base default; OPEN/DRAFT/UNMERGED; mergeable=true.
- PR #116 adds value-redacting persisted FCC profile auditor `scripts/cloud_pool/fcc_profile_guard.py` (blob `2329e02424f407df57a6b4848991063da4f143e6`) and 13 synthetic tests `scripts/cloud_pool/test_fcc_profile_guard.py` (blob `141961313ff89ba28c0abc17fb7563a46979aef2`); workflow blob `8ce4999b08a16310eb44c355d481291412b7b005`.
- FCC source at pinned commit confirms `~/.fcc/.env` is managed config, `~/.fcc/auth/` stores OAuth/native auth state, and Settings can be overridden by process environment. The guard checks private HOME/profile/file permissions, no alternate/legacy config, no process-level credential/model override, no FCC auth state, no custom provider, exactly one API-key owner and one key, model/provider match, no tier overrides and no `MODEL_FALLBACKS`. It emits only safe metadata; no key values/hashes.
- Synthetic profile tests **13/13 PASS**.
- Exact-head Runner Qualification [44260105806](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44260105806), job [134651081368](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44260105806/job/134651081368): COMPLETED / SUCCESS on exact SHA; all 14 workflow steps succeeded, including existing child environment tests, install, FCC loopback readiness/clean shutdown, synthetic mock handoff and selected ECC install.
- Exact-head Pool Contract Validation [44260105903](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44260105903): COMPLETED / SUCCESS on same SHA.
- Artifact [14407638100](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44260105806/artifacts/14407638100): 27,378 bytes; digest `sha256:bfde13007c9db2385ddd57e7502736a5591d33a0f52197ff8be1647b57ab5dfa`; expires 2026-11-25T07:36:30Z.
- Report: [persisted FCC profile guard](../reports/2026-11-18-next-fcc-persisted-profile-guard.md).
- Qualification boundary: synthetic profiles only; no real user FCC profile/credentials read; no actual provider identity, free quota, model call or real Claude session. Guard does not establish host egress or credentials outside dedicated HOME. FCC AGPL-3.0-only remote exposure remains blocked.
- Issue #115 remains OPEN pending real permitted free route/account/quota qualification.
- PR #124 documentation branch remains OPEN/DRAFT/UNMERGED; head `068cf55e3bed7b4bada71d31f66cd85f021cc602`, base PR #120 head `67a0cb1b84f7829bb3fc95e8e9f88b509c401bc8`; GitHub reports mergeable=false. Architecture docs CI [44257963362](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44257963362) succeeded on its exact head. Do not merge until dirty mergeability state is resolved.
- Active ruleset #26550182 has required PR/review-thread resolution but zero required approving reviews and zero required status checks; enforcement active, no bypass actors. Governance remains insufficient.
- No secrets read, provider calls, dispatch, deployment or merge. Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Next bounded step: independent review of profile guard plus launcher-level proof that each worker gets dedicated HOME and no external credential stores; only then proceed to permitted free-route/account/quota qualification.


### CURRENT RECONCILIATION — PR stack and governance audit — 2026-11-18
- Default `Основной` HEAD: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- PR #120 remains OPEN/DRAFT/UNMERGED at `e93fb34a1f3430ca2db32fbf2e631903aac9570f`, based on default HEAD. Exact-head Architecture Documentation Validation [44260483070](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44260483070) and Pool Contract Validation [44260483194](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44260483194) both COMPLETED/SUCCESS.
- PR #124 remains OPEN/DRAFT/UNMERGED at `e0041825cb9496c2454fb2c4728a9129ac344fc2`, based on earlier parent head `67a0cb1b84f7829bb3fc95e8e9f88b509c401bc8`. PR #120 has advanced 3 commits beyond that base; compare confirms 3 commits ahead / 0 behind from the PR #124 base to current PR #120 head. GitHub reports PR #124 `mergeable=false`. Treat this as a dirty/stale dependent stack; do not merge until explicitly reconciled against current PR #120 head and revalidated.
- PR #124 exact-head Architecture Documentation Validation [44260431233](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44260431233) COMPLETED/SUCCESS. No exact-head Pool Contract Validation run was observed for `e0041825...`; do not infer it passed.
- Formal review submissions: PR #120 = 0; PR #124 = 0. Active ruleset #26550182 has PR/review-thread requirements but **0 required approvals and 0 required status checks**. Governance is insufficient for high-assurance acceptance despite active enforcement.
- Fetch of default-branch `.github/workflows/gemini-batch-dispatch-controller.yml` returned 404. Gemini dispatch remains NOT RUN; no alternate controller or direct provider route is authorized.
- Report: [2026-11-18 PR stack and governance reconciliation](../reports/2026-11-18-next-pr-stack-governance-reconciliation.md).
- No secrets read, provider/model calls, dispatch, deployment, merge or infrastructure mutation in this pass. Contour A remains **BLOCKED / NOT ACCEPTED**; Contour B **DEFERRED**.
- Next bounded step: reconcile PR #124's base with the latest PR #120 head without losing dependent changes, then require independent review and meaningful ruleset approvals/status checks before merge. Keep dispatch fail-closed.


### CURRENT RECONCILIATION — worker HOME isolation boundary audit — 2026-11-18
- Fresh default ref: `Основной@35208f0ef28f0ac031a7acdf35fc90ccc9b16845`. PR #116 remains OPEN/DRAFT/UNMERGED at exact code head `6620a1557f14d26756dcb3bc11c8ab3d5e57c746`, mergeable=true. PR #114/#120/#124/#125 remain OPEN/DRAFT/UNMERGED; #124 currently reports mergeable=false; the others report mergeable=true.
- Default worker workflow `.github/workflows/pool-worker.yml` and supervisor are DSH-only. No production FCC/Claude launcher is present in this path; worker workflow does not invoke FCC profile guard or FCC child allowlist.
- PR #116 `exec_allowlist.py` filters inherited environment credentials/proxies and requires private current-user HOME and private XDG paths inside HOME. It trusts caller-supplied HOME: it does not create it, prove freshness/per-task uniqueness, or reject pre-existing external credential stores under HOME. XDG values are optional.
- PR #116 qualification CI creates temporary HOME only for its own FCC loopback/mock test harness. Persisted profile tests use synthetic fixtures. This does not prove production worker isolation.
- Default source blobs: worker workflow `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`; supervisor workflow `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`; supervisor script `52bf03ca889edd92fd10c71ae96a2e35e106d43f`. PR #116 allowlist `f98ba421ec98e020b28fefb71083d65bd27213d4`; tests `dcf6000f9475a0bef598f175663475a12a787927`.
- Exact-head Runner Qualification [44260105806](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44260105806), job [134651081368](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44260105806/job/134651081368): SUCCESS on exact PR #116 head; 13/13 synthetic profile tests and loopback/mock bridge passed. Pool Contract Validation [44260105903](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44260105903): SUCCESS. Neither proves production HOME isolation.
- Active ruleset #26550182 still requires 0 approving reviews and 0 status checks. Both Gemini and Cloud Pool /next controller workflows return 404 on default. Gemini NOT RUN.
- Report: [worker HOME isolation boundary audit](../reports/2026-11-18-next-worker-home-isolation-audit.md).
- No secrets read, provider calls, dispatch, deployment, merge or host inspection. Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Next: implement fail-closed per-task HOME provisioning, explicit XDG paths, external credential-store rejection, safe teardown and concurrent isolation tests; keep dispatch disabled and require independent A3 review.


### CURRENT RECONCILIATION — disposable per-task HOME isolation primitive — 2026-11-18
- Fresh default branch remains `Основной@35208f0ef28f0ac031a7acdf35fc90ccc9b16845`. PR #116 remains OPEN/DRAFT/UNMERGED, based on default; after this pass its exact head is `2bc5e78c45d0df5d8c1488fb74feae27dd02e5dc`, mergeable=true / mergeable_state=unstable.
- Added `scripts/cloud_pool/task_home.py`: fresh unique per-task HOME below a private root; owner/mode 0700 enforcement; explicit XDG config/data/cache paths; rejection of known credential/config stores in the fresh HOME; no copying from runner HOME; exact-root constrained teardown and context-manager cleanup.
- Added `scripts/cloud_pool/test_task_home.py`: five tests covering private/fresh paths, eight concurrent distinct homes, success/exception teardown, invalid task IDs, out-of-root deletion rejection and insecure root rejection.
- Updated PR #116 runner workflow to execute the suite and trigger on both new files.
- Verified blobs: module `f44efe08e2e027f53c46f78d7616714fdebf12df`; tests `01f70abd2033d87ddd92216f32c0a76f4abb2560`; workflow `52258300a99269d038b2970462d3cf3ab0fd94c2`.
- Exact-head runner qualification [44262440288](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262440288) was PENDING at last poll; exact-head Pool Contract Validation [44262440272](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262440272) was IN_PROGRESS. No final-head test success is claimed yet. Previous runner run [44262423499](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262423499) was on an earlier head and is not final-head evidence.
- Important boundary: this primitive is not yet integrated into the production worker launcher/default worker workflow; default worker remains DSH-only. It does not establish container/OS isolation, egress controls, credential stores outside HOME or host recovery after runner loss.
- Report: [2026-11-18 disposable per-task HOME isolation](../reports/2026-11-18-next-disposable-task-home-isolation.md).
- PR #116 remains Draft and needs independent A3 review. Ruleset #26550182 still requires 0 approvals and 0 status checks. Cloud Pool owner /next controller and Gemini dispatch controller remain absent from default; no dispatch or provider calls occurred.
- No secrets read, host access, provider calls, Gemini dispatch, deployment or merge. Contour A **BLOCKED / NOT ACCEPTED**; Contour B **DEFERRED**.
- Next: await exact-head CI; if green, request independent A3 review, then separately design and qualify production launcher integration plus OS/container, network-egress and external credential-store boundaries.


### CURRENT RECONCILIATION — task HOME symlink-boundary hardening — 2026-11-18
- Fresh live GitHub read: default `Основной@35208f0ef28f0ac031a7acdf35fc90ccc9b16845`. PR #116 OPEN/DRAFT/UNMERGED, branch `feat/claude-code-fcc-runner-qualification-2026-11-17`, updated head `b75b95a2c67c9e3d84b191cd88137887dfdfc7dc`, base default. Mergeability was UNKNOWN while final-head checks were queued; no merge.
- Prior exact-head PR #116 runner qualification [44262440288](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262440288) and Pool Contract Validation [44262440272](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262440272) both COMPLETED/SUCCESS on previous head `2bc5e78c45d0df5d8c1488fb74feae27dd02e5dc`. This proves the previous helper revision only.
- Found symlink canonicalization gap in `task_home.py`: `Path.resolve()` before symlink detection hid symlinked caller paths. Updated `_private_directory` to use `lstat()` and reject supplied symlinks before resolution; teardown validates supplied HOME before resolving/deleting; forbidden-store checks now treat dangling symlinks as present. Added regression for symlinked root and task HOME alias.
- Exact final-head Runner Qualification [44262676210](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262676210) was PENDING at report creation; Pool Contract Validation [44262676143](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262676143) was IN_PROGRESS. Prior helper-head runner [44262653818](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262653818) was IN_PROGRESS; do not attribute its result to final head. No final-head CI pass claimed yet.
- Report: [2026-11-18 task HOME symlink hardening](../reports/2026-11-18-next-task-home-symlink-hardening.md).
- Default worker workflow remains DSH-only; task HOME helper is not production launcher integration. OS/container sandbox, egress, external credential stores and host recovery remain NOT VERIFIED.
- PR #116 independent A3 review outstanding; governance ruleset #26550182 still requires 0 approvals and 0 status checks. PR #114/#125 admission proposals remain unmerged; production owner controller and Gemini controller absent on default. No secrets read, provider calls, dispatch, deployment or merge.
- Contour A **BLOCKED / NOT ACCEPTED**; Contour B **DEFERRED**.
- Next: wait for final-head CI; if green, obtain independent review of task HOME + child env boundary, then separately qualify production launcher and OS/container/network/credential isolation. Keep dispatch fail-closed.


### CURRENT RECONCILIATION — task HOME symlink and XDG permission hardening — 2026-11-18
- Code PR #116 branch current HEAD: `ad8b120f9ffbd55423c8d49fe5a42af466cf4430`; default remains `Основной@35208f0ef28f0ac031a7acdf35fc90ccc9b16845`. PR #116 remains OPEN/DRAFT/UNMERGED.
- Reviewed and confirmed symlink checks now use `lstat()` before canonicalization, teardown rejects symlink aliases, and dangling forbidden credential-store symlinks count as present. Regression tests cover symlinked root and task HOME alias.
- Additional issue fixed: intermediate XDG parent `.local` was not guaranteed mode 0700 because pathlib `parents=True` does not apply leaf mode to intermediate directories. The helper now creates/chmods/validates the parent explicitly; test asserts `.local` ownership and mode.
- Current blobs: helper `dc098728d4cbcd91d04d922fd548df6b71777054`; tests `d8a7dd10f4f2bb0a7852f95cb5f55eceaffadea2`.
- Symlink-hardening exact-head CI on prior code head `b75b95a2c67c9e3d84b191cd88137887dfdfc7dc`: Runner Qualification [44262676210](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262676210) SUCCESS, all 14 steps; Pool Contract Validation [44262676143](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262676143) SUCCESS. These are not final-head evidence for XDG parent fix.
- Final-head CI on `ad8b120...`: Runner Qualification [44262817505](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262817505) and Pool Contract Validation [44262817611](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262817611) were IN_PROGRESS at last poll.
- Report: [task HOME symlink and XDG permission hardening](../reports/2026-11-18-next-task-home-xdg-permission-hardening.md).
- Production worker remains DSH-only; helper is not wired into production launcher. OS/container isolation, egress, external credentials, host recovery and vendor hosted-use/compliance remain NOT VERIFIED. Ruleset #26550182 still has 0 required approvals and 0 required status checks; Gemini and Cloud Pool owner controllers absent from default. No secrets/provider calls/dispatch/deployment/merge.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED. Next: await final-head CI, then independent A3 security review; only afterward separately qualify production launcher and sandbox/egress/credential/vendor gates.


### CURRENT RECONCILIATION — dangling credential-store symlink regression — 2026-11-18
- Fresh refs: default `Основной@35208f0ef28f0ac031a7acdf35fc90ccc9b16845`. PR #116 remains OPEN/DRAFT/UNMERGED, base default, latest head `58a8cd5fd5a39fd47916b534fb63f744b5f25d5f`; mergeable=true / mergeable_state=unstable.
- Added direct regression `test_rejects_dangling_credential_store_symlink_and_cleans_home`: a mocked temp HOME contains dangling `.aws` symlink; provisioning must deny and clean partial HOME. No credential values used. Test blob `ee33fe67e5fea82093395696c9db21bc14211ef0`; commit/head `58a8cd5fd5a39fd47916b534fb63f744b5f25d5f`.
- Exact-head Runner Qualification [44262959665](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262959665) and Pool Contract Validation [44262959651](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262959651) were IN_PROGRESS at checkpoint. Do not claim final-head CI yet.
- Prior exact head `ad8b120f9ffbd55423c8d49fe5a42af466cf4430` passed Runner Qualification [44262843742](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262843742) and Pool Contract Validation [44262843688](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262843688). Runner job [134660148110](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262843742/job/134660148110) completed all 15 steps, including child environment tests, task HOME/XDG tests, FCC profile synthetic tests, FCC loopback lifecycle, synthetic Claude CLI handoff, pinned installs and evidence upload. This does not prove the new dangling-symlink regression.
- Report: [2026-11-18 task HOME dangling symlink regression](../reports/2026-11-18-next-task-home-dangling-symlink-regression.md).
- Production worker remains DSH-only; HOME helper not integrated into production launcher. OS/container isolation, network egress, external credentials and host recovery remain NOT VERIFIED. FCC pinned AGPL-3.0-only; network deployment remains blocked pending intended-use legal review; keep loopback-only.
- Independent A3 review outstanding; ruleset #26550182 still has zero required approvals and zero required status checks. Owner /next controller and Gemini dispatch controller absent on default; Gemini dispatch NOT RUN. No secrets/provider calls/deployment/merge.
- Contour A **BLOCKED / NOT ACCEPTED**; Contour B **DEFERRED**.
- Next: await exact-head runs 44262959665 and 44262959651. If green, obtain independent A3 review; then separately qualify production worker, OS/container/egress, credential lifecycle and provider route/quota under approved scope.


### CURRENT RECONCILIATION — dangling credential-store symlink regression — 2026-11-18
- Code branch PR #116 advanced to `58a8cd5fd5a39fd47916b534fb63f744b5f25d5f` (one commit beyond XDG fix). New test creates a dangling `.aws` symlink in a synthetic fresh HOME and verifies fail-closed rejection plus cleanup of partial HOME.
- XDG parent permission fix at `ad8b120...` passed exact-head Runner Qualification [44262843742](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262843742) and Pool Contract Validation [44262843688](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262843688), both SUCCESS.
- Latest head `58a8cd5...`: Pool Contract Validation [44262959651](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262959651) SUCCESS; Runner Qualification [44262959665](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262959665) still IN_PROGRESS at last poll.
- Updated report: [task HOME symlink and XDG permission hardening](../reports/2026-11-18-next-task-home-xdg-permission-hardening.md).
- Production worker still DSH-only; no launcher integration, OS/container sandbox, egress policy, external credential isolation, host recovery or Claude vendor/free-tier compliance qualification. PR #116 OPEN/DRAFT/UNMERGED; independent A3 review outstanding. Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.


### FINAL VERIFICATION — task HOME hardening exact-head CI — 2026-11-18
- Current PR #116 code head verified from live branch ref: `58a8cd5fd5a39fd47916b534fb63f744b5f25d5f`; PR OPEN/DRAFT/UNMERGED, base `Основной`, mergeable=true. This is still a qualification candidate, not an approval.
- Exact-head Runner Qualification [44262959665](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262959665), job [134660515082](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262959665/job/134660515082): COMPLETED/SUCCESS; all 15 steps succeeded, including child env tests, task HOME + symlink + XDG permissions + dangling credential-store symlink regression tests, FCC profile synthetic tests, loopback lifecycle and synthetic bridge.
- Exact-head Pool Contract Validation [44262959651](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262959651): COMPLETED/SUCCESS; production dispatch remains disabled.
- Documentation validation on docs branch head `711146a1a5a26ce4b916ef4278909475b827e466`: [44263132106](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44263132106) COMPLETED/SUCCESS.
- Final report: [task HOME symlink and XDG permission hardening](../reports/2026-11-18-next-task-home-xdg-permission-hardening.md). Context/checkpoint refreshed after CI.
- This verifies only a filesystem provisioning primitive in ephemeral CI. It is not production launcher integration, OS/container sandbox, network egress, credential isolation outside HOME, host recovery, vendor hosted-use permission, real Claude task or free provider route/quota. PR #116 remains Draft; independent A3 review and governance approvals/status requirements remain missing. Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Next: independent A3 review of HOME + child env boundary, followed by a separate production launcher integration and host isolation qualification; keep dispatch disabled.



### CURRENT RECONCILIATION — Task HOME descriptor-binding review — 2026-11-18
- Fresh exact-head CI recheck for PR #116 head `58a8cd5fd5a39fd47916b534fb63f744b5f25d5f`: Runner Qualification [44262959665](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262959665) COMPLETED / SUCCESS (job 134660515082, all 15 steps); Pool Contract Validation [44262959651](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44262959651) COMPLETED / SUCCESS (job 134660514970).
- Source inspection of `task_home.py` found a descriptor-instance binding gap: `destroy_task_home()` checks root containment and a task-id name prefix, but does not verify that the descriptor refers to the exact directory instance returned by `create_task_home()`. With two homes sharing a task_id, a forged/mismatched descriptor can point at the other home and pass the current prefix check. This is an API integrity / accidental cross-task deletion finding, not evidence of remote exploitation or sandbox escape.
- Recommended repair: per-instance unguessable identifier plus private ownership marker (or equivalent handle), verify before deletion, and add same-task-id forged-descriptor regression tests. This helper remains filesystem hygiene only; hostile tasks sharing one OS identity still require a separate sandbox/UID/container boundary.
- Report: [2026-11-18 Task HOME descriptor-binding review](../reports/2026-11-18-next-task-home-descriptor-binding-review.md).
- This was maintainer-side source inspection, **not independent A3 review**. PR #116 remains OPEN / DRAFT / UNMERGED. No merge, provider call, dispatch or secret access.
- Exact-head CI is VERIFIED; descriptor binding GAP IDENTIFIED / NOT VERIFIED; independent A3 review NOT COMPLETE. Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Next bounded step: repair descriptor-instance binding and add regression tests on a new immutable PR head, then rerun both exact-head workflows and request independent A3 review.



## Current checkpoint — Task HOME descriptor-instance binding — 2026-11-18
- PR #116 head `a95700c0bf562aa3b0a142720892cff118dfeb9f`; base `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`; OPEN / DRAFT / UNMERGED.
- Added 256-bit per-instance identifier to `TaskHome`, private mode-0600 ownership marker, and destroy-time descriptor/marker match checks. Added regressions for same-task-id cross-directory forged descriptors and altered/symlinked markers.
- Blobs: `task_home.py` `362d9a98f0e85784a7470d44ab318cca3c849171`; `test_task_home.py` `e413cf1b0b03550b3818863f45c6e773eb400e0f`.
- Exact-head test attempts surfaced a test-fixture cleanup bug, corrected in current head. Prior run [44263548591](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44263548591) FAILED in test fixture; its job logs are [134662437064](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44263548591/job/134662437064). Pool Contract Validation [44263548680](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44263548591) SUCCESS on earlier head `0070b5dde32d38d63e42c61509b24e21c392be22`. A later attempt [44263636820](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44263636820) also exposed fixture restoration mode issue; corrected by restoring mode 0600. Latest head's exact-head workflows were NOT VERIFIED at checkpoint.
- Historical reviews are COMMENTED, not approval for current head. Independent A3 review required.
- Marker is an accidental descriptor-mismatch guard only, not a same-UID hostile-code boundary or sandbox. Production process/container isolation remains unproven.
- Additional unresolved gates: installer signature/binary provenance, Anthropic hosted-use terms and account entitlement, FCC AGPL-3.0-only obligations, provider/account/quota route proof, network egress controls, and production worker integration.
- Report: [Task HOME descriptor-instance binding](../reports/2026-11-18-next-task-home-descriptor-instance-binding.md).
- No secrets, provider calls, Gemini dispatch, deployment or merge. Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Next: verify both workflows on exact head `a95700c0bf562aa3b0a142720892cff118dfeb9f`, fix any concrete failures, then obtain independent A3 review and resolve legal/provenance gates.


### CI live update — exact PR #116 head a95700c0bf562aa3b0a142720892cff118dfeb9f — 2026-11-18
- Pool Contract Validation [44263708506](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44263708506): COMPLETED / SUCCESS on exact head.
- Runner Qualification [44263708443](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44263708443): RUNNING at last poll; job 134662967919. Completed successfully: checkout without persisted credentials, child environment allowlist + Task HOME regression tests, runner baseline, Claude installer/version, uv bootstrap, pinned FCC install/metadata checks, 13 synthetic FCC profile guard tests, and FCC loopback readiness/listener/SIGINT shutdown. Synthetic FCC-to-Claude CLI handoff was IN_PROGRESS; ECC install/provenance and artifact publication were pending. Do not claim full Runner Qualification success until the run concludes.
- The earlier failed runs 44263548591 and 44263636820 exposed only test-fixture cleanup defects; the current exact-head Task HOME tests now PASS. No production provider calls or secret reads.


### FINAL CI CLOSURE — Task HOME descriptor-instance binding exact head — 2026-11-18
- Live PR #116 remains OPEN / DRAFT / UNMERGED. Code head `a95700c0bf562aa3b0a142720892cff118dfeb9f`; base/default `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`; mergeable=true.
- Exact-head Runner Qualification [44263708443](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44263708443): COMPLETED / SUCCESS; job [134662967919](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44263708443/job/134662967919), all 15 steps SUCCESS. Completed Task HOME and child env tests, pinned Claude/uv/FCC installation, synthetic FCC profile tests, loopback HTTP 200 + exact loopback listener + clean SIGINT shutdown, synthetic FCC-to-Claude CLI handoff without provider access, pinned ECC selected skills, provenance manifest and bounded no-secret artifact publication.
- Exact-head Pool Contract Validation [44263708506](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44263708506): COMPLETED / SUCCESS; job [134662967101](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44263708506/job/134662967101).
- Three existing PR review submissions remain COMMENTED and target older SHAs. No APPROVED review for current head; independent A3 re-review NOT COMPLETE. PR remains Draft.
- CI establishes ephemeral install/runtime smoke only. It does NOT establish provider/model calls, free-tier entitlement, account-separated routing/quotas, persistent host/web UI, production dispatch, OS/container isolation, network egress, external credential isolation, host recovery, or legal clearance for FCC AGPL-3.0-only network use / Claude hosted-use terms. Task HOME marker is not a same-UID hostile-code boundary.
- Governance: previously observed ruleset #26550182 with zero required approvals and zero status checks remains an unresolved concern; current settings not re-fetched this pass, mark NOT VERIFIED. No secret reads, provider calls, Gemini dispatch, deployment or merge. Gemini controller NOT RUN / availability unproven.
- Report: [exact-head runner qualification closure](../reports/2026-11-18-next-exact-head-runner-qualification-closure.md).
- Exact-head CI VERIFIED; independent A3 review NOT COMPLETE; Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Next: independent A3 review against exact code head `a95700c...`, then resolve governance, legal/vendor and production isolation gates before any dispatch.


## /next — independent Task HOME and child-process boundary review — 2026-11-18

- Reviewed PR #116 exact head `a95700c0bf562aa3b0a142720892cff118dfeb9f` (branch `feat/claude-code-fcc-runner-qualification-2026-11-17`) and source files `scripts/cloud_pool/task_home.py`, `exec_allowlist.py`, tests and workflow.
- Exact-head associated runs: Runner Qualification [44263708443](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44263708443) COMPLETED/SUCCESS; Pool Contract Validation [44263708506](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44263708506) COMPLETED/SUCCESS. Combined status endpoint returned no status entries; do not infer required checks from that.
- **BLOCKER F-1:** Task HOME/XDG mode 0700 is not isolation between tasks sharing one effective UID. Same-UID processes can access sibling task directories. Unique paths and chmod do not establish confidentiality/integrity. Requires distinct OS identities or qualified per-task container/VM plus adversarial cross-task access tests.
- **BLOCKER F-2:** PATH validation is structural; current-UID-owned directories are accepted and may be mutable by same-UID workloads. Production launcher must own and pin trusted PATH directories and test executable replacement.
- **BOUNDARY F-3:** child environment allowlist is only a child env filter, not a filesystem, network, descriptor, process, kernel or host credential sandbox.
- Positive hygiene controls remain: safe task ID, private HOME/XDG creation, symlink checks, instance-bound ownership marker, dangling credential-store detection and explicit child env allowlist.
- PR #116 remains OPEN/DRAFT/UNMERGED. Recorded reviews are COMMENTED by repository owner; independent A3 review remains NOT VERIFIED. Current code head supersedes all prior PR #116 head references.
- Report: [2026-11-18 task isolation boundary review](../reports/2026-11-18-next-task-isolation-boundary-review.md).
- No code change, secrets read, provider call, production dispatch, deployment or merge. Gemini controller absent from default; Gemini NOT RUN.
- Next: qualify actual OS-level task boundary (distinct UID/container/VM), trusted PATH, private mounts, no sibling HOME/host credentials, and deny-by-default egress before production launcher integration.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## /next — reusable sandbox runtime assessment — 2026-11-18
- Current code target: PR #116 head `a95700c0bf562aa3b0a142720892cff118dfeb9f`; default/base `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`. PR #116 OPEN/DRAFT/UNMERGED.
- Exact-head Runner Qualification [44263708443](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44263708443) and Pool Contract Validation [44263708506](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44263708506) both COMPLETED/SUCCESS. Three prior reviews are COMMENTED; independent A3 approval on current head NOT VERIFIED.
- Reuse-first review compared mature sandbox projects: gVisor `runsc` (primary evaluation candidate, OCI runtime/userspace kernel; Linux 5.6+ and Docker prerequisites), nsjail (secondary process-isolation candidate: namespaces/cgroups/rlimits/seccomp), bubblewrap (supplemental low-level namespace/filesystem building block, not sufficient alone), Firecracker (deferred until KVM/`/dev/kvm` host is actually qualified).
- No candidate selected, installed or integrated. Compatibility on GitHub-hosted runner, artifact provenance, license review, cross-task adversarial tests and deny-by-default egress remain NOT RUN.
- Report: [2026-11-18 reusable sandbox runtime assessment](../reports/2026-11-18-next-reusable-sandbox-runtime-assessment.md).
- Persistent Engineering Workspace remains BLOCKED by Issue #118 (zero active authorized hosts in latest recorded evidence). No provider calls, secret reads, Gemini dispatch, deployment or merge.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Next: no-secret capability probe of the actual approved ephemeral runner (kernel/user namespaces/cgroup v2/Docker/`/dev/kvm`), then evaluate gVisor first and nsjail second; keep dispatch disabled.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## /next — hosted runner sandbox capability probe instrumentation — 2026-11-18
- PR #116 current head: \`aea59ae536358a827f05c2262647601ec53c8b33\`, branch \`feat/claude-code-fcc-runner-qualification-2026-11-17\`, base/default \`35208f0ef28f0ac031a7acdf35fc90ccc9b16845\`; OPEN/DRAFT/UNMERGED.
- Previous exact-head Runner Qualification [44263708443](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44263708443), job [134662967919](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44263708443/job/134662967919), succeeded on previous head \`a95700c...\`. Its logs prove ubuntu-24.04 image \`20261111.127.1\`, Ubuntu 24.04.5 LTS, hosted compute AWS us-west-2, runner v2.338.2. They do not prove sandbox capabilities.
- Added no-secret capability probe to \`.github/workflows/claude-code-fcc-runner-qualification.yml\`; final workflow blob \`d281af95da5b2f775c5e8f5dce5eff0420c7044d\`. It records kernel/userns/seccomp/cgroup v2, Docker daemon/security options, /dev/kvm, runsc/nsjail/bwrap presence, and bounded user/mount/PID/network namespace probes. No installation, provider calls, secret reads or dispatch.
- Current-head workflow query returned no associated runs at report time: new probe NOT RUN / NOT VERIFIED. Previous CI is not evidence for changed workflow.
- Report: [2026-11-18 hosted runner sandbox capability probe](../reports/2026-11-18-next-hosted-runner-sandbox-capability-probe.md).
- gVisor remains first evaluation candidate, nsjail second, bubblewrap supplemental, Firecracker deferred pending KVM. No runtime selected or installed.
- Issue #118 persistent workspace remains BLOCKED. Independent A3 review and default-branch governance remain NOT VERIFIED. No Gemini dispatch, provider calls, secrets read, merge or deployment.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Next: obtain exact-head workflow result for \`aea59ae...\`, inspect capability artifact, then decide whether gVisor is feasible on this runner.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md

- CI status refresh after report publication: exact-head Pool Contract Validation run [44264822929](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44264822929) COMPLETED/SUCCESS; exact-head Runner Qualification [44264823103](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44264823103), job [134666618686](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44264823103/job/134666618686), IN_PROGRESS. Capability probe artifact/results remain NOT VERIFIED until job completion and artifact inspection.

- Final exact-head probe outcome: Runner Qualification [44264823103](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44264823103) and Pool Contract Validation [44264822929](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44264822929) COMPLETED/SUCCESS on \`aea59ae536358a827f05c2262647601ec53c8b33\`. Job [134666618686](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44264823103/job/134666618686); artifact [14409921197](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44264823103/artifacts/14409921197), 28,019 bytes, ZIP SHA-256 \`c158ce33dcb612bafba409ef7cf829a8028bd84264806436a5488c0949a800c3\`.
- Capability evidence: kernel \`7.0.0-1014-aws\`, Ubuntu 24.04 hosted runner, Docker client/server 28.0.4, cgroup v2 present (cpu/memory/pids and other controllers), /dev/kvm exists but inaccessible; user/mount/PID/network namespace unshare probes all denied (exit 1); runsc/nsjail/bwrap absent. Userns sysctl enabled does not override denied actual namespace operations.
- Firecracker is NOT FEASIBLE in this runner context due to inaccessible KVM. Do not infer safe task isolation from seccomp status or runner default Docker options. Actual hostile-task isolation remains NOT VERIFIED.
- Next: evaluate gVisor via disposable no-secret Docker OCI runtime qualification only if custom runtime can be introduced without weakening daemon security. Do not install on production worker or enable dispatch.


### /next — gVisor hosted-runner feasibility decision — 2026-11-18
- Reconciled default `Основной` HEAD `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`; PR #116 remains OPEN/DRAFT/UNMERGED at `aea59ae536358a827f05c2262647601ec53c8b33`.
- Exact-head Runner Qualification [44264823103](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44264823103), job [134666618686](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44264823103/job/134666618686): SUCCESS. Pool Contract Validation [44264822929](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44264822929): SUCCESS. Artifact [14409921197](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44264823103/artifacts/14409921197), SHA-256 `c158ce33dcb612bafba409ef7cf829a8028bd84264806436a5488c0949a800c3`.
- Exact-head runner evidence: Ubuntu 24.04, kernel `7.0.0-1014-aws`, x86_64, Docker 28.0.4, cgroup v2; user/mount/PID/network namespace probes all denied; /dev/kvm inaccessible; runsc/nsjail/bwrap absent.
- Official gVisor install, Docker Quick Start, rootless and security-model documentation reviewed, together with Docker daemon runtime configuration. Kernel/architecture/Docker version are nominally compatible, but required host isolation primitives are not available in the measured runner. Standard Docker integration requires runtime registration and daemon reload/restart. No safe direct-OCI alternative was established.
- Decision: **REJECT gVisor on the current shared GitHub-hosted runner**. This is not a global rejection of gVisor; re-evaluate on a separately authorized host after namespace/cgroup/security gates are verified. nsjail is also blocked by namespace prerequisites; bubblewrap is insufficient alone; Firecracker blocked by inaccessible KVM.
- No runtime installed, daemon changed, privileged container launched, provider call, secret read, deployment, merge or production dispatch. Gemini NOT RUN.
- Issue #118 remains OPEN/BLOCKED by latest evidence: no active authorized host, Cloudflare zone/Tunnel/Access, persistent storage or restore proof.
- Report: [2026-11-18 gVisor hosted-runner feasibility decision](../reports/2026-11-18-next-gvisor-hosted-runner-feasibility-decision.md).
- Ruleset #26550182 is active but requires zero approving reviews; PR #116 independent A3 approval on current head NOT VERIFIED.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED. Next: qualify a dedicated authorized Linux host if available; otherwise evaluate a genuinely free per-task sandbox/ephemeral-VM offering with verified tenancy, retention, cost and governance gates. Do not deploy to unqualified hosts.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## /next — runner environment admission guard — 2026-11-18

- Default `Основной` HEAD remains `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`. PR #114 remains OPEN/DRAFT/UNMERGED at `ab9461eb84b14fe230918391d5212f19ca25592c`; PR #125 remains OPEN/DRAFT/UNMERGED at `69398d497c8e9be3e9fe7241e4dc6d3bc2e4c973`, stacked on #114. Issue #96 remains OPEN.
- Bounded code hardening: `proofs/d1-admission/src/github-actions-adapter.mjs` now fails closed unless `RUNNER_ENVIRONMENT=github-hosted`; fixture includes the documented value and adversarial test rejects `self-hosted`. Adapter blob `89f28778dab1ee10c7e39bebeaaf0a6270b9c750`; test blob `45d8751c597e4ac7eaced57225122311f9b98f4f`.
- Exact-head PR CI [44265881516](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44265881516), job [134670152674](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44265881516/job/134670152674): SUCCESS on exact SHA; 22/22 Workers-runtime tests. Exact-head push CI [44265877332](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44265877332), job [134670137185](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44265877332/job/134670137185): SUCCESS on same SHA; 22/22 tests. Logs confirm checkout + git log exact head, npm ci, syntax check and test suite.
- GitHub's documented `RUNNER_ENVIRONMENT` distinguishes `github-hosted` from `self-hosted`. The adapter still receives an injectable environment object for testability. Production wrapper must source actual process env and event from `GITHUB_EVENT_PATH`; this remains NOT IMPLEMENTED.
- Production `.github/workflows/cloud-pool-next-controller.yml` remains absent from default branch. No live event/API default-head re-read, hosted D1, approval issuer, Supervisor lease/fencing/recovery, outbox delivery, worker identity, provider route/quota or execution is qualified.
- PR #114/#125 formal reviews 0; ruleset #26550182 active but requires 0 approving reviews and 0 status checks. Independent A3 review NOT RUN. Gemini NOT RUN. No secret reads, provider calls, dispatch, deployment or merge.
- Report: [2026-11-18 runner environment admission guard](../reports/2026-11-18-next-runner-environment-admission-guard.md). Checkpoint: [runner environment admission guard](../checkpoints/2026-11-18-runner-environment-admission-guard.md).
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED. Next: independent A3 review + meaningful governance gates, then production event adapter with actual runner env, event file and authenticated default-head API read, preserving dispatch=false.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## /next — PR #125 production-boundary review — 2026-11-18
- Fresh reconciliation: default `Основной` HEAD `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`; PR #114 OPEN/DRAFT/UNMERGED at `ab9461eb84b14fe230918391d5212f19ca25592c`; PR #125 OPEN/DRAFT/UNMERGED at `69398d497c8e9be3e9fe7241e4dc6d3bc2e4c973`, stacked on #114. Issue #96 OPEN.
- PR #125 formal reviews: 0. PR #114 formal reviews: 0. Ruleset #26550182 ACTIVE but `required_approving_review_count=0`; no required status checks configured. Governance remains insufficient.
- Re-fetched PR #125 adapter blob `89f28778dab1ee10c7e39bebeaaf0a6270b9c750`, admission blob `9b48400c4abd784c5db9d0f8d6dde1e05ddb160e`, proof workflow blob `88b58aae536bc946d1c66d15871db868400b775d`.
- Positive controls: GitHub-hosted runner marker, fixed repository/owner numeric identities, exact new owner `/next` comment on Issue #96, workflow ref/SHA/run identity binding, and preserved `dispatch:false` / `executionAuthorized:false`.
- Qualification blockers: adapter accepts injected `event` and `environment` rather than reading `GITHUB_EVENT_PATH` and actual `process.env`; no authenticated GitHub API re-read of current default-branch HEAD; approval ID/profile are injected with no qualified production issuer; production controller workflow absent from default branch; no hosted D1 or live event qualification.
- Prior exact-head CI on PR #125 SHA: PR [44265881516](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44265881516) and push [44265877332](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44265877332) SUCCESS, 22/22 local Workers-runtime tests. CI does not prove production provenance or hosted D1.
- Posted explicit NOT-APPROVAL review note: [PR #125 comment 6973437035](https://github.com/VlDMlNSh/developer-cloud-pool/pull/125#issuecomment-6973437035).
- Report: [PR #125 production-boundary review](../reports/2026-11-18-next-pr125-production-boundary-review.md). Checkpoint: [PR #125 production-boundary checkpoint](../checkpoints/2026-11-18-pr125-production-boundary-review.md).
- Issue #96 owner correction means Gemini is optional supplementary, not mandatory per-/next or first-release. Gemini NOT RUN; no bypass.
- No secrets read, provider calls, dispatch, deployment or merge. Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Next: independent A3 review + meaningful required-review/status-check governance, then production wrapper reading actual runner inputs and independently checking current default HEAD. Keep dispatch disabled.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## /next — PR chain and governance revalidation — 2026-11-18
- Default `Основной` HEAD unchanged: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Current PRs: #114 OPEN/DRAFT; #116 OPEN/DRAFT head `aea59ae536358a827f05c2262647601ec53c8b33`; #120 OPEN/DRAFT head `e93fb34a1f3430ca2db32fbf2e631903aac9570f`; #124 OPEN/DRAFT head `9d575e4622022b066b7bd5ad3934cfa20a24f616`, base docs branch SHA `67a0cb1b84f7829bb3fc95e8e9f88b509c401bc8`, GitHub reports `mergeable=false`; #125 OPEN/DRAFT head `69398d497c8e9be3e9fe7241e4dc6d3bc2e4c973`. No PR merged.
- PR #124 current mergeability differs from stale PR body (body says mergeable=true on an earlier snapshot); root cause NOT VERIFIED, no force-push or rewrite performed.
- Ruleset #26550182 ACTIVE but requires 0 approvals and no required status checks. PR #114/#125 formal reviews 0. PR #116 has COMMENTED reviews on old heads, not current-head independent approval.
- Docs branch current head `9d575e4622022b066b7bd5ad3934cfa20a24f616`; Architecture Documentation Validation run [44268988130](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44268988130) COMPLETED/SUCCESS on exact SHA. Commit status API returned pending with zero status entries; no configured required-check evidence.
- PR #116 exact-head runner and pool contract runs [44264823103](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44264823103) and [44264822929](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44264822929) SUCCESS, but ephemeral runner smoke only; OS isolation/provider execution remain unqualified.
- Issue #96 OPEN; Issue #118 OPEN and persistent workspace remains blocked (no authorized host, Cloudflare Zero Trust tunnel/access, backup/restore evidence).
- Report: [PR chain and governance revalidation](../reports/2026-11-18-next-pr-chain-governance-revalidation.md). Checkpoint: [PR chain and governance checkpoint](../checkpoints/2026-11-18-pr-chain-governance-revalidation.md).
- Gemini remains optional supplementary capacity per Issue #96 correction; NOT RUN. No secrets read, provider calls, dispatch, deployment or merge.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Next: diagnose PR #124 mergeability against live base branch head, reconcile ancestry/stale evidence non-destructively, then independent A3 review on exact current heads. Dispatch stays disabled.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## LIVE OVERRIDE — PR #124 ancestry revalidation — 2026-11-18

This section supersedes stale PR #124 values in earlier context sections above. Always use live GitHub refs; prior PR body text is not authoritative.

- Default branch `Основной`: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- PR #120: OPEN / DRAFT / UNMERGED; head `e93fb34a1f3430ca2db32fbf2e631903aac9570f`; base default HEAD; GitHub `mergeable=true`, `mergeable_state=clean`.
- PR #124: OPEN / DRAFT / UNMERGED; current head `dd5b52b2ac28afc00354dcb6e017898ec8b1db86`; base ref `docs/cloud-pool-reference-architecture-2026-11-17`; recorded base SHA `67a0cb1b84f7829bb3fc95e8e9f88b509c401bc8`; current base branch head `e93fb34a1f3430ca2db32fbf2e631903aac9570f`; `mergeable=false`, `mergeable_state=dirty`.
- Compare current base branch to PR #124 head: diverged, 125 ahead / 3 behind; merge base `67a0cb1b84f7829bb3fc95e8e9f88b509c401bc8`. Base branch advanced exactly 3 commits since recorded PR base.
- Exact conflicting paths/root cause for `dirty`: NOT VERIFIED. No rebase, force-push or merge.
- PR #124 exact-head CI: commit status pending with 0 statuses; 0 check-runs; 0 PR-associated workflow runs. Exact-head CI NOT VERIFIED. Formal reviews: 0.
- Ruleset #26550182 active but requires 0 approvals and 0 status checks; insufficient critical-path governance.
- Issue #96 remains owner-only `/next` admission. Gemini optional; dispatch NOT RUN absent controller/security gates. Issue #118 persistent workspace remains OPEN / BLOCKED on host, Cloudflare access, persistence and restore evidence.
- No code change, test execution, deployment, provider call, secret access, or production dispatch in this pass. Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Latest report: [PR #124 ancestry revalidation](../reports/2026-11-18-next-pr124-ancestry-revalidation.md).
- Latest checkpoint: [PR #124 ancestry checkpoint](../checkpoints/2026-11-18-pr124-ancestry-revalidation.md).
- Next: inspect the 3 base-branch commits and overlapping paths; only then consider a non-destructive synchronization, followed by exact-head CI and independent review.

Canonical MediaHub map (reference only; Contour B remains deferred): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
