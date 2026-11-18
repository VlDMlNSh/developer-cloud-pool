# 2026-11-18 — Issue #133 bounded read-only R2/D1 inventory qualification

## Immutable target and result

- Workstream: Cloud Development Pool, Contour A only.
- Issue: [#133](https://github.com/VlDMlNSh/developer-cloud-pool/issues/133).
- Cumulative proof PR: [#135](https://github.com/VlDMlNSh/developer-cloud-pool/pull/135).
- Starting target SHA: `adfd0c130ad45ebc57cf2c545f2eddb9c50b594a`.
- Final exact head: `5554c3f27dd9f23b341224d6c00ccbf74642f289`.
- PR #135 remains OPEN / DRAFT / UNMERGED. No merge or deployment.

## Restored repository and governance state

- Default branch: `Основной`, current HEAD `68183828cf7934e89109310c8f99281be4eb7ed8`.
- The two documentation-only commits which advanced default HEAD are still tracked by corrective PR #136 (OPEN / DRAFT / UNMERGED, head `032fe0548ce5c8549976a9806ebc9e7f86cd8e4f`). No force-push or merge was performed.
- PR #132 OPEN / DRAFT / UNMERGED, head `4b3cd7e3d7a1ac6fd47775ab50f54b78e3a02f6f`.
- PR #134 OPEN / DRAFT / UNMERGED, head `4f2e1b94710c1fe6270700be82f9556bfe18e0c9`.
- PR #135 OPEN / DRAFT / UNMERGED, final head above; base `Основной`.
- Issue #133 remains OPEN.
- PR #135 review submissions and inline review threads are empty; independent security review NOT VERIFIED.
- Default branch protection endpoint returned 403 to the connected integration. The repository ruleset endpoint was readable: active ruleset ID `26550182`, name `Основной — verified`, applies to `refs/heads/Основной`, prohibits deletion and non-fast-forward updates, requires PR and resolution of review threads, but sets required approving reviews to 0. No bypass actors; current integration cannot bypass. A CODEOWNERS file was not found at root or `.github/CODEOWNERS`.
- Gemini controller `.github/workflows/gemini-batch-dispatch-controller.yml` returned 404 on default branch. Gemini NOT RUN; no secrets or variables inspected.

## Reuse and design decision

- Reused the existing pinned Cloudflare Workers Vitest/Miniflare runtime and existing local R2/D1 bindings; no new dependencies or external service added.
- Cloudflare's official Workers R2 API documents cursor-based listing, the `truncated` flag, a maximum page size of 1,000 and the need to keep prefix/options consistent across pages. It explicitly warns not to infer pagination completion from the number of returned objects.
- Reference: [Cloudflare R2 Workers API reference](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/).
- A D1 reference/task snapshot is read through one bounded SQL statement using `json_each(?)` for requested task keys and `UNION ALL` over result, outbox and task rows. This gives those D1 rows one statement-level view, but does not make R2 and D1 a shared snapshot.

## Implemented

- Added `proofs/d1-ledger/src/artifact-inventory.mjs`.
- Added `proofs/d1-ledger/test/artifact-inventory.test.ts`.
- Added `artifact-inventory.mjs` to package syntax checks.
- Extended `proofs/d1-ledger/ARTIFACT-INGEST-PROOF.md`.
- Tightened `artifact-reconcile.mjs`: a cross-store consistency attestation is now mandatory before the planner can classify a record as an orphan candidate. The inventory adapter always returns `crossStoreSnapshotConsistent: false`, so its output cannot qualify deletion candidates.

The adapter:
1. Restricts listing to the fixed `ingest/` prefix.
2. Uses the R2 opaque cursor and `truncated` flag, preserving prefix, page limit and custom-metadata include option on every request.
3. Bounds page size (<=1,000), page count (<=100), total objects (<=10,000), and D1 records (<=3,000).
4. Fails closed on missing/repeated cursor, duplicate object key, malformed object metadata, page/object limits, D1 query failure, oversized D1 snapshot or malformed reference/task rows.
5. Reads result references, outbox references and requested task states in one bounded D1 statement.
6. Returns `deletionPermitted: false` unconditionally and `crossStoreSnapshotConsistent: false` unconditionally.

The D1 statement is one statement-level view, but the R2 listing is paginated separately. Concurrent R2 writes can still make the two inventories non-atomic. This pass deliberately does not claim a consistent cross-store point-in-time snapshot.

## Exact-head verification

Final head: `5554c3f27dd9f23b341224d6c00ccbf74642f289`.

- PR-triggered Workers runtime [run 44342212033](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44342212033), job `134934958634`: SUCCESS; 4 test files / 38 tests passed.
- Push-triggered Workers runtime [run 44342193230](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44342193230), job `134934886722`: SUCCESS; 4 test files / 38 tests passed.
- Pool Contract Validation [run 44342211911](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44342211911), job `134934950815`: SUCCESS on the same head.
- Install, syntax check, Workers runtime test step and lockfile artifact upload succeeded on the final runs.

The immediately preceding candidate head `c6f53d42a390347d6c83d51eac20ca14bf07acb0` failed because a page counter was not declared and a test file contained literal escaped newlines. Both were fixed in `5554c3f27dd9f23b341224d6c00ccbf74642f289`; the final exact-head runs above pass. The failed run remains in Actions history and is not hidden.

## Remaining gaps

- No shared R2/D1 snapshot or concurrency barrier exists. The adapter explicitly reports this limitation.
- No trusted cross-store snapshot attestation protocol exists. The planner's boolean is an internal caller assertion, not cryptographic proof.
- Real production R2 listing and hosted D1 reads remain NOT VERIFIED.
- Approved retention policy and trusted time source remain NOT VERIFIED.
- Compare-and-delete, version-conditioned deletion, R2 IAM no-overwrite/no-delete and orphan cleanup remain NOT VERIFIED.
- Trusted ingress authorization of taskKey/uploadId remains NOT IMPLEMENTED.
- Independent security review remains NOT VERIFIED.
- PR #136 exact-head CI remains NOT VERIFIED.

## Safety boundary and next step

- No production bucket, hosted D1 write, provider call, secret access, production dispatch, deployment, merge or Contour B work.
- No object deletion code or lifecycle rule was enabled.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
- Next bounded pass: design and test a trustworthy cross-store reconciliation protocol. Prefer a D1-owned inventory epoch/fence or durable scan-run record plus R2 object version checks; prove how concurrent object writes and D1 result/outbox commits are fenced. Keep all deletion disabled.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


### Base-ref drift note (verified 2026-11-18)

The live default branch `Основной` is at `68183828cf7934e89109310c8f99281be4eb7ed8`, while GitHub's PR #135 API currently reports `base.sha` as `35208f0ef28f0ac031a7acdf35fc90ccc9b16845` (base ref remains `Основной`). Treat this as an unresolved base-ref snapshot discrepancy. PR #135 is still Draft and must not be merged until the base relationship is refreshed/revalidated against the live default head and the complete diff/CI are rechecked. PR #136 is the separate corrective documentation PR based on `68183828cf7934e89109310c8f99281be4eb7ed8`.
