# Pool authorization integration contract — reusable workflow caller

Date: 2026-11-06
Status: DESIGN CONTRACT / NOT IMPLEMENTED / NOT QUALIFIED

## Decision

Replace the current privileged workflow-dispatch chain with a statically declared reusable workflow call initiated by the Supervisor. The Worker becomes a reusable workflow only. The Supervisor owns task intake, approval consumption, and final issue reporting. The Worker receives only the minimum task inputs and read-only permissions and cannot mutate queue state.

This is a design contract for a bounded implementation PR. It is not authorization to enable dispatch.

## Evidence-based current-state defect

Default-branch files read during this pass:
- `.github/workflows/pool-worker.yml`, blob `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`: Worker has `workflow_dispatch`, a report job with `issues: write`, and direct issue PATCH/POST.
- `.github/workflows/pool-supervisor.yml`, blob `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`: Supervisor has `workflow_run`, `actions: write`, and a privileged workflow event context.
- `scripts/pool-supervisor.mjs`, blob `52bf03ca889edd92fd10c71ae96a2e35e106d43f`: contains REST workflow dispatch, queue transitions and stale-claim recovery.
- Candidate branch `fix/integrated-pool-authorization-2026-11-06` adds a decision module and static tests, but does not modify those production files. It is not an integrated remediation.

## Target execution graph

1. Supervisor workflow is triggered by approved queue events and a bounded periodic reconciliation schedule. It has one serialized concurrency group.
2. A read/write Supervisor intake job validates one eligible task envelope and the explicit owner approval label. It claims at most one task per run, removes `pool:ready`, adds `pool:claimed`, and records a unique supervisor run/attempt and immutable target SHA in the audit trail.
3. A separate job statically calls `./.github/workflows/pool-worker.yml` with typed `workflow_call` inputs. It runs only when intake outputs contain a fully validated task. No REST workflow-dispatch endpoint is used.
4. Worker validates caller repository ID, caller workflow ref/SHA, its own reusable-workflow repository/path/SHA, task state, approval envelope, target SHA and allowlisted profile. Use caller identity from `github.*` and called-workflow identity from `job.workflow_*`; never conflate them.
5. Worker jobs receive only `contents: read` and narrowly scoped `issues: read` if issue validation is necessary. No job in Worker receives issue write permission. Worker never patches issues or posts comments.
6. Worker returns bounded outputs and job result. A Supervisor finalizer, with the only required `issues: write` permission, records terminal status and provenance. It handles success, failure, cancellation, skipped and ambiguous results.
7. A failed, cancelled, timed-out or ambiguous task becomes `pool:needs-review`. The same approval is never automatically requeued. A new owner approval must be an explicit new state transition.
8. A missing/ambiguous claim write must fail closed: read back the issue and proceed only if the exact expected claim and immutable envelope are confirmed. If confirmation is not exact, do not call Worker; move to review only if the safe state can be established.

## Single-use approval and concurrency contract

- Serialize all Supervisor runs using one repository-scoped concurrency group; use the GitHub-supported queue semantics configured for this repository and test them on exact HEAD.
- Process at most one task per Supervisor run initially. Do not introduce matrix fan-out until single-task lifecycle, outputs, recovery and audit are qualified.
- Treat transition from explicit `pool:ready` to `pool:claimed` as consumption of that approval. A failed or ambiguous execution does not restore `pool:ready`.
- No lease-expiry path may automatically return a claimed task to ready. Recovery is terminal `pool:needs-review`.
- The GitHub Issues API does not provide compare-and-swap for label/body updates. Therefore serialized Supervisor execution plus strict read-back is a risk-reduction mechanism, not a claim of database-grade atomicity. Document this limitation. If stronger atomicity is required, use a separately qualified durable store with conditional create/transaction semantics before dispatch is enabled.
- Never claim exactly-once execution solely from an idempotency key, label, comment, or pure decision function. At-most-once dispatch attempts with fail-closed manual recovery are the initial acceptable safety target.

## Required reusable-workflow identity checks

Inside Worker:
- Caller: `github.repository`, `github.repository_id`, `github.workflow_ref`, `github.workflow_sha`.
- Called workflow: `job.workflow_repository`, `job.workflow_file_path`, `job.workflow_ref`, `job.workflow_sha`.
- Require exact repository ID, exact allowlisted caller workflow path/ref and immutable approved caller SHA policy, exact Worker path/ref and SHA policy. Pin reusable workflow invocation to a full commit SHA once the approved implementation commit exists.
- Confirm GitHub.com support for `job.workflow_*`; these fields are not available on GitHub Enterprise Server. The target repository is GitHub.com.

## Workflow permissions

Supervisor:
- Intake/finalizer only: `issues: write` as required; `contents: read` only if checkout is needed.
- No `actions: write`.
- No `workflow_run` trigger.
- No REST workflow-dispatch calls.
Worker:
- `workflow_call` only; no `workflow_dispatch`.
- Read-only permissions, minimum required.
- No issue PATCH/POST and no report job with issue-write authority.
- No provider secrets or model calls in the DSH headless probe.

## Exact-head acceptance tests

1. Worker workflow event block contains `workflow_call` and not `workflow_dispatch`.
2. Worker has no `issues: write`, no issue PATCH/POST, no comment mutation, and no report job with write credentials.
3. Supervisor has no `workflow_run`, no `actions: write`, and no REST workflow-dispatch path.
4. Supervisor has one statically declared reusable Worker call; no dynamically constructed workflow endpoint.
5. Reusable workflow caller and callee identities are asserted using distinct contexts and exact values.
6. Invalid/missing caller identity, wrong repo ID, wrong workflow path/SHA, invalid target SHA, invalid profile, missing approval, replayed approval and ambiguous consume/read-back all DENY.
7. Success is possible only after exact claim read-back and first-use approval confirmation.
8. Failure/cancellation/timeout/unknown outcomes become needs-review; no same-approval requeue path exists.
9. Supervisor concurrency serializes two simultaneous approval events; duplicate event/re-run tests demonstrate no second Worker invocation for the same claimed approval.
10. YAML parse, action SHA pinning, shell safety, permissions contract, node tests, exact-head GitHub Actions CI and independent security review all pass.

## Explicit non-goals

- Do not enable `POOL_DISPATCH_ENABLED`.
- Do not run DSH, Resource Probe, browser tasks, providers, models or external servers.
- Do not read, copy or expose secrets.
- Do not deploy Cloudflare or claim web-console availability.
- Do not merge the current authorization candidate branch as if it fixed production.
- Do not start Contour B.

## Source references

- [GitHub Actions contexts — official documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts): distinguishes caller `github.workflow_*` from reusable-job `job.workflow_*`; the latter identifies the workflow file defining the current job.
- [GitHub reusable workflows — official documentation](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows): reusable workflows require `workflow_call`; caller context remains associated with the calling workflow.
- [GitHub changelog, 2026-09-03](https://github.blog/changelog/2026-09-03-github-actions-early-september-2026-updates/): announces the `job.workflow_ref`, `job.workflow_sha`, `job.workflow_repository`, and `job.workflow_file_path` properties.

## Status

Production remediation: NOT IMPLEMENTED.
Candidate decision function: IMPLEMENTED ON UNMERGED BRANCH / NOT INTEGRATED.
Exact-head CI: NOT VERIFIED.
Independent review: NOT RUN.
Dispatch: BLOCKED / FAIL-CLOSED.
Contour A: BLOCKED / NOT QUALIFIED / NOT ACCEPTED.
