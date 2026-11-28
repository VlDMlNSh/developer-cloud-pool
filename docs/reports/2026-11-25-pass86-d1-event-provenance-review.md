# Pass 86 — D1 event-binder provenance and controller-wiring review

Date: 2026-11-25  
Status: VERIFIED (bounded source review) / BLOCKED (Contour A acceptance)

## Frozen target and scope

- Default HEAD: `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- PR #170 head: `40281787c208af2df916f10af1dba073061ff0d3`.
- PR #170 base: `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`; compare to current default: 41 ahead / 2 behind, merge base remains `8c38bb073146d1c71da3e90cbbb11b55eb34a1e9`.
- Scope: inspect the immutable event-context adapter, /next binder, migration 0017, local integration tests, D1 validation workflow and the Issue #96 admission contract. Confirm whether a trusted default-branch controller actually invokes this proof.
- No runtime/code/schema/workflow changes, no tests/CI triggered, no dispatch, secrets/variables, hosted D1, provider calls, deployment, merge or production mutation.

## Source findings

### 1. The event binder is a local pure adapter, not an authenticator

Reviewed blobs at PR #170 head:

- `src/github-actions-context.mjs` blob `574d289964b5d908395573b91c6f890305c94eeb`.
- `src/github-next-event.mjs` blob `31a254e28f42eee3a3add07ca5fae2c5a46cc8b57`.
- `migrations/0017_github_next_source_comment_receipts.sql` blob `2d226a23e94cdf7a767eed989b8ef0b8781c69fb`.
- `test/github-next-event.integration.test.ts` blob `e9c26f565c587bf9f8ab40bb6e7a33c9fd50fcd3`.
- `test/github-next-event.test.ts` blob `d9385e21ec4528d4091d3d1af9ce74c5d5398bd9`.

Positive controls:
- The binder checks exact `issue_comment.created`, repository numeric/name identity, owner numeric ID/login/OWNER association, Issue #96, non-PR conversation, exact `/next`, default ref, SHA syntax, expected workflow ref, positive run ID/attempt and decimal comment ID.
- It binds an immutable event digest and keeps both `dispatch:false` and `executionAuthorized:false`.
- Migration 0017 constrains the expected owner/repository/issue/event/body digest/profile, unique source-comment identity and append-only receipt rows. Its trigger binds the receipt to the canonical CODE admission/task/attempt/route/outbox/commit-receipt chain.
- Integration tests exercise exact replay, conflicting admission, changed run provenance, pre-commit failure, lost acknowledgement, partial readback, unavailable primary readback, incomplete outbox, and direct SQL guard behavior.
- D1 test tooling reuses pinned `@cloudflare/vitest-plugin@1.4.7`, `vitest@4.1.12`, and local Miniflare/workerd. No new OSS dependency was needed.

Limits / unresolved trust:
- `mapGitHubActionsContext` is a pure field mapper. It does not independently authenticate runner context or fetch the GitHub run/workflow/ref/event through an API.
- `bindGitHubNextEvent` validates `workflowSha` syntax only. It pins `workflowRef`, but does not verify the workflow-file bytes/digest, expected workflow SHA, ancestry or run metadata against GitHub.
- It validates event target SHA syntax and expected ref, but does not independently resolve the current default-branch HEAD or enforce a race policy.
- Run ID and attempt are syntax/positivity checked, not independently verified against GitHub Actions run records.
- The local D1 receipt constraints do not make the event authentic. They constrain stored fields after a caller supplies them; the local adapter/test fixture is not an issuer or trusted runtime boundary.
- The trusted clock is an injected callback. A production-grade trusted clock/authenticator is not supplied by this package.

### 2. Controller wiring is absent from the candidate and default branch

- PR #170 changed-file list contains the D1 proof workflow and the local `proofs/d1-ledger` package; it does not contain `.github/workflows/next-event-controller.yml`.
- Fetching `.github/workflows/next-event-controller.yml` from current default returned 404 / NOT FOUND.
- Fetching `.github/workflows/d1-ledger-proof-validation.yml` from current default also returned 404 / NOT FOUND; it exists only in the PR candidate.
- The local Worker entrypoint is deliberately inert and returns HTTP 404. No production Supervisor/Worker/default-branch workflow imports or invokes the binder.
- Therefore the source-comment admission receipt is currently a local synthetic proof, not a live owner /next control path.

### 3. Issue #96 acceptance contract is materially broader

Issue #96 requires trusted owner/event/API metadata, trusted default-branch workflow code, pinning default HEAD once as target SHA, source-comment ID idempotency, admission before child dispatch, ambiguous response reconciliation against controller/child runs, and exactly four bounded child jobs only through the controller after gates. It also requires adversarial cases including forged dispatch IDs, HMAC mismatch, partial dispatch and missing artifacts.

PR #170 does not implement the controller, independent GitHub API provenance verification, four-child dispatch/reconciliation, or artifact digest verification. No dispatch is authorized. This gap is intentional and fail-closed, but it means the current D1 work cannot be represented as a functioning control plane.

### 4. Replay/recovery design note

The receipt stores run ID and run attempt as immutable provenance, and the tests deliberately reject a rerun with changed run metadata for the same source comment. This is conservative against provenance substitution. Before controller wiring, the contract must explicitly distinguish:
- exact duplicate delivery of the same run attempt;
- a GitHub workflow rerun with a new attempt;
- a separate controller run for the same source comment after an ambiguous receipt/acknowledgement outcome.

The controller must recover the original admission/receipt/run evidence by source-comment idempotency key and GitHub run metadata; it must not overwrite the first immutable receipt or silently treat a new run as the original. Current helper behavior is not sufficient evidence of that end-to-end recovery protocol.

## CI, reviews and ancestry

- PR #170 remains OPEN / DRAFT / UNMERGED.
- Exact head `40281787...`: combined statuses empty; formal reviews 0; review threads 0.
- Historical D1/Pool Contract run results cited in prior PR comments (including 113/113 D1 tests) are not current-base qualification; they used an older base and are not a current exact merge-result run.
- Current default HEAD remains `565404f84b6b86afb4dc2d8fa939341f42df6eca`.
- No merge-result CI or independent review was run in this pass.

## Actions and verification

- Re-read Pass 85 Context Window/report/checkpoint.
- Read PR #170 changed-file inventory and immutable source blobs at its head.
- Read Issue #96 admission contract.
- Checked current default for controller and D1 workflow paths; both are absent.
- Rechecked PR #170 exact-head combined status and review/thread counts.
- Tests newly run: 0. CI triggered: 0.
- Gemini Agents 1/2/3: NOT RUN — no controller dispatch and no authorization.
- Claude Code / ECC / FCC: NOT RUN — no verified host/session route or approved execution task.

## Metrics and risk

- Code/runtime changes: 0.
- Documentation files in this pass: report, checkpoint and Context Window.
- New tests: 0; test execution NOT RUN.
- Current exact-head CI: NOT VERIFIED (empty status set).
- Independent reviews: 0.
- Active engineering time: NOT MEASURED; no elapsed hours inferred.
- New defects introduced: 0 known (documentation-only).
- Principal blocker: the proof has no trusted default-branch controller and no independent GitHub provenance verification. Governance/CI and executor/UI/quota/state acceptance gates remain open.

## Next bounded step

Create a controller-to-Issue-#96 traceability matrix and a precise trust-boundary design for run/workflow/ref verification and rerun recovery. Keep the candidate local and dispatch-disabled until the design is independently reviewed, current-base CI is green, governance is authorized, and all owner-specified gates pass. Do not merge or dispatch.

Contour A: BLOCKED / NOT ACCEPTED.  
Contour B: DEFERRED.

## Evidence

- Default HEAD: https://github.com/VlDMlNSh/developer-cloud-pool/commit/565404f84b6b86afb4dc2d8fa939341f42df6eca
- PR #170: https://github.com/VlDMlNSh/developer-cloud-pool/pull/170
- Issue #96: https://github.com/VlDMlNSh/developer-cloud-pool/issues/96
- Pass 85 report: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/engineering-excellence-2026-11-23/docs/reports/2026-11-25-pass85-pr-ancestry-and-governance-gate.md
- Context Window: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/engineering-excellence-2026-11-23/docs/context/GITHUB-CONTEXT-WINDOW.md
- MediaHub canonical map (deferred): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
