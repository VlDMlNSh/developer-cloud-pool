# Pass 58 — owner `/next` event-envelope and D1 composition reconciliation audit

Date: 2026-11-24
Status: **VERIFIED — source/governance audit complete; no code integrated; controller remains absent from default**

## 1. Frozen scope and refs
- Repository: `VlDMlNSh/developer-cloud-pool`; default branch `Основной`.
- Observed default HEAD: `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`.
- Canonical D1 candidate PR #170 head: `35a3ea7e168aaeb91f63c5616e498b4d0f21b537`, base `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`, synthetic merge `0e06e8179ca0fbdef53d3b7c9c7dc9bbe2720c50`.
- Historical PR #112 head `c9a4c0ab2001f01a09632795283071c521e1c99d`, base `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Historical PR #125 head `69398d497c8e9be3e9fe7241e4dc6d3bc2e4c973`, stacked base `ab9461eb84b14fe230918391d5212f19ca25592c` (PR #114 head).
- Scope: inspect exact source, schema, workflows, tests, historical CI, and compare with Issues #96/#140 and current D1 PR #170.
- Non-goals: no code change to runtime, no dispatch, no secrets/variables inspection, no provider calls, no hosted D1, no deployment, no merge.

## 2. Current default and canonical integration state
- Default tree is complete (not truncated). It does not contain PR #112's `next-event-controller-readonly.yml` or `scripts/next-event-controller.mjs`.
- Default tree does not contain PR #125's `proofs/d1-admission` package or `github-actions-adapter.mjs`.
- Default tree also does not contain PR #170's `proofs/d1-ledger` package; PR #170 remains the current-base integration candidate, not merged code.
- PR #170 remains OPEN / DRAFT / UNMERGED, mergeable true, head `35a3ea7e168aaeb91f63c5616e498b4d0f21b537`, base `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`, synthetic merge `0e06e8179ca0fbdef53d3b7c9c7dc9bbe2720c50`, 34 files, +7,074 / -0.
- PR #170 formal reviews 0; review threads 0. Active ruleset 26550182 has PR required, unresolved review-thread resolution, zero mandatory approvals, and no bypass actors. No merge performed.

## 3. PR #112 — useful event predicate, but read-only and incomplete as a controller
Source: `scripts/next-event-controller.mjs` (blob `846aa93417248b99653a4b08cae676c4cbc56f06`), workflow and 21 tests.

Positive properties:
- Exact `issue_comment` + `created` event; exact repository full name, numeric repository ID, owner login/numeric ID and default branch.
- Exact `refs/heads/Основной`, 40-character event SHA, Issue #96 URL/number/open state and non-PR issue check.
- Exact comment body `/next`, positive comment ID, owner login/numeric ID and `author_association === OWNER`.
- Deterministic digest from repository + issue + source comment ID.
- Workflow has read-only `contents: read`, pinned checkout/setup-node actions, `persist-credentials: false`, bounded timeout and no dispatch step.
- Historical exact-head runs: #43882090833 (read-only event controller) and #43882090867 (Pool Contract), both SUCCESS on PR #112 head.

Limits / defects:
- It only emits a `READ_ONLY_NO_DISPATCH` result; it has no durable receipt, approval consumption, D1 transaction, replay readback, controller run identity or workflow-code SHA binding.
- It accepts `GITHUB_SHA` after format validation but does not bind `GITHUB_WORKFLOW_SHA`, `GITHUB_RUN_ID`, `GITHUB_RUN_ATTEMPT` or exact workflow identity.
- The workflow is a historical branch proof and is not on default. Its issue_comment job runs the validator, but rejected input intentionally exits with code 0; workflow green therefore does not mean event admitted.
- The test named `body with trailing newline` sets source text `"/next\\n"` (two backslashes before `n` in JS source), which evaluates to a literal backslash+n suffix, not an actual LF character. The exact-LF negative case is not actually tested.
- Stable digest test proves deterministic derivation only; it does not prove durable replay prevention.
- No merge/review: PR #112 remains OPEN/DRAFT/UNMERGED, old base `35208f0...`, reviews 0, threads 0.

