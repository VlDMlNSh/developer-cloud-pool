# Pass 61 checkpoint — separate event SHA and workflow SHA

Date: 2026-11-24  
Status: VERIFIED — local D1 and exact synthetic merge CI  
Contour A: NOT ACCEPTED; Contour B DEFERRED.

## Frozen refs
- Default HEAD: `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`
- PR #170 pre-pass: `9a61572dca2a6621001a1bae770e8d85a5d93315`
- PR #170 final head: `4b4055b4f2026db617f1e2f686f337ad85e9531e`
- Exact synthetic merge SHA: `9171489be9232a3c3389fef215904f5ade25a5ea`.
- PR #170 OPEN/DRAFT/UNMERGED; reviews 0; threads 0.

## Completed
- Binder separates `targetSha=context.sha` from `workflowSha=context.workflowSha`.
- Both SHA values independently require 40 lowercase hex characters.
- Exact expected workflowRef remains enforced.
- Migration 0017 no longer asserts workflow_sha equals target_sha.
- Unit and D1 integration fixtures use different valid SHAs.
- D1: 8 files / 108 tests PASS.
- Pool Contract PASS.
- Both workflows checked out the exact synthetic merge; D1 log reports merge `9171489`.
- Four files changed; +12/-6; zero new dependencies.

## Not closed
- Workflow SHA authenticity, content digest, ancestry and independent default-ref API read are NOT VERIFIED.
- Binder remains a local predicate proof, not a live controller or cryptographic event authenticator.
- SQL adversarial matrix (duplicate key, forged tuple, missing route/receipt, field immutability) remains next.
- No hosted D1, secrets, dispatch, provider calls, deployment, merge or production mutation.

## Next bounded pass
Add SQL receipt adversarial tests for duplicate source-comment ID against a distinct immutable envelope; forged INSERT bindings; missing route and missing commit receipt independently; immutable receipt fields; repository key scope. Keep dispatch disabled.

Report: [Pass 61](../reports/2026-11-24-pass61-github-sha-provenance.md)  
PR #170: https://github.com/VlDMlNSh/developer-cloud-pool/pull/170  
Issue #140: https://github.com/VlDMlNSh/developer-cloud-pool/issues/140  
Issue #96: https://github.com/VlDMlNSh/developer-cloud-pool/issues/96  
MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md

## CI correction history
- Intermediate D1 run `45273064784` failed 1/107 because the old stale-workflow-SHA negative test contradicted the new distinct-SHA contract. Replaced with malformed-SHA rejection and positive distinct-SHA coverage.
- Final D1 `45273084680` passed 108/108; final Pool Contract `45273084714` passed. Intermediate Pool Contract run cancelled. Final target is green.
