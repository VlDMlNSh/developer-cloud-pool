# Disposable D1 upgrade harness — API fit and test topology — 2026-11-12

## Status

HARNESS DESIGN VERIFIED AGAINST DOCUMENTED API SHAPES / PINNED PLUGIN PATCH-LEVEL COMPATIBILITY NOT VERIFIED / NO CODE OR CONFIG CHANGE / NO MIGRATION EXECUTED.

Scope is limited to designing a safe local-only test harness for a populated schema-0010 D1 database. No SQL, TypeScript, package, lockfile, Wrangler config, workflow, secret, permission, hosted D1, provider call, dispatch, live GitHub write, deployment or merge was changed or executed. Independent technical/security/governance review remains deferred until actual Cloud Pool launch by owner direction.

## Immutable targets

- Implementation source: PR #67 head `f8280ba5a78ffcf1c18bf33f0dc8932ebb36a81d`.
- Documentation branch current head before this report: `fdf52c61c438f195f941eb2c927cf1be5567047c`.
- Default branch `Основной`: `221f216c00ca7e5596bcc682ba185ad155a10603`.
- Package manifest blob `bd9a6ad164884ad1ab50e23a506a133265ec4241`: `@cloudflare/vitest-plugin@1.4.7`, `vitest@4.1.12`.
- Wrangler config blob `eb683b6bb838cb7a48741f900de6c17be7fdc0fe`.
- Vitest config blob `39bcf53a51180e7e5f309978e307e9964a2cc22e`.
- Migration setup blob `e1307208cc520a3399e66a937c3e0b05b71ac0f6`.

## 1. Existing test topology

Current package:
- `npm test` runs `vitest run --config vitest.config.ts`.
- `cloudflareTest({ wrangler: { configPath: "./wrangler.jsonc" }, miniflare: { bindings: { TEST_MIGRATIONS: migrations } } })`.
- `wrangler.jsonc` declares one local D1 binding, `POOL_DB`, using synthetic zero UUID and migrations directory `./migrations`.
- setup file imports `applyD1Migrations` from `cloudflare:test` and applies all `env.TEST_MIGRATIONS` to `env.POOL_DB` before tests.
- package pins Vitest 4.1.12 and Cloudflare Vitest plugin 1.4.7. Do not upgrade either as part of this work.

This setup intentionally makes every normal test see a fully migrated database. It cannot by itself prove a populated pre-0011 upgrade.

## 2. Verified API surface from official Cloudflare documentation/source

Official Cloudflare Workers SDK documentation/source currently documents:
- `readD1Migrations(path)` in the Node/Vitest config process; it returns migrations ordered by migration number and each migration contains its SQL query array.
- `applyD1Migrations(db, migrations, migrationTableName?)` inside the Workers test runtime; it applies pending migration entries to the supplied D1Database and records applied names in the migration table. It uses D1 batch semantics.
- `cloudflareTest()` accepts Miniflare options; its current SDK type surface includes D1 database configuration.
- Wrangler D1 configuration supports named bindings, database IDs, and a migrations directory.

Official sources consulted:
- https://developers.cloudflare.com/workers/testing/vitest-integration/configuration/
- https://developers.cloudflare.com/workers/testing/vitest-integration/test-apis/
- https://github.com/cloudflare/workers-sdk/blob/main/packages/vitest-plugin/src/worker/d1.ts
- https://github.com/cloudflare/workers-sdk/blob/main/packages/vitest-plugin/src/pool/d1.ts
- https://github.com/cloudflare/workers-sdk/blob/main/packages/vitest-plugin/src/pool/config.ts

Important qualification: these sources describe current docs/main, not a retrieved immutable source tag for the exact installed 1.4.7 package. Attempts to resolve a guessed Git ref `vitest-plugin@1.4.7` returned 404 and were not treated as source evidence. Therefore the documented API shape is a good design basis, but exact compatibility with pinned 1.4.7 remains NOT VERIFIED until the installed package artifact/types or immutable release source are inspected. Do not silently upgrade to match newer docs.

## 3. Recommended harness topology — design only

Use a separate Vitest config and separate local D1 binding so the existing suite's global `setupFiles` cannot pre-apply all migrations to the upgrade test database.

Proposed files (not created):
- `vitest.migration-upgrade.config.ts`
- `wrangler.migration-upgrade.jsonc`
- `test/migration-upgrade.test.ts`
- optionally a frozen SQL/JSON fixture under `test/fixtures/v1-schema-0010/`

