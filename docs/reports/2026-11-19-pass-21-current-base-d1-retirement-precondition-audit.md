# 2026-11-19 — Pass 21 current-base D1 retirement precondition audit

**Status:** VERIFIED — implementation preconditions audited; code change BLOCKED pending canonical migration-lineage selection.  
**Contour:** A only. Contour A remains BLOCKED / NOT ACCEPTED; Contour B DEFERRED.  
**Immutable default target:** `refs/heads/Основной` @ `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.  
**Documentation branch:** `docs/next-2026-11-19-integrated-contour-pass` (PR #145, OPEN / DRAFT / UNMERGED).  
**Controlling issue:** [#140](https://github.com/VlDMlNSh/developer-cloud-pool/issues/140), OPEN.

## 1. Live GitHub read-back

- Repository: `VlDMlNSh/developer-cloud-pool`; default branch: `Основной`; current default HEAD search result: `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- Current default combined-status endpoint returned zero contexts; default CI is NOT VERIFIED by that endpoint.
- Workflow-run lookup for default HEAD returned no PR-triggered runs; this is not evidence of passing CI.
- PR #145: OPEN / DRAFT / UNMERGED; base `Основной@b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`; head `5368314df91d078f9f8e9c4f799226177e5d7064`. Exact-head workflow-run lookup returned no runs; CI NOT VERIFIED.
- PR #146: OPEN / DRAFT / UNMERGED; base default at the same immutable SHA; head `4aeb9bddecd747ca533ba5619be83fc4809e2a95`.
- PR #146 workflow runs read against its current head: Isolated D1 Ledger Proof `44582839780` SUCCESS (job `135767804070` SUCCESS); Pool Contract Validation `44582839702` SUCCESS (job `135767804751` SUCCESS). These validate the PR #146 isolated proof only, not a Pass 21 retirement change or canonical integrated schema.
- PR #147 remains OPEN / DRAFT / UNMERGED, stacked on PR #146.
- PR #67, #72 and #111 remain OPEN / DRAFT / UNMERGED; their source heads and migration ownership are recorded in Pass 20.
- Branch inventory exposes candidate names including `integration/d1-current-base-2026-11-18` and `integration/d1-current-base-2026-11-19`, but the branch-search action returned names without commit SHAs. Those branch heads/divergences are therefore NOT VERIFIED in this pass.
- Current ruleset details could not be re-read with the available GitHub actions. Prior documentation records ruleset `26550182`; current detailed enforcement is NOT VERIFIED here. No governance settings were changed.

## 2. Critical clean-base precondition

Direct reads of `Основной` at the immutable target returned HTTP 404 for both:
- `proofs/d1-ledger/README.md`
- `proofs/d1-ledger/migrations/0003_create_logical_task_identity.sql`

Therefore the D1 ledger subsystem is not present on the current default branch. The Pass 21 migration cannot be applied to the default tree as a standalone additive migration: its referenced tables, triggers, adapters, and Workers-runtime harness are not there.

PR #146 is current-base in ancestry but is still an unmerged proposal. It introduces the D1 proof package; it does not make that package part of default. Building a new branch on PR #146 would be a stacked implementation, contrary to the requested clean-base target unless the entire source lineage is first reconciled and explicitly selected.

## 3. Verified source-level D1 facts

Exact source blobs read from PR #146:
- Migration 0002 blob `44b8f7e0658296d287269770c5e91b1c3e25973c`: creates `pool_task_claims`, `pool_task_outbox`, and `pool_approval_consumed_creates_claim_outbox`.
- Migration 0003 blob `49b0798871429d7961e81eb1d86ad892dba0b9b9`: creates `pool_tasks`, `pool_task_approvals`, `pool_task_delivery_outbox`, task-keyed trigger, and a second legacy trigger `pool_approval_consumed_legacy_claim_outbox`.
- Migration 0007 blob `47c2f0f7db6379e6760317fe3903214f6f31ffee`: binds executor identity and replaces the task-keyed trigger, but does not drop `pool_approval_consumed_legacy_claim_outbox`.
- Adapter blob `08c186dc0b709db985beba9c7cd9e73167c9e657`: exports both `claimLogicalTask()` and positive legacy `claimAndEnqueue()`.
- Test blob `5f5f613d60b6ecb570b785ffd9a29d41dbc25fdd`: includes positive tests for both task-keyed and approval-keyed paths.

