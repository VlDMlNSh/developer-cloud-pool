# Tasks: Controller → API Envelope → attested D1 composition

Pass 116 source reconciliation completed. Only T001/T002 are VERIFIED at source-audit level; no implementation tasks were executed.

- [x] T001 [FR-001] Re-read current default SHA and candidate refs; compare PR #176, #177, #178, #179 and Pass 111 branch merge bases. Evidence: report Pass 116. Parent-chain details beyond compare metadata remain NOT VERIFIED.
- [x] T002 [FR-002] Compare controller workflow, API verifier, Envelope schemas, D1 exports and migrations; establish canonical single-ledger path and reject broad PR #176 merge. Evidence: source/blob map in Pass 116 report.
- [ ] T003 [SEC-006] Trace every production import/caller of legacy and attested admission exports; establish test-only compatibility boundary.
- [ ] T004 [FR-003/004/009/011] Port minimal PR #176 controller evidence collector onto fresh Pass 111-based branch; emit exact Envelope v1 JSON + digest from same-run API readbacks.
- [ ] T005 [SEC-001/008] Add fixed-origin GitHub API transport with timeout, response-size cap, allowlist and sanitized failures.
- [ ] T006 [FR-005/010] Bind target/event SHA, workflow-code SHA, workflow-file blob SHA and file-ref SHA independently; add distinct-SHA and workflow-byte provenance tests.
- [ ] T007 [FR-006/007/AC-007] Feed the real collector output into Workers verifier and local D1 attested adapter; assert no adapter call on invalid evidence and exact full-tuple replay.
- [ ] T008 [FR-008/AC-008] Add timeout, oversized body, wrong origin, partial read, stale ref, duplicate key, rerun, substitution and ambiguous-write tests.
- [ ] T009 [SEC-006/AC-009] Prove production composition cannot import legacy `admitGitHubNextEvent`; isolate historical compatibility tests.
- [ ] T010 [SEC-004/005] Assert dispatch=false and executionAuthorized=false on success, rejection, exception, replay and indeterminate outcomes; workflow stays read-only.
- [ ] T011 [CI] Run D1 local Workers integration and Pool Contract Validation on exact head; record run/job IDs and checked-out SHA.
- [ ] T012 [REVIEW] Inspect permissions, imports, migrations, transport bounds, output redaction and governance; no merge if any gate is NOT VERIFIED.
- [ ] T013 [DOCS] Publish report/checkpoint and update Context Window with evidence, metrics, blockers and next step.