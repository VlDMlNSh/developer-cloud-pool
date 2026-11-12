# Pinned Cloudflare Vitest plugin artifact inspection — 2026-11-12

## Outcome

PARTIAL VERIFICATION. Exact package and dependency artifacts are now pinned by the repository lockfile. The independent D1-binding configuration is still NOT VERIFIED against the installed package artifact because the package tarball/type declarations were not retrieved and inspected. No code, configuration, dependency, fixture, migration, workflow or runtime change was made.

## Immutable evidence

Implementation target PR #67: `f8280ba5a78ffcf1c18bf33f0dc8932ebb36a81d`.

Lockfile:
- Path: `proofs/d1-ledger/package-lock.json`
- Blob SHA: `876c5d3de53bb12efaecdec939cbe8710cbd9e3c`
- lockfileVersion: 3
- Plugin package entry:
  - version: `1.4.7`
  - resolved artifact: `https://registry.npmjs.org/@cloudflare/vitest-plugin/-/vitest-plugin-1.4.7.tgz`
  - integrity: `sha512-Anm7ethCK3SPnrEw9HBkpwEzXUmQKFI04ekAAnCI3L5CVCAD4yUOn4+CBgbVI7W9dm+o0BjiFD0Id3dhmRMnbQ==`
  - license: MIT
  - dependencies: cjs-module-lexer 1.2.3, esbuild 0.28.2, miniflare 5.20261019.2-beta, wrangler 4.152.0, zod 4.6.5
  - peer dependency: Vitest `^4.1.0 || ^5.0.0`
- Direct test dependency is Vitest 4.1.12.

This gives an immutable npm tarball URL and integrity digest. It is stronger than relying on a package version string alone. However, the tarball itself and embedded declaration files were not successfully retrieved in this pass; do not claim package-internal type/API inspection has occurred.

## Current source/config findings

- `package.json` blob `bd9a6ad164884ad1ab50e23a506a133265ec4241` pins plugin 1.4.7 and Vitest 4.1.12.
- `wrangler.jsonc` blob `eb683b6bb838cb7a48741f900de6c17be7fdc0fe` configures only `POOL_DB`, with a synthetic zero UUID and local migrations directory.
- `vitest.config.ts` blob `39bcf53a51180e7e5f309978e307e9964a2cc22e` loads all migrations and passes them to the plugin as `TEST_MIGRATIONS`.
- `test/apply-migrations.ts` blob `e1307208cc520a3399e66a937c3e0b05b71ac0f6` applies all migrations to `env.POOL_DB` in setup.

Official docs/current SDK source describe D1 binding configuration and `applyD1Migrations(db, migrations)`, but they do not by themselves prove the precise accepted configuration shape or test binding behavior for the pinned plugin + Miniflare combination.

## Release-history caution

The npm version history confirms 1.4.7 is a published version. The available Cloudflare SDK changelog excerpts identify subsequent 1.4.8–1.4.11 changes, but do not establish the exact source commit for 1.4.7. A guessed Git ref was not accepted by GitHub and is not evidence. Do not use current `main` as a substitute for the immutable package.

## Gate decision

- Exact direct package version: VERIFIED from package manifest and lockfile.
- Exact npm artifact URL and SHA-512 integrity: VERIFIED from lockfile.
- Exact transitive Miniflare/Wrangler versions: VERIFIED from lockfile.
- Exact plugin 1.4.7 type declarations/config schema: NOT VERIFIED.
- Independent second local D1 binding under pinned version: NOT VERIFIED.
- `applyD1Migrations` exact pinned-runtime compatibility: NOT VERIFIED.
- Migration harness code, fixtures, migration 0011 and upgrade proof: NOT IMPLEMENTED / NOT RUN.

## Next bounded step

Obtain the exact npm tarball identified above and verify its SHA-512 against the lockfile integrity before inspecting its shipped `package.json`, `dist/**/*.d.ts`, and implementation. Then inspect the exact Miniflare 5.20261019.2-beta D1 binding schema/types and confirm a second distinct local D1 binding can be exposed without enabling remote bindings. If the artifact cannot be obtained or digest verification fails, stop and leave the gate NOT VERIFIED. No package upgrades or guessed config keys.

