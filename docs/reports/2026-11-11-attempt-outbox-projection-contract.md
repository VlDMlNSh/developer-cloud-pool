# 2026-11-11 — Attempt outbox to GitHub projection integration contract

## Immutable target and scope

- Target PR #58 head: 5caeb60f7a45d836c6ad1eea2fb86e20995da025.
- PR #58 base: ec3f3266ca28c4fb5633a9475cc6f396a4677974.
- PR #58 remains OPEN / DRAFT / UNMERGED.
- This pass adds a pure outbox-row→projection-envelope adapter, contract documentation and focused adapter/reconciler tests on PR #58 branch.
- No default-branch runtime code, secrets, provider calls, hosted resources, dispatch, deployment or merge.

## Implementation

- Added proofs/d1-ledger/src/projection-envelope.mjs.
  - Maps outbox_id → eventId; event_digest → payloadDigest; repository_id / issue_number → numeric GitHub identifiers; target_sha → targetSha; lease_generation → claimGeneration; terminal_status → terminalOutcome; profile is retained.
  - succeeded maps only to pool:probe-complete; failed/abandoned map only to pool:needs-review.
  - Rejects malformed IDs, digests, SHA, profile, outcome and numeric fields. Returns dispatch:false.
- Added proofs/d1-ledger/test/projection-envelope.test.ts.
  - 5 tests cover mapping, failed/abandoned mapping, malformed row denial, idempotent reconciliation of mapped event, and failure behavior with the injected fake projection adapter.
- Added docs/contracts/ATTEMPT-OUTBOX-GITHUB-PROJECTION-INTEGRATION-CONTRACT.md.
- Added mapper syntax validation to proofs/d1-ledger/package.json.
- Existing PR #54 outbox lease functions remain responsible for acquire/retry/delivered acknowledgement; this pass does not wire a production delivery actor.

## Read-back

- Mapper blob: cb1fb8b130c66343ca3b1c071aac506113c4cfb0.
- Test blob: 14fd64aa76d1cc97ea45fc1ecfa6d80e28bc8624.
- Contract blob: 712b4080e16c1405c1869e1a43232993c05ec216.
- package.json blob: ebfcf2b311871694904516b245222425fa9c38f8.
- PR API head confirmed as 5caeb60f7a45d836c6ad1eea2fb86e20995da025.

## Exact-head CI

Both events point to exact head 5caeb60f7a45d836c6ad1eea2fb86e20995da025:
- Push run 43043277262: COMPLETED / SUCCESS.
- Pull request run 43043284086: COMPLETED / SUCCESS; job 130600450879.
- Job log: 4 test files passed, 55 tests passed, 0 failed. This includes 5 new adapter tests, 10 projection reconciler tests, 27 D1 claim/outbox tests and 13 consume tests. Syntax check passed.

## Explicit limitations

- Tests map a representative outbox row into the fake reconciler. They do NOT yet execute a single integrated D1 transaction→outbox lease→mapping→GitHub API→D1 acknowledgement cycle.
- Projection failure test uses an API object with no task/attempt storage capability; it proves interface separation, not a database snapshot proving task/attempt immutability across an integrated failure.
- The projection reconciler uses fake GitHub transport. No live API race or concurrent human-edit guarantee.
- D1 now/lease time remains caller-supplied in local proof; trusted-time authority is not implemented.
- No authenticated Issuer, production Worker adapter, hosted D1 qualification, process restart/fault-injection across the complete delivery actor, or independent security review.

## Status

- PR #58 source + exact-head CI: VERIFIED for this local proof head.
- Integration adapter: VERIFIED as pure mapping + fake reconciler tests.
- End-to-end outbox delivery actor: NOT IMPLEMENTED.
- Hosted qualification / independent security review: NOT RUN.
- Issue #38: OPEN / NOT QUALIFIED.
- Dispatch: FAIL-CLOSED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next bounded step

Implement a local-only delivery orchestration function that consumes a fenced projection lease, maps the leased row, invokes an injected projection adapter, then acknowledges delivered only after projection_verified=true; on retryable/ambiguous results, use the same lease generation to mark retryable. Add D1 integration tests for success, projection failure isolation, stale lease acknowledgement, lost response/restart reconciliation. Keep the adapter fake and dispatch=false.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
