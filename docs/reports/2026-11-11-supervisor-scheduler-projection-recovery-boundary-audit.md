# 2026-11-11 — Supervisor scheduler and projection recovery boundary audit

## Immutable targets and evidence

- Default branch: `Основной`, observed HEAD `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- Supervisor workflow blob: `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`, path `.github/workflows/pool-supervisor.yml`.
- Supervisor implementation blob: `52bf03ca889edd92fd10c71ae96a2e35e106d43f`, path `scripts/pool-supervisor.mjs`.
- Recovery architecture blob: `3ac28f2f105a20a4eed5d93168bbe84d2d5273b8`, path `docs/architecture/GITHUB-POOL-SUPERVISOR-AND-RECOVERY.md`.
- PR #58/#59 remain OPEN / DRAFT / UNMERGED; PR #59 exact-head local D1 proof run `42980783397` is SUCCESS (53 tests). This does not qualify production integration.

## Confirmed existing scheduler

The default-branch `pool-supervisor.yml` already uses GitHub Actions schedule cron `3,8,13,18,23,28,33,38,43,48,53,58 * * * *`, plus issue events, `workflow_run: completed`, and manual workflow dispatch. It uses a five-minute job timeout, concurrency group `developer-cloud-pool-supervisor` with `queue: max`, and a job-scoped GITHUB_TOKEN. The architecture document explicitly describes this as a best-effort five-minute fallback, not a daemon or guaranteed real-time scheduler.

The default-branch script `scripts/pool-supervisor.mjs` contains GitHub Issues queue reconciliation and stale-claim recovery. Therefore a mature platform-native scheduler is already present for the GitHub Issues bootstrap queue; do not add a second scheduler/service merely to obtain periodic wakeups.

## Critical distinction: two independent state systems

1. **GitHub Issues bootstrap queue** — the existing Supervisor reads/writes Issue labels and comments and dispatches the allowlisted Worker workflow when the dispatch gate is enabled.
2. **D1 attempt/projection outbox proof** — PR #58/#59 introduce a separate local Workers-runtime D1 ledger and a fake GitHub projection adapter. They are stacked proof branches, not integrated into default Supervisor runtime.

The existing cron does not currently poll or drain the D1 projection outbox. PR #59's `deadLetterExpiredProjection()` is not invoked by its sibling `projection-reconciler.mjs`; the D1 proof workflow only runs tests and uploads an artifact. A cron trigger existing in another subsystem is not evidence that the D1 outbox has a production consumer, hosted schema, or durable recovery loop.

## Finding A — dispatch-off early exit suppresses recovery

At default HEAD, `scripts/pool-supervisor.mjs` computes `dispatchEnabled` and immediately exits when it is false, before the calls to:
- `recoverFailedWorkflowRun()`;
- `recoverStaleClaims()`;
- `dispatchReadyTasks()`.

Thus the current fail-closed dispatch setting also disables issue-state recovery. The workflow still wakes on its cron, but only emits a heartbeat and exits. This is consistent with the explicit current log message; whether recovery should be allowed while dispatch is disabled is a policy decision requiring a split between recovery authority and dispatch authority, not an unreviewed code change.

Required bounded remediation design:
- Preserve dispatch fail-closed.
- Separate read-only inspection, bounded recovery mutations, and new worker dispatch into independently gated operations.
- Define exact least-privilege permissions for each operation; current workflow has contents:read, issues:write, actions:write.
- Ensure stale-claim recovery cannot requeue an issue while an ambiguous worker dispatch may still exist; preserve current run matching and explicit terminal evidence.
- Add tests for dispatch-disabled behavior: no workflow dispatch; recovery only when its own policy gate permits; malformed/ambiguous run evidence fails closed.
- Do not enable either gate or run the Worker during this work.

## Finding B — D1 outbox recovery is not wired

PR #59 adds bounded retry/dead-letter state and an isolated expired-fifth-lease recovery function, but no production D1 binding, hosted migration, invocation path, or scheduled/queue consumer has been evidenced. Reusing the five-minute cron is a plausible future trigger only after a durable D1 binding and bounded batch API are integrated and qualified. The trigger itself must not create new task execution or bypass the task/attempt authority boundary.

## Recommended next implementation sequence

1. Finish local D1 invariants, including monotonic delivery-attempt protection and adversarial tests.
2. Design a narrow D1 recovery batch contract: bounded page size, stable cursor/lease selection, expiry fencing, idempotent status/event updates, and observable counters.
3. Separately design Supervisor operation gates so dispatch-disabled mode can perform only explicitly authorized recovery/inspection.
4. Integrate the D1 recovery batch with the existing five-minute Supervisor only after hosted D1 entitlement/binding/migration and least-privilege authority are verified. Keep it read-only or recovery-only; no worker dispatch from the D1 projection path.
5. Test interrupted runs, overlapping scheduled invocations, expired lease generations, retry deadlines, dead-letter terminality, and GitHub API ambiguous responses.
6. Exact-head CI, independent security review, and documented acceptance before any deployment.

## Disposition

- Existing GitHub Actions five-minute scheduler: IMPLEMENTED in default branch; live scheduled execution and operational reliability NOT VERIFIED in this pass.
- Existing GitHub Issues Supervisor: IMPLEMENTED SCAFFOLD; current dispatch gate fail-closed.
- Dispatch-disabled stale-claim recovery: BLOCKED by early exit.
- D1 outbox production recovery consumer: NOT IMPLEMENTED / NOT VERIFIED.
- Hosted D1 migration and binding: NOT VERIFIED.
- No code changes, merge, deployment, workflow dispatch, secret access, provider/model call, or paid resource creation occurred.
- Contour A BLOCKED / NOT ACCEPTED. Contour B DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
