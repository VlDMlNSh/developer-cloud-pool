# Local D1 terminal projection outbox proof — 2026-11-09

## Status
LOCAL PROOF IMPLEMENTED / EXACT-HEAD CI VERIFIED. Not production integration, not hosted D1 qualification, and not dispatch authorization.

## Immutable target and scope
- Existing cumulative PR #54 branch: `test/50-approval-logical-task-contention-2026-11-09`.
- Target head after this pass: `ec3f3266ca28c4fb5633a9475cc6f396a4677974`.
- Base: `proof/immutable-task-attempts-audit-ci-2026-11-08` (PR #54 remains draft/open).
- Only isolated `proofs/d1-ledger` schema, adapter, tests, and syntax check changed.
- No production workflow wiring, GitHub API integration, remote D1 provisioning, permissions, secrets, dispatch, providers/models, deployment, or Contour B work.

## Existing component reuse
Reused the repository's existing local D1 schema, trigger-backed transaction model, Cloudflare Workers Vitest plugin `@cloudflare/vitest-plugin@1.4.7`, Vitest, and Miniflare/workerd fixture. No new framework or service.

## Implementation
Migration `0006_create_attempt_projection_outbox.sql` adds:
- Immutable terminal projection envelope bound to task/attempt/repository/Issue/target SHA/profile, terminal status, lease generation, and event digest.
- Delivery states `pending`, `leased`, `retryable`, `delivered`, `dead_letter`.
- Monotonic delivery lease generation, owner, expiry, attempt count, and timestamps.
- Append-only delivery event log with DB triggers.
- Trigger from immutable `attempt.finalized` event to projection outbox insert. This trigger executes inside the same D1 statement/transaction as terminal attempt/audit/task projection, so outbox intent is committed or rolled back with terminal finalization.

Adapter `src/projection-outbox.mjs` adds local-only functions:
- `acquireProjectionDelivery`: conditional lease claim/reclaim, increments generation and attempts, readback verifies owner.
- `markProjectionRetryable`: owner/generation/expiry-fenced transition and readback.
- `acknowledgeProjectionDelivered`: owner/generation/expiry-fenced acknowledgement and readback.
All return `dispatch:false`. No GitHub calls exist in this adapter.

## Tests and debugging evidence
Three Workers-runtime tests added:
1. Terminal finalization creates projection intent; 20 concurrent delivery claimants yield exactly one lease winner and one lease event.
2. Expired delivery lease can be reclaimed with generation 2; generation-1 worker cannot acknowledge; generation-2 worker can acknowledge and readback confirms delivered state.
3. Retryable transition records append-only delivery history; delete is rejected.

The first CI attempt exposed two useful defects in the test/adapter:
- D1 `meta.changes` includes trigger side effects (the winning UPDATE reported 2, not 1); code now accepts >=1 and verifies exact resulting state by readback.
- Append-only delivery-event triggers prevented test fixture cleanup; test setup now drops/recreates only those fixture triggers around per-test cleanup. The production proof schema still enforces append-only history during test execution.

## Exact-head CI
- PR #54 head: `ec3f3266ca28c4fb5633a9475cc6f396a4677974`.
- Workflow run: `42537241204`.
- Job: `128904147572`.
- Result: COMPLETED / SUCCESS.
- Workers-runtime suite: 2 files passed, 40 tests passed.
- Adapter syntax check passed.
- Lockfile artifact uploaded: ID `13639658349`, SHA-256 `178698c55de4e903fe3a181f5ff742144482532de8ec5112686519d7161be526`.
- Exact-head run: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42537241204

## Readback blobs
- Migration: `660fa9de99ed78fe083bb627d6a61dbf0bd65c25`.
- Adapter: `afdc133ad11a3a99ecb4b7168d5b8afcc1dc4dd6`.
- Test: `5bcd6e42acc8ac7ee4f2cfec31e32a5e2d3b5499`.
- Package: `115e89447d16daa860d8ef95589e96190aca5633`.
All four files were fetched again at the exact PR head.

## Limitations / disposition
- This proves local D1 transaction/outbox intent creation and local single-winner fenced delivery lease behavior only.
- It does NOT prove hosted D1 concurrency, production account entitlement, real GitHub API projection, GitHub comment idempotency, delayed comment visibility, duplicate comment reconciliation, backup/restore, or least-privilege runtime identity.
- No GitHub projection sender/reconciler implemented. Delivery acknowledgement is a test adapter operation only; caller must not acknowledge until external projection readback is proven.
- Outbox `dead_letter` is a schema state but no transition API or bounded retry policy implemented yet.
- Initial CI run `42537120309` failed 3 new tests; this was not hidden. Root cause D1 trigger changes count and fixture cleanup was corrected. Final exact-head CI run above passed.
- PR #54 remains OPEN/DRAFT/UNMERGED. Issue #38 remains OPEN. PR #53 F2-R1/F2-R2 remain NOT FIXED.
- Dispatch remains FAIL-CLOSED. Contour A BLOCKED / NOT QUALIFIED / NOT ACCEPTED. Contour B DEFERRED.

## Next
Implement a local-only projection sender/reconciler test harness around a fake GitHub API boundary: simulate successful comment POST with lost response, delayed marker visibility, duplicate markers, digest conflict, and label namespace reconciliation. Keep real GitHub write access absent and dispatch disabled. Then assess whether dead-letter policy is sufficiently explicit before any hosted qualification.

## References
- PR #54: https://github.com/VlDMlNSh/developer-cloud-pool/pull/54
- Issue #38: https://github.com/VlDMlNSh/developer-cloud-pool/issues/38
- PR #53: https://github.com/VlDMlNSh/developer-cloud-pool/pull/53
- Design: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/github-context-window-2026-11-06/docs/architecture/DURABLE-FINALIZATION-OUTBOX-DESIGN.md
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
