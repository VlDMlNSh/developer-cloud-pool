# 2026-11-18 — Cross-store reconciliation epoch/fence protocol design

## Status and immutable target

- Workstream: Cloud Development Pool, Contour A only; Issue [#133](https://github.com/VlDMlNSh/developer-cloud-pool/issues/133).
- Design target: cumulative local proof PR [#135](https://github.com/VlDMlNSh/developer-cloud-pool/pull/135), exact source head `5554c3f27dd9f23b341224d6c00ccbf74642f289`.
- This pass is architecture/specification only. No source code, schema, workflow, secrets, runtime or production resources changed.
- Current default branch `Основной`: `68183828cf7934e89109310c8f99281be4eb7ed8`.
- PR #135 remains OPEN / DRAFT / UNMERGED. Its base-ref SHA discrepancy is unresolved; do not merge.

## Question being resolved

The current adapter performs bounded R2 cursor pagination and one bounded D1 statement. It correctly returns `crossStoreSnapshotConsistent: false`: a D1 statement snapshot and a sequence of R2 list calls are not a shared atomic snapshot. R2's strong consistency applies to each list operation, but does not by itself freeze the bucket across multiple pages while writers remain active.

## Reuse / platform research

No additional third-party package or service was selected. GitHub repository search for a directly reusable Cloudflare/D1/R2 cross-store fence component returned no usable candidate. The proposed coordinator uses the existing D1 ledger and trusted Workers ingress boundary; it does not add a new orchestrator.

Official Cloudflare references:
- R2 consistency model: individual object listing operations are strongly consistent; competing writes to the same key are last-writer-wins. Crucially, a negative read does not prove an earlier in-flight write has failed. https://developers.cloudflare.com/r2/reference/consistency/
- R2 conditional operations: conditional writes are evaluated atomically at commit; `If-None-Match: *` provides create-once behavior while the object remains present. For ambiguous writes, retry the same conditional request and reconcile a unique write-id metadata value. https://developers.cloudflare.com/r2/api/s3/conditional-operations/
- Workers R2 list API: use the opaque cursor and `truncated` flag; each page is a separate list request. https://developers.cloudflare.com/r2/api/workers/workers-api-reference/

These guarantees support per-object create-once and per-request consistency, not a multi-page snapshot without an application-level write fence.

## Proposed protocol: D1-owned admission epoch

### 1. Single trusted write boundary

- Only the trusted ingest Worker may write to the R2 bucket.
- Executors/workers receive no R2 credentials, bucket binding, S3 token or direct object mutation capability.
- All object creation must first obtain a D1 reservation. No alternate upload path may bypass reservation creation.
- IAM revocation is not used as a runtime fence: Cloudflare documents permission changes as eventually consistent. Structural credential isolation is required.

### 2. Durable reservation lifecycle

Create a D1-owned singleton epoch row and per-upload reservation rows. Suggested fields:

- Epoch: `epoch_id`, monotonic `generation`, `phase` (`OPEN | CLOSING | SEALED`), `updated_at`.
- Reservation: `reservation_id`, `epoch_id`, `task_key`, `upload_id`, unique object key, stable `write_id`, `state`, immutable R2 object version/ETag/size/digest when known.
- Reservation states: `RESERVED | IN_FLIGHT | STORED | PUBLISHED | ABORTED | IN_DOUBT`.

Admission transaction:
1. Require current epoch phase = `OPEN`.
2. Insert a unique reservation bound to epoch, task, upload ID and write ID.
3. Commit reservation before issuing the R2 write.
4. Upload to a unique task/upload key with `If-None-Match: *` and durable write-id metadata.
5. Persist the exact R2 object version and verified byte identity in D1.
6. Publish result and outbox identity in the same D1 transaction, guarded by the reservation and task lease generation.

An ambiguous R2 outcome is `IN_DOUBT`, not `ABORTED`. A 404/negative read alone is not enough to resolve it. Retry/reconcile the same conditional write and write-id, or leave it unresolved. Never expire a reservation into a terminal state solely because a wall-clock timeout elapsed.

### 3. Close admission and drain writers

To start an inventory run:
1. A D1 compare-and-set changes the epoch from `OPEN` to `CLOSING`; this blocks new reservations.
2. Already admitted reservations may finish, including their result/outbox D1 commit.
3. The coordinator resolves every `IN_FLIGHT` and `IN_DOUBT` reservation. Any unresolved request blocks sealing.
4. Once every reservation for the epoch is terminal (`PUBLISHED` or definitively `ABORTED`) and no direct R2 writer exists, freeze all artifact-reference mutations for the scan epoch.
5. Record a durable scan-run row bound to the exact epoch generation.

No lease TTL, timestamp watermark, second list pass, or R2 strong-consistency claim substitutes for draining all admitted writes.

### 4. Build a stable cross-store inventory

With the writer fence held:
1. Read all D1 result/outbox/task references in one bounded D1 statement/transactional snapshot.
2. Paginate R2 using the same fixed prefix and metadata options on every page; consume opaque cursors until `truncated=false`.
3. Because all authorized writers are drained and no other principal can mutate R2, the bucket remains stable during the page sequence. If this no-writer premise cannot be proven, the run is incomplete.
4. Validate object key, version, size, task/upload/write-id metadata and every D1 reference identity.
5. Produce canonical sorted manifests and hashes for the D1 reference set and R2 object set.
6. Finalize the scan-run in D1 only if the epoch generation and `CLOSING` state still match and every reservation remains terminal. Store counts, manifest hashes, protocol version and completion status.
7. Only the coordinator may derive the consistency attestation from this completed scan-run record. Do not accept a caller-provided boolean as proof.

### 5. Recovery and fail-closed behavior

- Crash before `CLOSING`: normal admission may continue.
- Crash after `CLOSING`: remain closed; recover the same scan-run and reconcile reservations. Do not silently reopen or advance epoch.
- Any unknown reservation, pagination gap, malformed metadata, D1 query error, epoch change, direct-writer possibility or manifest mismatch => `INVENTORY_INCOMPLETE`, no attestation.
- If recovery cannot prove a request has terminated, keep the epoch blocked. Availability is sacrificed rather than risking false orphan classification.
- Reopening requires a D1 compare-and-set after every old-epoch reservation is resolved; never reuse an old epoch token.

## Explicit safety invariants

1. Every R2 mutation has exactly one durable D1 reservation created before the mutation.
2. Only the trusted ingress identity can mutate the bucket.
3. No scan seals while any old-epoch write is unresolved.
4. No artifact reference can be inserted/changed outside the D1 epoch gate.
5. Every accepted result/outbox pair references the exact verified object key, version and byte length.
6. The scan attestation is derived from a durable completed scan-run, not caller input.
7. No deletion API, lifecycle GC, compare-and-delete or production cleanup is enabled by this design.

## Required adversarial tests before implementation qualification

- Concurrent admission versus OPEN->CLOSING CAS: exactly one ordering wins; no reservation after close.
- Upload admitted before close completes and is included in the inventory.
- Delayed R2 write / delayed completion after client timeout remains IN_DOUBT and prevents seal.
- Ambiguous PUT reconciled with the same write ID and conditional key; mismatched write ID is rejected.
- D1 result/outbox commit races with close: either completes under old reservation or is rejected; never partially publishes.
- Attempted direct R2 writer is excluded by credential architecture and fails in the isolated test harness.
- Pagination across multiple pages with a concurrent would-be writer: writer fence prevents mutation until scan completes.
- Crash at each transition; restart resumes same epoch and cannot skip unresolved reservation.
- Epoch ABA/stale token replay rejected.
- D1 reference mutation outside the gate rejected by database constraints/triggers.
- Manifest hash/count mismatch, missing cursor, repeated cursor, malformed metadata, limits and query failure all deny attestation.
- Scan finalization CAS with stale generation rejected.
- Old epoch reservation replay after reopening rejected.

## Implementation boundary and decision

This is a design proposal, not a qualified protocol. The current PR #135 inventory adapter remains read-only and must continue returning `crossStoreSnapshotConsistent: false`; its planner must not produce deletion-eligible objects. Before code is written, confirm that all artifact write and reference publication paths can be forced through one trusted D1 reservation boundary. If any ungoverned writer exists, this protocol cannot provide a trustworthy cross-store snapshot.

## Current evidence and governance

- PR #135 exact head `5554c3f27dd9f23b341224d6c00ccbf74642f289`.
- PR Workers runtime run [44342212033](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44342212033): SUCCESS, 4 files / 38 tests.
- Push Workers runtime run [44342193230](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44342193230): SUCCESS, 4 files / 38 tests.
- Pool Contract Validation run [44342211911](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44342211911): SUCCESS.
- PR #135 formal reviews: 0; inline review threads: 0. Independent review NOT VERIFIED.
- Active ruleset ID `26550182` on `Основной`: PR required, review-thread resolution required, 0 required approving reviews, deletion/non-fast-forward prohibited, no bypass actors. Branch-protection endpoint remains unavailable to integration (403); no additional settings claimed.
- Corrective PR #136 remains OPEN / DRAFT / UNMERGED. Default branch still contains the two accidental documentation commits; no force-push or merge was performed.
- Gemini controller workflow not found on checked default ref; Gemini NOT RUN. No secrets/variables inspected.
- No production R2/D1, hosted writes, secrets, providers, dispatch, deployment, merge or Contour B activity.

## Status and next step

- Protocol design: DOCUMENTED / NOT IMPLEMENTED / NOT QUALIFIED.
- Current local artifact inventory proof: VERIFIED by exact-head CI only; cross-store snapshot attestation NOT VERIFIED.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.
- Next bounded engineering step: inventory every R2 write and D1 artifact-reference mutation path in the repository, then implement the smallest D1 epoch/reservation schema and transactional gate only if all paths can be made to obey it. Keep deletion disabled.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
