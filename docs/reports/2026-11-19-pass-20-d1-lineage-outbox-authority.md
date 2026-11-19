# Pass 20 — D1 migration lineage and task-outbox authority audit

Date: 2026-11-19
Status: VERIFIED — source lineage and compatibility findings recorded. No SQL migration was changed or applied.

## Immutable refs revalidated

- Default `Основной`: `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`; tree `c8c78a26a6359ec868922e4040c2870eec873b66`; commit signature verified.
- `integration/d1-current-base-2026-11-19`: same SHA/tree as default.
- PR #67 head `a53f6232bd5b50d3e150addf528b8e722002f9dd`, base `Основной` at `221f216c00ca7e5596bcc682ba185ad155a10603`.
- PR #72 head `a391f5c9b08c7ccfc12d966bf8e085c1966bfb31`, stacked on PR #67 head.
- PR #111 head `687196738782432797bf394f1342cb9df19f478f`, base `Основной` at `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- PR #146 head `4aeb9bddecd747ca533ba5619be83fc4809e2a95`, base current default. OPEN/DRAFT/UNMERGED.
- Issue #140 OPEN. Owner's bounded non-production authorization comment #7014947185 remains present; no authority for production, paid services, route changes, dispatch enablement or governance changes.
- PR #146 reviews: 0; inline review threads: 0.
- Default combined status: pending / 0 contexts — NOT VERIFIED.
- Active ruleset #26550182 remains on `refs/heads/Основной`, requires PR and thread resolution, no bypass actors; formal independent review is still not evidenced.

## Migration lineage — exact object ownership

| Lineage | Migration | Blob SHA | Finding |
|---|---|---|---|
| PR #67/#72 | 0001 approval ledger | `a80524ed839b63dd6483978118619495fa550877` | profile CHECK hardcodes retired `dsh-headless-probe` |
| PR #146 | 0001 approval ledger | `c14951239dfd6f93e20184f46373a8d13b62a69f` | CODE profile `jarvis-code-sandbox-v1`; competing root version |
| shared #67/#72/#111/#146 | 0002 claims/outbox | `44b8f7e0658296d287269770c5e91b1c3e25973c` | approval-keyed `pool_task_claims` and `pool_task_outbox` |
| shared #67/#72/#111/#146 | 0003 logical task | `49b0798871429d7961e81eb1d86ad892dba0b9b9` | adds `pool_tasks`, `pool_task_approvals`, task-keyed `pool_task_delivery_outbox`; keeps a legacy approval-keyed trigger path when `task_key IS NULL` |
| shared #67/#72/#111/#146 | 0004 attempts | `0ad590ffdd2589f857257739275c15ed2d54d729` | immutable attempt/event lifecycle |
| shared #67/#72/#111/#146 | 0005 reconciliation | `7a19897f6197c79517170e101e4cbf1db233cac6` | non-authorizing indeterminate-attempt reconciliation queue |
| PR #67/#72 | 0006 projection outbox | `660fa9de99ed78fe083bb627d6a61dbf0bd65c25` | creates distinct terminal-attempt projection outbox |
| PR #111/#146 | 0006 lease guard | `0610c4ee63f338e9b4d4db30ffe6fdffbaf6d854` | same filename ordinal collision; must be a new additive migration after #67's 0006 |
| PR #67/#72 | 0007–0010 | `767d95a30fa0a14c79e88c8c58392bfec9cdddc2`, `1d9385dd371f3404c52ec15fce03b0a14d384ab1`, `86919425f498dc634329bb783a3ca6ae7a0ff6a1`, `30ac9d0ed0cbede9586c365578c606b47bcce1a7` | projection retry/dead-letter, monotonic attempts, immutable projection identity, comment-post/ACK gates |
| PR #146 | 0007 executor binding | `47c2f0f7db6379e6760317fe3903214f6f31ffee` | adds executor instance identity; must be renumbered after canonical #67 0001–0010 lineage |
| PR #72 | 0011 admission | `39e3da8ccf2f3e82cb7fd8fc858536aa8757b5bc` | incompatible unchanged: route qualification CHECK hardcodes retired profile |

## Confirmed blockers

### 1. Competing task-ready outbox authorities

Migration 0002 creates approval-keyed `pool_task_outbox` and `pool_task_claims`.
Migration 0003 creates logical `pool_tasks`, `pool_task_approvals` and one task-keyed `pool_task_delivery_outbox`, but deliberately preserves a legacy trigger for approvals whose `task_key IS NULL`.

PR #146 migration 0007 replaces only `pool_approval_consumed_creates_claim_outbox` for the task-keyed path. It does not remove `pool_approval_consumed_legacy_claim_outbox`. The current `claimAndEnqueue` adapter still performs a consume without setting `task_key` and reads the approval-keyed claim/outbox pair. Therefore both task-ready routes remain callable in the candidate.

