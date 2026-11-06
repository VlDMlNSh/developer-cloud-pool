# Integrated Pool Authorization Contract — 2026-11-06

- Status: DESIGN / NOT IMPLEMENTED / NOT QUALIFIED.
- Repository: `VlDMlNSh/developer-cloud-pool`.
- Immutable design base: `64d2636d4500127e635c214ccfb722c6b3fcda80` (default branch `Основной` as recorded in the current project context).
- Branch: `design/integrated-pool-authorization-contract-2026-11-06`.
- Scope: define the security boundary and test-first acceptance conditions for a future integrated Supervisor/Worker implementation.
- Explicit exclusions: no workflow dispatch, Worker/DSH execution, provider/model call, secret read, repository variable or Environment/ruleset mutation, merge, or deployment.

## 1. Required authority model

1. The repository owner is identified by immutable numeric GitHub user ID, not login text.
2. Approval is an authenticated owner-originated GitHub event/comment associated with the same repository ID and open non-PR issue.
3. The approval envelope binds: repository ID, issue number, numeric owner ID, exact approval event/comment ID, immutable target commit SHA, fixed Worker profile, capability/policy digest, bounded resource scope, expiry, and canonical envelope digest.
4. Supervisor re-fetches canonical GitHub API evidence immediately before consuming approval. Edited, deleted, expired, ambiguous, mismatched, or unverifiable evidence is rejected.
5. Only Supervisor may mutate task labels, approval lifecycle, claim receipts, and terminal task state. Worker has no Issues write permission and no issue mutation code.
6. Worker is a local reusable workflow with `workflow_call` only. Supervisor invokes it through a statically declared reusable-workflow job. No REST `workflow_dispatch` to Worker and no externally supplied `supervisor_run_id` as an authority substitute.
7. Worker validates caller repository, workflow identity/ref, called workflow identity/path/SHA, immutable target SHA, issue envelope, profile and consumed-approval receipt before checkout/install or any runtime action.
8. Durable single-use consumption must use a real create-if-absent primitive with independently verified immutability/anti-delete governance. Git tags are only a candidate until a dedicated tag ruleset and disposable create/update/delete tests prove the required behavior. Comments and Actions concurrency are not a durable atomic nonce store.
9. Supervisor is the sole reconciler. Remove privileged `workflow_run` trigger. Scheduled/manual invocations may reconcile only and must not create new authority or dispatch from labels alone.
10. Any ambiguous result after consume, before/after reusable Worker invocation, or during GitHub API operations becomes `pool:needs-review`. Never automatically restore `pool:ready` for the same approval.

## 2. State-transition contract

| Current state | Evidence / event | Required next state | Forbidden transition |
|---|---|---|---|
| unapproved | issue created/reopened/labelled by non-owner | unchanged or invalid | ready/claimed |
| unapproved | authenticated owner approval; envelope valid | approval-pending | dispatch before durable consume |
| approval-pending | durable consume create succeeds and exact read-back matches | claimed | second consume |
| approval-pending | consume conflict with exact same marker already present | needs-review unless idempotency is explicitly proven | replay dispatch |
| claimed | known matching Worker run active | claimed | second Worker |
| claimed | matching Worker terminal result | terminal result recorded by Supervisor | Worker issue mutation |
| claimed | no run, unknown run, timeout, API ambiguity, crash, expired claim | needs-review | automatic ready/retry |
| any approved state | approval edited/deleted/revoked before consume | needs-review / rejected | dispatch |
| needs-review | fresh owner approval with new unique approval ID | approval-pending | reuse old consumed ID |

## 3. Test-first acceptance matrix

Implementation must begin with deterministic tests that fail against the current default-branch workflow. Each test must assert both the decision and that no forbidden side effect was attempted.

### Approval provenance and envelope
- Reject non-owner actor, owner-login lookalike, wrong numeric owner ID, wrong repository ID, PR issue, closed issue, missing event/comment ID.
- Reject edited/deleted comment, mismatched issue/repository/SHA/profile/capability digest/scope/expiry, expired approval, malformed canonical digest.
- Re-fetch failure, pagination truncation, rate-limit response, missing event or ambiguous API response => fail closed.
- Approval for one SHA/profile cannot authorize another SHA/profile.

