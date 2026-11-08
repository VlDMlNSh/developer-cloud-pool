# Indeterminate Attempt durable reconciliation queue — implementation and CI

Date: 2026-11-08
Status: QUEUE IMPLEMENTED / EXACT-HEAD CI SUCCESS / RESOLUTION AUTHORITY NOT IMPLEMENTED / NOT PRODUCTION-QUALIFIED

## Immutable target

- PR #51: https://github.com/VlDMlNSh/developer-cloud-pool/pull/51
- Head branch: `feat/indeterminate-reconciliation-queue-2026-11-08`
- Exact head: `4d83a77c3d97dccdac8f87ad0fda9182d4fd3ee7`
- Base branch: `proof/immutable-task-attempts-audit-ci-2026-11-08` (PR #49 proof branch, exact base `4ab0fdc4d649736a171faf95b9ab3a24b17217e8`)
- PR state: OPEN / DRAFT / UNMERGED.
- PR branch contains PR #50's exact-finalization replay changes as ancestor; PR #51 was retargeted to PR #49's proof branch to use the existing pull_request CI trigger. This makes PR #51 a stacked aggregate diff; do not merge independently of its prerequisite changes.

## Implementation

Migration `0005_create_attempt_reconciliation_queue.sql` adds `pool_attempt_reconciliations`, uniquely keyed by attempt. When a running Attempt becomes indeterminate, a DB trigger creates one pending reconciliation row in the same D1 transaction as the Attempt status and append-only indeterminate audit event.

The row preserves task key, attempt ID, input digest, lease generation, expired lease owner and timestamp. Unique attempt ID and `ON CONFLICT DO NOTHING` prevent duplicate queue records.

This is deliberately a queue, not a resolver:
- no retry is authorized;
- no lease is cleared;
- no terminal outcome is inferred;
- no actor string is treated as proof of authority;
- a future resolver must verify a trusted capability and immutable evidence before recording a decision.

Test setup now deletes reconciliation rows before parent Attempt rows to respect foreign-key constraints.

## CI evidence

- Initial run `42495635689` failed due test fixture cleanup omitting the new FK-dependent reconciliation table. No implementation assertion failed; 33/35 tests passed, with two fixture teardown failures. Corrected cleanup.
- Corrected exact-head run: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42495716401
- Run `42495716401`, job `128777501915`, exact head `4d83a77c3d97dccdac8f87ad0fda9182d4fd3ee7`: COMPLETED / SUCCESS.
- Syntax check: success.
- Workers-runtime D1: 2 test files, 35/35 tests passed.
- Artifact `13623665401`, size 18,253 bytes, SHA256 `8380de93ae870e28f35abf7df7c94cd9c734da565761a977f251d8d2a60768f7`.

Changed blobs:
- Migration: `7a19897f6197c79517170e101e4cbf1db233cac6`.
- Test: `32d8900246a3c2d45a568f84927acf4cfa821711`.
- D1 workflow branch allowlist: `a3ae41bc2d73ee5e6aaed65a8f43097a623f9ce6`.

## Remaining work

1. Define and verify the trusted reconciliation capability contract (issuer, subject, scope, target attempt, expiry, nonce/replay policy and evidence digest). An untrusted caller-provided authority ID is insufficient.
2. Implement a resolver that atomically records an evidence-backed outcome and audit event, while preserving the rule that unknown external side effects are never retried blindly.
3. Add adversarial tests for unauthorized resolver, mismatched attempt/generation, stale/duplicate evidence, exact replay, conflicting replay and atomic rollback.
4. Only then connect Supervisor/Worker to the Attempt Ledger identities.

## Status

- Durable pending reconciliation queue: IMPLEMENTED; exact-head CI VERIFIED.
- Trusted reconciliation authority and resolver: NOT IMPLEMENTED.
- Supervisor/Worker Attempt integration: NOT IMPLEMENTED.
- Independent review PR #51: NOT RUN at this report creation.
- Remote D1 / provider execution / secrets / deployment: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
