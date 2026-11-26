# Pass 104 — Controller-to-D1 composition boundary audit

Date: 2026-11-26

## Status

- **VERIFIED (source-level):** PR #176 performs GitHub API read-back for repository, Issue #96, source comment, Actions run, workflow metadata, default-branch ref and workflow-file blob at the run SHA.
- **VERIFIED (source-level):** PR #175 contains a D1 binder, durable source-comment receipt path and local Workers/D1 integration tests, but the binder consumes a flat Actions-context object and independently derives its event digest.
- **BLOCKED / NOT VERIFIED:** no same-run callsite or workflow step passes the API verifier's validated result into the D1 binder/admission/receipt path. The controller workflow only runs the audit script and writes a step summary. The D1 workflow is a separate pull_request-only local proof workflow.
- **NOT RUN:** live issue_comment qualification, hosted D1, executor dispatch, provider calls, independent security review.
- **Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.**

## Frozen refs and scope

- Canonical default branch: `Основной` @ `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- PR #176 branch: `feat/pass98-canonical-next-controller-audit-2026-11-25`, head observed `25fb6b19997b7818c124b546072430ddbcfce6d4`.
- PR #175 branch: `integration/pass92-d1-clean-base-565404f`, head `3d69bc943677dba909792bf4930d4c0aa5d2233f`.
- Scope: read-only audit of controller workflow/verifier and D1 binder/context adapter/integration tests. No runtime code or authority changed.

## Evidence and findings

1. PR #176 workflow `.github/workflows/next-event-controller.yml` has read-only `contents/issues/actions` permissions. Its only runtime step executes `node scripts/owner-next-event-audit.mjs`; there is no D1 binding, package install, D1 adapter import, admission call, or durable receipt call.
2. `verifyOwnerNextEvent` returns `OBSERVED_ONLY`, `admission: NOT_CREATED`, `dispatch: NOT_AUTHORIZED`. Main writes the result to `GITHUB_STEP_SUMMARY`; it does not serialize a validated envelope for a consumer.
3. PR #175 `bindGitHubNextEvent(context)` accepts a flat object from `mapGitHubActionsContext(github, env)`, then constructs a separate digest from a fixed tuple. Its inputs do not include the API verifier result, returned workflow file blob SHA, or an explicit API-attestation object.
4. `admitGitHubNextEvent` validates the bound D1 event against the approval envelope and persists/read-backs a source-comment receipt. This local D1 integration suite is useful, but its fixtures call the binder directly; it does not exercise PR #176 API read-back -> D1 binder -> receipt as one call graph.
5. PR #176's workflow file blob attestation is a useful provenance field, but merely putting the blob SHA in a step summary does not authenticate a downstream D1 input. A file/output boundary must be treated as untrusted and revalidated by the D1 adapter.
6. The API verifier and D1 binder currently use different source contracts. A correct integration must define one versioned schema and canonical byte encoding, carry repository/owner/issue/comment/actor/action/run ID+attempt/target SHA/workflow path+blob SHA+ref SHA, and make the D1 adapter recompute and validate the digest before admission. It must reject absent fields, duplicate/unknown fields or schema versions, stale default-ref observations, changed comment/run provenance, serialization ambiguity, replay conflicts and ambiguous D1 acknowledgements.
7. The current PR #176 candidate head is still Draft/unmerged. Formal reviews: 0; review threads: 0. PR #175 remains Draft/unmerged. CI associated with current PR #176 head includes Pool Contract Validation run 45878070090 SUCCESS; this observation alone does not establish standalone exact-head CI or cross-PR composition. Earlier candidate merge-result run 45877919733 succeeded with 25/25 verifier tests, but was on merge result `0a6b7130c75978290c841488239a0d93b2028e8c`, not the current PR tip.

## Reuse First

- REUSE the existing Node built-in fetch/crypto/test approach and GitHub REST read-back from PR #176.
- REUSE the canonical D1 ledger, migration 0017 source-comment receipt and local Workers/Vitest harness from PR #175.
- ADAPT the API verifier output into a versioned typed envelope, with the D1 adapter as the final validation authority.
- BUILD no second ledger, second controller or new external service. No new dependency is justified at this audit stage.

## Safety and non-actions

No hosted D1, live issue_comment event, secrets or secret values, repository variables, provider calls, dispatch, deployment, merge, production writes or governance changes. Dispatch and execution authorization remain false. Gemini/Claude/ECC/FCC: NOT RUN. Independent security review: NOT RUN. Active engineering time: NOT MEASURED.

## Next bounded implementation pass

Create one clean-base integration candidate containing the controller verifier and canonical D1 package in a single branch. Define a versioned API-attested envelope and deterministic canonicalization helper. The controller must construct it only after all API read-backs pass; the D1 binder must independently validate schema, provenance and digest and reject caller-supplied flat context as authority. Add a single end-to-end mocked Workers-runtime test that runs API verifier -> envelope serialization -> D1 validation -> atomic admission/source-comment receipt, plus field substitution, serialization, stale-ref, replay/rerun, and ambiguous-ack negative cases. Keep all paths non-dispatching. Do not merge or enable dispatch.

## Links

- PR #175 D1 proof: https://github.com/VlDMlNSh/developer-cloud-pool/pull/175
- PR #176 controller: https://github.com/VlDMlNSh/developer-cloud-pool/pull/176
- Issue #96: https://github.com/VlDMlNSh/developer-cloud-pool/issues/96
- Issue #140: https://github.com/VlDMlNSh/developer-cloud-pool/issues/140
- Context Window (candidate branch): https://github.com/VlDMlNSh/developer-cloud-pool/blob/feat/pass98-canonical-next-controller-audit-2026-11-25/docs/context/GITHUB-CONTEXT-WINDOW.md
- MediaHub map (deferred): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## Final ref/CI recheck

- After documentation commits, PR #176 head is `ea4c9c54be1e8d7cf3ae5c0c7e281e2998a61b6c`, 32 commits ahead / 0 behind the frozen default base. The final diff contains 16 files: existing controller/verifier, tests, validation workflow, prior reports/checkpoints, and this Pass104 report/checkpoint/context update; no D1 runtime files are present in PR #176.
- Pool Contract Validation run `45878657129` was IN_PROGRESS at final observation on this final head. Do not mark final-tip CI PASS until it completes. The earlier run `45878070090` SUCCESS checked out PR #176 merge result `162ba8c326357f4ef5a45dab4c54b1620fd4eb05`, combining pre-Pass104-doc head `25fb6b19997b7818c124b546072430ddbcfce6d4` with default base.
- The 45878070090 job log confirms `POOL_CONTRACT_VALIDATION=PASS`, all six workflow YAML files parsed, dispatch gate `false`, and 25/25 owner-event verifier tests passed. This is merge-result evidence for the earlier tip, not final-tip evidence.
