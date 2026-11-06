# 2026-11-06 — Comparative authorization implementation audit and integration plan

## Immutable targets and refreshed PR state
Repository: VlDMlNSh/developer-cloud-pool
Default branch: Основной, HEAD 64d2636d4500127e635c214ccfb722c6b3fcda80.
- PR #7: OPEN/DRAFT/UNMERGED; head effda14e286ebe276fee2b3ead96c4ed2122a45e; base 692025e4a039aaf94c6683bb95da38b4f324fce8 (stale). One COMMENTED review by repository owner; no independent APPROVED review. Exact-head Pool Contract Validation run 42193485309 / job 127810907038 SUCCESS.
- PR #12: OPEN/DRAFT/UNMERGED; head 6c053bacff29ca8efb5fdb759edd44fcd416b749; base current default HEAD; formal reviews empty. Exact-head fixture run 42041946049 and contract run 42041945700 SUCCESS.
- PR #15: OPEN/DRAFT/UNMERGED; head c57f2ab3f2b91bf6b3e413640f65ec518008b75e; base current default HEAD; formal reviews empty. Exact-head contract run 42038004176 SUCCESS.
- PR #18: OPEN/DRAFT/UNMERGED; head 9a9f9f750ac2f0e12767991a5e624e8dc806d2f6; base current default HEAD; formal reviews empty. Exact-head contract run 42043826776 / job 127301328381 SUCCESS.
- PR #27: OPEN/DRAFT/UNMERGED; current head 33484b9e9c29d9ef6ba1a6bf19c9c0feeb9f3cb2; base current default HEAD; reviews empty; exact-head PR-triggered run lookup empty => CI NOT VERIFIED.
- Active ruleset 26550182 remains branch-only on refs/heads/Основной; active, PR required, 0 approvals, CODEOWNERS review false, bypass actors empty. Independent review is not enforced.

## Comparative implementation findings

### PR #7 — Worker-side owner authorization hardening
Strengths already implemented in its branch:
- Parses an allowlisted issue envelope (fixed DSH headless profile + 40-character target SHA).
- Supervisor records bot-authored approval/consumption/revocation comments; approval is associated with issue, target SHA and profile.
- Worker checks owner-originated pool:ready issue event, bot claim event, bot approval-consumed marker, Supervisor workflow/run ID and prior Worker runs.
- Per-issue Worker concurrency added.
- Exact-head static contract suite passed at 42193485309.

Critical gaps; do not merge as-is:
1. Worker trigger remains workflow_dispatch; it is not workflow_call-only. A caller can supply supervisor_run_id. Worker-side run checks do not prove that the current Worker was invoked by the Supervisor's actual static reusable-workflow call. A direct first invocation can potentially piggyback a legitimate consumed Supervisor run before any prior Worker run is visible.
2. Worker report job was not removed by this PR and remains the existing issue-state writer with issues:write; Supervisor is not sole writer.
3. Approval principal uses owner login string, not immutable numeric user ID.
4. Approval/consumed/revoked records are bot comments, not durable immutable single-use storage. They are mutable/deletable and are not an atomic compare-and-set consume primitive.
5. hasOwnerReadyEvent accepts any prior owner pool:ready event at or before Supervisor run creation, without a strict time window or binding to the exact triggering event/run payload.
6. hasPriorWorkerRun is a history scan (bounded to first 100 results) plus concurrency control, not an atomic one-time consume. GitHub concurrency serializes same-group execution but does not replace durable authorization storage or transaction semantics.
7. PR #7 base is old and diverged from current default branch. Rebase/update is mandatory before integration.
8. Formal independent review absent. Owner COMMENTED review is not an independent security approval.

### PR #18 — fail-closed claim recovery
Strengths:
- Adds pure planClaimRecovery/planDispatchFailure policy and six tests.
- Active matching Worker run stays claimed; completed/unknown run or expired claim without provable run goes needs-review.
- Dispatch failure after claim goes needs-review, not back to pool:ready.
- Exact-head static contract job 127301328381 SUCCESS.

Limitations:
- PR #18 does not implement owner approval provenance, single-use consumption, caller boundary or workflow_call-only Worker.
- Its recovery policy must be integrated with the final state machine; the pure helper alone is not authorization.
- PR #18 formal reviews empty.

