# Pass 18 — current-state revalidation and 45-hour launch estimate

Date/time: 2026-11-19 20:50 Europe/Vilnius
Status: VERIFIED — repository state refreshed; effort estimate recalibrated as a planning estimate, not a time-sheet measurement.
Contour A only. Contour B remains deferred.

## 1. Refreshed source of truth

- Default branch `Основной`: HEAD `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`; tree `c8c78a26a6359ec868922e4040c2870eec873b66`; commit signature verified.
- Default combined status is `pending` with zero contexts: NOT VERIFIED.
- Issue #140 remains OPEN.
- PR #146 remains OPEN/DRAFT/UNMERGED. Its exact-head CI runs remain:
  - Pool Contract Validation `44522152749`: SUCCESS
  - Isolated D1 Ledger Proof `44522152799`: SUCCESS
  These are candidate-branch checks, not integrated default or executor qualification.
- Documentation branch `docs/next-2026-11-19-integrated-contour-pass` HEAD `86a52376d7dbde661f31302bd336d720daccb846`; current Context Window read back from this branch.
- Pass 17 report and checkpoint were re-read. They confirm four PR #146 adapters still lack explicit `executionAuthorized:false` in their returned objects, and there are no end-to-end integrated runtime proofs.
- No code/schema/workflow/runtime change was made in Pass 18.

## 2. Reconciliation of the earlier 45-hour estimate

The earlier 45-hour figure is a project planning estimate. Neither chat timestamps, number of `/next` turns, GitHub commit timestamps nor CI durations measure active engineering hours. There is no approved time log with task start/stop records. Therefore actual hours elapsed/completed are **NOT MEASURED**.

For planning only, I credit completed work since that estimate with approximately **12–15 engineering-equivalent hours**. This is a deliverable-based estimate, not observed labor time:
- current baseline/governance revalidation and legacy dispatch retirement evidence;
- executor/profile/identity and OIDC contract analysis;
- candidate CI and migration-lineage audits;
- clean-base integration target freeze and migration/object ownership analysis;
- adapter fail-closed contract findings;
- reports, Context Window and checkpoints that preserve reproducible evidence.

Against the original 45-hour plan, this leaves approximately **30–33 engineering hours** to reach a qualified non-production launch/acceptance candidate, assuming no new architecture blockers and the existing free-tier/one-executor scope is retained.

## 3. Remaining critical-path estimate

| Work package | Remaining estimate | Current state |
|---|---:|---|
| A1 — finish CODE profile/output contract and identity binding | 1–2 h | Profile ID known; profile not qualified; four adapter output contracts need explicit false execution flag and tests |
| A2 — canonical D1 lineage and one task-ready outbox | 5–6 h | Source candidates audited; migration order and single authority not frozen |
| A3 — trusted admission, receipt, lease/fencing and replay tests | 4–5 h | Partial isolated proof only; no integrated exact-base adversarial run |
| A4 — no-secret sandbox, executor qualification and provenance | 5–6 h | No real executor/host/process qualification |
| A5 — end-to-end orchestration and recovery | 4–5 h | Not integrated; no correlated lifecycle trace |
| A6 — authenticated non-production web UI and persistence | 4–5 h | Not deployed; phone/desktop, D1/R2 persistence and recovery not verified |
| A7 — independent security review and acceptance dossier | 3–4 h | Not started; formal independent review absent |
| **Total** | **26–33 h** | **Planning range; central estimate about 30 h** |

The 30–33 h headline is the conservative working estimate after allowing for cross-package integration and acceptance overhead. The table is a range, not a guaranteed schedule. If hosted free-tier permissions, account/route qualification, executor host access, or security review are blocked, the calendar duration will be longer and the work estimate may increase.

## 4. What “launch” means in this estimate

The estimate targets a non-production Contour A qualification candidate, not production rollout:
- authenticated remote UI accessible from phone and desktop;
- one approved executor candidate operating in a bounded no-secret sandbox;
- D1-backed durable admission/task/attempt state and safe recovery;
- routing/account/quota identity separation with no paid fallback;
- all dispatch/execution gates remain fail-closed until qualification;
- exact-head tests, independent review and explicit owner acceptance.

A live provider/model route is not assumed as a prerequisite for the initial no-secret executor smoke. Any provider call requires its own route/account/quota qualification and authorization.

## 5. Actions, evidence and non-actions

- Re-read default commit, tree, signature, combined status, Issue #140, PR #146, candidate exact-head CI, current docs branch HEAD and Pass 17 documents.
- No local tests run in Pass 18.
- No hosted D1, secrets/variable values, provider calls, executor launch, dispatch, agents, deployment, merge or governance change.
- Gemini NOT RUN; Claude Code qualification NOT RUN.
- CODE profile remains PROPOSED / NOT QUALIFIED / NOT ENABLED.
- `dispatch:false`, `executionAuthorized:false`, `dispatchAuthorized:false` remain mandatory.

## 6. Next bounded engineering step

On a separately reviewed candidate-code pass, fix the four PR #146 adapter result contracts (`consume.mjs`, `claim-outbox.mjs`, `task-lease.mjs`, `task-attempts.mjs`) so every success and deny result explicitly returns both `dispatch:false` and `executionAuthorized:false`; add negative-first tests for success, validation denial, replay, unavailable storage and ambiguous writes. Do not enable dispatch. After tests, re-fetch exact head and require exact-head CI plus independent review. In parallel only after this bounded correction, freeze D1 source manifest/outbox ownership before SQL integration.

Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

Canonical MediaHub OS map (reference only; Contour B deferred):
https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
