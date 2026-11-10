# Contour A — real-backend claim contention gate review

Date: 2026-11-10
Status: DESIGN/CI EVIDENCE REVIEW — REMOTE CLAIM QUALIFICATION NOT PERFORMED

## Immutable repository context

- Default branch `Основной` HEAD observed: `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- PR #54: `test/50-approval-logical-task-contention-2026-11-09`, head `ec3f3266ca28c4fb5633a9475cc6f396a4677974`, base `b9067dc7d06245893cd4e208f6215438efe5ca64`, OPEN/DRAFT/UNMERGED.
- PR #54 exact-head CI run `42537241204` (Isolated D1 Ledger Proof): SUCCESS. Formal reviews: 0. Inline review threads: 0.
- PR #51: head `32c88e50e173e6b19bc6c61723ab6474a3c08145`, base `4ab0fdc4d649736a171faf95b9ab3a24b17217e8`, OPEN/DRAFT/UNMERGED. Exact-head run `42536377720` (Isolated D1 Ledger Proof): SUCCESS. Formal reviews: 0; inline review threads: 0.
- Issue #38: [Design and qualify durable single-use Supervisor task claims](https://github.com/VlDMlNSh/developer-cloud-pool/issues/38).

## What the current proof establishes

PR #54 adds a 50-contender logical-task test in a local Workers/Miniflare D1 runtime. Its stated assertions include 50 approvals attached to one canonical logical task, one task delivery outbox, identical returned task/outbox identities, and `dispatch:false` for all callers. This is useful evidence for the local SQL/transaction path.

PR #51 adds a durable local reconciliation row for an indeterminate attempt. It deliberately does not clear the lease, retry, or terminalize the attempt because expiry alone does not prove the prior executor stopped. PR #50 adds exact replay handling for attempt finalization. These are local D1 proofs, not hosted backend evidence.

## Why Issue #38 remains open

Issue #38 explicitly requires a real-backend concurrent one-winner demonstration or a documented decision to keep dispatch disabled. It also requires interrupted-claim recovery, least-privilege authority, audit provenance, independent security review and exact-head CI.

Current evidence does not meet that gate:
- Local Miniflare concurrency does not prove hosted Cloudflare D1 concurrency, isolation, transaction semantics under actual service contention, or operational failure behavior.
- PR #54 and PR #51 remain Draft and have no formal review or inline review.
- The current proof chain has not demonstrated a production-owned durable reservation primitive and recovery under a real backend.
- No remote D1 test was run in this pass. No Cloudflare account/database binding or authorization was inferred from local test success.
- No secret, D1 credential, production database, dispatch workflow, provider, model, or deployment was accessed or changed.

## Decision and next bounded step

Do not merge these stacked local proofs as if they qualify the hosted claim protocol. Keep both dispatch gates disabled.

Next, prepare a backend qualification plan that selects one real, already-available free-tier durable store only after verifying account ownership, resource limits, credential scope and isolation. The test must use an isolated disposable namespace/database and a narrowly scoped test credential; run genuinely concurrent independent claim attempts; record one-winner results, transaction/error behavior, retry after ambiguous response, process interruption and durable read-back. If no eligible backend and scoped credential are available, record the decision to keep dispatch disabled rather than inventing a substitute or granting broad permissions.

Candidate designs remain those listed in Issue #38:
A. serialized Supervisor + GitHub Issue labels, with explicit single-writer governance and residual race;
B. dedicated state repository with immutable per-task reservation refs and tightly scoped authority;
C. free conditional-write database/store, only after entitlement, isolation, quota and credential ownership are verified.
Do not grant the current Supervisor `contents: write` merely to prototype option B.

## Disposition

- PR #54 local 50-contender proof: CI SUCCESS; remote backend qualification NOT RUN; independent review NOT RUN.
- PR #51 local reconciliation proof: CI SUCCESS; remote backend qualification NOT RUN; independent review NOT RUN.
- Issue #38: OPEN / NOT QUALIFIED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
