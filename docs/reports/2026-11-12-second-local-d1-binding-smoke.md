# Second local D1 binding smoke — 2026-11-12

## Objective and immutable target

Verify that the exact pinned Cloudflare Workers Vitest stack can expose a second, independent, local-only D1 binding and run the published `applyD1Migrations` API against it without mutating the existing synthetic `POOL_DB`.

Implementation target: PR #67 branch `impl/receipt-bound-projection-2026-11-11`.
Pre-change target: `f8280ba5a78ffcf1c18bf33f0dc8932ebb36a81`.
Latest implementation commit after this pass: `24e899ad92c19030723b5c3b1d96fbc86e506ecc`.

## Bounded implementation

Added:
- `proofs/d1-ledger/vitest.upgrade-smoke.config.ts` — separate Vitest config, explicitly declares two synthetic local D1 namespaces: existing `POOL_DB` ID `00000000-0000-0000-0000-000000000000` and isolated `UPGRADE_DB` ID `11111111-1111-4111-8111-111111111111`. No remote proxy connection string, Cloudflare account resource, credential or production binding is configured.
- `proofs/d1-ledger/test/d1-upgrade-binding.smoke.test.ts` — applies the repository's current migration set to `UPGRADE_DB`, checks the expected schema appears there but not in `POOL_DB`, inserts a synthetic row into `UPGRADE_DB`, and checks the primary binding remains without that table.
- `package.json` script `test:upgrade-binding`.
- `.github/workflows/d1-ledger-proof-validation.yml` step to run the smoke config after the existing D1 suite.

The test is deliberately separate from the normal config and does not load the global migration setup file. It applies the current 0001–0010 migration set only to the disposable binding. This is not yet a populated historical v1→0011 upgrade test.

## CI evidence

- PR #67 exact latest head: `24e899ad92c19030723b5c3b1d96fbc86e506ecc`.
- Pool Contract Validation run [43176832924](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43176832924): COMPLETED / SUCCESS.
- Isolated D1 Ledger Proof run [43176833135](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43176833135): RUNNING at last observation. Job `131043022132`; checkout, Node 24.9.0 setup, `npm ci --ignore-scripts --no-audit --no-fund`, and `npm run check` completed successfully. Existing Workers-runtime D1 suite was still running; the new isolated binding step had not started. Therefore second-binding runtime proof is NOT VERIFIED yet.
- Combined status contexts for the exact commit: empty. The workflow runs are the available CI evidence, not a claim of required status contexts.
- No independent review was requested or performed; per owner direction independent reviews remain deferred until after pool launch.

## File identities read back from GitHub

- Config `proofs/d1-ledger/vitest.upgrade-smoke.config.ts`: blob `802460dfc3e15754c971fe3da52f81980c5ebb8c`.
- Test `proofs/d1-ledger/test/d1-upgrade-binding.smoke.test.ts`: blob `bc076f1d1b5ce27edc55ac22ea303cf72e825d90`.
- `proofs/d1-ledger/package.json`: blob `c9a3282ef4a465bf803bd196808f51770444045f`.
- Workflow `.github/workflows/d1-ledger-proof-validation.yml`: blob `ad1b5582f643b3d181d72e414dc67368f3f57e22`.
- Lockfile was not changed.

## Scope and safety

- No hosted D1, Cloudflare account resource, production binding, remote proxy, secret, provider/model API, dispatch, live GitHub write or deployment was used.
- No SQL migration 0011 was created or applied.
- No frozen v1 fixture or full upgrade harness was created.
- PR #67 remains draft and unmerged. The smoke implementation is an unaccepted working change.
- Contour A remains BLOCKED / NOT ACCEPTED. Contour B remains DEFERRED.
- Independent security/governance review remains deferred until after pool launch per owner direction.

## Next step

Wait for run 43176833135 to complete. Inspect its job steps and logs. If the isolated-binding step passes, preserve the exact run/job evidence and then build the separate populated schema-0010 fixture/upgrade harness. If it fails, use the exact failure to adjust only the disposable config/test and rerun; do not create migration 0011 until this gate is VERIFIED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
