# PR #58 Lifecycle / D1 Retry Interface Audit — 2026-11-11

## Immutable target and scope

Read-only audit of the existing GitHub terminal projection and D1 retry proofs.
- PR #58 head: `6f7953e4abec3cc564984ee3635cdb7717ae5d5e`, base `ec3f3266ca28c4fb5633a9475cc6f396a4677974`.
- PR #59 head: `22200226da4f1af30645cf441a639db6893e9310`, base PR #58 head `6f7953e4abec3cc564984ee3635cdb7717ae5d5e`.
- PR #60 head: `234fb2ee40265e26fac00c69ac1b6192766602cb`, base `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- No source, schema, workflow, permission, secret, branch, merge, dispatch or deployment changes.

## Reuse-first check

Searched GitHub repositories for Cloudflare D1 transactional outbox, Workers idempotency-key libraries, and D1 retry/backoff examples. No compatible mature drop-in repositories were returned. Existing first-party Cloudflare primitives and Octokit reuse were assessed in the preceding reports; none replaces this project-specific D1 delivery authority or GitHub issue lifecycle contract. Decision: retain the narrow existing proof; do not introduce another queue, workflow engine, HTTP client or generic framework.

## Lifecycle ownership findings

### Canonical default-branch Supervisor source

Read `scripts/pool-supervisor.mjs` at blob `52bf03ca889edd92fd10c71ae96a2e35e106d43f`.
Its `ensureLabels()` declares:
- `pool:ready`
- `pool:claimed`
- `pool:probe-complete`
- `pool:needs-review`
- `pool:invalid`

Its terminal transition logic removes explicit state labels rather than every `pool:*` label. This is the current default-branch implementation evidence, not a complete approved lifecycle contract.

### PR #58 reconciler

Read `proofs/d1-ledger/src/projection-reconciler.mjs` at blob `2f83befc145d39ea60f06fe5b9e9033f89df40c0`.
- Envelope accepts terminal outcomes `succeeded`, `failed`, `abandoned`.
- It accepts four terminal labels: `pool:probe-complete`, `pool:needs-review`, `pool:completed`, `pool:failed`.
- It still computes `currentManaged` using `startsWith("pool:")`, so it may remove `pool:ready`, `pool:claimed`, `pool:invalid`, and any future `pool:*` label even though these are not all owned by this reconciler.
- Envelope accepts 1–3 distinct labels; it does not enforce one canonical label for each terminal outcome.

### Draft lifecycle contract is not accepted

PR #37's draft supervisor/finalizer patch uses an explicit managed set containing `pool:ready`, `pool:claimed`, `pool:probe-complete`, `pool:needs-review`, `pool:invalid`, and terminalizes to `pool:probe-complete` or `pool:needs-review`. The current Context Window already states PR #37's narrower state list is not accepted. Do not treat it as the authoritative contract. It also does not justify adopting the extra `pool:completed` and `pool:failed` labels in PR #58.

### Lifecycle conclusion

F-02 and F-03 remain open. The safe next change is not simply to hardcode the default branch's current five labels into PR #58. First establish one accepted ownership contract across Supervisor, Worker finalizer, and projection reconciler, including the exact owner of each label and a single outcome-to-terminal-label mapping. Until then, fail closed rather than mutating labels whose ownership is ambiguous.

## D1 retry interface findings

### PR #59 D1 outbox source and migrations

- `0006_create_attempt_projection_outbox.sql` blob `660fa9de99ed78fe083bb627d6a61dbf0bd65c25`.
- `0007_bound_projection_delivery_retries.sql` blob `767d95a30fa0a14c79e88c8c58392bfec9cdddc2`.
- `0008_enforce_projection_attempt_monotonicity.sql` blob `1d9385dd371f3404c52ec15fce03b0a14d384ab1`.
- `projection-outbox.mjs` blob `1546c2e4172e3767ed8bd5642c7b9c6d95716d11`.

PR #59 adds a durable outbox delivery lease, monotonically increasing delivery generation, a five-attempt ceiling, retry-after timestamps (30/60/120/240 seconds), terminal dead-letter state, and append-only event evidence. These are meaningful local D1 proof improvements.

### Missing cross-module authorization binding (F-01 remains)

PR #59 and PR #58 remain separate modules with no demonstrated adapter contract joining them:
- PR #59 `acquireProjectionDelivery` returns outbox identity, repository/issue, target SHA, attempt terminal status, event digest, lease owner, delivery generation, expiry, and delivery attempt count.
- PR #58 `reconcileTerminalProjection` does not accept a D1 lease or a D1-derived capability. Its `allowPost: boolean` remains caller-controlled.
- No function in the reviewed PR #59 adapter creates a verifier-produced, one-use POST authorization bound to the exact outbox ID, repository/issue, event digest, delivery generation, attempt count and unexpired lease.
- Therefore the D1 five-attempt budget is not yet shown to govern actual POST permission in the reconciler. A caller can invoke PR #58 with `allowPost: true` without proving that a fresh D1 lease was acquired.
- The tests in PR #59 prove retry scheduling/dead-letter transitions locally; PR #58 tests prove a single fake POST plus reconciliation-only readback. They do not prove that every POST consumes one authorized D1 delivery lease, or that a lease cannot be reused for multiple POSTs.

This is a protocol integration gap, not a reason to replace the outbox. The intended correction is a narrow adapter/capability contract: obtain a fresh lease from D1; verify all envelope fields against that lease; allow at most one side-effecting POST per lease generation; persist/verify the resulting delivery state; reject expired, stale, mismatched or reused leases. A caller boolean must not confer POST authority.

### Trusted time / actor caveat

PR #59 APIs accept caller-supplied `now` values as deterministic test seams. This pass does not establish a production trusted clock or an authenticated actor identity. Migration #0007's event actor attribution via `COALESCE(NEW.lease_owner, OLD.lease_owner)` records a string from row state; it is not authentication. PR #60 issuer/trusted-time design remains a separate unresolved prerequisite.

## Exact-head CI and review

- PR #58 exact head: run `42979949181`, completed SUCCESS.
- PR #59 exact head: run `42981807825`, completed SUCCESS.
- PR #60 exact head: no run returned; CI NOT VERIFIED.
- Formal reviews for #58/#59/#60: none returned. Inline review threads were not re-queried in this pass; prior context recorded none, so current thread state is NOT REVERIFIED.
- All three remain OPEN / DRAFT / UNMERGED.

## Status and next step

- Lifecycle ownership contract: NOT ACCEPTED / BLOCKED.
- D1 retry implementation proof: local CI VERIFIED at exact PR #59 head.
- D1 lease-to-POST authority integration: NOT IMPLEMENTED / NOT VERIFIED.
- PR #58 protocol qualification: INCOMPLETE.
- PR #60 issuer/trusted-time: NOT ACCEPTED; exact-head CI NOT VERIFIED.
- Dispatch: fail-closed.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Next bounded action: prepare an explicit lifecycle ownership contract from the current Supervisor and Worker/finalizer code, reconcile it with PR #58 and PR #37 without silently adopting a Draft design, then design a one-use D1-lease-bound POST grant. Only after the contracts are agreed should PR #58/#59 receive a coordinated stacked change and exact-head CI revalidation.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
