# Durable single-use Supervisor claim — design decision record

**Date:** 2026-11-06  
**Status:** DESIGN REQUIRED / NOT QUALIFIED / DISPATCH BLOCKED  
**Tracking:** [Issue #38](https://github.com/VlDMlNSh/developer-cloud-pool/issues/38)  
**Related implementation:** [PR #37](https://github.com/VlDMlNSh/developer-cloud-pool/pull/37)

## Immutable baseline

- Default branch `Основной`: `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- PR #37 head: `5587a4e013507b5be330fd0c49ce1fc836faa946`, OPEN / DRAFT / UNMERGED.
- Exact-head static CI: runs `42284044591` (Reusable Pool Worker Boundary Validation) and `42284051311` (Pool Contract Validation), both SUCCESS.
- PR #37 reviews and inline threads: 0 / 0.
- Active Ruleset `26550182` requires zero approving reviews and does not require CODEOWNERS review.

## Live source reconciliation

Default branch still contains the old privileged Supervisor/Worker chain because PR #37 is not merged:
- `.github/workflows/pool-supervisor.yml`: `issues: write`, `workflow_run`, manual dispatch.
- `.github/workflows/pool-worker.yml`: `issues: write`, `workflow_dispatch`, issue mutation.
- PR #37 is the unmerged correction and must not be described as production behavior.
- The other default workflow files inspected (`dsh-runtime-evaluation.yml`, `runner-resource-probe.yml`) expose manual dispatch but do not declare `issues: write` or issue mutation.

## Threat model

Protect against:
- two Supervisor runs attempting to consume the same approved task;
- a workflow interruption between claim and Worker start/finalization;
- an interrupted Worker followed by accidental duplicate execution;
- a different workflow or authorized human mutating managed Issue labels during claim;
- stale or forged task envelopes;
- privilege expansion introduced to implement a claim store.

Out of scope for this design pass: hostile GitHub platform compromise and compromise of repository-owner credentials.

## GitHub-native concurrency semantics

The current PR #37 workflow-level concurrency group is useful:
- GitHub documents at most one running workflow/job in a concurrency group.
- `queue: max` allows up to 100 pending runs.
- Queue order is not guaranteed FIFO; over-capacity runs are cancelled/rejected.
- This serializes Supervisor workflow runs that share the group, but does not lock out a human or another workflow that edits the same Issue outside that group.

Sources:
- https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
- https://docs.github.com/en/actions/reference/limits

## Candidate designs

### A. Serialized Supervisor + GitHub Issues labels

**Advantages:** no additional service, no additional credential class, already implemented in PR #37.

**Guarantees:** prevents concurrent executions of this Supervisor workflow in the same concurrency group; read-back detects some unexpected label/envelope changes.

**Does not guarantee:** database-grade CAS, exactly-once claim across all writers, FIFO task order, or automatic recovery after an ambiguous claim.

**Disposition:** acceptable only as a deliberately limited single-writer prototype with all other managed-label writers prohibited and residual race explicitly accepted. Not sufficient for enabling model/provider execution or untrusted code execution.

### B. Dedicated state repository + immutable reservation refs

GitHub Create a reference documents 201 Created, 409 Conflict and 422 validation failure. It requires repository Contents: write:
https://docs.github.com/en/rest/git/refs#create-a-reference

A fixed unique reservation name per task could be tested as a one-winner primitive. However:
- API documentation does not itself state a formal transactional/CAS guarantee;
- Contents: write is broader than current Issues-only authority;
- same-repository Contents: write could permit creation of arbitrary refs, so branch protection alone may not sufficiently constrain the token;
- a separate state repository and narrowly scoped installation authority would need to be provisioned and qualified;
- recovery semantics must prevent deletion/recreation from silently authorizing a second execution.

**Disposition:** research candidate only. Do not add Contents: write to current Supervisor. Do not create production refs or grant permissions until the dedicated-repository authority and contention behavior are reviewed.

### C. Conditional-write database/store

A store with a documented conditional update / transaction primitive could implement a claim record such as:
`task_id, target_sha, profile, state, claim_id, supervisor_run_id, worker_run_id, created_at, terminal_at`.

A transition must be conditional on `state=READY`; exactly one competing request may transition it to `CLAIMED`. The store must support idempotent retries and immutable audit receipts.

**Disposition:** no service selected. Cloudflare entitlement, free-tier quotas, credential ownership, and isolation are not verified. Do not assume a free plan or provision a paid fallback.

## Decision

No backend currently meets all proof and least-privilege criteria. Keep dispatch fail-closed.

Immediate safe baseline:
1. Keep PR #37 DRAFT and unmerged pending independent review.
2. Preserve the current workflow concurrency group and one-task-per-run behavior as defense-in-depth only.
3. Treat GitHub Issues labels as workflow state, not as an atomic lock.
4. Do not grant `contents: write` or add external credentials to Supervisor.
5. Require a real concurrent contention test against any selected backend, plus interruption/retry tests and independent security review.

## Acceptance criteria

- A selected backend has documented conditional single-use semantics and an isolated least-privilege identity.
- At least two concurrent claim attempts against the real backend demonstrate exactly one winner; results and request IDs are retained.
- Tests cover process interruption after claim, before Worker start, during Worker execution, and before finalization.
- Retries are idempotent; ambiguous claims fail closed and cannot be silently reissued.
- Independent security review and exact-head CI pass.
- Governance requires independent review.
- Both dispatch gates remain false/unset until all criteria are met.

## Current status

- Design: IN PROGRESS.
- GitHub Issues label CAS: NOT AVAILABLE.
- GitHub Actions serialization: VERIFIED as single-running-per-group; not a global lock.
- Git ref reservation: CANDIDATE / NOT QUALIFIED.
- Conditional database/store: NOT SELECTED / NOT VERIFIED.
- Runtime execution: NOT RUN.
- Contour A: BLOCKED / NOT QUALIFIED / NOT ACCEPTED.
- Contour B: DEFERRED.


## Implementation delta after design baseline

- PR #37 at `5587a4e013507b5be330fd0c49ce1fc836faa946` now independently rejects a task unless exactly one managed lifecycle label is present and it is `pool:claimed`.
- A focused security test and validator assertion cover conflicting/duplicate managed labels.
- Exact-head CI runs `42284044591` and `42284051311` succeeded.
- This is an additional state-consistency guard, not a claim-store/CAS implementation. It does not change the disposition of designs A/B/C or permit dispatch.
- Independent review remains NOT RUN; PR remains DRAFT / OPEN / UNMERGED.


## Candidate C evidence update — local D1 conditional-consume proof — 2026-11-06

- Isolated proof branch: `proof/d1-single-use-ledger-retry-2026-11-06`, 37 commits ahead / 0 behind immutable default baseline `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- Source uses one conditional SQL UPDATE and accepts only a successful result with exactly one changed row. It binds approval ID, owner numeric ID, repository ID, issue, target SHA, profile, envelope digest, ready/unconsumed state and expiry.
- 12-way concurrent local Workers-runtime test demonstrates one winner and 11 denials; replay, mismatches, expiry, malformed input, storage unavailable/ambiguous and batch rollback are covered.
- Exact code/workflow commit `4229d8701f8ee79692619f481cef1d9d9483ff16`: D1 run `42276825199` / job `128095160084` SUCCESS; Pool Contract run `42276825193` / job `128095160288` SUCCESS. The workflow runs `npm ci` against committed lockfile; workflow blob `09b143c21d560d7eef93930da8f8f93bda378799`; lockfile blob `876c5d3de53bb12efaecdec939cbe8710cbd9e3c`.
- This is local Miniflare/workerd proof, not a provisioned Cloudflare D1 resource or production integration. No account entitlement, live quotas, real backend contention, backup/restore or deployed runtime has been qualified.
- Source review found blocking provenance gaps: owner ID is caller-supplied; approval issuer/signature is not authenticated; caller supplies `now`; issuance/revocation/audit and quota/recovery are absent. The Worker entrypoint is inert and successful consume always returns `dispatch: false`.
- Disposition: candidate C is the strongest technical candidate and advances to bounded qualification only. It is NOT selected for production and does not authorize provisioning, deployment, integration or dispatch. Do not broaden current Supervisor permissions. If free/card-free entitlement and least-privilege isolation cannot be proven, retain fail-closed behavior.
- Full review: [durable single-use claim design review](../reports/2026-11-06-durable-single-use-claim-design-review.md).
