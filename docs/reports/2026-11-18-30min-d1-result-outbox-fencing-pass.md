# Follow-up implementation overlay — 2026-11-18, PR #132

The earlier report below is historical and remains unchanged. This follow-up supersedes its proposed next-step state.

- Default branch `Основной`: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Clean proof branch: `proof/d1-result-outbox-clean-2026-11-18`; PR [#132](https://github.com/VlDMlNSh/developer-cloud-pool/pull/132), OPEN/DRAFT/UNMERGED, current head `4b3cd7e3d7a1ac6fd47775ab50f54b78e3a02f6f`; 24 commits ahead, 0 behind, 17 files changed.
- Adapter now uses Worker `Date.now()` rather than caller `input.now`, and verifies the joined result/task/outbox write set. It no longer uses `meta.changes === 1`.
- Lease acquisition now uses Worker `Date.now()`; caller cannot backdate/extend a lease.
- Idempotent result retry is now bound to original worker ID, lease generation, attempt UUID, digest and result reference.
- Workers-runtime tests cover stale lease attempt after same-worker reclaim, exact retry, identity substitution, result substitution, SQL trigger rollback, and exact expiry equality.
- Exact-head D1 Workers CI [run 44316452561](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44316452561) COMPLETED/SUCCESS on `4b3cd7e3d7a1ac6fd47775ab50f54b78e3a02f6f`; all job steps passed, including Workers-runtime D1 tests.
- Current-head Pool Contract Validation [run 44316452049](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44316452049) COMPLETED/SUCCESS on the same exact head; dispatch-disabled, YAML and security-contract checks passed.
- PR #132 remains draft, unmerged, and mergeable at last metadata read. Formal reviews 0 and inline threads 0; independent acceptance NOT VERIFIED.
- Remaining: independent review, governance/provenance qualification, database-authoritative clock/skew decision, trusted artifact-byte digest verification at ingest. Production dispatch remains false; no hosted D1, secrets, provider calls, deployment, merge or Contour B work.
- Status: source change SUCCEEDED; exact-head D1 Workers CI and Contract Validation VERIFIED/SUCCESS; independent review and final qualification remain NOT VERIFIED; Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md

---

# 30-minute engineering pass — D1 result/outbox fencing
Date: 2026-11-18

## Scope and timebox
One bounded pass to restore refs, inspect the exact proof and prerequisite schema, check PR #131's exact-head evidence, assess the SQLite trigger semantics, and record the next safe implementation boundary. No production dispatch, secrets, hosted D1, provider calls, deployment, merge, or Contour B work.

## Confirmed GitHub state
- Repository default branch: `Основной` (repository metadata).
- Default HEAD: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845` (latest commit search; created 2026-11-16T12:48:53Z).
- Documentation continuation: `docs/next-2026-11-18-worker-sandbox-fit`; PR #127 head `f2cb579092ab4b6bd6cd25688dc3dc455e176d46`, OPEN/DRAFT/UNMERGED.
- Result/outbox proof: `proof/d1-result-outbox-fencing-2026-11-18` at previously observed `ce2cfbab661ec489e7f1c21ffb3f99413df5fd6b`; its migration 0005, adapter and tests were read back with blob IDs below. Branch head itself was not independently refreshed by a branch-ref endpoint in this pass.
- PR #131 is OPEN/DRAFT/UNMERGED, head `2cefe8d62b99012ff23d45f33e3251996747fb7b`, base `proof/task-identity-fencing-design-2026-11-08` @ `2b7e30aeb8c404d84b2fe8bc36320aaa783520fb`; reviews 0, inline threads 0.
- PR #131 exact-head workflow runs: none returned. Combined status contexts: none. Therefore CI is NOT VERIFIED, not passed.

## Source readback
Result/outbox branch blobs:
- `task-result.mjs`: `b0d50ae23b73d9b3286d9d784122cd0d8c6ec15a`.
- `0005_create_fenced_task_result_outbox.sql`: `b2be7384f1b427c545eb860a2168b235e6316cda`.
- `task-result.test.ts`: `7fc3cd14400a488b51096ac4f7642ed193d65287`.
- `d1-ledger-proof-validation.yml`: `48ca9468a0fb169394a445a340e01e78c121fa41`.

PR #131 head contains prerequisite migrations 0001–0004 and `task-lease.mjs`, but these files are absent at the current default HEAD under the queried `proofs/d1-ledger/` paths (all returned 404). The result/outbox proof is therefore not a self-contained patch that can safely be transplanted as only migration 0005 + adapter + tests onto `Основной`. The prerequisite history/schema and the default-branch architecture must be reconciled first. No clean implementation branch was created because the necessary schema base is not present at the target path.

## Technical findings
1. Adapter F1 remains a real candidate defect: it interprets D1 `meta.changes === 1` as the successful result INSERT. The INSERT trigger also updates `pool_tasks` and inserts an outbox row; D1's total-change accounting can include trigger side effects. The exact Workers-runtime behavior for this package/version has not been executed in this pass. Replace the assumption with a transactional/readback contract and prove it on Workers Vitest.
2. Migration 0005's in-trigger `changes()` check is materially different from the adapter's `meta.changes`: it occurs immediately after the trigger's task UPDATE. SQLite documents that within a trigger each DML statement sets the changes() value for the next statement, while trigger-subprogram values are restored on exit. This supports the intended one-row guard, subject to D1 runtime proof. Source: https://www.sqlite.org/draft/capi3ref.html
3. Caller-supplied `input.now` remains an unresolved trust-boundary issue in result and lease functions. A timestamp's integer validity is not proof of trusted clock provenance. Do not qualify production fencing until a server-owned clock boundary and equality/expiry tests exist.
4. The digest is format-validated but this adapter does not verify that referenced artifact bytes hash to the supplied digest. That check must live at a trusted artifact-ingest boundary or be explicitly outside this adapter's guarantee.
5. Existing tests cover reclaim by same worker ID, stale result rejection, idempotent retry/conflict and outbox rollback, but no exact Workers Vitest run was found for PR #131; result/outbox branch CI also remains unverified.

## Upstream fit
- `provos/tasklease` is a useful architectural reference: Cloudflare Workers + Durable Objects, task ID rotation as fencing, atomic consume/handoff, and explicit statement that external effects still need idempotency. It requires R2 credentials and its documentation describes paid Workers plan scale assumptions; it is not adopted as a drop-in or treated as free-tier compatible. Source: https://github.com/provos/tasklease
- No PostgreSQL, Redis, Temporal, or external dispatcher is introduced.

## Work completed / not completed
- Completed: repository/default branch and default HEAD restored; documentation branch and PR #127 head read; PR #131 metadata/reviews/threads/status/workflow evidence checked; result proof adapter/migration/tests/workflow re-read; prerequisite migration chain 0001–0004 read from PR #131 head; upstream tasklease and SQLite trigger semantics reviewed.
- Not completed: no source code modified; no clean proof branch created; no npm install, syntax check, Workers Vitest, D1 migration execution, or exact-head CI; no independent acceptance.

## Next bounded implementation sequence
1. Reconcile the PR #131 schema lineage with the actual default-branch proof layout. Establish a new immutable base and explicit migration chain before porting code.
2. Port the minimal compatible 0001–0005 schema and adapter into a clean proof branch, preserving only required provenance and tests; do not copy stale branch ancestry wholesale.
3. Replace the `meta.changes === 1` classification with verified result/task/outbox readback, ensuring a failed or ambiguous read cannot report success.
4. Define trusted time at the server-side boundary; test lease expiry equality, reclaim, same worker ID with a new attempt token, stale writer, retry/conflict and rollback.
5. Run `npm ci --ignore-scripts --no-audit --no-fund`, `npm run check`, and `npm test` in the pinned Workers Vitest runtime; obtain exact-head CI and independent review.

## Status
Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED. Production dispatch remains disabled/not enabled. Gemini controller: NOT RUN. Browser agent: NOT TESTED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
