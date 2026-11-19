# Pass 12 — Contour A launch critical path and effort estimate

Date: 2026-11-19
Status: VERIFIED planning assessment from refreshed GitHub evidence; implementation/deployment NOT RUN.
Immutable default baseline: `Основной` @ `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
Reviewed documentation/work branch commit: `1fe5975d1074493e250d82e55bbfbf0602d20172`.
Controlling governance: Issue #140 OPEN; local no-secret qualification only.

## Refreshed state

- Default branch remains `Основной` at `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- PR #146 remains OPEN / DRAFT / UNMERGED, base `Основной`, head branch `feat/a1-jarvis-code-sandbox-profile-2026-11-19`, reported head SHA `9d32c4943ae87f5855ab05d42a4ba12d1c205211`. No formal reviews returned.
- PR #147 remains OPEN / DRAFT / UNMERGED, stacked on PR #146, reported head SHA `0ea6dcd589b914399a66e289190e00addbf6d9a1`. No formal reviews returned.
- Issue #140 remains OPEN. It prohibits hosted D1 provisioning/writes, secrets/variables inspection, provider calls, dispatch, deployment, merge and production actions.
- Active ruleset `26550182` targets `refs/heads/Основной`, requires PR and review-thread resolution, requires 0 approving reviews, has no bypass actors. Branch endpoint reports classic protection disabled; active ruleset is the relevant protection evidence.
- Work branch `feat/issue140-canonical-admission-lease-2026-11-19` compares 6 commits ahead / 0 behind the immutable default baseline. Its changes are documentation-only: Pass 10/11 reports and checkpoints plus Context Window.
- Latest recorded work-branch commit `1fe5975d1074493e250d82e55bbfbf0602d20172` is specifically a Context Window documentation commit, not a code/test commit.
- Exact-head workflow runs and combined status for `1fe5975...` returned empty collections. CI is NOT VERIFIED, not green.
- PR #146/#147 formal review lists returned empty.
- Existing default commit `b81d2b5...` retires legacy label-driven DSH dispatch. This is a fail-closed safety change, not a live replacement executor.

## Technical critical path

1. Canonical current-base D1 admission/attempt/lease chain: reconcile the incompatible claim/outbox paths and lease APIs; enforce both `dispatch:false` and `executionAuthorized:false` on every adapter result; prove replay, approval consumption, lease expiry, monotonic fencing, partial-write recovery and invalid-profile denial.
2. Trusted execution boundary: bind only trusted GitHub Actions context; qualify process/host identity separately from OIDC workflow identity; preserve empty executor registry until sandbox qualification; prove one permitted executor end-to-end without changing existing routes.
3. Durable task lifecycle: submit, claim, execute, heartbeat, cancel, finalize, recover and audit with persistent state and quota accounting. Hosted D1 and provider/live execution remain prohibited by current Issue #140.
4. Remote web interface: verify the existing UI prototype/console against the actual control-plane API; deploy to a genuinely free persistent hosting path; authenticate; test phone and desktop access. GitHub-hosted Actions runners are ephemeral and are not a persistent web host.
5. Security/governance and acceptance: prove secret/workspace/network isolation, quota separation, revocation/kill switch, no cross-executor access, free-tier constraints and independent review; publish evidence for every Contour A acceptance criterion.

## Effort estimate (planning range, not a promise)

Estimate units are focused engineering hours, not elapsed calendar time. Assumes one experienced engineer, reuse of existing repository work, no new product scope, no paid infrastructure, and timely access to the approvals/credentials needed for explicitly authorized live qualification. Ranges include implementation, tests and evidence work but exclude waiting time for owner approvals, external review queues and provider/hosting account remediation.

| Milestone | Remaining focused effort | Confidence |
|---|---:|---|
| Minimal local canonical D1 + adapter/lease proof and exact-head CI | 12–20 h | Medium-low |
| One executor sandbox + trusted provenance + lifecycle/recovery qualification | 16–28 h | Low |
| Authenticated remote UI connected to the real API and persistent free hosting | 10–18 h | Low |
| Quotas, secret/workspace/network isolation, revoke and end-to-end tests | 12–20 h | Low |
| Independent security review, remediation allowance and acceptance evidence | 8–16 h | Low |
| **Full Contour A total** | **58–102 h** | **Low** |

A first restricted demonstrator (authenticated browser console plus a non-production/read-only status path) may be achievable in approximately **20–35 focused hours**, provided the existing UI prototype is reusable and a free persistent hosting path is verified. That is not a working executor pool and is not Contour A acceptance.

A first controlled task execution with one qualified executor is estimated at **40–65 focused hours** from the refreshed state. Full Contour A acceptance is estimated at **58–102 focused hours**. These ranges are deliberately wider because exact-head CI is not verified, the current D1 proof is not integrated, and no live deployment/execution evidence exists.

## Hard blockers that time estimates cannot bypass

- Issue #140 currently prohibits the hosted/live actions required for deployment and qualification. Until the owner changes that governance through the proper GitHub process, those steps are BLOCKED regardless of engineering hours.
- No proof currently establishes a deployed persistent web interface, live executor operation, real provider routing, hosted durable state, quota enforcement, or end-to-end isolation.
- PR #146 and #147 are drafts and unmerged; no formal reviews were returned. Their status is not acceptance evidence.
- Empty workflow/status results on the latest documentation commit are NOT VERIFIED.
- No approved executor dispatch or Gemini/controller launch was attempted.

## Next bounded engineering pass

After the current governance boundary is explicitly revised, continue with the single current-base D1 adapter contract and attempt-bound lease proof. Before that, only local no-secret work is permitted. Do not deploy, merge, dispatch, inspect secret values or call providers under the current Issue #140.

Contour A: NOT ACCEPTED. Contour B: DEFERRED.
