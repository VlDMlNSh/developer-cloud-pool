# 2026-11-16 — D1 claim/attempt lifecycle qualification boundary

## Scope
One bounded source-level qualification pass over the current D1 proof stack. No hosted resources, secrets, provider calls, dispatch, deployments, merges or Contour B work.

## Refreshed immutable state
- Cloud Pool default branch Основной: e38f87099e0edd1bb918c9b9f2b8ad3422b9d32b.
- PR #39: OPEN/DRAFT/UNMERGED, head ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833; historical 12-way per-approval contention proof.
- PR #54: OPEN/DRAFT/UNMERGED, head 15a09c910f52553c59796260131a6b5a4a39c15f; historical 50-way logical-task contention proof.
- Current reconstructed D1 stack: PR #87 head 8cc7b12948865bb0e13ce099386c09f3ae32b4f5 -> PR #92 head 7014961587759b27d2ef6e91c60ce098d077ae83 -> PR #93 head e200838d038b9cd48635233187819302bba6a33e. All OPEN/DRAFT/UNMERGED. Mergeability observed: #87 false, #92 true, #93 true. Formal review count and required governance were not re-queried in this pass.
- Combined commit status API returned no status contexts for the three heads. This is NOT equivalent to CI success. Prior Context Window records successful D1 proof runs on these heads; exact latest-head check-run inventory is NOT VERIFIED in this pass.
- Context Window was read on docs/cross-chat-continuation-2026-11-06; current blob at start 7125962bfd4c8c4916dff9c9250bd3bcd4fc45cb.

## Source inspection at PR #93 immutable head
- proofs/d1-ledger/README.md blob c7d78c857c15cdf67009af51cdb9beff8d87d430.
- src/claim-outbox.mjs blob 37d75e2b31d9214b04398527eb08dce296f1ff27.
- src/task-lease.mjs blob b41edf89cdf960b2c007f38ba16554dc179f021a.
- src/task-attempts.mjs blob 6cb028e048569700ed623d93462ef55e2392a084.
- migrations/0004_create_immutable_task_attempts.sql blob 0ad590ffdd2589f857257739275c15ed2d54d729.
- migrations/0005_create_attempt_reconciliation_queue.sql blob 7a19897f6197c79517170e101e4cbf1db233cac6.
- migrations/0006_create_attempt_projection_outbox.sql blob 660fa9de99ed78fe083bb627d6a61dbf0bd65c25.
- migrations/0014_atomic_admission_registry_assertion.sql blob cb8a47d83faba62981daa8f7320da87baa2c55e2.
- test/claim-outbox.test.ts blob 93192ebb3d00701230c3d9a1a5557ba159fd74f3.
- test/atomic-admission.test.ts blob 720a13e6ec0fd49c6d165393f4d8c12ef94dd8a9.

## Verified source-level capabilities
1. Approval consumption and task/outbox creation are transactionally coupled by D1 SQL triggers; the adapters hard-code dispatch:false.
2. Logical task identity is separated from approval identity, allowing multiple individually audited approvals to attach to one canonical task.
3. Immutable attempt rows bind attempt ID/number, input digest and execution idempotency key; lease takeover does not fabricate a new attempt.
4. Attempt lease acquisition/renewal/finalization uses monotonically increasing lease_generation and checks owner, attempt identity, generation and expiry. Stale workers are fenced at the SQL predicate boundary.
5. Expired running attempts become indeterminate and create a durable reconciliation queue row. The queue explicitly does not authorize retries or terminal decisions.
6. Terminal attempt events create a separate projection outbox in the same local database transaction. Projection delivery has its own lease generation and bounded retry/dead-letter behavior.
7. PR #93 adds verifier-issued in-process capability for persisting the root-signed route registry; migration 0014 re-checks active snapshot/issuer-key validity in the same admission batch.

## Qualification gaps — hard blockers
- All evidence is local Miniflare/workerd synthetic D1. The package README explicitly says it is not mounted in the Hono web console, production Supervisor/Worker workflows or a deployed Worker.
- No hosted D1 binding, Cloudflare account ownership/plan/quota verification, deployment provenance or remote contention/failure test is established.
- No authenticated network claim-service endpoint or production issuer/capability verification boundary is wired to the D1 adapter. The registry verifier is a local proof and does not itself establish a production issuer service or root-key custody.
- Trusted production time, remote revocation/rotation authority, service-to-service authentication, scoped credential custody and production access controls remain unqualified.
- Reconciliation queue is deliberately passive; there is no qualified external resolver that can adjudicate indeterminate attempts. Blind retry remains prohibited.
- Projection outbox proves local durable intent, not exactly-once GitHub side effects. A production delivery worker needs independent auth, idempotency/reconciliation and hosted failure testing.
- Current D1 PR stack remains draft/unmerged. The D1 proof does not create a Cloud Pool `/next` controller, Gemini child workflows, or a persistent browser/dashboard service.

## Engineering decision
Treat PR #87/#92/#93 as the strongest reusable local reference implementation. Do not rewrite the ledger or lease engine. The next implementation boundary is a separately authenticated, narrowly scoped hosted claim-service composition root, plus explicit resolver and projection-delivery actors with separate capabilities/audiences. Keep database credentials server-side and dispatch disabled. Before hosted deployment, obtain exact-head CI evidence and independent security review; before production use, verify free-tier limits and real hosted contention/recovery.

## Execution status
- Cloud Pool Gemini Agent 1/2/3: NOT RUN.
- POOL_DISPATCH_ENABLED: remain false.
- No secrets read, hosted D1 provisioned, deployment, provider/model call, child workflow dispatch, merge or qualification.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

## Next bounded step
Write and review the hosted claim-service contract and threat model against the existing D1 adapters: issuer authentication, operation/audience scopes, task-envelope binding, monotonic lease generation, indeterminate resolution, outbox delivery, revocation and trusted time. Only after that should a deployment skeleton be proposed.

## Evidence
- Issue #94: https://github.com/VlDMlNSh/developer-cloud-pool/issues/94
- Issue #96: https://github.com/VlDMlNSh/developer-cloud-pool/issues/96
- PR #87: https://github.com/VlDMlNSh/developer-cloud-pool/pull/87
- PR #92: https://github.com/VlDMlNSh/developer-cloud-pool/pull/92
- PR #93: https://github.com/VlDMlNSh/developer-cloud-pool/pull/93
- PR #39: https://github.com/VlDMlNSh/developer-cloud-pool/pull/39
- PR #54: https://github.com/VlDMlNSh/developer-cloud-pool/pull/54
- Canonical MediaHub map (reference only): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md