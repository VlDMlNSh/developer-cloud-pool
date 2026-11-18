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
