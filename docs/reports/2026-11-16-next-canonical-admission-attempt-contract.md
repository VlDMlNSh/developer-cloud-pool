# Cloud Pool /next report — 2026-11-16 — canonical admission-to-attempt integration contract

## Scope and immutable target
Repository: `VlDMlNSh/developer-cloud-pool`
Default branch: `Основной`
Observed default HEAD from repository commit search: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
Documentation branch: `docs/next-2026-11-16-current-state-refresh` (unmerged; documentation-only continuation branch).
This pass is a design-contract and continuity-documentation pass. No runtime code, schema, workflow, secrets, variables, cloud resources, or production state were changed.

## Live repository revalidation
- Open Issues #94 and #96 remain the controlling requirements for four bounded Gemini roles and exact owner-only Cloud Pool `/next` admission.
- PR #111 remains OPEN / DRAFT / UNMERGED, based on `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`, head `687196738782432797bf394f1342cb9df19f478f`.
- PR #112 remains OPEN / DRAFT / UNMERGED, based on the same default SHA, head `c9a4c0ab2001f01a09632795283071c521e1c99d`.
- PR #113 remains OPEN / DRAFT / UNMERGED and contains the previous documentation refresh.
- PR #111 exact-head evidence previously read back: D1 run `43881396386` SUCCESS, 37/37 local Workers-runtime tests; contract run `43881396272` SUCCESS. This is local D1 emulation, not hosted D1 qualification.
- PR #112 exact-head evidence previously read back: controller run `43882090833` SUCCESS, 21/21 read-only unit tests; contract run `43882090867` SUCCESS. The event-admission job was SKIPPED in the PR run, so a real trusted issue_comment event remains NOT VERIFIED.
- The Cloud Pool-native `.github/workflows/gemini-batch-dispatch-controller.yml` was not found on default branch in the previous direct read. A candidate branch probe also returned NOT_FOUND for that path. Treat production controller availability as NOT VERIFIED, not present.
- The current default branch file `package.json` was not resolved by the connector read in this pass; do not infer runtime dependencies from that failed fetch.
- The prior ruleset read-back recorded active ruleset `26550182` for `refs/heads/Основной`, PR required and 0 required approvals. Governance must be re-read before promotion; this pass did not re-fetch the ruleset.
- No secret values, secret names/scopes, Actions variables, provider identities, or quotas were inspected in this pass.

## Engineering conclusion
PR #112 supplies a read-only event predicate; PR #111 supplies a local D1 claim/outbox and immutable attempt/lease proof. They are not production-integrated and cannot be combined by simply wiring both adapters together.

A single canonical protocol is required:

`Trusted owner issue_comment -> durable event receipt/admission -> one-shot approval consume + logical task + outbox -> immutable attempt -> authenticated fenced worker lease -> evidence -> terminal projection OR explicit reconciliation`.

### Identity and idempotency
1. Accept only a newly-created top-level `issue_comment` event on Cloud Pool Issue #96 whose complete body is exactly `/next`.
2. Authenticate owner identity using trusted GitHub numeric repository, issue, and actor IDs plus owner association. Never trust caller-supplied identity fields.
3. Reject edited/deleted comments, pull-request comments, other issue numbers, non-owner authors, untrusted refs, and all non-approved event types.
4. Distinguish `controller_code_sha` (trusted workflow code) from `target_sha` (immutable source tree being worked on). Pin both at admission; never silently follow a moving branch during a wave.
5. Use the source comment ID as the unique idempotency key. Bind the durable admission to repository ID, issue number, actor ID, comment ID, controller run ID, controller code SHA, target SHA, profile, wave ID, and canonical envelope digest.
6. Persist the admission record before any external dispatch. Duplicate delivery must read back and return the original wave; it must never create a second wave.

### One transaction boundary
The durable database transaction must atomically:
- insert/verify the immutable event receipt and admission;
- consume the matching unexpired, unused approval exactly once;
- bind the canonical logical task to immutable repository/issue/target/profile identity;
- create one immutable task-level outbox intent;
- reject all conflicting replays and partial writes.

Do not rely on a sequence of independent API calls as if it were atomic. If the database response is ambiguous, read back by stable IDs before retrying. Do not dispatch on an unresolved ambiguous result.

