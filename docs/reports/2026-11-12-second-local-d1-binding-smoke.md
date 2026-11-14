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

## First CI attempt and correction — 2026-11-12

- Initial exact-head D1 workflow run [43176833135](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43176833135) FAILED before reaching the dedicated smoke step. The original filename matched the default `test/**/*.test.ts` glob, so the new test was loaded in the standard config. Importing `readD1Migrations` inside the Worker test caused Miniflare module resolution to fail with `No such module "node:process"`. Existing 69 tests passed; one new suite failed to load. This was a test placement/import-context error, not a D1 isolation result.
- Corrected by renaming the dedicated test to `d1-upgrade-binding.smoke.ts` (outside the default test glob), moving `readD1Migrations` into the Node-side Vitest config, and passing the parsed migrations through the explicit `UPGRADE_MIGRATIONS` binding. The Worker test now imports only `applyD1Migrations` from `cloudflare:test`.
- Corrected implementation commit / PR #67 head: `e068391ee0a08c7047593c249199a102e1cd0010`.
- Rerun [43176990564](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43176990564): RUNNING at report update; checkout, Node setup, dependency install completed; syntax check was running. The dedicated second-D1 smoke step had not yet executed. Pool Contract Validation run 43176990553 was pending.
- Disposition: the initial test failure is diagnosed and corrected, but second local D1 binding remains NOT VERIFIED pending rerun completion.
## Successful corrected exact-head CI — 2026-11-12

- Corrected PR #67 head: `e068391ee0a08c7047593c249199a102e1cd0010`.
- Isolated D1 Ledger Proof [run 43176990564](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43176990564): COMPLETED / SUCCESS. Job `131043540464`.
- Standard Workers-runtime suite: 5 files / 69 tests PASSED.
- Dedicated `npm run test:upgrade-binding`: 1 file / 1 test PASSED. It successfully called `applyD1Migrations` against `UPGRADE_DB`, observed the migration-created table only in `UPGRADE_DB`, confirmed it absent from `POOL_DB`, inserted and read back a synthetic row in `UPGRADE_DB`, and confirmed `POOL_DB` remained without that table.
- Workflow log reports lockfile artifact ID `13924647072`, ZIP SHA-256 `f3751e7735b7ca90bc3399b6c9f37e1cde7928c424584340d11e2d1358305a40`.
- Pool Contract Validation [run 43176990553](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43176990553): COMPLETED / SUCCESS.
- Exact-head combined status contexts remain empty. Formal PR reviews and review threads were not rechecked in this CI-only subpass; no merge requested.
- Disposition: the second local D1 binding and pinned migration API runtime smoke are VERIFIED for this exact PR head and GitHub-hosted runner environment. This proves local binding separation and migration invocation, not a populated pre-0011 upgrade-preservation harness, hosted D1, remote D1 behavior, or production qualification.
- Next: implement the frozen schema-0010 fixture and byte-preserving upgrade oracle in this separate config. Seed historical v1 event/outbox/marker/comment-state cases before applying a candidate 0011 migration; do not create 0011 until the fixture and baseline snapshot can be reproduced and reviewed.