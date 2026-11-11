# Receipt-bound projection orchestration — pre-implementation decision — 2026-11-11

## Status

AUTHOR-SIDE DESIGN DECISION / IMPLEMENTATION NOT YET STARTED / NO HOSTED RUNTIME.

This pass follows the owner's sequencing decision: independent technical, security and governance qualification is deferred until after Cloud Development Pool is launched. The pre-launch author may perform bounded source analysis, design and implementation, but this evidence is not independent review and cannot qualify Contour A.

## Immutable references revalidated

- Repository: `VlDMlNSh/developer-cloud-pool`
- Default branch: `Основной`
- Default HEAD: `221f216c00ca7e5596bcc682ba185ad155a10603`
- Documentation branch: `docs/projection-stack-reconciliation-2026-11-11`
- Documentation branch / PR #66 head: `38e22c127b6b3417eaf49a8b1d24ad62aaa11aac`
- PR #58: OPEN / DRAFT / UNMERGED; head `5caeb60f7a45d836c6ad1eea2fb86e20995da025`; base branch `test/50-approval-logical-task-contention-2026-11-09`; no formal reviews or review threads.
- PR #59: OPEN / DRAFT / UNMERGED; head `22200226da4f1af30645cf441a639db6893e9310`; base branch `proof/fake-github-projection-reconciler-2026-11-11`; no formal reviews or review threads.
- PR #66: OPEN / DRAFT / UNMERGED; head `38e22c127b6b3417eaf49a8b1d24ad62aaa11aac`; base `Основной@221f216c00ca7e5596bcc682ba185ad155a10603`; docs-only, no formal reviews or review threads.
- Exact-head combined status endpoint returned zero status contexts for #58, #59, #66 and default HEAD. This is not a passing check.
- PR-triggered workflow runs: #58 run `43043284086` SUCCESS; #59 run `42981807825` SUCCESS; #66 no run returned. The two proof runs are source-branch evidence only; they do not prove integration against current default or hosted D1.
- The MediaHub canonical map contents endpoint returned an empty payload; its blob was successfully read by SHA `75f62685459ec99ebf8be478f4e9096cdb842b1d`. Do not treat the empty Contents response as an empty map.

## Confirmed defect

At PR #59 source head, `acknowledgeProjectionDelivered(db, outboxId, workerId, generation, now)` accepts no receipt or projection-verification result. Its conditional UPDATE binds only outbox ID, `status='leased'`, lease owner, delivery lease generation and lease expiry, then transitions to `delivered`.

Therefore, possession of a live lease tuple is sufficient to ACK even if no GitHub projection was verified. This is a hard correctness blocker. The successful local D1 proof run does not remove it.

The reconciler at PR #58 can return `PROJECTION_VERIFIED`, `eventId` and `payloadDigest`, but that result is not bound to the delivery lease generation. The envelope's `claimGeneration` is the task-attempt claim generation and must not be confused with `lease_generation_delivery`.

## Design decision for the next implementation candidate

Implement one narrow orchestration boundary in the integrated proof candidate. It must own the entire sequence and must not accept a caller-supplied receipt, boolean, "verified" object, caller-selected timestamp, or delivery generation as proof.

1. The orchestration boundary obtains trusted current time from a runtime-owned clock adapter, not from request payload or an untrusted caller parameter.
2. It acquires the D1 delivery lease itself and reads back the immutable outbox identity and the exact lease tuple: `outbox_id`, `event_digest`, `lease_owner`, `lease_generation_delivery`, and `lease_expires_at`, together with the event identity and projection fields.
3. It derives the projection envelope from that read-back row. It must preserve the distinction between task-attempt `lease_generation` and delivery `lease_generation_delivery`.
4. It invokes the fake/injected GitHub projection API through the reconciler. No credentials or network client are added to the pure reconciler. The result must be `PROJECTION_VERIFIED`, `projection_verified === true`, and match the exact outbox `eventId` and `event_digest`.
5. Only then does the same orchestration boundary execute a conditional D1 ACK. The SQL must bind the same `outbox_id`, `event_digest`, `lease_owner`, `lease_generation_delivery`, expected `leased` status, and an unexpired lease at a fresh trusted time read. A stale or changed lease must update zero rows and fail closed.
6. There must be no exported receipt-free ACK function. The lower-level ACK SQL/helper remains private to the orchestration module. No external caller can manufacture a plain object to bypass reconciliation.
7. A successful result is returned only after D1 read-back confirms `delivered`, the exact event digest and delivery generation, and cleared lease fields. Ambiguous external POST or D1 response is reconciled by read-back; it must never be converted into an ACK by assumption.

## Required negative-first tests

- A valid lease with no verified projection does not ACK.
- A reconciler result with wrong event ID or digest does not ACK.
- A task claim generation is not accepted as a delivery lease generation.
- A stale generation after takeover cannot ACK.
- Expired lease cannot ACK even when owner and generation match.
- Duplicate/conflicting marker, delayed visibility, label mutation failure or ambiguous read-back cannot ACK.
- Lost POST response followed by matching marker and managed-label read-back can ACK once.
- Concurrent ACK attempts produce at most one conditional transition.
- Replay is idempotent only for the same immutable event digest and delivery lease identity; it cannot create a new ACK for another generation.
- Caller-supplied timestamps/receipts/verification flags are rejected or are not part of the public API.
- Fifth-lease recovery remains fail-closed unless separately authorized recovery authority and trusted time are qualified.

## Integration constraints

- Do not merge PR #58/#59 wholesale. Reconstruct a new candidate from then-current default and selectively transplant the logical patch union after rechecking exact ancestry, preserving migrations and package checks.
- PR #58/#59 are not a clean linear stack as currently described by PR metadata; inspect Git graph and compare against current default before creating the candidate.
- Do not enable hosted D1, GitHub write credentials, dispatch, provider calls or deployment in this implementation pass.
- No Gemini dispatch is authorized by this report. Gemini remains restricted to the approved controller and all controller/security/governance gates.
- Search for mature compatible components before building; the earlier source search found no drop-in D1/Cloudflare Workers replacement. Do not transplant incompatible SQLite/Postgres libraries.
- Keep the implementation branch separate from the documentation branch and preserve provenance to the exact source PR heads and default base.

## Next concrete step

Create a fresh implementation branch from the then-current default SHA, reconstruct the minimum compatible local proof source/migration/test set from #58/#59, then implement the orchestration boundary and negative-first D1 tests. Run local tests and exact-head CI. Keep all PRs unmerged until governance and post-launch independent qualification are completed.

## Acceptance boundary

This report is an author-side design decision only. It is not implementation, independent review, hosted D1 evidence, production qualification, deployment, or Contour A acceptance.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
