# Clean-main reconstruction of isolated D1 ledger proof — 2026-11-15

## Objective

Reconstruct the verified D1 proof package from its divergent stacked proof history onto a clean branch based on the current default branch. Do not merge or transplant the 100-commit / 64-behind proof history.

## Immutable base and result

- Default branch: `Основной`.
- Base SHA: `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`.
- Clean branch: `integration/d1-ledger-clean-main-2026-11-15`.
- Final HEAD / commit: `3436f5f87ed1b237122ea0444265302d99cf2d02`.
- Tree: `d5da04dd41a601a9bd52664a956f250cab38dd9b`.
- PR #87: https://github.com/VlDMlNSh/developer-cloud-pool/pull/87
- Compare: 1 commit ahead / 0 behind; 49 added files; no unrelated proof-branch history.
- PR is OPEN / DRAFT / UNMERGED; mergeable reported true.

The default branch contained no `proofs/d1-ledger` source subtree. Reused exact Git blob identities from the reviewed proof tree to reconstruct the 48-file isolated package plus its workflow on the current default tree. The resulting commit has only the pinned default SHA as parent.

## Reconstructed content

- Isolated D1 ledger proof package.
- Migrations 0001–0014.
- Local Workers-runtime adapters and adversarial tests.
- Frozen schema-0010 upgrade fixture and second local D1 binding smoke.
- D1 proof validation workflow.
- No existing default-branch files were overwritten.

Critical source blob identities verified after reconstruction:
- Migration 0013: `40b93551c787078e5c65c8861569bb428bd2eb8b`.
- Migration 0014: `cb8a47d83faba62981daa8f7320da87baa2c55e2`.
- Admission source: `00e9042ccdbf04cd4ecaf6fbda3c982cf72136ed`.
- Atomic admission tests: `0bd28c6e0af6d416a256bf529c2ff1b735e24ae4`.
- Validation workflow: `c6d9212666a628f918d95b419a97d4294836b488`.

## Exact-head verification

Both PR-triggered workflows ran against exact head `3436f5f87ed1b237122ea0444265302d99cf2d02`.

1. [Isolated D1 Ledger Proof — run 43711509028](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43711509028), job `132803868550`: COMPLETED / SUCCESS.
   - Syntax validation: PASS.
   - Workers-runtime: 11 test files / 118 tests PASS / 0 FAIL.
   - Second isolated D1 binding + migration API smoke: PASS.
   - Frozen schema-0010 fixture upgrade smoke: PASS.
   - Lockfile artifact upload: PASS.
   - Artifact ID `14159784811`, SHA-256 `6bea4eb8fb91dd6f50d47dbce46efce7fd799c0f93e3a88c6495cea4e392179b`.

2. [Pool Contract Validation — run 43711509085](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43711509085), job `132803869022`: COMPLETED / SUCCESS.
   - Dispatch-disabled invariant: PASS.
   - Workflow YAML syntax: PASS.
   - Pool security contract validation: PASS.

Commit status API reports zero status contexts / NOT VERIFIED. This does not negate the two successful Actions workflows, but aggregate required-status evaluation remains NOT VERIFIED. PR #87 has no formal reviews and no inline review threads.

## Security and qualification boundary

- The package remains explicitly isolated proof code, not adopted production schema.
- No hosted D1 database, provider credential access, provider calls, deployment, Worker execution or dispatch.
- Dispatch remains `false`.
- Epoch-advance race interleaving remains NOT VERIFIED.
- Independent security review and production qualification remain NOT RUN.
- PR #81 remains OPEN / DRAFT / UNMERGED; PR #83 remains CLOSED / UNMERGED; PR #79 remains OPEN / DRAFT.

## Next step

Add deterministic concurrent registry-epoch advancement versus admission coverage to the clean branch, asserting that either admission commits against the still-current epoch before the advance or is denied after the advance, with no mixed/partially committed state. Re-run both exact-head workflows and inspect the full patch before any merge. Hosted D1 and dispatch remain disabled.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## Deterministic registry-advance interleaving and exact-head CI — 2026-11-15

