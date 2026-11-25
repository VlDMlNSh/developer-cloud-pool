# Pass 87 — owner /next controller traceability and recovery contract

Date: 2026-11-25
Status: VERIFIED (bounded source/contract review and documentation publication) / BLOCKED (Contour A acceptance)

## Frozen target and scope

- Default branch: `Основной`; observed HEAD: `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- Documentation working branch: `docs/engineering-excellence-2026-11-23`; target before this pass: `bba9ad337834e4c67b26d2d9453dacf3d6b4347e`.
- PR #169: OPEN / DRAFT / UNMERGED; head `bba9ad337834e4c67b26d2d9453dacf3d6b4347e`; base `Основной`; 211 ahead / 2 behind current default; merge base `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`.
- PR #170: OPEN / DRAFT / UNMERGED; head `40281787c208af2df916f10af1dba073061ff0d3`; 41 ahead / 2 behind; same merge base.
- PR #171: OPEN / DRAFT / UNMERGED; head `423da55ca1e2d91c28572f88f60b494b59d56e9e`; 3 ahead / 2 behind; same merge base.
- Scope: map Issue #96 admission requirements to PR #170 local D1 proof, PR #171 audit-only intake and default-branch wiring; define trusted provenance and crash/rerun reconciliation sequence.
- Explicit exclusions: no code/schema/workflow/dependency changes, tests/CI dispatch, secrets/variables reads, hosted D1, provider calls, Gemini/Claude execution, deployment, merge, branch protection/ruleset changes or production mutation.

## Live repository revalidation

- Default HEAD re-read from commit search: `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- PR #169/#170/#171 remain OPEN, DRAFT, UNMERGED; GitHub's `mergeable=true` field is not a governance or merge approval.
- Combined commit statuses for all three current PR heads: empty. Formal review submissions: 0 each. Review threads: 0 each.
- PR #169 is documentation-only (211 commits ahead / 2 behind), but remains a large divergent branch. Do not merge as a substitute for a clean-base review.
- PR #170 is a local D1 proof package. Its validation workflow is pull_request-only, and the inert Worker is not a live controller.
- PR #171 changes only `.github/workflows/next-request-intake.yml` and the contract validator. Its workflow has `permissions: {}`, no secrets, checkout, external actions, D1 writes, API calls or dispatch. It writes an audit-only step summary.
- PR #171's predicate compares login strings and `github.actor` to `github.repository_owner`; this is not the immutable numeric owner/repository identity verification required by Issue #96. Its own PR description says it is intake-only, with no receipt or authority.
- Neither PR #170 nor PR #171 adds a production controller to the current default branch. The default branch remains at the observed older HEAD and the earlier Pass 86 path probes found no controller workflow there.
- Issue #96 is OPEN. Its latest scope correction (2026-11-17) says first executor is one Claude Code + ECC + FCC profile using an explicitly qualified free API route; Gemini is optional supplementary capability. The older four-Gemini-child requirement is not a first-release gate.
- Issue #94 has an owner scope correction with the same effect. Its older four-child text must not be used to force Gemini into initial Contour A.
- Issue #140 excludes branch-protection changes; no governance mutation is authorized.

## Requirement-to-evidence traceability

| Issue #96 requirement | Current evidence | Status | Missing qualification |
|---|---|---|---|
| Exact top-level Issue #96 `issue_comment.created` and body `/next` | PR #171 audit-only workflow checks issue number, non-PR comment and exact body | PARTIAL | Must run from trusted default branch; prove source metadata through GitHub API and immutable numeric identities |
| Owner identity and association | PR #170 local binder checks owner ID/login/OWNER association; PR #171 checks login strings | PARTIAL / NOT TRUSTED END-TO-END | Independently fetch/verify repository owner ID and comment author ID/association from GitHub API; bind repository numeric ID |
| Trusted default-branch workflow | PR #171 is a draft candidate; PR #170 workflow is PR-only | NOT IMPLEMENTED ON DEFAULT | Trusted workflow must exist on protected default branch; pin workflow path/ref/SHA and verify workflow bytes/ancestry against an owner-reviewed trust anchor |
| Immutable target SHA | PR #170 binder checks SHA syntax and default ref | PARTIAL | Resolve default branch HEAD via GitHub API once, persist it; define race/freshness rule and bind all downstream work to that value |
| Source-comment idempotency | Migration 0017 unique append-only source-comment receipt | LOCAL PROOF ONLY | Integrate with trusted controller; preserve first receipt and prove primary-first readback in live runtime |
| Durable admission before dispatch | D1 local composition writes admission then receipt; dispatch flags false | LOCAL PROOF ONLY | Production durable store, atomicity/commit semantics, lease/fencing and controller-owned outbox/reconciliation |
| Ambiguous API response recovery | Pass 86 tests cover lost acknowledgement/partial readback at local D1 boundary | PARTIAL | Query GitHub Actions runs/jobs by trusted workflow/run metadata and source key before any retry; no duplicate dispatch |
| Controller run ID and target SHA persisted | Local binder accepts run ID/attempt fields | NOT VERIFIED | Fetch run from GitHub API and validate repository, workflow ID/path, event, actor, ref, SHA, attempt and conclusion |
| Four Gemini children | Historical Issue #94/#96 four-child wording | NOT A FIRST-RELEASE GATE | Latest owner correction makes Gemini optional; first CODE path is Claude Code + ECC + FCC + qualified free route |
| Artifact/job provenance | No live child runs or artifacts | NOT RUN | Verify job IDs, conclusions, artifact ownership, target SHA, wave/source identity and SHA-256 digests |
| Secret isolation / no-secret probe | PR #171 has no secrets and empty permissions; no live probe | PARTIAL | Trusted-default-branch no-secret probe; verify permissions/scopes by metadata only, never values |
| Governance, exact-head CI, independent review | All three PR heads have empty combined statuses, 0 reviews and 0 threads | NOT VERIFIED | Rebase/clean-base candidate, exact-head and merge-result CI, required review, effective ruleset and provenance |
| Repeated qualification / acceptance | No live runtime, UI or execution qualification | NOT RUN | Responsive UI, CODE runtime, routing, quota accounting, persistence, recovery, audit and independent acceptance |

