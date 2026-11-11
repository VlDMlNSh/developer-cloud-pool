# Claim / Recovery Source-to-Test Mapping — 2026-11-11

## Scope and immutable references

- Default baseline: `Основной@6fdcedebeba62715122e43a75c6ad6d926321ce7`.
- Proof sources are OPEN/DRAFT/UNMERGED PR heads; do not combine them as if already integrated into default.
- PR #36 head `e11fc90e50bd20b166207af64551c49cfa80ffb4`.
- PR #39 head `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`.
- PR #40 head `2b7e30aeb8c404d84b2fe8bc36320aaa783520fb`.
- PR #50 head `65233f57038a9996e4a6e939abde3642a33d467d`.
- PR #51 head `32c88e50e173e6b19bc6c61723ab6474a3c08145`.
- PR #53 head `b8a253f06418841d5f0250c9fd550bf3247db040`.
- PR #54 head `15a09c910f52553c59796260131a6b5a4a39c15f`.
- PR #63 documentation head `7bd818443d13cf3bba9f0f8c0b63e0689f68cd60`; PR #64 `95d237c753bec96abe9add621140928511047599`.
- Source blob anchors: logical task migration `49b0798871429d7961e81eb1d86ad892dba0b9b9`; attempt migration `0ad590ffdd2589f857257739275c15ed2d54d729`; reconciliation migration `7a19897f6197c79517170e101e4cbf1db233cac6`; projection migration `678a4aa8ce396a15f4f0ecbf908aa41fabc4d752`; task lease adapter `b41edf89cdf960b2c007f38ba16554dc179f021a`; attempt adapter `6cb028e048569700ed623d93462ef55e2392a084`; projection adapter `afdc133ad11a3a99ecb4b7168d5b8afcc1dc4dd6`; claim/outbox test `6178a10504a5914187c29bc3ed1ec209e3cd62f3`; PR #53 finalizer test `bfa3bfc9940f50befe1fdffe8d44ecc86ff32cfe`.

## N01–N20 mapping

