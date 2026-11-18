# 2026-11-18 — Issue #133 artifact-ingest architecture discovery

## Scope and immutable targets

- Repository: `VlDMlNSh/developer-cloud-pool`.
- Default branch: `Основной`, immutable source target `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- PR #132 proof: `proof/d1-result-outbox-clean-2026-11-18`, head `4b3cd7e3d7a1ac6fd47775ab50f54b78e3a02f6f`.
- Documentation branch: `docs/next-2026-11-18-worker-sandbox-fit`, initial head `0a5fb79ca7dde636fd845d80fc7e9c24d9482e70`.
- Issue #133: OPEN, PLANNED.

## Work performed

1. Re-read default-branch repository tree at the immutable target.
2. Read the Pool Worker workflow, Pool Supervisor workflow, supervisor implementation and README.
3. Re-read PR #132 metadata and changed-file inventory.
4. Rechecked PR #132 exact-head D1 and contract-validation runs, formal reviews and inline threads.
5. Posted the source-backed architecture discovery to Issue #133 (comment ID `6981531405`).
6. Researched Cloudflare's first-party R2 conditional-write and Workers Web Crypto streaming-digest documentation as candidate primitives. No provider account or bucket was accessed.

## Findings — current actual architecture

### Default branch

The recursive Git tree at `35208f0...` contains 62 entries and no artifact/object-storage adapter, R2/S3 binding, upload endpoint, object reader, or content-addressed object module.

- `.github/workflows/pool-worker.yml`, blob `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`: installs the allowlisted DSH package, runs `dsh --profile headless --dump-config`, computes SHA-256 of the textual composition output, and writes a workflow summary. The report job updates Issue labels/comments. It does not ingest artifact bytes or publish immutable object references.
- `.github/workflows/pool-supervisor.yml`, blob `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`: scheduled/event-driven queue reconciliation.
- `scripts/pool-supervisor.mjs`, blob `52bf03ca889edd92fd10c71ae96a2e35e106d43f`: issue claim, allowlisted workflow dispatch and stale-claim recovery; no storage operations.
- README labels the worker/supervisor scaffold as not run / not production-qualified.

### PR #132

PR #132 remains OPEN / DRAFT / UNMERGED on head `4b3cd7e...`. Its 17 files are the isolated `proofs/d1-ledger/**` adapter, migrations, tests, lockfile and validation workflow. `task-result.mjs` stores digest/reference metadata but has no byte-stream input or object-store write.

Exact-head workflow runs:
- D1 Workers runtime: [44316452561](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44316452561), COMPLETED / SUCCESS, head `4b3cd7e...`.
- Pool Contract Validation: [44316452049](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44316452049), COMPLETED / SUCCESS, head `4b3cd7e...`.

Independent review is NOT VERIFIED: formal reviews 0, inline review comments 0 at recheck.

### Architectural conclusion

Issue #133 cannot be qualified by extending only the current D1 result adapter. There is no actual trusted artifact-ingest/storage boundary on default HEAD. Introducing a production bucket, credentials, worker write permission, or an unreviewed production route would silently expand scope and authority.

Next implementation should be an isolated local-only storage-adapter proof. D1 may accept only a verifier-issued artifact record containing digest, byte length, and immutable object identity. Worker-provided digest/reference remain untrusted.

## Upstream primitive research

Candidate, not selected: Cloudflare R2 + Workers runtime.

- R2 S3 conditional operations: https://developers.cloudflare.com/r2/api/s3/conditional-operations/
  - `PutObject` supports `If-None-Match: *`; R2 documents atomic evaluation at commit and serialization of competing conditional writes.
  - For multipart uploads, create-only condition must be applied at `CompleteMultipartUpload`, not only at initiation.
  - Ambiguous writes require explicit reconciliation using a stable write ID in custom metadata; a negative read alone is not proof that an earlier in-flight write cannot commit.
- R2 consistency model: https://developers.cloudflare.com/r2/reference/consistency/
  - Strong read-after-write consistency and conditional-write semantics are documented; negative reads do not cancel earlier in-flight writes.
- R2 Workers API: https://developers.cloudflare.com/r2/api/workers/workers-api-reference/
  - Conditional `put()` can return null when its precondition fails; streaming body length requirements must be tested in the selected runtime.
- Workers Web Crypto: https://developers.cloudflare.com/workers/runtime-apis/web-crypto/
  - `crypto.DigestStream("SHA-256")` is a streaming digest sink that does not retain the full stream.

This research supports a candidate proof, not a claim of production immutability. R2 alone does not prevent an authorized actor from later deleting/replacing an object; access policy, no-delete/no-overwrite boundaries, object key design, conditional writes, metadata reconciliation and lifecycle/orphan recovery still require proof.

## Test and runtime status

- GitHub source inspection: VERIFIED for the immutable source target.
- PR #132 exact-head CI: VERIFIED / SUCCESS.
- Local R2 adapter tests: NOT RUN (no adapter exists yet).
- Real R2 bucket behavior: NOT RUN; no bucket/account accessed.
- Digest streaming, declared-length mismatch, truncation, overflow, write ambiguity, conditional-create race, deletion/replacement, retry and D1 crash recovery: NOT VERIFIED.
- No production dispatch, hosted D1 write, provider call, secret read, deployment or merge.

## Governance

- Active default-branch ruleset `26550182`: PR required; deletion and non-fast-forward blocked; review-thread resolution required; 0 required approvals; no bypass actors.
- Pool Supervisor source defaults dispatch to disabled unless repository variable `POOL_DISPATCH_ENABLED=true`; no dispatch was enabled or triggered by this pass.
- Gemini controller workflow was not found at the expected path on the documentation branch; dispatch NOT RUN. No secrets/variables were inspected.
- PR #132 remains draft and unmerged.

## Result

- Artifact storage boundary discovery: VERIFIED.
- Artifact ingest implementation: NOT IMPLEMENTED.
- Candidate R2 primitive assessment: RESEARCHED / NOT QUALIFIED.
- Issue #133: OPEN / PLANNED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next bounded step

Create a local-only R2 adapter proof with a real Workers-compatible test runtime (e.g. Miniflare/Workers Vitest if its exact R2 conditional and stream semantics are supported). Before implementation, verify upstream compatibility and exact dependency versions. Prove streaming digest and byte count, size cap, abort-on-read-error, create-only key commit, stable write-ID reconciliation, idempotent retries, immutable identity binding, and orphan recovery. Keep production dispatch disabled and do not grant worker credentials.
