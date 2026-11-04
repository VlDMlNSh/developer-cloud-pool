# GitHub Pool Supervisor and Recovery Architecture

**Status:** IMPLEMENTED SCAFFOLD / NOT RUN / NOT QUALIFIED  
**Scope:** Cloud-first Developer Cloud Pool. No local deployment in this phase.

## 1. Objective

Operate a logical pool of up to 20 concurrent standard GitHub-hosted jobs without requiring an always-on server or a local machine to remain online. GitHub Actions is the control/event plane and ephemeral jobs are workers.

This is a best-effort event-driven supervisor, not a continuously running daemon. GitHub Actions has no permanent process inside a hosted runner. The supervisor wakes from:
- a scheduled reconciliation every five minutes (fallback);
- an owner applying the `pool:ready` label to a task issue;
- completion of a `Pool Worker` workflow;
- manual `workflow_dispatch`.

Scheduled events can be delayed or dropped during GitHub load, so event triggers and periodic reconciliation complement one another. No guarantee of uninterrupted availability or exact five-minute dispatch is claimed.

## 2. Lifecycle

1. An approved task is recorded as a GitHub Issue using the pool task template.
2. An owner reviews the requested profile and immutable target commit SHA.
3. The owner applies `pool:ready`. This is the explicit dispatch approval.
4. The serialized Pool Supervisor validates the issue body and profile allowlist.
5. It atomically changes the task label to `pool:claimed`, comments the task/run metadata, and dispatches `pool-worker.yml` using the short-lived repository `GITHUB_TOKEN`.
6. The worker checks out exactly the supplied SHA and runs only the allowlisted profile.
7. A separate reporting job, which does not install or execute agent code, updates the issue to `pool:probe-complete` or `pool:needs-review`.
8. `workflow_run: completed` wakes the supervisor to process the next queued issues. The five-minute schedule is the recovery/reconciliation fallback.

The first profile is deliberately limited to a DSH headless package/configuration smoke test. It makes no model call, receives no provider key and executes no user-supplied shell command. This proves the dispatch path, not general-purpose agent execution.

## 3. Twenty-slot model

The 20 slots are an account-level concurrency ceiling for the Free plan's standard hosted jobs, not 20 dedicated VMs and not 20 slots per repository. Jobs from other repositories owned by the same account can consume the same concurrency. GitHub performs actual scheduling and may leave jobs queued.

The supervisor can dispatch up to 20 approved task workflows per reconciliation. It does not reserve or guarantee all 20 slots. Other repository workflows, plan limits, service availability and GitHub queueing take precedence.

A supervisor run briefly consumes one job slot. The supervisor exits after dispatch; workers are independent workflow runs. Do not create 20 permanent poller jobs or let workers directly start arbitrary sibling workflows.

## 4. Six-hour boundary and handoff

GitHub-hosted jobs have a hard six-hour execution limit. The design must not depend on a process surviving that boundary.

For future long-running profiles:
- Set a soft deadline below the hard six-hour limit.
- Checkpoint useful progress to durable GitHub-backed task state at bounded intervals.
- Include task ID, target SHA, checkpoint schema/version and artifact digests.
- On normal completion, failure or timeout, emit a terminal state.
- Requeue only if a valid checkpoint exists and retry policy allows it.
- A replacement worker must validate the same immutable task target and checkpoint before resuming.
- Use idempotency keys and lease ownership to prevent two workers from writing the same task.

The current DSH probe is short-lived and does not yet implement general checkpoint/resume. Automatic continuation of arbitrary agent work is therefore NOT IMPLEMENTED.

## 5. Queue and durable state

Phase 1 uses GitHub Issues as a bootstrap task ledger:
- issue body: objective, profile, target SHA and acceptance criteria;
- labels: ready, claimed, probe-complete, needs-review, invalid;
- comments: dispatch and terminal evidence;
- Actions workflow runs: execution logs and run metadata;
- artifacts: compact non-secret evidence only, with explicit retention.

Issues are a low-volume bootstrap queue, not a high-throughput transactional database. A later Pool Bridge can migrate task leases and audit metadata to PostgreSQL. Do not use Actions cache as durable storage or as a shared filesystem.

