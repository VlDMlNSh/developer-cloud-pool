# Tasks: Controller → API Envelope → attested D1 composition

All tasks are PLANNED; none were executed in Pass 115.

- [ ] T001 [FR-001] Read current default SHA, PR #176–#183 heads, parent chains and merge bases; produce ancestry map.
- [ ] T002 [FR-002] Compare controller workflow, API verifier, envelope schema, D1 exports and migrations; select one canonical path.
- [ ] T003 [SEC-006] Trace imports/callers of legacy and attested admission exports; define test-only compatibility boundary.
- [ ] T004 [FR-003/004] Add fixed-origin read-only GitHub API adapters and immutable Issue/Comment/Repository/Workflow/Run ID tests.
- [ ] T005 [FR-005] Implement canonical envelope v1 serialization/digest recomputation and mismatch tests.
- [ ] T006 [FR-006/007] Compose the single attested adapter; assert no invocation on invalid evidence and full tuple readback on replay.
- [ ] T007 [FR-008/SEC-004/005] Add failure, timeout, stale-ref, rerun, partial-read and ambiguous-outcome tests; assert false dispatch/authorization on every path.
- [ ] T008 [CI] Run D1 local Workers integration and Pool Contract Validation on exact head; record run/job IDs and checked-out SHA.
- [ ] T009 [REVIEW] Inspect permissions, imports, migrations, output redaction and governance; do not merge if any gate is NOT VERIFIED.
- [ ] T010 [DOCS] Publish report/checkpoint and update Context Window overlay with evidence, metrics, blockers and next step.