# Trusted artifact ingest and D1 result binding proof

This directory is an isolated, local Workers-runtime proof. It is not a deployed service.

## Trust flow

1. Trusted ingress authorizes the task key and upload ID and supplies a byte stream with an exact declared length.
2. `ingestArtifact` binds the object key and metadata to that task identity, applies a 10 MiB cap, computes SHA-256 from actual chunks using Workers `crypto.DigestStream`, and pipes the bytes through `FixedLengthStream` to local R2 with conditional create.
3. On duplicate/ambiguous outcomes, the adapter reads the existing object and re-hashes its bytes before accepting an idempotent retry.
4. `commitTaskResult` does not trust a caller-supplied digest or a JavaScript object brand. At the D1 commit boundary it re-reads the task-bound object from R2, verifies key, task metadata, upload ID, object version and size, hashes the actual stored bytes, and checks the object version again after streaming.
5. Migration 0006 persists the verified object key, version and byte length on both result and outbox rows. The SQL trigger rejects missing artifact identity, fences task completion and copies the same identity into the outbox atomically.

## Deliberate constraints

- Never accept task key/upload ID directly from an untrusted worker without trusted-ingress authorization.
- Never accept worker-supplied digest or object reference as evidence; the D1 boundary recomputes the digest from stored bytes.
- The storage binding must be available only to the trusted ingress/result verifier. Workers must not receive independent write/delete authority.
- Local Miniflare is not proof of a real R2 bucket's IAM, distributed concurrency, post-publication no-overwrite/no-delete policy or regional failure behavior.
- Cross-store crash recovery and orphan cleanup are not qualified here.
- No production bucket, hosted D1 database, provider, secret, deployment or production dispatch is used.

## Local CI

The existing pinned Workers Vitest plugin and its Miniflare runtime run the proof. The workflow executes dependency installation, syntax checks, Workers-runtime tests and preserves the resolved lockfile as a short-lived CI artifact.

## Orphan reconciliation — dry-run only

`planArtifactOrphanReconciliation` produces a bounded, read-only inventory classification for objects under `ingest/<taskKey>/<uploadId>`. It requires complete object-list and D1 reference snapshots, preserves every object referenced by either result or outbox (including key/version disagreements), preserves objects with unknown or non-dead task state, and applies a caller-supplied retention boundary that must be derived from trusted runtime/storage time by the future orchestrator.

The planner is deliberately incapable of deleting objects. A candidate is only a review item when its task is terminal `dead`, the object is older than the retention boundary, and neither D1 result nor outbox references its key. Even then `deletionEligible` is always false and independent approval is required. Missing or incomplete snapshots fail closed. This is a local proof of classification logic, not a production R2 listing/D1 query integration or a deletion qualification.

Do not apply a blanket R2 lifecycle expiry rule to the `ingest/` prefix: lifecycle rules match prefixes and age, not D1 result/outbox references or task state. Keep automatic deletion disabled until a separately reviewed retention policy and compare-and-delete strategy exist.


## Read-only inventory adapter

`collectArtifactInventory(bucket, db)` performs bounded R2 listing under the fixed `ingest/` prefix and reads D1 result, outbox, and requested task-state records in one bounded SQL statement. It uses R2's opaque cursor and `truncated` flag (not page length) to continue listing, carries the same prefix/limit/custom-metadata options on each page, and fails closed on missing/repeated cursors, duplicate keys, malformed objects, page/object/row limits, and D1 query errors.

The D1 references and task states are read by one SQL statement, so those rows share one statement-level database view. R2 pagination and D1 are separate stores and are **not** a shared cross-store snapshot; the returned `crossStoreSnapshotConsistent` is always false. The adapter is read-only and always returns `deletionPermitted: false`. A complete inventory means only that the bounded R2 listing reached its end and the bounded D1 statement returned completely; it is not deletion authorization or proof of a transactionally consistent cross-store point-in-time view.
