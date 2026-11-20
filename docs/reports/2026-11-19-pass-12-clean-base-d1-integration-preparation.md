# 2026-11-19 — Pass 12: clean-base D1 integration preparation

**Status:** VERIFIED — read-only base/branch/PR dependency audit; no implementation.
**Current default:** `Основной` @ `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
**Issue #140:** OPEN.
**Docs branch:** `docs/next-2026-11-19-integrated-contour-pass`; PR #145 OPEN / DRAFT / UNMERGED.
**Scope:** inspect current default D1 path, existing integration/proof branches, PR #143 and its ancestry, and reconcile Pass 11 proposal against Issue #140's existing source-level audit.

## 1. Current default and clean-base result

Recursive Git tree at `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5` returned `truncated=false`. No `proofs/d1-ledger/`, `proofs/d1-admission/`, D1 SQL migrations or D1 source package are present on current default. This confirms there is no existing D1 package path collision on the frozen default tree; it does not prove semantic or authority compatibility.

Current default is exactly one commit ahead of previous PR #143 base `68183828cf7934e89109310c8f99281be4eb7ed8`. The only changes between those two default commits are:
- `.github/workflows/pool-contract-validation.yml`
- `.github/workflows/pool-supervisor.yml`
- `.github/workflows/pool-worker.yml`
- `scripts/pool-supervisor.mjs`
- `scripts/validate-pool-contract.mjs`
- one legacy-dispatch-retirement report.

## 2. Existing integration/proof branches

- `integration/d1-current-base-2026-11-18`: inspected D1 package path; `proofs/d1-ledger/` is absent. It is not a ready D1 implementation branch.
- `integration/d1-ledger-clean-main-2026-11-15`: D1 package path exists with migrations, fixtures, src, tests and package manifests. It is a separate pre-existing integration candidate; its ancestry and complete object inventory were not proven in this bounded pass. Do not overwrite or duplicate it.
- `proof/d1-current-base-ledger-2026-11-18`: contains an alternative PR #143 ledger package.
- Other branches `proof/d1-lease-attempt-fencing-2026-11-18`, `proof/d1-result-outbox-fencing-2026-11-18`, `proof/d1-result-outbox-qualification-2026-11-18`, and two bootstrap-watermark fixes contain additional divergent D1 variants. None is canonical by branch name alone.

## 3. PR #143 is not a clean transplant candidate as-is

PR #143 head: `3d189df6a4242325ad6261fb38d6e03d7ac6eebd`; base: `68183828cf7934e89109310c8f99281be4eb7ed8`.
Comparison against current default `b81d2b5...`: diverged, 55 commits ahead / 1 behind; merge base is exactly the old base. All 28 changed paths are additions, so the current one-commit default delta has no same-path overlap with the PR's added files. However this does not make the PR semantically compatible with the canonical #67/#72 lineage.

PR #143 adds migrations 0001–0007:
- 0001–0005 have the same blob SHAs as PR #67.
- 0006 is the running-attempt lease guard.
- 0007 binds executor identity.
It omits PR #67's projection-delivery migrations 0006–0010 and PR #72's atomic admission migration 0011/composite adapter. Its 0006 therefore occupies the same ordinal as #67's projection outbox migration. PR #143 also retains `dsh-headless-probe` in the approval/consume/registry profile contract. Existing exact-head CI runs `44367978517` and `44367978376` succeeded on #143's exact head, but the source-level owner audit recorded in Issue #140 states that it is not qualified for canonical executor admission.

## 4. Reconciliation with existing Issue #140 audit

Issue #140 comments and Draft PR #141's report contain prior findings that materially qualify Pass 11:
- PR #114/#125 create a separate `proofs/d1-admission` authority. Do not combine that schema root with #67/#72 or #111.
- PR #111 and #114/#125 independently define `pool_approval_ledger`; they have incompatible `pool_tasks` shapes and outbox keys/event semantics.
- PR #111 has an approval-keyed `pool_task_outbox` and a second task-level `pool_task_delivery_outbox`; do not import those queue APIs as another authoritative path.
- #67/#72 is the selected intended lineage according to the default-branch design contract and the follow-up audit in PR #141, but it needs a complete clean-base selective port and fixes, not blind stacking.
- #67 0002/0003 retain both a legacy approval-keyed claim/outbox path and task-level task-ready outbox. The integrated controller must use only the composite admission boundary; legacy low-level APIs must be fenced off from alternative admission.
- #72 migration 0011 and adapter contain 16 literal `dsh-headless-probe` occurrences across 14 files. Profile change must be semantic and coordinated across SQL, adapter, fixtures, tests and docs, not mass replacement.
- #72's exact-head CI evidence was not returned in the source audit; historical #67 green runs do not qualify #72 or a new integrated head.
- #67/#72 have stale ancestry and cannot be merged as-is.
- #111's lease guard may be considered as a selective migration 0012 only after reconciling trigger behavior, attempt schema and all lease/reconciliation invariants. This does not mean importing #111's separate ledger or adapter.

## 5. Executor identity vs capability profile

Owner-authored Issue #141 discussion confirms the first executor stack ID is `claude-code-1` (human-readable stack: Claude Code + ECC + FCC). This is an executor instance identity, not automatically the immutable capability-profile ID or sandbox policy. PR #146 defines the A1 capability profile separately. Do not substitute executor ID for capability profile in SQL CHECKs, task keys, registry or allowlists. The exact binding between executor instance, capability profile, sandbox and route remains a distinct contract to verify.

## 6. Current candidate decision

**Do not transplant PR #143 wholesale. Do not stack PR #114/#125 as a second admission authority.**

Retain #67/#72 as the intended proof substrate, subject to a new current-base integration design:
1. inspect and compare the pre-existing `integration/d1-ledger-clean-main` branch and its migration/object/test inventory against #67/#72 before selecting source files;
2. freeze the exact capability-profile contract and mapping from executor ID `claude-code-1` to capability profile `jarvis-code-sandbox-v1` only if the A1 contract explicitly supports that binding; otherwise keep the mapping unresolved;
3. port one schema lineage with one logical task, one authoritative task-ready outbox, immutable attempts/events, and non-authorizing reconciliation;
4. remove or render non-authorizing the legacy approval-keyed claim path;
5. add immutable approval/route/admission/task bindings and suspended/revoked qualification semantics;
6. add the lease guard only after schema and trigger compatibility tests; remove caller-boolean resumability and segregate legacy lease APIs;
7. compose #112 event predicate with a corrected #125 provenance adapter only after independently sourcing current default ref/SHA (not reusing runner `GITHUB_SHA` as two facts);
8. keep every output `dispatch:false` and `executionAuthorized:false`.

## 7. Evidence and exclusions

- Current default recursive tree: complete (`truncated=false`); no D1 package path.
- PR #143 exact-head runs: `44367978517` SUCCESS and `44367978376` SUCCESS; isolated PR head only.
- PR #143 vs current default: 55 ahead / 1 behind; merge base `68183828...`.
- PR #112 is read-only event predicate; PR #114 is separate admission schema; PR #125 stacks Actions context adapter on #114.
- Issue #140 remains OPEN. Formal review/independent acceptance remains outstanding.
- No branch was created, no code or SQL changed, no tests run, no hosted D1 access/writes, no secrets/variables read, no provider calls, no dispatch, deployment or merge.

**Disposition:** clean-base implementation preparation VERIFIED; schema integration NOT RUN; Contour A NOT ACCEPTED; Contour B DEFERRED.

## Next
Audit `integration/d1-ledger-clean-main-2026-11-15` at immutable head and compare every migration, table, index, trigger, adapter, fixture and test against #67/#72 and the current A1 profile contract. Then freeze the exact schema source manifest before creating a new current-base implementation branch.
