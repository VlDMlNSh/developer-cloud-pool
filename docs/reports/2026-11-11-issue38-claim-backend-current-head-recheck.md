# Issue #38 — claim backend and PR #64 current-head recheck

- Date: 2026-11-11
- Status: D1 remains the preferred hosted proof target; account inventory and hosted contention NOT VERIFIED; PR #64 NOT REVIEW-READY.
- Immutable default source: `Основной@9aa719ce4b68519191cb6bb8e8fe0fe447dc7a38`.
- PR #64 source: `docs/issue38-free-claim-backend-fit-2026-11-11@95d237c753bec96abe9add621140928511047599`.
- Scope: recheck Issue #38, PR #64 exact head, local proof provenance, free-tier constraints, scope hygiene, and reusable OSS fit. No hosted provisioning or runtime changes.

## 1. Current GitHub state

- Issue #38 remains OPEN; acceptance requires real-backend concurrent one-winner proof (or explicit keep-disabled decision), interrupted-claim/worker-failure recovery, least privilege, audit provenance, exact-head CI and independent review.
- PR #64 remains OPEN / DRAFT / UNMERGED; API reports `mergeable:false`.
- PR #64 head `95d237c753bec96abe9add621140928511047599`; base SHA `6fdcedebeba62715122e43a75c6ad6d926321ce7`.
- Compared to current default `9aa719ce4b68519191cb6bb8e8fe0fe447dc7a38`: DIVERGED, 51 ahead / 2 behind, merge base `6fdcedebeba62715122e43a75c6ad6d926321ce7`.
- The two default-side commits since PR base touch only Context Window and PR #37 recheck report. No runtime conflict is visible from the compare summary; still requires controlled branch refresh before merge.
- PR #64 changes 16 files, all documentation, 1,957 additions. The paths include Issue #38 backend fit and hosted D1 plan, but also provider credential inventory, Gemini Wave 317, agent-capacity operating model, provider-router audit, quota assessment and broad continuation checkpoint. This is a scope-cohesion problem for a PR titled only as claim backend qualification.
- Exact-head PR workflow query for `95d237c753bec96abe9add621140928511047599` returned no runs: CI NOT VERIFIED. Formal reviews: 0. Inline review threads: 0.
- PR #54 current head `15a09c910f52553c59796260131a6b5a4a39c15f`; run `43010770730`, job `130489510967`: COMPLETED / SUCCESS. This is a local Miniflare/workerd D1 proof, not hosted contention. PR #54 remains OPEN / DRAFT / UNMERGED and its review status is not an independent approval.
- Cloudflare account inventory previously read-only: 0 D1 databases, 0 Worker scripts, 0 Durable Object namespaces. No resource was created. Account-specific entitlement/remaining quotas and provisioning authorization remain NOT VERIFIED / NOT AUTHORIZED.

## 2. Cloudflare product constraints — refreshed against official docs

### D1 Free
- 5 million rows read/day, 100,000 rows written/day, 5 GB total storage.
- Daily quota exhaustion causes further D1 operations to fail until reset; there is no paid fallback in this project.
- Each individual D1 database is single-threaded and processes queries one at a time.
- D1 `batch()` executes sequential statements as one SQL transaction; a failed statement rolls the batch back. A caller timeout does not prove that a write failed; the caller must reconcile authoritative state before retrying.
- Cloudflare documents D1 as included with Workers Free for prototyping/experimentation. That product-level statement does not prove the connected account's active plan, current quota headroom or permission to create resources.

Sources:
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/d1/platform/limits/
- https://developers.cloudflare.com/d1/reference/faq/
- https://developers.cloudflare.com/d1/worker-api/d1-database/
- https://developers.cloudflare.com/d1/observability/debug-d1/

### Durable Objects SQLite Free
- SQLite-backed Durable Objects are available on Workers Free; KV-backed Durable Objects are not available for new Free-plan use.
- Free limits include 100,000 requests/day, 13,000 GB-s duration/day, 5 million rows read/day, 100,000 rows written/day, and 5 GB total SQLite storage per account.
- Free plan supports up to 100 Durable Object classes per account; a DO instance is single-threaded and SQLite storage supports transactional coordination.
- This is a technically viable alternative if a per-task actor boundary materially improves the claim design. It adds a different state API, class/namespace lifecycle and operational model. Do not pair a DO ledger with D1 as dual authorities without a separately proven consistency protocol.

