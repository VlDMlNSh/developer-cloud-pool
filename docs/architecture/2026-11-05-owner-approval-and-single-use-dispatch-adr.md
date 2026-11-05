# ADR: Owner approval provenance and single-use Worker dispatch

**Date:** 2026-11-05  
**Status:** PROPOSED / NOT IMPLEMENTED / NOT QUALIFIED  
**Target repository:** `VlDMlNSh/developer-cloud-pool`  
**Scope:** Phase-1 GitHub Issues task intake and one allowlisted Worker profile.  
**Safety invariant:** `POOL_DISPATCH_ENABLED` remains fail-closed. No Worker or DSH execution is authorized by this ADR.

## 1. Problem statement

The current canonical Supervisor treats the `pool:ready` label as approval, claims work by replacing labels, then calls the Worker through the REST `workflow_dispatch` endpoint. The Worker itself exposes `workflow_dispatch` and validates the issue's `pool:claimed` label and body fields. This does not prove that the repository owner approved the task, nor that the Worker was invoked by the approved Supervisor.

The current `scripts/pool-worker-caller.mjs` helper checks useful reusable-workflow context fields, but is not wired into the canonical Worker. A fixture passing is not production authorization.

## 2. Required security properties

1. **Principal provenance:** approval must be attributable to the repository owner, not inferred from an issue label or issue author.
2. **Approval binding:** approval must bind to the exact issue number, target commit SHA, allowlisted profile, and immutable task-envelope digest.
3. **Single-use:** one approval authorizes at most one dispatch attempt. Ambiguous outcomes must fail closed and require a fresh owner approval.
4. **Single writer:** only the serialized Supervisor may transition task lifecycle labels/state. Worker jobs must not mutate the queue ledger.
5. **Caller provenance:** the reusable Worker must verify the caller workflow repository/ref/SHA and its own called-workflow repository/path/SHA before any privileged operation.
6. **No direct entry:** the Worker must not expose `workflow_dispatch` after the reviewed transition; only `workflow_call` is permitted.
7. **Least privilege:** the caller grants only the permissions needed by each job; the called workflow cannot elevate the caller's `GITHUB_TOKEN` permissions.
8. **Fail closed:** missing, stale, edited, replayed, ambiguous or mismatched approval evidence means no dispatch.

## 3. Candidate owner-approval evidence

### Preferred candidate for Phase 1: owner-authored approval comment

Use a narrowly defined approval command as an issue comment, rather than treating `pool:ready` as authority. The Supervisor must verify all of the following from GitHub API data:

- comment belongs to the exact task issue in the same repository;
- comment author login exactly equals the repository owner's login returned by repository metadata;
- comment is a newly created comment event, not a body string copied from issue content;
- command contains the exact task issue number, 40-character target SHA and allowlisted profile;
- current task-envelope digest matches the digest in the approval command;
- comment ID has not already been consumed;
- issue is open and is not a pull request;
- no other approval for the same issue/envelope has already been consumed.

Do not accept approval from a label actor alone, issue author, arbitrary collaborator, workflow dispatch input, issue body, or a comment authored by a bot.

**Important limitation:** a comment is mutable/deletable and GitHub Issues does not provide a transactional compare-and-swap operation for comments or labels. The Supervisor must retain the observed comment ID, author, creation timestamp, exact command, target SHA and envelope digest in its audit record. If the comment is edited/deleted before consumption or cannot be revalidated, reject it. A comment is evidence of principal intent, not a database transaction.

## 4. Serialized single-writer state machine

GitHub Actions concurrency is a serialization aid, not an exactly-once primitive. The proposed Supervisor workflow-level concurrency group is repository-wide and uses `queue: max`, with no `cancel-in-progress`. All events that can cause a state transition must enter this same Supervisor group.

The only state writer is the Supervisor. Worker jobs have no `issues: write` permission and do not patch labels or post task comments. Worker terminal status is read from the GitHub Actions run record during reconciliation.

