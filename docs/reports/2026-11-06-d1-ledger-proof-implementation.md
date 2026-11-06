# D1 single-use ledger proof — implementation note

- Date: 2026-11-06
- Immutable target: `Основной` @ `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- Isolated implementation branch: `proof/d1-single-use-ledger-retry-2026-11-06`.
- Scope: local Workers-runtime D1 test proof only; no production integration.

## Implementation

- Added D1 migration for an approval ledger with immutable owner numeric ID, repository ID, issue number, target SHA, worker profile, envelope digest, expiry and one-way state.
- Added a conditional single-statement UPDATE consume adapter. It only reports `ALLOW_ONCE` when exactly one row changed. Every success still has `dispatch: false`.
- Added tests for 12 concurrent consumers, replay, all binding mismatches, expiry, malformed input, unavailable storage, ambiguous storage exceptions and D1 batch rollback.
- Added inert Worker entrypoint and pull-request-only CI with `contents: read`, pinned action SHAs, no secrets and no deployment.
- Exact direct dev dependency pins: `@cloudflare/vitest-plugin@1.4.7`, `vitest@4.1.12`.

## First CI attempt and correction

- Initial PR #35 run `42271255527` failed during Vitest config startup: plugin package did not export the `./config` subpath.
- The configuration was corrected to import `readD1Migrations` from the package public entrypoint, following Cloudflare's documented example.
- The first PR run's Pool Contract Validation `42271255356` succeeded. The D1 proof tests did not execute because config loading failed.
- PR #35 is superseded by this branch; a new PR is needed to obtain exact-head CI after the correction.

## Qualification limits

- No committed lockfile yet. CI generates a per-run lockfile and uploads it as a short-retention artifact. A reviewed lockfile must be committed before merge.
- D1 integration test results remain NOT VERIFIED until the corrected exact-head run completes.
- No account-specific Workers Free/card-free entitlement verified.
- No Cloudflare resources, billing, deployment, production Hono route, Supervisor/Worker, dispatch, provider calls or secrets touched.
- Independent review NOT RUN; merge NOT AUTHORIZED.

## Next

Open a new draft PR from this branch, wait for exact-head Workers-runtime D1 tests, inspect and commit the generated lockfile, then request independent security review.