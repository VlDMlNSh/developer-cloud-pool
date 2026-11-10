# Finalization proof reuse audit — 2026-11-10

## Scope and immutable references

Repository: https://github.com/VlDMlNSh/developer-cloud-pool

- PR #56 actual head: `0769b6b5d5eda9c7821804b93db21ded6e0985ef`, exact D1 run `42825872826` / job `129862892371` SUCCESS. PR remains OPEN/DRAFT/UNMERGED, reviews=0, threads=0.
- Candidate finalization branch: `fix/attempt-finalization-idempotency-2026-11-08`.
- Candidate branch file read-back:
  - `proofs/d1-ledger/src/task-attempts.mjs` blob `cfbce80efbf8e19fd667770ec3a8f86cd17dc865`.
  - `proofs/d1-ledger/test/claim-outbox.test.ts` blob `e259ce028eff89448ebd40881f15c7c410877686`.
  - `proofs/d1-ledger/package.json` blob `b16fce67dd3c9ddd50bc440ddd1f2ca86b56e5ea`.
  - `.github/workflows/d1-ledger-proof-validation.yml` blob `8891e212f3779e5f36222e0066ed21ba2eea5e49`.
- Candidate branch comparison against PR #51 current head `32c88e50e173e6b19bc6c61723ab6474a3c08145`: 1 ahead / 8 behind.
- Candidate branch comparison against PR #54 base SHA `b9067dc7d06245893cd4e208f6215438efe5ca64`: diverged, 4 ahead / 1 behind. The connector did not expose the candidate branch's immutable head SHA, so exact-head CI cannot be attributed to it from this pass.

## Reuse-positive findings

The candidate `finalizeTaskAttempt` implementation has a useful local conditional transition:
- Accepts only `succeeded`, `failed`, or `abandoned`.
- Requires task key, attempt ID, worker ID, generation, result/provenance digests, terminal reason and timestamp.
- Updates only an attempt currently `running` at the supplied generation, while requiring the task's current attempt, lease attempt, `leased` state, matching owner/generation and unexpired lease.
- On a zero-row/ambiguous update, reads back the attempt and deterministic terminal event ID `attempt-finalized:<attemptId>`; exact matching result is treated as idempotent replay, conflicting/stale result is denied.
- Tests exercise successful finalization, task lease clearing, one terminal event, actor/generation attribution, exact replay and conflicting replay denial.

This is a useful local proof primitive for fenced worker finalization. It is not a trusted reconciliation resolver.

## Integration gaps and blockers

1. **Stale lineage:** candidate branch is 8 commits behind PR #51 current head and does not contain the PR #51 reconciliation-queue migrations `0005_create_attempt_reconciliation_queue.sql` / `0006_create_attempt_projection_outbox.sql` (read-back by exact path returned 404 on candidate branch). Do not merge/stack it as-is or assume its migrations are compatible.
2. **Identity binding incomplete:** `finalizeTaskAttempt` binds taskKey/attemptId/workerId/generation and digests, but not immutable approval/envelope digest, issuer, claim ID, GitHub repository/workflow/path/ref/SHA, Actions run_id and exact run_attempt, or resolver capability. It cannot independently establish which authorized execution is being finalized.
3. **Not a resolver:** it requires an active unexpired lease and a `running` attempt. It does not authorize resolution of `indeterminate` attempts based on authenticated terminal executor evidence or external side-effect reconciliation receipts.
4. **No exact CI evidence for this candidate branch:** run `42537241204` belongs PR #54 head `ec3f3266ca28c4fb5633a9475cc6f396a4677974`, whose actual scope is 50-approval logical-task contention. It is not evidence for `fix/attempt-finalization-idempotency-2026-11-08`. PR #54 has one COMMENTED review from the repository owner identifying an audit-actor provenance gap in projection-outbox transitions; it is not an independent approval of this candidate finalizer.
5. **Production integration absent:** no Supervisor/Worker wiring, hosted D1, real executor, resolver capability, external effect receipts or remote resource was tested.

## Decision

- Reuse the candidate's conditional finalization semantics as a design reference: **YES, bounded local proof only**.
- Reuse the candidate branch as a merge/stack target without rebasing and revalidating: **NO**.
- Treat it as proof of terminal reconciliation or exactly-once side effects: **NO**.
- PR #56 takeover denial on exact head `0769b6b...`: **VERIFIED** by local D1 CI.
- Candidate finalizer exact-head CI: **NOT VERIFIED**.
- Trusted resolver, envelope/run-attempt binding, atomic resolution receipt, side-effect reconciliation and production qualification: **NOT QUALIFIED**.
- Issue #38: OPEN. Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

## Next bounded step

On the current PR #51 + PR #56 tree, port only the minimal conditional finalization primitive after reconstructing the current migration/trigger graph. Extend its immutable binding to include approval/envelope digest, claim ID, generation, repository/workflow identity, run_id/run_attempt and result/provenance digests. Keep this worker finalization path separate from the resolver path for indeterminate attempts. Add tests for stale generation, wrong run attempt, changed envelope, conflicting replay, lost commit response and terminal side-effect ambiguity. Run exact-head local Workers-runtime CI before any integration. No Supervisor/Worker production changes or dispatch.

No dispatch, provider/model call, secret access, hosted D1 provisioning, deployment, merge or paid resource was performed.

Canonical MediaHub map (separate project): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
