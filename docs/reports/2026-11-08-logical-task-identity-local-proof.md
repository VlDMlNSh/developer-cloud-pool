# Logical Task Identity Local Proof — Implementation Pass

Date: 2026-11-08
Status: IMPLEMENTED IN ISOLATED DRAFT PR; CI NOT VERIFIED

## Immutable base and ancestry

- Implementation branch: `proof/task-identity-fencing-design-2026-11-08`.
- Parent PR #39 head / base commit: `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`.
- Draft PR #40: https://github.com/VlDMlNSh/developer-cloud-pool/pull/40
- PR #40 head at publication: `f83b2ae92898784e03feaebf54bf74563f570079`.
- PR #40 base: `proof/d1-claim-outbox-atomic-2026-11-07` @ `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`.
- PR #40 OPEN/DRAFT/UNMERGED. Changed files: contract, README, migration 0003, claim adapter, behavioral tests.

## Implementation

- Migration `0003_create_logical_task_identity.sql`: canonical task table keyed by SHA-256 task identity; many approval rows may attach to one task; one task-level delivery outbox row per task key. Legacy per-approval proof trigger is retained for existing tests.
- `claimLogicalTask`: canonicalizes versioned identity from repository ID, issue number, target SHA, profile and task revision; computes SHA-256; conditionally consumes an individual approval and uses transactional SQL triggers to create/attach the logical task and one outbox event.
- Adapter returns `dispatch:false`; no provider, GitHub dispatch, credentials, or production integration.
- Added tests: two distinct approvals racing for same logical task; different target SHA creates a distinct task; exact retry reuses task/outbox.
- Existing per-approval proof remains available for regression coverage.

## Evidence

- Migration blob: `7d8fb746c34527300dfab423106a7b7b9b316623`.
- Adapter blob: `37d75e2b31d9214b04398527eb08dce296f1ff27`.
- Test blob: `c8b6d753a653da665f848a53a280e7bcba7416ae`.
- README blob was re-read after publication; PR changed-file list confirms the intended five files.
- Exact-head workflow query for PR #40 head returned an empty list twice. Treat CI as NOT VERIFIED, not as pass.

## Limitations and risks

- No local command/test runner was available in this GitHub-only pass; test execution is NOT RUN.
- SQL migration and concurrent behavior have not yet been validated by the pinned Workers Vitest runtime.
- Lease acquire/renew/reclaim, generation increment, stale Worker/Finalizer rejection, durable audit and bounded delivery retries remain NOT IMPLEMENTED.
- Task key uses a versioned canonical tuple. A future explicit rerun must define task_revision semantics and fresh authorization.
- This is synthetic local proof only, not remote D1 or production qualification.
- PR #40 is stacked on PR #39 and must not merge independently into default. No merge performed.

## Safety and project status

- No secrets, keys, account billing, cloud resources, dispatch, deployment, provider/model calls or Gemini controller used.
- PR #36/#37/#39 remain unmerged; PR #40 is a draft proof layer.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

## Next

Obtain exact-head CI execution on PR #40 and resolve any SQL/runtime failures. Then implement lease generation fencing and stale-worker rejection as a separate bounded pass. Do not integrate with PR #37 until the claim/task identity and Supervisor/Worker/Finalizer contract align.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
