# Pass 55 — Cloud Pool controller trust-boundary source audit

Date: 2026-11-23
Status: **AUDIT VERIFIED; CONTROLLER IMPLEMENTATION BLOCKED; CONTOUR A NOT ACCEPTED**

## 1. Frozen scope and target

- Repository: `VlDMlNSh/developer-cloud-pool`
- Default branch: `Основной`
- Frozen default target SHA: `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`
- Canonical D1 candidate: PR #168, head `caaba7345b698cfcfc92ad711ad1ed985980620d`, base SHA `81baadbb5944e11ed41a64bd0190bf2c8edd0c41`
- Documentation branch: `docs/engineering-excellence-2026-11-23`
- PR #169 head before this pass: `828eb1de92fd369cb8a1fe68f068b687c6838dde`
- Controlling Issues: #96 (owner-only `/next` admission contract), #140 (current-base D1 admission/lease proof chain)
- Objective: trace the actual Cloud Pool `issue_comment` controller and trusted clock callsites, map them to the D1 proof, and determine whether a safe remediation can be implemented without creating a parallel authority path.
- Scope: read-only source, workflow, issue, PR, CI and ruleset audit; report/checkpoint/context publication.
- Non-goals: no code/runtime mutation, no dispatch, no secret/variable value or metadata inspection, no provider calls, no hosted D1, no deployment, no merge, no branch-protection mutation, no Contour B work.

## 2. Live repository and governance evidence

### Repository refs

- Repository metadata confirms default branch `Основной`, public repository, owner permission includes admin.
- Default HEAD read from recent commit search: `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`.
- PR #168: OPEN / DRAFT / UNMERGED; head `caaba7345b698cfcfc92ad711ad1ed985980620d`; base `81baadbb5944e11ed41a64bd0190bf2c8edd0c41`; GitHub currently reports mergeable=true. Compare against current default: DIVERGED, 107 commits ahead / 2 behind; merge base remains `81baadbb5944e11ed41a64bd0190bf2c8edd0c41`. It is therefore not a current-default-based proof chain at this target.
- PR #168 merge-result metadata points to synthetic merge SHA `7989e4538eb39d26f645f856225ba27308dc27ca`. The recorded D1 run `45236726880` (74/74 tests) and Pool Contract run `45236726907` were successful for that prior merge result. They do not qualify the current default after its two later commits.
- PR #169: OPEN / DRAFT / UNMERGED; head `828eb1de92fd369cb8a1fe68f068b687c6838dde`; base `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`; compare is 65 ahead / 0 behind. Current exact-head workflow run list is empty, combined status list is empty, formal reviews 0, review threads 0. Empty checks are NOT VERIFIED, not PASS.
- Active ruleset `26550182`, `Основной — verified`, targets `refs/heads/Основной`, enforcement active. Rules: prevent deletion, prevent non-fast-forward, require PR, resolve review threads. Required approving review count is explicitly 0; no bypass actors; current user cannot bypass. This ruleset does not itself require an independent approval.

### Issue state

- Issue #96 is OPEN and its body defines exact owner-only top-level `/next`, exact issue/repository binding, immutable target SHA, comment-ID idempotency, durable admission before child dispatch, and fail-closed dispatch gates. Its current state remains PLANNED; the issue explicitly says it does not enable execution.
- Issue #140 is OPEN and requires a single current-default-based integration chain, canonical event predicate and D1 adapter path, event context binding, replay/fencing/recovery negative tests, and dispatch-disabled outputs. It prohibits hosted D1, provider calls, deployment, merge and production mutation for this proof task.

## 3. Controller source inventory — decisive finding

The complete recursive Git tree for default SHA `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9` contains these workflows:

| Workflow | Blob SHA | Observed purpose |
|---|---|---|
| `.github/workflows/dsh-runtime-evaluation.yml` | `df8a3788cd8ff4ba5c5b1009298f6bd81b80344d` | DSH runtime evaluation |
| `.github/workflows/pool-contract-validation.yml` | `d6a4e62c1521d09df7835a8a1b918dc83e079504` | Static contract validation |
| `.github/workflows/pool-supervisor.yml` | `3942189fc338b73b39627706ea001e1b87dc0ed8` | Supervisor scaffold |
| `.github/workflows/pool-worker.yml` | `6833692c45bbb0b6f7bf31c068a30888c53f5471` | Worker scaffold |
| `.github/workflows/runner-resource-probe.yml` | `3b925d2ff7db77b669a1056b6ec04d4028640edf` | Runner resource probe |

No `cloud-pool-next-controller.yml`, no other `issue_comment` workflow, and no controller workflow path exists in this default tree. GitHub code search for `issue_comment` in this repository returned no matches; the recursive tree is the primary inventory evidence.

