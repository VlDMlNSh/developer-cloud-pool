# 2026-11-18 — PR #130 integration audit and durable-claim reuse assessment

## Scope and immutable target

- Audited PR #130 head `6175eed8812fe52aad929523caab6b942cd01dd7`, based on PR #129 head `70265bbb21a8419312bc0cfe684d32184cffc497`.
- PR #130 remains OPEN / DRAFT / UNMERGED.
- Default branch is reported by the current Context Window as `Основной@35208f0ef28f0ac031a7acdf35fc90ccc9b16845`; a fresh branch-head SHA was not exposed by the available repository metadata call in this pass. No default-branch write or merge was performed.

## Current-state reconciliation

- Repository default branch: `Основной`.
- PR #130 exact-head merge-context workflow run [44299536170](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44299536170), job `134785358773`: COMPLETED / SUCCESS.
- Job log explicitly checked out `refs/remotes/pull/130/merge`; merge commit `3272389` combines PR #130 head `6175eed8812fe52aad929523caab6b942cd01dd7` with PR #129 base `70265bbb21a8419312bc0cfe684d32184cffc497`.
- `npm run check`: PASS; Workers Runtime suite: 11/11 files, 120/120 tests PASS; second D1 binding smoke: 1/1 PASS; frozen schema-0010 fixture: 2/2 PASS.
- Artifact ID `14424184685`, 18,253 bytes; uploaded ZIP SHA-256 `ce05f89261c7120a95761c5a7068966a752d9d4ac60876d362886cd85d66819f`.
- Combined status API returned no status contexts; do not interpret the empty list as required checks passing. Workflow run evidence above is the available positive CI evidence.
- PR #130 formal reviews: 0; inline review threads: 0.
- Open issue scan includes #38 (durable single-use task claims), #118 (persistent engineering workspace/Zero Trust), #22 (remote web console), #26 (account-isolated routing/quota ledger), #70 (free-quota fail-closed), #115 (CODE runner qualification), #94 (Gemini dispatch), and #1 (governance). Issue #21 is Contour B and remains out of scope.

## PR #130 bounded source review

Changed files:
- `.github/workflows/d1-ledger-proof-validation.yml`
- `proofs/d1-ledger/migrations/0012_durable_route_registry_snapshots.sql`
- `proofs/d1-ledger/test/durable-route-registry-ledger.test.ts`

Findings:
1. The migration now rejects initial singleton state unless its epoch equals `MAX(registry_epoch)` already persisted.
2. Every singleton watermark UPDATE must advance directly to the current maximum persisted epoch. This blocks an intermediate watermark when a newer snapshot already exists.
3. The adversarial test covers stale bootstrap (1001 while 1003 exists), stale intermediate advance (1004 while 1005 exists), accepted latest state, append-only snapshot constraints and state non-reset.
4. The D1 workflow adds the exact PR #130 branch to push filters and PR #129 as a target base. The successful CI merge ref confirms the intended stacked execution context.
5. No defect was established in this bounded file-level review. This is not an independent review submission and does not replace required formal review.
6. PR #86 previously had a documented stale-watermark finding; PR #129 added the missing MAX-persisted-epoch predicate to the admission assertion trigger and exact-replay trust query, and PR #130 now adds the corresponding ledger bootstrap/update guard. This closes the identified design gap across the current stack at the tested source level, subject to full ancestry and formal review.

## Mature upstream component assessment — durable queue / lease / fencing

Repositories searched:
- [timgit/pg-boss](https://github.com/timgit/pg-boss): mature PostgreSQL-backed job queue; depends on PostgreSQL semantics and is not a drop-in for the current Cloudflare Workers + D1 deployment.
- [graphile/worker](https://github.com/graphile/worker): PostgreSQL job runner with durable jobs/retries; same database/runtime mismatch.
- [temporalio/temporal](https://github.com/temporalio/temporal): durable execution platform, but introduces a separately operated service/control plane and is not compatible with the current free GitHub-hosted-only constraint without a new hosting and operations qualification.
- [taskforcesh/bullmq](https://github.com/taskforcesh/bullmq): Redis-backed queue; Redis infrastructure and its persistence/availability contract are not currently qualified.
- Cloudflare Workers/Queues examples were also searched; no repository was found that could be adopted as a proven durable single-use D1 claim implementation without substantial adaptation.

Decision: reuse their protocol patterns (atomic claim, visibility/lease timeout, attempt counter, idempotency key, fencing token, recovery and dead-letter semantics), not their runtime dependency. Do not import a queue framework before proving its backend and operational cost/availability fit. Keep dispatch disabled until a real one-winner concurrency test is run against the selected backend.

## Security / governance boundaries

- No secrets read or exposed.
- No hosted D1 writes, provider calls, Gemini dispatch, production dispatch, worker execution or deployment.
- The approved Gemini controller workflow path remains NOT FOUND (404) on default branch; Gemini is NOT RUN.
- PR #130 remains draft/unmerged and has no formal review. No merge.
- Ruleset details were not re-fetched in this pass; governance state beyond the previously recorded ruleset 26550182 is NOT VERIFIED in this pass.
- No production executor, remote web UI, provider routing/quota, persistent workspace/restore or independent acceptance was demonstrated.

## Next bounded step

Proceed to Issue #38: produce a decision record and executable D1 contention proof for single-use task claims. First inspect existing task/attempt/outbox schema and prior claim/fencing design branches; compare a D1 transactional conditional-claim protocol against a dedicated state-repository ref reservation. Define task identity, claim owner, lease expiry, monotonic fencing token, idempotency, crash recovery, retry and audit provenance. Use a real concurrent test with exactly one winner. Do not enable dispatch or grant broad GitHub Contents write as a shortcut.

## Status

- PR #130 exact-head CI: VERIFIED in PR merge context.
- PR #130 formal independent review: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
