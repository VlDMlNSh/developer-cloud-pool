# Trusted artifact ingest and D1 result binding proof

This directory is an isolated, local Workers-runtime proof. It is not a deployed service.

## Trust flow

1. Trusted ingress authorizes an upload ID and supplies the byte stream with an exact declared length.
2. `ingestArtifact` applies a 10 MiB cap, computes SHA-256 from actual chunks using Workers `crypto.DigestStream`, and pipes the bytes through `FixedLengthStream` to local R2 with conditional create.
3. On duplicate/ambiguous outcomes, the adapter reads the existing object and re-hashes its bytes before accepting an idempotent retry.
4. Successful ingest returns a frozen in-process artifact capability. The module-private WeakSet is the issuer registry; copying/serializing the record does not preserve authority.
5. `commitTaskResult` accepts only that capability. It derives digest, result reference, object key, object version and byte length from the capability.
6. Migration 0006 persists the object identity on both result and outbox rows. The SQL trigger rejects missing artifact identity, fences task completion and copies the same identity into the outbox atomically.

## Deliberate constraints

- Never accept `uploadId` directly from an untrusted worker without trusted-ingress authorization.
- Never accept worker-supplied digest or object reference as evidence.
- The WeakSet capability is process/isolate-local. Cross-isolate or cross-service handoff needs an authenticated assertion or another explicit capability transport.
- Local Miniflare is not proof of a real R2 bucket's IAM, distributed concurrency, post-publication no-overwrite/no-delete policy or regional failure behavior.
- Cross-store crash recovery and orphan cleanup are not qualified here.
- No production bucket, hosted D1 database, provider, secret, deployment or production dispatch is used.

## Local CI

The existing pinned Workers Vitest plugin and its Miniflare runtime run the proof. The workflow executes dependency installation, syntax checks, Workers-runtime tests and preserves the resolved lockfile as a short-lived CI artifact.