Pass 20 source audit also establishes a separate migration collision:
- PR #67 migration 0006 creates `pool_attempt_projection_outbox`.
- PR #111/#146 migration 0006 is the running-attempt lease guard.
- These are different migrations with the same ordinal and cannot both be installed as-is.
- PR #146's current D1 variant does not contain the PR #67 projection-outbox migration sequence. The independent projection queue cannot be claimed preserved by transplanting PR #146 alone.

## 4. Pass 21 implementation decision

**Do not create migration 0008 on the default branch in isolation.** That would reference absent tables and produce a non-runnable migration history.

**Do not silently stack the change on PR #146.** That would violate the clean-base instruction and would still omit the projection-outbox lineage.

Required sequence before code mutation:
1. Freeze exact source commit SHAs for #67, #72, #111 and #146, plus the current default SHA.
2. Select a single clean-base migration manifest that preserves #67's projection outbox, reconciles #111's lease guard at a non-conflicting ordinal, and ports only compatible CODE profile / executor identity components from #146.
3. Verify that the selected migration sequence upgrades a fresh D1 database without rewriting historical migrations.
4. Then add a forward-only retirement migration that drops the legacy trigger, rejects writes to retired legacy tables, and leaves `pool_task_delivery_outbox` and `pool_attempt_projection_outbox` independent.
5. Remove/deprecate `claimAndEnqueue()`; replace positive legacy tests with negative tests; run the complete Workers-runtime suite and exact-head CI.

No schema or adapter change was made in this pass because the clean-base migration manifest is not approved and the current default has no D1 substrate to extend.

## 5. Scope, security and executor disposition

- No secrets, tokens, credentials or Actions variable values were read.
- No hosted D1 was provisioned or written; no provider/model calls, dispatch, deployment, merge or production action occurred.
- Gemini: NOT RUN; no controller invocation or bypass.
- Claude Code / external host execution: NOT RUN; no host identity or capability qualification was attempted.
- All source code reviewed retains the proof-only boundary; no new execution authority was introduced.
- Issue #140's current scope is local, synthetic, no-secret qualification only.

## 6. Result and next step

**Pass 21 result:** VERIFIED current-base and source-lineage audit. **Implementation BLOCKED** on canonical migration-manifest selection. Pass 21 did not add runtime code, run local tests, or create a new implementation PR.

Effort accounting: no implementation-hour credit is claimed. Prior planning estimate remains 24.5–29.5 engineering-equivalent hours remaining; actual active time remains NOT MEASURED.

Next single engineering task: produce the clean-base migration manifest and exact source-blob transplant map for #67/#72/#111/#146, resolving migration ordinal 0006 and preserving both task-ready and projection queue boundaries before implementing the retirement migration.

Evidence:
- [Pass 20 source audit](https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/next-2026-11-19-integrated-contour-pass/docs/reports/2026-11-19-pass-20-d1-lineage-outbox-authority-audit.md)
- [Pass 20 checkpoint](https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/next-2026-11-19-integrated-contour-pass/docs/checkpoints/2026-11-19-pass-20-d1-lineage-outbox-authority-audit.md)
- [Issue #140](https://github.com/VlDMlNSh/developer-cloud-pool/issues/140)
- [PR #145 — documentation continuation, unmerged](https://github.com/VlDMlNSh/developer-cloud-pool/pull/145)
- [PR #146 — D1/CODE candidate, unmerged](https://github.com/VlDMlNSh/developer-cloud-pool/pull/146)
- [Canonical Context Window](https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/next-2026-11-19-integrated-contour-pass/docs/context/GITHUB-CONTEXT-WINDOW.md)
