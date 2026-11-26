# Pass 110 — Workers-native API-attested envelope verifier

Date: 2026-11-27

## Frozen target and scope
- Base: PR #178 implementation head `680bb7a1af7984b74b93e17284ef4f11ad30dba0`, based on default `Основной` @ `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- Working branch: `feat/pass110-workers-envelope-validator-2026-11-27`.
- Scope: add a Workers-compatible strict v1 envelope parser/validator, WebCrypto canonical digest, and cross-check against the existing trusted GitHub Actions context adapter; add focused negative-first tests.
- Explicitly excluded: D1 migration 0018, D1 binder/receipt/admission changes, controller workflow wiring, hosted D1, dispatch, executor/provider calls, deployment and merge.

## Reuse First
- Reused the frozen envelope schema and fixed ordered-array canonicalization from `scripts/owner-next-api-attestation-envelope.mjs`.
- Reused `mapGitHubActionsContext` from the existing D1 proof package as the trusted context projection.
- Used Workers WebCrypto (`crypto.subtle`) and TextEncoder; no Node `node:crypto`, Buffer, new package, service or ledger.
- Kept API-only provenance (Issue/Comment node IDs, workflow ID/state/blob SHA) distinct from Actions context fields. The envelope remains evidence, not authority.

## Implementation
- Added `proofs/d1-ledger/src/owner-next-envelope.mjs`.
- Rejects malformed/oversized JSON, duplicate JSON keys, unknown/missing object keys, wrong schema/version, invalid owner/repository/issue/comment identity, malformed IDs/SHAs, stale/mismatched run/ref/workflow provenance and non-read-only policy.
- Recomputes the exact v1 ordered-array SHA-256 digest using WebCrypto; never trusts the caller-supplied digest.
- Cross-checks source event, owner identity, comment, issue, actor, repository, ref, run ID/attempt, event head SHA, workflow ref and workflow commit SHA against the existing trusted Actions context projection.
- Added `proofs/d1-ledger/test/owner-next-envelope.test.ts` covering valid envelope, duplicate keys, unknown fields, digest tampering, event/run substitution, dispatch policy, ref mismatch and malformed/oversized input.
- This pass does not connect the new verifier to `bindGitHubNextEvent` or D1 writes. Integration remains a later pass.

## Validation
- Source files written through GitHub Contents API and require read-back plus CI.
- Tests authored; local execution NOT RUN in this environment.
- Exact-head/merge-result CI: pending PR workflow.
- Independent security review: NOT RUN.
- Active engineering time: NOT MEASURED; no reliable wall-clock task timer was available.

## Safety and status
- No secrets read; no hosted D1, live issue_comment, provider calls, dispatch, executor launch, deployment, merge or production writes.
- `dispatch=false` and `executionAuthorized=false` are required in the envelope and all verifier success results.
- Pass 110 source change: PLANNED until CI/read-back; implementation authored, qualification pending.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

## Next
1. Verify exact-head CI and inspect test logs.
2. Independently review parser and canonicalization parity against the frozen Node test vectors.
3. Only then plan migration 0018 and a coordinated D1 binder/approval/receipt/replay integration. Keep dispatch disabled.

PR: https://github.com/VlDMlNSh/developer-cloud-pool/pulls
Canonical MediaHub map (Contour B deferred): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## Validation update — 2026-11-27

- Initial PR #179 merge-result run `45895815698` completed SUCCESS on merge-result SHA `24124356a878568da9327d109ce8170bc73232c3`. D1 suite: 9 files / 133 tests passed; this run preceded the added Node-vs-WebCrypto digest parity assertion.
- Pool Contract Validation `45895815527` completed SUCCESS: dispatch-disabled assertion, YAML parsing and security-contract validation passed.
- Added explicit parity test against frozen `scripts/owner-next-api-attestation-envelope.mjs` in commit `b4ec2dc46cf2b0cf90ffb48a35075ed06e837b1e` (latest implementation HEAD at this update).
- Because D1 workflow is scoped to PRs targeting `Основной`, PR #179 remains stacked on PR #178 and PR #180 is the validation-only PR targeting default. New run for the parity assertion is pending / NOT VERIFIED.
- PR #179 remains OPEN/DRAFT/UNMERGED; 0 formal reviews and 0 inline threads. PR #180 is validation-only and must not be merged.
- No CI claim is transferred from prior merge-result SHA to latest parity-test SHA.
