# Pass 50 — D1 lease trusted-time adversarial review

Date: 2026-11-23  
Repository: https://github.com/VlDMlNSh/developer-cloud-pool  
PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/168  
Immutable target: `5450ddd8002d7a336b3eb41adeaba1d62a17fb75`

## Objective

Perform one bounded source-level adversarial review of the current-base D1 proof, focusing on lease acquisition authority and the migration 0011–0015 chain. No implementation change, dispatch, hosted database operation, deployment, or merge was authorized or performed.

## Finding F-50-01 — caller-controlled lease time

**Severity: HIGH — qualification blocker.**

In `proofs/d1-ledger/src/acquire-attempt-lease.mjs`, `input.now` is accepted after only a positive safe-integer check. The adapter uses it to set `pool_tasks.updated_at`, `lease_expires_at`, and the lease's expected attempt-start/audit-event timestamps. Migration 0014's SQL guard compares lease expiry against `NEW.updated_at`, which is written from the same caller-provided value. The injected executor authenticator binds principal identity and capability profile, but does not establish the provenance of `input.now`.

A caller able to invoke the adapter can therefore choose the timestamp anchoring lease validity. This defeats the intended trusted-time property and blocks lease qualification. The current proof remains non-dispatching (`dispatch:false`, `executionAuthorized:false`), so this finding is not evidence of an enabled execution path.

### Required remediation

1. Add a required trusted-clock dependency to `acquireAttemptLease`; do not accept caller time as authority.
2. Sample trusted time after executor authentication and immediately before the conditional write.
3. Reject invalid time and clock rollback; derive all persisted timestamps and expiry from that sample.
4. Add negative tests for caller-supplied future/past values, invalid trusted clock, and rollback.
5. Separately qualify the trusted clock's provenance in the actual controller/runtime before any execution integration.

## Evidence

- Source file at immutable target: https://github.com/VlDMlNSh/developer-cloud-pool/blob/5450ddd8002d7a336b3eb41adeaba1d62a17fb75/proofs/d1-ledger/src/acquire-attempt-lease.mjs
- SQL lease guards: https://github.com/VlDMlNSh/developer-cloud-pool/blob/5450ddd8002d7a336b3eb41adeaba1d62a17fb75/proofs/d1-ledger/migrations/0014_d1_lease_fencing_guards.sql
- PR review comment: https://github.com/VlDMlNSh/developer-cloud-pool/pull/168#issuecomment-7107620536
- Acceptance tracking: https://github.com/VlDMlNSh/developer-cloud-pool/issues/140#issuecomment-7107621324
- Exact PR merge-result CI previously observed: D1 run 45212088972 SUCCESS; Pool Contract run 45212089137 SUCCESS. These are GitHub Actions results; no local test run was performed in Pass 50.
- Formal independent/external review: NOT RUN.

## Disposition

- Pass 50 source-level finding: VERIFIED.
- Remediation: PLANNED / NOT IMPLEMENTED.
- PR #168: OPEN / DRAFT / UNMERGED.
- Dispatch, hosted D1, deployment, provider calls: NOT PERFORMED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next step

Implement the trusted-clock seam and adversarial tests in a new bounded PR revision; then rerun both required workflows on the exact resulting PR merge SHA and request independent security review. Do not merge or enable dispatch until all gates pass.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