**Decision:** `pool_task_delivery_outbox` is the only candidate for authoritative task-ready intent because it is unique per logical task and used by `claimLogicalTask` and admission. The approval-keyed tables are legacy proof artifacts, not a second supported queue. Before qualification, a new additive migration and adapter/test cleanup must retire the legacy trigger and prevent new legacy writes. Existing tables may remain inert for historical evidence until data-retention policy is decided. Do not drop them casually.

### 2. Projection outbox is a separate concern

`pool_attempt_projection_outbox` (PR #67 migration 0006) records terminal attempt projections to an external destination. It is not a competing task-ready queue and should remain a separate outbox with its own retry, dead-letter and comment-post state machine.

### 3. Migration ordinal collision

PR #67 already assigns 0006–0010 to projection delivery. PR #111 and PR #146 assign 0006 to the running-attempt lease guard. PR #146 then uses 0007 for executor identity, colliding with PR #67's projection retry migration 0007. Do not combine files by filename or overwrite an ordinal. The lease guard and executor binding must be new monotonically increasing migrations after the chosen #67 chain.

### 4. Admission PR #72 is not transplantable unchanged

- Migration 0011 CHECK requires `capability_profile = 'dsh-headless-probe'`.
- Adapter `admit-qualified-task.mjs` validates `approval.profile === 'dsh-headless-probe'`.
- Its canonical task-key input omits executor identity; PR #146's logical task key includes `executorId`. The two task-key algorithms therefore disagree.
- The admission schema/adapter must be adapted to CODE profile and the current executor-bound task identity as a semantic change, not a global string replacement.
- The admission schema does not by itself qualify a real route issuer, provider account/quota or running host/process; it records trusted qualification evidence supplied by a separate authority.

## Candidate manifest proposal — NOT APPROVED / NOT APPLIED

Preserve historical migrations 0001–0010 from the #67 lineage, but use the CODE-profile 0001 blob from PR #146 only after clean-base migration tests prove the full set. Then append new additive migrations with unique ordinals, for example:

1. 0001–0010: canonical #67 ledger/task/attempt/reconciliation/projection lineage; 0001 profile variant must be CODE.
2. 0011: retire the legacy approval-keyed trigger path; keep legacy tables inert until retention/compatibility is reviewed.
3. 0012: executor identity binding, adapted from PR #146 0007.
4. 0013: running-attempt current-lease guard, adapted from PR #111 0006.
5. 0014: qualified admission, adapted from PR #72 0011 with CODE profile and executor-inclusive task identity.

This is an ordering proposal only. It is not a migration manifest ready to apply. Exact SQL must be reconciled for trigger ordering, foreign-key behavior, old proof fixtures, admission uniqueness, revocation and replay. All old migrations remain immutable; do not edit already-applied migration files.

## Mature component / platform research

- Cloudflare's official D1 migration contract uses sequentially ordered SQL migration files and records applied migrations in `d1_migrations`; it documents additive migration ordering and the configured migration directory: https://developers.cloudflare.com/d1/reference/migrations/
- Cloudflare's own Actors repository contains a monotonic SQL schema migration runner that explicitly says to never change already-applied migrations: https://github.com/cloudflare/actors/blob/main/packages/storage/src/sql-schema-migrations.ts
- Transactional outbox references confirm the domain write and event intent belong in one transaction and delivery is normally at-least-once with consumer deduplication, not exactly-once external effects: https://github.com/DavidInnocent/outbox-pattern and https://github.com/mjmirza/patterns/blob/main/patterns/10-microservices/transactional-outbox.md
- No external package is imported: these references validate the migration/outbox invariants, but do not replace the project's D1-specific trigger, executor identity, fencing and receipt contracts.

## Tests and execution boundaries

- No local test run in this audit.
- Existing PR #146 exact-head CI remains SUCCESS on `4aeb9bddecd747ca533ba5619be83fc4809e2a95`: D1 PR run `44582839780`, Pool Contract PR run `44582839702`, D1 push run `44582828669`. These validate only the candidate's present 0001–0007 set, not the proposed merged manifest.
- No SQL migration was changed/applied; no hosted D1, secret value, provider call, executor launch, dispatch, deployment, merge, agent dispatch or governance change.

## Next

Build a clean-base migration-composition qualification fixture with the proposed manifest and adversarial tests that prove: exactly one task-ready writer/reader; the legacy path cannot create claims; projection outbox remains independent; executor identity is included in task identity; lease guard rejects unleased running transitions; CODE admission binds current task/executor/profile and fails on stale/revoked route evidence. Run exact-head CI and obtain independent review before any hosted D1 operation.

Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

Canonical MediaHub OS map (reference only; Contour B deferred):
https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
