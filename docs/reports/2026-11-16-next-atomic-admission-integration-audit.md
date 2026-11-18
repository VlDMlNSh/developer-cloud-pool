# Cloud Pool /next — 2026-11-16 — atomic admission integration audit

## Scope and immutable targets

- Repository: `VlDMlNSh/developer-cloud-pool`
- Default branch: `Основной`
- Immutable default target re-read from GitHub commit search: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`
- Working documentation branch: `docs/next-2026-11-16-current-state-refresh` (PR #113; OPEN / DRAFT / UNMERGED; not production code)
- Scope: read-only audit of PR #111 D1 ledger/attempt proof and PR #112 owner-event predicate, followed by evidence comments on both PR threads.
- No code/schema/workflow changes, hosted D1 provisioning, secret/variable mutation, provider calls, dispatch, merge or deployment.

## Fresh repository recovery

- Repository ID: `1445644538`; owner numeric ID: `157891068`; default branch: `Основной`.
- Issues #94 and #96 remain OPEN. Issue #96 remains a dedicated exact owner-only top-level `/next` control issue; its four-role amendment does not authorize dispatch.
- Default tree at target SHA contains only five workflows: DSH runtime evaluation, Pool Contract Validation, Pool Supervisor, Pool Worker and runner resource probe. `.github/workflows/gemini-batch-dispatch-controller.yml` is ABSENT from the default tree.
- Active ruleset #26550182 applies to `refs/heads/Основной`: PR required, deletion/non-fast-forward blocked, required review-thread resolution, zero required approvals, no bypass actors, no required status checks.
- PR #111: OPEN / DRAFT / UNMERGED; base SHA `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`; head `687196738782432797bf394f1342cb9df19f478f`.
- PR #112: OPEN / DRAFT / UNMERGED; same base SHA; head `c9a4c0ab2001f01a09632795283071c521e1c99d`.
- PR #113: OPEN / DRAFT / UNMERGED; documentation branch only.

## Exact-head CI and artifacts re-read

### PR #111 — D1 proof

- Run `43881396386`: COMPLETED / SUCCESS, exact head `687196738782432797bf394f1342cb9df19f478f`.
- Job `133347908331`: SUCCESS.
- Log re-read: `npm ci --ignore-scripts --no-audit --no-fund`, syntax check, 13 consume tests + 24 claim/outbox tests = 37/37 passed.
- Pool Contract Validation run `43881396272`: SUCCESS (historical PR evidence; not hosted D1 qualification).
- Artifact `14232471651`, lockfile ZIP, 18,253 bytes. Downloaded and independently SHA-256 checked in this pass: `08329cbcb0bb479760af4a9dbb7682472180e4bd4431ca2ffaa0cc18612c99d3`.
- Artifact proves the uploaded lockfile bytes only; it does not establish runtime integration or hosted persistence.

### PR #112 — read-only event predicate

- Run `43882090833`: COMPLETED / SUCCESS, exact head `c9a4c0ab2001f01a09632795283071c521e1c99d`.
- Job `133350342861`: SUCCESS; log confirms 21/21 predicate tests passed.
- Event-admission job `133350345738`: SKIPPED in the PR run. Real webhook admission is therefore NOT VERIFIED.
- Pool Contract Validation run `43882090867`: SUCCESS.
- No artifacts were returned for run `43882090833`.

Formal review submissions for both PRs: zero. GitHub rejected `REQUEST_CHANGES` because the connected account owns these PRs; evidence comments were posted instead.

## Independent contract findings

1. **The D1 proof has two lease APIs.** `src/task-lease.mjs` is the legacy expiry-reclaim path; `src/task-attempts.mjs` implements the newer immutable-attempt path and blocks blind reclaim of running/indeterminate attempts. The README distinguishes them, but both APIs and tests are in the same candidate. The integrated canonical path must exclusively select immutable attempts and quarantine/remove legacy reclaim semantics.
2. **Worker identity is not authenticated.** Claim/renew/finalize APIs accept caller-provided `workerId` strings. A string plus generation fencing is not workload identity bound to audience, task, attempt and target.
3. **The D1 proof starts from an existing approval row.** It does not create a durable Issue #96 admission receipt keyed uniquely by source comment ID.
4. **The two PRs do not form the required atomic transaction.** PR #112 computes a stable event digest but is read-only and does not persist it. PR #111 consumes an existing approval and uses database triggers for task/outbox creation, but it has no trusted source-event admission row. The complete one-transaction boundary — admission + one-shot approval consume + immutable logical task + task-level outbox — is absent.
5. **Event job evidence is incomplete.** PR #112 unit/contract CI passed, but the actual event-admission job was skipped.
6. **Hosted/runtime qualification is absent.** PR #111 proves local Workers-runtime SQLite/D1 behavior, not hosted D1 persistence, production Supervisor/Worker integration or authenticated worker execution.

## Evidence comments

- PR #111 audit comment: [6925663082](https://github.com/VlDMlNSh/developer-cloud-pool/pull/111#issuecomment-6925663082)
- PR #112 audit comment: [6925663801](https://github.com/VlDMlNSh/developer-cloud-pool/pull/112#issuecomment-6925663801)

## Decision

Do not merge PR #111 or #112 as-is and do not enable dispatch. Do not combine their adapters by direct wiring. The clean-base implementation must introduce a single durable event/admission state machine and one D1 transaction for event receipt, approval consume, logical task and outbox. It must use immutable attempts only, reject automatic reclaim, and authenticate worker identity before claim/renew/finalize.

Dispatch remains `false` throughout the next implementation slice. No provider call or secret inspection is needed for that work.

## Status

- GitHub recovery: VERIFIED for repository metadata, default HEAD, Issues #94/#96, PR #111/#112/#113, ruleset and default workflow tree.
- PR #111 local D1 tests: VERIFIED, 37/37 on exact head; hosted D1: NOT VERIFIED.
- PR #112 predicate tests: VERIFIED, 21/21 on exact head; actual webhook job: NOT VERIFIED / SKIPPED.
- Atomic admission integration: BLOCKED / NOT IMPLEMENTED.
- Authenticated workload identity: NOT VERIFIED.
- Cloud Pool-native Gemini controller: NOT VERIFIED on default branch.
- Gemini/provider dispatch: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next single engineering step

Create a new clean-base branch from `35208f0ef28f0ac031a7acdf35fc90ccc9b16845` and implement the minimal no-secret D1 admission slice: trusted owner event receipt keyed by source comment ID; atomic admission + one-shot approval consume + immutable task + outbox; immutable attempt-only state machine; `dispatch: false`; adversarial Workers-runtime tests and exact-head CI. Do not add provider calls or hosted resources.

## References

- [Issue #94](https://github.com/VlDMlNSh/developer-cloud-pool/issues/94)
- [Issue #96](https://github.com/VlDMlNSh/developer-cloud-pool/issues/96)
- [PR #111](https://github.com/VlDMlNSh/developer-cloud-pool/pull/111)
- [PR #112](https://github.com/VlDMlNSh/developer-cloud-pool/pull/112)
- [PR #113](https://github.com/VlDMlNSh/developer-cloud-pool/pull/113)
- [Default target commit](https://github.com/VlDMlNSh/developer-cloud-pool/commit/35208f0ef28f0ac031a7acdf35fc90ccc9b16845)