### One attempt and lease state machine
Use the immutable attempt lifecycle as the canonical model; do not combine it with the legacy expiry-reclaim lease API. A task has stable logical identity; each authorized retry creates a new immutable attempt ID and monotonically increasing attempt number. Lease generation is a separate monotonic fencing counter.

Required states:
- Admission: `received -> validated -> admitted`; rejected events are terminal and non-dispatchable.
- Task: `pending -> leased/running -> succeeded | failed | cancelled`; uncertain execution becomes `indeterminate`.
- Reconciliation: `pending -> resolved_stopped | resolved_committed | retry_authorized`; only a separately authenticated authority may resolve it.
- Outbox: `pending -> dispatched | reconciled | dead`; external delivery is at-least-once with idempotent child identity and mandatory read-after-ambiguous-response reconciliation.

A lease expiry is not proof that an executor stopped. An expired or indeterminate attempt must not be silently reclaimed, restarted, or duplicated. It remains blocked until reconciliation establishes a safe terminal fact or explicitly authorizes a new attempt. Any new lease generation fences stale workers from renew/finalize operations.

### Worker and evidence boundary
- Worker identity must be authenticated by a workload identity mechanism bound to the expected audience, task, attempt, and target SHA. A caller-provided worker ID alone is not authentication.
- Claim, renew, heartbeat, and finalize operations must compare task key, attempt ID, worker identity, generation, expiry, and immutable target binding.
- Finalization must be idempotent for an exact matching result and deny conflicting result/provenance digests.
- Record append-only lifecycle events, controller/child run and job IDs, target SHA, task/attempt IDs, status, result digest, artifact digest, and timestamps. Never include secret values or credential-derived data.
- Do not claim exactly-once external side effects. The achievable contract is durable idempotency + fencing + reconciliation; external providers may have ambiguous outcomes.

## Acceptance gates before any Gemini dispatch
1. A single integrated controller on trusted default-branch code implements the above contract.
2. Durable D1 schema and transaction behavior are tested in the hosted target environment; local Workers-runtime tests remain necessary but insufficient.
3. Real trusted Issue #96 webhook admission is exercised with no provider secrets and no child dispatch.
4. Adversarial tests cover wrong actor/repo/issue/body/ref, duplicate and replay, stale SHA, edit/delete, lease contention, fencing regression, expiry, crash before/after dispatch, ambiguous API response, partial dispatch, missing/duplicate child, wrong target, missing artifact and digest mismatch.
5. Independent security review and formal PR review complete; governance and workflow permissions re-read on exact candidate head.
6. Credential slots and upstream account/quota ownership verified through approved metadata only. Never read credential values. Four slots do not prove four independent accounts.
7. Only after every gate passes may the owner-authorized four-child wave run through the Cloud Pool-native controller: researcher, implementation designer, tester, security auditor. Each receives a unique bounded payload and one designated credential slot. No paid fallback, key rotation, quota evasion, or cross-child credential access.

## Explicitly not performed
- Gemini/provider calls or child dispatch: NOT RUN.
- Secret or Actions-variable inspection: NOT RUN.
- Hosted D1 provisioning or persistence test: NOT RUN.
- Workflow mutation, merge, deployment, or production integration: NOT RUN.
- Live web UI, browser session, executor qualification, or Contour A acceptance: NOT VERIFIED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Tests and evidence
This is a documentation/design pass; no code tests were applicable or run. GitHub read-back evidence:
- [Issue #94](https://github.com/VlDMlNSh/developer-cloud-pool/issues/94)
- [Issue #96](https://github.com/VlDMlNSh/developer-cloud-pool/issues/96)
- [PR #111](https://github.com/VlDMlNSh/developer-cloud-pool/pull/111)
- [PR #112](https://github.com/VlDMlNSh/developer-cloud-pool/pull/112)
- [PR #113](https://github.com/VlDMlNSh/developer-cloud-pool/pull/113)
- [Default HEAD](https://github.com/VlDMlNSh/developer-cloud-pool/commit/35208f0ef28f0ac031a7acdf35fc90ccc9b16845)

## Next concrete step
On a clean implementation branch pinned to `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`, implement the smallest no-secret D1 integration slice: durable event receipt + atomic approval consume/task/outbox transaction, while keeping `dispatch: false`. Add adversarial Workers-runtime tests, run exact-head CI, then request independent review. Do not start worker dispatch or provider execution in that slice.
