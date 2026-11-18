# 2026-11-18 — R2 writer boundary and D1 artifact publication audit

## Status / target

- Workstream: Contour A, artifact integrity and recovery; Issue [#133](https://github.com/VlDMlNSh/developer-cloud-pool/issues/133), integration dependency Issue [#140](https://github.com/VlDMlNSh/developer-cloud-pool/issues/140).
- Immutable source target: PR #135 head `5554c3f27dd9f23b341224d6c00ccbf74642f289`.
- Current default `Основной`: `68183828cf7934e89109310c8f99281be4eb7ed8`.
- This pass is a source-level audit and documentation update only. No source, schema, workflow or runtime changes.

## Executive finding

The local R2 proof has one code-level R2 write call, but it does **not** implement a trusted ingress boundary or a D1 admission reservation. The worker entrypoint is explicitly a local test harness returning 404. Therefore the prior D1 epoch/fence proposal cannot yet be implemented as an enforceable guarantee: there is no single production writer/admission boundary to fence.

Do not represent the current code as a trusted production ingest path, and do not issue a cross-store consistency attestation.

## Audited R2 paths

### R2 write

- File: `proofs/d1-ledger/src/artifact-ingest.mjs`, blob `45956c03f25dfd9430378f155f3d061dc84c638e`.
- The only explicit R2 write call in the PR #135 changed-file inventory is `bucket.put(key, fixed.readable, ...)` in `ingestArtifact`.
- The call uses conditional create (`onlyIf: { etagDoesNotMatch: "*" }`) and stores taskKey/uploadId metadata.
- The adapter validates taskKey/uploadId syntax and binds them into the object key. It does not itself query an approval/receipt/lease authority to prove that the caller is authorized to use that taskKey/uploadId.
- Its own module documentation says these values must be authorized by trusted ingress, but no such ingress implementation is included in the proof.
- Duplicate/ambiguous outcome reconciliation re-reads the existing object and hashes bytes. This is a useful local adapter property, not proof of exclusive writer identity or hosted bucket IAM.

### R2 read / inventory

- File: `proofs/d1-ledger/src/artifact-inventory.mjs`, blob `4cf72b422c28efe0138e4b50325abe6bff1fe0a9`.
- It performs bounded read-only `bucket.list` pagination and returns `crossStoreSnapshotConsistent: false` and `deletionPermitted: false` unconditionally.
- No R2 delete call exists in the audited PR #135 changed-file set.
- The adapter correctly documents that R2 page reads and the D1 statement do not form a shared transaction/snapshot.

### Worker entrypoint and binding

- `proofs/d1-ledger/src/worker.mjs`, blob `47d98d19bba4e9142c1febb07ff574698661d835`: fetch handler always returns 404; it exposes no ingest HTTP route, dispatch or external interface.
- `proofs/d1-ledger/wrangler.jsonc`, blob `e097256e7615f8035676a90dd501ac8c09177fa5`: declares local proof D1 and R2 bindings with placeholder D1 database ID; this is a test harness config, not deployed binding evidence.
- No production account/bucket, IAM policy, token scope or direct-writer inventory was inspected.

## Audited D1 artifact-reference paths

- `commitTaskResult` in `src/task-result.mjs` verifies the R2 object before writing result identity.
- Migration 0005 creates `pool_task_results` and `pool_task_result_outbox`; migration 0006 adds artifact key/version/byte length and SQL triggers requiring identity and copying it atomically to outbox.
- The task completion/lease fence is enforced by the D1 trigger in the same D1 transaction as result/outbox publication.
- No durable per-upload reservation/epoch table exists in migrations 0001–0006.
- The current order is R2 verification followed by D1 publication. The final R2 head/read and D1 transaction are not one atomic operation; without exclusive writer controls, an external privileged writer can still change the object after verification.
- The proof does not establish that every D1 artifact-reference mutation in a future integrated service is forced through this one function/trigger path.

## Cross-store protocol disposition

The previous D1 epoch/fence design is **not implementable as a guarantee on this source state yet**. Before epoch code:
1. Define the trusted ingress principal and its authorization input, bound to a durable D1 admission/reservation receipt.
2. Ensure no executor or alternate principal has direct R2 write/delete capability.
3. Create the reservation transaction before R2 PUT; unresolved/ambiguous PUT remains IN_DOUBT and blocks close/seal.
4. Route all artifact-reference writes through the canonical D1 transaction.
5. Only then add OPEN/CLOSING/SEALED epoch and stable inventory scan-run.

A caller-supplied `crossStoreSnapshotConsistent` boolean must not be promoted to an attestation. The consistency proof must be derived from the durable epoch/reservation state and actual writer isolation.

## Migration integration finding

PR #141's source audit identifies PR #67 + #72 as the intended canonical D1 lineage. PR #67 already uses migration 0006 for projection outbox, whereas the isolated PR #135 proof uses migration 0006 for artifact identity. Therefore PR #135's artifact migration cannot be stacked into the canonical lineage at the same migration number. The artifact binding must be selectively ported and renumbered/reconciled after the canonical schema and triggers are reviewed. PR #67/#72 are 81 commits behind the current default and require clean-base transplant and exact-head requalification.

This is a compatibility warning, not an instruction to merge PR #135 or PR #67/#72 as-is.

## Governance / current evidence

- Default HEAD verified: `68183828cf7934e89109310c8f99281be4eb7ed8`.
- PR #135: OPEN / DRAFT / UNMERGED; head `5554c3f27dd9f23b341224d6c00ccbf74642f289`; compare against current default is DIVERGED, 58 commits ahead / 2 behind, merge base `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`. Exact-head historical CI is not current-base integration qualification.
- PR #141: OPEN / DRAFT / UNMERGED; head `6d68f7f22655f4770fc3cb50c2d301b08df4a92c`; source-level admission/lease compatibility audit; formal reviews 0, inline threads 0.
- PR #138: OPEN / DRAFT / UNMERGED; head `5406cc3a88b1b40fc93c286620ec3275f12215f6`; broad implementation and acceptance plan.
- PR #139: OPEN / DRAFT / UNMERGED; clean-base legacy dispatch retirement head `4b35f949fa9bd0f924582f9eb47008c191c061ee`; exact-head Pool Contract Validation run [44349941243](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44349941243) SUCCESS.
- Active ruleset `26550182` on `refs/heads/Основной`: PR required, thread resolution required, 0 required approving reviews, dismiss stale reviews, no bypass actors, deletion and non-fast-forward prohibited. Branch API reports `protected=false` and protection disabled; do not conflate this with the active ruleset.
- Gemini controller workflow `.github/workflows/gemini-batch-dispatch-controller.yml` was not found on checked default ref; Gemini NOT RUN. No Secrets/Variables inspected.
- No production R2/D1 access, hosted writes, secret/provider access, dispatch, deployment, merge or deletion.

## Decision / next step

- R2 writer boundary: NOT IMPLEMENTED.
- D1 admission reservation: NOT IMPLEMENTED.
- Cross-store epoch/fence: DESIGN ONLY / NOT QUALIFIED.
- Local R2/D1 proof: exact-head CI was successful on PR #135, but it remains an isolated Miniflare proof.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

Next bounded pass: create a clean-base integration branch from current `Основной`, freeze exact target SHA, and selectively transplant the canonical PR #67/#72 D1 lineage plus only the compatible artifact byte-verification components from PR #135. First establish the one schema/migration lineage and trusted ingress/reservation contract; do not implement epoch sealing until writer exclusivity is demonstrable. Keep dispatch false and deletion disabled.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
