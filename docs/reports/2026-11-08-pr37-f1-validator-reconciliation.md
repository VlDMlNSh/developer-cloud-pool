# 2026-11-08 — PR #37 F1 reusable workflow identity validation

Date: 2026-11-08  
Scope: Reconcile the F1 caller/callee identity validation on the latest PR #37 head and verify the correction with exact-head CI.  
Disposition: VALIDATOR DEFECT FIXED ON DRAFT BRANCH / EXACT-HEAD CI VERIFIED / RUNTIME IDENTITY NOT QUALIFIED / NOT MERGED.

## Immutable target

- Repository: `VlDMlNSh/developer-cloud-pool`.
- PR #37: `feat: reusable Pool Worker boundary`.
- Base branch: `Основной`, SHA `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- Earlier inspected head: `8d78604cb651607da5e26f3148fab79cb58619e1`.
- Current verified PR head: `1be8672c1be1a720b6c813dcafff5c020b6456ae`.
- PR remains OPEN / DRAFT / UNMERGED.

## Finding and correction

At head `8d78604cb651607da5e26f3148fab79cb58619e1`, the workflow YAML parsed successfully, but Pool Contract Validation failed because `scripts/validate-pool-contract.mjs` contained a malformed regular expression. The exact Node.js error was `SyntaxError: Invalid regular expression flags`, emitted before the validator could run its contract assertions.

The latest PR head `1be8672c1be1a720b6c813dcafff5c020b6456ae` replaces that malformed pattern with explicit string checks for the three step-scoped reusable workflow context mappings. The security test also uses explicit string assertions for the same mappings. This correction was present on GitHub when re-read; this pass did not write those changes.

Relevant blobs at verified head:
- Worker workflow: `04d63d815d2f7d15cfa80c932b614d559385ff0a`.
- Contract validator: `5bc08d827b0fcbbcc1c3a036fd0dd201bdacff35`.
- Security tests: `9667f4cab3d9312425e6818fc1e8bc8fb5b3419c`.

Worker still maps `job.workflow_repository`, `job.workflow_file_path`, and `job.workflow_sha` into the validation step's `env`, and checks caller/callee repository, file path and immutable SHA. Job-level env does not contain these CALLEE variables.

## Exact-head CI

Both runs are associated with exact head `1be8672c1be1a720b6c813dcafff5c020b6456ae`:
- Pool Contract Validation: run `42484039932` — COMPLETED / SUCCESS.
- Reusable Pool Worker Boundary Validation: run `42484039940` — COMPLETED / SUCCESS; job `128741929176`, all steps successful.

Links:
- https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42484039932
- https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42484039940
- https://github.com/VlDMlNSh/developer-cloud-pool/pull/37

## Limits / remaining F1 qualification

This proves the source-level mapping and static contract tests pass. It does NOT prove the GitHub-hosted runtime actually supplies the expected caller/callee context values for the real reusable-workflow invocation, nor does it establish that the final caller SHA comparison is satisfiable across the Supervisor/reusable Worker workflow boundary. A real non-privileged, no-provider, no-secret runtime probe is still required before F1 can be marked VERIFIED.

The initial failure was a validator syntax defect, not evidence of an exploitable context bypass. No secrets or credentials were read; no provider requests, Worker dispatch, remote D1, deployment or paid resources were used.

## Governance and overall status

- PR #37 remains OPEN / DRAFT / UNMERGED.
- Reviews remain authored by `maxkorolskiy88-ship-it`; independent reviewer approval is NOT VERIFIED.
- Legacy default-branch Supervisor remains unchanged.
- Dispatch remains fail-closed; no merge or enablement is authorized by these bounded tests.
- PR #29 F11 remains fixed in its draft branch, not production-qualified.
- F2/F3/F4/F5/F6/F7/F8/F9/F10 remain open or not qualified.

F1: STATIC CONTRACT FIX VERIFIED; RUNTIME IDENTITY NOT QUALIFIED.  
PR #37: OPEN / DRAFT / UNMERGED.  
Contour A: BLOCKED / NOT QUALIFIED / NOT ACCEPTED.  
Contour B: DEFERRED.  
Dispatch: KEEP DISABLED / FAIL-CLOSED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
