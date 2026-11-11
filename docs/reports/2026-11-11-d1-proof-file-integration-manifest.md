# D1 proof integration manifest — 2026-11-11

## Target and scope

Immutable base: default branch `Основной` at `6fdcedebeba62715122e43a75c6ad6d926321ce7`.
Compared recursive Git trees and inspected selected blobs from:
- PR #39 HEAD `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`
- PR #54 HEAD `15a09c910f52553c59796260131a6b5a4a39c15f`
- PR #56 HEAD `0769b6b5d5eda9c7821804b93db21ded6e0985ef`

This is a read-only source/dependency manifest. No code, branch, workflow, schema, secret, permission, hosted resource, dispatch, deployment or merge was changed.

## Component and mature-project check

The existing proof already uses Cloudflare's official Workers Vitest integration:
- `@cloudflare/vitest-plugin@1.4.7`
- `vitest@4.1.12`
- local Miniflare/workerd D1 binding and `applyD1Migrations` imported from the plugin public entrypoint.

GitHub repository discovery was attempted for Cloudflare D1 transactional outbox, D1 migrations/testing and SQLite outbox patterns. Results did not surface a mature, directly substitutable D1 outbox/claim implementation. Generic outbox examples are not drop-in replacements for this repository's trigger-backed schema and immutable task/attempt semantics. Keep the official Cloudflare test harness; do not replace it with a bespoke database simulator.

## File-level classification

### Shared foundational package (PR #39 -> PR #54/#56)

These paths are present with identical blobs at all three heads and absent from current default:
- `proofs/d1-ledger/migrations/0001_create_pool_approval_ledger.sql` — blob `a80524ed839b63dd6483978118619495fa550877`.
- `proofs/d1-ledger/migrations/0002_create_task_claim_outbox.sql` — blob `44b8f7e0658296d287269770c5e91b1c3e25973c`.
- `proofs/d1-ledger/src/consume.mjs` — `f71e559a7c13b9a0242a7f619eba998c5906d95e`.
- `proofs/d1-ledger/src/worker.mjs` — `214622f6dc94623521070eb9e7fbc2f573fdc2c6`.
- `proofs/d1-ledger/test/apply-migrations.ts` — `e1307208cc520a3399e66a937c3e0b05b71ac0f6`.
- `proofs/d1-ledger/test/consume.test.ts` — `ef502247683239d50d3c781240cc5b2595aa0696`.
- `proofs/d1-ledger/vitest.config.ts` — `39bcf53a51180e7e5f309978e307e9964a2cc22e`.
- `proofs/d1-ledger/wrangler.jsonc` — `eb683b6bb838cb7a48741f900de6c17be7fdc0fe`.
- `proofs/d1-ledger/package-lock.json` — `876c5d3de53bb12efaecdec939cbe8710cbd9e3c`.

PR #39 is the first complete baseline for approval consume and claim/outbox; later PRs build on its files rather than independently replacing the entire package.

### Task identity / attempt lifecycle (PR #54 and #56)

Present with identical blobs at #54 and #56, absent from #39 and default:
- Migration 0003 logical task identity: `49b0798871429d7961e81eb1d86ad892dba0b9b9`.
- Migration 0004 immutable attempts: `0ad590ffdd2589f857257739275c15ed2d54d729`.
- Migration 0005 attempt reconciliation queue: `7a19897f6197c79517170e101e4cbf1db233cac6`.
- `src/task-lease.mjs`: `b41edf89cdf960b2c007f38ba16554dc179f021a`.
- `docs/contracts/TASK-IDENTITY-AND-FENCED-DELIVERY-PROOF.md`: `5a9d4d157b1b773a31b2dfcf2e15f3c828e1257e`.

These migrations are an ordered extension after 0001/0002. Do not import 0004/0005 without 0003. They are experimental local proof schema, not accepted production schema.

### Projection outbox (PR #54 only; absent from PR #56)

- Migration 0006: `678a4aa8ce396a15f4f0ecbf908aa41fabc4d752`.
- `src/projection-outbox.mjs`: `afdc133ad11a3a99ecb4b7168d5b8afcc1dc4dd6`.
- PR #54 test file imports projection adapter and performs projection outbox/event cleanup and append-only trigger setup.
- PR #56 tree has no 0006 migration, projection adapter or projection tests. It cannot be used as the complete PR #54 successor.

This is a distinct optional proof layer and must be explicitly included only if the current qualification scope requires projection delivery. If included, migration 0006 follows 0005 and adapter/tests must be carried as a complete unit.

### Security remediation (PR #56 preferred delta)

