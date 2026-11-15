# Cloud Development Pool — durable route registry epoch-order hardening

**Date:** 2026-11-15  
**Default target:** `Основной@9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`  
**Implementation parent:** PR #77 head `e63f1dda4c046d485ae9c2f08392a1943a06553d`  
**Hardening PR:** #78, branch `fix/route-registry-epoch-order-2026-11-15`, head `54250f9c39111dd7cfeb7928fc3fd56169353a95`

## Scope and finding

Reviewed the current A0→D1 / Qualified Route Evidence stack and the durable route-registry snapshot migration introduced by PR #77.

The original `pool_route_registry_snapshot_epoch_monotonic` trigger compared a new epoch only against the active singleton pointer. This did not enforce monotonicity of the append-only snapshot history itself: with active epoch 1001, a future epoch 1003 could be inserted, followed by an unseen lower epoch 1002 while the pointer remained at 1001.

## Change

PR #78 changes the trigger to compare `NEW.registry_epoch` with `MAX(registry_epoch)` across all persisted snapshots. It adds an adversarial Workers-runtime regression: insert epoch 1003 while the active pointer is 1001, then assert epoch 1002 is rejected. The existing D1 workflow now includes the hardening branch in push and pull-request base filters.

Changed file blobs at PR #78 head:
- Migration 0012: `485d8c2d2327a64c8d86ddc004134113d6ae3d80`.
- Registry ledger regression: `9bae1d2e621c9792dbdb3374459f44106b1edadd`.
- D1 proof workflow: `772702d98c665c145237a5fe2b5a57c0770a4264`.

## Verification

- PR #77 exact head `e63f1dda4c046d485ae9c2f08392a1943a06553d`: Isolated D1 Ledger Proof run [43707424040](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43707424040) COMPLETED / SUCCESS; job `132791415186`; syntax, Workers-runtime D1 suite, isolated second binding/migration smoke, frozen schema-0010 fixture smoke and artifact upload completed.
- PR #78 exact head `54250f9c39111dd7cfeb7928fc3fd56169353a95`: run [43708444649](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43708444649) COMPLETED / SUCCESS; job `132794554442`; all listed steps completed successfully, including the new adversarial D1 suite and both migration/fixture smokes.
- Artifact from PR #78 run: `d1-ledger-proof-package-lock`, ID `14158817485`, SHA-256 `261a1eff4d93d58598d1b4495bf2f0e9b1632b71b4c9e03fa33b4b9b249f6e5f`.
- Combined commit-status contexts for PR #78: zero. Required status contexts remain NOT VERIFIED.
- PR #78 has zero formal reviews and zero inline review threads. It remains OPEN / DRAFT / UNMERGED.

## Architecture and qualification limits

- PR #72 atomic A0→D1 admission remains a local proof on PR #67's stack, exact head `a391f5c9b08c7ccfc12d966bf8e085c1966bfb31`; its exact-head D1 run `43690143805` passed 93 tests including nine atomic-admission cases.
- PR #75 Qualified Route Evidence verifier remains an isolated cryptographic verifier with caller-supplied trust snapshots; exact-head run `43694628561` passed 103 tests.
- PR #76 root-signed registry bundle verifier remains an isolated proof; exact-head run `43697493628` passed 114 tests.
- PR #77 durable registry migration/test proof exact-head run `43707424040` passed. It persists immutable snapshots and a singleton watermark, but does not yet wire root-verifier output into persistence or admission.
- PR #78 hardens epoch ordering only. It does not implement root custody/rotation, issuer-key records, revocation writer, atomic registry/revocation watermark re-check inside A0 admission, or production trust.
- All these PRs are draft/stacked and must not be treated as a merged integration. Local Workers-runtime tests are not hosted D1 qualification.
- Supervisor/Worker, Hono Experience API, production OAuth/session and Evidence Store remain unintegrated with this D1 proof stack. GitHub-hosted runners remain ephemeral.
- Repository ruleset #26550182 is active on `refs/heads/Основной`, requires PR and review-thread resolution, but has zero required approvals and no required status contexts. No bypass actors. It does not protect the stacked feature branches.
- `POOL_DISPATCH_ENABLED=false` is historically owner-read-back and remains the documented fail-closed gate; no secret values were read. No provider calls, dispatch, hosted D1 provisioning, deployment or executor execution occurred.

## Current status

- Registry snapshot epoch ordering: IMPLEMENTED on draft PR #78; exact-head workflow SUCCESS.
- A0→D1 local atomic admission: VERIFIED as isolated proof, not production-integrated.
- Qualified Route Evidence: verifier components implemented, trusted registry/admission composition NOT QUALIFIED.
- Supervisor/Worker integration: NOT VERIFIED.
- Web Console/OAuth production integration: NOT VERIFIED.
- Quota ledger: fail-closed pure local policy tests exist, not connected to live provider/account evidence.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next concrete step

Implement the single atomic A0 admission composition that reads the current durable registry pointer, verifies the selected route/issuer/revocation versions against the root-signed snapshot, consumes the single-use approval, binds task/attempt/outbox/evidence digest and writes the receipt in one D1 batch. Add stale epoch, issuer-key substitution, revocation race, rollback, duplicate admission and unavailable-store tests. Keep every successful result `dispatch:false`; do not provision hosted D1 or enable dispatch.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
