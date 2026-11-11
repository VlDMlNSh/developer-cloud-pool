# Projection delivery stack — source and compatibility audit

- Date: 2026-11-11
- Status: SOURCE AUDIT COMPLETED / INTEGRATION NOT QUALIFIED / NO RUNTIME CHANGE
- Immutable default-branch target: `Основной@221f216c00ca7e5596bcc682ba185ad155a10603`
- Compared proof heads: PR #58 `5caeb60f7a45d836c6ad1eea2fb86e20995da025`; PR #59 `22200226da4f1af30645cf441a639db6893e9310`; audit-actor fix branch `b9731547afaefde2d22e704122e73615ce85876c`.
- Scope: source-level compatibility and security review of the local D1 terminal projection/outbox proof, bounded retry/dead-letter policy, fake GitHub reconciler and audit actor retention patch.
- Non-goals: rebase/cherry-pick/merge, schema/runtime changes, hosted D1, live GitHub writes, credentials, workflow dispatch, deployment, or Recovery Grant issuance.

## 1. Current refs and ancestry

- Current default HEAD observed from repository commit search: `221f216c00ca7e5596bcc682ba185ad155a10603`.
- PR #58 head: `5caeb60f7a45d836c6ad1eea2fb86e20995da025`.
- PR #59 head: `22200226da4f1af30645cf441a639db6893e9310`.
- Compare #58 → #59: 10 commits ahead / 0 behind; PR #59 is a direct stack on PR #58's earlier exact head `6f7953e4abec3cc564984ee3635cdb7717ae5d5e`.
- Compare current default → #58: DIVERGED, 141 ahead / 62 behind; merge base `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- Compare current default → #59: DIVERGED, 147 ahead / 62 behind; same merge base.
- The audit-actor branch `b9731547afaefde2d22e704122e73615ce85876c` is DIVERGED from #59: 3 ahead / 18 behind, merge base `ec3f3266ca28c4fb5633a9475cc6f396a4677974`.
- The source paths `proofs/d1-ledger/**` are absent from current default branch. The proof stack must not be merged wholesale or described as current default implementation.

## 2. Reconciled implementation facts

- PR #58 contains a pure projection-envelope mapper and an injected fake-GitHub reconciler. It handles deterministic event markers, ambiguous comment POST read-back, duplicate/digest conflict detection and managed-label convergence. It has no real GitHub API client or credentials; all results retain `dispatch:false`.
- PR #59 adds migrations 0007/0008, five-attempt ceiling, 30/60/120/240 second retry backoff, monotonic attempt count, terminal dead-letter guards and append-only delivery events. Exact-head PR CI recorded for #59: run `42981807825`, job `130393715595`, COMPLETED/SUCCESS; 3 Workers-runtime test files / 53 tests passed. This is local Miniflare/workerd D1 evidence only.
- The fake reconciler's exact-head evidence for PR #58 was run `42979949181`, job `130387805034`, COMPLETED/SUCCESS, plus push run `42979945524`. This is a fake API protocol proof, not live GitHub interoperability.
- The audit-actor patch changes migration 0006's status-event actor selection and adds regression assertions. Its branch exact-head run previously recorded as `43010555851` SUCCESS, 40/40 tests. It is not stacked on #59 and diverges from it.
- Migration 0007 on PR #59 drops/recreates the status-event trigger with `COALESCE(NEW.lease_owner, OLD.lease_owner)`. For leased→retryable/delivered/dead_letter transitions, this retains the prior lease owner after the update clears NEW.lease_owner. Therefore the separate actor patch's core migration correction is already represented in the later #59 trigger definition; cherry-picking the old migration 0006 patch blindly would be redundant and risks divergent history. The test assertions still need a clean, explicit carry-forward if not already present in #59.

## 3. Blocking correctness gaps

