# 2026-11-18 — Issue #133 local Workers R2 artifact-ingest proof

## Scope and immutable targets

- Repository: `VlDMlNSh/developer-cloud-pool`.
- Default branch: `Основной`, verified HEAD `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- PR #132: OPEN / DRAFT / UNMERGED; base for this stack; head `4b3cd7e3d7a1ac6fd47775ab50f54b78e3a02f6f`.
- PR #134: OPEN / DRAFT / UNMERGED; `proof/trusted-artifact-ingest-r2-local-2026-11-18`; head `4f2e1b94710c1fe6270700be82f9556bfe18e0c9`; base `proof/d1-result-outbox-clean-2026-11-18`.
- Issue #133: OPEN.
- Documentation branch: `docs/next-2026-11-18-worker-sandbox-fit`; this is a documentation branch, not default branch.

## Work performed

1. Recovered default HEAD, branches, PR #132/#134, Issue #133, recent workflow runs and prior Context Window.
2. Inspected upstream Cloudflare Workers SDK / Miniflare R2 implementation and its native R2 tests. Reused the existing pinned `@cloudflare/vitest-plugin@1.4.7` and its transitive Miniflare runtime already in the D1 proof; no dependency or lockfile changes were needed.
3. Created stacked PR #134 with local-only R2 binding, bounded streaming ingest adapter, and Workers-runtime adversarial tests.
4. Ran exact-head CI, inspected failures, corrected runtime API assumptions, and reran until the final run passed.
5. Updated PR #134 description and posted a source-backed status comment to Issue #133.

## Implementation

Files on PR #134 head:

| Path | Blob SHA |
|---|---|
| `proofs/d1-ledger/src/artifact-ingest.mjs` | `caafccdeffe2ecdb445bbb2320f10478bde4e92f` |
| `proofs/d1-ledger/test/artifact-ingest.test.ts` | `382010f711274a2f2d913cfd598ee69cb27b6d5f` |
| `proofs/d1-ledger/wrangler.jsonc` | `e097256e7615f8035676a90dd501ac8c09177fa5` |
| `proofs/d1-ledger/package.json` | `39c802eae3a824dae0d977ec8d279714e58d64ca` |

The adapter:
- Computes SHA-256 from actual streamed bytes using Workers `crypto.DigestStream`; any input digest field is ignored.
- Enforces a 10 MiB maximum and requires a declared byte length.
- Pipes through `FixedLengthStream` because R2 rejects arbitrary streams without a known length; this preserves bounded streaming and enforces exact byte length.
- Uses R2 conditional create with `onlyIf: { etagDoesNotMatch: "*" }`.
- Uses a trusted-ingress idempotency key to derive the object key.
- Returns key, R2 object version, ETag, byte length and independently computed digest.
- On retry/ambiguous storage outcomes, reads the existing object and re-hashes its actual bytes before returning an idempotent result.

## Exact-head CI evidence

Final source head: `4f2e1b94710c1fe6270700be82f9556bfe18e0c9`.

- Workflow run [44327671549](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44327671549): COMPLETED / SUCCESS, event `pull_request`, head matches PR #134.
- Job `134883244667`: COMPLETED / SUCCESS.
- `npm ci --ignore-scripts --no-audit --no-fund`: SUCCESS.
- `npm run check`: SUCCESS.
- `npm test`: 13 passed across 2 files.
- Lockfile artifact upload: SUCCESS.
- Earlier failed attempts remain visible in Actions history; the final success does not erase them.

Adversarial coverage:
- Actual bytes determine SHA-256; caller-supplied digest ignored.
- Declared-length mismatch rejected.
- Size overflow rejected.
- Source stream failure rejected.
- Exact retry accepted only after stored bytes are re-read and re-hashed.
- Concurrent same-key creates serialize to one stored result plus one idempotent result.
- Same-length content substitution rejected.
- Overwrite detected during retry reconciliation.
- Invalid ingress ID and invalid size policy rejected.

## Upstream evidence and runtime constraint

- Upstream Miniflare R2 implementation and tests:
  - https://github.com/cloudflare/workers-sdk/blob/496a062afca5587050e21ff026d541b730b4e125/packages/miniflare/src/workers/r2/bucket.worker.ts
  - https://github.com/cloudflare/workers-sdk/blob/496a062afca5587050e21ff026d541b730b4e125/packages/miniflare/test/plugins/r2/index.spec.ts
- Cloudflare R2 Workers API states that a ReadableStream passed to `R2Bucket.put()` must have a known length; `FixedLengthStream` is a supported method:
  https://developers.cloudflare.com/r2/api/workers/workers-api-reference/
- Cloudflare Workers Web Crypto documents `crypto.DigestStream` as a WritableStream that hashes streamed input without retaining it:
  https://developers.cloudflare.com/workers/runtime-apis/web-crypto/

## Explicit limitations — NOT QUALIFIED

- Miniflare is a local Workers-compatible simulator; this does not qualify a real Cloudflare R2 account, bucket, IAM policy, distributed write race, regional behavior or production consistency.
- `uploadId` must be issued/authorized by trusted ingress. The adapter must not accept a raw worker-provided idempotency identity without authorization.
- PR #134's artifact record is not yet wired into `commitTaskResult` as a verifier-issued capability. D1 result/outbox can still accept raw digest/reference metadata in the existing proof. End-to-end publication gating is NOT VERIFIED.
- The adapter detects overwrite/substitution on reconciliation, but cannot prevent an independently authorized actor from overwriting/deleting after publication. Least-privilege storage policy and stable object-read identity are not qualified.
- Crash recovery across R2 object write and D1 metadata/outbox commit is NOT VERIFIED.
- No real bucket, hosted D1, provider call, production dispatch, secret read, deployment or merge occurred.
- PR #134 remains DRAFT; PR #132 remains DRAFT; independent security review remains NOT VERIFIED.

## Governance and executor status

- Gemini controller workflow `.github/workflows/gemini-batch-dispatch-controller.yml` was NOT FOUND (HTTP 404) on the checked refs. Gemini dispatch NOT RUN; no Secrets/Variables were inspected.
- No Claude Code remote host was qualified or used.
- No worker/production credentials were granted.
- No production dispatch or writes were performed.

## Result

- Local Miniflare R2 adapter proof: VERIFIED by exact-head CI.
- 13 local Workers-runtime tests: VERIFIED.
- Real Cloudflare R2 behavior: NOT VERIFIED.
- Trusted ingress authentication / idempotency-key provenance: NOT VERIFIED.
- D1 verifier-capability binding and outbox gating: NOT IMPLEMENTED.
- Crash recovery and orphan cleanup: NOT VERIFIED.
- Independent security review: NOT VERIFIED.
- Issue #133: OPEN / PLANNED.
- PR #134: OPEN / DRAFT / UNMERGED.
- PR #132: OPEN / DRAFT / UNMERGED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next bounded engineering step

Bind the artifact proof to D1 safely: introduce an unforgeable verifier-issued artifact capability (module-private WeakSet/opaque token or equivalent authority boundary) and make `commitTaskResult` accept only that capability, deriving digest, byte length, object key and object version from the verified record. Add transactional tests proving that raw worker digest/reference inputs cannot create result/outbox rows and that failed storage verification cannot publish outbox intent. Preserve the stacked PR chain and keep all production writes/dispatch disabled.
