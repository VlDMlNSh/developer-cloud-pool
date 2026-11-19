# Pass 30 current snapshot — 2026-11-19

- Default branch `Основной`: `b81d2b5203f98fd0a66ea4ce2eac77bd48adb6a5`.
- PR #152 OPEN/DRAFT/UNMERGED; implementation head `d56d334d2045d08fd7aa71feb9749aab08d96840`, base Pass 26 feature branch.
- PR #153 OPEN/DRAFT/UNMERGED; same head, base `Основной`; validation-only exact-head PR; do not merge.
- Pass 30 fixed replay SELECT projection: admission attempt ID is now explicitly selected as `admission_attempt_id` and compared with receipt/outbox/task attempt references.
- Adapter blob `78c0906f26f7eb54ca3a489eba3eeca5c3f55cae`.
- Exact-head D1 run 44604194767 SUCCESS: 3 test files, 29 tests passed; npm ci, inert Worker check and fresh local D1 tests passed.
- Exact-head Pool Contract Validation run 44604194769 SUCCESS: dispatch gate false; workflow YAML parse; `POOL_CONTRACT_VALIDATION=PASS`.
- First run 44603988834 exposed the replay bug (28/29); corrected head rerun passed. No workflow filters, permissions or governance were weakened.
- Frozen schema-0010 upgrade fixture NOT VERIFIED. Hosted D1, secrets, providers, dispatch, executor, deployment, merge and production changes NOT RUN. Independent review and ruleset readback NOT VERIFIED.
- PRs #148/#149/#150/#152/#153 and docs PR #145 remain OPEN/DRAFT/UNMERGED. Issue #140 OPEN; Issue #151 PLANNED.
- Contour A BLOCKED / NOT ACCEPTED. Contour B DEFERRED.
- Next: frozen schema-0010 upgrade tests and expanded fault-injection/readback audit.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
