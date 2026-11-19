# Pass 13 — Contour A launch critical path and effort estimate

Date: 2026-11-19
Status: VERIFIED planning assessment from refreshed GitHub evidence; implementation/deployment NOT RUN.
Immutable default baseline: `Основной` @ `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
Work branch before this report: `feat/issue140-canonical-admission-lease-2026-11-19` @ `db9aa4aeeb4299d2157ac2087b25bc17702381a4`.
Controlling governance: Issue #140 OPEN; local no-secret qualification only.

## Refreshed repository state

- Default branch remains `Основной` at `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- PR #145 remains OPEN / DRAFT / UNMERGED; docs-only, base is default, head `bbec30424ecf2c59152ac96b8daefd176715c0b9`.
- PR #146 remains OPEN / DRAFT / UNMERGED; base is default, head branch `feat/a1-jarvis-code-sandbox-profile-2026-11-19`, reported head `9d32c4943ae87f5855ab05d42a4ba12d1c205211`.
- PR #146 metadata/body are inconsistent: the PR metadata reports head `9d32c4943ae87f5855ab05d42a4ba12d1c205211`, while its body claims latest branch head `e1fe084744a9fad7d2d5c4d0a43ba09a2f7b9f1a` after documentation-only updates. The branch ref was not independently reconciled in this pass; effective PR head/CI linkage is NOT VERIFIED.
- PR #147 remains OPEN / DRAFT / UNMERGED; docs-only, stacked on #146, reported head `0ea6dcd589b914399a66e289190e00addbf6d9a1`.
- Formal review lists for PR #146 and #147 returned zero reviews.
- Issue #140 remains OPEN. It prohibits hosted D1 provisioning/writes, secrets/variables inspection, provider calls, dispatch, deployment, merge and production actions.
- Active ruleset `26550182` targets `refs/heads/Основной`, requires PR and review-thread resolution, requires zero approving reviews, and has no bypass actors. Classic branch-protection endpoint reports disabled; the active ruleset is the operative governance evidence.
- The work branch compares 12 commits ahead / 0 behind the immutable default baseline. Its change set is documentation-only; it includes Pass 10/11 and two distinct Pass 12 source-audit/lineage documents.
- The most recent reviewed work-branch commit before this report was `db9aa4aeeb4299d2157ac2087b25bc17702381a4`. Exact-head workflow-run and combined-status queries for it returned empty collections: CI NOT VERIFIED.
- Pass 12 current-base integration gate found five candidate source branches divergent from current default (55/1, 57/3, 82/144, 4/1, 36/3 ahead/behind). No wholesale branch transplant is justified.
- Current default lacks `.github/pool-executor-registry.json`; no executor activation is present on the default branch.
- Default commit `b81d2b5...` retires the legacy label-driven DSH dispatch route. This is a fail-closed safety change, not a live replacement executor.

## Technical critical path

1. **Canonical D1 admission/attempt/lease proof:** pin PR #67/#72 lineage; map migration/table/trigger/API ownership; reconcile claim/outbox semantics; select one attempt-bound lease authority; enforce both `dispatch:false` and `executionAuthorized:false` on every adapter result; test replay, approval reuse, stale SHA, lease expiry, fencing, partial writes and invalid profiles.
2. **Trusted execution boundary:** bind trusted GitHub Actions context; qualify host/process identity separately from OIDC workflow identity; keep registry empty until sandbox qualification; prove one allowed executor end-to-end without changing existing routes.
3. **Durable task lifecycle:** submit, claim, execute, heartbeat, cancel, finalize, recover and audit against persistent state, with quota accounting. Hosted D1 and live execution are currently prohibited by Issue #140.
4. **Remote web interface:** verify the existing UI prototype against the actual control-plane API; choose a genuinely free persistent hosting path; implement owner authentication; test browser access from phone and desktop. GitHub-hosted runners are ephemeral, not persistent web hosts.
5. **Security and acceptance:** prove secret/workspace/network isolation, quota separation, revocation/kill switch, no cross-executor access, free-tier limits and recovery; obtain independent review and publish evidence for every Contour A criterion.

## Effort estimate

Units are focused engineering hours, not elapsed calendar time. Assumptions: one experienced engineer, reuse of existing repository work, no new product scope, no paid infrastructure, and timely availability of approvals and credentials for explicitly authorized live qualification. Waiting for owner approval, external review queues, account remediation and hosting-provider delays are excluded.

| Milestone | Remaining focused effort | Confidence |
|---|---:|---|
| Local canonical D1 + adapter/lease proof and exact-head CI | 12–20 h | Medium-low |
| One executor sandbox + trusted provenance + lifecycle/recovery qualification | 16–28 h | Low |
| Authenticated remote UI connected to the real API and persistent free hosting | 10–18 h | Low |
| Quotas, secret/workspace/network isolation, revoke and end-to-end tests | 12–20 h | Low |
| Independent security review, remediation allowance and acceptance evidence | 8–16 h | Low |
| **Full Contour A total** | **58–102 h** | **Low** |

- **Restricted read-only demonstrator:** approximately 20–35 focused hours, conditional on the existing UI prototype being reusable and a free persistent hosting path being verified. This is not a working executor pool and is not Contour A acceptance.
- **First controlled task execution with one qualified executor:** approximately 40–65 focused hours from the refreshed state.
- **Full Contour A acceptance:** approximately 58–102 focused hours.

The estimate is intentionally a range: exact-head CI on the current work-branch head is not verified, current-base D1 integration is not implemented, and there is no evidence of live deployment or execution.

## Hard governance blockers

Issue #140 currently prohibits the hosted/live actions required for deployment and qualification. Until the owner revises that governance through the proper GitHub process, the live-launch portion is BLOCKED regardless of available engineering hours. No estimate overrides the issue.

No evidence currently establishes a deployed persistent web interface, live executor operation, real provider routing, hosted durable state, quota enforcement or end-to-end isolation. Draft PR status and historical green checks do not establish acceptance.

## Next bounded engineering pass

Continue with the current-base D1 lineage gate: pin exact PR #67/#72 commits and map migration/table/trigger/API ownership before any selective transplant. Under current Issue #140, remain local/no-secret only. Do not deploy, merge, dispatch, inspect secret values, write hosted D1 or call providers.

Contour A: NOT ACCEPTED. Contour B: DEFERRED.