- Current default: `Основной@9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`.
- Clean integration PR #87: https://github.com/VlDMlNSh/developer-cloud-pool/pull/87; branch `integration/d1-ledger-clean-main-2026-11-15`; latest verified head `8abfa5c48e82b50ef9cdbcc009caf03b90e9c82b`; 5 commits ahead / 0 behind; merge base is the exact current default SHA. PR remains OPEN / DRAFT / UNMERGED.
- Deterministic TOCTOU test now forces this order: admission preflight completes; trusted registry snapshot + issuer key + active pointer advance atomically to a higher epoch; then the original admission batch is released. It asserts fail-closed denial, approval remains ready, and no admission/assertion rows are committed.
- Test blob: `1d39dff5f2c76b35cd05625ef0999578528b07c7`. The first test attempt failed because the synthetic snapshot used `route_count=0`, violating migration 0012's CHECK constraint (route_count must be 1–256). The fixture was corrected to route_count 1; no production migration or admission code changed for this correction.
- Workflow blob: `ab2613a776f1b17daf8d2934528e62bb95fbe9bc`; the clean integration branch is included in the isolated D1 workflow push allowlist.
- Failed diagnostic run on prior test revision `d920a8512a2ac2c32a201a4ed84c041bb97d1a04`: [43711949365](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43711949365), job `132805227807`; 118 passed / 1 failed, solely the invalid synthetic route_count fixture. The accompanying Pool Contract Validation run [43711949474](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43711949474) passed.
- Corrected exact-head D1 run [43712068163](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43712068163), job `132805595342`: COMPLETED / SUCCESS; syntax PASS; 11 test files / 119 tests PASS / 0 FAIL; second isolated D1 binding/migration smoke PASS; frozen schema-0010 fixture smoke PASS; lockfile artifact upload PASS. Artifact ID `14160831522`, SHA-256 `96beb0f9c62eb2787180f1847bb0d860d7a0d0c9c37f63beeaf3cf62b427e9fb`.
- Corrected exact-head Pool Contract Validation run [43712068111](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43712068111), job `132805595358`: COMPLETED / SUCCESS; dispatch-disabled invariant, workflow YAML syntax and pool security contract checks PASS.
- Combined commit status contexts: 0 / NOT VERIFIED. Formal PR reviews: 0; inline review threads: 0. Actions workflow success is verified; aggregate status contexts and independent review are separate and remain unverified/not run.
- This remains an isolated local D1 proof, not production schema adoption. Hosted D1, provider calls, secret reads, deployment, Worker/Supervisor execution, dispatch, merge and independent acceptance were NOT RUN. Dispatch remains disabled. Contour A IN PROGRESS / NOT ACCEPTED; Contour B DEFERRED.
- Next: inspect the complete PR #87 diff and migration ordering against the current default, then continue only with local/no-provider qualification. Do not merge or provision hosted D1 until all required gates are explicitly met.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md

## Current verified state — 2026-11-15 (latest pass)

- Default branch `Основной` HEAD: `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`.
- Clean A0/D1 integration PR #87: https://github.com/VlDMlNSh/developer-cloud-pool/pull/87; branch `integration/d1-ledger-clean-main-2026-11-15`; current PR HEAD `8cc7b12948865bb0e13ce099386c09f3ae32b4f5`; 6 commits ahead / 0 behind; merge base equals current default HEAD; 49 added files. PR is OPEN / DRAFT / UNMERGED.
- Latest test blob `proofs/d1-ledger/test/atomic-admission.test.ts`: `4543d1db062da3e94ee839c50c79e3f01016b8b7`. Added full rollback assertions to the deterministic registry-epoch TOCTOU test: approval remains ready; no assertion, admission, commit receipt, attempt, task, or delivery-outbox row may remain after the active registry pointer advances between preflight and D1 batch.
- Migration order 0001–0014 reviewed at source level. Migrations 0011–0014 are additive after the frozen 0010 baseline. The 0014 trigger checks exact qualification/issuer/key/epoch/bundle/version/evidence binding, active singleton pointer, snapshot validity, route freshness/expiry/revocation and issuer-key lifecycle inside the admission batch. The registry verifier uses a pinned platform root public key and verifies root ES256 bundle signature plus per-route issuer signatures. This is source review, not independent security qualification.
- Existing exact-head CI applies to prior PR head `8abfa5c48e82b50ef9cdbcc009caf03b90e9c82b`: D1 run [43712068163](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43712068163) SUCCESS (11 files / 119 tests) and Pool Contract Validation [43712068111](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43712068111) SUCCESS. These results do NOT validate new HEAD `8cc7b12948865bb0e13ce099386c09f3ae32b4f5`.
- Latest commit workflow-run lookup for `8cc7b12948865bb0e13ce099386c09f3ae32b4f5` returned no PR-associated runs; combined status contexts are empty. Exact-head CI for latest commit: NOT VERIFIED.
- PR #87 formal reviews: 0; inline threads: 0. PR remains draft. Effective ruleset details not re-read in this pass; no merge attempted.
- No hosted D1, provider calls, secret reads, deployment, Worker/Supervisor execution, dispatch, merge or independent acceptance. Dispatch remains disabled. Contour A IN PROGRESS / NOT ACCEPTED; Contour B DEFERRED.
- Next: obtain exact-head CI for `8cc7b12948865bb0e13ce099386c09f3ae32b4f5`; inspect run logs if failed. Then complete source audit of PR diff and migration/adapter boundaries. Keep all qualification local and no-provider until required governance gates are verified.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md

