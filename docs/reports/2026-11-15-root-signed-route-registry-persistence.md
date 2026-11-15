# Root-signed route registry persistence proof — 2026-11-15

## Scope and target

A bounded implementation pass extending the durable D1 registry snapshot ledger with full signed-payload persistence and normalized issuer-key records.

- Parent: PR #78 exact HEAD `54250f9c39111dd7cfeb7928fc3fd56169353a95`.
- Implementation PR: [#81](https://github.com/VlDMlNSh/developer-cloud-pool/pull/81), branch `proof/persist-root-signed-route-registry-2026-11-15`.
- Final implementation HEAD: `68ccf7b5b11857c00c9b5c4250bf95bac361468a`.
- PR #81 base: PR #77 branch `impl/durable-route-registry-d1-2026-11-15` at `e63f1dda4c046d485ae9c2f08392a1943a06553d`. The PR includes the dependent PR #78 hardening stack. It is not based on current default.

## Implementation

Migration `0013_persist_verified_route_registry.sql`:
- Adds exact `bundle_json` and `root_signature` columns to the immutable snapshot ledger.
- Adds append-only `pool_route_registry_issuer_keys`, keyed by epoch/issuer/key and bound to snapshot epoch+digest.
- Adds `issuer_key_id`, `registry_epoch`, and `registry_bundle_digest` to route qualification rows.
- Adds insert-time guard requiring a matching snapshot and issuer-key record for registry-bound route rows; legacy fixture rows with all three new fields NULL remain supported by this isolated proof layer.
- Adds immutability guard for registry identity fields.

Writer `persistTrustedRouteRegistryBundle`:
- Re-verifies the root-signed bundle using the platform-pinned root ID/JWK.
- Stores the exact bundle JSON and detached root signature.
- Persists issuer keys and verified route qualifications.
- Advances the singleton active pointer in the same D1 batch.
- Exact retry returns the existing snapshot; conflicting epoch reuse is denied.
- A deliberate route-identity collision test proves snapshot, issuer and pointer writes roll back as one D1 batch.
- All outputs retain `dispatch:false`.

## Exact-head verification

Final PR-head run [43709291531](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43709291531):
- COMPLETED / SUCCESS; job `132797151113`.
- Syntax check: SUCCESS.
- Workers-runtime D1: 11 files, 116 tests PASS / 0 FAIL.
- Isolated second D1 binding/migration smoke: SUCCESS.
- Frozen schema-0010 fixture smoke: SUCCESS.
- Artifact upload: SUCCESS.
- Artifact ID `14159369399`; SHA-256 `bdbaafba5c832b65061e6720c2747f9e961141dfe4426cf270e2ee09b21272f8`.

An initial run [43709221098](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43709221098) failed one pre-existing verifier test because it modified the last base64url character, sometimes changing unused padding bits and producing `SIGNATURE_ENCODING_INVALID` instead of exercising cryptographic tampering. The test was repaired to flip a decoded signature byte. Final exact-head PR run above passes.

File blobs at final head:
- Migration 0013: `40b93551c787078e5c65c8861569bb428bd2eb8b`.
- Writer source: `12f1b09b238d61fa7cf3574221f3cb79f6d4767a`.
- Persistence test: `0c52812ba17f77781231322a315f4d7b2d46283b`.
- README: `7f80f9b3183f257d8b6188d5a8685a89879e2f38`.
- Deterministic signature regression test: `dd3769b34a5cef9b0d85d006af35787b429425b5`.
- D1 workflow: `f6cfa6a43f5217576668ec6a027765250bda8de3`.

## Critical remaining limitation

This is **durable registry persistence**, not yet trusted atomic admission:
- `admitQualifiedTask` has not yet been modified to require a current registry pointer, the exact route snapshot digest/epoch, issuer key status/validity and revocation watermark in its approval-consumption batch.
- Legacy fixture-seeded route rows can still be consumed by the isolated admission proof without a persisted registry.
- Therefore this PR does not qualify a provider route for production use. The next step is to bind the persisted registry snapshot and issuer-key state into the same D1 batch as A0 approval consumption, attempt/outbox creation and commit receipt, with stale-pointer, revoked-key, epoch-advance race and rollback adversarial tests.

## Governance and integration boundary

- PR #81 OPEN / DRAFT / UNMERGED; mergeable relative to its declared PR #77 base.
- Formal reviews: 0; inline review threads: 0.
- Combined commit-status contexts: 0 / NOT VERIFIED, despite exact-head Actions success.
- PR #78 remains OPEN / DRAFT / UNMERGED.
- Current default `Основной`: `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`.
- Default → PR #78: DIVERGED, 93 ahead / 64 behind; merge base `221f216c00ca7e5596bcc682ba185ad155a10603`.
- Default → PR #81: DIVERGED, 100 ahead / 64 behind; same merge base. Do not merge the stale proof stack or transplant its history. Selectively reconstruct integration from current default after source-level review.
- No hosted D1, provider calls, secret reads, deployment, Supervisor/Worker execution, dispatch, merge or independent acceptance.

Status: registry persistence IMPLEMENTED / exact-head CI VERIFIED; atomic trusted-registry admission NOT IMPLEMENTED; Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
