# Backend State Authority decision study — 2026-11-11

## Status

DECISION STUDY COMPLETE. BACKEND NOT SELECTED. NO PROVISIONING OR DISPATCH.

This is a documented architecture comparison for Issue #38, not a qualification or production approval. It relies on the current repository contracts and Cloudflare's published product documentation. Account-specific entitlement, ownership, quotas, credentials, and deployed-resource state are not established by public documentation.

## Immutable project context

- Repository: `VlDMlNSh/developer-cloud-pool`
- Default branch HEAD observed: `864213e2ff5b4fa956ba405dea8137a44d812f49`
- Issue #38: https://github.com/VlDMlNSh/developer-cloud-pool/issues/38
- Shared immutable claim contract blob: `595da5bdaf832a48e032eb51a283e2456943b248`
- Trusted reconciliation contract blob: `32bce214a8a3577584f058fb5679b8cecf5f3309`
- PR #51 local D1 queue proof head: `32c88e50e173e6b19bc6c61723ab6474a3c08145`; exact-head local Workers-runtime D1 tests passed in run `42536377720`, job `128901478596`. This is local-runtime evidence only.
- PR #51 remains 116 ahead / 3 behind default at observed comparison and must not be merged without lineage reconciliation and fresh exact-head CI.
- PR #37 remains an unmerged draft; its authorization changes do not qualify a durable claim backend.

## Requirements derived from contracts and Issue #38

The authoritative store must support a single-winner conditional claim, idempotent replay, atomic claim + outbox, monotonically increasing fencing generation, stale-worker rejection, durable audit, interruption recovery, bounded quotas, least-privilege issuer authority, and no paid fallback. Reconciliation must additionally bind exact native executor identity and side-effect evidence. Missing/ambiguous evidence remains unresolved and cannot authorize retry or dispatch.

GitHub labels are projections only. Workflow-level concurrency is not a cross-actor claim lock.

## Candidate comparison

### A. Serialized Supervisor + GitHub Issue labels

- Reuses existing GitHub API and workflow governance.
- Label PATCH has no compare-and-swap; other actors/workflows can race.
- Read-back can detect some conflicts but cannot turn the operation into atomic single-winner claim.
- Suitable only as a display/projection or explicitly risk-accepted interim queue with dispatch disabled.
- Decision: REJECT as authoritative claim backend.

### B. Dedicated Git state repository with immutable reservation refs

- Git ref creation has create/conflict semantics and may provide a reservation primitive.
- Requires Contents: write, namespace protection, prevention of delete/recreate, retention, issuer isolation, and recovery semantics.
- A broad Contents: write credential in Supervisor would violate least privilege.
- A dedicated narrowly scoped issuer may be possible, but the threat model and real concurrent-create/recovery tests are not present.
- Decision: DEFER. Do not grant Contents: write to the current Supervisor.

### C. Cloudflare D1

Published documentation states D1 is available on Workers Free and Paid. Free limits currently document 5 million rows read/day, 100,000 rows written/day, 5 GB total storage, and 10 databases. Free limit exhaustion causes queries to fail until 00:00 UTC reset; there is no automatic paid fallback. D1 batches run in a SQL transaction and roll back the sequence on failure; each individual database is single-threaded and queues concurrent requests, returning overload when its queue is full.

- Strong fit for SQL conditional transitions, atomic claim/outbox and the existing local D1 proof lineage.
- Existing repository evidence is Workers-runtime local test coverage, not a deployed/hosted account qualification.
- Free quota exhaustion is an availability failure: all claim, audit and reconciliation writes must fail closed; no retry/dispatch based on uncertain write outcomes.
- D1 is a plausible authoritative backend if account entitlement, database ownership, Worker binding identity, access controls, backup/recovery, quotas and hosted contention tests are verified.
- Decision: RETAIN AS A QUALIFICATION CANDIDATE; not selected or provisioned.

References:
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/d1/worker-api/d1-database/
- https://developers.cloudflare.com/d1/platform/limits/
- https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/

### D. Cloudflare Durable Objects with SQLite storage