PR #168 adds `.github/workflows/d1-ledger-proof-validation.yml`, blob `c1cff6e9f9ee3ca8f5766e07c7d17f84b21dc05e`. Its trigger is only `pull_request` targeting `Основной`; permissions are `contents: read`; it runs local D1 migration/authority tests. It does not accept issue comments, bind owner/repository/comment IDs, or dispatch any child workflow.

**Finding F-55-01 — BLOCKER:** the Cloud Pool owner-event controller is absent from the current default branch. There is no production event callsite to audit or qualify. Do not substitute the MediaHub OS Gemini controller: it belongs to a different repository and Issue #301 is explicitly a separate control plane.

## 4. D1 proof source map and trust boundary

The PR #168 tree contains the following local-only proof files:

| Component | Path | Blob SHA | What source proves |
|---|---|---|---|
| Admission adapter | `proofs/d1-ledger/src/admit-qualified-task.mjs` | `f4c788c1d5231cdce3a84d006b07407971ef6491` | Validates owner/repository/issue/target SHA/profile and route identity; consumes a single-use approval and creates admission/attempt/outbox/receipt atomically; requires an injected trusted clock; returns non-authorizing outcomes |
| Lease adapter | `proofs/d1-ledger/src/acquire-attempt-lease.mjs` | `0b4798a8a0a38484682165ef8c5265807a04e27b` | Requires injected executor authenticator and trusted clock; binds authenticated principal to executor/profile/task/attempt; checks monotonic generation, lease state and primary readback; outputs `dispatch:false`, `executionAuthorized:false` |
| Reconciliation adapter | `proofs/d1-ledger/src/record-attempt-reconciliation.mjs` | `9fc8007f2aad8630417ed0357d4e939777d756f8` | Requires injected evidence verifier and trusted clock; samples time before and after async verification; pins issuer/audience through trusted verifier configuration; validates claim binding and records append-only evidence without changing attempt/lease or authorizing retry |
| Lease tests | `proofs/d1-ledger/test/lease-fencing.test.ts` | `52ee72bf89a73b5d9088d1be301b2aa5ae442d4a` | Synthetic SQL fencing, lease acquisition/renewal, stale finalization rejection, quarantine, forged audit-event rejection, and adapter future/past/invalid/rollback clock cases |
| Admission tests | `proofs/d1-ledger/test/atomic-admission.test.ts` | `c78bd4b08dae0709ef057861cb71df119071a980` | Synthetic atomic admission, replay identity, cross-executor rejection, concurrent single-use approval, caller-time ignored, invalid/stale clock denial |
| D1 migration 0014 | `proofs/d1-ledger/migrations/0014_d1_lease_fencing_guards.sql` | `8504b2ae3150092493a2a7808d58a89a4ef9650e` | Database transition guards for lease/fencing lifecycle |
| D1 migration 0015 | `proofs/d1-ledger/migrations/0015_issuer_bound_reconciliation_decisions.sql` | `442db58f7c6ff0463e9a391572a1e45ebccc7df3` | Append-only issuer-bound reconciliation evidence |

The proof README, blob `899e84cab4998a794495c04989b957fdec156252`, explicitly states that this package is local-only, not mounted in the product Worker/Hono console/Supervisor/Worker workflows, and has no hosted D1, workflow dispatch, external execution or production authority.

### Trust-boundary matrix

| Required property | Existing evidence | Result |
|---|---|---|
| Exact issue #96 / repository identity | D1 approval schema and input fields; no real event adapter | NOT VERIFIED |
| Exact owner numeric identity and owner association from trusted GitHub metadata | Adapter accepts numeric owner ID as input; no workflow/event callsite | NOT VERIFIED |
| Top-level issue comment only; exact body `/next`; reject PR comments/other events | Issue #96 contract only; no controller workflow | BLOCKED |
| Trusted default-branch workflow ref and immutable target SHA | D1 approval binds a target SHA; no runtime resolver/callsite | NOT VERIFIED |
| Source comment ID as idempotency key and durable admission before child dispatch | D1 admission ID/replay proof exists, but source comment binding and dispatch sequence do not | NOT VERIFIED |
| Duplicate/replay/ambiguous child dispatch reconciliation | Local D1 replay/receipt proof only; no controller run correlation or child dispatch | NOT VERIFIED |
| Trusted clock provenance | Adapter requires injected `trustedClock`; tests inject deterministic fake clocks; no trusted runtime caller | NOT VERIFIED |
| Executor identity and capability binding | Lease adapter requires injected authenticator and validates returned principal | VERIFIED at adapter contract only |
| SQL lease fencing and stale-worker denial | Migrations 0014/0015 and synthetic tests | VERIFIED at local D1 proof boundary only |
| Dispatch/execution authorization | Adapter responses and receipt flags remain false; no dispatch code | VERIFIED fail-closed in this proof |
| Hosted D1 semantics, live GitHub event authenticity, executor operation | Not implemented or not run | NOT RUN / NOT VERIFIED |

