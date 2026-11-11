# PR #58/#59 code and migration compatibility audit — 2026-11-11

## Immutable inputs
- `Основной` HEAD at audit: `dd1303879d1e8d4f89f83c18c5671b3712656e28`.
- PR #58 HEAD `5caeb60f7a45d836c6ad1eea2fb86e20995da025`.
- PR #59 HEAD `22200226da4f1af30645cf441a639db6893e9310`.
- PR #58 mapper blob `cb1fb8b130c66343ca3b1c071aac506113c4cfb0`; reconciler blob `2f83befc145d39ea60f06fe5b9e9033f89df40c0`.
- PR #59 outbox blob `1546c2e4172e3767ed8bd5642c7b9c6d95716d11`; migration 0006 blob `660fa9de99ed78fe083bb627d6a61dbf0bd65c25`; migration 0007 blob `767d95a30fa0a14c79e88c8c58392bfec9cdddc2`; migration 0008 blob `1d9385dd371f3404c52ec15ec03b0a14d384ab1`; package blob `26b52ef60613366eaca02191b2d28901415cea5a`.

## Compatibility findings
1. The mapper/reconciler are additive files from PR #58; PR #59 modifies the shared outbox module, migration chain, tests and workflow. A minimum integration can be made without flattening all branch history, but no combined commit exists or has CI evidence.
2. **Package script regression risk:** PR #59 package.json's `check` includes `projection-reconciler.mjs` but omits `projection-envelope.mjs`; PR #58 package script includes both. Any integration must preserve both syntax checks. Do not overwrite #58 package script with #59 version.
3. Migration 0007 replaces the status-event trigger introduced in 0006 and adds retry/dead-letter columns. Its event IDs remain distinct from the lease-event trigger's `delivery-leased:...` IDs for normal status transitions. Migration order must remain 0006 → 0007 → 0008.
4. **Orphaned fifth lease:** acquireProjectionDelivery refuses acquisition at delivery_attempts >= 5. If the fifth lease expires, only deadLetterExpiredProjection can transition it, but that API requires the original workerId and generation. There is no independent reaper; an expired fifth lease can remain leased indefinitely if the original worker cannot return.
5. **Acknowledgement trust gap:** acknowledgeProjectionDelivered accepts the lease tuple and caller-provided `now`, but has no persisted proof/argument binding `projection_verified=true`. Contract says caller must acknowledge only after verified projection; implementation does not enforce that precondition at the storage boundary.
6. Worker ID and time are caller inputs; they are not authenticated identity or trusted time. Local SQL fencing is not an issuer/capability boundary.
7. Workflow branch filters overlap across PRs and need deliberate union when integrating. Keep #58 and #59 branches in the relevant push/PR filters; avoid replacing one branch list with the other.
8. The bootstrap instruction was read from MediaHub OS canonical documentation branch `docs/mediahub-chat-tree-map-20261012`, not from developer-cloud-pool. It reiterates map-first/context-first governance and Baseline 2.0 authority. Canonical map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md

## Decision
No branch mutation in this pass. Do not cherry-pick or create an integration branch until a reviewed integration plan includes the package script union, ordered migrations, workflow filter union, orphaned fifth-lease behavior, and verified-ack storage contract. No dispatch, hosted resources, credentials, live GitHub calls, merge or deployment.

## Status
- Source compatibility review: VERIFIED for the enumerated static findings.
- Unified runtime integration: NOT RUN / NOT VERIFIED.
- Exact-head CI for unified candidate: NOT RUN.
- Independent review: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

## Next bounded step
Design and implement a strictly local-only integration candidate on a new branch from immutable PR #58 HEAD, preserving PR #58 mapper/reconciler and syntax checks, applying PR #59 migrations/outbox changes with explicit safeguards. Add regression tests for expired fifth lease and acknowledgement without verified projection; then run complete local D1 suite and exact-head CI. Do not deploy or dispatch.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