Published documentation states SQLite-backed Durable Objects are available on Workers Free and Paid. The Free plan currently documents 5 million row reads/day, 100,000 row writes/day and 1 GB SQLite storage per object. A Durable Object is a single-threaded actor with attached durable, transactional and strongly consistent storage. SQLite storage operations are synchronous; `transactionSync()` rolls back on exception and is intended for synchronous SQL operations. Input/output gates protect storage consistency. Free limits fail closed when exhausted.

- Natural single-authority boundary: one deterministic coordinator object for the claim namespace, with persistent SQLite state and typed RPC methods.
- Can implement conditional state transitions, fencing generation, idempotency, atomic outbox and append-only receipts inside one object transaction.
- The singleton coordinator may become a throughput bottleneck; design around bounded sharding only if cross-shard invariants are not required, otherwise retain one authority and measure contention.
- Free storage is 1 GB/object (lower than D1's 5 GB total); daily write limit is 100,000 rows. Alarm scheduling incurs writes. These are hard availability ceilings, not guaranteed capacity.
- Durable Object lifecycle/deployments can reset in-memory state; all authoritative state must be persisted. Code update/deferred execution is best-effort and not a substitute for transaction/recovery design.
- Decision: PREFERRED ARCHITECTURAL CANDIDATE FOR A PROTOTYPE, not selected as production authority until account-level eligibility, migration strategy, one-winner contention, interruption/restart, quota exhaustion and audit/recovery are qualified.

References:
- https://developers.cloudflare.com/durable-objects/platform/pricing/
- https://developers.cloudflare.com/durable-objects/platform/limits/
- https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/
- https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/
- https://developers.cloudflare.com/durable-objects/concepts/what-are-durable-objects/

## Recommendation

Do not select GitHub labels or Git refs as the authoritative claim lock under current privilege constraints. Retain D1 as the existing SQL proof lineage and qualification candidate. Prototype the same backend-neutral contract against SQLite-backed Durable Objects as the leading free-tier coordination candidate, then compare hosted qualification evidence before selecting one. Do not run both as co-authorities.

This recommendation is not a claim that Durable Objects are enabled in the owner's account, that an account is on Workers Free, or that the project has been deployed. No account inventory or entitlement check was performed in this pass.

## Qualification plan (all gates mandatory)

1. Account and plan proof: identify exact Cloudflare account profile/owner and confirm Workers Free eligibility without reading or exposing secrets; verify no paid fallback or paid resource can be created.
2. Authority design: define one deterministic authority namespace/object ID; authenticated issuer boundary; fixed RPC surface; no direct storage credentials to Supervisor/Worker; separate resolver capability.
3. Atomic state model: claim + outbox in one transaction; exact idempotency key; unique constraints; monotonically increasing generation; stale generation affects zero rows; append-only receipt.
4. Concurrency: concurrent claim storm against hosted candidate, exactly one winner and one logical outbox event; repeat across isolates/regions as supported.
5. Recovery: process interruption at each boundary, lost response after commit, duplicate requests, object eviction/restart, deployment restart, alarm retries and quota exhaustion.
6. Reconciliation: exact run_id + run_attempt + repository/workflow identity; native event authenticity; read-only fixed-origin evidence; external side-effect receipts/idempotency; unknown stays unresolved.
7. Governance: separate least-privilege issuer/resolver; no secret disclosure; no provider/model dispatch; dispatch gates remain false.
8. Independent security review and exact-head CI; record immutable code, migration and artifact digests.

## Current disposition

- GitHub Issue labels: REJECTED as authority.
- Git refs: DEFERRED.
- D1: CANDIDATE / NOT QUALIFIED.
- SQLite Durable Objects: PREFERRED PROTOTYPE CANDIDATE / NOT QUALIFIED.
- Backend selection: NOT SELECTED.
- Hosted account eligibility: NOT VERIFIED.
- Provisioning/deployment: NOT RUN.
- Resolver/dispatch: DISABLED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Next bounded step: inspect only non-secret Cloudflare account identity/plan/resource metadata through authorized read-only Cloudflare actions, if available, then create a non-deployed local Durable Objects prototype that runs the claim contract's adversarial suite. No remote resources, secrets, or dispatch until the owner has explicitly authorized that separate action.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## 2026-11-11 read-only Cloudflare account inventory supplement

The connected Cloudflare profile was identified through the authorized connection. A read-only account list returned exactly one accessible standard account. No account identifier or personal billing profile fields are reproduced here.

Read-only resource inventory against that account:
- D1 database list: SUCCESS, 0 databases.
- Workers scripts list: SUCCESS, 0 scripts.
- Durable Objects namespace list: SUCCESS, 0 namespaces.
- Account subscriptions endpoint: HTTP 403 / authentication permission denied. Plan/subscription entitlement therefore remains NOT VERIFIED.

This is direct account inventory evidence for the connected profile, not proof that other accounts or external projects do not exist. It does establish that this connection currently exposes no D1 database, Worker script, or Durable Object namespace in the one accessible account. No resource was created, modified, deleted, deployed, or otherwise provisioned. No secrets or billing profile data were read.

Updated disposition:
- Cloudflare connection: AVAILABLE (one standard account visible).
- D1 / Worker / Durable Objects deployed resources in visible account: NONE OBSERVED.
- Workers Free / Paid subscription status: NOT VERIFIED (subscriptions endpoint denied).
- Backend: NOT SELECTED; Durable Objects remains preferred local prototype candidate only.
- Remote provisioning: NOT RUN.


## 2026-11-11 — PR #52 local Workflow/D1 proof re-audit

PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/52  
Proof branch: `proof/cloudflare-workflows-vitest-2026-11-08`  
Implementation head: `34cdf68d44aac22c10871bf42ddf1cbadf31082e`  
Latest report-only head: `1eb3be17d9146d57a4335b511804946e097651ae`  
In-progress process recovery report commit: `c430fe4beecf93a20052f0c3efedb5f8539e4faa`.

This audit found stronger local evidence than the earlier summary of the D1 candidate recorded: PR #52 composes a synthetic D1 attempt ledger with an official Cloudflare Workflow step and documents commit-then-timeout retry, duplicate Workflow trigger rejection, explicit restart replay, completed-instance persistence across two Wrangler processes, and in-progress Workflow recovery across abrupt local process termination. The in-progress test uses a named 60-second sleep, terminates the first local process set with SIGKILL, restarts a distinct Wrangler/Workerd process using the same persistence directory, observes the same Workflow instance still running, and confirms one final D1 receipt at the original attempt generation. These are useful local simulator proofs, not hosted Cloudflare qualification.

Exact-head Actions evidence independently read back in this audit:
- Implementation SHA `34cdf68d44aac22c10871bf42ddf1cbadf31082e`: run `42505474727`, job `128807039896`, COMPLETED / SUCCESS; all steps passed including Workflow + D1 local proof.
- Report-only SHA `4db46c78e57c4af1b995b1cebeb6c12203e6ab3d`: run `42506472721`, job `128810086646`, COMPLETED / SUCCESS; all steps passed.
- Report-only SHA `1eb3be17d9146d57a4335b511804946e097651ae`: run `42506744722`, job `128810903390`, COMPLETED / SUCCESS; all steps passed.
- Process-recovery report SHA `c430fe4beecf93a20052f0c3efedb5f8539e4faa`: run `42507524428`, job `128813275338`, COMPLETED / SUCCESS; all steps passed.

Review state: PR #52 has zero formal review submissions and zero inline review threads at this inspection. It remains DRAFT / UNMERGED. The local tests use synthetic Miniflare/Workers runtime; there is no remote D1/Workflow deployment, account-level quota/plan verification, distributed hosted contention storm, independent security/provenance review, or production issuer/resolver boundary. The local process restart is not proof of hosted regional failover or all crash windows.

Architectural implication: do not start a second Durable Objects implementation until the D1/Workflow proof is fully lineage-audited and the ADR explicitly chooses whether to retain D1 as primary candidate or run a narrowly scoped comparative DO prototype. A local DO prototype may still be justified to compare transaction semantics, but must reuse the same backend-neutral claim contract and must not create dual authority. PR #52 is itself stacked on PR #25 and remains a proof branch; its current base/merge readiness must be checked before promotion. The account inventory remains: one connected standard account visible, zero D1 databases / Workers scripts / DO namespaces; subscription endpoint 403, so Free entitlement NOT VERIFIED.

Updated disposition: D1 + Workflows local proof = LOCALLY VERIFIED for the stated cases; hosted backend = NOT QUALIFIED; backend selection = NOT SELECTED; PR #52 = DRAFT / UNMERGED; independent review = NOT RUN; dispatch disabled; Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
