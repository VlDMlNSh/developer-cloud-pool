# Registry epoch-order hardening and verifier capability boundary

Date: 2026-11-15
Status: PR #78 EXACT-HEAD PR-CI VERIFIED / PR #80 EXACT-HEAD CI VERIFIED / D1 ACCEPTANCE ADAPTER NOT IMPLEMENTED / CONTOUR A NOT ACCEPTED

## 1. Immutable refs

- Default branch `Основной`: `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc` (unchanged).
- Documentation branch before this update: `docs/next-2026-11-15-route-registry-revalidation` @ `af32bd1f858b0326bd104ef6ce6c219b12a3d900`.
- PR #78: OPEN / DRAFT / UNMERGED; head `54250f9c39111dd7cfeb7928fc3fd56169353a95`, base #77 `e63f1dda4c046d485ae9c2f08392a1943a06553d`, 3 ahead / 0 behind.
- PR #80: OPEN / DRAFT / UNMERGED; head `4dc81a377004502e8cae35583a734be5cc74cce6`, base #78 `54250f9c39111dd7cfeb7928fc3fd56169353a95`, 2 ahead / 0 behind.
- Stack #72 → #75 → #76 → #77 → #78 → #80. No merge performed.

## 2. PR #78 — prevent out-of-order snapshot history

The old migration trigger compared new snapshot epoch only to the active singleton pointer. This permitted an out-of-order snapshot when a higher epoch had already been persisted but pointer advancement lagged. Migration 0012 now compares the candidate epoch to `MAX(registry_epoch)` across all stored snapshots. The Workers-runtime test inserts epoch 1003 while pointer remains at 1001 and proves epoch 1002 is rejected.

Blobs:
- Migration: `485d8c2d2327a64c8d86ddc004134113d6ae3d80`
- Test: `9bae1d2e621c9792dbdb3374459f44106b1edadd`
- Workflow: `772702d98c665c145237a5fe2b5a57c0770a4264`

PR event run [43708444649](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43708444649) / job `132794554442`: SUCCESS. Separate push run [43708418101](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43708418101) failed on a pre-existing flaky signature-negative test; the failure is investigated and corrected in PR #80 below.

## 3. PR #80 — verifier-issued capability boundary

Added module-private WeakMap in `trusted-route-registry.mjs`. A successful verifier result object is bound to a deep-frozen JSON snapshot of the exact bundle that was checked. `getVerifiedTrustedRouteRegistryBundle(result)` returns the snapshot only for the original verifier-issued object. A caller-forged `verified:true`, copied result object or denied result receives null. The test also mutates the original input after verification and proves the authorized snapshot remains unchanged.

Blobs:
- Verifier source: `e5e667d79d9d7d4dc47b8aa1e5d6cb9c91e5e84d`
- Capability tests: `9f7eed1c0a6212877a37336889119835ea08dc7d`
- Deterministic signature-negative test: `9711ab2a4b8b2d9c536757f3e4813581e23139d6`
- Workflow: `1107402ade211b310108e9e58d6bc078c5610964`

## 4. CI flake and deterministic correction

The old negative test changed the final Base64URL character. Sometimes that changes unused trailing bits and causes a non-canonical encoding; verifier correctly returned `SIGNATURE_ENCODING_INVALID`, while test expected cryptographic failure `ISSUER_SIGNATURE_INVALID`. This caused PR #78 push run `43708418101` and initial PR #80 PR run `43708647446` to fail. The test now decodes the signature, flips one actual byte, and re-encodes canonical Base64URL. This preserves valid encoding and guarantees the verifier reaches cryptographic verification.

Final PR #80 exact-head PR run [43708731241](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43708731241) / job `132795442992`: SUCCESS. Exact-head push run [43708726255](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43708726255): SUCCESS. Both at `4dc81a377004502e8cae35583a734be5cc74cce6`.

Evidence:
- 10 test files / 116 tests passed.
- D1 upgrade-binding smoke passed.
- Frozen schema-0010 fixture passed; golden SHA-256 `afbf1445c6d2fa0b51cdbd0da932d158aa2850832ca8297f83b103c00d8b2187`, canonical bytes 16160.
- Artifact ID `14159089149`, 18,253 bytes, SHA-256 `4977c83201c93bf05fe932531cc123f6c5424e14dea4d39775945a677736584c`.

## 5. Remaining gaps and status

The WeakMap capability is process-local. It does not persist the snapshot or provide cross-process authenticity. No typed D1 adapter, issuer/route row persistence, atomic snapshot + watermark CAS, CAS-miss rollback assertion, qualification/admission/receipt epoch/digest/key-ID binding or same-transaction watermark check exists yet. PR #78 and #80 have zero formal reviews and zero review threads. Ruleset #26550182 still requires zero approvals and no required status checks. Default branch reports `protected=false`.

No hosted D1, secrets, provider calls, deployment, dispatch or independent audit. `dispatch:false` remains. Contour B remains deferred. Contour A is NOT ACCEPTED.

## 6. Next step

Implement a D1 persistence adapter that consumes only `getVerifiedTrustedRouteRegistryBundle(result)`. In one D1 batch, persist snapshot + issuer-key + route rows and advance the watermark. The expected-previous-epoch assertion must be database-enforced so a CAS miss aborts the entire batch and leaves no orphan rows. Test initial install, monotonic advance, stale writer, competing writers, failed CAS rollback, digest substitution, replay and storage outage. Then bind registry epoch/digest/root key/issuer key into A0/D1 admission and immutable receipt.

## Links

- PR #78: https://github.com/VlDMlNSh/developer-cloud-pool/pull/78
- PR #80: https://github.com/VlDMlNSh/developer-cloud-pool/pull/80
- PR #80 exact-head PR CI: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43708731241
- Updated Context Window: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/next-2026-11-15-route-registry-revalidation/docs/context/GITHUB-CONTEXT-WINDOW.md
- Updated checkpoint: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/next-2026-11-15-route-registry-revalidation/docs/checkpoints/2026-11-15-a0-admission-route-qualification.md
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
