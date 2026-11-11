# 2026-11-11 Experience OAuth / Session D1 Proof CI Audit

- Date: 2026-11-11
- Scope: PR #61 exact-head CI failure analysis and bounded test-harness correction.
- PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/61
- Immutable PR base: `c430fe4beecf93a20052f0c3efedb5f8539e4faa` (PR #52 proof head).
- Initial PR head: `7d30a55d8a90fb14f2516a57e458b0a660630499`.
- Corrected PR head after bounded fix: `7b018219cf220046a641d3811434014cc63421d4`.
- PR remains OPEN / DRAFT / UNMERGED, stacked on #52. No review submissions or inline threads.

## 1. Initial exact-head evidence

- Run `42984076534`, job `130400997089`: COMPLETED / FAILURE on exact head `7d30a55d8a90fb14f2516a57e458b0a660630499`.
- Checkout, Node/npm, lockfile install, static checks and existing API/policy tests all succeeded.
- Existing API/policy suite: 11/11 passed.
- Existing Workers/D1 suite: 8/8 passed.
- New Experience Auth suite: 6/6 failed in `beforeEach(reset)` because `oauth_transactions` did not exist.
- Job log root cause: `D1_ERROR: no such table: oauth_transactions`. The Vitest Workers integration did not automatically apply the custom `experience-auth-migrations` migration directory. The test harness configured the binding but lacked an explicit migration injection/application step.

## 2. Corrective change

Reused the official Cloudflare Workers Vitest D1 migration recipe rather than adding a custom migration runner:
- Cloudflare Vitest integration configuration documents `readD1Migrations()`, injecting migration data through a test-only binding, and applying it from a setup file using `applyD1Migrations()`: https://developers.cloudflare.com/workers/testing/vitest-integration/configuration/
- Official Cloudflare D1 Vitest fixture uses `applyD1Migrations` from `cloudflare:test` and `env` from `cloudflare:workers`: https://github.com/cloudflare/workers-sdk/blob/main/fixtures/vitest-pool-workers-examples/d1/test/apply-migrations.ts

Changes on PR #61 branch:
1. Added `tests/apply-experience-auth-migrations.js`, which calls `applyD1Migrations(env.EXPERIENCE_AUTH_DB, env.TEST_EXPERIENCE_AUTH_MIGRATIONS)`.
2. Updated `vitest.config.js` to load only `experience-auth-migrations` through `readD1Migrations`, inject it as `TEST_EXPERIENCE_AUTH_MIGRATIONS`, and run the setup file.
3. Updated the PR workflow path filters to include the setup file and `vitest.config.js`, ensuring changes to the migration harness retrigger CI.

Read-back verified:
- Setup file blob: `f285639081ce1fe9f5934cbdd6bd07bfd0507b42`.
- Vitest config blob: `31df299b8c0437ebcbceb69eb053819180531b11`.
- Workflow blob: `cecbba93a4ff33f2e10f157a808418b60502c9d0`.
- Corrected PR head: `7b018219cf220046a641d3811434014cc63421d4`.

## 3. Remaining qualification findings

- Corrected exact-head CI: NOT VERIFIED. At the time of this report, GitHub returned no workflow run or combined status for `7b018219cf220046a641d3811434014cc63421d4`.
- Independent security review: NOT RUN; formal reviews 0, inline threads 0.
- OAuth state/session logic remains a local synthetic proof only. PKCE envelope encryption/key custody and rotation are explicitly unqualified; owner allowlisting is separate; session rotation and global quota enforcement are absent.
- The adapter accepts caller-provided timestamps. This is a test seam and not a production trusted-time implementation.
- The PR remains stacked on unmerged PR #52; do not merge independently or treat this as a deployed login system.
- No OAuth app, secrets, production D1, routes, cookies, deployment, provider calls, dispatch or task mutation were performed.

## 4. Disposition

- Initial CI: FAILED for missing migration application.
- Harness correction: COMMITTED and read-back verified.
- Corrected exact-head CI: NOT VERIFIED / pending.
- PR #61: OPEN / DRAFT / UNMERGED.
- Production OAuth/session: NOT IMPLEMENTED / NOT QUALIFIED.
- Jarvis Web Experience authentication remains fail-closed.
- Contour A remains BLOCKED / NOT ACCEPTED; Contour B remains DEFERRED.

## 5. Next bounded step

Recheck exact-head CI on `7b018219cf220046a641d3811434014cc63421d4`. If the migration setup now passes, inspect all 6 Experience Auth tests and full suite results; then audit PKCE envelope lifecycle, bounded OAuth/session lifetimes, trusted time and owner-allowlist composition before any production route. If CI remains absent or fails, keep PR #61 draft and fail-closed.
