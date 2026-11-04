# 2026-11-04 — Worker authorization architecture decision

## Scope and target
Bounded architecture pass against PR #7 head `d60d26ae647940e702d646e572c861a8f68f523e` and default branch HEAD `692025e4a039aaf94c6683bb95da38b4f324fce8`. No code, workflow, secret, variable, runner, or dispatch mutation was performed.

## Live repository evidence
- Branch inventory: `Основной`, `fix/pool-owner-approval-guard-2026-11-04`, `fix/worker-shell-input-escaping-2026-11-04`, `feat/jarvis-mobile-readonly-shell-2026-11-04`, `feat/media-intelligence-skills-2026-11-04`, and documentation branch.
- Default HEAD: `692025e4a039aaf94c6683bb95da38b4f324fce8`.
- PR #7 compare: 15 commits ahead, 0 behind.
- PR #7 exact-head CI run [41909811327](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/41909811327): completed/success, static contract checks only.
- PR #7 review submissions: empty; independent review NOT RUN.
- Worker workflow blob is identical on default and PR #7: `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`.
- Worker currently exposes `workflow_dispatch`. Its validate job checks task issue, target SHA, profile, issue state, `pool:claimed`, and body envelope, but no caller/workflow provenance.
- Supervisor uses the REST `workflow_dispatch` endpoint dynamically after owner approval; it can process up to 20 issues per reconciliation.
- PR #7 remains OPEN / DRAFT / NOT MERGED.

## GitHub platform semantics verified from current official documentation
1. `workflow_dispatch` is explicitly the manually/API-triggerable event; workflow file must exist on default branch for UI dispatch. Event table identifies the dispatched ref as `GITHUB_REF` and last commit on that ref. Source: [Events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows).
2. `github.actor` identifies the actor who triggered the initial workflow run; on reruns it can differ from `github.triggering_actor`. It does not identify which workflow inside the repository made an API call. Source: [Contexts reference](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts).
3. A reusable workflow must declare `workflow_call`. When called, the `github` context is associated with the caller workflow. The `job.workflow_ref`, `job.workflow_sha`, `job.workflow_repository`, and `job.workflow_file_path` contexts identify the workflow that defines the running job. Sources: [Reuse workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows), [Contexts reference](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts).
4. Reusable workflow calls are declared statically as a job-level `uses`, support inputs and matrix strategies, and the called workflow can only receive the same or more restrictive GITHUB_TOKEN permissions. Sources: [Reuse workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows), [Reusing workflow configurations](https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations).

## Architecture decision — preferred direction, NOT IMPLEMENTED
Replace the standalone Worker `workflow_dispatch` entry point with a reusable Worker workflow triggered only by `workflow_call`. The Supervisor must call it as a job from the protected default-branch workflow, passing the validated task envelope through typed inputs and a bounded dynamic matrix.

Inside the reusable Worker, fail closed unless all provenance checks match:
- `github.workflow_ref` is exactly `VlDMlNSh/developer-cloud-pool/.github/workflows/pool-supervisor.yml@refs/heads/Основной`;
- `github.workflow_sha` is the expected immutable caller workflow commit (and the supervisor code used for dispatch is from that protected ref);
- `job.workflow_repository` is exactly `VlDMlNSh/developer-cloud-pool`;
- `job.workflow_file_path` is exactly `.github/workflows/pool-worker.yml`;
- `job.workflow_sha` matches the expected reusable Worker definition revision;
- inputs are validated again and bound to issue number, target SHA and exact profile;
- task authorization is revalidated by Worker immediately before probe; public labels/comments remain task state, not cryptographic capability.

A manually dispatched custom workflow on a feature branch that tries to call the reusable Worker would have a different `github.workflow_ref` and must be rejected. A manual run of the Supervisor still follows the Supervisor's owner-approval and dispatch gates.

## Required orchestration refactor
The current Node Supervisor performs REST dispatch inside `dispatchReadyTasks()`; reusable workflow calls cannot be made from a script step or REST API. The Supervisor therefore needs a two-phase design:
1. Reconcile/validate owner-approved tasks, consume approval, claim tasks, and emit a strictly validated JSON matrix/output (bounded to current max 20; reject malformed/oversized output).
2. A statically declared downstream job calls the reusable Worker with `strategy.matrix` and only those outputs. Worker jobs retain least privilege and immutable SHA checkout.
3. Parent workflow records per-matrix terminal outcomes and performs recovery/needs-review transitions. Avoid relying on the current separate `workflow_run` event as the only completion signal; preserve idempotency and cancellation handling.
4. Keep `POOL_DISPATCH_ENABLED` as a fail-closed gate before matrix output; no dispatch or Worker execution while false/unverified.
5. Add negative tests: manual dispatch event absent from Worker trigger contract; feature-branch caller ref rejected; wrong repository/path/SHA rejected; malformed matrix rejected; missing/expired/consumed approval rejected.
6. Add positive tests for the exact protected Supervisor caller and the exact Worker reusable workflow identity. Use fixture-driven unit tests for pure authorization logic and YAML static checks; no live privileged dispatch test until independently reviewed.

## Rejected shortcuts
- Do not rely on `github.actor == github-actions[bot]`: this identifies the triggering actor, not the specific authorized caller workflow.
- Do not treat `pool:claimed`, public issue comments, or task body fields as secret capabilities.
- Do not add a new HMAC/secret contract as a shortcut: that creates a new owner-managed secret requirement and replay/rotation/storage semantics, while the existing repository secret contract has not been verified.
- Do not merely remove `workflow_dispatch` without refactoring Supervisor; the existing REST dispatch would stop working.

## State and next step
- Worker authorization: BLOCKED.
- Architecture: DESIGN RECOMMENDED / NOT IMPLEMENTED.
- PR #7: OPEN / DRAFT / NOT ACCEPTED.
- Independent review: NOT RUN.
- `POOL_DISPATCH_ENABLED`: NOT VERIFIED in this pass; no mutation.
- Worker, DSH, Resource Probe, browser, models: NOT RUN.
- Next bounded implementation: extract Supervisor task planning into a pure, testable matrix builder and add tests for output bounds, schema, duplicate issue rejection, SHA/profile validation, and approval requirement. Do not wire it to a workflow call until the matrix contract and recovery model are reviewed.