## 4. PR #125 — stronger runner-context composition, but cannot be merged as-is
Source: `proofs/d1-admission/src/github-actions-adapter.mjs` (blob `89f28778dab1ee10c7e39bebeaaf0a6270b9c750`), admission module, separate migration, README and Workers-runtime tests.

Positive properties:
- Binds event payload to runner-provided GitHub Actions context: `GITHUB_ACTIONS`, `GITHUB_SERVER_URL`, hosted runner, event name, repository/owner numeric IDs, ref, target SHA, workflow SHA, run ID, run attempt and exact workflow ref.
- Validates exact Issue #96, issue URL/state, owner comment, exact `/next`, positive comment ID, and denies PR conversation comments.
- The D1 package attempts to persist source comment ID, admission ID, actor, run ID/attempt, controller code SHA, target SHA, profile, envelope digest and task/outbox identity.
- Duplicate source comment returns the first durable admission and does not create another task; tests cover workflow rerun attempt increment.
- Historical exact-head run #44265881516 (`D1 GitHub Actions Context Admission Proof`) SUCCESS on PR #125 head.

Hard blockers against direct integration:
- PR #125 creates a second independent schema/package under `proofs/d1-admission`, with its own `pool_approval_ledger`, `pool_admission_receipts`, `pool_tasks`, `pool_task_approvals` and `pool_task_outbox`. PR #170 already owns those logical concepts under `proofs/d1-ledger`, with evolved schema, executor identity, attempts, lease/fencing, route qualification, canonical `pool_task_delivery_outbox` and reconciliation. This is a competing ledger and migration lineage.
- Critical table-name collision: PR #125's `pool_task_outbox` is its canonical task-ready outbox; PR #170 migration 0016 explicitly seals historical `pool_task_outbox` against INSERT/UPDATE/DELETE as a retired legacy table. Combining both would make the PR #125 canonical outbox unwritable. Do not combine the migration packages.
- PR #125 allowlists only `dsh-headless-probe`, while current owner direction and PR #170 freeze the CODE profile `jarvis-code-sandbox-v1` (Claude Code + ECC + FCC first executor). DSH is not a valid launch profile.
- `trustedDefaultHeadSha` is assigned from the same `GITHUB_SHA` value as `targetSha`; equality protects against caller overrides but is not an independent GitHub ref read. README correctly states that there is no API re-read or cryptographic event signature verification.
- Replay readback checks source/admission/repository/issue/actor/owner association and presence of an outbox row. It does not compare the full stored envelope fields (controller run, attempt, workflow SHA, target SHA, profile, digest, approval) or verify the complete approval/task/attempt/route/receipt tuple before returning `ADMISSION_REPLAY`. The ambiguous-write catch path is even narrower. This does not meet Issue #140's full-chain replay-readback requirement.
- The workflow is PR-path validation only; it is not an `issue_comment` controller workflow and its README says the allowlisted future controller workflow does not yet exist on default.
- PR #125 is stacked on old PR #114 head `ab9461...`, not on current default or PR #170; it remains OPEN/DRAFT/UNMERGED, reviews 0, threads 0.

## 5. Canonical composition decision
- REUSE the exact owner/repository/issue/body/event/ref checks from PR #112, with the runner-context binding pattern from PR #125 as a reference.
- DO NOT merge PR #112 or #125 directly and DO NOT copy the `proofs/d1-admission` migration/package into PR #170.
- Adapt one event-context binder into the canonical `proofs/d1-ledger` path and extend the existing canonical D1 admission/attempt chain with source-comment idempotency and immutable controller context. Prefer a single source-comment unique key in the existing admission record/receipt path, not a second ledger.
- Bind exact numeric owner/repository identity, Issue #96, new top-level `issue_comment`, exact `/next`, comment ID, owner association, default-branch ref, target SHA, workflow ref/SHA, run ID and run attempt.
- Align only with frozen CODE profile `jarvis-code-sandbox-v1`; reject `dsh-headless-probe`.
- On exact replay or ambiguous write, primary-first read back and compare the entire immutable event/admission/approval/task/attempt/route/outbox/receipt tuple. Any mismatch or missing row returns DENY/UNCONFIRMED, never a new admission or dispatch.
- Keep all outputs `dispatch:false` and `executionAuthorized:false`. Controller remains non-dispatching.

