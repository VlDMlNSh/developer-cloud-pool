# Pass 15 — D1 migration and object ownership audit

Date: 2026-11-19
Status: **VERIFIED — source-level ownership matrix completed for inspected migration and adapter surfaces; canonical source manifest NOT FROZEN; implementation NOT RUN.**
Contour: A only.

## 1. Immutable baseline and governance

- Default `Основной`: `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`; tree `c8c78a26a6359ec868922e4040c2870eec873b66`; signed commit verification valid.
- Implementation target `integration/d1-current-base-2026-11-19`: same HEAD and tree; no implementation commits.
- Documentation branch before this pass: `9e1500e589ed632d43a23fd898c460c7d722f8dd`.
- Issue #140 remains OPEN. Owner authorization comment #7014947185 permits bounded non-production qualification with synthetic data and free-tier resources, but dispatch/execution authorization remain closed.
- Active ruleset #26550182 applies to `refs/heads/Основной`: PR required, thread resolution required, zero required approvals, no bypass actors, deletion/non-fast-forward prohibited.
- PR #145 OPEN/DRAFT/UNMERGED; head `9e1500e589ed632d43a23fd898c460c7d722f8dd`, base current default.
- PR #146 OPEN/DRAFT/UNMERGED; head `9d32c4943ae87f5855ab05d42a4ba12d1c205211`, base current default.
- PR #147 OPEN/DRAFT/UNMERGED; head `0ea6dcd589b914399a66e289190e00addbf6d9a1`, base #146 head.
- PR #146 exact-head runs: Pool Contract Validation `44522152749` SUCCESS; Isolated D1 Ledger Proof `44522152799` SUCCESS. These are candidate-only results, not integrated target CI or executor qualification.

## 2. Migration ownership matrix

| Migration/source | Objects and responsibility | Conflict / disposition |
|---|---|---|
| #67 0001 | `pool_approval_ledger`, owner/repository/issue index | Profile CHECK is hardcoded to retired `dsh-headless-probe`; cannot be canonical unchanged. |
| #67 0002 | `pool_task_claims`, approval-keyed `pool_task_outbox`, pending indexes, approval-consumed trigger | Creates a claim and approval-level event path. Not the final logical-task authority. |
| #67 0003 | `pool_tasks`, `pool_task_approvals`, `pool_task_delivery_outbox`; ALTER approval ledger; replaces consumed trigger and adds task-key-aware path | Introduces second task-ready/outbox semantics alongside legacy approval-keyed queue. Requires explicit retirement/compatibility design; cannot assume both remain authoritative. |
| #67 0004 | `pool_attempts`, `pool_attempt_events`; adds current/lease attempt pointers and lifecycle/fencing triggers | Core immutable attempt/lease model; requires lease guard and executor-binding composition. |
| #67 0005 | `pool_attempt_reconciliations`, pending index, indeterminate-attempt trigger | Non-authorizing reconciliation queue; retain only if resolver cannot authorize retry or terminal state. |
| #67 0006 | `pool_attempt_projection_outbox`, projection events, finalized-attempt projection triggers | Projection delivery outbox; this is migration ordinal 0006. |
| #67 0007 | Projection retry/dead-letter columns and replacement status trigger | Depends on #67 0006; explicit DROP/CREATE trigger ordering. |
| #67 0008 | Monotonic delivery-attempt trigger | Projection outbox invariant. |
| #67 0009 | Immutable projection identity trigger | Projection outbox invariant. |
| #67 0010 | Comment-post state, comment events, at-most-once/verified ACK triggers | Depends on projection outbox; external POST ambiguity is reconciliation-only. |
| #72 0011 | `pool_route_qualifications`, `pool_admissions`, `pool_admission_commit_receipts`; alters approval and task delivery outbox | Additive to #67 0001–0010, but admission adapter requires legacy profile. Route qualification stores route/provider/model/issuer/account/credential-handle/quota/capability evidence, but does not itself cryptographically qualify issuer/provider. |
| #111 0006 | `pool_attempts_running_requires_current_lease` trigger | Same ordinal as #67 projection 0006. Semantically useful guard; must be renumbered only in a frozen composed lineage and tested against trigger order. |
| #146 0001 | `pool_approval_ledger` | Same logical table as #67 0001, but profile CHECK correctly uses `jarvis-code-sandbox-v1`. This is a competing root migration, not a safe cherry-pick without lineage selection. |
| #146 0002–0005 | Reuses #67 0002–0005 object family | Retains approval-keyed claim/outbox and task-level outbox; no projection migrations 0006–0010 and no #72 admission 0011. |
| #146 0006 | Running-attempt/current-lease guard | Same semantic role as #111 0006; same ordinal collision with #67 0006. |
| #146 0007 | Adds executor_id to approval/task/attempt; immutable binding triggers; replaces approval-consumed trigger | Valuable executor-instance binding, but does not bind capability profile/version, host, route qualification, issuer/account/quota and lease into one proven immutable tuple. Trigger replacement must be reconciled with selected admission/outbox path. |
| Pass 13 0012–0014 | Durable registry snapshot, issuer-key persistence, active-registry assertion | Audited on stale branch `8cc7b12948865bb0e13ce099386c09f3ae32b4f5`; useful research only. Exact migration object/column/trigger source blobs were not re-fetched in this pass; no direct transplant authorized. |

