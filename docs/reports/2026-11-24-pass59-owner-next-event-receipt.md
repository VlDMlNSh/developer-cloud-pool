# Pass 59 — owner /next event binder and durable source-comment receipt

Date: 2026-11-24  
Status: **VERIFIED — bounded source change and exact-merge CI**  
Contour A: **NOT ACCEPTED**  
Contour B: **DEFERRED**

## Frozen inputs and scope

- PR #170 pre-change head: `35a3ea7e168aaeb91f63c5616e498b4d0f21b537`
- PR #170 base/default HEAD: `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`
- Final PR #170 head: `4946f9c6656aef4d7bb75fddc552b4045f1ccd73`
- Exact synthetic merge result used by both CI workflows: `e5f648fbc9bf036e8591914353ef3a14eebe7956`
- Existing candidate remains PR #170; no parallel integration PR was created.

Scope: one event-context binder and source-comment receipt path in the existing `proofs/d1-ledger`. No controller workflow, runtime activation, provider routing or dispatch.

## Reuse First

**REUSE:** existing Cloudflare Workers Vitest integration (`@cloudflare/vitest-plugin@1.4.7`, `vitest@4.1.12`) and local Miniflare/workerd D1 harness. Existing `pool_task_delivery_outbox` and canonical `proofs/d1-ledger` retained.

**ADAPT:** PR #112's strict owner/event predicate and PR #125's runner-context binding pattern. Rejected their competing D1 ledger, old-base stack, retired `dsh-headless-probe` profile and legacy `pool_task_outbox` dependency.

**BUILD:** one binder, forward-only migration 0017 and an append-only receipt writer; no new runtime dependencies or lockfile changes.

## Changes

1. Added `src/github-next-event.mjs`.
   - Accepts only GitHub Actions context for `VlDMlNSh/developer-cloud-pool`, owner numeric ID `157891068`, repository ID `1445644538`, Issue #96, top-level `issue_comment.created`, exact `/next`, owner actor ID/login and `OWNER` association.
   - Requires `refs/heads/Основной`, valid target SHA, exact expected workflow ref, and workflow SHA equal to target SHA.
   - Requires positive comment ID, run ID and run attempt.
   - Fixes capability profile to `jarvis-code-sandbox-v1`; all results remain `dispatch:false`, `executionAuthorized:false`.
   - Derives a stable event digest from source-comment identity and immutable event/workflow inputs. Run ID/attempt are persisted and compared in the receipt but excluded from that digest so a rerun can recover an admission whose receipt was not yet written. If a receipt already exists with different run provenance, it fails closed.
2. Added migration `0017_github_next_source_comment_receipts.sql`.
   - Append-only receipt; source comment is unique; repository, owner, Issue #96, event/action, actor, exact-body digest, default ref, workflow identity/SHA and CODE profile are constrained.
   - SQL insert guard requires the matching consumed approval, task, prepared attempt, qualified route, pending canonical task-ready outbox and immutable admission commit receipt.
   - UPDATE and DELETE are denied. No use of retired `pool_task_outbox`.
3. Added `admitGitHubNextEvent` composition.
   - Binds event, requires approval envelope digest match, invokes existing non-authorizing admission, then writes the source-comment receipt.
   - Before and after receipt write, verifies the full admission/approval/task/attempt/route/outbox/commit-receipt tuple using primary-first reads.
   - Ambiguous receipt write is reconciled by primary-first readback. Mismatch or unavailable readback returns DENY/UNCONFIRMED.
   - Receipt is a second phase after the canonical admission transaction, not a single atomic D1 batch. No success is returned until receipt readback matches. A crash between phases leaves a non-authorizing admission; retry with the same source-comment identity can reconcile it.
4. Added negative-first tests for exact body, LF/CRLF/whitespace, owner/repository/issue/event/ref/workflow/SHA mismatches, invalid identifiers, CODE profile and retry-stable event digest; asserted migration table and immutable trigger presence.
5. Updated the D1 proof README.

## Validation evidence

Both workflows ran on the same exact synthetic merge SHA `e5f648fbc9bf036e8591914353ef3a14eebe7956`.

- D1 Ledger Proof run [45270189346](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45270189346): **SUCCESS**, 7 test files, 100/100 tests, `npm ci`, `npm run check` and local fresh/staged D1 migration suite passed.
- Pool Contract run [45270189385](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45270189385): **SUCCESS**, workflow syntax/security contracts passed, `POOL_CONTRACT_VALIDATION=PASS`.
- Both logs explicitly checked out `e5f648fbc9bf036e8591914353ef3a14eebe7956`.
- No new dependency or package-lock modification.
- Diff added 3 files and modified README: 4 paths, +324 lines relative to Pass 58 candidate head.
- PR #170 remains OPEN / DRAFT / UNMERGED; formal reviews 0, review threads 0.

## Residual risks / NOT VERIFIED

- No live `issue_comment` controller exists on default branch. The expected workflow ref is a frozen future identity, not proof that the workflow is present or trusted.
- No cryptographic GitHub webhook signature validation or independent GitHub API read of the default ref is performed. Runner context binding alone does not prove event authenticity.
- The receipt writer's actual D1 insert/replay/ambiguous-write path does not yet have dedicated end-to-end synthetic tests. Current 100 tests cover binder predicates and migration/schema presence, not every receipt failure mode. This is the next bounded test task.
- No hosted D1, production permissions, trusted runtime clock, executor authenticator/verifier, worker runtime, UI, live routing, quota enforcement or provider execution qualification.
- PR #170 has no formal independent review. Exact-head CI is not merge authorization or acceptance.
- Existing non-blocking Node.js 20 deprecation warnings remain for pinned checkout/setup-node action revisions while the runner executes Node 24.

## Governance and safety

No secrets or variable values read. No Gemini controller dispatch, Claude/server dispatch, provider calls, hosted D1, production mutation, deployment or merge. No change to workflow permissions or repository rulesets. Dispatch remains disabled.

## Metrics

- Source paths changed: 4 (3 added, 1 modified).
- Added lines relative to Pass 58 candidate: 316.
- CI: 2/2 SUCCESS on one exact synthetic merge SHA.
- D1 tests: 100/100.
- New external dependencies: 0.
- Dispatches/provider calls/hosted D1 writes/deployments/merges: 0.
- Active engineering time: **NOT MEASURED**; no timer/telemetry was available. Do not infer hours from GitHub timestamps.
- Defects found during this pass: 1 design correction before final CI — event digest initially included run-attempt metadata, which would have prevented same-comment recovery on rerun. Digest now keys immutable source-comment identity; run provenance remains stored and compared in the receipt.

## Next

Pass 60: add direct synthetic D1 integration tests for `admitGitHubNextEvent` and receipt persistence: exact success, same-comment replay, run rerun with existing receipt, ambiguous write after commit, write-before-commit failure, missing/partial receipt, conflicting source-comment ID, full tuple mutation and primary-readback unavailable. Keep dispatch disabled and do not create the live workflow until the controller contract and governance gates are separately reviewed.

Links:
- [PR #170](https://github.com/VlDMlNSh/developer-cloud-pool/pull/170)
- [Issue #140](https://github.com/VlDMlNSh/developer-cloud-pool/issues/140)
- [Issue #96](https://github.com/VlDMlNSh/developer-cloud-pool/issues/96)
- [Context Window](../context/GITHUB-CONTEXT-WINDOW.md)
