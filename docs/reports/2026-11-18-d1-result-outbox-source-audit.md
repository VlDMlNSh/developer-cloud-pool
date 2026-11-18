# D1 fenced result / transactional outbox — source audit

Date: 2026-11-18  
Status: SOURCE AUDIT COMPLETE / RUNTIME CI NOT VERIFIED / NOT QUALIFIED  
Immutable target: `proof/d1-result-outbox-fencing-2026-11-18` @ `ce2cfbab661ec489e7f1c21ffb3f99413df5fd6b`  
Default branch: `Основной` @ `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`

## Scope and provenance

This is an isolated source-level audit of the local-only D1 proof. No production dispatch, external side effect, hosted D1 mutation, provider call, secret access, deployment, or Contour B work occurred.

The result-outbox proof branch is divergent from the current default branch: GitHub compare reports 89 commits ahead and 141 behind, with merge base `197ba98d0dc7d8437d759dd25bee8750d02e59ae`. Do not merge or stack this branch directly onto the current default branch. Preserve it as evidence and port only reviewed changes to a clean branch based on the current default HEAD.

PR #131 is a separate lease-acquisition-attempt branch: `proof/d1-lease-attempt-fencing-2026-11-18` @ `2cefe8d62b99012ff23d45f33e3251996747fb7b`. PR #131 is OPEN; formal reviews 0; inline review threads 0. It is not the result-outbox proof branch.

## Files read and blob identities

- `proofs/d1-ledger/src/task-result.mjs` — `b0d50ae23b73d9b3286d9d784122cd0d8c6ec15a`
- `proofs/d1-ledger/migrations/0005_create_fenced_task_result_outbox.sql` — `b2be7384f1b427c545eb860a2168b235e6316cda`
- `proofs/d1-ledger/test/task-result.test.ts` — `7fc3cd14400a488b51096ac4f7642ed193d65287`
- `proofs/d1-ledger/src/task-lease.mjs` — `93340eb5df5f3dcbc4a91f7158efa9a79157728d`
- `proofs/d1-ledger/migrations/0001_create_pool_approval_ledger.sql` — `a80524ed839b63dd6483978118619495fa550877`
- `proofs/d1-ledger/migrations/0002_create_task_claim_outbox.sql` — `44b8f7e0658296d287269770c5e91b1c3e25973c`
- `proofs/d1-ledger/migrations/0003_create_logical_task_identity.sql` — `49b0798871429d7961e81eb1d86ad892dba0b9b9`
- `proofs/d1-ledger/migrations/0004_add_lease_attempt_identity.sql` — `00cd69e7999f5cbea7b9112da9725baad348447c`
- `proofs/d1-ledger/package.json` — `d24cbb76b34bd245b797b7c11f5883fc3fbfaf59`
- `proofs/d1-ledger/package-lock.json` — `876c5d3de53bb12efaecdec939cbe8710cbd9e3c`
- `.github/workflows/d1-ledger-proof-validation.yml` — `48ca9468a0fb169394a445a340e01e78c121fa41`
- `proofs/d1-ledger/vitest.config.ts` — `39bcf53a51180e7e5f309978e307e9964a2cc22e`
- `proofs/d1-ledger/test/apply-migrations.ts` — `e1307208cc520a3399e66a937c3e0b05b71ac0f6`
- `proofs/d1-ledger/wrangler.jsonc` — `eb683b6bb838cb7a48741f900de6c17be7fdc0fe`

The actual migration names are 0001_create_pool_approval_ledger, 0002_create_task_claim_outbox, 0003_create_logical_task_identity, 0004_add_lease_attempt_identity, and 0005_create_fenced_task_result_outbox. Earlier abbreviated path guesses were wrong; these exact paths were subsequently read.

## Findings

### F1 — D1 `meta.changes === 1` is incompatible with trigger side effects

`commitTaskResult` treats `inserted.meta.changes === 1` as the success discriminator. Migration 0005 inserts the result and its AFTER INSERT trigger updates `pool_tasks` and inserts `pool_task_result_outbox`.

Cloudflare documents D1 `meta.changes` as based on SQLite `sqlite3_total_changes()`, which counts trigger side effects. Therefore the expected count is not safely equal to one; for this trigger path it includes the result insert, task update, and outbox insert. If D1 returns the documented total, the adapter falls through to the existing-row readback and reports `RESULT_ALREADY_COMMITTED` on the first successful commit instead of `RESULT_COMMITTED`. The current test explicitly expects `RESULT_COMMITTED`, so this is a likely deterministic Workers-runtime test failure, not merely a metric concern.

Evidence:
- Cloudflare D1 API `QueryResult.meta.changes`: https://developers.cloudflare.com/api/resources/d1/subresources/database/
- Adapter: `src/task-result.mjs` blob above.
- Trigger: migration 0005 blob above.

A local Python SQLite micro-experiment confirmed that `Connection.total_changes` includes the top-level insert and trigger UPDATE/INSERT writes (four changes in a minimal test with one parent insert plus three trigger effects). This is a SQLite semantics sanity check only, NOT a Cloudflare Workers/D1 test.