Proposed state transitions:

| Current state | Event / condition | Next state | Dispatch allowed |
|---|---|---|---|
| submitted | valid owner approval comment found | approved | no |
| approved | Supervisor validates all evidence and atomically claims within its serialized run | claimed | one attempt only |
| claimed | exactly one matching Worker run is found | running | already attempted |
| claimed | no run can be proven after dispatch attempt / ambiguous API outcome | needs-review | no retry |
| running | matching Worker run completes successfully | probe-complete / completed | no |
| running | failure, cancellation, timeout, or evidence mismatch | needs-review | no |
| needs-review | fresh owner approval comment for current envelope | approved | new one-time attempt |
| any | envelope changed after approval | invalidated / needs-review | no |

The Supervisor must claim the approval before attempting dispatch. If it crashes after claim but before dispatch, or the dispatch API result is ambiguous, the task moves to `needs-review`; it must not silently return to `ready` and replay the same approval. The owner must issue a fresh approval.

The existing stale-claim recovery path currently returns claims to `pool:ready` when no run appears. That behavior is incompatible with single-use approval and must be removed or changed to `pool:needs-review` in the same reviewed implementation.

### Why concurrency is not a transaction

- The current default concurrency behavior retains at most one pending run and can replace/cancel an earlier pending run.
- `queue: max` permits up to 100 pending runs and processes them FIFO by when they began waiting; it is not a durable queue or atomic compare-and-swap.
- Other writers (Worker report job, manual label edits, issue edits, or another workflow using a different group) invalidate the single-writer assumption.
- GitHub API label replacement is a read-modify-write operation, not a conditional update against an expected version.

Therefore this Phase-1 pattern is **serialized best-effort, fail-closed dispatch**, not mathematically exactly-once execution. If strict transactional exactly-once semantics become mandatory, use a separately reviewed transactional store with atomic uniqueness/lease operations; do not claim GitHub Issues labels provide that property.

## 5. Reusable Worker caller verification

When the production Worker is converted to a local reusable workflow:

- Worker trigger is `workflow_call` only.
- Supervisor invokes it statically in a job with `uses: ./.github/workflows/pool-worker.yml`.
- The reusable Worker validates the caller identity using GitHub-provided contexts:
  - `github.repository` equals this repository;
  - `github.workflow_ref` equals the exact protected Supervisor path/ref;
  - `github.workflow_sha` is a well-formed immutable SHA;
  - `job.workflow_repository` equals this repository;
  - `job.workflow_file_path` equals `.github/workflows/pool-worker.yml`;
  - `job.workflow_sha` is well-formed and matches the approved workflow revision under the same-ref/same-commit design.
- The exact expected caller and called workflow refs/SHA policy must be tested against a real default-branch run before authorization is accepted. Do not assume fixture values prove production values.
- Caller verification runs before checkout of task code, package installation, or any other privileged/side-effecting step.
- Worker input validation binds issue number, target SHA, profile, approval comment ID and envelope digest to the Supervisor's validated decision.
- No secret is passed to DSH or user-controlled code. No provider credentials or model calls are in scope.

GitHub's documented context semantics are important: in a reusable workflow, the `github` context remains associated with the caller, while `job.workflow_repository`, `job.workflow_file_path`, `job.workflow_ref` and `job.workflow_sha` identify the reusable workflow itself. The implementation must use these distinct sources rather than assuming that one field identifies both sides.

## 6. Workflow trigger and permission changes required together

The eventual implementation must be one coherent transition, not isolated helper wiring:

