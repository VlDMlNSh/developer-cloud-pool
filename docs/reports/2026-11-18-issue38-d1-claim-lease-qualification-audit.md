# 2026-11-18 — Issue #38 existing D1 claim/lease prototype qualification audit

## Scope and immutable sources

This pass performed source-level qualification triage for Issue #38. No production code was changed.

- Repository: `VlDMlNSh/developer-cloud-pool`; default branch name `Основной`.
- Current integrated admission candidate remains PR #130 HEAD `6175eed8812fe52aad929523caab6b942cd01dd7`, based on PR #129 HEAD `70265bbb21a8419312bc0cfe684d32184cffc497`; PR #130 OPEN/DRAFT/UNMERGED.
- Existing proof source branch: `proof/task-identity-fencing-design-2026-11-08`.
- Readback `proofs/d1-ledger/src/task-lease.mjs`: blob `b41edf89cdf960b2c007f38ba16554dc179f021a`.
- Readback `proofs/d1-ledger/README.md`: blob `a364fb31ff340970d15658f3cf4ee5502696d4ef`.
- Readback `proofs/d1-ledger/package.json`: blob `cd7a705ce39860685c3ec60134dc8442fab738d8`.
- Branch content readback confirms the README and source. Several guessed test/migration paths were not found; those files are NOT VERIFIED and are not treated as evidence.

## Findings — reusable implementation already exists

The proof README describes a local-only D1 package using Cloudflare Workers Vitest / Miniflare and synthetic D1 binding. It records:
- concurrent first-consumer-wins, replay, immutable binding, expiry and storage-failure cases;
- transactional D1 batch rollback;
- trigger-backed atomic claim + deterministic outbox creation;
- logical task identity separated from approval IDs, with one task-level outbox row per task key;
- lease acquire/renew/reclaim with monotonically increasing generation;
- owner + generation fenced renewal and completion;
- five-attempt cap and dead-letter transition;
- key-binding conflict rollback in the approval-consumption trigger.

The README explicitly states the package is NOT mounted in the Hono web console, production Supervisor/Worker workflows or deployed Worker. Its adapters return `dispatch: false`. It also states the most recent lease tests were authored but pending exact-head CI at that revision. Therefore none of these features are production-qualified.

## Source-level review of task lease adapter

The read-back `src/task-lease.mjs` provides:
1. `acquireTaskLease`: validates SHA-256 task key, bounded worker identifier, integer time and lease duration <= 900 seconds; uses a conditional UPDATE requiring pending state or expired lease, increments `lease_generation` and `attempt_count`, and accepts the mutation only when D1 reports exactly one changed row.
2. `renewTaskLease`: conditional UPDATE requires state=leased, matching owner, matching generation and lease not expired.
3. `finalizeTaskLease`: same owner/generation/expiry fence for completion.
4. Ambiguous storage failures fail closed; every returned decision sets `dispatch:false`.

Positive design properties: a single conditional D1 UPDATE is the core one-winner primitive; generation fencing prevents an older lease generation from renewing or finalizing after a reclaim; bounded lease duration and attempt count constrain runaway retries.

Qualification gaps / required tests:
- The available source excerpt does not prove the task row's creation/approval-consumption/outbox transaction is integrated with this adapter. Must inspect migration and adapter call graph before combining them.
- Must verify concurrency at the real local D1/workerd runtime with simultaneous claimers, not merely mocked DB results. The README claims concurrency tests in the package, but the relevant test source paths were not retrieved in this pass.
- Must test same worker ID issuing overlapping claims, lease expiry boundary equality, clock rollback/forward assumptions, generation overflow/SQLite integer range, and a crash between claim and execution.
- Must prove stale generation cannot write task output or emit duplicate outbox/dispatch effects, not only that renewal/finalize are denied.
- A lease does not provide exactly-once side effects. Worker effects need idempotency keyed by immutable task identity and generation-aware commit/finalization.
- Task identity must bind repository ID, issue/approval identity, immutable target SHA, profile/capability envelope and canonical payload digest; the current lease adapter accepts only a 64-hex task key and does not itself validate what was hashed.
- The code's preliminary attempt-exhaustion UPDATE, snapshot read and conditional lease UPDATE are separate statements. The lease winner predicate itself is conditional and should serialize correctly at the row mutation boundary, but dead-letter/outbox coupling and crash recovery must be proven transactionally, preferably by a D1 batch/trigger or equivalent atomic statement group.
- No exact-head CI, independent review or test execution was performed on this historical branch in this pass.

## Architecture decision for Issue #38

Select **existing D1 transactional claim + outbox + task lease/fencing proof as the preferred candidate for qualification**, rather than introducing pg-boss, Graphile Worker, BullMQ, Temporal or a Git ref reservation system at this stage.

Reasoning:
- The current platform baseline is Workers + D1; the existing prototype already targets that runtime and has no production dispatch side effects.
- PostgreSQL/Redis-backed queues add an unqualified external datastore; Temporal adds an independently operated control plane; Git ref reservation requires broader repository Contents authority and ref lifecycle governance.
- Reuse is conditional on proving the D1 atomicity and fencing contract. Do not copy the adapter into production or enable dispatch based on README assertions.

Threat model and guarantees sought:
- Two or more concurrent claimers for the same logical task: exactly one active lease generation is committed.
- Replays: deterministic task key/outbox identity prevents duplicate logical task creation.
- Expired lease: a new claimant may acquire a strictly greater generation; all old-generation renew/finalize/output commits are rejected.
- Crash: task remains recoverable through pending/expired lease state; retries are bounded; exhausted task and outbox are atomically dead-lettered.
- Ambiguous D1 response: fail closed and read back immutable state before any retry; never infer success from timeout.
- Least privilege: D1 binding scoped to the proof/runtime; no GitHub Contents:write expansion; no provider credentials; production dispatch remains false.

Non-guarantees:
- A lease is not exactly-once execution. External side effects require idempotency.
- Local Miniflare/workerd tests do not prove hosted D1 behavior, account entitlement, production durability, backup/restore or operational recovery.
- A successful local claim proof does not qualify a production Worker or Supervisor.

## Next bounded implementation/verification pass

1. Recover the exact full source tree and test/migration filenames from the proof branch commit tree; establish its exact HEAD and ancestry.
2. Retrieve the precise D1 claim/outbox migration, logical-task adapter and lease tests; reconcile README claims against executable tests.
3. Run exact-head CI for the historical proof branch (or create a clean child branch from its immutable SHA if the old branch is stale). Do not modify the integrated PR #130 chain.
4. Add adversarial concurrent tests: N claimers / one task; one winner; loser readback; expiry/reclaim increments generation; old owner/generation cannot renew, finalize, write result or create outbox side effect; attempt cap/dead-letter atomicity; ambiguous storage failure.
5. Only after exact-head CI and independent review, propose a separate integration PR with explicit production schema compatibility analysis. Keep Supervisor/Worker dispatch fail-closed.

## Status

- Existing D1 claim/lease prototype: SOURCE READ / NOT QUALIFIED.
- Local runtime tests: README describes them, but relevant test source and exact-head run not retrieved in this pass; NOT VERIFIED.
- Production Supervisor/Worker integration: NOT IMPLEMENTED / NOT VERIFIED.
- Gemini: NOT RUN; no verified approved controller was established.
- No secrets read, no hosted D1 writes, provider calls, dispatch, deployment or merge.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
