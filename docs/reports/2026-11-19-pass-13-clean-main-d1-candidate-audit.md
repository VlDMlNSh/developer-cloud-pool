# Pass 13 — immutable audit of clean-main D1 candidate

Date: 2026-11-19  
Status: **VERIFIED — source inventory and ancestry audit; candidate REJECTED as a direct integration base.**  
Scope: read-only audit of `integration/d1-ledger-clean-main-2026-11-15`. No implementation or runtime action.

## 1. Immutable source and ancestry

- Branch: `integration/d1-ledger-clean-main-2026-11-15`
- Resolved branch HEAD: `8cc7b12948865bb0e13ce099386c09f3ae32b4f5`
- HEAD commit parent: `8abfa5c48e82b50ef9cdbcc009caf03b90e9c82b`
- HEAD tree: `74760280cf48f072386a3b7c9243bf22420522e6`
- Recursive tree inventory: `truncated=false`; 48 blobs under `proofs/d1-ledger/`.
- Compare against current default `Основной` @ `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`: **diverged, 6 commits ahead / 18 behind**, merge base `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`.
- Therefore this branch is not based on the current default HEAD and does not satisfy Issue #140's current-base integration acceptance condition. Its branch name and commit message do not override ancestry evidence.

Compare URL: https://github.com/VlDMlNSh/developer-cloud-pool/compare/b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5...8cc7b12948865bb0e13ce099386c09f3ae32b4f5

## 2. Package inventory

48 blobs total:
- 14 SQL migrations (0001–0014)
- 1 package manifest + 1 lockfile
- 13 source-path entries
- 17 test/configuration/support files
- 1 README
- 1 frozen schema fixture
- 5 other package/test support files are included in the above counts only as enumerated by the tree; no files were omitted from the recursive inventory.

Exact migration manifest:

| Migration | Blob SHA |
|---|---|
| 0001_create_pool_approval_ledger.sql | `a80524ed839b63dd6483978118619495fa550877` |
| 0002_create_task_claim_outbox.sql | `44b8f7e0658296d287269770c5e91b1c3e25973c` |
| 0003_create_logical_task_identity.sql | `49b0798871429d7961e81eb1d86ad892dba0b9b9` |
| 0004_create_immutable_task_attempts.sql | `0ad590ffdd2589f857257739275c15ed2d54d729` |
| 0005_create_attempt_reconciliation_queue.sql | `7a19897f6197c79517170e101e4cbf1db233cac6` |
| 0006_create_attempt_projection_outbox.sql | `660fa9de99ed78fe083bb627d6a61dbf0bd65c25` |
| 0007_bound_projection_delivery_retries.sql | `767d95a30fa0a14c79e88c8c58392bfec9cdddc2` |
| 0008_enforce_projection_attempt_monotonicity.sql | `1d9385dd371f3404c52ec15fce03b0a14d384ab1` |
| 0009_projection_outbox_identity_immutable.sql | `86919425f498dc634329bb783a3ca6ae7a0ff6a1` |
| 0010_projection_comment_at_most_once.sql | `30ac9d0ed0cbede9586c365578c606b47bcce1a7` |
| 0011_atomic_qualified_admission.sql | `39e3da8ccf2f3e82cb7fd8fc858536aa8757b5bc` |
| 0012_durable_route_registry_snapshots.sql | `485d8c2d2327a64c8d86ddc004134113d6ae3d80` |
| 0013_persist_verified_route_registry.sql | `40b93551c787078e5c65c8861569bb428bd2eb8b` |
| 0014_atomic_admission_registry_assertion.sql | `cb8a47d83faba62981daa8f7320da87baa2c55e2` |

Package manifest blob: `334011c6b7db5c92cc4c43256d3b43115833b5a9`; lockfile blob: `876c5d3de53bb12efaecdec939cbe8710cbd9e3c`. Exact-pinned dev dependencies are `@cloudflare/vitest-plugin@1.4.7` and `vitest@4.1.12`; package scripts include syntax checks, local Workers-runtime tests and upgrade smoke tests.

## 3. SQL object inventory and lineage

A lexical inventory across all 14 migration files found:
- 19 `CREATE TABLE` statements
- 12 `CREATE INDEX` / `CREATE UNIQUE INDEX` statements
- 57 `CREATE TRIGGER` statements
- 21 `ALTER TABLE` statements
- 2 explicit `DROP TRIGGER` statements

The two explicit trigger replacements are in migration 0003 (legacy claim/outbox trigger replacement) and 0007 (projection delivery status trigger replacement). These counts are source-token counts, not a live SQLite schema introspection and do not prove the final effective trigger set.