1. Remove `workflow_dispatch` from Worker and use `workflow_call` only.
2. Remove REST `/actions/workflows/pool-worker.yml/dispatches` from Supervisor.
3. Replace it with a static local reusable-workflow job.
4. Remove `workflow_run` if it remains an unsafe privileged trigger; reconcile Worker runs through the scheduled/approved Supervisor path.
5. Remove `issues: write` from Worker report job; Supervisor alone updates queue state.
6. Remove any stale-claim auto-requeue behavior that could replay consumed approval.
7. Keep supervisor concurrency group consistent across all triggers and use `queue: max` only after exact-head validation.
8. Minimize `actions: write`; with a local reusable workflow, no workflow-dispatch API permission should be needed.
9. Add tests for forged commenter, non-owner collaborator, edited/deleted comment, mismatched SHA/profile/digest, duplicate comment delivery, concurrent approval events, Supervisor crash before/after dispatch, ambiguous dispatch response, Worker direct invocation, and wrong caller/called workflow refs.
10. Require exact-head CI and independent security review before merging.

## 7. Governance prerequisite

The active repository ruleset currently requires a PR but has zero required approvals and does not require CODEOWNERS review. A PR requirement with zero independent approvals is not an independent security gate.

Before production authorization is accepted:
- configure at least one independent approval from an authorized reviewer who is not the PR author;
- require resolution of review threads;
- add exact required status checks for the security contract and workflow audit;
- verify ruleset and Actions variable state using an authenticated owner read-back;
- keep `POOL_DISPATCH_ENABLED=false` until all acceptance gates pass.

If no independent reviewer is available, the implementation remains NOT ACCEPTED. Do not substitute a self-review or a successful CI run for independent review.

## 8. Acceptance checklist

- [ ] Owner principal is derived from trusted GitHub API event/comment author data.
- [ ] Approval is bound to issue, exact target SHA, profile and envelope digest.
- [ ] Approval comment is revalidated immediately before claim.
- [ ] Duplicate/replayed approval cannot dispatch a second time.
- [ ] Ambiguous dispatch outcome transitions to needs-review; no automatic retry.
- [ ] Supervisor is the only task-state writer.
- [ ] Worker has no direct dispatch trigger.
- [ ] Worker caller and called-workflow identities are validated before side effects.
- [ ] No REST workflow dispatch remains.
- [ ] No unsafe privileged `workflow_run` trigger remains.
- [ ] All adversarial and race tests pass on exact PR head.
- [ ] Exact-head CI and zizmor pass.
- [ ] Independent review and ruleset/status-check gates pass.
- [ ] Owner verifies `POOL_DISPATCH_ENABLED=false` until final acceptance.
- [ ] No Worker/DSH runtime test occurs before approval of the implementation.

## 9. Decision and next step

**Decision:** do not implement the caller helper in isolation and do not enable dispatch. First implement the owner-comment provenance parser and pure state-transition tests as a no-side-effect module. Then implement the workflow transition as a single PR with the adversarial tests above.

This ADR is a design proposal. It does not change production workflow behavior and grants no execution authority.

## References

- GitHub Actions contexts: https://docs.github.com/en/actions/reference/workflows-and-actions/contexts
- Reusing workflow configurations: https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations
- Workflow syntax / workflow_call: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
- Control workflow concurrency: https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency
- Actions limits and concurrency queue limit: https://docs.github.com/en/actions/reference/limits


## 10. GitHub Free native approval and replay-ledger qualification — 2026-11-05

### Repository plan facts

The repository is confirmed **public** through GitHub repository metadata. GitHub documentation states that Environments, required reviewers, prevent-self-review and rulesets are available for public repositories on GitHub Free. Required reviewers are not available for private repositories on Free. Therefore the Environment gate is a viable no-paid-service candidate for this repository while it remains public.

### Environment gate — candidate, not yet configured or qualified

Proposed environment name: `pool-owner-approval`.

The future Supervisor must complete all untrusted-data validation and publish a run summary containing issue number, exact task SHA, profile, task-envelope digest, approval evidence and run ID **before** the gated job references the Environment. The gated job must be a separate minimal job with no checkout and no untrusted code before approval.