## Repository state at this pass

- Default branch `Основной` HEAD: `221f216c00ca7e5596bcc682ba185ad155a10603`.
- PR #66: OPEN / DRAFT / UNMERGED; head `6b23238866116d61c4f96136b0cbb3ac6ec0358f`.
- PR #67: OPEN / DRAFT / UNMERGED; head `f8280ba5a78ffcf1c18bf33f0dc8932ebb36a81d`.
- No CI rerun or hosted D1 operation performed in this pass.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md

## Exact-version package declaration inspection — 2026-11-12

### Evidence retrieved from the published 1.4.7 package CDN
The npm registry tarball endpoint was still unreachable through the available retrieval paths, so the tarball bytes were NOT downloaded and the lockfile SHA-512 was NOT independently recomputed. However, exact-version files served by unpkg were successfully retrieved:

- https://unpkg.com/@cloudflare/vitest-plugin@1.4.7/package.json
- https://unpkg.com/@cloudflare/vitest-plugin@1.4.7/dist/pool/index.d.mts
- https://unpkg.com/@cloudflare/vitest-plugin@1.4.7/types/cloudflare-test.d.ts
- https://unpkg.com/miniflare@5.20261019.2-beta/package.json
- https://unpkg.com/miniflare@5.20261019.2-beta/dist/src/index.d.ts

Exact-version findings:
- Plugin package.json confirms version 1.4.7, MIT, main dist/pool/index.mjs, types dist/pool/index.d.mts, cloudflare:test declarations under types/cloudflare-test.d.ts, dependency Miniflare 5.20261019.2-beta, Wrangler 4.152.0, and peer Vitest ^4.1.0 || ^5.0.0.
- Plugin declarations expose cloudflareTest(options) with WorkersPoolOptions; its miniflare option is typed from Miniflare's V4WorkerOptionsShape (plus plugin worker options), and includes a worker-options array form. This confirms the pinned plugin has an explicit Miniflare configuration surface; it does not prove that arbitrary extra D1 test bindings are correctly merged with the Wrangler config at runtime.
- The shipped cloudflare:test declaration defines applyD1Migrations(db: D1Database, migrations: D1Migration[], migrationsTableName?: string): Promise<void> and documents that readD1Migrations() supplies the migration array. The function signature is VERIFIED for the published 1.4.7 package declarations; runtime execution compatibility remains NOT VERIFIED.
- Exact Miniflare declarations define V4WorkerOptionsShape.d1Databases?: V4Namespace; V4Namespace = Record<string, string | V4IdEntry> | string[]; V4IdEntry = { id: string; remoteProxyConnectionString?: ... }. This confirms multiple named D1 namespace entries are representable in the pinned Miniflare type surface. It does not, by itself, prove the plugin's config merge behavior or isolation of an added binding.
- The Miniflare package manifest confirms its declaration entrypoint dist/src/index.d.ts and exact version 5.20261019.2-beta.

### Corrected gate assessment
- Published exact-version plugin and Miniflare declaration files: VERIFIED as retrieved through the exact-version CDN URLs.
- Plugin's applyD1Migrations declaration/signature: VERIFIED.
- Miniflare D1 namespace type supports multiple named entries: VERIFIED.
- npm tarball byte retrieval and independent SHA-512 recomputation: NOT VERIFIED.
- Effective wrangler + miniflare configuration merge for a second distinct local-only D1 binding: NOT VERIFIED.
- Actual second binding availability and no-remote behavior under pinned plugin runtime: NOT VERIFIED.
- applyD1Migrations execution under the repository's exact pinned Vitest/Workers runtime: NOT RUN.
- No code/config/package/fixture/migration/workflow changes. No test harness implemented. Migration 0011 NOT CREATED/APPLIED. Hosted D1 NOT RUN.

### Next bounded step
Use the confirmed exact type surface to construct a disposable, no-remote, second local D1 binding in an isolated test config, without touching the production POOL_DB binding or normal test setup. First add a minimal type/config smoke fixture and run it under the existing lockfile. Do not add migration 0011 until the second binding is observed as distinct, local-only, and compatible with applyD1Migrations at runtime. If the binding cannot be proven isolated, stop and document the exact blocker.