Required correction: do not infer a single-row insert from D1 total_changes. After a successful statement, perform a bounded readback of the immutable result, completed task tuple, and unique outbox row; return RESULT_COMMITTED only when all expected persisted fields match. Preserve a distinct exact-retry path and deny conflicting identity. Add an adversarial regression test that exercises the trigger-backed first commit.

### F2 — caller-provided time is not a qualified trusted clock

`commitTaskResult` accepts `input.now` and uses it in `lease_expires_at > ?`. `acquireTaskLease`, `renewTaskLease`, and `finalizeTaskLease` similarly accept a `now` argument. The proof does not show the composition boundary that supplies this value or prove that a worker cannot choose/backdate it.

This is a trust-boundary gap, not a demonstrated exploit against a deployed service: the branch is local-only and has no qualified caller boundary. Before production use, inject time only from a trusted server-side clock or use a database-time expression within the conditional write. Add equality-boundary, expiry, clock-skew, and worker-controlled timestamp denial tests. Do not claim expiry fencing qualified until this is established.

### F3 — no exact-head CI evidence for this proof HEAD

The D1 proof workflow is configured for push and PR events, and the test harness imports `cloudflare:test` with `@cloudflare/vitest-plugin` 1.4.7. However, the GitHub connector's commit-workflow lookup returned no PR-triggered run for `ce2cfbab...`; the inspected recent D1 workflow runs checked out merge commits belonging to other PR stacks (for example PR #130), not this immutable proof HEAD.

Thus exact-head Workers-runtime CI for `ce2cfbab...` is NOT VERIFIED. No test command was run locally: a container clone attempt was blocked because `github.com` DNS/network resolution was unavailable. Do not substitute the unrelated PR #130 success for this proof's evidence.

### F4 — migration/schema compatibility is readable, not runtime-qualified

The migration sequence is coherent at source level: 0001 creates approval ledger; 0002 creates legacy claim/outbox; 0003 introduces logical task identity and task-ready outbox; 0004 adds per-acquisition lease attempt ID; 0005 adds result and result-effect outbox. The Vitest config reads all migrations from the directory and applies them through Cloudflare's test fixture.

This establishes path/order and harness intent only. Actual migration application and runtime semantics remain NOT VERIFIED for this exact branch head.

## Upstream fit review

- pg-boss and Graphile Worker are mature PostgreSQL-backed queues. Their transaction/outbox and worker settlement patterns are useful references, but they are not drop-in dependencies for a Workers + D1 free-tier design.
- BullMQ's default backend is Redis (with PostgreSQL support also appearing in its current repository). It introduces a separate datastore/runtime dependency; do not add it without a demonstrated need and free-tier/cost qualification.
- Temporal provides durable workflow orchestration but requires its server and supported persistence backend; it is disproportionate for this bounded D1 proof absent evidence that the current architecture cannot meet requirements.
- A directly relevant Cloudflare Workers + Durable Objects project, `provos/tasklease`, demonstrates unique rotating task IDs that fence prior owners and atomic consume/retire semantics. It is a useful pattern to study, not an adopted dependency; its own README notes external effects still need idempotency.
- Decision: retain the current D1 proof boundary for now; reuse proven invariants, not new infrastructure. No dependency was added.

References:
- https://github.com/timgit/pg-boss
- https://github.com/graphile/worker
- https://github.com/taskforcesh/bullmq
- https://github.com/temporalio/temporal
- https://github.com/provos/tasklease
- https://developers.cloudflare.com/d1/sql-api/sql-statements/

## Test and CI record

- Intended commands from proof README: `npm ci --ignore-scripts --no-audit --no-fund`, `npm run check`, `npm test`.
- Actual local execution: NOT RUN (GitHub clone blocked by unavailable DNS/network in execution container).
- Exact-head CI for `ce2cfbab...`: NOT VERIFIED.
- Unrelated PR #130 run 44299536170 is not evidence for this proof; it checked out PR #130 merge commit `3272389...` and passed its own 120-test stack.
- No tests are represented as passing for this proof.

## Governance / safety

- No production dispatch; all proof adapters retain `dispatch:false`.
- No hosted D1 mutation, secrets, provider/model calls, deployment, or external dispatcher.
- PR #131 is OPEN/DRAFT and separate; reviews 0, inline threads 0 at readback.
- Ruleset/dispatch-variable live metadata was not re-read in this pass: NOT VERIFIED.
- Gemini controller not invoked: NOT RUN.
- Browser agent not tested in this pass.

## Decision and next engineering step

Status: BLOCKED / NOT QUALIFIED.

1. Create a clean isolated proof branch from the current default HEAD; do not merge the divergent 89-ahead/141-behind proof branch.
2. Port the minimal D1 result/outbox proof and correct F1 with persisted readback semantics.
3. Establish a trusted clock at the server-side composition boundary and test F2.
4. Run exact-head Workers Vitest D1 tests, migration smoke, adversarial stale-worker/same-worker-reclaim/expiry-equality/retry-conflict/rollback tests.
5. Read back exact commit, blobs, CI run checkout SHA, job steps, test counts and artifact digest.
6. Obtain independent review before any production integration. Keep dispatcher absent and dispatch false.

Contour A: BLOCKED / NOT ACCEPTED.  
Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
