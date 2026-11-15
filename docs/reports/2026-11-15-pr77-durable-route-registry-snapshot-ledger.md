# PR #77 — Durable D1 Route Registry Snapshot Ledger

Date: 2026-11-15
Status: IMPLEMENTED / EXACT-HEAD CI VERIFIED / NOT QUALIFIED / NOT MERGED

## Immutable target and ancestry

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch `Основной` observed HEAD: `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc` (unchanged during this pass).
- Parent stack PR #76: `proof/root-signed-route-registry-bundle-2026-11-15` @ `096737ec5e1a335b367fc7af67c29f7b71541e66`.
- New branch: `impl/durable-route-registry-d1-2026-11-15`.
- PR #77 head: `e63f1dda4c046d485ae9c2f08392a1943a06553d`.
- PR #77 targets PR #76 branch, not default; compare API confirms 1 commit ahead / 0 behind, merge base exactly PR #76 HEAD.
- PR #77 remains OPEN / DRAFT / UNMERGED. Formal review submissions: 0.

## Implemented changes

1. `proofs/d1-ledger/migrations/0012_durable_route_registry_snapshots.sql`
   - Adds append-only `pool_route_registry_snapshots`.
   - Adds singleton `pool_route_registry_state` with composite FK to the exact snapshot epoch/digest.
   - Triggers reject snapshot update/delete, epoch regression on insertion, invalid/non-monotonic pointer changes, unbound initialization, and state deletion/reset.
2. `proofs/d1-ledger/test/durable-route-registry-ledger.test.ts`
   - Workers-runtime test covers initial pointer binding, immutable snapshot, stale epoch insertion, forward pointer movement, rollback attempt, pointer reset denial, and digest mismatch.
3. `.github/workflows/d1-ledger-proof-validation.yml`
   - Adds implementation branch to push triggers and PR #76 branch to PR target filters, so this stacked implementation receives the D1 proof workflow.

Blob SHAs:
- Migration: `10934e566aafdfd4f38aee433d8c7110dece26f0`
- Test: `89f96abda56dd661835eae3f328bb14a52dd874c`
- Workflow: `40d372003d1ad35d191762bd0c4ce6ed94d33b59`

## Exact-head CI evidence

- Workflow run `43707407472`: COMPLETED / SUCCESS, exact head `e63f1dda4c046d485ae9c2f08392a1943a06553d`.
- Job `132791362558`: COMPLETED / SUCCESS.
- Successful steps: dependency install, `npm run check`, Workers-runtime D1 tests, isolated second-D1 upgrade-binding smoke, frozen schema-0010 fixture smoke, lockfile artifact upload.
- Artifact ID `14158932085`, name `d1-ledger-proof-package-lock`, SHA-256 `2b8220e83c453ec62bf8ec0fa0547101b5f7ebb8d0bab213ede2e81d66f5923f`, 18,253 bytes.
- PR #77 combined commit status contexts: zero; formal reviews zero. Exact workflow success does not establish required branch status checks or review acceptance.

## Governance snapshot

- Default branch API reports `protected=false`.
- Active repository ruleset ID `26550182`, name `Основной — verified`, applies to `refs/heads/Основной`, enforcement active. Rules require PR, review-thread resolution, no deletion/non-fast-forward; required approval count 0; no required status-check rule configured. Therefore branch governance is partially verified, but required CI enforcement is NOT configured/NOT VERIFIED.
- PR #76 remains OPEN/DRAFT/UNMERGED with exact-head run `43697493628` SUCCESS (job `132761164474`, 114 tests per prior run evidence), formal reviews 0 and combined status contexts 0.
- PR #72 and #75 remain OPEN/DRAFT/UNMERGED in the admission/evidence stack.

## Explicit limitations

This is the persistence schema primitive only. It does not yet:
- accept only a typed, unforgeable result from `verifyTrustedRouteRegistryBundle`;
- persist issuer-key rows or route rows as a complete accepted snapshot;
- extend `pool_route_qualifications`, admission identity, outbox binding or receipt with registry epoch, bundle digest and issuer key ID;
- perform the registry insert + watermark CAS + qualification writes as one atomic batch;
- bind the same current watermark inside the A0→D1 admission transaction.

Therefore durable registry acceptance and production route qualification remain NOT QUALIFIED. The current database triggers are guardrails, not a complete CAS adapter. No hosted D1, Worker deployment, dispatch, provider calls, secret reads, or independent audit occurred. Independent audit remains deferred until the pool is operational. Contour B remains DEFERRED.

## Next bounded step

Implement the typed registry persistence adapter on top of migration 0012, including atomic snapshot insert + monotonic watermark advance and tests for failed batch rollback/concurrent writer conflicts. Then add issuer-key snapshot storage and bind registry epoch/digest/key ID in route qualification, admission and immutable receipt. Keep dispatch false.

## Links

- PR #77: https://github.com/VlDMlNSh/developer-cloud-pool/pull/77
- Exact-head workflow: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43707407472
- PR #76: https://github.com/VlDMlNSh/developer-cloud-pool/pull/76
- Design contract: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/next-2026-11-15-route-registry-revalidation/docs/contracts/DURABLE-QUALIFIED-ROUTE-REGISTRY-D1-V1.md
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
