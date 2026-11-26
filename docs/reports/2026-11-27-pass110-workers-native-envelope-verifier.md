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


## Final Pass 110 validation — 2026-11-27

- Validation-only PR #180 exposed exact implementation code SHA `b4ec2dc46cf2b0cf90ffb48a35075ed06e837b1e` to existing workflows on canonical base `Основной` @ `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- D1 run [45895942746](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45895942746), job `140169725137`: COMPLETED / SUCCESS. Job log confirms merge-result checkout `7e7f5b5` (full SHA `7e7f5b5...`); `npm ci`, inert Worker syntax check and Vitest completed. 9 test files / 134 tests passed, including 11 tests in `owner-next-envelope.test.ts`; this includes Node-vs-WebCrypto canonical digest parity.
- Pool Contract Validation [45895942756](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45895942756), job `140169725307`: COMPLETED / SUCCESS; dispatch-disabled assertion, workflow YAML parsing and security-contract validation passed. The separate envelope contract suite reports 20/20 tests passed.
- These are PR merge-result CI runs for code SHA `b4ec2dc46cf2b0cf90ffb48a35075ed06e837b1e`, not a standalone push check on the later docs-only branch tip. No source/test changes followed the validated code SHA; docs-only commits advanced PR #179 to `dfe6b34d4cd28481e5ec28d2a6e1657a3c18ffcf`.
- PR #179 remains OPEN/DRAFT/UNMERGED, base PR #178 branch, mergeable=true, formal reviews 0, threads 0. PR #180 remains OPEN/DRAFT/UNMERGED and validation-only; do not merge it.
- Independent security review and governance/ruleset revalidation remain NOT VERIFIED. No workflow wiring, D1 migration 0018, D1 binder integration, hosted D1, secrets, providers, dispatch, executor, deployment, merge or production writes.
- Pass 110 verifier and tests: VERIFIED by merge-result CI. API-attestation → D1 end-to-end integration: NOT IMPLEMENTED. Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