Proposed config:
1. Keep the same pinned `@cloudflare/vitest-plugin@1.4.7` and Vitest 4.1.12.
2. Point `cloudflareTest` to a dedicated Wrangler config with a distinct local-only binding name such as `MIGRATION_TEST_DB`, using a distinct synthetic zero UUID (never a production database ID).
3. Do not reuse `POOL_DB`; do not include the normal `test/apply-migrations.ts` setup file.
4. Read migrations through the pinned plugin's `readD1Migrations` API and expose the array as a test-only binding. The upgrade test should explicitly apply only the first ten migrations, seed fixtures, snapshot, then apply candidate migration 0011.
5. Ensure the dedicated binding is Miniflare-local and has no `remote: true`; test should fail closed if it cannot establish a local test runtime.
6. Run the upgrade suite as a separate package script/config so the normal test setup cannot contaminate its initial schema state.

The precise config key for the second D1 binding must be confirmed from the installed 1.4.7 type definitions/config schema before authoring it. Current documentation/main supports D1 binding configuration through Miniflare and Wrangler, but that is not enough to claim pinned patch-level compatibility.

## 4. Test sequence

Within one isolated migration-upgrade test file/database lifecycle:

A. Assert migration list contains exactly 0001–0010 before candidate 0011 is introduced; assert names/order, do not infer by array length alone.
B. Call `applyD1Migrations(MIGRATION_TEST_DB, migrations0001to0010)`.
C. Assert migration ledger lists exactly migrations 0001–0010.
D. Seed valid v1 terminal attempts/outbox/comment rows using existing supported APIs/triggers where possible; capture the frozen v1 fixture described in the review packet.
E. Export ordered, explicit-column snapshots of every relevant table and exact fake-marker byte strings.
F. Apply candidate 0011 exactly once via `applyD1Migrations(MIGRATION_TEST_DB, [migration0011])`.
G. Assert ledger includes 0011; compare all historical values byte-for-byte; assert existing rows receive version 1 and no v2 staging digest/event is created.
H. Re-run apply for 0011; assert it is not re-applied and row identity remains unchanged.
I. In a separate fresh disposable binding, test failure atomicity with an invalid migration variant; assert no partial schema/data change remains.
J. No real GitHub client, network egress, provider credentials, hosted D1 or production bindings in this test process.

Do not rely on Vitest's per-file worker isolation alone as proof of a fresh D1 database. The dedicated binding/config must provide independent storage and the test must assert its initial empty migration ledger. If the pinned plugin cannot reliably create an independent local D1 instance, use a separate test invocation/process with its own Miniflare configuration; do not use a home-grown SQLite engine.

## 5. Why this is safer than altering the existing setup

- Existing suite remains unchanged and continues applying all migrations to `POOL_DB`.
- Migration upgrade test controls exactly when migrations 0001–0010 are applied.
- A separate D1 binding prevents setup-file contamination.
- The test proves a real populated schema upgrade rather than only fresh install.
- No hosted database is needed; the existing synthetic local-only binding pattern is retained.
- No v1 row is mutated to make the fixture pass.

## 6. Exact next implementation gate

Before coding:
1. Inspect `node_modules/@cloudflare/vitest-plugin` or the exact package tarball/source corresponding to lockfile 1.4.7, including exported types for `cloudflareTest`, Miniflare D1 bindings and `readD1Migrations`.
2. Confirm a second local D1 binding can be configured under that pinned version and is isolated from `POOL_DB`.
3. Confirm `applyD1Migrations` is exported by `cloudflare:test` for this version and accepts a selected subset of the `readD1Migrations` result.
4. Only then implement the separate test config and fixture; first run the test with migrations 0001–0010 and assert schema 0010 before adding 0011.
5. Add candidate 0011 only after the populated v1 preservation harness itself is working.

## 7. Current project disposition

- Harness design based on documented Cloudflare API: VERIFIED.
- Exact plugin 1.4.7 type/source compatibility: NOT VERIFIED.
- Second D1 binding under pinned plugin: NOT VERIFIED.
- Frozen v1 fixture: NOT CREATED.
- Harness code/config: NOT IMPLEMENTED.
- Upgrade/byte-preservation test: NOT RUN.
- Migration 0011: NOT CREATED / NOT APPLIED.
- PR #67 exact-head local runs 43162128594 and 43162128615: SUCCESS; these do not test migration upgrade.
- PR #66 exact-head CI: NOT VERIFIED (no runs/status contexts returned).
- Hosted D1: NOT RUN / NOT QUALIFIED.
- Recovery Actor: NOT QUALIFIED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Next bounded step: verify the exact installed 1.4.7 package artifact/type declarations and determine the precise second-D1 binding configuration. Do not modify code or SQL until that compatibility check is evidence-backed.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
