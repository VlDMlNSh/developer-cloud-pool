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


## Deterministic registry-advance interleaving — 2026-11-15

- Clean integration branch: `integration/d1-ledger-clean-main-2026-11-15`.
- Latest implementation commit: `d920a8512a2ac2c32a201a4ed84c041bb97d1a04`; preceding workflow commit: `5eaaf25fa4933bf537f0fd932e1867f16c3fd03d`. The branch is 3 commits ahead / 0 behind `Основной@9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`; merge base is the exact default HEAD.
- PR #87 remains the clean integration PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/87.
- Added deterministic TOCTOU interleaving coverage in `proofs/d1-ledger/test/atomic-admission.test.ts`: the admission preflight completes, the trusted registry pointer advances atomically to a higher epoch, then the admission D1 batch is released. Expected fail-closed result: no admission assertion, no consumed approval, no task admission, and `dispatch:false`.
- Test blob: `85f57c34a8e953a5ed3143f9af12cc4ab9f7dee2`.
- Updated `.github/workflows/d1-ledger-proof-validation.yml` push allowlist to include the clean integration branch, so the isolated D1 validation workflow is eligible on branch pushes. Workflow blob: `ab2613a776f1b17daf8d2934528e62bb95fbe9bc`.
- Latest implementation target before this documentation update: `5eaaf25fa4933bf537f0fd932e1867f16c3fd03d` (workflow commit; includes the race-test commit `d920a8512a2ac2c32a201a4ed84c041bb97d1a04)).
- Exact-head CI for the new target: NOT VERIFIED. The prior two successful workflows (runs `43711509028` and `43711509085`) apply only to the earlier head `3436f5f87ed1b237122ea0444265302d99cf2d02`; they do not validate the new test/workflow commits. Latest commit workflow lookup returned no runs and combined commit status contexts remain empty. Do not infer success.
- PR #87 formal reviews: 0; inline review threads: 0 (latest available review query). PR remains draft/unmerged.
- No hosted D1, provider calls, secret reads, deployment, Worker/Supervisor execution, dispatch or merge. Contour A remains IN PROGRESS / NOT ACCEPTED; Contour B DEFERRED.
- Next: obtain exact-head Actions results for `5eaaf25fa4933bf537f0fd932e1867f16c3fd03d`; inspect any failure logs and repair only the failing contract. After exact-head CI, inspect the full PR diff and continue integration qualification. Keep dispatch disabled.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
