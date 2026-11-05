# 2026-11-05 — Mature GitHub project benchmark and pool boundary audit

## Scope and immutable target
- Repository: `VlDMlNSh/developer-cloud-pool`
- Canonical branch: `Основной`, HEAD `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Working branch: `feat/reusable-worker-call-boundary-2026-11-05`.
- PR #12 exact head / benchmark target: `ea84b66ded2bb5044202d86143c878fa4bc565d6`.
- Compare: 37 commits ahead, 0 behind; merge base equals canonical HEAD. PR #12 remains OPEN / DRAFT / NOT MERGED.
- This is an audit and benchmark pass. No production workflow or runtime changes were made.

## Mature-project benchmark

### 1. GitHub Actions Runner — `actions/runner`
- Repository: https://github.com/actions/runner
- Official GitHub runner agent implementation; README describes the component as the process that executes a workflow job on hosted or self-hosted environments.
- README explicitly says the project is not currently accepting contributions, while security updates and major breaking fixes continue.
- Fit: useful as a source of truth for runner lifecycle/runtime behavior, but it is not a pool scheduler, queue, approval ledger, or orchestration controller. Do not vendor or fork it for this project.
- Evidence read: README blob `0279d839ea5015e63a7136ae5116a1b52e66c97c`.

### 2. Actions Runner Controller — `actions/actions-runner-controller`
- Repository: https://github.com/actions/actions-runner-controller
- Official GitHub Actions-team collaboration project; README describes a Kubernetes operator that manages ephemeral/containerized runner scale sets and autoscaling.
- The README distinguishes current runner scale-set autoscaling from legacy autoscaling modes, which are community-maintained.
- Fit: mature reference for ephemeral runner lifecycle, scale-to-demand and clean runner teardown. Not a drop-in for this repository's current GitHub-hosted ephemeral Ubuntu jobs: it requires a Kubernetes control plane and self-hosted runner infrastructure, adding operational cost and another privileged control plane. This conflicts with the current GitHub-Free-only / no-paid-infrastructure constraint.
- Decision: architecture reference only; no ARC deployment or adoption in this phase.
- Evidence read: README blob `8a3711be65e12c8c89db2610a5b39ae423b862f7`.

### 3. RunsOn — `runs-on/runs-on`
- Repository: https://github.com/runs-on/runs-on
- README documents per-job isolated EC2 runners, scale-to-zero, AWS control-plane ownership, and production-scale claims.
- Its README describes commercial licensing (commercial license from €300/year; AWS compute/storage billed separately) and a commercial server/agent boundary; public CloudFormation assets do not make the full platform free/open-source.
- Fit: strong benchmark for ephemeral-per-job isolation, runner profiles, capacity policy, telemetry and cost accounting. Not eligible for adoption under the current strict free-only GitHub/no-cloud-bill constraint.
- Decision: use design patterns as comparison points only; no dependency, deployment or paid trial.
- Evidence read: README blob `3e9c6232b355beafd3dd58f8ce3ab08c091cb46c`.

## Internal implementation audit
Read the current working-branch versions of:
- `scripts/pool-supervisor.mjs` blob `52bf03ca889edd92fd10c71ae96a2e35e106d43f`
- `.github/workflows/pool-worker.yml` blob `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`
- `.github/workflows/pool-supervisor.yml` blob `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`

Findings:
1. Worker remains triggered by `workflow_dispatch`; Supervisor calls REST workflow dispatch and therefore retains `actions: write`.
2. Worker validates issue-open state, `pool:claimed`, target SHA and profile, but those labels do not cryptographically or transactionally prove owner approval.
3. Supervisor updates issue labels with a GET/PATCH sequence. This is not an atomic compare-and-swap and does not establish replay-safe single-use approval under duplicate events or concurrent actors.
4. `recoverStaleClaims` can return a claimed issue to ready based on a time/run lookup; it is recovery behavior, not proof that an approval token was consumed exactly once.
5. Existing caller validator is still not wired into the production Worker.
6. Existing supervisor concurrency group serializes Supervisor workflow runs, but it does not by itself make the issue approval/label state a durable, immutable, single-use authorization record.

## Current verification evidence
- PR #12: OPEN / DRAFT / NOT MERGED; head `ea84b66ded2bb5044202d86143c878fa4bc565d6`; base `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Compare: 37 ahead / 0 behind.
- Exact-commit workflow runs returned for target SHA:
  - Pool Contract Validation run `42024861836`, job `127236410587`: COMPLETED / SUCCESS. Steps include dispatch-disabled assertion, YAML parse, caller authorization tests, and static pool contract validator.
  - Reusable Worker Context Fixture Caller run `42024861862`, job `127236411157`: COMPLETED / SUCCESS. Non-secret caller/callee context fixture only.
- Combined commit status endpoint returned an empty statuses array; the two workflow-run records above are the actual positive CI evidence. Do not interpret the empty status array as failure or as additional passing checks.
- PR review submissions empty; independent security review NOT RUN.
- No production Worker dispatch, DSH, Resource Probe, browser, Gemini, Claude, provider/model calls, or privileged execution occurred. Runtime NOT QUALIFIED. Paid fallback NOT USED.

## Decision
No mature project discovered in this pass is a safe, free, drop-in replacement for the current pool controller:
- ARC is a Kubernetes/self-hosted runner platform and adds infrastructure not present in the current design.
- RunsOn depends on AWS and commercial licensing.
- actions/runner is the execution agent, not an orchestrator.
Keep the current GitHub-hosted ephemeral job architecture. Reuse documented patterns, not entire platforms.

## Next bounded step
Design and test a GitHub-Free-compatible owner approval provenance and single-use consumption primitive. Evaluate immutable Git commit/ref-based ledger options and GitHub Actions concurrency semantics against duplicate delivery, concurrent Supervisor runs, crash/replay, ref-update races, and auditability. Do not convert production Worker to `workflow_call` until the authorization primitive is proven. Keep dispatch disabled and PR #12 Draft.
