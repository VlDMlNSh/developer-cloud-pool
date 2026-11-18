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