Sources:
- https://developers.cloudflare.com/durable-objects/platform/pricing/
- https://developers.cloudflare.com/durable-objects/platform/limits/
- https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/
- https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/

## 3. Mature component reuse check

Projects inspected on GitHub:

- `timgit/pg-boss`: established MIT-licensed Node.js queue using PostgreSQL `SKIP LOCKED`, transactional job insertion and worker backpressure. It requires PostgreSQL 13+ and does not run on Cloudflare D1's SQLite API. Reuse its documented patterns (transactional enqueue, explicit claim, retries, backpressure), not the package as a drop-in dependency.
- `graphile/worker`: established MIT-licensed PostgreSQL-backed Node.js job queue. Same PostgreSQL dependency mismatch; no direct D1 adapter identified.
- `riverqueue/river`: established PostgreSQL job queue candidate; repository README retrieval was unavailable through the current connector in this pass, so implementation fit is NOT VERIFIED. No adoption.
- `temporalio/temporal`: mature durable execution platform, but requires operating a Temporal service and is materially broader than the single-use claim primitive. Not a free drop-in for this Cloudflare Workers/D1 boundary.
- `Kludex/pgtask`: PostgreSQL 16+ durable task/workflow engine; not a D1/SQLite-compatible drop-in and not selected.
- Cloudflare Durable Objects are the native platform alternative, but not required yet: D1 is already the local proof target and introducing DO would expand the state authority model.

Decision: no mature OSS component found that can be safely dropped into the current Cloudflare Workers + D1 claim boundary without adding a different database/service. Keep the D1 proof and reuse tested design patterns. Revisit DO only if the hosted D1 contention/failure evidence exposes a concrete limitation.

## 4. Qualification decision

D1 remains PREFERRED FOR HOSTED PROOF, NOT QUALIFIED. Before any hosted test, the following remain mandatory:
1. Reconcile the source stack to an immutable current-default base and rerun exact-head CI.
2. Narrow the PR #64 documentation scope or split unrelated provider/agent reports into separately reviewable PRs.
3. Confirm account-specific Free entitlement, quota headroom, account ownership and exact resource permissions through non-secret metadata.
4. Obtain explicit owner authorization for one named isolated D1 database and one test-only Worker.
5. Implement only a test-only endpoint with no GitHub write, provider credentials, production bindings or dispatch capability.
6. Send at least 50 independent concurrent HTTP requests from separate invocations; do not substitute sequential SQL batches.
7. Prove one task + one task-level outbox, idempotent replay, mismatch rejection, transaction rollback, lost-response reconciliation, Worker restart and fail-closed quota exhaustion.
8. Preserve redacted evidence, migration checksums, exact SHA/run/job IDs and verify teardown.

The current hosted plan correctly marks provisioning NOT AUTHORIZED / NOT RUN. This remains the controlling gate. No owner action is requested in this pass because no resource creation is authorized or necessary to perform this source audit.

## 5. Explicitly unchanged

- No database, Worker, Durable Object namespace, secret, token, credential, paid plan or provider resource created/read/modified.
- No dispatch, Worker execution, provider/model call, deployment, schema, runtime, permission, workflow or gate change.
- No PR merge, rebase, branch update or Issue closure.
- Supervisor dispatch remains FAIL-CLOSED.
- Issue #38 OPEN / NOT QUALIFIED.
- PR #64 OPEN / DRAFT / UNMERGED; exact-head CI NOT VERIFIED; independent review NOT RUN.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

## Next bounded step

Create a clean, narrowly scoped documentation successor from the current default containing only Issue #38 decision, D1/DO comparison, hosted test plan and source evidence; leave the unrelated provider/agent documentation in its own review units. Then obtain exact-head CI and independent review before asking for hosted resource authorization.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