The supervisor serializes claims within this repository. It must never infer task authority from issue text beyond the strict schema and profile allowlist. The issue author cannot supply commands, URLs, secrets or arbitrary workflow names.

## 6. Security and credentials

- Supervisor permissions: only `actions:write` and `issues:write` plus required read access.
- Worker execution job: read-only repository access; no provider credentials.
- Reporting job: issue-write permission, but it does not install or execute third-party agent code.
- The supervisor uses the job-scoped `GITHUB_TOKEN`; GitHub documents that `workflow_dispatch` and `repository_dispatch` are permitted workflow-trigger exceptions for events created by this token.
- Never echo tokens, API keys, private keys, environment dumps or authorization headers.
- Logs contain task IDs, run IDs, target SHA, provider/model route identifiers, status and usage metadata only. Secret values must be masked and excluded.
- Future cross-repository access requires an explicitly scoped GitHub App installation token and repository allowlist. A PAT is not the default.
- No public PR code is executed on the local Mac mini.

GitHub Actions logs and task comments are not a secrets vault. Key material belongs in GitHub Secrets or a dedicated secrets manager with least privilege and rotation. A log entry may contain a non-secret key identifier, never the key itself.

## 7. Geographic independence and limitations

The dispatcher and task ledger are hosted in GitHub, so the control plane does not depend on the Mac mini or on a local server being powered on. The standard hosted runner's physical region is managed by GitHub; this design does not guarantee a selectable execution country, data residency, or that logs/artifacts are stored in a chosen jurisdiction.

If residency becomes a contractual requirement, select a GitHub product/region offering that explicitly supports it and verify the data-residency terms before storing regulated data. For now, send only the minimum task metadata needed by the worker and do not place secrets or sensitive personal data in issue bodies, comments or logs.

## 8. Cross-repository scaling

GitHub account concurrency is shared across repositories. A central pool repository can later dispatch work into an allowlisted set of repositories, but this first implementation intentionally operates only on task issues in `VlDMlNSh/developer-cloud-pool`.

Cross-repository worker dispatch is a separate gate:
1. install a GitHub App only on approved repositories;
2. validate repository allowlist and exact target SHA;
3. mint a short-lived installation token for one task;
4. avoid passing that token to DSH or arbitrary plugins;
5. keep worker checkout read-only until write operations are separately approved;
6. record repository, SHA, App installation scope and run ID.

## 9. Current components

| Component | Role | Status |
|---|---|---|
| GitHub Actions scheduled supervisor | Periodic reconciliation | Implemented, not run |
| Issues task template | Typed task intake | Implemented, not run |
| Pool Supervisor script | Validate, claim and dispatch | Implemented, not run |
| Pool Worker workflow | DSH headless probe only | Implemented, not run |
| DeepSeek Harness | Candidate task runtime | Developer preview; smoke test pending |
| GitHub Issues | Bootstrap queue | Selected for low-volume phase 1 |
| PostgreSQL / Pool Bridge | Transactional queue and durable state | Deferred |
| GitHub App cross-repo dispatcher | Scoped multi-repo auth | Deferred |
| Checkpoint/resume protocol | Long-running tasks | Design only |
| Mac mini 2011 | Optional later utility node | Not configured |
| Mac mini 2018 / GPU server | Future hardware | Not available; no work scheduled |

## 10. Acceptance gates

- [ ] GitHub recognizes the workflow YAML.
- [ ] Scheduled supervisor starts on the default branch.
- [ ] Idle supervisor completes without dispatching a worker.
- [ ] Invalid issue body is rejected without dispatch.
- [ ] Approved task transitions ready → claimed → probe-complete.
- [ ] Exact target SHA is checked out and recorded.
- [ ] DSH package smoke passes with no provider credentials.
- [ ] Failed worker transitions to needs-review, not infinite retry.
- [ ] Worker completion wakes supervisor.
- [ ] No secret material appears in logs, issue comments or artifacts.
- [ ] Cross-repository dispatch remains disabled until its own security gate passes.

A workflow file committed to the repository is IMPLEMENTED, not TESTED. No gate is PASS until an actual run and its evidence are inspected.
