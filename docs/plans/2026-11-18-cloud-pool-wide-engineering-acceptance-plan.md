# Cloud Pool wide engineering and acceptance plan — 2026-11-18

## Purpose and operating rule

This plan is a repository-wide execution map, not a claim that the Cloud Pool is production-ready. Work is performed through GitHub APIs on isolated branches and pull requests. The default branch `Основной` is not modified directly. No secrets are read or printed; no production credentials, provider calls, deployments, external dispatch, object deletion, or merges are performed as part of this plan.

Acceptance is evidence-based: exact commit SHA, pinned dependencies, least-privilege workflow, deterministic tests, CI run URLs, artifact hashes where relevant, explicit negative tests, and independent review. A local Workers/Miniflare proof is not hosted Cloudflare D1/R2 qualification. A passing smoke test is not a security audit.

## Repository baseline observed

- Public repository: `VlDMlNSh/developer-cloud-pool`; default branch: `Основной`.
- README declares the 20-slot cloud architecture DESIGN; Supervisor/queue IMPLEMENTED SCAFFOLD, NOT RUN; one DSH headless worker profile IMPLEMENTED, NOT RUN; scheduled/event-driven wake-up IMPLEMENTED but NOT VERIFIED; general-purpose execution, checkpoint/resume and automatic continuation NOT IMPLEMENTED.
- Dispatch is fail-closed until default-branch governance is enabled and `POOL_DISPATCH_ENABLED=true`; the README explicitly says dispatch is currently disabled.
- README also says DSH is developer-preview, has not undergone security audit, hosted runners are ephemeral (six-hour maximum), and provider egress allowlisting is not yet implemented.
- PR #135 records 38 passing local Workers-runtime tests and successful exact-head CI for its head, but explicitly leaves cross-store R2/D1 snapshot consistency unqualified. Its inventory adapter always reports `crossStoreSnapshotConsistent: false` and `deletionPermitted: false`.
- PR #136 is a corrective documentation-only boundary repair; it removes exactly two misplaced docs from default branch. Keep it separate from source/proof changes.
- PR #116 records a hosted runner qualification for Claude Code/ECC/FCC with a no-egress Docker container proof, but explicitly does not establish runner-wide egress allowlisting.
- PR #114 records a clean-base owner `/next` admission proof: local D1 atomic admission, replay handling, and `dispatch: false` / `executionAuthorized: false`. This is not live dispatch qualification.
- Many PRs are deliberately draft/WIP and target the default branch or stacked feature branches. Their existence is not acceptance. Review dependency order and exact bases before promoting any stack.

## Priority execution lanes

### P0 — Protect the control plane and preserve branch hygiene
1. Verify default-branch ruleset/branch protection, required checks, review policy, and bypass actors using supported GitHub governance endpoints.
2. Keep `POOL_DISPATCH_ENABLED` false until governance and the complete dispatch acceptance gate are independently verified.
3. Audit PR #136 exact diff and ensure the two misplaced documentation files are restored only on their intended docs branch.
4. Build a dependency DAG for stacked PRs; reject stale bases, cycles, accidental cross-lane coupling, and unrelated files in a PR.
5. Ensure no secrets, credentials, tokens, or private environment values appear in logs, docs, artifacts, or test fixtures.

### P1 — Durable task admission, claims, attempts, and recovery
1. Reconcile PRs #114, #111, #112, #102, #98, #97, #92, #93 and related Issues #96/#38.
2. Verify owner-only `/next` admission, immutable source-comment idempotency, one-shot approval consumption, task/outbox atomicity, and exact-replay behavior.
3. Verify lease fencing against acquisition attempt, stale workers, retries, ambiguous writes, and terminalization.
4. Ensure task/attempt identity is immutable; append-only audit records and monotonic state transitions are enforced by D1 triggers.
5. Prove contention and failure recovery with adversarial local tests; never infer hosted dispatch from local adapter tests.

### P2 — Provider registry, routing, quotas, and authorization
1. Reconcile route-registry verification and D1 persistence work: PRs #75–#86 and #128–#130; identify the single current clean stack and superseded branches.
2. Verify root-signed registry bundle, canonical signature verifier, epoch/watermark monotonicity, exact replay, and verifier-issued persistence capability.
3. Keep A0 admission bound to a currently trusted registry assertion and reject stale registry snapshots.
4. Make quota accounting account-isolated and fail closed when route/quota evidence is missing, stale, or ambiguous.
5. Do not activate Gemini/DeepSeek/Claude provider calls or credentials until a separate provider security, quota, egress, cost and consent gate is accepted.

