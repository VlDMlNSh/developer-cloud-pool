# Issue #38 — free transactional claim backend qualification

- Date: 2026-11-11
- Status: ARCHITECTURE FIT ASSESSMENT COMPLETE / D1 PREFERRED FOR HOSTED PROOF / ACCOUNT ENTITLEMENT AND HOSTED QUALIFICATION NOT VERIFIED
- Immutable base: `Основной@6fdcedebeba62715122e43a75c6ad6d926321ce7`
- Scope: assess the already-used Cloudflare D1 proof against current official Workers Free limits and transaction semantics; compare Durable Objects and GitHub ref reservation; recommend the smallest hosted qualification path for Issue #38.
- Non-goals: create a database/namespace/Worker, provision resources, change account plan, inspect billing details, configure secrets, deploy, dispatch, enable Supervisor/Worker gates, or make runtime changes.

## 1. Current claim-protocol evidence

Issue #38 remains OPEN. Its acceptance criteria require:
- one-winner behavior under concurrent claim attempts against the selected real backend, or an explicit decision to keep dispatch disabled;
- interrupted-claim and worker-failure recovery tests;
- least-privilege authority and audit provenance;
- exact-head CI and independent security review.

Current proof inventory:
- PR #54 is OPEN / DRAFT / UNMERGED at `15a09c910f52553c59796260131a6b5a4a39c15f`, based on PR #51 head `b9067dc7d06245893cd4e208f6215438efe5ca64`.
- Exact-head run [43010770730](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43010770730), job [130489510967](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43010770730/job/130489510967): COMPLETED / SUCCESS.
- The PR tests 50 distinct approvals concurrently attaching to one canonical logical task and one task-level outbox. Every caller returns `dispatch:false`. This is local Miniflare/workerd D1 only; PR body explicitly says it does not satisfy Issue #38's hosted-backend requirement.
- The prior PR #54 provenance comment identified that status-transition trigger actor IDs could be null. Current migration blob `678a4aa8ce396a15f4f0ecbf908aa41fabc4d752` uses `OLD.lease_owner`; current tests blob `6178a10504a5914187c29bc3ed1ec209e3cd62f3` asserts actor identity for retryable and delivered transitions. The old review thread is resolved/outdated. PR #54 has one COMMENTED review, not an APPROVED review; formal approval remains absent.
- PR #37 remains OPEN / DRAFT / UNMERGED at `1be8672c1be1a720b6c813dcafff5c020b6456ae`; formal review history contains CHANGES_REQUESTED and COMMENTED, with no approval on current head. It is not merge-qualified.
- Existing default-branch supervisor/worker dispatch path remains a separate blocker. Do not enable either dispatch gate.

## 2. Current official Cloudflare Free-plan facts

Official docs were queried on 2026-11-11:

### Workers Free
- 100,000 Worker requests/day.
- 10 ms CPU time per request.
- 50 external subrequests/request.
- Daily limits reset at 00:00 UTC.
- If the daily Worker request limit is exceeded, Cloudflare returns Error 1027; the security-critical route should fail closed.

Source: https://developers.cloudflare.com/workers/platform/limits/

### D1 Free
- 5 million rows read/day.
- 100,000 rows written/day.
- 5 GB total storage.
- Daily read/write limits reset at 00:00 UTC.
- After a daily read/write limit is exceeded, further D1 operations fail until reset; stored data is not affected.
- Cloudflare states the Workers Free plan includes D1 for prototyping/experimentation.

Sources:
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/d1/platform/limits/
- https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/

### D1 transaction semantics
The D1 binding `batch()` executes the supplied statements sequentially as a SQL transaction. If a statement fails, D1 aborts/rolls back the entire batch. The D1 API documentation also warns that a write whose caller-side timeout wins a Promise.race may still commit; the caller must confirm outcome before retrying.

Sources:
- https://developers.cloudflare.com/d1/worker-api/d1-database/
- https://developers.cloudflare.com/d1/observability/debug-d1/

### Durable Objects Free
- SQLite-backed Durable Objects are available on Workers Free; the Free plan does not support the legacy KV storage backend.
- 100,000 DO requests/day.
- 13,000 GB-s duration/day.
- SQLite rows read/write quotas match D1: 5 million reads/day and 100,000 writes/day.
- Storage is 5 GB total per account; the Free-plan per-object SQLite maximum is 1 GB.
- Individual DO instances are single-threaded with a soft limit of 1,000 requests/second; input/output gates and storage transactions provide concurrency safety. Cloudflare recommends `transaction()` for atomic read-modify-write, not `blockConcurrencyWhile()` on every request.
- If any Free limit is exceeded, further operations of that type fail; no paid fallback is assumed.

Sources:
- https://developers.cloudflare.com/durable-objects/platform/pricing/
- https://developers.cloudflare.com/durable-objects/platform/limits/
- https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/
- https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/

Important: official documentation establishes that these products are included in Workers Free. The connected Cloudflare account's actual plan/entitlement, remaining quotas, existing resources and deploy authorization were not verified by this pass. Account presence/type is not proof of Workers Free activation or available quota.

## 3. Options compared