### Single-use consume and concurrency
- First create-if-absent succeeds; exact read-back verifies complete payload.
- Existing marker with identical payload is not automatically treated as permission to dispatch again.
- Existing marker with different payload, update/delete attempt, 409/422, timeout, 5xx, missing read-back or payload mismatch => no dispatch and needs-review.
- Two simultaneous Supervisor consumers: exactly one can acquire the unique marker; loser does not dispatch.
- Crash after consume and before Worker invocation requires fresh owner approval; no replay.
- Crash/timeout after invocation with uncertain run creation => needs-review; no replay.
- More than 100 comments/events/runs must paginate safely or fail closed; first-page truncation is not acceptable evidence.

### Workflow caller boundary
- Worker has `workflow_call` and no `workflow_dispatch`.
- Direct/manual Worker invocation is impossible at the workflow schema boundary.
- Production Worker rejects wrong caller repository, caller workflow path/ref/SHA, called workflow path/SHA, unexpected event, wrong target SHA, or missing Supervisor consume receipt before checkout/install.
- Tests exercise the actual production reusable Worker, not a separate fixture workflow.
- Worker permissions contain no `issues: write`; report job and all Worker issue mutation code are absent.
- Supervisor invokes only a statically declared local reusable workflow; no REST workflow dispatch endpoint remains.

### State ownership and recovery
- Supervisor is the only writer for queue labels/comments and approval/claim/terminal state.
- Active matching Worker run remains claimed.
- Completed, unknown, missing, ambiguous, stale, failed dispatch, and uncertain invocation transition to needs-review.
- No stale-claim or dispatch-error path returns the same approval to ready.
- `workflow_run` trigger and its event-derived privileged context are absent.
- Schedule/manual reconciliation cannot mint approval or dispatch without a newly verified and unconsumed owner approval.

### Supply chain and governance
- Pin all action references to immutable SHAs.
- Use lockfile-backed installation (`npm ci` where applicable); no ad-hoc unpinned DSH package install.
- Run YAML/schema validation, unit tests, production-workflow integration tests, static pool contract validation, zizmor and exact-head CI.
- Independently read back branch rulesets, tag rulesets, Environment configuration and `POOL_DISPATCH_ENABLED` metadata without reading secret values.
- Obtain an independent security review on the exact final head.
- No dispatch or runtime qualification until every required gate is evidenced.

## 4. Integration sequence

1. Keep current default branch immutable while implementing on a new branch based only on the recorded default SHA.
2. Add the tests above first and demonstrate expected failures against current production workflow.
3. Select and prove the durable consume primitive in a disposable namespace. If immutable create-if-absent semantics cannot be demonstrated, stop and redesign; do not substitute comments/concurrency.
4. Integrate owner approval parser, caller validation and fail-closed recovery as one coherent state machine. Rebase selected code deliberately; do not merge PR #7/#12/#15/#18 wholesale.
5. Convert production Worker to reusable-workflow-only and remove Worker write authority.
6. Remove Supervisor `workflow_run`; ensure reconciliation-only triggers cannot dispatch without current owner approval and successful consume.
7. Run all static/integration/security checks on exact final head, then obtain independent review.
8. Only after governance read-back and approval may a separately authorized no-secret runtime probe be considered.

## 5. Existing implementation disposition

- PR #7: useful owner-event and Worker validation work; not mergeable as-is because Worker remains `workflow_dispatch`, Worker report retains `issues: write`, owner identity uses login, approval/consumption uses mutable comments, and event/run binding is not strict.
- PR #18: useful six-test fail-closed recovery policy; integrate its semantics, not its branch wholesale. It does not implement owner provenance or caller boundary.
- PR #15: useful removal of privileged `workflow_run`; its stale recovery behavior must be replaced by PR #18 semantics.
- PR #12: reusable caller-context fixture/helper only; it does not validate the production Worker invocation.
- Current default branch remains the production authority source until an integrated implementation is independently reviewed and accepted.

## 6. Status and stop conditions

- Contract: DESIGN RECORDED.
- Production implementation: NOT RUN.
- Tests: NOT RUN (this document defines required tests; it does not claim test execution).
- Durable consume primitive and tag governance: NOT VERIFIED.
- Effective repository variable/ruleset read-back: NOT VERIFIED.
- Independent security review: NOT RUN.
- Supervisor/Worker/DSH runtime, provider/model calls, secrets, deployment: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Next step: implement the negative-first test harness against the current production workflow on a branch based on this immutable SHA; do not enable dispatch or merge.
