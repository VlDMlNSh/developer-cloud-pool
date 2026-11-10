# 2026-11-10 — Issue #38 durable single-use claim backend decision

## Scope and immutable context

This is a bounded architecture decision pass for Issue #38. No application or workflow code was changed.

- Repository: `VlDMlNSh/developer-cloud-pool`
- Issue: [#38 — Design and qualify durable single-use Supervisor task claims](https://github.com/VlDMlNSh/developer-cloud-pool/issues/38)
- Current proof heads reviewed:
  - PR #50: `65233f57038a9996e4a6e939abde3642a33d467d` (OPEN/DRAFT/UNMERGED)
  - PR #51: `32c88e50e173e6b19bc6c61723ab6474a3c08145` (OPEN/DRAFT/UNMERGED)
- Prior PR #51 local Workers-runtime CI: run `42536377720`, COMPLETED/SUCCESS. This is not hosted D1 qualification.
- Current Context Window before this report: blob `48c4d47831b189c608cb4c5a15720b9731b22b9b` on `docs/cross-chat-continuation-2026-11-06`.

## Decision

**Select Cloudflare D1 as the preferred real-backend candidate for the existing ledger protocol, subject to qualification. Do not enable dispatch.**

Rationale:

1. It preserves the existing D1 ledger and local Workers-runtime proof line rather than introducing a second coordination authority.
2. D1 documents that each database is inherently single-threaded and processes queries one at a time. Its `batch()` operation executes statements sequentially in one SQL transaction; if a statement fails, the batch is aborted/rolled back.
3. The protocol can express the winner through a durable unique claim key and a conditional write, with the winner decision and audit/outbox write in one transaction. The production proof must test simultaneous requests against the actual hosted D1 database; documentation semantics and Miniflare tests alone do not prove our deployed code's correctness.
4. The documented Workers Free tier includes D1 for prototyping/experimentation. Current limits include 5 million rows read/day, 100,000 rows written/day and 5 GB total stored data. Since 2026-09-01, daily read/write overages fail queries until reset at 00:00 UTC. These limits are a hard availability boundary, not permission to fall back to a paid plan. Quota exhaustion must fail closed and must never create an alternate claim authority.
5. Existing D1 migrations and ledger proof reduce implementation divergence. Durable Objects remain a technically strong alternative, but adding a separate coordinator now would create a second authority/state transition path without demonstrated need.

Official evidence:
- [D1 pricing and free-plan FAQ](https://developers.cloudflare.com/d1/platform/pricing/)
- [D1 limits and single-threaded database behavior](https://developers.cloudflare.com/d1/platform/limits/)
- [D1 batch transaction semantics](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch)
- [2026-09-01 enforcement of D1 Free daily query limits](https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/)
- [Durable Objects storage and transactional consistency](https://developers.cloudflare.com/durable-objects/best-practices/access-durable-objects-storage/)
- [Durable Objects free-plan pricing and limits](https://developers.cloudflare.com/durable-objects/platform/pricing/)

This is a design preference, not evidence that the connected Cloudflare account is on Workers Free, that a hosted database exists, or that a hosted database has been exercised. The Cloudflare connector identity was confirmed, but no account plan, resource inventory, secret, token, or credential value was inspected.

## Three-option comparison

### A. Serialized Supervisor + GitHub Issue labels

**Rejected as the durable single-use primitive.**

GitHub Actions workflow concurrency serializes participating workflow runs in a concurrency group, but does not lock out other workflows or actors mutating Issues. GitHub Issue label PATCH has no compare-and-swap precondition. Read-back can detect some conflicts after the fact; it cannot prove a unique winner under concurrent independent writers.

Could be used as an operational serialization convention only if every writer is governed by the same gate, but Issue #38 explicitly requires a real one-winner primitive. Residual race is unacceptable for dispatch authorization.

### B. Dedicated state repository + immutable Git refs

**Rejected for the current Supervisor authority boundary.**

GitHub Create a reference returns conflict when the ref already exists and is a possible reservation primitive. However, it requires repository Contents: write. The current Supervisor must not receive that broader permission as a shortcut. A separate narrowly scoped broker or identity could potentially own the reservation repository, but that is an additional service/authority boundary requiring its own authentication, lifecycle, deletion/recreation prevention, audit, retry and recovery design. It is not justified while an existing D1 ledger candidate is available.

Reference: [GitHub REST — Create a reference](https://docs.github.com/en/rest/git/refs#create-a-reference).

### C. Conditional-write database/store

**Preferred: existing D1 ledger, not yet qualified.**

D1 supports transactional batches and a single-threaded database execution model. A unique constraint plus conditional insert/update can implement a durable winner decision. D1 is the smallest path consistent with the existing ledger proof. The real backend must still be exercised.

Durable Objects provide global uniqueness per object ID, strongly consistent transactional storage, input/output gates and SQLite-backed storage. They are a viable alternative if a later proof demonstrates that the D1 transaction model is insufficient. For the present protocol, introducing Durable Objects alongside D1 risks splitting the claim authority across two stores and complicating atomicity between claim state and ledger/outbox records. Do not adopt a two-store protocol without a separately proven transactional boundary.

## Required protocol invariants before implementation/qualification

1. One canonical claim identity per task generation; uniqueness enforced by the backend, not by read-then-write application logic.
2. Claim reservation, audit provenance and any outbox intent are committed atomically in the same D1 transaction.
3. A replay with identical immutable identity and payload is idempotent; a conflicting replay is rejected without mutation.
4. Lease expiry alone never proves the prior executor stopped and never authorizes a second attempt.
5. Recovery distinguishes: request never committed; claim committed but response lost; worker started; worker outcome unknown; terminal result committed but response lost.
6. No automatic reclaim of an indeterminate attempt until trusted authority can establish the prior execution is fenced/stopped. Otherwise remain blocked/indeterminate.
7. Every transition carries task/attempt identity, generation, input digest, actor/issuer, capability decision, timestamps and audit-event digest as applicable.
8. D1 quota exhaustion, unavailable database, timeout, ambiguous commit result, or failed audit write all fail closed. No GitHub-label or ref fallback.
9. Supervisor remains least-privilege; no `contents: write` grant. No secrets are read or disclosed.
10. Dispatch gates remain closed until the acceptance evidence below is complete.

## Qualification plan

A future implementation/qualification pass must pin a hosted D1 database and exact deployed Worker revision, then:

- Run at least two independent concurrent claimants against the real backend with synchronized start and repeated contention; prove exactly one durable winner per task generation.
- Verify the loser cannot dispatch, and that duplicate/replayed calls return only the same immutable winner.
- Inject response loss immediately after commit and prove recovery reads the committed winner without creating a second claim.
- Inject failure at each transaction statement boundary; prove no partial claim/audit/outbox state is visible.
- Restart/redeploy between reservation, worker start, indeterminate transition and reconciliation; prove durable recovery and no stale executor takeover.
- Exercise worker failure and indeterminate handling without clearing leases or blindly retrying.
- Verify quota/overload/timeout paths fail closed and record no false success.
- Independently review SQL, Worker authority, permissions, secrets isolation, audit provenance and exact-head CI.
- Record account-plan evidence without exposing credentials; if free-tier entitlement cannot be confirmed, mark hosted qualification BLOCKED rather than assuming it.

Static tests and Miniflare are supporting evidence only. They cannot satisfy real-backend contention or hosted recovery criteria.

## Status and restrictions

- Backend design preference: **D1 SELECTED FOR QUALIFICATION**
- Hosted D1 account/plan/resource qualification: **NOT RUN**
- Concurrent real-backend one-winner proof: **NOT RUN**
- Full claim recovery lifecycle: **NOT QUALIFIED**
- Independent security review: **NOT RUN**
- Issue #38: **OPEN / NOT QUALIFIED**
- Both dispatch gates: **KEEP FAIL-CLOSED**
- Contour A: **BLOCKED / NOT ACCEPTED**
- Contour B: **DEFERRED**

No resource was created, no database was modified, no secrets or credential values were read, no dispatch or provider/model call was made, no service was deployed, and no PR was merged.

## Next concrete step

Inspect the current D1 ledger schema and claim implementation across the stacked proof PRs, then prepare a narrowly scoped hosted-D1 qualification harness and recovery test matrix. Before any hosted resource operation, confirm the exact account/plan and permissions without exposing secrets; do not create resources or enable dispatch as part of that inspection.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