## 6. Reuse First
- Reuse internal validated source from PR #112 and PR #125; no new external OSS component is required for this bounded adapter reconciliation.
- Reuse the existing official Cloudflare Workers Vitest / local D1 harness already in PR #170. Do not add a second package lock or D1 test harness.

## 7. Historical CI and governance
- PR #112: read-only event workflow #43882090833 SUCCESS; Pool Contract #43882090867 SUCCESS.
- PR #125: D1 GitHub Actions Context Admission Proof #44265881516 SUCCESS.
- PR #114: D1 Atomic Admission Integration Proof #43935827714 SUCCESS; Pool Contract #43935827741 SUCCESS.
- PR #111: Isolated D1 Ledger Proof #43881396386 SUCCESS; Pool Contract #43881396272 SUCCESS.
- These are historical runs on old or stacked heads. They do not qualify the current PR #170 merge result or live default-branch controller.
- PRs #111/#112/#114/#125 have zero formal reviews and zero review threads at current metadata read. Their bases are historical.

## 8. Metrics, disposition and next pass
- Files inspected: 3 in PR #112, 9 in PR #125, 7 current canonical D1 files plus current workflow/tree/context/governance metadata.
- Confirmed architectural blockers: 1 duplicate ledger/migration lineage; 1 direct table-name collision with migration 0016; 1 frozen profile mismatch; 1 incomplete replay verification contract.
- Confirmed test gap: actual LF comment-body rejection not tested by PR #112 test despite test label.
- Code changes: 0. Dispatches: 0. Hosted D1 calls: 0. Provider calls: 0. Secrets/variables read: 0. Deployments/merges: 0.
- Active engineering time: NOT MEASURED; no estimate inferred from timestamps.
- PR #170 remains current canonical D1 integration candidate; event controller is still absent from default.

**Pass 58: VERIFIED — event-envelope source audit and canonical composition decision recorded. No code integrated. Contour A NOT ACCEPTED; Contour B DEFERRED.**

## 9. Next bounded task — Pass 59
On PR #170 current head `35a3ea7e168aaeb91f63c5616e498b4d0f21b537`, implement one non-dispatching canonical GitHub Actions context binder and durable source-comment receipt using the existing `proofs/d1-ledger` schema only. Add a forward-only migration (next ID after 0016) extending the canonical admission record/receipt path; do not add `proofs/d1-admission`. Use the CODE profile only. Add negative-first tests for actual LF/CRLF/whitespace, non-owner, wrong issue/repository/ref/workflow, stale/malformed SHA, duplicate comment, run-attempt rerun, ambiguous write, partial readback and complete tuple mismatch. Keep dispatch false. Re-run exact synthetic merge-result D1 and Pool Contract CI; update report/checkpoint/context. No hosted D1, secrets, provider calls, merge, deployment or dispatch.

References: [PR #170](https://github.com/VlDMlNSh/developer-cloud-pool/pull/170) · [PR #112](https://github.com/VlDMlNSh/developer-cloud-pool/pull/112) · [PR #125](https://github.com/VlDMlNSh/developer-cloud-pool/pull/125) · [Issue #96](https://github.com/VlDMlNSh/developer-cloud-pool/issues/96) · [Issue #140](https://github.com/VlDMlNSh/developer-cloud-pool/issues/140) · [MediaHub canonical map](https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md)