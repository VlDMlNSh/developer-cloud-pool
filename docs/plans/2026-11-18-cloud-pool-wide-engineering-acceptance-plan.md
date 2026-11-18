# Cloud Pool wide engineering and acceptance plan — 2026-11-18

## Purpose and operating rule

This plan is a repository-wide execution map, not a claim that the Cloud Pool is production-ready. Work is performed through GitHub APIs on isolated branches and pull requests. The default branch `Основной` is not modified directly. No secrets are read or printed; no production credentials, provider calls, deployments, external dispatch, object deletion, or merges are performed as part of this plan.

Acceptance is evidence-based: exact commit SHA, pinned dependencies, least-privilege workflow, deterministic tests, CI run URLs, artifact hashes where relevant, and explicit negative tests. The current owner direction defers external/independent reviews until the pool can perform its own bounded review workflow; this deferral must be stated, not misrepresented as a completed review. A local Workers/Miniflare proof is not hosted Cloudflare D1/R2 qualification. A passing smoke test is not a security audit.

## Repository baseline observed

- Public repository: `VlDMlNSh/developer-cloud-pool`; default branch: `Основной`.
- README declares the 20-slot cloud architecture DESIGN; Supervisor/queue IMPLEMENTED SCAFFOLD, NOT RUN; one DSH headless worker profile IMPLEMENTED, NOT RUN; scheduled/event-driven wake-up IMPLEMENTED but NOT VERIFIED; general-purpose execution, checkpoint/resume and automatic continuation NOT IMPLEMENTED.
- Dispatch is fail-closed until default-branch governance is enabled and `POOL_DISPATCH_ENABLED=true`; the README explicitly says dispatch is currently disabled.
- README also says DSH is developer-preview, has not undergone security audit, hosted runners are ephemeral (six-hour maximum), and provider egress allowlisting is not yet implemented.
- PR #135 records 38 passing local Workers-runtime tests and successful exact-head CI for its head, but explicitly leaves cross-store R2/D1 snapshot consistency unqualified. Its inventory adapter always reports `crossStoreSnapshotConsistent: false` and `deletionPermitted: false`.
- PR #126 proposes retiring the currently active legacy label-driven DSH dispatch path; its exact-head Pool Contract Validation passed, but the PR remains draft/unmerged, so the default branch still contains the legacy path. This is the highest-priority code-level safety correction.
- PR #136 is a corrective documentation-only boundary repair; it removes exactly two misplaced docs from default branch. Keep it separate from source/proof changes.
- PR #116 records a hosted runner qualification for Claude Code/ECC/FCC with a no-egress Docker container proof, but explicitly does not establish runner-wide egress allowlisting.
- PR #114 records a clean-base owner `/next` admission proof: local D1 atomic admission, replay handling, and `dispatch: false` / `executionAuthorized: false`. This is not live dispatch qualification.
- Many PRs are deliberately draft/WIP and target the default branch or stacked feature branches. Their existence is not acceptance. Review dependency order and exact bases before promoting any stack.

## Priority execution lanes

### P0 — Protect the control plane and preserve branch hygiene
1. Verify default-branch ruleset/branch protection, required checks, review policy, and bypass actors using supported GitHub governance endpoints.
2. Keep `POOL_DISPATCH_ENABLED` false until governance and the complete dispatch acceptance gate are verified.
3. Complete the PR #126 retirement of legacy label-driven DSH dispatch before any future dispatch enablement; the default branch still contains the old path until that PR is integrated.
4. Audit PR #136 exact diff and ensure the two misplaced documentation files are restored only on their intended docs branch.
5. Build a dependency DAG for stacked PRs; reject stale bases, cycles, accidental cross-lane coupling, and unrelated files in a PR.
6. Ensure no secrets, credentials, tokens, or private environment values appear in logs, docs, artifacts, or test fixtures.

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

1. Inspect the exact diff, review threads, CI and base of PR #126; verify the legacy dispatcher is removed only in the proposed branch and its safety validator is exact-head green.
2. Inspect the exact diff, review threads, CI and base of PR #135; verify whether the README and implementation still agree.
3. Inspect PR #136's exact two-file corrective diff and CI; do not merge it automatically.
4. Build the PR dependency DAG from branch heads and merge bases; identify stale/stacked PRs and duplicate work.
5. Audit governance and workflow permissions, including scheduled/event-driven dispatch gates.
6. Reconcile the clean D1 admission/lease/result stacks and registry stack; nominate one candidate per lane for next acceptance.
7. Continue Issue #137 with a no-delete protocol and adversarial race tests.
8. Produce a current evidence matrix: claim, exact SHA, test/CI run, artifact, known gap, next acceptance action.

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


