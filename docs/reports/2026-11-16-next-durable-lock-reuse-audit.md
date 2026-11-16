# 2026-11-16 — Cloud Pool /next durable-lock reuse audit

## Scope
One bounded code-level pass on the Gemini /next dispatch blocker. No runtime dispatch, provider calls, secret reads, deployments, merges or Contour B work.

## Refreshed state
- Repository: VlDMlNSh/developer-cloud-pool; default branch Основной.
- PR #98: OPEN / DRAFT / UNMERGED, head f23cdb5484d5923e02242b3ea142397f9e1f0270, 9 files / admission-ledger proof.
- PR #100: OPEN / DRAFT / UNMERGED, head cb952a915093a4aaafb8f878954503d2460c4008; exact-head check run 43826793313, contract job 133162447332 SUCCESS. This does not provide runtime locking.
- PR #102: OPEN / DRAFT / UNMERGED, head e6613c152c5334db04f520cfe069f3bbd1c57772; read-only event gate only.
- PR #106: OPEN / DRAFT / UNMERGED, head 15de4aa015493aec7ee5137f1e4dae9591c4ab4f; ephemeral browser smoke only.
- Governing requirement: Issue #94; Cloud Pool control issue #96.

## Source audit
Inspected at PR #100 head:
- scripts/next-dispatch-ledger.mjs blob b32df2ccc6d852ecbcb0af5f47fcb08082ca51ad.
- scripts/next-github-api-adapter.mjs blob bd117d17a131d8a37463d2482d043574756287b8.
- scripts/next-github-ledger-adapter.mjs blob fb37cb3b862b5320f4c1f9018fb260f7a5087c7f.
- docs/decisions/2026-11-11-durable-supervisor-claim-protocol.md blob 830a549809d10015d5662da562cff82710c3aa11.
- docs/architecture/GITHUB-POOL-SUPERVISOR-AND-RECOVERY.md blob 3ac28f2f105a20a4eed5d93168bbe84d2d5273b8.

Findings:
1. The PR #100 ledger is append-only GitHub issue-comment state with authenticated owner/issue metadata. It validates record digest and source-comment/target-SHA binding, but a plain digest is integrity detection, not cryptographic authenticity.
2. Workflow-run reconciliation requires exact workflow ID/path/event/repository/branch/SHA/display title. This is a useful correlation predicate, not a lock.
3. Runtime entrypoints deliberately return DURABLE_LOCK_NOT_IMPLEMENTED; they do not call the API adapter or dispatch.
4. Existing architecture decision explicitly rejects GitHub issue labels + Actions concurrency as authoritative locks. A concurrency group serializes only members of that group and cannot fence independent actors or ambiguous external side effects.
5. Existing D1 local proof (PR #39/#54, documented in the decision record) demonstrates transactional conditional claim/outbox under synthetic Workers/D1 tests, including 12-way and 50-way contention. It is the strongest reusable implementation candidate already in this repository.
6. That D1 proof is local-only and unqualified: no hosted account/deployment, production transaction evidence, issuer-authenticated service boundary, scoped remote credentials, free-tier entitlement evidence, trusted time, or hosted recovery tests. It must not be treated as a production lock or wired directly to the Supervisor.

## Engineering decision
Do not implement a new lock using GitHub issue comments or Actions concurrency. Reuse the existing Workers + D1 conditional-claim/outbox prototype as the reference implementation, but first qualify a narrow authenticated claim-service boundary and monotonic fencing/lease generation. Keep the service credential server-side; Supervisor receives only a narrowly scoped invocation capability. Require crash/ambiguous-outcome reconciliation before enabling any child workflow.

## Execution status
- Gemini Agent 1/2/3 Cloud Pool dispatch: NOT RUN.
- POOL_DISPATCH_ENABLED: keep false.
- No secrets inspected, provider/model calls, child workflow runs, deployment, merge or qualification.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

## Next step
Inspect the existing D1 claim/outbox implementation and its migrations/tests on their exact PR heads; produce a minimal hosted-service contract and threat model. Do not deploy or enable dispatch until owner-scoped authority, free-tier scope, fencing, recovery and independent security review are evidenced.

## Evidence
- Issue #94: https://github.com/VlDMlNSh/developer-cloud-pool/issues/94
- Issue #96: https://github.com/VlDMlNSh/developer-cloud-pool/issues/96
- PR #98: https://github.com/VlDMlNSh/developer-cloud-pool/pull/98
- PR #100: https://github.com/VlDMlNSh/developer-cloud-pool/pull/100
- PR #102: https://github.com/VlDMlNSh/developer-cloud-pool/pull/102
- PR #106: https://github.com/VlDMlNSh/developer-cloud-pool/pull/106
- Exact-head PR #100 contract run: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43826793313
- Canonical MediaHub map (reference only): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md