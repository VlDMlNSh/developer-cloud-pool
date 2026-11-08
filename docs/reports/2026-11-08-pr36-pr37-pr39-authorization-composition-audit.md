# Engineering audit — 2026-11-08 — PR #36/#37/#39 authorization and durable-claim composition

## Scope and immutable refs
Repository: `VlDMlNSh/developer-cloud-pool`. Default branch `Основной` @ `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.

- PR #36 branch `proof/d1-single-use-ledger-retry-2026-11-06` current HEAD: `e11fc90e50bd20b166207af64551c49cfa80ffb4`.
- PR #37 branch `feat/reusable-pool-worker-boundary-2026-11-06` current HEAD: `5587a4e013507b5be330fd0c49ce1fc836faa946`.
- PR #39 branch `proof/d1-claim-outbox-atomic-2026-11-07` current HEAD: `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`.
- PR #39 declared base: PR #36 branch at `9ef7e4aadd6c723fa86b21ea44383f8020643a0c`.
- PR #27 documentation branch HEAD before this report: `322a81854dd224348ae416be84c27ca7cca152d7`.

## Exact-head CI and review read-back
- PR #36 / `e11fc90...`: run `42329438308` Pool Contract Validation SUCCESS; run `42329438351` Isolated D1 Ledger Proof SUCCESS.
- PR #37 / `5587a4e...`: run `42284051311` Pool Contract Validation SUCCESS; run `42284051309` Reusable Pool Worker Boundary Validation SUCCESS.
- PR #39 / `ecc7193...`: run `42329993548` Isolated D1 Ledger Proof SUCCESS. PR description records tested combined tree `77b3ce30a3c90ad564db892cae82076b5c0774c9` with parent `e11fc90...` and child `ecc7193...`; 2 Workers-runtime test files / 19 tests passed.
- Formal review submissions: 0 for each PR. Inline review threads: 0 for each PR. Independent security review: NOT RUN.
- CI evidence is local Workers-runtime/Miniflare and static contract validation. It does not establish remote D1 entitlement, remote D1 behavior, production identity, runtime deployment, or exactly-once external execution.

## Source-level findings

### PR #36 — conditional single-use approval consume
Source `proofs/d1-ledger/src/consume.mjs`, blob `ef4f9693e1e2a378c08e974a65a8deb486af8712`.
- Uses one conditional UPDATE from `ready` to `consumed`, binding approval ID, owner numeric ID, repository ID, issue number, target SHA, allowlisted profile, envelope digest, unconsumed state and expiry.
- Adapter accepts `binding` and `now` as function arguments. Owner/repository/approval provenance is therefore caller-supplied in this proof; `now` is not a trusted server clock here.
- No signed issuer verification, authenticated owner derivation, authorization of the approval issuer, issuance/revocation/audit service, key rotation/revocation, or production trust boundary is present.
- Successful consume still returns `dispatch: false`; module is deliberately not integrated with production workflows.

### PR #39 — atomic claim and outbox record
Source blobs:
- `claim-outbox.mjs`: `96ee60a06e7d37b51b999829fa223eba7488d9e4`.
- `consume.mjs`: `f71e559a7c13b9a0242a7f619eba998c5906d95e`.
- `0002_create_task_claim_outbox.sql`: `44b8f7e0658296d287269770c5e91b1c3e25973c`.
- `claim-outbox.test.ts`: `eb02a8edd0a748fb2c645457bded3be61dd87d60`.
- `claimAndEnqueue` conditionally consumes approval; a SQLite AFTER UPDATE trigger creates one deterministic claim and one outbox row in the same database transaction. A subsequent read verifies the claim/outbox pair and immutable approval binding. Repeated calls return the same pair only when binding matches.
- Tests cover 12 concurrent attempts, deterministic retry, immutable-binding mismatch, pre-consumed replay with matching timestamp, and rollback when outbox insertion fails.
- The migration includes future lease fields (owner, generation, expiry, attempt count) and statuses, but this PR does not implement lease acquisition/renewal, generation fencing, stale-worker acknowledgement, outbox delivery, delivery retries, dead-letter processing, crash recovery, or a Supervisor consumer.
- The outbox row is persisted as `pending`; no evidence shows it is delivered to a worker. All adapter paths retain `dispatch: false`.

### PR #37 — reusable Supervisor/Worker boundary
Source blobs:
- `.github/workflows/pool-supervisor.yml`: `4a176e5ebb3cf1e7ef29b00164498e34a4f9fafc`.
- `.github/workflows/pool-worker.yml`: `4f57e8eef4a40d14b8d1df467cfac07e39e490a2`.
- `scripts/pool-supervisor.mjs`: `2d0611851ff738b2aeb377f464e5fa7d821f3696`.
- Worker is reusable-only (`workflow_call`), validates caller/callee repository and workflow identity/SHA, reads task issue, checks exact claimed lifecycle state, target SHA and allowlisted profile. Worker permissions are read-only; Supervisor intake/finalizer has issue write.
- Supervisor's claim is a GitHub Issue label GET/PATCH followed by read-back. The implementation itself notes this is not compare-and-swap; workflow concurrency serializes only workflows in its concurrency group and does not prevent another actor/workflow from changing labels. Therefore this is not a database-grade atomic claim.
- The Supervisor intake accepts a `pool:ready` issue with valid target/profile fields; source reviewed here does not cryptographically bind the label transition to a signed owner approval or invoke PR #36/#39 D1 ledger. The D1 proof and Supervisor/Worker implementation remain separate, unintegrated mechanisms.
- The Worker verifies the claimed label and task fields, not a consumed D1 approval row or delivered outbox event.
- Both dispatch and authorization-acceptance gates are checked before claiming. Their live values are not re-read in this audit; do not infer production configuration from prior reports.
- The current default branch still has the old Supervisor implementation because PR #37 is unmerged. Issue #38 records this as a known default-branch risk.

## Stack relationship: PR #39 vs PR #36
- PR #39 is 17 commits ahead / 1 behind current PR #36 head by graph ancestry, with merge base at its declared PR #36 base `9ef7e4a...`.
- The parent workflow file is identical at both branch heads (blob `cb31bda7588137baf84a8141aec11024461cf818`), so the one-commit ancestry difference does not currently create a workflow file-content conflict.
- PR #39 has CI evidence against the combined parent/child tree recorded in its PR body, but it remains a stacked draft and has no independent review. Revalidate combined-tree CI after any parent or child update; do not merge child independently of its parent.

## Metadata drift discovered
- PR #36 body cites old head `1e278b...`; the live branch resolves to `e11fc90...` (two commits ahead).
- PR #37 body cites `5b45a29...`; the live branch resolves to `5587a4e...` (three commits ahead). Issue #38 already records `5587a4e...`.
- This report records live branch refs and current exact-head CI; the PR descriptions themselves were not modified.

## Composition decision
The three PRs are useful isolated proofs, not a deployable authorization pipeline. Do not compose them by simply wiring `claimAndEnqueue` into the current Supervisor. Before any integration, define and independently review:
1. A trusted issuer/authentication model and canonical approval envelope; derive owner/repository from authenticated context, not caller-provided fields.
2. Trusted server time and approval expiry/revocation semantics.
3. One authoritative claim state machine: approval consume, claim/outbox creation, lease/fencing, worker idempotency and terminal acknowledgement.
4. A narrowly scoped outbox dispatcher/consumer with retry, deduplication, dead-letter and crash recovery; no broad `contents:write` shortcut.
5. Supervisor/Worker contract that requires verifiable consumed approval and claim identity, rather than GitHub labels alone.
6. Real-backend contention/recovery tests and independent security review, plus remote D1 entitlement/isolation/quota verification.
7. Governance enforcement requiring independent approval, not a ruleset with zero required reviewers.

Until then, both dispatch gates must remain fail-closed.

## Status
- Local D1 conditional-consume proof: VERIFIED within its Workers-runtime test scope.
- Local atomic claim/outbox proof: VERIFIED within its Workers-runtime test scope.
- Reusable Supervisor/Worker static boundary: VERIFIED at current branch exact-head CI; issue-label claim remains non-CAS.
- Integrated Supervisor + D1 + outbox pipeline: NOT IMPLEMENTED / NOT QUALIFIED.
- Independent security review: NOT RUN.
- Remote D1 qualification / deployment / worker execution: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

Next bounded step: produce a formal design decision and threat model for one integrated claim/lease/outbox protocol; keep production dispatch disabled. Canonical map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
