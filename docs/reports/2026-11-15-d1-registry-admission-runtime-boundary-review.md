# D1 registry and admission runtime-boundary review — 2026-11-15

## Result

**Source-level self-review: VERIFIED AS A LOCAL TEST PROOF; NOT A RUNNABLE SERVICE; NOT QUALIFIED FOR PRODUCTION.**

This pass reviewed the immutable PR #87/#92 source stack and exact-head CI evidence. It did not modify application code, execute tests, deploy infrastructure, or perform an independent audit.

## Immutable targets and evidence

- Cloud Pool repository: `VlDMlNSh/developer-cloud-pool`; default branch metadata says `Основной`. The previously observed default snapshot remains `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`; branch enumeration did not return a newer `Основной` ref, so current default HEAD is **NOT VERIFIED** in this pass.
- Parent PR #87: OPEN / DRAFT / UNMERGED; head `8cc7b12948865bb0e13ce099386c09f3ae32b4f5`; base snapshot `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`.
- Stacked PR #92: OPEN / DRAFT / UNMERGED; head `7014961587759b27d2ef6e91c60ce098d077ae83`; base #87 head `8cc7b12948865bb0e13ce099386c09f3ae32b4f5`.
- PR #92 exact-head D1 Proof run [43718679258](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43718679258): SUCCESS; 120 tests PASS / 0 FAIL; migration binding and frozen schema fixture smoke passed according to the recorded run evidence.
- PR #92 exact-head Pool Contract Validation [43718679251](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43718679251): SUCCESS.
- PR #92 exact-head check-runs observed 2 SUCCESS; combined commit status contexts returned empty. PR #87 and #92 have zero formal reviews. No merge performed.
- Relevant immutable blobs at PR #87/#92 source ref:
  - registry adapter `proofs/d1-ledger/src/trusted-route-registry.mjs`: `12f1b09b238d61fa7cf3574221f3cb79f6d4767a`
  - A0/D1 admission adapter `proofs/d1-ledger/src/admit-qualified-task.mjs`: `00e9042ccdbf04cd4ecaf6fbda3c982cf72136ed`
  - migration 0012: `485d8c2d2327a64c8d86ddc004134113d6ae3d80`
  - migration 0013: `40b93551c787078e5c65c8861569bb428bd2eb8b`
  - migration 0014: `cb8a47d83faba62981daa8f7320da87baa2c55e2`
  - persistence tests: `0c52812ba17f77781231322a315f4d7b2d46283b`
  - atomic admission tests: `4543d1db062da3e94ee839c50c79e3f01016b8b7`
  - worker entrypoint: `214622f6dc94623521070eb9e7fbc2f573fdc2c6`

## What the local proof establishes

1. Root-signed registry bundle verification uses a pinned platform environment binding for the root public JWK; root key material is not accepted from the request bundle.
2. Registry snapshots, issuer-key rows, qualified route rows and the active pointer are persisted through a D1 batch. Snapshot and issuer-key records are append-only; the snapshot trigger compares against the highest persisted epoch, not only the active pointer.
3. Migration 0014 creates an admission-time assertion whose trigger checks the active snapshot, bundle digest/version/epoch, route evidence freshness and validity, issuer-key identity, key status and key validity.
4. The admission adapter places this assertion, single-use approval consumption, admission, attempt, task outbox binding and receipt in one D1 batch. The PR #92 regression tests cover exact replay integrity; atomic admission tests cover stale evidence, inactive epochs, revoked issuer keys and a registry advance interleaved between preflight and the batch.
5. Dispatch remains hard-coded false in the verified result/receipt path.

## Blocking runtime gaps

- **No HTTP runtime integration:** the current `proofs/d1-ledger/src/worker.mjs` entrypoint deliberately returns HTTP 404 (`D1 ledger proof only`). The adapters are imported directly by tests and are not exposed through a Worker API. This is a local proof, not a live claim/admission/registry service.
- **Caller-supplied time:** `verifyTrustedRouteRegistryBundle` and `persistTrustedRouteRegistryBundle` accept a `now` argument. The admission adapter likewise receives `input.now`. No runtime boundary currently injects a trusted platform clock; therefore clock authority and resistance to caller time manipulation are NOT QUALIFIED.
- **Issuer authorization for registry writes is not an HTTP contract yet:** root signature verification exists, but no authenticated ingestion endpoint, request authorization policy, replay/rate limits or operator key-rotation workflow was found in the inert Worker entrypoint.
- **Hosted persistence and concurrency:** exact-head Workers-runtime tests do not prove a deployed D1 database, real hosted concurrent writers, operational backup/restore, or production binding correctness.
- **No production dispatch:** no worker execution or model/provider invocation is wired to this proof. Keep dispatch disabled.
- **Governance:** PRs #87/#92 remain Draft and unreviewed; no independent review was performed. The active default ruleset previously observed requires PR and thread resolution but zero approvals and no required status checks. Treat independent acceptance as NOT VERIFIED and follow the owner's instruction to defer independent audit until the Pool is operational.

## Next bounded implementation target

Design and implement a fail-closed Worker boundary in a separate PR, before any production deployment:
- authenticated registry ingestion using a root-signed bundle and explicit caller authorization (no anonymous mode);
- trusted platform time sourced inside the Worker, never from request JSON;
- bounded request body and content type; strict schema validation; no provider secrets in request payloads;
- D1 binding validation and atomic call to the existing persistence adapter;
- read-only admission inspection endpoint or a narrowly authenticated admission endpoint, with dispatch remaining false;
- tests for missing auth, invalid signature, stale/future bundle, caller-supplied time ignored, duplicate/replay, concurrent epoch race, unavailable D1, and rollback;
- no public route or credential capability until governance and deployment gates are separately accepted.

Do not merge the local proof stack, deploy a Worker, provision D1, enable dispatch, read secrets, or call providers in this pass.

## Current project disposition

- Local A0→D1 transaction proof: IMPLEMENTED; PR #92 exact-head CI VERIFIED.
- Trusted registry persistence and admission-time registry assertion: IMPLEMENTED in local PR branch; runtime boundary NOT IMPLEMENTED.
- Trusted production clock / authenticated ingestion: NOT QUALIFIED.
- Hosted D1 / live Worker / executors / routing: NOT RUN or NOT VERIFIED.
- Contour A: IN PROGRESS / BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
