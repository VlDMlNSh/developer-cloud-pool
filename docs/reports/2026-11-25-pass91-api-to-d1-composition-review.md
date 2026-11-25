# Pass 91 — API provenance to D1 admission composition review

Date: 2026-11-25

## Scope

A bounded source-level composition review of PR #174's API-backed owner event audit and PR #170's D1 admission/source-comment receipt adapter, against Issue #140's current-base integration requirements. No runtime code, migration, workflow, dispatch, hosted D1, or governance changes in this pass.

## Frozen evidence

- PR #174: OPEN / DRAFT / UNMERGED; head `a8809c1dc8c2eaa49944fb031baeec54ce46b922`; base `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- PR #170: OPEN / DRAFT / UNMERGED; head `40281787c208af2df916f10af1dba073061ff0d3`; base `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`; compare to PR #174 base remains 41 ahead / 2 behind, old merge base `8c38bb...`.
- PR #169 docs branch head at recheck: `fb6eb335621e72a46ebda3f47e0bb0d372c27219`, OPEN / DRAFT / UNMERGED, old base `8c38bb...`.
- PR #171: OPEN / DRAFT / UNMERGED, head `423da55ca1e2d91c28572f88f60b494b59d56e9e`, old base `8c38bb...`.
- Branch search confirms default branch name `Основной`. PR #174's recorded base remains `565404f84b6b86afb4dc2d8fa939341f42df6eca`; no independent repository-head metadata endpoint was available in this pass, so the branch head is treated as observed through the current PR base, not independently re-read.
- Issue #140 requires a single current-default integration branch, API/Actions provenance binding, canonical D1 admission/receipt, lease/fencing, negative-first tests, and dispatch disabled.
- Issue #96 remains PLANNED and explicitly requires a trusted default-branch controller, immutable target SHA, source-comment idempotency, durable admission before dispatch and ambiguous API reconciliation.
- Issue #94 owner scope correction makes Claude Code + ECC + FCC the first executor profile; Gemini is optional, not a first-launch blocker.
- Issue #1's latest governance facts remain historical. Current ruleset and current `POOL_DISPATCH_ENABLED` were NOT VERIFIED.

## Source artifacts inspected

PR #170 at head `402817...`:
- `src/github-next-event.mjs`, blob `31a254e28f42eee3a3add07ca5fae2c5a46cc8b57`.
- `src/github-actions-context.mjs`, blob `574d289964b5d908395573b91c6f890305c94eeb`.
- `src/admit-qualified-task.mjs`, blob `f4c788c1d5231cdce3a84d006b07407971ef6491`.
- `migrations/0017_github_next_source_comment_receipts.sql`, blob `2d226a23e94cdf7a767eed989b8ef0b8781c69fb`.
- `test/github-next-event.integration.test.ts`, blob `e9c26f565c587bf9f8ab40bb6e7a33c9fd50fcd3`.
- `.github/workflows/d1-ledger-proof-validation.yml`, blob `c1cff6e9f9ee3ca8f5766e07c7d17f84b21dc05e`.

PR #174 at head `a8809c...`:
- `scripts/owner-next-event-audit.mjs` and `.github/workflows/owner-next-event-audit.yml` re-read at exact head.

## Confirmed strengths

1. PR #174 performs read-only GitHub API lookups for repository, Issue #96, source comment, workflow run, workflow metadata and default-branch ref. It rejects non-owner, wrong issue, PR comments, non-exact command, wrong workflow/run/ref/SHA and rerun attempt > 1. It never writes D1 or dispatches.
2. PR #170 binds a narrow GitHub Actions context to a fixed repository/owner/issue/default ref/profile and hashes the event envelope. It composes canonical `admitQualifiedTask` with a unique append-only source-comment receipt.
3. Migration 0017 guards receipt insertion against the canonical admission/approval/task/attempt/route/task-ready outbox/commit-receipt chain.
4. D1 receipt recovery uses primary-first readback. An insert with a lost acknowledgement can return the already-recorded receipt only after exact readback. Partial/unavailable readback fails closed.
5. The D1 integration tests exercise exact replay, conflicting admission, changed run provenance, pre-commit failure, commit-then-lost-ack, partial/unavailable primary readback, incomplete outbox and forged receipt bindings.
6. All reviewed D1 outcomes preserve `dispatch:false` and `executionAuthorized:false`.
7. Reuse First remains appropriate: keep pinned Cloudflare Workers Vitest/Miniflare D1 harness, Node built-in fetch, and existing GitHub Actions API. No new dependency required.