Object ownership by migration family:
- 0001–0003: approval ledger, legacy claim/outbox, logical task identity, task approval and task-level delivery outbox.
- 0004–0005: immutable attempts/events, lease-generation lifecycle, reconciliation queue.
- 0006–0010: attempt projection outbox/events, bounded delivery/dead-letter rules, immutable projection identity, comment projection at-most-once state.
- 0011: route qualification, atomic admission, commit receipts; adds admission binding to approval and task-delivery outbox.
- 0012–0013: durable signed registry snapshots, singleton active pointer, issuer-key records, normalized route evidence and registry bindings.
- 0014: admission-time assertion trigger requiring current snapshot, active issuer key, current registry epoch and fresh, non-revoked qualification.

The 0001–0010 migration blobs match the previously audited #67 lineage. The 0011 admission layer remains the known proof lineage, but it hardcodes retired `dsh-headless-probe` in both SQL and adapters/fixtures. This conflicts with Issue #140's explicit requirement to remove that profile from new canonical executor admission and with the owner-confirmed A1 CODE capability profile `jarvis-code-sandbox-v1` in PR #146. Executor identity, capability profile, host/process identity and provider route/account/quota identity must remain distinct.

## 4. Adapter and test inventory

Source modules (12):
- `a0-admission-contract.mjs`
- `admit-qualified-task.mjs`
- `claim-outbox.mjs`
- `consume.mjs`
- `projection-delivery.mjs`
- `projection-envelope.mjs`
- `projection-outbox.mjs`
- `projection-reconciler.mjs`
- `qualified-route-evidence.mjs`
- `task-attempts.mjs`
- `task-lease.mjs`
- `trusted-route-registry.mjs`
- plus `worker.mjs` as the package entry worker (13 source-path entries total; recursive tree is authoritative).

Tests/configuration include A0 contract, atomic admission, claim/outbox, consume, D1 upgrade binding/fixture smoke, durable registry ledger, projection delivery/envelope/reconciler, qualified-route evidence, registry persistence/verification, Vitest configs and Wrangler config. Package README explicitly states local-only proof scope, `dispatch:false`, no provider/secret/GitHub dispatch integration and no production Worker mounting.

## 5. Qualification findings

**Candidate is useful as a source-reference package, but rejected as a direct integration branch.**

1. Ancestry fails current-base requirement: 6 ahead / 18 behind current default.
2. Legacy profile is hardcoded across admission schema and adapter/test contracts. Blind transplant would violate Issue #140 and A1 profile direction.
3. The package's own README says it is not mounted in Hono console, Supervisor/Worker workflows or deployed Worker; local proof does not establish production integration.
4. Local synthetic tests and in-memory authority harnesses do not establish hosted D1 semantics, real GitHub event authenticity, provider quota truth, live executor attestation or safe runtime execution.
5. The route-registry extension is architecturally valuable: root-signed canonical bundle verification, append-only snapshots, issuer-key persistence and admission-time current-registry assertion. It can be selectively reused only after migration lineage and profile contracts are reconciled on a new current-base target.
6. Do not merge this branch, cherry-pick its full history, or import the whole directory wholesale. Reuse individual reviewed artifacts by blob SHA only after current-base implementation design freezes.

## 6. CI and governance evidence

Exact branch SHA `8cc7b12948865bb0e13ce099386c09f3ae32b4f5` has associated workflow runs:
- Pool Contract Validation — run `43712647615`, completed SUCCESS.
- Isolated D1 Ledger Proof — run `43712647597`, completed SUCCESS.
- Combined commit-status endpoint returned no status entries. The workflow-run association is evidence for this immutable SHA; the empty combined status is not additional evidence.
- Commit signature verification: HEAD commit reports `verified=false`, reason `unsigned`.
- Issue #140 remains OPEN; its current scope requires current-base composition, no legacy profile, one authority/outbox and all local negative-first tests with dispatch and execution authorization false.
- PR #146 remains OPEN/DRAFT/UNMERGED and defines `jarvis-code-sandbox-v1` separately from executor identity. It is a contract source, not permission to activate an executor.

## 7. Decision and next action

Decision: `REJECTED_AS_DIRECT_BASE`; `RESEARCH_REFERENCE_ONLY`.

Next pass must freeze a new integration target from the exact then-current `Основной` HEAD and produce a migration/object ownership manifest before any schema edit. Selectively compose one ledger authority and one task-ready outbox; adapt admission to the frozen CODE profile without conflating executor ID/profile/host/route; include registry snapshot and assertion semantics only after adversarial transaction tests. Keep `dispatch:false`, `executionAuthorized:false`, `dispatchAuthorized:false`. No hosted D1, secrets, provider calls, Gemini/Claude dispatch, deployment, merge or product Contour B.

## 8. Actions not performed

No branch created; no schema/source changed; no tests executed locally in this pass; no hosted D1 reads/writes; no secrets or variable values accessed; no provider/model calls; no controller dispatch; no executor launch; no deployment or merge.

Canonical MediaHub OS map (reference only; Contour B remains deferred):  
https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