## 3. Adapter and identity findings

- #72 `admit-qualified-task.mjs` explicitly requires `approval.profile === "dsh-headless-probe"`; it binds route/provider/model/issuer/account/credential-handle/quota/capability/profile/registry evidence and checks persisted qualification, but is incompatible with the owner-frozen CODE profile without a semantic migration and new tests.
- #146 `claim-outbox.mjs` and `consume.mjs` allow only `jarvis-code-sandbox-v1`, validate executor instance IDs separately, and return `dispatch:false`. However, the claim adapter references both `pool_task_delivery_outbox` and the approval-keyed `pool_task_outbox`/`pool_task_claims` path. This confirms competing outbox/claim semantics remain in the candidate.
- #146 OIDC verifier returns `executionAuthorized:false` and `dispatch:false`; issuer is GitHub Actions OIDC. Registry resolver performs an independent default-branch ref lookup and obtains `trustedDefaultHeadSha` from the branch response before reading registry content at that SHA. This is materially better than reusing a workflow `GITHUB_SHA` as the trusted default-head fact.
- #146 registry adapter validates profile allowlist and executor identity, but a successful local registry lookup does not qualify host/process attestation, provider route/account/quota, or real executor runtime.
- #67 task-attempt and lease adapters expose `dispatch:false`; the inspected #146 OIDC and registry outputs expose both `dispatch:false` and `executionAuthorized:false`. Full end-to-end output contract across a composed adapter chain remains untested.
- Executor instance ID, capability profile/version, host, provider route/model, issuer, account, credential handle, quota domain, approval, task, attempt and lease/fencing generation must remain distinct, then be bound immutably at the appropriate lifecycle boundaries.

## 4. Canonical ownership decision

No complete ordered migration manifest is approved. The following ownership direction is the only safe candidate, not yet frozen:

1. One approval/admission ledger with profile contract fixed to `jarvis-code-sandbox-v1`; do not import #67's legacy profile root.
2. One logical task authority. Approval-keyed claim rows may remain historical/compatibility evidence only if they cannot independently authorize or dispatch work.
3. Exactly one authoritative task-ready outbox. The current #67/#146 dual `pool_task_outbox` and `pool_task_delivery_outbox` design must be reconciled, not simply stacked.
4. One attempt/event model from #67 0004, with the lease-running guard from #111/#146 added as a later migration after trigger-order and state-transition tests.
5. One non-authorizing reconciliation queue from #67 0005.
6. Projection delivery outbox/events and at-most-once comment protocol from #67 0006–0010 remain a distinct external-projection concern; do not conflate it with task-ready admission outbox.
7. Atomic admission/receipt/route binding from #72 0011 must be semantically ported to the CODE profile and one selected task-ready outbox.
8. Executor-ID binding and OIDC/ref resolver from #146 are additive candidates. Bind them to the capability profile and registry contract without equating executor ID with profile ID.
9. Pass 13 registry migrations 0012–0014 remain research references until their exact source and issuer/signature semantics are revalidated against the selected schema.

This is not a final migration order. Missing proof: full composed SQL execution against a clean D1-compatible SQLite/Workers runtime; trigger-order behavior; duplicate/replay/concurrent admission; one-shot approval consumption; task-ready outbox uniqueness; lease expiry/fencing; registry revocation/snapshot integrity; and all false-authorization outputs on the exact integrated head.

## 5. Source provenance and qualification gaps

- Do not reuse `GITHUB_SHA` as both requested target SHA and independently trusted default-branch HEAD.
- #146 registry resolver demonstrates a separate branch-ref lookup, but it still needs adversarial tests for branch movement/race, stale target, forged event context, repository identity and source-comment idempotency on the integrated chain.
- CODE profile `jarvis-code-sandbox-v1` remains PROPOSED / NOT QUALIFIED / NOT ENABLED.
- No host/process attestation, real executor run, provider route/account/quota qualification or persisted hosted D1 proof has been established.

## 6. Tests and actions

- Read-only source audit only; no SQL/source/workflow edits on implementation branch.
- No local test suite was executed in this pass. The two PR #146 CI runs listed above are successful only on its exact candidate head.
- No hosted D1 provisioning/writes, no secrets/variable values inspected, no provider calls, no agent dispatch, no deployment, merge or governance change.
- Gemini NOT RUN. Claude Code host/process qualification NOT RUN.
- `dispatch:false`, `executionAuthorized:false`, `dispatchAuthorized:false` remain mandatory.

## 7. Next step

Before any schema edit, freeze a migration-by-migration source manifest with exact blob SHA for every selected migration and adapter, explicitly choose the single task-ready outbox authority, port #72 admission to the CODE profile, reconcile #146 executor binding and independent ref provenance, and specify exact negative-first Workers-runtime tests. Then implement only on `integration/d1-current-base-2026-11-19` from immutable base `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.

Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

Canonical MediaHub OS map (reference only; Contour B deferred):
https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