### P3 — Worker runtime and runner qualification
1. Reconcile PRs #105–#109 and #116, plus Issues #115/#118.
2. Qualify the actual hosted runner image, CPU/memory/disk/time limits, cancellation, isolation, per-task HOME/XDG, PATH ownership, read-only mounts and network policy.
3. Keep browser/agent-browser workers ephemeral; verify untrusted issue/PR content cannot become shell commands, workflow names, or arbitrary tool invocations.
4. Establish provider egress allowlisting at the actual runner boundary; Docker `--network none` only proves the container tested, not the GitHub-hosted runner itself.
5. Measure startup, queue latency, throughput, failure rates and cost before claiming 20-slot capacity. The architecture is a design target, not measured capacity.

### P4 — Artifact trust, D1/R2 integrity, and recovery
1. Continue PR #135 and Issue #133 only as local proof until all stated gaps are closed.
2. Verify trusted ingress authorization, bounded streaming, byte-count enforcement, SHA-256 over actual bytes, conditional create, duplicate/ambiguous-write readback, immutable key/version/size binding, and D1 trigger enforcement.
3. Keep result and outbox artifact references identical and transactionally bound.
4. Keep orphan inventory read-only. R2 pagination and D1 reads are not a cross-store transaction; never assert consistency from two independent reads.
5. Execute Issue #137: define D1-authoritative upload intents/fencing, close/drain upload capabilities before snapshot, bind snapshot to epoch/run ID and trusted time, prove late-write/replay races, and keep deletion impossible.
6. Do not add an R2 lifecycle expiry rule, compare-and-delete, or GC-delete path until a separate reviewed retention policy and actual R2/D1/IAM qualification exist.

### P5 — Projection delivery and external recovery
1. Reconcile projection/recovery actor work: PRs #58–#67 and Issues #59/#60/#63–#66.
2. Prove receipt-bound delivery, least-privilege actor identity, bounded retries, dead-letter behavior, immutable event provenance and fake-GitHub reconciliation.
3. Keep external write actions disabled until the actor's authority, approval source, idempotency and recovery are independently tested.

### P6 — Product surface, observability, and acceptance
1. Reconcile web console/Jarvis/iOS work (Issues #21/#22 and architecture docs) against the actual task/runtime APIs; do not build a UI on an unaccepted control plane.
2. Define operator views for queue depth, lease age, attempts, task terminal state, provider quota, runner health, audit trail and reconciliation backlog.
3. Add structured redacted telemetry, trace correlation and actionable alerts without exposing secrets or user payloads.
4. Define SLOs, capacity/load tests, disaster recovery, backup/restore, data retention and cost ceilings.
5. Publish a release checklist that distinguishes DESIGN, LOCAL PROOF, HOSTED QUALIFIED, SECURITY REVIEWED, and PRODUCTION ENABLED.

## Immediate next passes

1. Inspect the exact diff, review threads, CI and base of PR #135; verify whether the README and implementation still agree.
2. Inspect PR #136's exact two-file corrective diff and CI; do not merge it automatically.
3. Build the PR dependency DAG from branch heads and merge bases; identify stale/stacked PRs and duplicate work.
4. Audit governance and workflow permissions, including scheduled/event-driven dispatch gates.
5. Reconcile the clean D1 admission/lease/result stacks and registry stack; nominate one candidate per lane for next acceptance.
6. Continue Issue #137 with a no-delete protocol and adversarial race tests.
7. Produce a current evidence matrix: claim, exact SHA, test/CI run, artifact, known gap, next acceptance action.

## Acceptance gates

- **G0 Governance:** default branch protected; required checks/reviews verified; dispatch disabled until accepted.
- **G1 Admission:** owner-only request, single-use approval, idempotent durable task/outbox, exact replay and no dispatch by default.
- **G2 Execution:** lease/attempt fencing, isolated worker, strict profile allowlist, bounded resources, safe cancellation and no untrusted command injection.
- **G3 Provider:** verified route registry, account isolation, quota/cost limits, egress allowlist and credential boundary.
- **G4 Artifact:** byte-verified immutable artifact, D1 result/outbox binding, safe recovery and a defensible cross-store snapshot protocol.
- **G5 Operations:** observability, SLO/load/cost evidence, disaster recovery, retention and operator controls.
- **G6 Production:** independent security review, hosted environment qualification, explicit owner approval, staged rollout and rollback proof.

No gate is passed by documentation alone. Every gate requires exact-head evidence and independent review.

## Safety constraints

- GitHub API only for repository work; no local checkout or unreviewed local edits.
- No direct writes to `Основной`; changes only on isolated branches through reviewed PRs.
- No merge, deployment, dispatch, production D1/R2 access, provider calls, secret access, or artifact deletion without a separate explicit authorization and acceptance gate.
- Report concise pass-by-pass outcomes, including blockers and what remains unverified.