Required configuration:
- Required reviewer is the repository owner account (trusted numeric ID resolved from repository metadata).
- `prevent_self_review=true`.
- Disallow administrator bypass.
- For this public repository, configure deployment branch policy to permit only the canonical default branch, and verify the exact API read-back.
- No environment secrets are required for the approval-only job.
- After approval, a later job must re-fetch the issue/comment and revalidate the exact task envelope and target SHA before any privileged operation.

Limitations:
- Environment approval is approval of a particular waiting job/deployment in a workflow run; it is not itself a durable consumed-approval ledger for an issue/comment.
- A run can be rerun or a second run can be started. Every run must require a fresh Environment approval; the workflow must not infer approval from a previous run.
- The approval UI is not a substitute for displaying the exact issue/SHA/profile/digest in a prior job summary and verifying those values again after approval.
- If a job is initiated by the repository owner, prevent-self-review prevents that owner from approving it. This must be tested with the actual event actor and intended dispatch route.
- GitHub documents an administrator bypass feature and a setting to disallow it; the configuration must be read back, not assumed.
- Environment support is plan-dependent on repository visibility. If the repository becomes private on Free, the required-reviewer protection is not available; fail closed.

**Status:** viable design candidate; environment existence/configuration not read through the currently available GitHub connector; no owner action or environment mutation performed. NOT CONFIGURED / NOT QUALIFIED.

### Git ref as a possible atomic single-use marker — design candidate only

GitHub's Create a reference API creates a fully qualified ref and returns 201 on success; documented conflict/validation responses include 409 and 422. A deterministic ref name keyed only by approval comment ID (for example `refs/tags/pool-consumed/<comment-id>`) could provide a server-enforced uniqueness race: concurrent attempts cannot both successfully create the same ref. The ref should point to an immutable annotated tag object whose message binds comment ID, owner ID, issue, target SHA, profile and envelope digest.

Potential protection:
- A tag ruleset on `pool-consumed/**` with restrict-updates and restrict-deletions could make successful markers immutable.
- Do not enable restrict-creations unless the exact authorized GitHub App/token actor is known to be able to create refs under that ruleset; otherwise the legitimate Supervisor may be blocked.
- If creation remains unrestricted, a repository writer may pre-create a marker and cause denial of service. This is fail-closed but not availability-safe.
- The marker creation token needs `contents:write`; isolate that permission to one tiny job after all validation and Environment approval. Never check out or execute task code in that job.
- Treat only a successful create as consumption. On 409/422/timeout, fetch the existing ref and verify its immutable annotated-tag payload exactly; never interpret an ambiguous API failure as permission to retry dispatch.
- Test tag-rule behavior with the actual `GITHUB_TOKEN` and active ruleset before qualification.

Limitations:
- A ref marker is a uniqueness primitive, not a full transaction spanning Environment approval and Worker dispatch.
- A crash after marker creation but before Worker invocation must remain consumed and move to `needs-review`; no automatic replay.
- A crash after dispatch but before recording the run remains ambiguous and must not cause a second dispatch.
- Administrators can still change repository configuration/rulesets; governance and audit remain necessary.
- A malicious writer can potentially preempt a marker name and cause denial of service if creation is not restricted to the authorized actor.

**Status:** promising native primitive for a one-time consume marker; NOT IMPLEMENTED / NOT TESTED / NOT QUALIFIED. No tag ruleset or ref created.

### Updated design direction

Preferred future composition to prototype in isolation:
1. Validate owner-authored approval and immutable task envelope.
2. Present the validated issue/SHA/profile/digest in a run summary.
3. Require owner approval through a protected Environment, with prevent-self-review and no bypass.
4. Revalidate approval and task envelope after the gate.
5. Create the deterministic, immutable Git ref marker keyed by approval comment ID using a minimal `contents:write` job.
6. Dispatch exactly one reusable Worker attempt only after marker creation succeeds.
7. Any timeout, duplicate marker, missing run, or ambiguous dispatch goes to `needs-review`; never auto-requeue the same approval.

This composition remains a proposal. It does not establish strict end-to-end exactly-once semantics and must not be wired into production until adversarial race tests and independent review pass.