### PR #15 — removal of privileged workflow_run
- Removes the Supervisor workflow_run trigger, but stale-claim handling on that PR branch returned no-run claims to pool:ready; PR #18 later proposes fail-closed recovery.
- PR #15 remains unmerged; production default branch still contains workflow_run.
- Do not take PR #15 without PR #18 recovery semantics and caller/approval hardening.

### PR #12 — caller-context fixture
- Tests reusable-workflow context in a fixture workflow, not the production Worker.
- It does not by itself prove production workflow_call-only behavior or static invocation.
- Use its helpers only after contract review and integration into the actual Worker workflow, with production-path tests.

## GitHub-native architecture constraints
- GitHub reusable workflow requires workflow_call and is invoked as a job using uses; local ./ .github/workflows/... calls use the caller's same commit. Official docs: https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows
- GitHub concurrency permits one running member per group but pending behavior is queue/cancel semantics; ordering is not guaranteed. It is not a transactional nonce store. Official docs: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
- Therefore the final boundary must be a statically declared reusable Worker call, with the durable consume decision performed only by Supervisor before the call; concurrency is defense-in-depth only.

## Proposed integration plan — test-first, no changes to runtime code in this pass
1. Pin integration base to current default branch HEAD 64d2636d4500127e635c214ccfb722c6b3fcda80. Do not merge stale PR #7 or combine old branch histories wholesale.
2. Build a single threat-model and state-transition contract first. Supervisor is the sole writer for task labels/comments/lifecycle. Worker receives read-only task authority and cannot mutate Issues.
3. Owner approval must bind immutable repository ID, issue number, numeric owner ID, exact approval comment/event ID, target SHA, fixed profile/capability digest, scope/budget, expiry and canonical envelope digest. Re-fetch canonical API evidence immediately before consume; reject edited/deleted/replayed/mismatched evidence.
4. Implement a real durable create-if-absent consume primitive. Git tag marker remains a proposal until a tag ruleset is configured/read back and disposable create/update/delete tests prove create allowed, update/delete denied. If not enforceable, stop and select another durable primitive. Comment markers and concurrency alone are insufficient.
5. Supervisor must validate approval, atomically consume it, persist claim receipt, then statically invoke local reusable Worker (workflow_call only). No REST workflow_dispatch to Worker. Worker must reject any non-Supervisor caller before checkout/install; test the actual production reusable workflow, not a fixture.
6. Remove Worker report-job issues:write and all Worker issue mutations. Supervisor alone reconciles worker result from trusted run/job metadata.
7. Remove privileged workflow_run; scheduled/manual triggers are reconciliation-only. Apply PR #18 fail-closed recovery: active known run waits; terminal/unknown/expired/ambiguous state => needs-review; never auto-requeue the same approval.
8. Add adversarial integration tests: direct Worker invocation, wrong workflow/ref/repository/SHA, wrong numeric owner, edited/deleted approval, issue/label races, duplicate webhook, two simultaneous consumers, marker 201/409/422/timeout/read-back mismatch, crash after consume/before call, ambiguous call, prior/re-run attempts, >100 history records, API pagination/error.
9. Pin dependency lockfiles and use npm ci; run YAML/schema/static validators, unit tests, workflow-context integration fixture that invokes actual production reusable Worker, zizmor, exact-head CI, then independent security review.
10. Only after ruleset/Environment/dispatch variable read-back, independent review and no-secret runtime test may the runtime be considered for qualification. Keep dispatch fail-closed throughout.

## Status
- Comparative code audit: VERIFIED read-only.
- PR #7 owner-approval implementation: PARTIAL / NOT QUALIFIED.
- PR #18 fail-closed recovery policy: static tests SUCCESS / NOT QUALIFIED.
- PR #15 workflow_run removal: proposed only / NOT merged.
- PR #12 production caller boundary: NOT IMPLEMENTED / fixture only.
- Exact-head PR #27 CI: NOT VERIFIED.
- Runtime dispatch, Worker, DSH, provider/model calls, secret reads, deployments: NOT RUN.
- Contour A NOT ACCEPTED; Contour B DEFERRED.

## Next bounded step
Create a new integration branch from the current default branch only after the owner-approval and single-use consume contracts are fully specified; begin with deterministic unit/integration tests that fail against the current production workflow. Do not dispatch or merge.
