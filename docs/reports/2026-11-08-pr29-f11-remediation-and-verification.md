# 2026-11-08 — PR #29 F11 remediation and exact-head verification

Date: 2026-11-08 (Europe/Vilnius)  
Scope: Remediate the confirmed active-slot eligibility bypass in the pure provider slot admission planner, add regressions, and verify the resulting immutable PR head.  
Disposition: F11 CODE FIXED ON DRAFT BRANCH / EXACT-HEAD CI VERIFIED / NOT MERGED / NOT PRODUCTION-QUALIFIED.

## Immutable target and branch

- Repository: `VlDMlNSh/developer-cloud-pool`.
- PR #29: `feat: add pure provider quota ledger state machine`.
- Base branch: `Основной` at `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Original audited head: `34fc78921b16359d136db553d8a51b4a4716995d`.
- PR branch: `feat/quota-ledger-state-machine-2026-11-06`.
- New source commit: `787af11a999fe0067adf49509561b47bd635650d`; source blob: `d45791b32571cca4ce4a6f92cec89c70ec296747`.
- New test commit / PR head: `576510b4df47008b212884df361306b7d848277d`; test blob: `26310fc17f819b06172f4d443d34e7f476028c33`.
- PR #29 remains OPEN / DRAFT / UNMERGED.

## Original defect reproduced

At original source blob `b04fcb60c19cf911ae7e2f178268a1b1ceae193d`, `activeMatching` checked only slot ID and model. A synthetic active slot with qualification rejected, credential revoked, route auth_failed and paid billing was returned as admitted/usable even when task billing allowlist contained only free. The same slot was denied when inactive.

Reproduction used a local pure-module harness with no network, credentials, provider calls or paid resources. Observed output: active invalid route admitted; inactive control denied. This establishes a planner defect only, not a production dispatch or financial event.

## Implemented correction

One shared `isEligible` predicate now enforces all current route conditions for both active and new slots:
- qualificationStatus = accepted;
- credentialStatus = available;
- routeState = ready;
- requested model in slot model allowlist;
- billing class included in task allowedBillingClasses.

An invalid active slot is excluded from `usableSlotIds`, but continues to count against active capacity until its durable lease is actually released. Unknown active IDs also conservatively consume capacity. Empty billing allowlist fails closed.

## Regression coverage

Added cases for:
- active rejected qualification;
- active revoked credential;
- active auth-failed route;
- active paid route under free-only policy;
- invalid active slot plus a separate valid candidate;
- empty billing allowlist for active and new slots;
- unknown active ID capacity accounting;
- existing hard cap and new-route eligibility behavior.

## Verification evidence

- GitHub Actions run `42483338728`: Pool Contract Validation — COMPLETED / SUCCESS on new PR head `576510b4df47008b212884df361306b7d848277d`.
- Job `128739794680`: COMPLETED / SUCCESS.
- Retrieved job log confirms Node test summary: `1..43`, `# tests 43`, `# pass 43`, `# fail 0`. Newly added active-route regression cases are tests 30–33; all passed.
- Workflow URL: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42483338728
- Focused local synthetic regression harness: 5 tests passed; no provider/network/credential operations. The authoritative full suite result is the exact-head GitHub Actions log above.
- Source and test files were re-read from GitHub and their blob SHAs matched the write results.

## Boundaries and unresolved status

- This fixes F11 in the pure admission planner on the PR branch. It does not provide durable leases, atomic shared admission, quota-domain proof, provider account identity, credential broker, routing runtime or production enforcement.
- PR #29 is still DRAFT / UNMERGED. Do not merge based solely on this fix and CI.
- Review #29 still has CHANGES_REQUESTED by `maxkorolskiy88-ship-it`; no independent authorized reviewer/approval was observed in this pass.
- No secrets, secret presence, credentials, provider endpoints, provider quota or account were accessed. No provider call, Worker dispatch, remote D1, deployment or paid fallback occurred.
- Other Contour A blockers F1/F2/F3/F4/F5/F6/F7/F8/F9/F10 remain open or not qualified. Legacy default-branch Supervisor source remains a separate concern; this pass did not change default branch or dispatch settings.

## Decision and next sequence

1. Have an authorized independent reviewer inspect PR #29 at exact head `576510b4df47008b212884df361306b7d848277d`, including F11 regression and lease-capacity semantics.
2. Continue with F1/F2 and durable claim/lease/fencing/receipt/finalizer/recovery.
3. Resolve supply-chain F9 and stale completion F10 with exact-head tests.
4. Do not merge or enable dispatch until governance and runtime qualification gates pass.

F11: FIXED IN PR BRANCH / EXACT-HEAD CI VERIFIED.  
PR #29: OPEN / DRAFT / UNMERGED.  
Contour A: BLOCKED / NOT QUALIFIED / NOT ACCEPTED.  
Contour B: DEFERRED.  
Dispatch: KEEP DISABLED / FAIL-CLOSED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
