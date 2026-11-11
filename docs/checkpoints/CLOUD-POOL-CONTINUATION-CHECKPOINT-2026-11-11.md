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