## Trusted provenance contract (design; not implementation)

1. **Source identity:** derive repository numeric ID, owner numeric ID, issue number, comment ID, comment author numeric ID, author association, event action and exact body digest from the GitHub event plus authenticated GitHub API readback. Do not treat login-string equality as sufficient owner proof.
2. **Trusted workflow:** execute only a workflow present on the protected default branch. Verify workflow path/ID, ref, SHA and bytes/digest against a reviewed trust anchor. A caller-provided `workflow_ref`, `workflow_sha` or `GITHUB_SHA` is evidence input, not independent authentication.
3. **Run attestation:** fetch the Actions run by run ID from the repository API and verify repository ID, workflow ID/path, event type, actor/triggering actor, head branch, head SHA, run attempt and created time. Fetch job metadata for the controller job. Reject any mismatch or unavailable API readback.
4. **Target pinning:** after source validation, resolve the default branch ref once using GitHub API; store its exact commit SHA as `target_sha`. All later stages use only this immutable value. If the default branch moves before the trusted resolution is recorded, restart admission rather than silently substituting a new SHA.
5. **Admission transaction:** create one immutable source-comment admission keyed by (repository ID, issue number, comment ID). Persist event digest, verified actor IDs, workflow/run provenance, target SHA, and a controller-owned wave ID. Read back the full tuple before progressing.
6. **Outbox/dispatch boundary:** commit a fixed, controller-owned dispatch intent before calling GitHub Actions. External dispatch is not atomic with D1. Model intent as PENDING → CLAIMED → SENT or UNKNOWN → RECONCILING → COMPLETED/FAILED. Never mark SENT solely because the HTTP request returned; reconcile the GitHub API first.
7. **Retry and rerun semantics:**
   - Same source comment + same run ID + same attempt: duplicate delivery; return the original admission and do not dispatch again.
   - Same run ID + incremented attempt: workflow rerun; append an attempt/reconciliation record linked to the original source key; do not overwrite immutable first receipt or create a new wave.
   - Different controller run ID for the same source comment: treat as a possible recovery/replay; query runs and children for the source key/wave correlation before any dispatch. If outcome is ambiguous, keep UNKNOWN/RECONCILING and fail closed.
   - New source comment ID: a new request only if it independently satisfies owner/event gates and repository-wide lease/fencing.
8. **Child correlation:** only after all gates and separate explicit authorization, use fixed controller-defined workflow/job names and task envelopes. For first Contour A, the owner-approved first execution target is Claude Code + ECC + FCC, not mandatory Gemini children. Every run/job/artifact must bind to the same source comment, wave ID and target SHA.
9. **Evidence:** verify run/job conclusions and artifact IDs, names, sizes, expiry and SHA-256 digests. A missing, duplicated, expired or mismatched artifact is NOT VERIFIED; never infer success from a dispatch HTTP response.
10. **Fail-closed:** missing API metadata, workflow digest mismatch, stale ref, absent durable store/lease, ambiguous dispatch, partial child creation, quota/auth failure or artifact mismatch means no additional dispatch and no execution authorization.

## Reuse First

- No new OSS dependency is justified for this documentation-only pass.
- Retain the existing pinned Cloudflare Workers Vitest/Miniflare/workerd harness for local D1 contract tests.
- For future GitHub provenance, prefer the platform's native Actions context plus narrowly scoped GitHub REST API reads already available to the trusted workflow; avoid introducing a second event bus or parallel admission ledger.
- Before any library is added, evaluate upstream maintenance, license, security posture, API fit and whether existing repository dependencies already provide the needed functionality.

## Tests, agents and metrics

- Tests newly run: 0 (documentation-only).
- CI triggered: 0. Exact-head combined statuses for PR #169/#170/#171: empty; no passing check is established.
- Formal reviews / review threads: 0 / 0 for each PR.
- Gemini Agents 1/2/3 and optional Gemini Agent 4: NOT RUN; no controller dispatch or authorization.
- Claude Code + ECC + FCC: NOT RUN; no verified host/session or explicit runtime qualification.
- Secret/provider calls, hosted D1, deployment, production writes, merge and governance changes: NOT RUN.
- Active engineering time: NOT MEASURED. Wall-clock pass duration is not represented as engineering effort.
- Defects/blockers: no trusted default-branch controller; PR #170 remains local-only and divergent; PR #171 remains audit-only and login-string based; no run-level GitHub API attestation; no durable controller outbox/dispatch reconciliation; no exact-head CI/reviews; no independent acceptance.

## Decision and next step

Contour A remains BLOCKED / NOT ACCEPTED. Contour B remains DEFERRED.
Next bounded engineering step: design and implement (on a clean current-default branch only after freezing the target SHA) a non-dispatching trusted-main controller proof that independently reads GitHub repository/issue/comment/run metadata, persists one idempotent admission and a controller-owned reconciliation/outbox record, and demonstrates rerun/ambiguous-response recovery with no secrets or provider calls. Keep live dispatch disabled; do not change governance without explicit owner authorization.

Canonical MediaHub map (deferred project): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
