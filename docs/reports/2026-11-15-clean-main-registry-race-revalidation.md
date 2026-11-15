# Clean-main D1 registry race revalidation — 2026-11-15

**Status: EXACT-HEAD CI VERIFIED / STATIC TRANSACTION REVIEW PARTIAL / NOT QUALIFIED.**

## Immutable target and branch state

- Repository: `VlDMlNSh/developer-cloud-pool`.
- Default branch `Основной`: `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc` (live Git ref read-back).
- PR #87: https://github.com/VlDMlNSh/developer-cloud-pool/pull/87
- Head branch: `integration/d1-ledger-clean-main-2026-11-15`.
- Live PR API HEAD: `8abfa5c48e82b50ef9cdbcc009caf03b90e9c82b`; comparison to default: 5 ahead / 0 behind, merge base is the default HEAD.
- PR #87 remains OPEN / DRAFT / UNMERGED; mergeable reported true. Formal reviews: 0; inline review threads: 0.
- PR description was stale at read time: it still named prior HEAD `5eaaf25fa4933bf537f0fd932e1867f16c3fd03d` and described 3 commits ahead. The live PR API and compare endpoint establish `8abfa5c48e82b50ef9cdbcc009caf03b90e9c82b` / 5 ahead / 0 behind as the current target. Do not rely on the stale description.

## Exact-head CI evidence

The workflow-run lookup was performed for the live PR HEAD `8abfa5c48e82b50ef9cdbcc009caf03b90e9c82b`:

- D1 workflow [43712068163](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43712068163): COMPLETED / SUCCESS; job `132805595342`.
  - `npm ci --ignore-scripts --no-audit --no-fund`: success.
  - `npm run check`: success.
  - Workers-runtime suite: 11 files / **119 tests PASS**, 0 failures.
  - Isolated second D1 binding/migration API smoke: 1 passed.
  - Frozen schema-0010 fixture smoke: 2 passed; golden SHA-256 `afbf1445c6d2fa0b51cdbd0da932d158aa2850832ca8297f83b103c00d8b2187`.
  - Artifact `14160831522`, 18,253 bytes; SHA-256 `96beb0f9c62eb2787180f1847bb0d860d7a0d0c9c37f63beeaf3cf62b427e9fb`.
- Pool Contract Validation [43712068111](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43712068111): COMPLETED / SUCCESS; job `132805595358`. Dispatch-disabled invariant, YAML syntax and pool security-contract checks passed.
- Combined commit status contexts for the exact head are empty. This does not negate the two workflow executions, but required status contexts are not established by the combined-status endpoint.

## Transaction and race review

Read back these exact source blobs from the PR branch:

- Admission adapter `proofs/d1-ledger/src/admit-qualified-task.mjs`: `00e9042ccdbf04cd4ecaf6fbda3c982cf72136ed`.
- Migration 0014 `proofs/d1-ledger/migrations/0014_atomic_admission_registry_assertion.sql`: `cb8a47d83faba62981daa8f7320da87baa2c55e2`.
- Atomic admission test `proofs/d1-ledger/test/atomic-admission.test.ts`: `1d39dff5f2c76b35cd05625ef0999578528b07c7`.
- Workflow `.github/workflows/d1-ledger-proof-validation.yml`: `ab2613a776f1b17daf8d2934528e62bb95fbe9bc`.

Confirmed in source:
- Registry assertion is the first D1 batch statement, before approval consumption, admission, attempt/outbox and receipt writes.
- Its database trigger checks the active singleton pointer, exact epoch/digest/version, route evidence identity/freshness, and issuer key status/revocation/validity.
- Receipt assertion is derived by joining the exact admission assertion row to the consumed approval, task, outbox, attempt and route qualification.
- Exact retry rechecks active registry and issuer-key state.
- The new deterministic TOCTOU test injects a registry epoch advance after admission preflight completes but before the adapter's D1 batch executes. It asserts fail-closed denial, unchanged ready approval, and zero admission/assertion rows.

Review limitation: this is a deterministic storage-boundary interleaving test in the local Workers runtime, not a hosted-D1 multi-client concurrency proof. It does not establish distributed writer scheduling, production root-key custody, cross-process capability authenticity, or an end-to-end Supervisor/Worker path. The proof's route/issuer fixtures are synthetic and the package is not mounted in the deployed pool.

## Governance and scope

- Active repository ruleset #26550182 applies to `Основной`; it requires PR and review-thread resolution but has **0 required approvals**, no required reviewers and no required CI status checks. Default branch metadata reports `protected=false`. Governance remains insufficient for acceptance.
- PR #87 adds 49 isolated proof files only; it is 5 commits ahead / 0 behind. No merge performed.
- No hosted D1, secrets, provider calls, deployment, Worker execution, Gemini dispatch, independent audit or Contour B work.
- `dispatch:false` remains invariant.
- Contour A: IN PROGRESS / NOT ACCEPTED. Contour B: DEFERRED.

## Next

1. Reconcile PR #87 description with its actual HEAD and exact-head evidence.
2. Continue static audit of trigger/receipt invariants, rollback and retry behavior, and inspect the complete migration chain against the current default.
3. Build the next local-only integration seam from this proof into the actual Supervisor/Worker task envelope/outbox/receipt contract without dispatch.
4. Keep PR #87 Draft and unmerged pending formal review and adequate governance. Do not treat local D1 CI as production qualification.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