| ID | Current source/test evidence | Assessment |
|---|---|---|
| N01 concurrent same-task claim | PR #54 `claim-outbox.test.ts`: 50 distinct approvals concurrently call `claimLogicalTask`; asserts one task key, one task delivery outbox, 50 attached approvals and 50 consumed grants. | LOCAL PROOF; not hosted D1 / independent HTTP contention. |
| N02 replay same grant | PR #36 `consume.test.ts`; PR #39 `claim-outbox.test.ts`: deterministic claim/outbox retry and pre-consumed same-timestamp rejection. | LOCAL PROOF. |
| N03 distinct grants for same task | PR #40 adds `0003_create_logical_task_identity.sql`; PR #54 repeats 50 independent approval contention. Task key binds repository, issue, target SHA, profile; task-level outbox UNIQUE(task_key). | LOCAL PROOF for same canonical task identity. Does not prove arbitrary malicious collision/canonicalization policy outside tested bindings. |
| N04 forged issuer/unsigned approval | No verified issuer signature, issuer registry, audience, subject or task capability validator in these D1 adapters. | GAP / NOT IMPLEMENTED. |
| N05 revoked issuer/key/principal | No revocation registry/check in claim path or attempt adapter. | GAP / NOT IMPLEMENTED. |
| N06 trusted time/skew | Helpers accept caller-supplied `now`; expiry checks are deterministic but not bound to a trusted service clock. | GAP / NOT IMPLEMENTED. |
| N07 commit succeeds / response lost | PR #36 consume adapter tests ambiguous storage exception and rollback; PR #39 claim/outbox tests rollback if outbox insertion fails; PR #54 attempt finalizer tests committed write with lost response and exact replay. | LOCAL PROOF for selected DB operations; no hosted D1. |
| N08 dispatch accepted / response lost | PR #51 adds indeterminate attempt state and reconciliation queue; test marks expired running attempt indeterminate and prevents blind retry. It does not demonstrate a real GitHub dispatch acceptance/response-loss adapter. | PARTIAL LOCAL DESIGN/PROOF; real dispatch reconciliation GAP. |
| N09 authoritative dispatch rejection | No provider dispatch adapter or authoritative rejection proof in D1 proof stack. | GAP / NOT RUN. |
| N10 delayed Worker after stale scan | PR #51 persists expired attempt reconciliation without clearing lease; test asserts lease remains held. No integrated delayed Actions run listing/reconciler. | PARTIAL LOCAL PROOF; supervisor integration GAP. |
| N11 worker crash at every transition | Selected DB rollback/ambiguous/finalization cases exist; no exhaustive crash matrix covering every supervisor, dispatch, worker and acknowledgement boundary. | PARTIAL; GAP for end-to-end recovery. |
| N12 stale generation heartbeat/finalizer | PR #54 `task-attempts.mjs`: renew/finalize conditional on current attempt, worker, generation and live lease. Tests stale renewal, stale delivery ack and finalization replay. PR #53 finalizer tests stale run/attempt generation and envelope. | LOCAL PROOF; not integrated production path. |
| N13 envelope mutation | PR #53 `pool-finalizer-fencing.test.mjs`: altered body digest rejected. D1 attempt identity stores immutable input digest and DB trigger blocks identity updates. | LOCAL PROOF; bridge between actual task envelope and attempt digest still needs integration. |
| N14 issue close/reopen or label conflict | PR #53 finalizer tests closed issue rejection; checks exact issue body, claimed label and generation. | LOCAL PURE-LOGIC PROOF; no live GitHub race/CAS guarantee. |
| N15 audit actor attribution | PR #54 migration records lease owner as actor in attempt events; tests assert worker actor and generation. Projection event tests assert delivery actor. | LOCAL PROOF; actor identity remains caller-supplied by helper, not authenticated. |
| N16 duplicate outbox delivery / consumer crash | PR #54 tests projection outbox lease generation, stale acknowledgement rejection, retryable/delivered/dead-letter event history. No consumer calling GitHub and no receiver-side idempotency proof. | PARTIAL LOCAL PROOF; external side-effect exactly-once not established. |
| N17 workflow token privilege | PR #37 boundary candidate and default workflow source audit. Ruleset does not require approvals. | GAP / GOVERNANCE BLOCKED; PR #37 not integrated and default still privileged. |
| N18 secret leakage / account confusion | No live secret reads (correctly avoided); local proof stack contains no provider secrets or external calls. | NOT QUALIFIED; no isolated hosted runtime proof. |
| N19 audit sink unavailable/full | Local DB transaction tests rollback on outbox insertion failure; no durable independent audit sink outage/quota test. | PARTIAL DB atomicity; operational audit sink GAP. |
| N20 backup restore/replay rollback | No restore/backup rollback test or monotonic generation/revocation restore proof found in the mapped sources. | GAP / NOT RUN. |

## Key architecture finding: two lifecycle APIs coexist

The current local proof stack contains both:

1. Legacy `task-lease.mjs` API: `acquireTaskLease`, `renewTaskLease`, `finalizeTaskLease`. It increments task lease generation and allows expired lease takeover based on task state/time; it is not attempt-ID-bound.
2. Attempt-aware `task-attempts.mjs` API: `createTaskAttempt`, `acquireAttemptLease`, `renewAttemptLease`, `finalizeTaskAttempt`, `markAttemptIndeterminate`. It binds current attempt ID, lease attempt ID, worker ID, generation and expiry. It retains a caller-supplied `resumable=true` switch for expired running attempt takeover.

The tests continue to exercise both APIs. There is no explicit negative cross-API test proving that a lease acquired/finalized through one API cannot be mutated or bypassed through the other. This is a high-priority contract gap: select one canonical attempt-aware lifecycle, retire or hard-disable the legacy API, and add cross-API stale-generation and state-transition tests before integration.

## Reconciliation authority gap

PR #51 creates a durable `pool_attempt_reconciliations` row when a running attempt becomes indeterminate. The test correctly verifies that lease owner/generation remain intact and retry is blocked. However:
- no resolver implementation was found;
- no issuer-bound reconciliation capability, execution evidence, run identity or revocation check is consumed;
- `resumable=true` is still a caller-provided boolean in `acquireAttemptLease`, not cryptographic/authoritative evidence;
- indeterminate attempts are correctly blocked from that takeover path, but the expired-running path still accepts the caller assertion.

