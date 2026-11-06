# Engineering report — 2026-11-06 — integrated pool authorization branch audit

## Scope and immutable baseline
- Repository: VlDMlNSh/developer-cloud-pool
- Default branch: `Основной` @ `197ba98d0dc7d8437d759dd25bee8750d02e59ae` (observed from prior current-branch reads and commit search).
- Audit target: `fix/integrated-pool-authorization-2026-11-06`.
- Compare result: branch is 6 commits ahead, 0 behind default; merge base equals default HEAD `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- No PR was observed for this branch in the current open-PR search. Branch head SHA and exact-head CI were not independently retrieved in this pass; do not infer CI status.

## Files read back
- `.github/workflows/pool-authorization-contract-validation.yml`, blob `1b28da32b315f3c077c22bdfaa6478aef2d36490`.
- `src/pool/authorization-decision.mjs`, blob `a6238f64b826de80af2f17d64fb30c2837c746a8`.
- `tests/security/pool-authorization-contract.test.mjs`, blob `6bf7cf9583766fb57972a0b82ec27cc2b6e90eeb`.
- `tests/security/pool-authorization-decision.test.mjs`, blob `9811eed0c75f24e79bdf4f4627a0dfe7968117c2`.
- Default production files:
  - `.github/workflows/pool-worker.yml`, blob `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`.
  - `.github/workflows/pool-supervisor.yml`, blob `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`.
  - `scripts/pool-supervisor.mjs`, blob `52bf03ca889edd92fd10c71ae96a2e35e106d43f`.

## Findings
1. The new branch adds a pure authorization decision function and negative-first tests. The decision function allows only a matching first durable consume receipt; replay, denied, missing or ambiguous consume outcomes fail closed.
2. The new static contract tests read the existing production Worker/Supervisor source files and assert:
   - Worker is reusable-workflow-only (no `workflow_dispatch`).
   - Worker has no `issues: write` permission or issue mutation implementation.
   - Supervisor has no privileged `workflow_run` trigger or `actions: write`.
   - Supervisor calls Worker through a statically declared reusable workflow, not REST workflow dispatch.
   - Expired/failed claims are not requeued using the same approval.
   - Caller/callee workflow identities are checked using distinct GitHub contexts.
3. Read-back of the current default production files shows these assertions are not yet satisfied: Worker still declares `workflow_dispatch`; its report job has `issues: write` and PATCH/POST issue mutation; Supervisor still declares `workflow_run`, has `actions: write`, and invokes REST workflow dispatch.
4. The candidate branch compare lists only four added files (validation workflow, decision module, and two test files). It does not change the production Worker workflow, Supervisor workflow, or supervisor script. Therefore it is a test/decision-model proposal, not an integrated production remediation. Its contract tests are expected to fail against the current default production source when run as a PR to default; this is a source-based inference, not an observed CI result.
5. The validation workflow is pull_request-targeted to `Основной` and path-filtered to the newly added test/module/workflow paths. Exact-head run evidence was not retrieved; CI remains NOT VERIFIED.
6. No PR, independent review, merge, dispatch, worker run, provider call, secret read, or deployment was performed.

## Required next implementation boundary
- Do not merge this branch as a completed fix.
- Extend the same coherent change to the production caller/callee boundary: replace Worker direct dispatch with reusable `workflow_call`; remove Worker issue-write/report mutation; remove Supervisor privileged `workflow_run` and Actions-write REST-dispatch path; wire a static reusable Worker call with identity checks; implement durable single-use approval consumption and fail-closed recovery in the actual supervisor path.
- Keep the approval/consume operation in an independently reviewed durable store or approved atomic primitive; the pure decision function alone is not a consume operation.
- Add exact-head tests covering production source and the real caller workflow; then obtain exact-head CI and independent security review. Re-read current governance and dispatch variable before any execution.
- Do not enable dispatch while these changes are pending.

## Status
- Authorization design function: IMPLEMENTED ON BRANCH / NOT INTEGRATED.
- Production authorization remediation: NOT IMPLEMENTED.
- Candidate branch CI: NOT VERIFIED.
- Independent review: NOT RUN.
- Worker/Supervisor execution: NOT RUN.
- Dispatch: BLOCKED / FAIL-CLOSED.
- Contour A: BLOCKED / NOT QUALIFIED / NOT ACCEPTED.
- Contour B: DEFERRED.

Canonical shared context: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/github-context-window-2026-11-06/docs/context/GITHUB-CONTEXT-WINDOW.md
Continuation checkpoint: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/github-context-window-2026-11-06/docs/checkpoints/2026-11-06-cloud-pool-next-checkpoint.md
Canonical MediaHub map (reference only): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
