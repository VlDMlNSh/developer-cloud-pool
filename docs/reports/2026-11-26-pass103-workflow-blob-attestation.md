# Pass 103 — immutable workflow-file blob attestation

Date: 2026-11-26

## Status

- **VERIFIED:** controller reads the workflow file through GitHub Contents API at the exact Actions run `head_sha`, validates path, Git blob SHA shape and ref binding, and returns the file SHA in its audit-only result.
- **VERIFIED:** PR merge-result CI succeeded on merge result `0a6b7130c75978290c841488239a0d93b2028e8c`; pool contract passed and all 25 owner-event verifier tests passed.
- **NOT VERIFIED:** live `issue_comment` run, same-run immutable envelope passed into D1 admission/receipt, hosted D1, runtime authenticator/clock, executor and Web Console.
- **BLOCKED / NOT ACCEPTED:** Contour A. **DEFERRED:** Contour B.

## Frozen target and scope

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Canonical default branch: `Основной` @ `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- Candidate base: PR #176 prior head `ca53ed9eb625d2532aa00cc269cf7f8617d97266`.
- Candidate head after this pass: `ac75ba08aa7660b0bed2bba1b04daefa2cc31c5d`.
- Scope limited to `scripts/owner-next-event-audit.mjs` and its tests. No D1 adapter, migration, workflow permissions or dispatch behavior changed.

## Change

The verifier now fetches:

`GET /repos/{owner}/{repo}/contents/.github/workflows/next-event-controller.yml?ref={workflowRun.head_sha}`

It requires:
- returned file path equals the canonical controller path;
- returned Git blob SHA is a 40-character lowercase hexadecimal identifier;
- file lookup ref SHA equals the workflow run's immutable `head_sha`.

The audit-only result includes `workflow.fileSha` and `workflow.fileRefSha`; the step summary records the same provenance. The API call uses the existing read-only `GITHUB_TOKEN` and existing `contents: read` permission. No new dependency or credential scope was introduced.

The unit suite adds rejection cases for absent file metadata, blob substitution across refs, malformed blob SHA and path substitution. Existing event, actor, issue, run, branch, replay and stale-SHA rejection cases remain.

## Evidence

- PR #176: https://github.com/VlDMlNSh/developer-cloud-pool/pull/176
- Candidate head: `ac75ba08aa7660b0bed2bba1b04daefa2cc31c5d`
- Merge-result checkout: `0a6b7130c75978290c841488239a0d93b2028e8c`
- Pool Contract run: [45877919733](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45877919733)
- Job: [140109610824](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/45877919733/job/140109610824) — SUCCESS.
- Contract validator: `POOL_CONTRACT_VALIDATION=PASS`; all six workflow YAML files parsed; Actions log reports `POOL_DISPATCH_ENABLED=false`.
- Node test output: 25 tests, 25 passed, 0 failed. Four new tests cover workflow-file identity.
- CI is PR merge-result validation, not standalone exact-head CI. Formal reviews: 0; inline review threads: 0.

## Reuse First

- REUSE existing Node built-in `fetch`, GitHub REST API and current verifier/test harness.
- REUSE existing least-privilege `contents: read` workflow permission.
- No new package, action, external service or dependency.

## Remaining security boundary

This pass attests the workflow file blob at the Actions run SHA; it does not yet pass a typed, immutable envelope into the D1 admission and source-comment receipt transaction. The verifier still returns `OBSERVED_ONLY`; admission remains NOT_CREATED and dispatch remains NOT_AUTHORIZED. A file SHA in a summary is provenance evidence, not D1 admission authority.

No live issue_comment event was generated. No hosted D1 writes, executor dispatch, provider/model calls, secret/token values, repository variables, governance changes, deployment, merge or production writes occurred. Gemini/Claude/ECC/FCC and independent security review: NOT RUN. Local tests newly run by this assistant: NOT RUN; tests were run by GitHub Actions CI. Active engineering time: NOT MEASURED.

## Next bounded pass — Pass 104

Compose the API read-back result and workflow blob identity into a schema-validated immutable envelope in the same controller execution. Pass that exact envelope to the D1 adapter and bind its canonical digest to the durable source-comment receipt. Add tests for field substitution, envelope serialization/canonicalization, stale default-ref races, replay/rerun and ambiguous D1 acknowledgement. Keep dispatch and execution authorization false.

## Canonical links

- Context Window (candidate branch): https://github.com/VlDMlNSh/developer-cloud-pool/blob/feat/pass98-canonical-next-controller-audit-2026-11-25/docs/context/GITHUB-CONTEXT-WINDOW.md
- Issue #96: https://github.com/VlDMlNSh/developer-cloud-pool/issues/96
- Issue #140: https://github.com/VlDMlNSh/developer-cloud-pool/issues/140
- PR #175 D1 candidate: https://github.com/VlDMlNSh/developer-cloud-pool/pull/175
- PR #176 controller candidate: https://github.com/VlDMlNSh/developer-cloud-pool/pull/176
- MediaHub map (deferred): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