Therefore the reconciliation queue is a durable work marker, not an authorization to resume, abandon or retry.

## Projection/outbox boundary

PR #54 provides local D1 proof of transactional creation of terminal projection intent, fenced outbox lease acquisition, stale acknowledgement rejection, and append-only delivery events. It does not implement an actual consumer that calls GitHub. A crash after GitHub accepts a mutation but before D1 acknowledgement can still repeat the external side effect unless the consumer uses stable idempotency and authoritative read-after-write reconciliation. Do not claim exactly-once GitHub projection delivery.

## Exact-head CI and review evidence snapshot

- PR #36 head: runs 42329438308 and 42329438351 COMPLETED/SUCCESS; combined status contexts empty. Reviews are COMMENTED only (3, same reviewer identity); no inline threads.
- PR #39 head: run 42329993548 COMPLETED/SUCCESS; statuses empty; reviews COMMENTED only (3, same reviewer identity); no inline threads.
- PR #40 head: run 42489887940 COMPLETED/SUCCESS; statuses empty; 0 reviews/threads.
- PR #50 head: run 42533097813 COMPLETED/SUCCESS; statuses empty; 0 reviews/threads.
- PR #51 head: run 42536377720 COMPLETED/SUCCESS; statuses empty; 0 reviews/threads.
- PR #53 head: workflow run list empty, statuses empty; 0 reviews/threads — NOT VERIFIED.
- PR #54 head: run 43010770730 COMPLETED/SUCCESS; statuses empty; 1 COMMENTED review by repository owner and 1 inline comment; no APPROVED review.
- PR #63 head `7bd818443d13cf3bba9f0f8c0b63e0689f68cd60`: no PR-triggered runs/status contexts — NOT VERIFIED.
- PR #64 head `95d237c753bec96abe9add621140928511047599`: no PR-triggered runs/status contexts — NOT VERIFIED.
- All proof PRs remain OPEN/DRAFT/UNMERGED. Their bases differ and form a stacked/diverged proof history; do not treat independent successful runs as one integrated exact-head build.

## Reuse search

Fresh GitHub repository search surfaced Cloudflare's official `cloudflare/workflows-starter` as a useful reference for durable workflow orchestration. It is not a replacement for the project's issuer-bound single-use grant, task identity CAS, or recovery authorization. Generic Durable Objects examples returned mostly small examples rather than a verified mature component meeting the full contract. Existing Cloudflare Workers Vitest + D1 and the repository's own migrations/adapters remain the most directly reusable proof stack. No new dependency selected.

## Governance and disposition

- Active ruleset #26550182 targets only `refs/heads/Основной`; requires PR but `required_approving_review_count=0`, no required reviewers, no CODEOWNERS review and no bypass actors. It does not enforce independent approval.
- Default branch remains `6fdcedebeba62715122e43a75c6ad6d926321ce7`.
- PR #63/#64 are documentation-only and remain draft/unmerged.
- No implementation, hosted provisioning, dispatch, provider calls, secret access, deployment, merge or permissions changes in this pass.
- Local proof coverage is materially stronger than the previous matrix snapshot, but operational issuer/revocation/time/audit trust, hosted D1, actual dispatch reconciliation, external projection consumer and restore/rollback remain unqualified.
- Contour A BLOCKED / NOT ACCEPTED. Contour B DEFERRED. Production dispatch FAIL-CLOSED.

## Next bounded step

1. Reconcile the stacked proof branches into a single immutable integration target only after independent authorized review; do not transplant stale branch histories wholesale.
2. Choose attempt-aware lifecycle as the only canonical lease/attempt path; remove or hard-disable legacy `task-lease.mjs` and add cross-API negative tests.
3. Replace caller-controlled `resumable` with a verified reconciliation capability bound to attempt ID, task key, execution ID, generation, evidence digest, issuer, audience, expiry and revocation state.
4. Implement a test-only outbox consumer contract with stable external idempotency and read-after-write reconciliation; fault-inject accepted-write/lost-ack.
5. Add restore/replay and audit sink outage tests.
6. Keep production dispatch disabled until governance, issuer, trust, hosted account and independent review gates are satisfied.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
