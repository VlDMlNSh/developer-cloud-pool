# Pass 57 — D1 legacy claim-path SQL bypass audit and remediation

Date: 2026-11-23
Status: **VERIFIED — local D1 schema remediation and exact merge-result CI; full Contour A qualification remains incomplete**

## 1. Frozen scope
- Repository: `VlDMlNSh/developer-cloud-pool`.
- Default branch: `Основной`.
- Frozen default SHA: `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9` (also rechecked through the default-branch commits endpoint).
- Source PR #170 prior head: `fbc0a3aff36a8908ec05a661519069a07abd3c38`.
- Final PR #170 head: `35a3ea7e168aaeb91f63c5616e498b4d0f21b537`.
- Base SHA: `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`.
- Synthetic merge SHA: `0e06e8179ca0fbdef53d3b7c9c7dc9bbe2720c50`.
- PR #170: https://github.com/VlDMlNSh/developer-cloud-pool/pull/170.
- Scope: audit the D1 proof for legacy direct-SQL bypasses and close one confirmed retired-queue write path with a forward-only migration.
- Non-goals: no controller dispatch, no hosted D1, no secrets/variables inspection, no provider calls, no deployment, no merge, no production mutation.

## 2. Source audit findings

### Confirmed gap — retired per-approval tables remained writable
- Migrations 0002/0003 created historical `pool_task_claims` and `pool_task_outbox` tables.
- Migration 0003 moved the canonical task path to `pool_tasks` and `pool_task_delivery_outbox`; migration 0011 removed the legacy approval-keyed claim/outbox trigger.
- The old tables remained in the schema, but there were no database triggers preventing direct INSERT/UPDATE/DELETE. The proof README itself explicitly called the full legacy-table write-denial migration outstanding.
- This was a real direct-SQL alternate write surface, even though no current worker or adapter consumes those legacy tables.

### Other trust-boundary limits confirmed
- `admitQualifiedTask` expects a pre-existing route qualification row and checks exact identity/freshness/revocation bindings. The row's provenance must come from a separately trusted authority; the local proof does not implement that authority.
- `acquireAttemptLease` requires injected `authenticateExecutor`; no production executor identity provider is wired.
- `recordAttemptReconciliation` requires injected `verifyEvidence` and `trustedClock`; tests use a synthetic verifier. No production OIDC/JWKS verifier or issuer registry is wired.
- `worker.mjs` remains deliberately inert (404); no HTTP ingress, task consumer, executor launch, UI, routing or quota enforcement is implemented by this proof.
- These are explicit qualification boundaries, not defects silently treated as completed functionality.

## 3. Remediation
- Added forward-only migration `proofs/d1-ledger/migrations/0016_disable_legacy_claim_write_path.sql`.
- Adds six database guards: BEFORE INSERT, UPDATE and DELETE on each of `pool_task_claims` and `pool_task_outbox`, all failing with `LEGACY_CLAIM_PATH_DISABLED`.
- Historical tables, rows, IDs and migrations 0001–0015 are preserved. No table drop, rename, backfill, migration rewrite, parallel ledger or new dependency.
- Canonical task admission/delivery remains exclusively in `pool_tasks` and `pool_task_delivery_outbox`.
- README updated to document migration 0016 and the sealed legacy path.
- Baseline test verifies the exact six-guard inventory and exercises denied INSERT, UPDATE and DELETE against both tables. Test fixtures temporarily drop/restore only the necessary guards during synthetic cleanup.
- Staged upgrade test still creates schema 0010, seeds historical synthetic rows, then applies migrations 0011–0016. This preserves the historical upgrade boundary.

## 4. Reuse First
- REUSE: existing official Cloudflare Workers Vitest integration (`@cloudflare/vitest-plugin@1.4.7`), Vitest 4.1.12, and local Miniflare/workerd D1 runtime.
- ADAPT: add one additive SQL migration and extend existing tests/docs; no new framework or dependency.
- BUILD: no runtime controller or executor built in this pass.

## 5. Exact merge-result CI
Final PR merge result: `0e06e8179ca0fbdef53d3b7c9c7dc9bbe2720c50`.

