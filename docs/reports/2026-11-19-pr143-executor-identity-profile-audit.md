# PR #143 current-head executor identity and capability-profile audit — 2026-11-19

## Status

Source-level audit completed against immutable PR head `3d189df6a4242325ad6261fb38d6e03d7ac6eebd`, based on current default `Основной` HEAD `68183828cf7934e89109310c8f99281be4eb7ed8`.

PR #143 remains OPEN / DRAFT / UNMERGED. No source code was changed in this pass. No production or hosted D1 access, secrets, dispatch, provider calls, deployment, or merge.

## Live evidence

- PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/143
- Current PR head: `3d189df6a4242325ad6261fb38d6e03d7ac6eebd`; base: `68183828cf7934e89109310c8f99281be4eb7ed8`; 28 files, +5,748 lines; mergeable at inspection.
- Isolated D1 Ledger Proof: run [44367978517](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44367978517), job `135026759486`, COMPLETED / SUCCESS. Checkout, pinned Node, exact npm ci, syntax, Workers-runtime D1 tests and lockfile artifact upload all succeeded.
- Pool Contract Validation: run [44367978376](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44367978376), job `135026759792`, COMPLETED / SUCCESS. Dispatch-disabled assertion, YAML parse and security-contract validator succeeded.
- PR formal reviews: 0. Inline review threads: 0.
- Active ruleset #26550182 on `Основной`: PR required, deletion/non-fast-forward blocked, review-thread resolution required, 0 required approvals, no bypass actors. Classic branch protection API reports `protected=false`; do not infer additional protections.
- Gemini controller workflow `.github/workflows/gemini-batch-dispatch-controller.yml` returns 404 on `Основной`; Gemini dispatch remains NOT RUN.

## Source findings

Inspected current-head files:
- `proofs/d1-ledger/migrations/0001_create_pool_approval_ledger.sql` — blob `a80524ed839b63dd6483978118619495fa550877`
- `proofs/d1-ledger/migrations/0007_bind_executor_identity.sql` — blob `47c2f0f7db6379e6760317fe3903214f6f31ffee`
- `proofs/d1-ledger/src/trusted-executor-registry.mjs` — blob `318f608066bea3ad10a08cfcff7b63ed908bfdb0`
- `proofs/d1-ledger/src/trusted-executor-auth.mjs` — blob `7156ef3eca47a80d1259a1b6883cbb50158bfd2a`
- `proofs/d1-ledger/src/consume.mjs` — blob `97fe30e0e97315bce4f185b9d388ee425328153a`
- `proofs/d1-ledger/src/task-attempts.mjs` — blob `f40582968a3b25e1a59522c19dd5bc11b007e6b2`
- `.github/pool-executor-registry.json` — blob `93628e44cd348b85f2bd33df709be80883c83588`
- `proofs/d1-ledger/test/consume.test.ts` — blob `2aeca24661a4215257072a3c25ed67c9eebcc85d`
- `proofs/d1-ledger/test/trusted-executor-registry.test.ts` — blob `09403c51c68b34a3bd0df62e25eae3ce34ed8a24`

### Verified positives

1. Executor identity is separated from capability profile in migration 0007. `executor_id` is added to approvals, logical tasks and immutable attempts; triggers reject missing/mismatched identities and prevent reassignment. Existing rows are not assigned invented identities.
2. The trusted registry is intentionally empty (`executors: [])); no executor is implicitly enabled.
3. Registry resolution reads the current default-branch HEAD independently and pins the registry content request to that SHA. The resolver returns `executionAuthorized:false` and `dispatch:false`.
4. GitHub Actions OIDC authenticates a workflow/job principal only; code explicitly disclaims process/host attestation. This is an honest boundary, not proof of executor runtime identity.
5. Current exact-head CI is green, including local Workers-runtime tests and the repository contract validator.

### Blocking findings

1. **Capability profile remains unresolved against Issue #140 acceptance.** Migration 0001 constrains `profile = 'dsh-headless-probe'`; `consume.mjs` allows only that value; registry resolver rejects every profile except that value; tests seed and positively resolve `claude-code-1` using `dsh-headless-probe`. PR #142 correctly says executor ID and capability profile are separate and explicitly warns against substituting one for the other. However, Issue #140 requires the canonical CODE capability profile and removal of legacy DSH from any new canonical executor allowlist. PR #143 has not yet defined/implemented that CODE profile contract. Do not silently treat an executor ID as a profile or approve the DSH profile as the Claude Code stack.
2. **Output contract is incomplete.** Issue #140 requires every adapter output to preserve both `dispatch:false` and `executionAuthorized:false`. The inspected `consumeApproval` and task-attempt adapters return `dispatch:false` but do not consistently include an explicit `executionAuthorized:false`. Registry/auth adapters do include it. Add negative-first contract tests across every exported adapter before claiming this invariant.
3. **PR body provenance is stale.** Its body still names older heads `2cc68...`, `4fff8...`, and `d35185...` and earlier run IDs as “exact current HEAD”. The actual PR head is now `3d189df...`; latest runs `44367978517` and `44367978376` are the evidence for this head. Update the PR description/evidence before review.
4. **No independent review.** 0 formal reviews and 0 inline threads. CI success is not security qualification.
5. **Registry lookup is not live-qualified.** The registry is only a branch-local scaffold and empty; the resolver's positive tests use synthetic GitHub API responses. Since the scaffold is not on default branch, the real resolver is expected to fail closed until reviewed/merged. No executor enrollment or production authentication is established.

## Decision

PR #143 is a useful isolated local D1 proof and has successful exact-head CI, but it is **NOT QUALIFIED** for canonical executor admission and is not ready for merge/dispatch. Keep `dispatch:false`, `executionAuthorized:false`, the registry empty, and production actions disabled.

## Next bounded engineering step

On a new immutable current-base head, define one explicit capability-profile contract for the frozen Claude Code + ECC + FCC stack; retain `executor_id=claude-code-1` as a separate identity; remove DSH profile from the new canonical executor allowlist without rewriting historical rows; add tests asserting both false authorization fields on every adapter result; refresh PR evidence and request independent review. Reconcile with PR #142 and Issue #140 before changing migrations.

## Not performed

No tests were run locally in this documentation/audit pass; exact-head CI evidence above was read from GitHub. No hosted D1, live GitHub OIDC token, executor process, host attestation, provider quota, secret, deployment, dispatch, merge, or production R2/D1 write was accessed.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