- `src/task-attempts.mjs` differs between #54 and #56: #54 blob `6cb028e048569700ed623d93462ef55e2392a084`; #56 blob `d9e5f97b94f0873fbec542a71bc90ea3b62e0e30`.
- PR #54's adapter accepts caller-provided `{resumable:true}` to permit expired running attempt takeover. PR #56 removes that public override and denies expired running takeover pending trusted reconciliation.
- PR #56's `test/claim-outbox.test.ts` blob `911945bed6449b45f421786808d57e994d160e71` includes the no-takeover remediation, but lacks PR #54's projection imports and projection-table cleanup/tests.
- PR #54's test blob `6178a10504a5914187c29bc3ed1ec209e3cd62f3` includes projection behavior but uses the weaker #54 attempt adapter.
- Required result: compose PR #56 task-attempt implementation and negative takeover test with PR #54 projection test coverage and setup/cleanup. Do not select either entire test file unchanged.

### Metadata and validation files requiring reconciliation

- `package.json`: #54 blob `115e89447d16daa860d8ef95589e96190aca5633`; #56 blob `b16fce67dd3c9ddd50bc440ddd1f2ca86b56e5ea`. Both pin the same direct test dependencies; #54 syntax-check includes `projection-outbox.mjs`, #56 does not. If 0006/projection is retained, use union script coverage.
- `README.md`: same blob `d46f42c00906fa817bc8a73385d4612a53897753` at #54/#56, but it still describes caller-declared resumability and must be corrected to the #56 fail-closed behavior before qualification.
- `.github/workflows/d1-ledger-proof-validation.yml`: distinct blobs #39 `cb31bda7588137baf84a8141aec11024461cf818`, #54 `6b34e923bd4a9e801467f6a90a09702e8b876d38`, #56 `27e3fe1d02181f53fd778f8cb24187be47cd2a37`. Must inspect full workflow diffs and retain only the current valid exact-head trigger/lockfile policy; do not blindly choose latest file by PR number.
- `src/claim-outbox.mjs`: #39 blob `96ee60a06e7d37b51b999829fa223eba7488d9e4`; #54/#56 blob `37d75e2b31d9214b04398527eb08dce296f1ff27`. Use #54/#56 version for task identity extensions.
- `test/claim-outbox.test.ts`: #39 `eb02a8edd0a748fb2c645457bded3be61dd87d60`; #54 `6178a10504a5914187c29bc3ed1ec209e3cd62f3`; #56 `911945bed6449b45f421786808d57e994d160e71`. Requires deliberate composition described above.

## Ordered integration plan (not executed)

1. Start from fresh verified default HEAD; no existing proof paths are present.
2. Add foundational 0001/0002 + consume/claim adapters + worker + local Workers Vitest config + lockfile/package and their tests.
3. Add 0003 logical task identity, matching claim adapter delta and contract/tests.
4. Add 0004 immutable attempt schema and #56 hardened task-attempt adapter/tests; ensure 0005 is not applied before its prerequisites.
5. Add 0005 reconciliation queue, matching adapters/events/tests.
6. Decide whether projection proof is in the acceptance scope. If yes, add 0006 + projection adapter + projection-specific tests and cleanup as one atomic feature unit. If no, defer all three together.
7. Reconcile workflow from exact diff review; preserve pinned lockfile and exact-head test coverage.
8. Update README to remove stale caller-controlled resumability description; document local-only / dispatch:false boundaries.
9. Run `npm ci --ignore-scripts --no-audit --no-fund`, syntax checks and Workers Vitest D1 tests on the exact candidate SHA. Record run ID, artifact digest and lockfile evidence.
10. Independent contract/security review; only then consider hosted D1 qualification after separate entitlement, quota, topology, owner and permission checks.

## Blockers and status

- Current default HEAD has no D1 proof package.
- #39/#54/#56 are stacked/diverged and are not merge-ready.
- PR #56 is the authoritative no-caller-override remediation for expired attempt takeover; PR #54 alone has projection-outbox feature.
- Projection proof scope is not yet decided by an accepted qualification contract.
- Workflow full diff and exact candidate CI remain outstanding.
- No hosted D1, dispatch, production integration or merge authorized.

Status: manifest VERIFIED at inspected immutable tree/blob SHAs; integration NOT RUN; hosted D1 NOT RUN; Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md

## Workflow blob review addendum

Full workflow blobs were read, not just tree hashes:
- PR #39 workflow pins checkout/setup-node/upload-artifact SHAs, uses Node 24.9.0, `npm ci --ignore-scripts --no-audit --no-fund`, syntax check, Workers D1 tests and 7-day lockfile artifact. Its branch trigger list covers only the first two proof branches.
- PR #54 adds task identity, immutable attempts, finalization and reconciliation branch names to push/PR trigger lists.
- PR #56 adds `fix/deny-attempt-lease-takeover-2026-11-10` to push triggers. It retains the PR #54 workflow execution steps and artifact policy.
- All three versions use read-only `contents: read` and pinned action SHAs. No secret permissions are declared.
- Candidate should preserve PR #56's trigger coverage and add any fresh integration branch trigger only if needed; keep the pinned actions, Node version, npm ci policy, syntax/test steps and artifact upload. Exact workflow candidate still requires exact-head CI.
