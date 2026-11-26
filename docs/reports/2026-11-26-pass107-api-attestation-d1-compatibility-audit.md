# Pass 107 — API-attestation to D1 ledger compatibility audit

Date: 2026-11-26

## Status

- **VERIFIED (source audit):** PR #175 D1 binder, migration 0017 and integration tests were read at their current published branch head; PR #176 controller verifier/workflow and PR #177 envelope validator were also read back.
- **BLOCKED (composition):** the three components are not yet composable. The API verifier is audit-only and does not emit an envelope; the D1 binder accepts a flat Actions context and computes a different digest; migration 0017 has no columns for the API-attested fields.
- No runtime code, SQL migration, workflow, permissions, secrets, provider or dispatch changes in this pass.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

## Frozen refs and governance

- Integration base/default SHA observed: `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- PR #175 D1 head: `3d69bc943677dba909792bf4930d4c0aa5d2233f`, base 565404f; 40 commits ahead / 0 behind. Draft, 0 reviews, 0 threads.
- PR #176 controller head: `f06155b8ac121a4af90cbc2356f12b965d0fbde9`, base 565404f; 38 commits ahead / 0 behind. Draft, 0 reviews, 0 threads.
- PR #177 envelope branch head before this report: `cdefc13eca8d7c71fec7447e1a73aa95bdc92411`, base 565404f; Draft.
- PR #175 CI evidence: D1 run `45690428935` and Pool Contract run `45690428805`, both SUCCESS on their recorded prior merge-result evidence. They are not proof for a composed PR.
- PR #176 Pool Contract run `45878779775` SUCCESS on a previous merge-result. No D1 composition.
- PR #177 latest available envelope test run `45879712743` SUCCESS, 20/20 tests, on merge-result corresponding to code/workflow tip `535e4fac6418209e13b33801308fdc42b95cbabc`; later docs-only commits advance branch HEAD. Not exact-head CI.
- No formal reviews on PRs #175/#176. No merge. Current default HEAD was not independently queried through a branch-ref API in this pass; 565404f is the common base recorded by all three PRs and remains the frozen integration base, not a fresh HEAD claim.

## Source-level findings

### 1. Controller API verifier (PR #176)

- `scripts/owner-next-event-audit.mjs` performs independent read-only GitHub API readbacks for repository, issue #96, source comment, workflow run, workflow metadata, default branch ref and workflow file Contents API.
- It verifies the Contents API Git blob SHA and binds the blob's `refSha` to the workflow run head SHA.
- Successful result is `OBSERVED_ONLY`, `admission: NOT_CREATED`, `dispatch: NOT_AUTHORIZED`.
- The workflow `.github/workflows/next-event-controller.yml` only runs this audit and writes a step summary. It does not serialize a v1 envelope, invoke the D1 package, create admission, or write a durable receipt.

### 2. D1 binder and receipt (PR #175)

- `proofs/d1-ledger/src/github-next-event.mjs` accepts a flat context object and independently validates GitHub Actions context fields.
- It computes its own SHA-256 digest over a 15-element legacy tuple: source comment ID, repository/owner/issue, event/actor, author association, body digest, ref, target SHA, workflow ref, workflow SHA and profile.
- This digest is not the v1 envelope digest. It excludes schema/version, issue/comment GraphQL node IDs, observed default HEAD as a distinct field, workflow ID/path/state, workflow-file blob SHA and workflow-file ref SHA.
- The D1 binder currently does not accept or validate a verifier result or an envelope object. It returns BOUND based on runner context only.
- The existing approval linkage requires `approval.envelopeDigest === bound.context.eventDigest`; changing the digest definition requires a coordinated approval and receipt migration, not a second digest field that silently disagrees.
- The D1 binder already uses WebCrypto `crypto.subtle.digest("SHA-256", ...)`, so a D1-side canonical digest implementation can reuse the Workers-native API. No Node crypto dependency should be introduced into the Workers package.

### 3. D1 migration 0017

- Existing receipt has `workflow_sha`, populated from `github.workflow_sha`. Treat this as the workflow source commit SHA.
- It does not store the Contents API workflow-file Git blob SHA. Do not repurpose `workflow_sha` to mean blob SHA.
- Missing API-attested fields include schema/version, issue node ID, comment node ID, observed default-branch SHA as a separately named value, workflow ID/path/state, workflow commit SHA (explicit name), workflow-file blob SHA and workflow-file ref SHA.
- SQL triggers bind the receipt to canonical admission/approval/task/attempt/route/outbox/commit receipt, but SQL does not recompute SHA-256. Cryptographic canonicalization must happen in the D1 adapter before the INSERT; SQL constraints then bind the resulting digest and provenance columns to the durable row.

## Required integration design (no implementation in Pass 107)

1. Controller verifier returns a versioned, bounded attestation object only after all current API readbacks pass. No admission or dispatch authority is returned.
2. Serialize it in the same controller run. Workflow outputs/artifacts/files are untrusted transport, not proof; the D1 adapter parses strictly, rejects duplicate JSON keys at the raw-text boundary, validates exact keys/types/identities and recomputes the v1 digest.
3. Keep runner context and API attestation distinct. D1 must cross-check run ID/attempt, event, ref, run head SHA, workflow commit SHA, workflow path and repository identity against trusted runner context.
4. Add migration 0018 to the existing ledger only. Preserve old `workflow_sha` semantics or add an explicitly named `workflow_commit_sha`; add `workflow_file_blob_sha` and `workflow_file_ref_sha` separately. Add node IDs, observed default head SHA, schema/version, workflow ID/path/state. Keep all source IDs as TEXT to avoid JavaScript integer precision loss.
5. Make the v1 envelope digest the single source digest used for D1 admission approval linkage and durable receipt. D1 independently recomputes it; never accept a caller-provided digest as authoritative.
6. Extend receipt insert, primary readback, replay matching and SQL binding triggers to every new immutable field. Preserve append-only behavior, source-comment uniqueness and dispatch=false.
7. Add a single mocked Workers-runtime end-to-end test: API verifier result → strict serialization/parser → D1 adapter validation → existing admission → durable receipt → primary readback/exact replay. Negative cases: duplicate JSON keys, unknown fields, node ID substitution, workflow blob substitution, stale default ref, run mismatch, digest substitution, conflicting replay, ambiguous write and primary readback failure.

## Reuse First

- Reuse PR #176's API readbacks and Contents API blob attestation.
- Reuse PR #175's single D1 ledger, approval/task/attempt/route/outbox/commit receipt, primary-first readback, Workers Vitest harness and WebCrypto implementation.
- No second ledger, no new service, no dependency, no provider, no hosted D1.

## Validation and non-actions

- Read-back source inspection only; no tests were run in this audit.
- No hosted D1, live issue_comment execution, secret/variable value inspection, provider calls, worker dispatch, deployment, merge or production writes.
- Gemini/Claude/ECC/FCC: NOT RUN. Independent security review: NOT RUN. Active engineering time: NOT MEASURED.
- No claim of live webhook authenticity or production behavior.

## Next bounded pass

Create one clean integration branch from the frozen common base, port the D1 package and envelope validator without parallel ledgers, implement migration 0018 plus D1-side strict validation, and add negative-first Workers integration tests. Keep controller dispatch disabled. Do not merge PR #175/#176/#177 separately as a substitute for composition.

## Links

- PR #175 D1: https://github.com/VlDMlNSh/developer-cloud-pool/pull/175
- PR #176 controller: https://github.com/VlDMlNSh/developer-cloud-pool/pull/176
- PR #177 envelope: https://github.com/VlDMlNSh/developer-cloud-pool/pull/177
- Envelope v1 contract: `docs/contracts/2026-11-26-owner-next-api-attested-envelope-v1.md`
- MediaHub map (Contour B deferred): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## Final Pass 107 branch read-back

- Pass 107 docs/checkpoint/Context Window were read back successfully. Final working branch HEAD after documentation updates: `d0595e58c6acab976238c7fe365cdab29adc4739`; compare to frozen base `565404f84b6b86afb4dc2d8fa939341f42df6eca`: 26 ahead / 0 behind; 11 changed files total.
- PR #177 remains OPEN/DRAFT/UNMERGED. The PR listing returned `mergeable=false`; reason/state was not exposed by the available read, so treat mergeability as NOT VERIFIED and do not merge. Reviews 0, threads 0.
- No Actions run or combined status was returned for final documentation HEAD `d0595e58...`; exact-head CI NOT VERIFIED. Previous merge-result run `45879712743` remains limited to 20/20 envelope tests on earlier code/workflow tip `535e4fac...`.