**Finding F-55-02 — HIGH:** dependency injection of `trustedClock`, `authenticateExecutor` and `verifyEvidence` is a seam, not evidence of trusted implementations. Tests use synthetic functions. Until the trusted default-branch caller is implemented and independently reviewed, a caller could provide an untrusted dependency; no production authority is established.

**Finding F-55-03 — HIGH:** PR #168 is 2 commits behind current default. Its previous successful 74/74 merge-result CI is stale relative to the current base and must be rerun after a current-base integration update.

## 5. Reuse First decision

- **REUSE:** existing D1 admission/lease/reconciliation adapters and migrations 0001–0015. Do not create another admission ledger or lease implementation.
- **REUSE:** GitHub Actions native `issue_comment` event context, run metadata and workflow dispatch API for a future controller; these are first-party platform primitives and avoid an extra webhook broker.
- **ADAPT:** connect only trusted controller-provided immutable event metadata to the existing adapter interfaces after explicit schema/contract mapping and negative tests.
- **BUILD:** the missing Cloud Pool controller workflow and its event-envelope adapter are genuine project-specific gaps, but this pass does not implement them because the current canonical D1 candidate is stale against default and its trusted callsites are absent.
- **DEFER:** external OSS orchestration/controller dependencies. No demonstrated need to add a new runtime dependency for this event boundary; avoid broadening the stack.

## 6. CI, governance and actions

- PR #168 prior merge-result CI: D1 `45236726880` SUCCESS (74/74) and Pool Contract `45236726907` SUCCESS on synthetic merge result `7989e4538eb39d26f645f856225ba27308dc27ca`; evidence is stale relative to current default by two commits.
- PR #169 exact-head workflow list for `828eb1de92fd369cb8a1fe68f068b687c6838dde`: empty; combined status list: empty; reviews: 0; threads: 0. Exact-head CI and independent review are NOT VERIFIED.
- Ruleset `26550182` is active, targets default branch and requires PR, but required approving review count is 0. It is not sufficient evidence of independent review.
- No secret values or metadata were inspected. No agent/controller dispatch, provider call, hosted D1, deployment, merge or production mutation occurred.

## 7. Verification and metrics

- Source/tree/PR/Issue/ruleset read-back: VERIFIED for the immutable refs listed above.
- Code changes: none; audit/report-only.
- Runtime tests executed in this pass: NOT RUN (no code change; source audit scope).
- Previously recorded D1 suite: 74/74 on the prior synthetic PR merge result only; not rerun on the current default.
- PR #169 docs CI: NOT VERIFIED (no workflow runs/status contexts on exact head).
- Active engineering time: NOT MEASURED. No estimate inferred from message count or commit count.
- Test execution time: NOT APPLICABLE / NOT RUN.
- Defects/findings: 1 controller absence blocker; 2 high trust/integration findings.
- Critical path: current-base D1 integration and CI → trusted event controller/event envelope → durable admission/lease caller composition → hosted D1 and executor qualification → UI/route/state/quota/security gates → independent acceptance.

## 8. Pass disposition and next bounded task

**Pass 55: VERIFIED as a source audit. Controller remediation: BLOCKED pending current-base integration. Contour A: NOT ACCEPTED. Contour B: DEFERRED.**

Next: **Pass 56 — current-base canonical D1 integration reconciliation.** Rebase/reconstruct the existing PR #168 proof lineage against current default SHA `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9` without creating a parallel ledger. Resolve the two-commit base drift, inspect all 33 changed files and migrations, rerun D1 and Pool Contract CI on the resulting exact merge result, then freeze the resulting SHA. Do not add a live controller or enable dispatch in that pass. Once the canonical proof is current-base and stable, implement the missing `issue_comment` controller as a separate bounded pass, retaining all non-authorizing outputs.

Canonical references:
- [GitHub Context Window](../context/GITHUB-CONTEXT-WINDOW.md)
- [PR #168](https://github.com/VlDMlNSh/developer-cloud-pool/pull/168)
- [PR #169](https://github.com/VlDMlNSh/developer-cloud-pool/pull/169)
- [Issue #96](https://github.com/VlDMlNSh/developer-cloud-pool/issues/96)
- [Issue #140](https://github.com/VlDMlNSh/developer-cloud-pool/issues/140)
- [MediaHub canonical map](https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md)