## Pass 2 — PR dependency and clean-base audit (2026-11-18)

### Verified dependency map

- PR #126 (legacy DSH retirement): exact head `f69f286b5b5a3de8dfdd80ed581859851ce271e5`; one exact-head Pool Contract Validation check completed SUCCESS (run 44275194245). Its six-file diff removes the legacy label-driven supervisor API mutations and worker execution, replacing them with fail-closed guards. No review threads were found. It remains OPEN/DRAFT/UNMERGED.
- PR #126's base was `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`. Comparing its head with current default HEAD `68183828cf7934e89109310c8f99281be4eb7ed8` reports DIVERGED (2 commits ahead, 9 behind). Its earlier green check is valid for its exact old head only; it is not current-base acceptance. Do not merge as-is.
- PR #112 is event-envelope validation only (21 tests); PR #114 is atomic D1 admission/outbox (12 local Workers-runtime tests); PR #111 is the D1 lease/attempt ledger (37 local Workers-runtime tests). All are open Draft proofs and not deployed.
- PR #125 composes GitHub Actions context with PR #114's D1 admission adapter. Its exact head `69398d497c8e9be3e9fe7241e4dc6d3bc2e4c973` has two successful exact-head checks (runs 44265881516 and 44265877332). Its body explicitly says the composition remains synthetic-context/local proof, not a live authenticated controller or execution authorization.
- PR #125 is stacked on PR #114, while PR #114 itself is based on the old default SHA. PR #111 is a separate clean-base lease proof, not yet composed with #114/#125. PR #112 is a separate read-only controller proof. PR #97/#98 are earlier admission approaches and should not be treated as additional canonical production paths.
- PR #92 and #93 form a separate D1 admission/registry proof stack (exact replay integrity then verifier-issued registry persistence capability). They remain local-only and stacked; do not conflate them with the #111/#114/#125 admission-controller chain.

### Decisions for the next execution pass

1. First produce a clean-base legacy-retirement PR from current default HEAD `68183828cf7934e89109310c8f99281be4eb7ed8`, carrying the reviewed six-file PR #126 change set. Re-run YAML, contract and exact-head CI. Keep the original #126 Draft as historical evidence; do not merge it.
2. In parallel, map exact file overlap and schema compatibility between #111 lease ledger, #114 admission/outbox and #125 Actions-context composition. Choose one canonical chain; do not merge competing controller PRs.
3. Port #114 and #111 onto a single current-base integration branch only after comparing migration IDs, D1 schema, immutable identities, approval consumption, outbox and lease fencing. Keep dispatch false in every adapter.
4. Recompose #125 against the current-base #114 head and ensure it cannot allowlist the retired `dsh-headless-probe` profile. The owner-frozen first executor is Claude Code + ECC + FCC; Gemini is optional, not a launch gate.
5. Keep #112 as a separately testable event predicate until the durable D1 path consumes the trusted Actions envelope. Do not wire its read-only workflow into a live dispatch trigger.
6. Treat PR #92/#93 as registry/replay hardening inputs to integrate only after the admission/lease schema is unified; preserve verifier-issued capability and exact replay receipt integrity.

### Pass 2 disposition

- PR #126 code change is technically promising and exact-head CI-green, but stale/diverged from current default. No merge is safe yet.
- Admission proofs contain useful passing local tests, but none qualifies hosted D1, live webhook authentication, a production lease lock, provider quota isolation or worker dispatch.
- The current safe next implementation is a clean-base port of PR #126; the next architecture task is a unified admission + lease + Actions-context proof chain. No dispatch, merge, deployment, hosted D1/R2 write, provider call or secret access was performed.


## Pass 2 execution result — 2026-11-18

- Completed source-level dependency audit for PRs #111, #112, #114 and #125. They are distinct proofs, not an accepted integrated controller.
- Verified PR #126's six-file legacy DSH retirement and its exact-head Pool Contract Validation SUCCESS (run 44275194245). The original branch is 9 commits behind current default and must not be merged as-is.
- Created clean-base branch `fix/retire-legacy-label-dispatch-clean-base-2026-11-18` from default HEAD `68183828cf7934e89109310c8f99281be4eb7ed8`, ported the six exact changed paths and opened Draft PR #139.
- PR #139 exact head `4b35f949fa9bd0f924582f9eb47008c191c061ee` has Pool Contract Validation run [44349941243](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44349941243) COMPLETED / SUCCESS. Verified steps: dispatch gate, workflow YAML parse, and pool security contract validator all passed.
- PR #139 contains exactly the six expected paths; no review threads found. It remains OPEN/DRAFT/UNMERGED. The original PR #126 remains untouched.
- Created Issue #140 for the next integration slice: one current-base D1 admission + Actions context + lease/fencing proof chain. It explicitly prohibits live dispatch, hosted D1, provider calls, secrets, deployment and merge.
- No default-branch changes, merge, deployment, dispatch, provider call, secret read or production write occurred.