### D1 Ledger Proof
- Run: [45260394194](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45260394194) — SUCCESS.
- Job: `Clean-base Workers-runtime D1 migration tests`.
- Clean install: `npm ci --ignore-scripts --no-audit --no-fund` — SUCCESS; 159 packages.
- `npm run check` — SUCCESS.
- `npm test` — SUCCESS.
- Test files: 6 passed.
- Tests: **75 passed, 0 failed**.
- Vitest-reported duration: 3.16s.
- Migration upgrade suite: 7 tests passed; lease/fencing 17; reconciliation 9; task identity 11; migration baseline 7; atomic admission 24.

### Pool Contract Validation
- Run: [45260394177](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45260394177) — SUCCESS.
- Dispatch gate: `POOL_DISPATCH_ENABLED=false`.
- All six workflow YAML files parsed successfully.
- Contract checks passed: no workflow-input shell interpolation; all external Actions pinned to full commit SHAs; legacy worker inert; Supervisor read-only; manual probes secret-free.
- Final marker: `POOL_CONTRACT_VALIDATION=PASS`.

Both workflow logs explicitly checked out PR #170's synthetic merge revision `0e06e8179ca0fbdef53d3b7c9c7dc9bbe2720c50`.

Non-blocking warning: checkout/setup-node action revisions emit a Node.js 20 deprecation notice while running under Node.js 24. No action pins were changed in this pass.

## 6. PR and governance state
- PR #170: OPEN / DRAFT / UNMERGED; head `35a3ea7e168aaeb91f63c5616e498b4d0f21b537`; base `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`.
- Compare: 10 commits ahead / 0 behind; 34 files; +7,074 / -0.
- GitHub mergeable: true at final metadata read.
- Formal reviews: 0; review threads: 0. Source audit by this pass is not an independent GitHub review.
- Active ruleset `26550182` (`Основной — verified`): PR required, deletion and non-fast-forward prohibited, unresolved review threads prohibited, required approving review count 0, no bypass actors.
- No merge performed. PR remains draft.
- PR #168 remains the historical source lineage; do not merge both #168 and #170.

## 7. Safety boundary and qualification
- All adapters still return `dispatch:false` and `executionAuthorized:false`.
- Worker entrypoint remains inert.
- Tests use synthetic local D1 only.
- No dispatch, secrets/metadata inspection, provider calls, hosted D1, deployment, merge or production mutation.
- Real issue_comment event authenticity, owner/repository/comment binding, trusted runtime clock, production executor authentication, cryptographic evidence verification, hosted D1 behavior, quota isolation, UI, routing and live worker execution remain NOT VERIFIED.

## 8. Metrics and disposition
- Added migration: 1 (0016).
- Added database guards: 6.
- Legacy SQL write operations blocked in tests: INSERT/UPDATE/DELETE × 2 tables.
- Test suite: 75/75 PASS.
- Pool Contract: PASS.
- Exact synthetic merge SHA: `0e06e8179ca0fbdef53d3b7c9c7dc9bbe2720c50`.
- Vitest duration: 3.16s.
- Formal PR reviews: 0.
- Active engineering time: NOT MEASURED; no estimate inferred from commit timestamps.
- New CI defects: none observed.
- Remaining critical path: independent review of canonical D1 PR → implement non-dispatching Cloud Pool owner-only issue_comment admission controller using the verified event context and durable D1 chain → wire trusted clock/authenticator/verifier → qualify hosted D1, executor, UI, routing and quotas → independent Contour A acceptance.

**Pass 57: VERIFIED — legacy direct-SQL claim-path gap closed in the local proof and exact merge-result CI passed. PR #170 remains DRAFT. Contour A NOT ACCEPTED. Contour B DEFERRED.**

## 9. Next bounded task — Pass 58
Audit and reconcile the existing owner-only `/next` event-envelope proof from historical PR #112 and composition candidate #125 against the current default. Compare exact owner/repository/issue/comment/event/ref/SHA binding, replay identity and trusted workflow context with Issue #96 and #140. Reuse the strongest existing validator rather than creating a parallel predicate. Keep the controller non-dispatching; do not inspect secrets, invoke providers, deploy, merge or authorize execution.

References: [PR #170](https://github.com/VlDMlNSh/developer-cloud-pool/pull/170) · [PR #168](https://github.com/VlDMlNSh/developer-cloud-pool/pull/168) · [Issue #140](https://github.com/VlDMlNSh/developer-cloud-pool/issues/140) · [Issue #96](https://github.com/VlDMlNSh/developer-cloud-pool/issues/96) · [Pass 56 report](2026-11-23-pass56-current-base-d1-proof-reconciliation.md) · [MediaHub canonical map](https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md)