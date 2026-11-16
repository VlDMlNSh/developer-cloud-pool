# Cloud Pool /next — 2026-11-16 — clean-base atomic D1 admission slice

## Scope and immutable target

- Repository: `VlDMlNSh/developer-cloud-pool`
- Default branch: `Основной`
- Immutable target SHA: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`
- Implementation branch: `feat/atomic-next-admission-d1-2026-11-16`
- PR: [#114](https://github.com/VlDMlNSh/developer-cloud-pool/pull/114), OPEN / DRAFT / UNMERGED.
- PR head: `24ada07a4ae832078faf7473b5b646f34a84e64a`.
- No default-branch mutation, merge, deployment, hosted D1 provisioning, secret/variable read or write, provider call, or live dispatch.

## Implemented

New isolated proof package: `proofs/d1-admission/`.

1. Owner event predicate validates newly-created `issue_comment`, exact body `/next`, Issue #96 open/non-PR, exact repository full name and numeric ID, owner login/numeric ID and OWNER association, default branch/ref, target SHA, controller code SHA, run ID, approval ID and fixed profile.
2. Source comment ID is the unique durable idempotency key. Admission, wave and logical task identities are deterministic.
3. A single D1 receipt INSERT activates a database trigger. The INSERT and trigger writes form one atomic statement transaction: consume the matching unexpired one-shot approval, create the logical task, attach approval and create the task-level outbox. Any trigger failure aborts the receipt insert and all side effects.
4. Exact source-comment replay returns the original immutable admission and outbox. A replay under a later controller run/code SHA or after default HEAD advances does not create a second wave, task or approval consumption.
5. Ambiguous writes are reconciled by reading the stable source-comment ID before any retry.
6. Admission receipts are append-only. Approval identity/binding and logical task identity are immutable.
7. Every result is explicitly `dispatch: false` and `executionAuthorized: false`.
8. Added nine adversarial/local Workers-runtime tests for atomic admission, exact replay, changed target replay, invalid owner/event/body/ref, expired/mismatched approval rollback, independent source-comment waves, concurrent duplicate delivery, immutable evidence/task binding, and dispatch-off behavior.
9. Added a least-privilege proof workflow with `contents: read`, pinned action SHAs, Node 24.9.0, exact dependency lockfile, no secrets and no provider calls.

The exact-pinned `@cloudflare/vitest-plugin@1.4.7` / `vitest@4.1.12` lockfile was reused from the existing D1 proof PR #111; no new dependency versions were introduced.

## Exact-head CI

Target head: `24ada07a4ae832078faf7473b5b646f34a84e64a`.

- D1 proof run [43933503897](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43933503897): COMPLETED / SUCCESS.
- Job `133531866050`: SUCCESS; syntax check passed; 1 test file, 9/9 tests passed under local Workers-runtime D1.
- Pool Contract Validation run [43933504073](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43933504073): COMPLETED / SUCCESS.
- Job `133531891725`: SUCCESS.
- Artifact [14260211684](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43933503897/artifacts/14260211684), `d1-admission-proof-package-lock`, 18,253 bytes. Downloaded from GitHub and independently SHA-256 verified: `a000c440b969214f9ec7812bd40b1b2ec3c53ece64157aa35e67ea5fc4320dd9`.
- Earlier failed runs on superseded heads were used to identify and correct replay/result classification and test isolation; they are not used as qualification evidence.

## Contract boundaries / remaining gaps

- This is local Workers-runtime D1 emulation, not hosted D1 persistence or crash recovery under a hosted database.
- The predicate is exercised through injected tests; there is no trusted default-branch production `issue_comment` workflow wired to this D1 binding.
- Worker identity is not implemented here. A caller-provided worker ID is not acceptable; next execution slice must authenticate workload identity bound to audience, repository, task, attempt and target SHA.
- Immutable attempt claim/renew/finalize and separately authorized indeterminate reconciliation are not integrated in this package.
- Task outbox is durably created but not delivered; external delivery and ambiguous-response reconciliation remain unimplemented.
- No Supervisor/Worker production integration, Jarvis web UI, model routing, quota isolation, hosted state recovery, or live Gemini/provider execution was performed.
- PR #111/#112 remain separate Draft proofs with the audit findings recorded in comments #6925663082/#6925663801. They must not be directly wired together.
- No formal independent PR review exists; the repository ruleset has zero required approvals. PR #114 remains Draft and must not be merged based on CI alone.

## Decision

- Atomic local admission + approval consume + logical task + task outbox: **VERIFIED on exact PR head by 9/9 local Workers-runtime tests**.
- Exact-head Pool Contract Validation: **VERIFIED**.
- Hosted D1, trusted production webhook, authenticated worker identity, immutable-attempt execution, outbox delivery/recovery and independent review: **NOT VERIFIED / NOT RUN**.
- Gemini dispatch: **NOT RUN**.
- Contour A: **BLOCKED / NOT ACCEPTED**.
- Contour B: **DEFERRED**.

## Next single step

Implement and test the authenticated worker-identity boundary for the immutable-attempt lifecycle, bound to audience + repository + logical task + attempt + target SHA, with claim/renew/finalize fencing and no automatic reclaim. Keep provider dispatch disabled and use no hosted resources.

## Evidence

- [Issue #94](https://github.com/VlDMlNSh/developer-cloud-pool/issues/94)
- [Issue #96](https://github.com/VlDMlNSh/developer-cloud-pool/issues/96)
- [PR #111 — local D1 attempt proof](https://github.com/VlDMlNSh/developer-cloud-pool/pull/111)
- [PR #112 — read-only event predicate](https://github.com/VlDMlNSh/developer-cloud-pool/pull/112)
- [PR #114 — atomic D1 admission slice](https://github.com/VlDMlNSh/developer-cloud-pool/pull/114)
- [Default target commit](https://github.com/VlDMlNSh/developer-cloud-pool/commit/35208f0ef28f0ac031a7acdf35fc90ccc9b16845)


## Follow-up hardening and final exact-head read-back — 2026-11-16

A focused review found that the first approval-ledger version did not enforce monotonic state transitions. Corrected before any merge:
- Added a D1 trigger allowing only `ready -> consumed` or `ready -> revoked`, while rejecting consumed/revoked rollback.
- Made the approval ledger append-only (deletion rejected).
- Added a Workers-runtime test proving a consumed approval cannot be reset to ready or deleted.
- Added an explicit `trustedDefaultHeadSha` equality check so a new admission cannot bind a target different from the separately supplied default-head value. The value is still an input to this local proof, not independently authenticated here.
- Added a test rejecting an unbound/stale target SHA.
- Final suite: 11/11 local Workers-runtime D1 tests PASS.

Final PR #114 exact head: `051f972a44bdfb610b17554dd51340c34700e6f6`.
- D1 proof run `43934541248`, job `133535567332`: SUCCESS, 11/11 tests.
- Pool Contract Validation run `43934541311`, job `133535568990`: SUCCESS.
- Artifact `14259383327`, 18,253 bytes, independently downloaded and SHA-256 verified: `c1b4f8c4578a720b5d1a384b5d8ee891eead1665360ce62e21fe6ead4fdeb54d`.
- PR #114 remains OPEN/DRAFT/UNMERGED with zero formal reviews. No default branch mutation.

The trusted event adapter is still absent: event, controller run/code SHA and trusted default head are supplied to the pure adapter in tests. No live webhook signature, trusted-main controller execution, hosted D1 or worker identity is proven. Dispatch remains disabled.
