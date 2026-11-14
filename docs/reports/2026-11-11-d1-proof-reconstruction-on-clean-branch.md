# D1 proof reconstruction on clean implementation branch — 2026-11-11

## Result

PARTIAL RECONSTRUCTION VERIFIED. Receipt-bound ACK implementation NOT STARTED. Tests NOT RUN. No PR opened, no merge, no hosted D1, no external GitHub write credentials.

## Immutable target and branch

- Default branch: `Основной`
- Default SHA used for clean branch: `221f216c00ca7e5596bcc682ba185ad155a10603`
- Implementation branch: `impl/receipt-bound-projection-2026-11-11`
- Verified implementation HEAD: `4c39deff653841f8979696167d85a1df24361a6f`
- Branch ref points to exact HEAD above.
- Implementation tree SHA equals commit SHA above.
- Initial branch creation was verified identical to default (0 ahead / 0 behind) before transplant.

## Reconstructed changes

Three commits on the clean branch:

1. `25e56899f0297fe5d501a78c9007c25959b10bd1` — reconstructed 23 baseline paths from exact source commit `ec3f3266ca28c4fb5633a9475cc6f396a4677974`, without importing its 132-commit divergent history. The 23 paths comprise the D1 ledger harness, migration 0001–0006, package/lock, tests, workflow, contract and implementation report.
2. `0feb74cdf2c4dd4a7126d445c3aa46109bb6eedf` — transplanted the exact seven changed paths from PR #58 head `5caeb60f7a45d836c6ad1eea2fb86e20995da025`.
3. `4c39deff653841f8979696167d85a1df24361a6f` — transplanted the exact five changed paths from PR #59 head `22200226da4f1af30645cf441a639db6893e9310`.

Transplant was performed by fetching source file contents, creating blobs/tree/commit, and moving the implementation ref with expected-head protection. The overlapping workflow path was replaced by the #59 final version. Final tree contains 29 paths matching the proof harness, its integration contract and historical report. There are no collisions with default paths in the 23-path baseline reconstruction.

## File-level verification

- `proofs/d1-ledger/package.json` blob: `ebfcf2b311871694904516b245222425fa9c38f8`. Its `check` script includes syntax checks for both projection modules and the existing ledger modules.
- `proofs/d1-ledger/package-lock.json` blob preserved: `876c5d3de53bb12efaecdec939cbe8710cbd9e3c`.
- Migration 0006 retained from baseline; 0007 and 0008 added in order:
  - 0007 blob `767d95a30fa0a14c79e88c8c58392bfec9cdddc2`
  - 0008 blob `1d9385dd371f3404c52ec15fce03b0a14d384ab1`
- Reconciler #58 blob: `2f83befc145d39ea60f06fe5b9e9033f89df40c0`.
- Envelope adapter #58 blob: `cb1fb8b130c66343ca3b1c071aac506113c4cfb0`.
- Current projection outbox #59 blob: `1546c2e4172e3767ed8bd5642c7b9c6d95716d11`.

## Blocking defect deliberately remains visible

The transplanted `projection-outbox.mjs` still exports `acknowledgeProjectionDelivered(db, outboxId, workerId, generation, now)` without a projection receipt. It can mark a row delivered using only the lease tuple. The reconciler returns `eventId` and `payloadDigest`, but does not bind them to `lease_generation_delivery`. This source is preserved as the exact PR patch for diagnosis, not accepted as safe or ready to merge.

The next implementation must:
- remove the public receipt-free ACK export;
- expose one orchestration factory wired with trusted DB, fake/injected API boundary, runtime-owned worker identity and clock;
- acquire and read back lease itself;
- derive envelope from the same row;
- reconcile comment marker and managed labels;
- compare exact outbox ID/event ID and digest;
- perform private conditional ACK bound to outbox ID, digest, lease owner, delivery generation, leased status and fresh trusted time;
- read back delivered status, digest and same generation before success;
- add negative-first tests for missing/mismatched receipt, stale/expired generation, delayed/duplicate marker, lost POST response and concurrency.

## CI and test state

- Combined status contexts for implementation HEAD `4c39deff...`: 0.
- Workflow runs for implementation HEAD: 0.
- Therefore CI is NOT VERIFIED and tests are NOT RUN.
- The transplanted workflow push filter does not include the new `impl/receipt-bound-projection-2026-11-11` branch. Before relying on push CI, add this exact branch to the push filter or use a draft PR targeting default once the implementation is ready for CI.
- No claim of passing tests or hosted D1 qualification.

## Owner sequencing and acceptance

Per owner decision, independent technical/security/governance checks are deferred until after the pool launch. Author-side implementation and local/CI proof work can proceed, but cannot be labelled independent or qualified. Hosted D1, provider dispatch and deployment remain NOT AUTHORIZED / NOT RUN.

Contour A remains BLOCKED / NOT ACCEPTED. Contour B remains DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
