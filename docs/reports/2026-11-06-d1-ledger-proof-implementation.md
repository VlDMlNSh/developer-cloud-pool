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


## Latest exact-head qualification — 2026-11-06

- Latest proof branch HEAD: `a223386dd08a33a9b9a2cdfaaa19e4d8744eb602` (16 commits ahead / 0 behind immutable default baseline).
- Exact-head D1 workflow run `42271859222` (run 7): COMPLETED / SUCCESS.
- Exact-head D1 job `128078153536`: COMPLETED / SUCCESS; `npm run check` and Workers Vitest succeeded.
- Vitest: `test/consume.test.ts`, 13/13 tests passed; 1/1 test file passed.
- Exact-head Pool Contract Validation run `42271859290` (run 244): COMPLETED / SUCCESS; security invariant job `128078154302` passed.
- Lock artifact for exact head: artifact `13529083485`, name `d1-ledger-proof-package-lock`, GitHub archive digest `sha256:2acf14b203cef11508e0f4143e4662d9c30228cbffcb80e0b382dbdeb335d5d1`, expires 2026-11-13.
- Downloaded and inspected the lockfile inside the artifact: lockfileVersion 3, 160 package entries, lockfile SHA-256 `73381e38dbec1ce06c8dcc79dc74b7b6c2008269713b632f6edb0ad18c8f31b0`. Resolved packages: `@cloudflare/vitest-plugin@1.4.7`, `vitest@4.1.12`, `workerd@1.20261019.1`, `miniflare@5.20261019.2-beta`, `wrangler@4.152.0`. The workflow's `npm ci` completed successfully against this generated lock.
- The lockfile remains an artifact, not a committed repository file. It has been inspected for package versions and hash but still must be committed/reviewed before merge.
- PR #36 has zero submitted reviews and zero inline review threads; independent security review NOT RUN. PR remains draft / not merge-ready.
- No Cloudflare D1 database, Worker deployment, billing change, secret access, dispatch, provider call or production integration occurred. Workers Free/card-free entitlement remains NOT VERIFIED.
- Local D1 runtime proof: VERIFIED for exact tested SHA `a223386dd08a33a9b9a2cdfaaa19e4d8744eb602`. Production qualification and Contour A acceptance remain NOT VERIFIED / BLOCKED.
