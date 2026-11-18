# 2026-11-18 — Issue #133 D1 verifier-side artifact binding

## Scope and immutable targets

- Repository: `VlDMlNSh/developer-cloud-pool`.
- Default branch: `Основной`, verified HEAD `35208f0ef28f0ac031a7acdf35fc90ccc9b16845` (unchanged).
- PR #132: OPEN / DRAFT / UNMERGED; head `4b3cd7e3d7a1ac6fd47775ab50f54b78e3a02f6f`.
- PR #134: OPEN / DRAFT / UNMERGED; local R2 ingest proof head `4f2e1b94710c1fe6270700be82f9556bfe18e0c9`.
- PR #135: OPEN / DRAFT / UNMERGED; cumulative head `796dfede0d6be20d0385571516ddb6156d66b7bd`, base `Основной`.
- Issue #133: OPEN.
- Documentation branch: `docs/next-2026-11-18-worker-sandbox-fit`; not default branch.

## Engineering work

PR #135 cumulatively includes PR #132's isolated D1 proof and PR #134's local R2 ingest adapter, then closes the D1 trust-boundary gap by re-verifying actual stored bytes at the D1 commit boundary.

### Trusted ingest

- Task key and upload ID are required and form a task-scoped object key `ingest/<taskKey>/<uploadId>`.
- Metadata stores both task key and upload ID.
- SHA-256 is computed from actual stream bytes with Workers `crypto.DigestStream`; caller-provided digest is ignored.
- A 10 MiB cap is enforced.
- Exact declared byte length is required; `FixedLengthStream` preserves streaming and satisfies the R2 known-length requirement.
- R2 conditional create is used; retries/ambiguous outcomes read and re-hash the existing bytes.

### D1 commit-time verification

`commitTaskResult(db, bucket, input)` does not accept a digest/reference as proof. It calls `verifyStoredArtifact` before any D1 write:

1. Validates task key, upload ID and deterministic task-scoped object key.
2. Reads object metadata and checks task key, upload ID, object version and size.
3. Reads actual object bytes and recomputes SHA-256 under the byte cap.
4. Checks the object version again after streaming.
5. Derives result digest/reference/key/version/byte length from the verified readback.
6. Writes the same object identity to `pool_task_results` and `pool_task_result_outbox`.

An initial module-private WeakSet capability experiment failed under the Workers Vitest module-isolation arrangement and was removed. The final design does not rely on an in-process brand; it re-verifies the stored object at the D1 boundary.

### D1 migration and transaction

Migration `0006_bind_verified_artifact_identity.sql` adds object key, version and byte length columns to result and outbox. A BEFORE INSERT trigger rejects missing artifact identity. The replacement AFTER INSERT trigger performs lease fencing, marks the task complete and atomically copies the exact artifact identity into outbox intent.

## Files and blob SHA

| Path | Blob SHA |
|---|---|
| `proofs/d1-ledger/src/artifact-ingest.mjs` | `45956c03f25dfd9430378f155f3d061dc84c638e` |
| `proofs/d1-ledger/src/task-result.mjs` | `fbc845f331b5316f5347fc2537efef703786abf5` |
| `proofs/d1-ledger/test/artifact-ingest.test.ts` | `93582def6e4d44c7798a2be942e495e4ffb29442` |
| `proofs/d1-ledger/test/task-result.test.ts` | `b741b281c25895ae11ef06d0ef31904e672acf72` |
| `proofs/d1-ledger/migrations/0006_bind_verified_artifact_identity.sql` | `dc2d392149e73f211d4af5a74723a553175759a1` |
| `proofs/d1-ledger/ARTIFACT-INGEST-PROOF.md` | `e27a93eeaa7b0c85fca18c8897f59e2b99f476d0` |

## Exact-head CI

- PR #135 head: `796dfede0d6be20d0385571516ddb6156d66b7bd`.
- Workflow run [44329210953](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44329210953): COMPLETED / SUCCESS; exact `head_sha` matches PR #135.
- Job `134888709080`: COMPLETED / SUCCESS.
- Exact declared dependency installation: SUCCESS.
- Adapter syntax validation: SUCCESS.
- Workers-runtime tests: 15 passed across 2 files.
- Resolved lockfile artifact upload: SUCCESS.
- Earlier failed CI runs remain visible and were used to correct implementation/runtime assumptions; they are not counted as successful evidence.

Test coverage includes:
- worker-supplied digest ignored;
- declared-size mismatch and overflow rejected;
- source stream failure rejected;
- exact retry and concurrent conditional create;
- same-length content substitution rejected;
- overwrite between ingest and D1 commit rejected;
- raw worker digest/reference rejected;
- forged digest metadata rejected by byte-level rehash;
- result/outbox object key, version and byte length equality;
- idempotent result commit;
- stale lease fencing and SQL rollback.

## Upstream/runtime reuse

Reused the existing pinned `@cloudflare/vitest-plugin@1.4.7` and its Workers-compatible Miniflare runtime from PR #132; no new dependency was added.

- Miniflare R2 implementation: https://github.com/cloudflare/workers-sdk/blob/496a062afca5587050e21ff026d541b730b4e125/packages/miniflare/src/workers/r2/bucket.worker.ts
- Miniflare R2 tests: https://github.com/cloudflare/workers-sdk/blob/496a062afca5587050e21ff026d541b730b4e125/packages/miniflare/test/plugins/r2/index.spec.ts
- R2 Workers API: https://developers.cloudflare.com/r2/api/workers/workers-api-reference/
- Workers Web Crypto: https://developers.cloudflare.com/workers/runtime-apis/web-crypto/

## Limitations — NOT VERIFIED

- Miniflare is local only. Real Cloudflare R2 account/bucket behavior, distributed concurrency, cross-region consistency and IAM are not qualified.
- Trusted ingress must authorize taskKey/uploadId; this authorization path is not implemented in the current Pool Worker scaffold.
- The R2 binding must remain private to trusted ingress/verifier. Worker principals must not receive write/delete authority.
- A second version check narrows but cannot eliminate a post-verification overwrite by another authorized principal. No-overwrite/no-delete storage policy is NOT VERIFIED.
- Cross-store crash recovery, orphan cleanup and D1 ambiguous-commit recovery need further tests.
- No real bucket, hosted D1 write, provider call, secret read, deployment, production dispatch or merge occurred.
- Independent security review: NOT VERIFIED; PR #135 formal reviews = 0.
- Gemini controller workflow was not found at the expected path on checked refs; Gemini NOT RUN. No Secrets/Variables were inspected.

## Status

- Local R2 ingest proof: VERIFIED by exact-head CI.
- D1 result/outbox byte-verification integration: VERIFIED by exact-head local Workers runtime CI.
- Real storage/IAM qualification: NOT VERIFIED.
- Trusted ingress authorization: NOT IMPLEMENTED.
- Crash recovery/orphan cleanup: NOT VERIFIED.
- Independent security review: NOT VERIFIED.
- Issue #133: OPEN / PLANNED.
- PR #132: OPEN / DRAFT / UNMERGED.
- PR #134: OPEN / DRAFT / UNMERGED.
- PR #135: OPEN / DRAFT / UNMERGED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next bounded engineering step

Add a D1/R2 recovery test for the object-written / metadata-not-committed boundary: ingest a task-bound object, force the first D1 commit to fail through a stale lease, verify no result/outbox row exists, reacquire a new fenced lease, then re-verify and commit the same stored object exactly once. Also test ambiguous caller retry after successful commit. Do not add production storage credentials or enable dispatch.
