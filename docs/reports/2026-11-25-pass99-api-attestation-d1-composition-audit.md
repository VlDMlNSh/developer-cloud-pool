# Pass 99 — API attestation to D1 composition audit

Date: 2026-11-25

## Status

**VERIFIED** for the bounded source/contract audit.
**NOT VERIFIED** for same-run immutable envelope composition, workflow-code attestation, runtime admission, dispatch, independent security review and acceptance.
Contour A remains **BLOCKED / NOT ACCEPTED**. Contour B remains **DEFERRED**.

## Frozen target and scope

- Default branch: `Основной`
- Frozen default SHA: `565404f84b6b86afb4dc2d8fa939341f42df6eca`
- Candidate PR: [#176](https://github.com/VlDMlNSh/developer-cloud-pool/pull/176)
- Audited PR #176 head: `2e76f82572bc6df8de2b0548200ebc285ad7537a`
- D1 candidate PR #175 head: `3d69bc943677dba909792bf4930d4c0aa5d2233f`
- API-audit PR #174 head: `a8809c1dc8c2eaa49944fb031baeec54ce46b922`
- Scope: inspect controller workflow/verifier/tests, D1 binder/context adapter/migrations/tests, Issue #96 contract and exact refs. No runtime code change, no dispatch, no D1 deployment or writes.

## Reuse First

- **REUSE:** PR #176 Node built-in verifier and adversarial tests.
- **REUSE:** PR #175 D1 binder, migration 0017, Workers/Vitest tests and locked dependency set.
- **REUSE:** GitHub REST API read-back and GitHub Actions trusted runner context.
- **BUILD (next implementation):** a single typed immutable API-attested envelope adapter. No external dependency is justified.
- No packages, secrets, services, provider credentials or paid infrastructure used.

## Findings

### 1. The controller performs useful API read-back, but returns an incomplete observation

PR #176 `scripts/owner-next-event-audit.mjs` re-reads repository, issue #96, source comment, current workflow run, workflow metadata and default-branch ref. It verifies exact `/next`, owner identity/association, repository IDs, issue-vs-PR comment, run ID/attempt, event/path, actor, default branch and current target SHA.

However, the successful result contains only:
- source repository/owner/issue/comment IDs;
- target SHA;
- workflow ID/path;
- run ID/attempt.

It does **not** emit a complete canonical envelope with the event name/action, actor identity/association, exact body digest, default ref, run repository/actor/head branch, workflow ref, workflow-code SHA, API observation version/timestamp, or a canonical envelope digest. The verifier reads workflow metadata by ID but does not read back and bind the workflow file contents/blob identity.

### 2. D1 still trusts a flat Actions-context adapter

PR #175 `mapGitHubActionsContext(github, env)` maps the runner's `github` context and process environment into ordinary fields. `bindGitHubNextEvent(context)` validates those fields and hashes a selected canonical tuple, but does not consume an API-attested envelope or verify its provenance.

The D1 test suite proves the pure binder and receipt logic against constructed fixtures. It does not prove that the API verifier's output is the input to the D1 binder in the same workflow run.

### 3. No composition callsite exists

PR #176's workflow invokes only `node scripts/owner-next-event-audit.mjs`. It does not call the D1 Worker/binder, create an admission, or persist a D1 receipt. PR #175's D1 workflow is a separate pull-request test workflow. Therefore there is no same-run dataflow from API read-back to D1.

### 4. Important workflow-code identity gap

The verifier checks workflow metadata ID/path/state and the run path suffix, but does not fetch the canonical workflow file at the expected immutable ref and verify its content/blob SHA. The D1 binder expects `workflowRef` and `workflowSha` as input fields, but those fields currently originate from the flat Actions context adapter. This is not yet independent API attestation of the workflow code.

### 5. Existing safeguards remain useful but are not end-to-end proof

- D1 migration 0017 defines unique source-comment receipts and append-only guards.
- D1 tests cover exact replay, conflicting replay, commit ambiguity, partial read-back, forged receipt insertion and admission-chain integrity.
- Dispatch/execution remain false in D1 binder results.
- These tests do not close the missing API-envelope-to-D1 composition edge.

## Required Pass 100 implementation contract

1. In the canonical controller run, create one immutable envelope only from the successful API read-backs; never accept an envelope supplied by comment text, workflow input, repository variable or artifact from another run.
2. Include repository/owner IDs, issue/PR classification, comment ID/body digest/author/association, event type/action, run ID/attempt/repository/actor/ref/head SHA, default ref and target SHA, workflow ID/path/ref and workflow code identity.
3. Re-read default branch immediately before D1 admission; reject if it moved from the envelope's target SHA.
4. Verify the workflow file identity through GitHub API read-back at an immutable ref; compare the returned blob/content identity to the expected workflow source identity. Do not confuse commit SHA, workflow SHA and blob SHA.
5. Pass the exact envelope object to a narrow D1 adapter; remove the flat-context-only trust path for owner /next admission.
6. Canonicalize and hash the entire security-relevant envelope; persist the same digest in admission and source-comment receipt.
7. Keep source-comment idempotency, durable receipt-before-any-dispatch, reconciliation and rerun-deny semantics.
8. Keep `dispatch=false` and `executionAuthorized=false`; no child dispatch in this pass.
9. Add integration tests that compose API response fixtures -> envelope -> D1 binder -> durable receipt, including tampered API responses, mismatched workflow blob, stale default SHA, duplicate comment, rerun, missing fields, and partial/lost D1 acknowledgements.
10. Exact-head D1 and Pool Contract CI, merge-result CI, governance checks and independent security review must pass before any enablement.

## Current live state

- PR #176: OPEN / DRAFT / UNMERGED; audited head `2e76f82572bc6df8de2b0548200ebc285ad7537a`.
- PR #174 and #175: OPEN / DRAFT / UNMERGED.
- PR #176 Pool Contract Validation run `45694558420` (earlier Pass 98 documentation head): PENDING at audit time.
- After Pass 99 documentation updates, current PR tip is `8fdf5243379c0a793e10c93c15f8a796a784c276`; latest Pool Contract Validation run `45695110282` is PENDING. Combined status contexts are empty. Previous code-head run `45694389681` on `4c0b2a44fc53fd36ac1d65175a9651c016f59219` completed SUCCESS; later commits are documentation-only.
- PR #176 formal reviews: 0; inline threads: 0; GitHub reports mergeable=true / mergeable_state=clean (this is not a review or CI gate).
- Default branch workflow inventory has five files; canonical controller exists only in PR #176 candidate, not default.
- Ruleset `26550182` active, PR required, 0 required approvals, review-thread resolution required.
- Legacy `pool-worker.yml` is retired/fail-closed; `pool-supervisor.yml` is heartbeat-only. No qualified executor is active.
- Issue #96 remains PLANNED; its dispatch gates are not met.

## Non-actions and evidence boundary

No local test execution in this pass. No D1 writes/deployment, workflow dispatch, child execution, provider calls, secret reads, paid fallback, merge or production writes. Gemini/Claude/ECC/FCC NOT RUN. Independent security review NOT RUN. Active engineering time NOT MEASURED.

## Next step

Pass 100: implement the same-run immutable API-attested envelope and D1 composition contract in a new candidate commit, with dispatch disabled and end-to-end mocked integration tests. Keep PR Draft pending exact-head/merge-result CI and independent review.