## Finding F91-01 — API-verified source event is not the event consumed by D1

The API audit's `verifyOwnerNextEvent()` returns only `OBSERVED_ONLY` plus source/run/target identifiers. The workflow writes a step summary and exits; it does not call D1.

The D1 adapter independently accepts a context object through `bindGitHubNextEvent(context)`. `mapGitHubActionsContext` is explicitly a pure mapper and does not authenticate the runner or independently read GitHub API metadata. Therefore there is no shared immutable verified envelope whose provenance is established by PR #174 and then consumed by PR #170.

Required correction: extract a narrow API verification function returning a typed immutable event envelope (not arbitrary JSON), and make the D1 controller accept only that result within the same trusted default-branch workflow process. The envelope must include repository numeric ID, owner ID, issue number, comment ID, exact body digest, actor/association, event/action, default branch/ref/SHA, workflow ID/path, run ID/attempt and immutable target SHA. D1 must persist the exact tuple and event digest it was given. Negative tests must prove API rejection occurs before any D1 write.

## Finding F91-02 — admission and source receipt are intentionally two-phase

`admitGitHubNextEvent()` first calls `admitQualifiedTask()`, then `recordGitHubNextReceipt()`. The receipt is therefore not in the same D1 batch as the canonical admission.

The current local proof demonstrates recovery if receipt insertion fails: the same immutable admission identity is replayed, and the unique approval/task/attempt/admission chain prevents minting a second attempt. It also demonstrates fail-closed behavior for ambiguous receipt acknowledgement and primary-readback outage.

This is a recoverable two-phase design, not a single atomic admission+source-receipt transaction. The integration controller must explicitly preserve the original admission ID and input envelope across retries, and reconcile the existing admission before attempting receipt completion. It must never generate a new admission/task/attempt identity because the receipt phase failed. A future transaction-level redesign is optional only if it can preserve the existing SQL authority model and is backed by fault-injection tests; do not rewrite proven D1 logic merely for aesthetic atomicity.

## Finding F91-03 — candidates are not integrated on one current base

PR #170's D1 package is absent from current default and remains 41 commits ahead / 2 behind the PR #174 base. PR #174's API audit is on the current-base head but is separate. PR #169 documentation branch also remains divergent. No PR is merged. Green exact-head CI from either candidate does not prove a synthetic current-base merge of the combined controller.

## Pass 91 decision

Do not merge or stack PR #170 onto PR #174. The next implementation must be one clean branch from the independently revalidated current default SHA. Port the D1 package as one canonical ledger and the API verifier as one event authority; avoid duplicate ledgers/controllers. Compose them in one trusted workflow. Keep dispatch/execution false.

## Next bounded implementation slice

First slice: create the clean current-base integration branch and port the canonical D1 proof package with its pinned Workers test harness; no API/D1 dispatch workflow yet. Second slice: add the API-attested event-envelope adapter and tests to that same branch. The workflow should be wired only after the module-level composition tests pass. This ordering isolates schema/ledger portability from event-authority composition.

Required acceptance for this integration PR:
- Clean base and exact parent SHA recorded.
- One migration lineage 0001–0017; no legacy claim/outbox writes or second ledger.
- API-verified immutable envelope is the only event input accepted by the composed D1 adapter.
- Concurrent duplicates, exact replay, changed run attempt, pre/post-commit failure, ambiguous response and primary readback outage all fail closed or reconcile the same identities.
- Exact-head D1 and Pool Contract CI pass.
- No hosted D1, secrets, provider calls, live dispatch, deployment, merge or production write.

## Not run / not verified

- No code or schema changes in Pass 91.
- No live issue_comment execution or hosted D1 writes.
- No independent security review.
- Current ruleset and current dispatch variable NOT VERIFIED.
- Gemini NOT RUN; Claude Code/ECC/FCC NOT RUN.
- No merge, dispatch, provider call, deployment, secret-value read, production write or governance mutation.
- Active engineering time NOT MEASURED.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

Canonical MediaHub map (deferred): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
