# Plan: Controller → API Envelope → attested D1 composition

## Frozen baseline
Default branch: Основной  
Target SHA: 565404f84b6b86afb4dc2d8fa939341f42df6eca  
Controller PR #176: f06155b8ac121a4af90cbc2356f12b965d0fbde9  
Pass 111 branch HEAD: 4c8d820102472e130c2e9760f5d42f650ca43394  
Pass 111 code/test SHA: 88911e5a127b9345270b15da8e7cd3f8aa54293a  
Pass 116 source reconciliation: VERIFIED; no runtime code changed.

## Reuse First
- Reuse PR #176 controller workflow/verifier as source material only; do not merge its divergent 38-commit ancestry.
- Reuse PR #177 Node Envelope v1 contract and canonical digest.
- Reuse PR #179 Workers-native Envelope verifier.
- Reuse PR #181 single D1 ledger, migrations 0017/0018 and `admitGitHubNextAttestedEvent`.
- Reuse existing Workers/Vitest local D1 harness and Node built-in test runner.
- No second ledger, workflow authority source, service, dependency, worker ingress or provider SDK.

## Selected integration topology
1. Create a fresh candidate branch from Pass 111 branch HEAD `4c8d820102472e130c2e9760f5d42f650ca43394`.
2. Port only `.github/workflows/next-event-controller.yml`, `scripts/owner-next-event-audit.mjs` and the minimum relevant tests from PR #176; review every changed line.
3. Refactor the audit script into a pure evidence collector plus a thin CLI entrypoint. Keep API transport separate and injectable for tests.
4. Pin GitHub API origin; apply per-request timeout and bounded response bytes; sanitize errors and never print auth material.
5. Build Envelope v1 from the verified API tuple and trusted Actions environment. Keep target SHA, workflow commit SHA, workflow-file blob SHA and ref SHA separate.
6. In the local Workers/D1 integration test, feed the exact collector-produced serialized Envelope and digest into `verifyOwnerNextEnvelopeForActions` and then `admitGitHubNextAttestedEvent`.
7. Keep the actual issue_comment workflow read-only. No hosted D1 binding, no D1 write, no child dispatch, no provider call and no worker launch.
8. Prove legacy `admitGitHubNextEvent` is test-only; use import/call-graph checks and a production composition module that imports only the attested API.
9. Run negative-first tests, exact-head D1 CI and Pool Contract CI. Inspect checked-out SHA and full test totals.
10. Keep PR Draft/unmerged until independent security review, provenance and governance gates are satisfied.

## Data flow
GitHub issue_comment event + trusted Actions context  
→ bounded fixed-origin API reads (repository, Issue, Comment, Run, Workflow, default ref, workflow file)  
→ immutable identity/provenance validation  
→ canonical Envelope v1 JSON + SHA-256 digest  
→ Workers verifier recomputation + Actions context cross-check  
→ local synthetic D1 attested adapter  
→ primary-first full receipt/admission readback

The production controller workflow terminates at read-only observation. D1 composition is proven only in local synthetic integration tests until a separately authorized hosted architecture exists.

## Verification and failure model
- Positive: same fixture API tuple produces the exact canonical envelope and receipt.
- Negative: owner/repository/issue/comment substitution, node ID mismatch, run ID/attempt mismatch, workflow SHA/ref/blob mismatch, stale default ref, duplicate JSON keys, digest mismatch.
- Transport: wrong origin, HTTP failure, timeout, oversized body, invalid JSON and partial read.
- Replay: exact replay succeeds idempotently; altered envelope/run attempt conflicts; no duplicate receipt.
- Authority: all outcomes preserve `dispatch:false` and `executionAuthorized:false`; no production import of legacy entrypoint.

## Risks and rollout
- Separate API reads are not atomic. Read default ref before and after the tuple; reject if it changes, and bind the stable SHA to the envelope.
- Workflow commit SHA and issue_comment target SHA may differ. Never conflate them.
- GitHub Actions issue_comment workflow context is trusted only when source/ref/repository/run fields match independent API readbacks.
- No live hosted D1, external provider, executor or production action in this implementation pass.
- Rollback is branch discard; no schema migration is planned unless the existing 0018 schema is proven insufficient.