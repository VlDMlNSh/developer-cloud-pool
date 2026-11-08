# Immutable task attempt lifecycle — implementation and exact-head CI

Date: 2026-11-08
Status: LOCAL PROOF IMPLEMENTED / EXACT-HEAD CI VERIFIED / NOT PRODUCTION-QUALIFIED

## Target and branch provenance

- Repository: `VlDMlNSh/developer-cloud-pool`
- Implementation branch: `proof/immutable-task-attempts-final-ci-2026-11-08`
- PR: [#49 — Draft validation: Immutable attempt audit provenance](https://github.com/VlDMlNSh/developer-cloud-pool/pull/49)
- Exact PR head: `4ab0fdc4d649736a171faf95b9ab3a24b17217e8`
- Base: PR #40 head `2b7e30aeb8c404d84b2fe8bc36320aaa783520fb`; PR #49 is stacked on PR #40 and not based on default branch.
- PR #49 remains OPEN / DRAFT / UNMERGED. No merge or dispatch authorization.
- Earlier validation-only PRs #41–#48 are closed and unmerged. PR #49 is the current draft for this proof.

## Implemented source changes

- Migration `proofs/d1-ledger/migrations/0004_create_immutable_task_attempts.sql`: blob `0ad590ffdd2589f857257739275c15ed2d54d729`.
- Adapter `proofs/d1-ledger/src/task-attempts.mjs`: read back at exact head; local-only, `dispatch:false`.
- Tests `proofs/d1-ledger/test/claim-outbox.test.ts`: blob `c50342e0075ae6b394a0bac69503d03507b37d12`.
- README: blob `d46f42c00906fa817bc8a73385d4612a53897753`.
- Package script includes syntax check for `task-attempts.mjs`; dependencies and lockfile unchanged.

The migration adds:
- immutable attempt identity and sequential `attempt_number`;
- unique execution idempotency keys;
- task/attempt identity guards and current-attempt pointer validation;
- explicit lease-attempt binding and generation fencing;
- guarded status transitions;
- append-only attempt events, retaining actor ID and lease generation for acquisition/takeover, indeterminate transition and terminal finalization;
- transactional task terminal projection on attempt finalization.

The adapter separates lease acquisition/takeover from execution retry. Takeover requires an explicit resumable assertion. Expired work with unknown outcome becomes indeterminate and blocks blind retry/takeover. Terminal failed attempts are retained; a new retry creates a new immutable attempt row. All outcomes retain `dispatch:false`.

Legacy `task-lease.mjs` and its scalar `attempt_count` remain for historical regression proof; they are not the new attempt model and are not backfilled into fabricated attempt records.

## Exact-head CI evidence

Both runs are tied to exact PR head `4ab0fdc4d649736a171faf95b9ab3a24b17217e8`:

| Run | Job | Result |
|---|---|---|
| [42492657024](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42492657024) | 128768175405 | COMPLETED / SUCCESS |
| [42492663954](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42492663954) | 128768195844 | COMPLETED / SUCCESS |

Each run:
- exact PR merge commit checked out;
- Node.js 24.9.0 installed;
- `npm ci --ignore-scripts --no-audit --no-fund` succeeded;
- `npm run check` succeeded;
- Workers-runtime D1 suite: 2 files, 35/35 tests passed (13 consume + 22 claim/attempt);
- lockfile artifact upload succeeded.

Artifacts:
- Run 42492657024: ID `13622435809`, 18,253 bytes, SHA-256 `04f47480b47477ccabdd4400b4545461692f7a3c917b8b8e86d0190eada48e42`.
- Run 42492663954: ID `13621657946`, 18,253 bytes, SHA-256 `d1232b88b690a31dac00b7b5029ee8f27d583fd8b208d55917ee7d95572d6526`.

## Findings / limitations

- Local Workers-runtime migration, adapter and adversarial tests: VERIFIED for this exact PR merge commit.
- Remote D1 provisioning/qualification: NOT RUN.
- Supervisor / reusable Worker integration: NOT RUN.
- Real worker or provider/model execution: NOT RUN.
- Secret isolation in deployed environment: NOT VERIFIED.
- Production crash/recovery and external side-effect idempotency: NOT VERIFIED.
- Independent authorized security/governance review: NOT RUN.
- PR #49 review submissions and inline threads: none observed at last check.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

## Default-branch write correction disclosure

During this pass, one test-file update omitted the explicit branch argument and temporarily created commit `864ca5c1eb7f1e9c871a84b6bbb6b252c6921b32` on the repository default branch. The file was immediately deleted in commit `4d07526589676c6a381426db189c5a5c1528e1a3`. A fresh default-branch read returned 404 for that path, confirming the file is absent from the resulting default tree. No production source, workflow, secret, or runtime setting was changed by that mistake. The two commits remain visible in Git history and are disclosed here; no history rewrite was attempted.

## Next step

Obtain an authorized independent review of PR #49 exact head and its migration semantics. Then reconcile with PR #40 and PR #37, address remaining production integration and recovery gaps, and only after governance gates consider remote D1 qualification. Do not merge this local proof into default or enable dispatch.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
