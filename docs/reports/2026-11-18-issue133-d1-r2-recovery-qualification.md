# 2026-11-18 — Issue #133 local R2-to-D1 recovery qualification

## Immutable targets

- Default branch `Основной`: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845` (unchanged).
- PR #132: OPEN / DRAFT / UNMERGED; head `4b3cd7e3d7a1ac6fd47775ab50f54b78e3a02f6f`.
- PR #134: OPEN / DRAFT / UNMERGED; head `4f2e1b94710c1fe6270700be82f9556bfe18e0c9`.
- PR #135: OPEN / DRAFT / UNMERGED; cumulative head `f47b62462ed73e57e85f558e5178bdeea2d28332`, base `Основной`.
- Issue #133: OPEN.

## Additional recovery test

Added a Workers-runtime test for the object-written / D1-metadata-not-committed boundary:

1. Create a task and acquire lease generation N.
2. Ingest the task-bound object into local R2 and record its verified object identity.
3. Expire generation N before D1 result commit.
4. Attempt D1 commit; lease fencing rejects it.
5. Assert both `pool_task_results` and `pool_task_result_outbox` remain empty.
6. Confirm the R2 object and version remain available.
7. Acquire generation N+1.
8. Re-run stored-object verification and commit the same object.
9. Assert exactly one result row and one outbox row exist.

The existing exact-retry test covers caller retry after successful commit. This is a local D1/Miniflare recovery proof, not a real provider crash/recovery qualification.

## Exact-head CI

Target head: `f47b62462ed73e57e85f558e5178bdeea2d28332`.

- D1 Workers runtime [run 44329550935](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44329550935): COMPLETED / SUCCESS; job `134889914796` SUCCESS; 16 tests passed across 2 files.
- Pool Contract Validation [run 44329550986](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44329550986): COMPLETED / SUCCESS on the same head.
- Dependency install, syntax validation and lockfile artifact upload: SUCCESS.

## Current implementation summary

- Task-scoped R2 object key: `ingest/<taskKey>/<uploadId>`.
- Actual-byte SHA-256 computed with Workers `crypto.DigestStream`.
- 10 MiB size cap and exact declared length enforced with `FixedLengthStream`.
- R2 conditional create and readback/re-hash reconciliation.
- D1 commit independently re-reads object, validates task/upload metadata, object key, version and byte length, hashes actual bytes, and checks version again after streaming.
- Migration 0006 persists object key/version/byte length on result and outbox.
- SQL trigger requires artifact identity, fences lease completion and copies exact identity into outbox atomically.
- Raw worker digest/reference, forged digest metadata and overwrite before D1 commit are rejected.

## Current source blobs

- Artifact ingest: `45956c03f25dfd9430378f155f3d061dc84c638e`.
- D1 result verifier: `fbc845f331b5316f5347fc2537efef703786abf5`.
- Artifact tests: `93582def6e4d44c7798a2be942e495e4ffb29442`.
- D1 tests: `bae425acc53fb2c3475aa7c1360a4d2ef8507ed3`.
- Migration 0006: `dc2d392149e73f211d4af5a74723a553175759a1`.

## NOT VERIFIED / remaining blockers

- Real Cloudflare R2 account/bucket, distributed concurrency, regional consistency and provider failure semantics.
- Trusted ingress authorization of taskKey/uploadId in the actual Pool Worker service.
- R2 IAM isolation and post-publication no-overwrite/no-delete guarantees.
- Orphan cleanup and production-grade cross-store recovery.
- Independent security review: PR #135 formal reviews = 0.
- Gemini controller workflow not found on checked refs; Gemini NOT RUN. No Secrets/Variables inspected.
- No real bucket, hosted D1 write, provider call, secret read, deployment, production dispatch or merge occurred.

## Status

- Local R2 ingest proof: VERIFIED by exact-head CI.
- D1 verifier-side artifact binding: VERIFIED by exact-head Workers runtime CI.
- Local stale-lease recovery and exact retry: VERIFIED by exact-head CI.
- Real provider/IAM qualification: NOT VERIFIED.
- Trusted ingress authorization: NOT IMPLEMENTED.
- Independent security review: NOT VERIFIED.
- Issue #133: OPEN / PLANNED.
- PR #132/#134/#135: OPEN / DRAFT / UNMERGED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next bounded step

Qualify orphan handling and ambiguous storage outcomes without production credentials: define a bounded reconciliation/GC state machine for task-scoped objects, prove that active or referenced objects cannot be collected, and prove that only expired, unreferenced objects are eligible. Keep deletion disabled until the policy and retention boundary are independently reviewed.
