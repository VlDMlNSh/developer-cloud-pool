# 2026-11-11 — Canonical Context Window draft source reconciliation

## Scope and immutable inputs
Reviewed the compact draft against the current default-branch source and active proof metadata. No code, workflow, repository variable, secret, PR state, branch protection or deployment was changed.
- Default branch latest commit search: `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- Default README blob: `fea44c2485b604432ab9ee20293c3e1f7ee8bdec`.
- Default Supervisor workflow blob: `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`.
- Default Worker workflow blob: `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`.
- Default Supervisor script blob: `52bf03ca889edd92fd10c71ae96a2e35e106d43f`.
- Supervisor architecture blob: `3ac28f2f105a20a4eed5d93168bbe84d2d5273b8`.
- Issue #38 remains OPEN; it explicitly requires a durable single-use claim design, real one-winner contention, recovery tests, least-privilege authority and independent review before enabling either dispatch gate.
- Issue #22 remains OPEN; it requires authenticated remote web access, deployed mobile/desktop reachability, a versioned API and separate authorization before operational mutations.

## Findings that change the canonical draft
1. The current default branch still contains the older direct Supervisor → `workflow_dispatch` Worker chain. The Supervisor reads `POOL_DISPATCH_ENABLED` and exits heartbeat-only unless its literal value is `true`; the workflow itself has `issues:write` and `actions:write`. The Worker is manually dispatchable and only permits the `dsh-headless-probe` profile. README and architecture classify the pool as scaffold / NOT RUN, and no general-purpose agent execution, checkpoint/resume or production deployment is claimed.
2. PR #37 is a material authorization-boundary proposal and was missing from the draft's active proof stack. Current head `1be8672c1be1a720b6c813dcafff5c020b6456ae`, base SHA `197ba98d0dc7d8437d759dd25bee8750d02e59ae`; current default comparison is DIVERGED 36 ahead / 3 behind, merge base `197ba98d0dc7d8437d759dd25bee8750d02e59ae`. Exact-head validation runs `42484039940` and `42484039932` are SUCCESS. The proposal changes Supervisor/Worker composition to a reusable Worker and finalizer, adds caller/callee identity checks and an additional authorization-accepted gate. It remains OPEN/DRAFT/UNMERGED. The CI results are static boundary/contract validation, not proof of a live reusable Worker or production integration.
3. PR #37 has historical CHANGES_REQUESTED reviews from 2026-11-08 on earlier content. These are not current-head independent approvals. Do not treat current green validation as resolving review findings without a new review against current immutable SHA.
4. PR #55 is a distinct approval-event evidence-only proof, head `edff010388897f23f58bceb92e5180a09970fdff`, OPEN/DRAFT/UNMERGED. Exact-head runs `42797001864` and `42797001989` are SUCCESS. The verifier's positive result still has `dispatch:false`; protected approver config, trusted time/expiry, canonical envelope hashing, D1 consume/outbox, runtime permission smoke test and independent qualification remain absent.
5. Existing PR #51/#56 reconciliation queue and no-takeover proofs remain isolated local Workers-runtime evidence; PR #57 remains a read-only Actions-run evidence adapter. None supplies production Supervisor integration or retry authority.
6. The Gemini controller path in the governing project instruction belongs to `VlDMlNSh/mediahub-os`, not the Cloud Pool repository. Canonical draft wording was clarified to name the repository and preserve the single approved controller route. No controller dispatch was attempted.

## Exact-head evidence re-read
- PR #37 head `1be8672c1be1a720b6c813dcafff5c020b6456ae`: runs `42484039940`, `42484039932` SUCCESS.
- PR #55 head `edff010388897f23f58bceb92e5180a09970fdff`: runs `42797001864`, `42797001989` SUCCESS.
- Previously re-read PR #25/#52/#51/#56/#57 heads and CI remain recorded in the prior portability report; they must be re-read again before any integration action.

## Draft changes made
Updated `docs/drafts/GITHUB-CONTEXT-WINDOW-CANONICAL-DRAFT.md` on the continuation documentation branch:
- Added PR #37 as the unmerged Supervisor→reusable Worker authorization-boundary proposal, including its divergence and CI limits.
- Added PR #55 as an approval-event evidence-only proof, explicitly retaining `dispatch:false`.
- Added Issue #38 durable claim/authority criteria and Issue #22 web-console acceptance requirements to blockers.
- Clarified that Gemini controller execution is only via the approved workflow in `VlDMlNSh/mediahub-os`.
- Reaffirmed that default Supervisor/Worker remain scaffold / NOT RUN, dispatch remains fail-closed by policy, and green fixture CI is not deployment/acceptance.

## Disposition
- Source-to-draft reconciliation: VERIFIED for the files and refs listed above.
- Canonical draft completeness: improved, but NOT FINAL; additional open PRs exist and current-head recheck remains mandatory before default-branch PR.
- Default branch modification / branch creation / PR: NOT RUN.
- Dispatch / deployment / secrets / provider calls: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

## Next bounded step
Re-read the updated draft and its blob SHA, inspect whether the draft overstates the current PR #37 finalizer/authorization guarantees, and reconcile the remaining active authorization/quota/claim PRs before creating a default-based branch. Preserve the continuation branch as an evidence archive.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
