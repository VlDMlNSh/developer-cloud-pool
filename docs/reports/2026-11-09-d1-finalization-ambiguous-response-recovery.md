# D1 finalization ambiguous-response recovery fault injection — 2026-11-09

## Scope and immutable targets
Added a deterministic fault-injection test to the existing local D1 proof on both open PR branches:
- PR #51 head `32c88e50e173e6b19bc6c61723ab6474a3c08145`.
- PR #54 head `ded780c6aeea6cdd88b253a2087692eecbbce7c7`.
No production workflow, default branch, permissions, secrets, remote D1, dispatch, provider/model invocation, or deployment changes.

## Mature component reuse
Retained the existing official Cloudflare Workers Vitest integration (`@cloudflare/vitest-plugin@1.4.7`) and local Miniflare/workerd D1 fixture. No new test framework, database, or custom runtime was introduced.

## Fault-injection behavior
Added test: `recovers an exact finalization after commit succeeds but the caller loses the response`.
1. Creates a logical task and acquires a fenced attempt lease.
2. Wraps only the first `UPDATE pool_attempts` statement.
3. The wrapper awaits the real D1 statement (including its SQLite trigger transaction) and confirms it committed successfully, then throws a synthetic lost-response error to the caller.
4. The adapter returns `ATTEMPT_FINALIZATION_AMBIGUOUS`, representing an unknown outcome at the caller boundary.
5. The test retries against the normal D1 binding with a fresh clock reading.
6. Replay returns `ATTEMPT_ALREADY_FINALIZED` and the original `completedAt`.
7. Assertions confirm exactly one `attempt.finalized` audit event and a completed task with cleared lease fields.

This proves deterministic recovery from a caller-observed ambiguous response after a committed local D1 transaction. It does not simulate a real network partition or qualify a hosted D1 service.

## Exact-head CI
PR #51:
- Head `32c88e50e173e6b19bc6c61723ab6474a3c08145`.
- Run `42536377720`, job `128901478596`, COMPLETED / SUCCESS.
- Checkout, pinned Node, dependency install, syntax check, Workers-runtime D1 tests, lockfile artifact upload and cleanup all succeeded.

PR #54:
- Head `ded780c6aeea6cdd88b253a2087692eecbbce7c7`.
- Run `42536381713`, job `128901491911`, COMPLETED / SUCCESS.
- Checkout, pinned Node, dependency install, syntax check, Workers-runtime D1 tests, lockfile artifact upload and cleanup all succeeded.

## Readback
The test file was fetched at both exact heads and the fault-injection test is present. Source adapter remains unchanged from the verified clock-independence fix:
- PR #51 source blob `6cb028e048569700ed623d93462ef55e2392a084`.
- PR #51 test blob `0af5366564dfb3458ccda656c802ff039ead2418`.
- PR #54 test blob `9fb1bab45b716cc43b9003e54a61c54ca6a3c01c`.

## Disposition and limitations
- D1 finalization clock-independent replay: VERIFIED in local Workers-runtime test scope.
- Commit-success / caller-lost-response / exact replay / single audit event: VERIFIED in local Workers-runtime test scope.
- PR #51 and PR #54 remain OPEN / DRAFT / UNMERGED.
- Remote D1 account entitlement, least-privilege binding, hosted contention, trusted clock, backup/restore and operational recovery remain NOT QUALIFIED.
- Issue #38 remains OPEN. PR #53 GitHub Issues label finalizer still has split-write audit and non-CAS risks.
- Dispatch remains FAIL-CLOSED. Contour A BLOCKED / NOT QUALIFIED / NOT ACCEPTED. Contour B DEFERRED.

## Evidence
- PR #51: https://github.com/VlDMlNSh/developer-cloud-pool/pull/51
- PR #54: https://github.com/VlDMlNSh/developer-cloud-pool/pull/54
- PR #51 exact-head CI: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42536377720
- PR #54 exact-head CI: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42536381713
- PR #51 source: https://github.com/VlDMlNSh/developer-cloud-pool/blob/32c88e50e173e6b19bc6c61723ab6474a3c08145/proofs/d1-ledger/src/task-attempts.mjs
- PR #51 test: https://github.com/VlDMlNSh/developer-cloud-pool/blob/32c88e50e173e6b19bc6c61723ab6474a3c08145/proofs/d1-ledger/test/claim-outbox.test.ts
- Issue #38: https://github.com/VlDMlNSh/developer-cloud-pool/issues/38
- PR #53: https://github.com/VlDMlNSh/developer-cloud-pool/pull/53
- Canonical MediaHub map (reference only): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
