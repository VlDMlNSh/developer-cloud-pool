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


## Current ancestry and integration boundary recheck — 2026-11-15

- Re-read default branch API: `Основной@9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`.
- Compare current default to PR #67 head `a53f6232bd5b50d3e150addf528b8e722002f9dd`: DIVERGED, 47 ahead / 64 behind; merge base `221f216c00ca7e5596bcc682ba185ad155a10603`.
- Compare current default to PR #72 head `a391f5c9b08c7ccfc12d966bf8e085c1966bfb31`: DIVERGED, 67 ahead / 64 behind; same merge base.
- Compare current default to PR #77 head `e63f1dda4c046d485ae9c2f08392a1943a06553d`: DIVERGED, 90 ahead / 64 behind; same merge base.
- Compare current default to PR #78 head `54250f9c39111dd7cfeb7928fc3fd56169353a95`: DIVERGED, 93 ahead / 64 behind; same merge base.
- Therefore PRs #67/#72/#75/#76/#77/#78 are a draft proof stack on a stale base, not a candidate for merge or production integration. Reconstruct a minimal integration branch from current default only after reviewing and selectively transplanting the source files/migrations, preserving provenance; do not merge the divergent history or retarget the stacked PRs blindly.
- PR #78 exact-head D1 workflow run `43708444649` is COMPLETED / SUCCESS. Its combined commit-status endpoint is empty; required status contexts remain NOT VERIFIED. PR #78 has no formal reviews or inline threads.
- PR #79 documentation branch is 3 commits ahead / 0 behind current default, merge base equals current default. PR #79 is OPEN / DRAFT / UNMERGED; documentation-only validation was not returned by exact-head Actions lookup (CI NOT VERIFIED).
- Ruleset #26550182 is active only for `refs/heads/Основной`, with PR and thread-resolution requirements, 0 required approvals, no required status contexts, and no bypass actors. It does not supply independent approval for these draft proof branches.
- The current integration gap is now more specific: local atomic admission and cryptographic verification components exist as separately tested draft layers, but their trusted registry persistence and same-batch A0 admission composition are not wired together; Supervisor/Worker and Experience API are also not connected to this proof.


## Vertical-slice integration gap map — 2026-11-15

| Boundary | Existing evidence | Actual status / missing connection |
|---|---|---|
| Graphite Web Console | PR #6 static dashboard; PR #25 Hono prototype | UI prototype only; no deployed authenticated service or live task/evidence API |
| OAuth / Session | PR #30 synthetic oauth4webapi proof; PR #61 local D1 session proof | No live GitHub OAuth, owner numeric-ID enforcement, production cookie/session or durable deployed auth |
| Experience API | PR #24 API/hosting contract | Contract/design; protected reads remain fail-closed; no live Pool Bridge |
| Pool Bridge / Task Envelope | Existing task/approval/attempt contracts and PR #67 D1 local ledger | No single production API converts authorized user intent into an admitted task |
| Supervisor | Default heartbeat-only workflow; PR #37 reusable Worker boundary draft | No transactional dispatch qualification; do not enable dispatch |
| Worker | DSH headless probe profile | No qualified real execution; DSH probe not run |
| Evidence Store | D1 attempts, outbox, projection receipts in PR #67 stack | Local proof only; no live Worker result → durable evidence → web read-model path |
| Route / quota | PR #74 pure quota ledger tests; PR #75/#76 cryptographic verifier; PR #77/#78 durable snapshot ledger | Separate draft components; no authenticated account/quota source and no same-batch A0 registry/revocation re-check |

- Issue #22 (web console), #26 (provider routing/quota), #38 (durable claims) and #70 (fail-closed route admission) remain OPEN.
- Issue #70's remaining point is not solved merely by adding cryptographic bundle verification: PR #75 accepts explicit trusted snapshots; PR #76 verifies a root-signed bundle using a platform-bound public key; PR #77 persists snapshot metadata; PR #78 enforces epoch ordering. None yet composes trusted registry loading, route/account/quota identity, revocation watermark, approval consumption and task/attempt/outbox receipt in one atomic admission operation.
- PR #74 exact head `ebcdaeb3421889be0b710a4b6b6e83deeafa0144` has Pool Contract Validation run `43692828719` SUCCESS (13 pure quota-ledger tests); it remains draft/unmerged and does not authenticate provider evidence or live quota.
- The web path remains separate from the D1 proof: PR #25 prototype + PR #30 synthetic OAuth + PR #61 local session proof are not mounted to the A0 admission or live task ledger.
- No end-to-end vertical slice has been demonstrated. The next integration task is the atomic trusted registry + admission composition, followed by a no-provider-call local integration adapter that returns only evidence/queue state with `dispatch:false`; then connect read-only Experience API only after auth/session gates are qualified.