| Option | Atomicity / contention | Free-only fit | Least-privilege / complexity | Decision |
|---|---|---|---|---|
| GitHub Issue labels + Actions concurrency | Not CAS; concurrency only serializes runs in one group and labels are mutable; not authoritative across all actors | Free GitHub Actions, but no atomic issue update | Existing Supervisor permissions too broad if used as ref writer; residual race | REJECTED as authoritative claim lock |
| Dedicated Git ref reservation repository | Git create-ref can return 201 / 409, but ref lifecycle, delete/recreate, recovery and true reservation identity require further qualification | GitHub Free repository capability likely usable; no separate database | Requires Contents:write, ref namespace governance and protections; issue #38 specifically warns against granting broad write to Supervisor | NOT SELECTED |
| Cloudflare D1 transactional ledger | SQL uniqueness/conditional updates and transactional batch; current local proof already uses this model | Documented Workers Free: 5m reads/day, 100k writes/day, 5GB total; over-limit operations fail | Reuses current D1 schema/adapter/test stack; one authoritative ledger; no second coordination database | PREFERRED FOR HOSTED PROOF, NOT YET QUALIFIED |
| One Durable Object per logical task with SQLite | Per-object single-threaded actor model plus transactional storage; can isolate contention by deterministic task key | Documented Free limits: 100k requests/day, 13k GB-s/day, 5m reads/day, 100k writes/day; 1GB/object, 5GB total | Adds DO namespace, migrations, actor lifecycle and potentially a second authority if paired with D1 | DEFER; use only if D1 proof exposes a concrete need for per-task actor serialization |

The project repository already contains a D1 proof harness using pinned `@cloudflare/vitest-plugin`, Vitest, Wrangler and synthetic D1. Repository-scoped search did not find an existing Cloudflare Durable Object claim service or a reusable deployed claim-service implementation. Reuse the existing D1 proof rather than starting a new persistence stack.

## 4. Recommendation

Select **Cloudflare D1 as the first hosted-backend qualification target**, not as a production deployment approval.

Reasons:
1. The current proof schema and adapter already use D1 conditional SQL and unique constraints.
2. D1 Free is documented, including explicit bounded read/write/storage quotas.
3. D1 batch transactions provide the required all-or-nothing transaction semantics for grouped statements.
4. It avoids introducing a second authoritative state store or a separate actor runtime before a concrete need is proven.
5. Quota exhaustion and any D1 ambiguity can be handled fail-closed with no paid fallback.

Durable Objects remain a valid alternative if later contention testing demonstrates that a per-task actor boundary materially simplifies or strengthens the protocol. Do not use a single global DO as a lock for all tasks; it would be a throughput bottleneck. Do not split authority between a DO SQLite ledger and a D1 ledger without a separately proven consistency protocol.

## 5. Required hosted qualification plan — not executed

Before any hosted test:
1. Confirm Workers Free entitlement and exact account quota/usage through authorized, non-secret account metadata. This pass did not establish the plan.
2. Define the isolated synthetic D1 database and Worker with no production bindings, no provider credentials, no task dispatch and no access to production ledger.
3. Add a temporary test-only endpoint or workflow harness with no browser exposure and strict synthetic identifiers; do not place credentials in source or artifacts.
4. Run concurrent claims from separate Workers invocations/processes against the same hosted D1 database (at least 50 contenders, plus repeated runs).
5. Prove exactly one winner, one canonical task, one task-level outbox, all losers denied or idempotently attached as specified, and all responses `dispatch:false`.
6. Inject storage/transaction errors and ambiguous client timeouts; confirm read-back before retry and no duplicate claim/outbox.
7. Test quota exhaustion behavior using a controlled local fault injection, not by exhausting the real account quota.
8. Capture exact database binding identity in a redacted evidence report; do not expose account secrets or credentials.
9. Run exact-head CI and obtain independent security review of the hosted integration and permissions.
10. Delete synthetic resources only after collecting required evidence and verifying cleanup. No production adoption until all Issue #38 acceptance criteria pass.

No Worker, D1 database, Durable Object namespace, secret, API token, OAuth credential, provider, or paid resource was created or accessed in this pass. No workflow dispatch, runtime/schema/permission change, deployment, merge, or gate change occurred.

## 6. Status and next action

- D1 Free product eligibility: DOCUMENTED; actual account plan/quota: NOT VERIFIED.
- Existing local 50-way contention proof: CI VERIFIED at exact PR #54 head; HOSTED CONCURRENCY NOT VERIFIED.
- PR #54: OPEN / DRAFT / UNMERGED; exact-head CI SUCCESS; one COMMENTED review; no approval.
- PR #37: OPEN / DRAFT / UNMERGED; CHANGES_REQUESTED review history; not approved.
- GitHub label/concurrency lock: REJECTED.
- Git ref lock: NOT SELECTED.
- D1: PREFERRED HOSTED PROOF TARGET / NOT DEPLOYED / NOT QUALIFIED.
- Durable Objects: DEFERRED alternative.
- Supervisor/Worker dispatch: FAIL-CLOSED.
- Issue #38: OPEN / NOT QUALIFIED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Next bounded step: inspect current Cloudflare D1 account resource/plan metadata without creating resources, then draft the isolated hosted-proof implementation boundary and permission matrix. If entitlement or ownership cannot be verified, stop before provisioning and retain dispatch disabled.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## 7. Read-only Cloudflare resource inventory (2026-11-11)

A read-only Cloudflare API inventory was performed after this report's initial draft. Results:
- D1 databases: empty list.
- Worker scripts: empty list.
- Durable Object namespaces: empty list.

No resource was created or modified. This confirms there is no existing D1 database, Worker script or Durable Object namespace available to reuse in the connected account at the time of this read. It does not prove Workers Free plan entitlement, remaining quotas or permission to provision; the API account listing exposed a standard account identity but did not establish a Workers subscription/plan. Therefore the hosted proof cannot start yet without first verifying the account's free entitlement and obtaining an explicit approved provisioning boundary. Do not create resources speculatively.
