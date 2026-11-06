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

## CI failures and corrections

- PR #35 run `42271358694` (job `128076447530`) failed before test discovery because the config imported `readD1Migrations` from an unsupported `@cloudflare/vitest-plugin/config` subpath. The import was changed to the documented package public entrypoint.
- PR #36 run `42271502211` (job `128076937313`) then failed before test discovery because `compatibility_date: 2026-11-06` exceeded the bundled workerd server's supported date `2026-10-26`. No D1 assertions ran; this is a runtime/configuration compatibility failure, not a failing ledger assertion.
- Corrected `proofs/d1-ledger/wrangler.jsonc` to `compatibility_date: 2026-10-26` in commit `38748cac9d2f6464995459b45db9e4f97d07d755`.
- Both failed D1 attempts had successful Pool Contract Validation jobs. Exact-head D1 proof remains NOT VERIFIED until the next run completes.
- PR #35 is superseded/closed. PR #36 remains the active review path.

## Qualification limits

- No committed lockfile yet. CI generates a per-run lockfile and uploads it as a short-retention artifact. A reviewed lockfile must be committed before merge.
- D1 integration test results remain NOT VERIFIED until the corrected exact-head run completes.
- No account-specific Workers Free/card-free entitlement verified.
- No Cloudflare resources, billing, deployment, production Hono route, Supervisor/Worker, dispatch, provider calls or secrets touched.
- Independent review NOT RUN; merge NOT AUTHORIZED.

## Next

Open a new draft PR from this branch, wait for exact-head Workers-runtime D1 tests, inspect and commit the generated lockfile, then request independent security review.

## Corrected exact-head CI evidence

- The first run on superseded PR #35 failed before tests because the Wrangler compatibility date exceeded the pinned workerd runtime's supported date. That PR was closed, not merged.
- Corrected the local-only Wrangler compatibility date to `2026-10-26`, the maximum supported by the resolved workerd binary `1.20261019.1`.
- Superseding Draft PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/36
- Exact tested branch HEAD: `38748cac9d2f6464995459b45db9e4f97d07d755`.
- D1 workflow run: `42271632317` — COMPLETED / SUCCESS.
- D1 job: `128077381562` — COMPLETED / SUCCESS.
- Pool Contract Validation run: `42271632320` — COMPLETED / SUCCESS.
- Vitest output: 1 test file passed; 13 tests passed; duration 840 ms.
- Covered: 12 concurrent contenders / exactly one winner; replay; owner/repository/issue/SHA/profile/envelope mismatches; expiry; malformed binding; unavailable storage; ambiguous storage exception; D1 batch rollback.
- Generated dependency lock artifact: `d1-ledger-proof-package-lock`, artifact ID `13531380206`, ZIP SHA-256 `4e8fcea9dda6887e480169456d1770527eba2357997fe834876f632075b08f4a`, expires 2026-11-13.
- Lock artifact inspection: 160 package entries; direct pins plugin 1.4.7 and Vitest 4.1.12; resolved workerd 1.20261019.1, Miniflare 5.20261019.2-beta, Wrangler 4.152.0. Plugin peer range accepts Vitest ^4.1.0 or ^5.0.0.
- Dependency lockfile is not committed. Artifact review is possible, but PR remains NOT MERGE-READY until the lockfile is committed and reviewed. No artifact content was copied into the repository.
- PR #36 reviews: 0; inline review threads: 0; independent security review NOT RUN.
- Successful local D1 proof is not production qualification and does not prove account-specific Workers Free/card-free entitlement, caller identity, owner approval provenance, quotas under live account limits, backup/restore or deployment.
