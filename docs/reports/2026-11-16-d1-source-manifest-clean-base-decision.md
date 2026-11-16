# 2026-11-16 — D1 source manifest and clean-base decision

## Immutable repository state
- Repository: `VlDMlNSh/developer-cloud-pool`.
- Default branch: `Основной`.
- Default HEAD: `e38f87099e0edd1bb918c9b9f2b8ad3422b9d32b`.
- Active ruleset: `26550182`, targets `refs/heads/Основной`; requires PR, thread resolution, blocks deletion/non-fast-forward, but requires **zero approvals**. No bypass actors.
- Default workflows: `dsh-runtime-evaluation.yml`, `pool-contract-validation.yml`, `pool-supervisor.yml`, `pool-worker.yml`, `runner-resource-probe.yml`. No `.github/workflows/gemini-batch-dispatch-controller.yml` on default (404); approved Gemini controller therefore unavailable in this repository snapshot.
- The previously updated Context Window was stale on current default lineage: it said PR #87→#92→#93→#101 could be selectively transplanted from a current-default base. Exact PR metadata disproves that characterization.

## Exact PR lineage — verified current metadata
| PR | Head SHA | Base SHA / ref | Changed files | Exact-head PR workflow runs |
|---|---|---|---:|---|
| #87 | `8cc7b12948865bb0e13ce099386c09f3ae32b4f5` | `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc` / `Основной` | 45 | #43712647615 and #43712647597 SUCCESS |
| #92 | `7014961587759b27d2ef6e91c60ce098d077ae83` | #87 head / `integration/d1-ledger-clean-main-2026-11-15` | 2 | #43718679251 and #43718679258 SUCCESS |
| #93 | `e200838d038b9cd48635233187819302bba6a33e` | #92 head / `fix/a0-admission-exact-replay-receipt-integrity-2026-11-15` | 3 | #43736264768 SUCCESS |
| #101 | `ae9cf5d4fd76134136b9af8b5498e90a65509722` | #93 head / `fix/verified-registry-capability-clean-stack-2026-11-15` | 1 | #43764995448 SUCCESS |

All four PRs remain OPEN / DRAFT / UNMERGED. #87 is based on `9dbb...`, not current default `e38f...`; #92–#101 are a stacked chain. The green runs above are local Workers-runtime D1 proof only, not hosted service qualification.

## Candidate manifest (reference source, not a merge plan)
### Layer A — PR #87 base proof package (45 changed paths)
- Workflow: `.github/workflows/d1-ledger-proof-validation.yml`.
- Package: `proofs/d1-ledger/package.json`, `package-lock.json`, `vitest.config.ts`, `vitest.upgrade-smoke.config.ts`, `wrangler.jsonc`, `README.md`.
- Migrations: `migrations/0001_create_pool_approval_ledger.sql` through `0010_projection_comment_at_most_once.sql`, then `0011_atomic_qualified_admission.sql`, `0012_durable_route_registry_snapshots.sql`, `0013_persist_verified_route_registry.sql`, `0014_atomic_admission_registry_assertion.sql`.
- Source modules: `src/a0-admission-contract.mjs`, `admit-qualified-task.mjs`, `claim-outbox.mjs`, `consume.mjs`, `projection-delivery.mjs`, `projection-envelope.mjs`, `projection-outbox.mjs`, `projection-reconciler.mjs`, `qualified-route-evidence.mjs`, `task-attempts.mjs`, `task-lease.mjs`, `trusted-route-registry.mjs`, `worker.mjs`.
- Tests: `test/a0-admission-contract.test.ts`, `apply-migrations.ts`, `atomic-admission.test.ts`, `claim-outbox.test.ts`, `consume.test.ts`, `d1-upgrade-binding.smoke.ts`, `d1-upgrade-fixture.smoke.ts`, `durable-route-registry-ledger.test.ts`, `projection-delivery.test.ts`, `projection-envelope.test.ts`, `projection-reconciler.test.ts`, `qualified-route-evidence.test.ts`, `trusted-route-registry-persistence.test.ts`, `trusted-route-registry.test.ts`.
- Fixture: `fixtures/schema-0010-v1-golden.json`.

### Layer B — PR #92 delta (2 paths)
- `proofs/d1-ledger/src/admit-qualified-task.mjs`
- `proofs/d1-ledger/test/atomic-admission.test.ts`
- Purpose: exact replay receipt integrity.

### Layer C — PR #93 delta (3 paths)
- `.github/workflows/d1-ledger-proof-validation.yml`
- `proofs/d1-ledger/src/trusted-route-registry.mjs`
- `proofs/d1-ledger/test/trusted-route-registry-persistence.test.ts`
- Purpose: verifier-issued registry persistence capability.

### Layer D — PR #101 delta (1 path)
- `proofs/d1-ledger/test/atomic-admission.test.ts`
- Purpose: reject exact replay after active registry advancement.

## Exclusions / safety boundaries
- Do not transplant PR #97/#98 /next admission code as part of this D1 package; it is a separate event-controller/owner-admission workstream.
- Do not transplant #102–#106 browser worker/controller work into the D1 ledger integration.
- Keep `proofs/d1-ledger/src/worker.mjs` inert (HTTP 404) and Wrangler D1 ID placeholder; no hosted endpoint or account resources.
- No changes to Supervisor/Worker workflows, GitHub permissions, secrets, repository variables, D1 resources, deployment or dispatch.
- No claim that the current default Supervisor is wired to D1. No claim that the PR chain has been rebased onto current default.

## Required clean-base procedure
1. Create a fresh integration branch from exact current default `e38f87099e0edd1bb918c9b9f2b8ad3422b9d32b` only after this manifest review.
2. Apply PR #87's file-level changes selectively; do not merge its branch ancestry. Review each workflow, package, migration, module and test diff against current default.
3. Apply #92, #93 and #101 only as path-level deltas, preserving their order. Check for duplicate/mutated files and migration order 0001–0014.
4. Run package checks on pinned Node 24.9.0: `npm run check`, `npm test`, `npm run test:upgrade-binding`, `npm run test:upgrade-fixture`; validate migration upgrade from schema 0010 golden fixture.
5. Verify exact source SHA in runner, immutable lockfile, Workers runtime isolation, zero provider credentials, zero model calls, no network dispatch, inert worker, and no D1 binding.
6. Require exact-head CI for the new integration branch and independent source/security review. This only qualifies a local proof package, not hosted D1.
7. Hosted qualification remains separate and blocked by current Free entitlement/quota NOT VERIFIED and explicit authorization for named isolated test resources NOT GIVEN.

## Status
- Local proof lineage: VERIFIED at historical PR heads; **not current-default integrated**.
- Clean-base transplant: PLANNED / NOT RUN.
- Hosted D1 and authenticated claim API: NOT RUN / NOT IMPLEMENTED.
- Gemini Agent 1/2/3: NOT RUN; no approved controller workflow exists on default.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.
- No secrets read, no provider/model calls, no hosted resource creation, no dispatch, no deployment, no merge.

## Next step
Perform the bounded clean-base transplant only after comparing the complete file-level diff against current default; keep it in an isolated Draft PR with all runtime paths inert. Do not change Supervisor or enable dispatch in that pass.

Canonical MediaHub map (reference only): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
