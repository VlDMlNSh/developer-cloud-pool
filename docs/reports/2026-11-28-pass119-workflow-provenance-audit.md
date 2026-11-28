# Pass 119 — API-attested workflow provenance audit

Date: 2026-11-28

## Status

VERIFIED: source-level audit of Pass 118 collector and canonical Envelope v1 validator; CI evidence for the audited Pass 118 head is SUCCESS (28/28 Node tests plus Pool Contract Validation).
BLOCKED: workflow-file provenance binding requires correction before Controller → API Envelope → D1 composition.
No implementation remediation was performed in this pass.

## Frozen target and scope

- Audited implementation PR: #185.
- Audited branch: `feat/pass118-bounded-owner-next-envelope-collector-2026-11-28`.
- Audited implementation HEAD: `cbee39dcf5ee16f4ec491c535cd2f9c4cc4eda9e`.
- PR base: `feat/pass111-d1-attested-receipt-2026-11-27` at `453d74ff70a67d3091d920281f6471a721f1808d`.
- Source blob: `scripts/owner-next-api-envelope.mjs` = `9946881694fac6d57876d543103ee66af31a480b`.
- Canonical envelope validator source: `proofs/d1-ledger/src/owner-next-envelope.mjs` on Pass 111 branch; blob `9822f6feaed866a55fa830ba835fa493625f8677`.
- Scope: audit provenance relationships between event/target SHA, workflow commit SHA, workflow-file blob SHA and workflow-file ref SHA. No runtime changes.

## Reuse First

- REUSE the existing canonical Envelope v1 schema, digest function and D1 ledger; do not create a parallel schema or ledger.
- REUSE the fixed-origin GitHub API collector, response-size cap, timeout, API readbacks and blob hashing.
- No new dependency or service is justified.
- Required adaptation: retrieve workflow bytes at the commit identified by `GITHUB_WORKFLOW_SHA`; record the exact ref used; align validator and D1 receipt contract to that provenance.

## Finding F-119-01 — workflow-file ref is bound to target SHA instead of workflow commit SHA

Severity: HIGH / BLOCKING for provenance qualification.

In `collectOwnerNextEnvelope()`, the workflow contents API request uses `workflowRun.head_sha` (the event/target SHA). The returned blob is recorded as `workflowFileBlobSha`, and `workflowFileRefSha` is assigned `targetSha`. The independently supplied `GITHUB_WORKFLOW_SHA` is stored as `workflowCommitSha`, but it is not used as the contents API ref.

The D1 envelope validator additionally requires `workflowFileRefSha === run.headSha`, so the current contract cements target-ref binding rather than proving the workflow file bytes at the workflow commit.

Consequently, a valid Git blob digest proves the bytes returned by the target-ref contents endpoint, but does not establish that those bytes belong to the commit identified by `GITHUB_WORKFLOW_SHA`.

### Required remediation

1. Fetch `.github/workflows/next-event-controller.yml` using the immutable `GITHUB_WORKFLOW_SHA` value.
2. Verify the returned file path, encoding and Git blob SHA against the returned bytes.
3. Record `workflowFileRefSha` as the exact commit used for that API read and require it to equal `workflowCommitSha`.
4. Keep `target/head SHA`, `workflowCommitSha`, `workflowFileBlobSha` and `workflowFileRefSha` as separately validated fields; do not infer equality between target and workflow commit.
5. Update the canonical Envelope v1 validator, digest tuple and migration/receipt constraints in the existing D1 lineage only.
6. Add adversarial tests where target SHA and workflow SHA differ, and where workflow-file content differs between those refs. Assert that only the blob at the workflow commit is accepted.
7. Feed the collector's actual serialized output into the Workers verifier and local D1 attested adapter; do not construct a hand-authored envelope fixture for the positive integration path.
8. Preserve `dispatch:false` and `executionAuthorized:false` on success, denial, replay and indeterminate outcomes.

## Verification evidence

- PR #185: OPEN / DRAFT / UNMERGED; head `cbee39dcf5ee16f4ec491c535cd2f9c4cc4eda9e`.
- GitHub Actions run `46167867802`: COMPLETED / SUCCESS.
- Job `141049343699`: SUCCESS.
- Retrieved job log: Pool Contract Validation PASS; existing Envelope tests plus collector tests: 28 passed, 0 failed.
- Combined commit status contexts: empty. Named Actions run and job log are the positive CI evidence; no separate status context is claimed.
- PR #185 formal review: not established in this pass; independent security review NOT RUN.
- Static source readback VERIFIED. No local checkout/test execution in this session.
- GitHub Actions issue_comment docs confirm `GITHUB_SHA` is the last commit on the default branch. Workflow file commit identity is represented separately by `GITHUB_WORKFLOW_SHA`. References:
  - https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#issue_comment
  - https://docs.github.com/en/actions/reference/workflows-and-actions/contexts

## Actions taken

- Posted focused blocking audit finding to PR #185 discussion: https://github.com/VlDMlNSh/developer-cloud-pool/pull/185#issuecomment-7242656346
- No code, migration, workflow permission, governance or dispatch changes.
- No secrets/variables read, hosted D1 writes, provider calls, dispatch, executor launch, deployment, merge or production mutation.

## Metrics and residual blockers

- Active engineering time: NOT MEASURED. Tool/readback duration is not represented as labor hours.
- CI: 28/28 tests and Pool Contract Validation SUCCESS on Pass 118 head.
- Defects: one HIGH provenance binding defect identified; remediation not yet implemented.
- Independent review: NOT RUN.
- Controller → Envelope → D1 composition: NOT VERIFIED.
- Dispatch/worker execution: NOT RUN and prohibited.
- UI, persistent runtime, executor qualification, model routing/quota and independent Contour A acceptance remain outstanding.

## Next bounded step

Pass 120: remediate F-119-01 on a fresh branch from the re-read Pass 111 D1 lineage tip; update collector + canonical validator/digest + local Workers/D1 integration tests together. Run exact-head Pool Contract and D1 CI, inspect logs and preserve dispatch=false. Do not merge or enable dispatch.

Contour A: BLOCKED / NOT ACCEPTED.
Contour B: DEFERRED.

## Governance read-back (2026-11-28)

- Active repository ruleset ID `26550182`, name `Основной — verified`, enforcement `active`, exact include selector `refs/heads/Основной`.
- Rules: deletion denied; non-fast-forward denied; pull request required; review-thread resolution required; required approving review count is 0; CODEOWNERS review disabled; bypass actors empty; current user cannot bypass.
- Classic branch endpoint reports `protected=false`; this does not negate the independently read active repository ruleset. Keep these facts distinct.
- PR #185 formal review submissions: 0; review threads: 0. Its draft/unmerged status remains unchanged.
- No governance or ruleset mutation performed.