### Next pass
Execute Issue #140 by comparing source/schema overlap and porting the canonical admission + lease proof to one clean current-base branch. Keep all adapters non-dispatching. First resolve the profile mismatch in PR #125: remove the retired dsh-headless-probe allowlist and align with the owner-frozen CODE profile only after the no-secret CODE sandbox evidence is verified.


## Pass 3 — D1 admission/lease integration audit (2026-11-18)

- Audited the actual SQL migrations and adapters from PR #111, #112, #114 and #125.
- Confirmed the branches are all diverged from current default HEAD `68183828cf7934e89109310c8f99281be4eb7ed8`, with merge base `35208f0ef28f0ac031a7acdf35fc90ccc9b16845` (two commits behind).
- Found incompatible shared schemas: #111 and #114/#125 independently create `pool_approval_ledger`; their `pool_task_outbox` tables have different unique keys and event types; #111 adds a second task-level outbox and its `pool_tasks` shape cannot be retrofitted by `CREATE TABLE IF NOT EXISTS`.
- Found profile/provenance defects to resolve before composition: #111/#125 still allow retired `dsh-headless-probe`; #125 sets `targetSha` and `trustedDefaultHeadSha` from the same `GITHUB_SHA`, so it does not independently establish current default-ref provenance.
- PR #112 remains read-only event-envelope validation, not a durable admission path.
- Recorded the complete schema compatibility matrix and canonical target in Draft PR #141: https://github.com/VlDMlNSh/developer-cloud-pool/pull/141
- Updated Issue #140 with the concrete blockers and the no-dispatch integration direction.
- Disposition: code composition is BLOCKED until one canonical migration lineage is implemented. Do not stack the existing migration roots.

### Next code pass
Create one clean-base integration branch from the current default; implement a single receipt-driven schema where the task row also owns lease/fencing state, keep exactly one task-ready outbox, add immutable attempts/events and a non-authorizing reconciliation queue, then port the event predicate and Actions adapter with an independently sourced current-ref SHA. Remove the DSH profile. Preserve `dispatch:false` and `executionAuthorized:false` throughout.


## Pass 4 — legacy DSH PR dependency and canonical D1 lineage (2026-11-18)

### PR #126 dependency disposition
- PR #126 is based on stale default SHA `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Its six-file retirement change has been transplanted to Draft PR #139 from current default `68183828cf7934e89109310c8f99281be4eb7ed8`.
- PR #139 head `4b35f949fa9bd0f924582f9eb47008c191c061ee` compares as 6 ahead / 0 behind and changes exactly the six intended files.
- Exact-head Pool Contract Validation run `44349941243` completed SUCCESS.
- PR #126 remains open/draft; do not merge it. PR #139 is the current-base candidate. No merge or close action was taken.

### Canonical D1 lineage refined
- Current-default design docs identify PR #67's isolated `proofs/d1-ledger` package (migrations 0001–0010) plus stacked PR #72's additive migration 0011 and composite admission adapter as the intended single D1 lineage.
- PR #111's lease guard is numbered 0006 in its port, but #67 already uses 0006 for projection outbox. Reconcile it as migration 0012 only after validating exact trigger/schema ordering.
- PR #72 hardcodes retired `dsh-headless-probe` in migration and adapter. Replace with the exact frozen CODE profile across schema, adapters, fixtures and tests.
- PR #67/#72 are 81 commits behind current default; selective transplant and exact-head requalification are mandatory. They must not be merged as-is.
- PR #114/#125's separate `proofs/d1-admission` package must not become a second admission authority. PR #125 also needs an independently sourced current-default-ref SHA boundary.

### Evidence and records
- Refined integration audit is recorded in Draft PR #141: https://github.com/VlDMlNSh/developer-cloud-pool/pull/141
- Issue #140 updated with the revised canonical lineage and porting requirements.
- PR #126 dependency comment points to current-base PR #139.

### Next implementation stage
Create one clean-base integration branch. Selectively transplant the #67/#72 D1 ledger package, reconcile migration 0012 for the lease guard, replace the retired DSH profile with the frozen CODE profile, then port the owner-only event predicate and a trusted Actions context adapter with an independent current-ref read. Run complete exact-head Workers-runtime and contract CI. Keep dispatch and execution authorization false.
