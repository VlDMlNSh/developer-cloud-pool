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


## Follow-up benchmark — native GitHub approval and concurrency primitives (2026-11-05)

### New finding: GitHub Environments are a stronger candidate than issue-label approval

Official documentation:
- [Managing environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments): Environments and protection rules are available for public repositories on all current GitHub plans. Required reviewers are available on GitHub Free for public repositories; up to six people/teams may be configured, and one approval is sufficient. Prevent self-review is configurable.
- [Reviewing deployments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/review-deployments): a reviewer approves/rejects a specific workflow job waiting on environment protection.
- [Deployment API](https://docs.github.com/en/rest/deployments/deployments): deployments are associated with a specific ref/SHA and have auditable status transitions.
- [Workflow concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency): concurrency groups limit simultaneous execution; `queue: max` permits up to 100 pending runs, but FIFO order is not guaranteed and default pending behavior replaces an earlier pending run.

Repository fit:
- This repository is currently PUBLIC, and the user constraint is GitHub Free. Therefore native Environment required-reviewer protection is a viable no-additional-infrastructure candidate, subject to live repository configuration verification.
- A dedicated protected Environment could gate the privileged execution job. Its reviewer decision is attached to a particular workflow deployment/job rather than being inferred from mutable issue labels. Prevent self-review should be enabled where supported/configured.
- The approval gate must be placed before any job receives runtime credentials or performs task execution. Validation and approval metadata must bind to immutable task issue, target SHA, profile and workflow run.
- This is a candidate design, NOT YET IMPLEMENTED OR QUALIFIED. We have not inspected live Environment settings, reviewer configuration, bypass policy, or deployment records for this repository.

Important limitations:
1. Environment approval is a per-deployment human gate; it is not by itself a complete task queue, deduplication protocol, or exactly-once execution ledger.
2. Workflow concurrency is not a transaction or compare-and-swap. GitHub documents that queue order is not guaranteed; it must not be represented as a durable FIFO approval ledger.
3. A duplicate trigger may create another workflow run/deployment. Each run must remain independently gated; no stale approval may authorize a different run, SHA, profile, or issue.
4. The production Worker currently uses `workflow_dispatch`, while Supervisor uses REST dispatch and has `actions: write`. The native Environment approach does not justify retaining this topology or enabling dispatch.
5. Native Environment configuration and required reviewers must be checked through live GitHub settings/UI/API before relying on them. Do not assume they are already configured.

### Benchmark decision update
Prioritize a non-privileged proof-of-concept for a per-run Environment approval gate on the isolated branch. Compare it against the previous issue-label + GET/PATCH design with tests for:
- correct reviewer identity and prevent-self-review behavior;
- approval tied to one workflow run/deployment and immutable SHA;
- duplicate issue events and repeated runs;
- rejected, expired, canceled and timed-out approvals;
- no runtime credential exposure before approval;
- no bypass path and explicit behavior when Environment settings are missing;
- audit extraction of reviewer, deployment/run ID, task issue, target SHA and profile.

Do not claim exactly-once task execution from Environment approvals or concurrency alone. If the queue still needs atomic single-consumption semantics across retries, retain that as a separate design gate.

### Updated live verification for this follow-up
- PR #12 is OPEN / DRAFT / NOT MERGED; current head reported by PR API: `1549484ab43b25c6e7fc86b28ea91ae9c80d021d`; canonical base SHA remains `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Exact-head Pool Contract Validation run `42025350197`, job `127238073152`: COMPLETED / SUCCESS. Steps included dispatch-disabled assertion, YAML parse, caller tests and static contract validation.
- Exact-head Reusable Worker Context Fixture Caller run `42025350303`, job `127238054663`: COMPLETED / SUCCESS. This is a non-secret context fixture only.
- Combined commit status API returned an empty statuses array; workflow-run records above are the positive CI evidence.
- PR review submissions and review threads remain empty; independent review NOT RUN.
- Production dispatch, DSH, Resource Probe, browser, model/provider calls, Gemini and Claude NOT RUN. Runtime NOT QUALIFIED. Paid fallback NOT USED.
- The previously documented workflow topology remains unchanged: Worker `workflow_dispatch`; Supervisor REST dispatch with `actions: write`; caller validator not wired to production.


## Post-documentation HEAD correction
- The report/checkpoint commits advanced PR #12 after the benchmark CI above. Current PR #12 head is now `ed18fd793392297718bdc4332365108c3d48bcd1`; base remains `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- New exact-head runs are queued: Pool Contract Validation `42025677984` and Reusable Worker Context Fixture Caller `42025678004`. They are NOT VERIFIED until terminal results are read.
- Combined commit status is empty. The prior successful runs `42025350197` and `42025350303` cover the preceding head `1549484ab43b25c6e7fc86b28ea91ae9c80d021d`, not the new documentation HEAD.


## Follow-up: audit of existing owner-approval implementation PR #7 (2026-11-05)

### Existing work discovered — do not duplicate
PR [#7 — bind pool dispatch approval to repository owner](https://github.com/VlDMlNSh/developer-cloud-pool/pull/7) already contains `scripts/pool-approval.mjs`, tests and Supervisor integration. Its current head is `e7a1d20bc123f9f3cc6e6651b6335bebd802e333`; base SHA is `692025e4a039aaf94c6683bb95da38b4f324fce8`. PR #7 is OPEN / DRAFT / NOT MERGED.
- Current exact-head CI: Pool Contract Validation run `41921293708`, job `126894183572`: COMPLETED / SUCCESS. The job ran YAML parsing, dispatch-disabled assertion, owner approval tests and static contract validation.
- Review submissions contain one COMMENTED review authored by the repository owner, not an independent security review. It identifies a critical bypass: Worker remains directly callable through `workflow_dispatch`; Worker validation checks `pool:claimed`, issue state and SHA/profile but does not independently verify the owner-approval marker/caller provenance. A caller with sufficient Actions dispatch permission could bypass Supervisor approval. Independent review remains NOT RUN.

### Static findings in PR #7 approval module
Read back and verified:
- `scripts/pool-approval.mjs` blob `9442c413c38dc28c67455362e254ff703bcfedd9`
- `scripts/pool-approval.test.mjs` blob `c7c7499d9d2bb4c123e72b86adb85369023c4284`
- `scripts/pool-supervisor.mjs` blob `b2046dd9671c6bd5491f63a006d10239fbd3d3b1`

Positive properties:
1. Approval intake is tied to an `issues.labeled` event for `pool:ready`, and sender login is compared with repository owner login.
2. Task envelope is constrained to the expected immutable 40-hex SHA and allowlisted DSH profile.
3. A bot-authored marker binds issue number, owner login, SHA and profile.
4. Consumption is recorded before REST dispatch; dispatch failure and stale claim move to needs-review instead of silently restoring ready.
5. Removing `pool:ready` records revocation.
6. The Supervisor exits before recovery/dispatch when `POOL_DISPATCH_ENABLED` is not literal `true`.

Unresolved issues:
1. **Worker-side bypass (confirmed by the PR's own review comment):** the approval guard is in Supervisor only. Worker remains directly dispatchable and does not independently authenticate the approval/caller boundary. This alone blocks adoption/qualification.
2. **Replay/idempotency gap (static-analysis finding):** the approval marker does not record a unique trusted GitHub event/delivery identifier. If an old owner-labeled event is replayed/redelivered after its marker was consumed, `recordOwnerApproval()` can see no active marker and append a new one from the old payload. No test covers replay/redelivery of the same approval event after consumption. Treat replay safety as NOT PROVEN; add a deterministic event identity and persistent deduplication rule or use a native per-run Environment approval gate.
3. Approval identity is stored as mutable login text, not stable numeric GitHub user ID. Prefer numeric actor ID from trusted event payload and verify it against the repository owner identity.
4. The marker is a normal issue comment and `hasOwnerApproval` reads only `per_page=100`; it is not an immutable append-only ledger and can fail closed when history exceeds the first page. Do not describe it as cryptographic or transactionally atomic.
5. Supervisor concurrency reduces simultaneous execution but does not make the issue comment/label GET+POST/PATCH sequence a transactional compare-and-swap.
6. PR #7's successful CI is exact-head static evidence only; no live event test with dispatch enabled, Worker dispatch, DSH or runtime qualification occurred.

### Comparison and decision
- PR #7 is valuable existing work and should be adapted rather than independently reimplemented.
- PR #7 is NOT safe to merge/enable as-is because Worker direct dispatch bypasses Supervisor approval; replay safety is also unproven.
- GitHub Environments remain the preferred native no-extra-infrastructure approval gate for privileged job execution: required reviewers are available on public repositories under GitHub Free, approval is attached to a specific waiting job/deployment, and environment secrets are withheld until approval. Configure disallow-admin-bypass and selected-branch restrictions where supported. The actual repository Environment settings remain NOT VERIFIED because the available GitHub integration did not expose the environment administration endpoint.
- Recommended target: use a protected Environment as a per-run human authorization gate, keep PR #7's owner-event intake only if its event provenance is separately hardened and still needed for task queueing, and ensure Worker can only be called through a static Supervisor reusable-workflow edge. Do not treat Environment approval as exactly-once queue consumption; retain separate deduplication/replay controls.
- Do not merge PR #7 or PR #12, wire production dispatch, or run any privileged task until direct Worker bypass is removed, replay tests pass, governance is verified, and independent review is recorded.

## Current PR #12 verification after docs-only follow-up
- PR #12 remains OPEN / DRAFT / NOT MERGED; current head at this audit: `49b7cf0f456d70e37afef129d14b0f96c9090c3e`; canonical base `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Exact-head Pool Contract Validation run `42025722988`, job `127239348600`: COMPLETED / SUCCESS.
- Exact-head Reusable Worker Context Fixture Caller run `42025722995`, job `127239323512`: COMPLETED / SUCCESS; non-secret context fixture only.
- Combined commit status array empty; the two workflow runs above are positive CI evidence.
- PR #12 review submissions and review threads empty; independent review NOT RUN.
- Current branch code still has caller validator `scripts/pool-worker-caller.mjs` not wired into production Worker. Worker still uses `workflow_dispatch`; Supervisor still uses REST dispatch with `actions: write`.


## Final HEAD correction after report/checkpoint commits
- The documentation commits advanced PR #12. Latest PR #12 head is now `4e86be99a268c685d0804783b501e801157af76f`; canonical base remains `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- The two successful workflow runs `42025722988` and `42025722995` apply to the preceding code-bearing head `49b7cf0f456d70e37afef129d14b0f96c9090c3e`. The later commits changed documentation only, outside the contract workflow's `.github/workflows/**` and `scripts/**` path filters. Therefore no workflow runs were returned for documentation HEAD `4e86be9...`; do not label it exact-head CI PASS. The unchanged code-bearing tree has the two successful runs listed above; latest commit's workflow status is NOT VERIFIED.
- PR #12 remains OPEN / DRAFT / NOT MERGED; mergeability currently returned false (may be transient GitHub calculation; do not merge).
- PR #7 remains OPEN / DRAFT / NOT MERGED at `e7a1d20bc123f9f3cc6e6651b6335bebd802e333`; exact-head static CI run `41921293708` / job `126894183572` SUCCESS; independent review NOT RUN.
- Latest report blob: `<REPORT_BLOB_PENDING>`.
