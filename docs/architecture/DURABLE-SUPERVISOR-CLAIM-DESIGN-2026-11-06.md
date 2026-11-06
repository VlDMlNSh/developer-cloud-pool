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


## Cloudflare Free-tier account qualification — 2026-11-06

- Read-only Cloudflare account API access: VERIFIED; exactly one account accessible (identifier withheld).
- `GET /accounts/{account_id}/entitlements`: SUCCESS, empty result.
- `GET /accounts/{account_id}/d1/database`: SUCCESS, zero databases.
- `GET /accounts/{account_id}/workers/scripts`: SUCCESS, zero scripts.
- `GET /accounts/{account_id}/workers/account-settings`: SUCCESS, `default_usage_model=standard`, `green_compute=false`. This setting does not establish paid/free subscription.
- `GET /accounts/{account_id}/subscriptions`: BLOCKED / NOT VERIFIED, HTTP 403 because connected OAuth lacks Billing Read/Billing Write. Billing profile/payment details were not queried.
- Current public Cloudflare docs confirm D1 available on Workers Free and publish 5M rows read/day, 100K rows written/day, 5GB total storage and 10 databases; Workers Free default access, 100K requests/day and 10ms CPU/request; Workflows 3K steps/day and 1GB-month storage; Queues 10K operations/day and 24h retention. D1 Free row read/write overages are enforced as errors until 00:00 UTC since 2026-09-01.
- Sources: https://developers.cloudflare.com/workers/platform/pricing/ ; https://developers.cloudflare.com/d1/platform/pricing/ ; https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/ ; https://developers.cloudflare.com/workers/platform/limits/ ; https://developers.cloudflare.com/workflows/reference/pricing/ ; https://developers.cloudflare.com/queues/platform/pricing/ .
- Public Free product eligibility and quotas: VERIFIED. Account-specific subscription and card-free eligibility: NOT VERIFIED. No live D1 or Worker resource exists. No provisioning/deployment performed.
- Disposition unchanged: candidate C remains local-only / not production-selected. No paid fallback. Do not provision until account plan and card-free enrollment are established through an authorized non-secret route.
- Full evidence: [Cloudflare Free-tier account qualification](../reports/2026-11-06-cloudflare-free-tier-account-qualification.md).


## Decision refresh — 2026-11-07

### Fresh repository evidence
- Default branch remains `Основной`; latest observed base SHA is `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- PR #36 head `9ef7e4aadd6c723fa86b21ea44383f8020643a0c`, OPEN / DRAFT / UNMERGED. Exact-head D1 run `42293956647` / job `128154248534`: COMPLETED / SUCCESS. Exact-head Pool Contract run `42293956578` / job `128154248111`: COMPLETED / SUCCESS. Submitted reviews 0; inline threads 0.
- PR #37 head `5587a4e013507b5be330fd0c49ce1fc836faa946`, OPEN / DRAFT / UNMERGED. Exact-head boundary run `42284051309` and contract run `42284051311`: COMPLETED / SUCCESS. Submitted reviews 0; inline threads 0.
- Issue #38 remains OPEN. Its required design comparison and acceptance criteria remain controlling.

### Updated candidate assessment
- A (serialized Supervisor + Issue labels): workflow concurrency is defense-in-depth only. Issue label mutation is not a compare-and-swap lock across all writers; no global exactly-once claim.
- B (dedicated state repository + immutable refs): no qualified atomicity/deletion-recreation proof; would require a separate repository and narrowly scoped Contents authority. Do not grant Contents:write to the current Supervisor.
- C (conditional-write store / D1): local Workers-runtime proof demonstrates only a one-row conditional consume under local contention. The proof accepts caller-supplied identity/time inputs, has no signed issuer verification or trusted server clock, and has no outbox, lease/fencing, durable audit or recovery. No live D1/account entitlement is qualified.

**Decision unchanged:** no backend currently satisfies production acceptance criteria. Candidate C remains the strongest research direction but is NOT selected for production, NOT authorized for provisioning/integration, and does not permit dispatch. Keep both dispatch gates fail-closed. The previous design record and D1 boundary audit are consistent; no new code is justified until the local claim+outbox proof is implemented and independently reviewed, and account-level entitlement/least-privilege can be verified.

### Governance and phase
- Ruleset `26550182` last live audited as active for `refs/heads/Основной`, but required approvals=0 and CODEOWNERS review=false. The current pass did not re-fetch Ruleset details; treat that as the latest recorded audit, not a fresh live Ruleset verification.
- Cloudflare account plan/card-free eligibility remains NOT VERIFIED (prior read-only subscription endpoint 403 for missing Billing scopes); no resources deployed.
- Gemini dispatch NOT RUN; approved controller is not present in this repository's default workflow directory. No secrets read, no dispatch, no DSH/Resource Probe, no provider/model calls, no paid fallback, no Contour B.
- Documentation remains on `docs/github-context-window-2026-11-06`, separate from canonical default branch. This working branch is 82 commits ahead / 0 behind at latest compare; no merge.
- Contour A remains BLOCKED / NOT QUALIFIED / NOT ACCEPTED. Contour B remains DEFERRED.
