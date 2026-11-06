# Atomic D1 claim + transactional outbox — 2026-11-07

## Disposition
Implementation branch created and draft PR opened. Exact-head CI is NOT VERIFIED; independent review NOT RUN. This is a local Workers-runtime proof only. No production integration or dispatch authority is introduced.

## Immutable provenance
- Parent proof PR #36 head: `9ef7e4aadd6c723fa86b21ea44383f8020643a0c`.
- Branch: `proof/d1-claim-outbox-atomic-2026-11-07`.
- Draft PR #39: https://github.com/VlDMlNSh/developer-cloud-pool/pull/39
- PR head: `c07460ea685ead1792eec85c82218c7d579c4b65`.
- Compare against parent: 5 commits ahead / 0 behind; five changed files.
- Verified blobs:
  - migration `9c1fef55001bb2db1d51621f0ad17114628a496d`
  - adapter `a696952e693ef1e31cc1a9d648fb785092185dc7`
  - tests `04690862095c6bdd0156b4a6d10e23e8c314b953`
  - package manifest `398e49660a3dd082299eebc2facd027385e2fd6c`
  - README `c23aadbb0b0dc9b531f5afbf180400bffe8501a9`

## Implemented
- Added `pool_task_claims` and `pool_task_outbox` tables with unique approval/outbox identity and constrained lifecycle states.
- Added `claimAndEnqueue`: one D1 batch conditionally consumes the pre-existing approval, inserts a pending durable claim and inserts one outbox event.
- Claim/outbox IDs are deterministic from the immutable approval ID.
- Retry path verifies an already committed claim/outbox pair and returns `ALREADY_ENQUEUED`; it does not create a duplicate.
- Added tests for 12 concurrent callers, idempotent retry, binding mismatch, missing batch API and ambiguous batch failure.
- All success/deny responses retain `dispatch: false`; no Worker/Supervisor or Hono integration.

## Verification
- All five changed files were fetched after writes and their blob SHAs recorded above.
- PR #39 created as DRAFT, stacked on PR #36 branch `proof/d1-single-use-ledger-retry-2026-11-06`.
- Initial exact-head workflow query returned an empty list; combined commit status returned no statuses. Exact-head CI is therefore NOT VERIFIED, not assumed queued or successful.
- PR reviews: 0; inline review threads: 0.
- No local execution environment was available through the GitHub file connector; no local test run is claimed.

## Explicit remaining gaps
- Lease acquisition/reclaim, monotonically increasing lease generation, fencing tokens, stale acknowledgement rejection, crash recovery and dead-letter processing are NOT IMPLEMENTED.
- Caller-supplied owner/repository/time fields remain untrusted inputs in this local proof. No signed issuer validation, authenticated owner derivation, trusted server clock, production issuance/revocation/audit, quota accounting, backup/restore or live Cloudflare account entitlement is established.
- D1 batch semantics and concurrency must be confirmed by exact-head Workers-runtime CI and independent review. The code must not be treated as production authorization.

## Safety
No secrets, live D1 provisioning, Worker deployment, billing changes, GitHub dispatch, DSH, Resource Probe, provider/model calls, paid resources or Contour B work. Both dispatch gates remain fail-closed.

## Next
1. Recheck PR #39 exact-head CI and inspect all job logs; empty results remain NOT VERIFIED.
2. Resolve any SQL/runtime/test failures, then re-fetch final blobs and exact-head CI.
3. Add lease/fencing/recovery tests in a subsequent bounded increment.
4. Obtain independent security review before any production-selection decision.



## 2026-11-07 follow-up — transaction attribution correction

A second review found that the original batch design guarded claim insertion by matching `consumed_at`. That did not prove the current transaction performed the ready-to-consumed transition when a previously consumed approval had the same timestamp. The original batch implementation was therefore superseded before qualification.

The adapter is now changed to issue one conditional `UPDATE` only. A SQLite `AFTER UPDATE OF state` trigger creates the claim and outbox rows in the same transaction, and only when `OLD.state='ready'`, `NEW.state='consumed'`, and the old/new consumed timestamp conditions hold. A trigger insert failure should roll back the parent update and claim insert atomically.

New adversarial coverage: pre-consumed approval with the same timestamp; synthetic outbox insert abort verifies approval remains ready and no claim survives. Concurrency and idempotent retry tests remain. All outcomes still set `dispatch:false`.

Updated PR #39 head: `f33f552f396e878e80a7f383e5436080cb668cb0`, 11 commits ahead / 0 behind the immutable parent `9ef7e4aadd6c723fa86b21ea44383f8020643a0c`. Current blobs: migration `44b8f7e0658296d287269770c5e91b1c3e25973c`; adapter `253bf5c6c9dcfca9c9c2666b21c1a77101766cba`; tests `4711bb7a5186807d6618d6dc59af10809caec6f3`; package `398e49660a3dd082299eebc2facd027385e2fd6c`; README `faac8cacf27d58362c2acf16006acf8ab973e421`.

Exact-head CI query and combined status remain empty: NOT VERIFIED. Reviews/threads 0/0. No local test execution claimed. Trigger-backed semantics still require Workers-runtime CI and independent security review. Lease/fencing/recovery remain unimplemented. No production integration, D1 provisioning, dispatch, secrets or provider/model calls.
