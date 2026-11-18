# GITHUB CONTEXT WINDOW — DEVELOPER CLOUD POOL

## CURRENT RECONCILED SNAPSHOT — 2026-11-18

This is the primary cross-chat recovery record for Cloud Development Pool. Always re-read live refs, exact-head CI, issues, PRs, rulesets and contracts before each engineering pass. A draft PR or passing local test is not production acceptance.

### Repository and immutable refs
- Repository: `VlDMlNSh/developer-cloud-pool`, public; default branch: `Основной`.
- Default HEAD at this pass: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- PR #120: OPEN / DRAFT / UNMERGED; architecture parent branch head `67a0cb1b84f7829bb3fc95e8e9f88b509c401bc8`.
- PR #124: OPEN / DRAFT / UNMERGED; branch `docs/unified-realization-integration-2026-11-17`; head immediately before this Context Window refresh `721f23757dbff8d943c2e0a7c78917e8277b2248`; base PR #120 head above. This branch contains the Unified Realization Map 1.0, Architecture Assurance Addendum, Independent Scorecard and dated reports/checkpoints. All are proposals until review/merge.
- PR #114: OPEN / DRAFT / UNMERGED; head `ab9461eb84b14fe230918391d5212f19ca25592c`; base default HEAD. Local Workers-runtime D1 atomic admission proof, 12/12 tests in its qualification run; not hosted D1 or live webhook qualification.
- PR #125: OPEN / DRAFT / UNMERGED; branch `proof/d1-github-actions-context-adapter-2026-11-18`; exact head `c58494e730df0dd83620a085f870c811f9e1b0e0`; base PR #114 exact head above; compare 17 ahead / 0 behind; mergeable=true at read-back; formal reviews 0.
- PR #125 changes: runner-provided GitHub Actions context binding; strict repository/owner numeric identity and Issue #96 owner-comment predicate; default-ref and fixed workflow-ref validation; derives target/default SHA from `GITHUB_SHA`, code SHA from `GITHUB_WORKFLOW_SHA`, run ID/attempt from their matching runner variables; persists `controller_run_attempt` into the D1 receipt and envelope digest; preserves `dispatch:false` / `executionAuthorized:false`.

### Exact-head verification for PR #125
- PR workflow [44252929666](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44252929666), job [134627714836](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44252929666/job/134627714836): COMPLETED / SUCCESS on exact head `c58494e730df0dd83620a085f870c811f9e1b0e0`.
- The job log proves `git checkout` and `git log -1` both returned the exact PR head, not the PR merge commit.
- Tests: 2 files, 20/20 PASS (12 original D1 admission tests + 8 Actions context tests). `npm ci`, syntax check and `npm run check` succeeded.
- Push validation [44252926012](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44252926012): COMPLETED / SUCCESS on the same exact SHA.
- Earlier intermediate CI failures were corrected; only these final successful exact-head runs are evidence for the current code head.
- Report: [2026-11-18 GitHub Actions context adapter proof](../reports/2026-11-18-next-github-actions-context-adapter.md).
- Checkpoint: [2026-11-17 independent audit integration checkpoint, appended 2026-11-18](../checkpoints/2026-11-17-independent-audit-integration-pass.md).

### Architecture invariants and priority
- Cloud Pool is Contour A only. Contour B / MediaHub OS is prohibited until Contour A is formally ACCEPTED.
- One user-facing Jarvis surface; modular-monolith Control Plane; one canonical Jarvis-to-evidence path; exactly one transactional operational-state authority; separate ephemeral Actions execution and persistent Engineering Workspace planes.
- Immutable task target SHA, least-privilege execution profiles, separate issuer/provider/account/quota identities, durable idempotent admission, fenced leases, outbox/inbox and ambiguity reconciliation.
- No paid fallback, no cross-account key cycling, no provider secrets in generic workers. Gemini is controller-only and supplementary, not a launch prerequisite.
- Reuse mature upstream components when requirements fit; no duplicate framework, router, database or workspace manager without a demonstrated gap.
- GitHub-hosted Actions runners are ephemeral, not persistent web hosts or workspace storage.

### Governance and open blockers
- Active ruleset #26550182 targets `refs/heads/Основной`; enforcement active; requires PR and review-thread resolution; deletion and non-fast-forward prohibited. It still requires **0 approving reviews and 0 status checks**; no bypass actors; current user cannot bypass. Governance remains insufficient for critical acceptance.
- Classic branch protection API reports `protected=false`; active ruleset is the effective control observed.
- PR #125 formal review submissions: 0. Do not merge without independent A3 security/contract review. PR #114 parent remains Draft/unmerged.
- Issue #96 is the only intended Cloud Pool owner-only `/next` admission control issue.
- The allowlisted `.github/workflows/cloud-pool-next-controller.yml` reference in the adapter is a planned controller path and is **not present on default branch**. PR #112's workflow is read-only; PR #114/125 are proof code, not production controller integration.
- GitHub Actions `issue_comment` is documented to run on the last commit of the default branch and only when the workflow file exists on the default branch. The current tests use synthetic event/environment fixtures; no live event/signature/API provenance or independent default-ref API read has been proven.
- Hosted D1 entitlement, persistent state, backup/restore and hosted contention remain NOT VERIFIED. No production approval issuer, Supervisor lease/claim/fencing/recovery, outbox delivery or worker identity qualification.
- Authenticated Jarvis deployment NOT VERIFIED; real free provider route/account/quota NOT QUALIFIED; persistent Workspace remains BLOCKED by Issue #118 (no active authorized host, Cloudflare zone/Tunnel/Access or restore proof in its latest recorded evidence).
- The default-branch `.github/workflows/gemini-batch-dispatch-controller.yml` is absent (404). Four Gemini tasks for the requested wave are **NOT RUN**. Do not substitute MediaHub's controller, call Gemini directly or bypass gates.
- No secrets read, provider calls, dispatch enablement, hosted resources, deployment, merge or acceptance occurred in this pass.

### Current status and next step
- GitHub Actions context binding + local D1 composition tests: VERIFIED on PR #125 exact head only.
- Production webhook/controller: NOT IMPLEMENTED / NOT QUALIFIED.
- Hosted D1, live owner-event authenticity, durable Supervisor/recovery, worker identity and real provider route: NOT QUALIFIED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
- Next: independent A3 architecture/security review of PR #125 and parent PR #114; only afterward plan hosted D1 and trusted default-branch controller qualification. Keep all dispatch disabled.

Canonical MediaHub map (separate repository/control plane): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