1. **Acknowledgement is not coupled to verified projection evidence.** `acknowledgeProjectionDelivered(db, outboxId, workerId, generation, now)` accepts only the lease identity/generation/time. It does not require a verifier-produced `projection_verified=true` receipt or event digest. A caller can invoke the D1 acknowledgement API without proving that the fake/real projection adapter completed and read back the terminal marker and labels. The D1 status can therefore become delivered without a verified projection.
2. **Dead-letter remains same-owner only.** `deadLetterExpiredProjection` requires the supplied worker ID and delivery generation to match the existing expired lease. It is not an independent supervisor/reaper and cannot recover an orphaned fifth lease after the worker disappears. This is intentionally authority-gated; do not widen it without a separately accepted Recovery Grant issuer and trusted-time boundary.
3. **No full integrated delivery actor exists.** Current proofs are separate: lease/outbox D1 adapter, pure mapper, and fake GitHub reconciler. No integrated orchestration proves fenced lease → mapper → projection API → verified receipt → D1 acknowledgement, including failure/ambiguous result, stale lease, process restart and D1 snapshot assertions.
4. **Time and actor inputs remain caller supplied.** `now` and worker identity are adapter inputs in the local proof, not qualified trusted time or authenticated workload identity.
5. **No hosted qualification.** No live D1 contention, production credentials, GitHub API race, durable hosted audit sink or deployment is demonstrated.

## 4. Recommended bounded next implementation

After establishing a clean immutable integration branch from the current default and reviewing its present code, port only the minimum proof files from #58/#59 (do not transplant their stale commit ancestry). Add a local-only delivery orchestrator behind injected dependencies:
- acquire fenced lease;
- derive envelope only from the committed outbox row;
- invoke injected projection sender/reconciler;
- accept only a verifier-produced receipt bound to outbox ID, event digest and lease generation;
- acknowledge only with that receipt while lease is current;
- mark retryable on retryable/ambiguous outcomes, never acknowledge;
- dead-letter only under the separately authorized same-owner rule for now;
- test success, sender failure, ambiguous POST, read-back mismatch, stale lease, restart/reconciliation and no-dispatch invariant.

Before implementation, inspect the current exact default workflow/test conventions and preserve migration order 0006→0007→0008 and both projection and package checks. Run focused tests and exact-head CI on the new branch. Keep dispatch disabled.

## 5. Disposition

- PR #58: OPEN / DRAFT; local fake projection proof only.
- PR #59: OPEN / DRAFT; local retry/dead-letter proof only.
- Audit-actor branch: not a PR; separate ancestry; no merge.
- Integrated delivery actor: NOT IMPLEMENTED.
- Hosted D1: NOT RUN / NOT AUTHORIZED.
- Recovery Actor independent orphan recovery: BLOCKED by issuer/trusted-time/audit authority prerequisites.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

No secrets, tokens, API keys, provider calls, live GitHub writes, hosted resources, dispatch, deployment, schema/runtime changes or merges were performed.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## Source-review correction — reconciler success receipt semantics (2026-11-11)

A full read of the tail of `proofs/d1-ledger/src/projection-reconciler.mjs` corrects an earlier abbreviated interpretation: after comment marker verification and final managed-label read-back, the success path returns `decision: PROJECTION_VERIFIED` and `projection_verified: true`, together with `eventId`, `payloadDigest` and the verified managed labels. It does not always return false.

The actual integration gap remains at the D1 acknowledgement boundary: this result is not a signed/opaque receipt bound to the acquired delivery lease generation, and `acknowledgeProjectionDelivered` accepts no reconciler result/receipt at all. The reconciler result does not echo a verified lease-generation binding. The D1 acknowledgement can therefore be called without proving that the exact outbox event and current fenced delivery lease produced the verified external projection.

Required correction: define a receipt schema bound to `outboxId/eventId`, `eventDigest/payloadDigest`, `leaseGeneration`, and verified projection state; construct it only after the reconciler's final read-back; validate it within the same D1 conditional acknowledgement update/read-back path. Do not call it cryptographic or signed unless a real verifier/signature mechanism is implemented and qualified.
