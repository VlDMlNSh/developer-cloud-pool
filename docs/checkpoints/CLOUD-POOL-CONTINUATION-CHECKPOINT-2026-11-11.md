# Cloud Pool continuation checkpoint — 2026-11-11

## Recovery point

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch: `Основной`.
- Default HEAD before checkpoint publication: `b2c015add1474cf8932b69bb3bc8596e710f9141`.
- Context Window blob before checkpoint publication: `73faa5936f22b7405928a2737708798d69b71e92`.
- Latest audit: [Issue #38 claim backend / PR #64 current-head recheck](../reports/2026-11-11-issue38-claim-backend-current-head-recheck.md).
- Report blob: `268dede5d1040b31953b2141444ebbe509f5c11a`.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md

## Current phase and priority

Contour A — Cloud Development Pool. Do not begin Contour B / MediaHub product implementation until Contour A is launched, qualified and independently accepted.

## Current status

- Contour A: BLOCKED / NOT ACCEPTED.
- Issue #38 durable single-use claim: OPEN / NOT QUALIFIED.
- PR #37 reusable Supervisor → Worker boundary: OPEN / DRAFT / UNMERGED; F2 finalizer authority gap remains HIGH / OPEN.
- PR #54 local D1 contention proof: OPEN / DRAFT / UNMERGED; exact local Workers-runtime CI run 43010770730 / job 130489510967 SUCCESS. Local Miniflare/workerd only, not hosted proof.
- PR #64 backend fit documentation: OPEN / DRAFT / UNMERGED; head `95d237c753bec96abe9add621140928511047599`, base `6fdcedebeba62715122e43a75c6ad6d926321ce7`; compare to current default `9aa719ce4b68519191cb6bb8e8fe0fe447dc7a38`: DIVERGED 51 ahead / 2 behind; 16 changed files, all documentation; exact-head CI query empty; reviews 0; mergeable false.
- Hosted D1: NOT AUTHORIZED / NOT RUN. Prior read-only Cloudflare inventory: 0 D1 databases, 0 Worker scripts, 0 Durable Object namespaces. Account-specific plan/quota and resource permission NOT VERIFIED.
- Supervisor dispatch: FAIL-CLOSED. Do not enable either dispatch gate.
- Independent review/governance: NOT VERIFIED.
- Contour B: DEFERRED.

## Current backend decision

D1 remains PREFERRED FOR HOSTED PROOF, NOT QUALIFIED. D1 Free product documentation currently states 5m rows read/day, 100k rows written/day, 5GB total storage. Each D1 database is single-threaded; `batch()` is transactional. Ambiguous caller timeout is not proof a write failed; authoritative read-back/reconciliation is required before retry.

SQLite Durable Objects are a native Free-plan alternative with actor semantics, but they add a different state API and lifecycle. Defer unless hosted D1 evidence reveals a concrete per-task actor requirement. Do not create dual D1/DO authorities.

Mature OSS fit checked: pg-boss and Graphile Worker require PostgreSQL and are not drop-in D1 dependencies; Temporal requires a separate service platform; pgtask requires PostgreSQL 16+. No new dependency adopted.

## Required next work

1. Re-read live refs, current default HEAD, PR #37/#54/#64, Issue #38, exact-head CI, formal reviews and governance.
2. Narrow/split PR #64 because it combines Issue #38 backend material with unrelated provider/agent documentation; do not merge it as-is.
3. Reconcile the minimum PR #39/#54 claim/attempt code stack onto a fresh branch from current default, pinned to immutable SHA. Keep attempt-aware lifecycle canonical; quarantine legacy lease mutation APIs.
4. Complete authenticated issuer, trusted-time, revocation, lease/fencing, conditional finalization and audit threat model.
5. Only after source reconciliation, CI, account-specific Free entitlement/quota proof and explicit owner authorization may one isolated D1 database and one test-only Worker be provisioned.
6. Hosted proof must use 50 independent concurrent HTTP requests, not a sequential SQL batch; prove one task/outbox, idempotent replay, rollback, lost-response recovery, restart and zero external side effects.
7. Obtain independent security/governance review. No merge or production adoption before all gates.

## Safety invariants

- No secret values, tokens, credentials or provider API calls.
- No paid fallback or billing/plan changes.
- No speculative resource provisioning.
- No Worker/DSH/Resource Probe execution or model/provider calls.
- No dispatch, deployment, merge or gate change without explicit authorization and verified evidence.
- Missing/empty CI or review evidence is NOT VERIFIED.
- Draft PRs are proposals, not accepted implementations.

## Canonical context

- [GITHUB-CONTEXT-WINDOW.md](../context/GITHUB-CONTEXT-WINDOW.md)
- [Latest claim backend audit](../reports/2026-11-11-issue38-claim-backend-current-head-recheck.md)
- [Issue #38](https://github.com/VlDMlNSh/developer-cloud-pool/issues/38)
- [PR #37](https://github.com/VlDMlNSh/developer-cloud-pool/pull/37)
- [PR #54](https://github.com/VlDMlNSh/developer-cloud-pool/pull/54)
- [PR #64](https://github.com/VlDMlNSh/developer-cloud-pool/pull/64)

This checkpoint is a recovery aid, not an execution or provisioning authorization.


## PR #53 target SHA binding remediation — 2026-11-11

- Latest default before checkpoint refresh: \`f18dff4d06a74f1d7b15ac98df7ca359bf3a3012\`.
- PR #53 branch final head: \`56cd2b9deff91d9308ed877965252f317222f597\`; base \`1be8672c1be1a720b6c813dcafff5c020b6456ae\`; 31 ahead / 0 behind.
- Added strict single Target SHA extraction from immutable issue body and finalizer-side equality check; runner passes TARGET_SHA; unit tests increased to 11.
- Final source blobs: finalizer \`d21e4dbeeacebd6f2bc1bfa1bbc5756b3baaa5ab\`; runner \`50e7206a2aa1edf02550ed9428ce0b13ad8b8b17\`; tests \`6b7fb8b07551c0fa20a7fd8efc57fdecdd940a08\`.
- Report: \`docs/reports/2026-11-11-pr53-target-sha-binding-remediation.md\`, blob \`09ff6c89836ce17492befbeb025b1ddf13ce266c\`.
- Exact-head CI for PR #53 returned no runs (NOT VERIFIED); tests not executed; reviews 0; inline threads 0; independent review NOT RUN.
- TARGET_SHA binding gap SOURCE-CORRECTED. F2 remains HIGH / OPEN due non-CAS GitHub label PATCH, split terminal-label/comment operations and missing runner fake-transport/reconciliation harness. PR #53 remains DRAFT / NOT QUALIFIED.
- No default runtime/schema/workflow/permissions/secrets/resources/dispatch/deployment/merge changes. Dispatch FAIL-CLOSED. Hosted D1 NOT AUTHORIZED / NOT RUN. Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Next: add injectable runner protocol and fake-transport tests for GET/PATCH race, lost PATCH response, label-success/comment-failure, and idempotent audit reconciliation. Exact-head CI and independent review required.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## PR #53 injectable Finalizer protocol — 2026-11-11

- Latest PR #53 head: 3458b01c99e0a3ed62e5469dc11631ec5316b0cd; base PR #37 head 1be8672c1be1a720b6c813dcafff5c020b6456ae; 43 ahead / 0 behind; OPEN/DRAFT/UNMERGED.
- Report: docs/reports/2026-11-11-pr53-finalizer-transport-reconciliation.md.
- Added injectable Finalizer transport; deterministic audit marker is posted and read back before terminal labels; lost POST/PATCH responses are reconciled by read-back; duplicate/conflicting markers fail closed; repeated finalization is idempotent.
- Reused local fake projection/reconciler design from PR #58; no new dependency.
- Exact-head CI for 3458b01c99e0a3ed62e5469dc11631ec5316b0cd: run 43042039819 Pool Contract Validation SUCCESS (19/19 tests); run 43042039837 Reusable Pool Worker Boundary Validation SUCCESS.
- Final blobs: protocol c69a8a6bd465ade382e3f576ac557390c4f0a541; runner 4b4b168624502ad38454a394af7faf4104919deb; tests 88fcf67c99afd97605eb1726c68d79c8aa891f0c; validator e400c4c9823ccf5f8d75fb066131df24d8d0f889.
- Residual F2 HIGH / OPEN: test explicitly demonstrates concurrent human labels can be overwritten by non-CAS GitHub label PATCH despite successful read-back. This is not fixed. Independent review NOT RUN; PR reviews/threads 0/0.
- Active default ruleset requires 0 approvals and no CODEOWNERS review, so it does not enforce independent review. Issue #38 OPEN / NOT QUALIFIED. Dispatch FAIL-CLOSED. No live API race, hosted D1, resource creation, deployment, merge, or default runtime change.
- Next: reconcile PR #39/#54 transactional conditional-write/outbox with Issue #38 and PR #58; design authoritative transactional Claim Store and retryable GitHub projection. Hosted D1 remains NOT AUTHORIZED / NOT RUN.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## Claim / attempt / projection proof-stack reconciliation — 2026-11-11

- Report: ../reports/2026-11-11-claim-attempt-projection-stack-reconciliation.md
- Default snapshot before report: b4d2a335d2a89372eb618dcda50b09f97b36a946.
- PR #39 per-approval conditional consume/outbox exact CI: 42329993548 and 42329991471 SUCCESS (local Workers/D1 only).
- PR #54 logical task, 50-way contention (prior run 42537241204/job 128904147572), immutable attempt/lease/finalization/reconciliation/projection outbox; current exact PR run 43010770730/job 130489510967 SUCCESS. Local proof only.
- PR #58 fake GitHub projection reconciler exact PR run 42979949181/job 130387805034 SUCCESS; push run 42979945524 SUCCESS. Fake API only.
- PR #53 exact head 3458b01c99e0a3ed62e5469dc11631ec5316b0cd CI 43042039819 and 43042039837 SUCCESS (19/19 transport/planner tests); known non-CAS whole-label PATCH race remains HIGH/OPEN.
- PR #54 outbox is not yet wired to PR #58 projection consumer. PR #53 is a parallel direct GitHub finalization path, not authoritative. The target composition must use the transactional Claim/Attempt Store as sole authority and GitHub as retryable projection.
- Issuer authentication, trusted time/revocation/nonce, hosted D1 eligibility/deployment, actual service wiring and hosted/failure qualification remain missing. No new dependency needed.
- No runtime, secret, resource, dispatch, deployment or merge action. Issue #38 OPEN/NOT QUALIFIED; dispatch FAIL-CLOSED; Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Next: define backend-neutral integration contract for PR #54 attempt finalization/outbox → PR #58 projection; add local cross-module idempotency and projection-isolation tests.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## Attempt Outbox → Projection adapter — 2026-11-11

- Report: ../reports/2026-11-11-attempt-outbox-projection-contract.md (commit 75416ea836561cb08a768531c6f7094870c214e3).
- PR #58 head 5caeb60f7a45d836c6ad1eea2fb86e20995da025, OPEN/DRAFT.
- Added pure projection-envelope mapper from attempt outbox row to reconciler envelope, contract document, 5 mapper/reconciler tests, and syntax check.
- Exact-head push 43043277262 SUCCESS; PR run 43043284086 SUCCESS; job 130600450879. 4 files / 55 tests passed, 0 failed.
- Blobs: mapper cb1fb8b130c66343ca3b1c071aac506113c4cfb0; tests 14fd64aa76d1cc97ea45fc1ecfa6d80e28bc8624; contract 712b4080e16c1405c1869e1a43232993c05ec216; package ebfcf2b311871694904516b245222425fa9c38f8.
- Still no integrated D1 delivery actor or hosted qualification. Failure isolation test is interface-level only. Issue #38 OPEN/NOT QUALIFIED; dispatch FAIL-CLOSED; Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Next: local delivery orchestration over fenced projection lease → mapper → injected fake GitHub API → fenced D1 acknowledgement/retry, with failure, stale lease and restart tests.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## PR #59 Projection Dead-Letter Policy Audit — 2026-11-11

- Report: ../reports/2026-11-11-pr59-projection-dead-letter-audit.md (commit 0a2a5c902cb1b110951ac78e8e4ac7c43135fec9).
- PR #59 head 22200226da4f1af30645cf441a639db6893e9310; exact-head push 42981803947 SUCCESS; PR run 42981807825 SUCCESS; 3 test files / 53 tests passed.
- Retry budget 5, backoff 30/60/120/240s, dead-letter terminal triggers, monotonic attempt counter, append-only delivery evidence are SOURCE + CI VERIFIED local proof.
- Limitation: expired-fifth-lease transition requires original worker ID; not an independent reaper. Caller workerId/now are not authenticated/trusted. PR #60 issuer/time contract remains design-only.
- PR #59 is based on older PR #58 head 6f7953e4abec3cc564984ee3635cdb7717ae5d5e and does not include current mapper at 5caeb60f7a45d836c6ad1eea2fb86e20995da025.
- No new dependency selected. Issue #38 OPEN/NOT QUALIFIED; dispatch FAIL-CLOSED; Contour A BLOCKED/NOT ACCEPTED; Contour B DEFERRED.
- Next: reconcile PR #59 ancestry with current PR #58 mapper, then local fake delivery actor proof; keep orphan recovery blocked pending accepted issuer/trusted time.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## PR #58/#59 ancestry reconciliation — 2026-11-11

- Default HEAD observed: `8a64a18260ee0b7f2ed4bdac8c47471db3833042`.
- PR #58 head `5caeb60f7a45d836c6ad1eea2fb86e20995da025`; PR #59 head `22200226da4f1af30645cf441a639db6893e9310`.
- GitHub Compare reports DIVERGED: PR #59 has 10 commits beyond merge-base and lacks 4 commits from current PR #58; merge-base `6f7953e4abec3cc564984ee3635cdb7717ae5d5e`. Mapper/integration contract from #58 are therefore not validated together with #59 dead-letter changes.
- Exact-head runs: #58 `43043284086` SUCCESS; #59 `42981807825` SUCCESS. Separate heads only; combined integration NOT VERIFIED.
- Reviews: #58 0/0, #59 0/0 (formal/inline). Ruleset 26550182 active; 0 required approvals, so independent review remains separately required.
- OSS fit: Ledgerline demonstrates DO-authoritative stream + D1 projection/outbox, but is not a drop-in and changes authority model. No dependency adopted; free-tier eligibility unverified.
- Decision: no force-push/rebase/retarget/merge/dispatch/provisioning. Next: inspect patches, create immutable integration branch and reconcile minimum mapper + retry/dead-letter stack, then exact-head CI and independent review.
- Report: docs/reports/2026-11-11-pr58-pr59-ancestry-reconciliation.md.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## PR #58/#59 code and migration compatibility audit — 2026-11-11

- Audit base `Основной` HEAD: `dd1303879d1e8d4f89f83c18c5671b3712656e28`; #58 HEAD `5caeb60f7a45d836c6ad1eea2fb86e20995da025`; #59 HEAD `22200226da4f1af30645cf441a639db6893e9310`.
- #58 adds mapper + fake reconciler as additive files; #59 modifies outbox/migrations/tests/workflow. No unified candidate or CI exists.
- Integration hazard: #59 package check omits `projection-envelope.mjs`, while #58 includes both envelope and reconciler. Preserve both checks.
- Migration order is 0006 → 0007 → 0008; 0007 replaces status event trigger. Workflow branch filters require union, not overwrite.
- Critical liveness gap: expired fifth lease cannot be reacquired; deadLetterExpiredProjection requires original worker identity/generation, so no independent reaper exists.
- Critical enforcement gap: acknowledgeProjectionDelivered does not enforce a persisted `projection_verified` proof; `now` and workerId remain caller-supplied, not trusted/authenticated.
- No branch mutation/dispatch/deployment in this pass. Next: local-only integration candidate from immutable #58 HEAD, preserving syntax/workflow filters and migrations, add regression tests for orphaned fifth lease and unverified ack, then full D1 tests + exact-head CI.
- Report: docs/reports/2026-11-11-pr58-pr59-code-migration-compatibility-audit.md (blob `f36345c08f37303aea56e11678e63facfb3163c5`).
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## Projection audit actor retention fix review — 2026-11-11

- Candidate branch `fix/projection-audit-actor-2026-11-11` HEAD `b9731547afaefde2d22e704122e73615ce85876c`; implementation `8776e967688dc891c86f6d3ba50b97e8dc897c83`; test `46a2ed2777a7fc2b15bd0898c9ceb9a04f5607d9`; CI wiring `b9731547afaefde2d22e704122e73615ce85876c`.
- Patch fixes audit actor loss on leased→terminal/retryable transitions by retaining OLD.lease_owner. Regression tests verify delivered/retryable event actor + generation.
- Exact branch run `43010555851` SUCCESS; job `130488783673`; syntax check and 40/40 tests passed. Artifact SHA256 `64e3ea398b90155a2e7b914ceb143e706cdc670ad154500705fcd1cf5860ff83`.
- Branch is not a PR; diverged from current #58 (3 ahead, 12 behind, merge-base `ec3f3266ca28c4fb5633a9475cc6f396a467797`). Thus current stack compatibility NOT VERIFIED.
- Semantics caveat: patch records previous lease holder, not necessarily actor initiating status transition; contract should define actor_id as lease owner whose lease is closed. Non-leased status transitions still may have NULL actor. No independent review or hosted qualification.
- Report: docs/reports/2026-11-11-projection-audit-actor-retention-review.md (commit `7f90d6ffa7aaa0acefc09ce74231d33b75029094`).
- Next: include this patch in integration plan, clarify event actor semantics, then build a fresh integration candidate from current #58 HEAD with #59 changes and this correction; run complete tests + exact-head CI. No merge/deploy/dispatch.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
