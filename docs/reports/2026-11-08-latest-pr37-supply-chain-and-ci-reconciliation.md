# 2026-11-08 — latest PR #37 supply-chain finding and exact-head CI reconciliation

Date: 2026-11-08 (Europe/Vilnius)  
Scope: Reconcile PR #37's latest discussion update, immutable head, review identity, and exact-head CI for PRs #36/#37/#39.  
Disposition: STATIC REVIEW / NOT INDEPENDENT / NOT QUALIFIED.

## Live pull request state

- PR #36: OPEN / DRAFT / UNMERGED; head `e11fc90e50bd20b166207af64551c49cfa80ffb4`; updated 2026-11-08T11:58:04Z.
- PR #37: OPEN / DRAFT / UNMERGED; head `5587a4e013507b5be330fd0c49ce1fc836faa946`; updated 2026-11-08T12:13:04Z.
- PR #39: OPEN / DRAFT / UNMERGED; head `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`; updated 2026-11-08T11:58:05Z.
- Base/default branch `Основной`; previously re-read HEAD `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.

## Exact-head CI reconciliation

- PR #36: run `42329438308` Pool Contract Validation — COMPLETED / SUCCESS; run `42329438351` Isolated D1 Ledger Proof — COMPLETED / SUCCESS.
- PR #37: run `42284051311` Pool Contract Validation — COMPLETED / SUCCESS; run `42284051309` Reusable Pool Worker Boundary Validation — COMPLETED / SUCCESS.
- PR #39: run `42329993548` Isolated D1 Ledger Proof — COMPLETED / SUCCESS.

These are exact-head named workflow-run results, but do not imply remote D1 qualification, runtime identity correctness, atomic claim under adversarial concurrency, supply-chain integrity or production readiness.

## Latest PR #37 discussion update — F9

The latest PR #37 update (2026-11-08T12:13:04Z) records F9, supply-chain / credential-isolation, against target head `5587a4e013507b5be330fd0c49ce1fc836faa946` and Worker blob `4f57e8eef4a40d14b8d1df467cfac07e39e490a2`.

Static source observations recorded in that update:
- checkout and setup-node actions are SHA-pinned; checkout targets the immutable input SHA; credentials persistence is disabled; Node is pinned to 24.9.0.
- validate and probe jobs have separate declared permissions; the token explicitly exposed in validate is not a workflow-level env value inherited by probe. This does not prove absence of all platform credentials on the runner.
- DSH is installed using `npm install` into a fresh temporary prefix. The workflow does not establish a reviewed immutable transitive dependency closure through a checked-in lockfile plus `npm ci`.
- The workflow does not explicitly enforce an npm lifecycle-script allowlist or `--ignore-scripts`; effective npm configuration and package lifecycle behavior were NOT VERIFIED.
- No provider credentials are explicitly passed to the probe step, and no `secrets: inherit` is present on the reusable workflow call; target-environment credential isolation remains unqualified.

F9 disposition: MEDIUM / NOT VERIFIED. This is a missing supply-chain/credential-isolation guarantee, not evidence that a malicious package executed, that a vulnerability exists, or that a secret leaked. No npm install, DSH execution, token read, provider request or workflow dispatch was performed in this pass.

F9 closure evidence required:
1. Reviewed and checked-in dependency manifest/lock with immutable reproducible install using the selected package-manager version/configuration.
2. Integrity/provenance inventory or SBOM for the dependency closure.
3. Explicit reviewed lifecycle-script policy; disable scripts not required, and narrowly review any required scripts.
4. Synthetic tests for credential/output boundary and unexpected script access, without using real secrets.
5. Exact-head CI rerun after changes.

## Review identity and independence

Review submissions remain concentrated in account `maxkorolskiy88-ship-it`:
- PR #36: 3 COMMENTED.
- PR #37: 2 CHANGES_REQUESTED + 2 COMMENTED.
- PR #39: 3 COMMENTED.

No APPROVED review and no second reviewer identity. The latest F9 discussion update is also from the same account. Reviewer authorization and organizational independence remain NOT VERIFIED. A technically detailed audit comment does not become an independent approval.

## Open security/qualification findings

- F1: Worker job-level use of `job.workflow_repository/file_path/sha`; runtime context availability unproven.
- F2: label-only Finalizer; no durable immutable claim/receipt/run/generation/fencing binding.
- F3/F4: authenticated issuer/provenance and governance-enforced independent approval unresolved.
- F5/F6/F8: GitHub Issue labels are not CAS; task-wide uniqueness, lease/fencing, durable outbox/recovery are not integrated.
- F7: end-to-end target environment/runtime qualification absent.
- F9: supply-chain dependency closure and credential isolation NOT VERIFIED.
- F10: stale completion/audit consistency issue remains in the consolidated audit findings.
- F11: provider quota ledger active-slot eligibility predicate and capacity semantics require further proof; PR #29 audit index records CHANGES_REQUESTED. No provider operation was performed.

## Actions and constraints

- Re-read live PR metadata, all review submissions on #36/#37/#39, and workflow runs associated with the exact immutable heads.
- No code/workflow/config/secret/variable/ruleset/dispatch changes.
- No local tests in this pass; no remote D1 provisioning, Worker/DSH execution, provider/model request, deployment or paid resource.
- Dispatch remains fail-closed; do not merge the draft PRs based solely on green bounded CI.

## Decision and next sequence

1. Obtain an authorized, genuinely independent reviewer and approval for the protocol/threat model and relevant exact PR heads.
2. Resolve F1/F2 and task-wide uniqueness/fencing/receipt/finalizer/recovery.
3. Close F9 with reproducible dependency closure, lifecycle policy and synthetic credential-isolation tests.
4. Reconcile F10/F11 with exact immutable source and regression evidence.
5. Only after governance approval, perform separately scoped free-only remote D1/runtime/UI/routing/quota/persistence qualification.

Contour A: BLOCKED / NOT QUALIFIED / NOT ACCEPTED.  
Contour B: DEFERRED.  
Dispatch: KEEP DISABLED / FAIL-CLOSED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
