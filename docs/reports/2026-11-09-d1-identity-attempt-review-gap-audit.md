# 2026-11-09 — A-only D1 identity, attempt and review-gap audit

Date: 2026-11-09 (Europe/Vilnius)
Scope: read-only audit of PR #36/#39/#40/#49/#51 and the current #51 code tree. No source changes, merge, dispatch, remote resource, secret or provider action.

## Executive result

The earlier duplicate-task finding is addressed at the logical-task layer in PR #40 and retained in the #51 tree: canonical task identity is independent of approval ID; multiple approvals attach to one task; the task-level outbox is unique by task_key. The reviewed test demonstrates two distinct approvals concurrently attaching to one task and one outbox.

This does NOT satisfy Issue #38's stated 50-contender real-backend acceptance criterion. The inspected test is a two-approval contention case in local Workers-runtime/Miniflare. No hosted D1 contention test was run.

The attempt/reconciliation extension adds useful immutable history, generation fencing, append-only events, indeterminate state and durable reconciliation rows. However, the resumable takeover decision remains a caller-supplied boolean, not a verified capability; the code is local-only and no trusted issuer, owner, clock or resolver is integrated. Do not treat this API as production authorization.

## Immutable refs

- PR #36: head `e11fc90e50bd20b166207af64551c49cfa80ffb4`, base default `197ba98d0dc7d8437d759dd25bee8750d02e59ae`; OPEN/DRAFT/UNMERGED.
- PR #39: head `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`, base `9ef7e4aadd6c723fa86b21ea44383f8020643a0c`; OPEN/DRAFT/UNMERGED.
- PR #40: head `2b7e30aeb8c404d84b2fe8bc36320aaa783520fb`, base #39 head `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`; OPEN/DRAFT/UNMERGED.
- PR #49: head `b9067dc7d06245893cd4e208f6215438efe5ca64`, base #40 head `2b7e30aeb8c404d84b2fe8bc36320aaa783520fb`; OPEN/DRAFT/UNMERGED.
- PR #51: head `f50e8fc09a6442b4ca3088194c9d7284c7ffce55`, base `4ab0fdc4d649736a171faf95b9ab3a24b17217e8`; OPEN/DRAFT/UNMERGED.
- Current #51 source blobs: claim-outbox `37d75e2b31d9214b04398527eb08dce296f1ff27`; task-attempts `cfbce80efbf8e19fd667770ec3a8f86cd17dc865`; migration 0003 `49b0798871429d7961e81eb1d86ad892dba0b9b9`; migration 0004 `0ad590ffdd2589f857257739275c15ed2d54d729`; migration 0005 `7a19897f6197c79517170e101e4cbf1db233cac6`.

## Findings

### FND-01 — Task-wide duplicate approval path corrected in local proof (positive, bounded)

PR #40 introduces canonical task identity from repository ID, issue number, target SHA and profile, with a task-level outbox unique on task_key. PR #51 tree retains this. Test `attaches two independently consumed approvals to one task and one task-level outbox` verifies two distinct approval IDs concurrently produce one task, two approval attachments and one outbox row. The earlier per-approval-only duplicate issue is therefore addressed in this local proof tree.

Limit: only two simultaneous approvals are exercised. Issue #38 requires at least 50 contenders and a real-backend one-winner proof. The two-approval local test is not equivalent. Status: PARTIALLY VERIFIED; acceptance criterion NOT MET.

### FND-02 — Resumable takeover trusts a caller boolean (blocking before production)

In `src/task-attempts.mjs`, `acquireAttemptLease(..., { resumable = false })` permits an expired running attempt to be leased again when caller passes `resumable: true`. SQL predicates fence task, current attempt, state, expiry and generation, but the boolean is not bound to a signed capability, authenticated authority, evidence digest or approved resolver decision. The comment itself assumes downstream idempotency/fencing. This is acceptable only as a local experimental adapter; it must not become a production authorization surface. The reconciliation queue correctly records indeterminate work but no trusted resolver is implemented.

Required: replace the boolean with an authenticated capability/evidence contract, or keep takeover disabled; test forged/missing/wrong-scope capability and stale generation; retain dispatch fail-closed.

### FND-03 — Trusted identity/time and executor integration remain absent

The adapter accepts owner/repository/task bindings, worker IDs and `now` from its caller. The proof does not authenticate the issuer/owner, validate signed provenance, supply trusted time, enforce revocation/quota, or connect to the actual Supervisor/Worker/Finalizer execution chain. Digests are evidence identifiers, not proof that the actor is authorized or the content is truthful. No production executor or external side-effect idempotency is qualified.

Required: define one issuer-signed authorization envelope and server-side identity/time boundary across approval, task, attempt, executor, finalizer and reconciliation. Preserve least privilege and separate account identities.

### FND-04 — Review and governance are not acceptance evidence

- PR #36 has COMMENTED reviews by `maxkorolskiy88-ship-it` (not APPROVED); the reviewer explicitly states organizational independence and authorized-approver status NOT VERIFIED. Multiple comments from the same reviewer are not multiple independent reviews.
- PR #39 likewise has COMMENTED reviews from that account; no APPROVED review.
- PR #40, #49 and #51 currently have zero formal reviews in the fetched review lists.
- All five PRs remain OPEN/DRAFT/UNMERGED.
- Prior recorded active ruleset `26550182` required zero approvals; stacked-branch enforcement and required checks are not established by the evidence in this pass.

Required: independent authorized security reviewer, explicit identity/authority evidence, review against immutable exact head, and governance rules that enforce required approvals/checks on the integration target. Do not self-approve or convert COMMENTED into APPROVED.

## CI evidence

- PR #49 code-bearing exact head `b9067dc7d06245893cd4e208f6215438efe5ca64`: PR-triggered workflow run `42533086378` completed SUCCESS (workflow metadata).
- PR #51 exact head `f50e8fc09a6442b4ca3088194c9d7284c7ffce55`: PR-triggered run `42533777096` completed SUCCESS; job `128893481500`; 2 test files / 35 tests passed; npm ci, syntax check, tests and artifact upload succeeded. https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42533777096
- These are local Workers-runtime/Miniflare tests, not hosted D1, actual executor or production qualification.

## Issue #38 acceptance matrix

| Criterion | Result |
|---|---|
| One logical task for multiple approval IDs | VERIFIED locally for 2 concurrent approvals |
| At least 50 contenders | NOT RUN |
| Real-backend/hosted D1 one-winner proof | NOT RUN |
| Interrupted-claim recovery / trusted resolver | NOT VERIFIED |
| Least-privilege authenticated authority | NOT VERIFIED |
| Authorized independent review | NOT VERIFIED |
| Exact-head CI for #51 local proof | SUCCESS |
| Dispatch gates fail-closed | Retained in local adapter (`dispatch: false`); production gates not enabled |

## Disposition

Do not merge #36/#39/#40/#49/#51, enable dispatch, run Workers/DSH, call providers, provision D1 or deploy. The previous F2 issue-label non-CAS race is a separate unresolved blocker. Contour A remains BLOCKED / NOT ACCEPTED; Contour B remains DEFERRED.

## Next bounded step

Implement a narrowly scoped local adversarial test slice proving 50 distinct approval IDs contend on the same task identity, with one task and one task-level outbox, then separately design the capability-gated reconciliation resolver. Do not claim hosted D1 qualification until an explicitly authorized target-environment test is run. Obtain authorized independent review before merge or dispatch.

Canonical MediaHub map (separate project): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
