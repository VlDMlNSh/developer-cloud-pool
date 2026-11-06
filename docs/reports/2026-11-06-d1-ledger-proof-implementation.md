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


## Final current-head CI rerun — 2026-11-06

- Final proof branch HEAD: `3122c5da813e9aeb450e52e4de6e63e903578622`.
- D1 workflow run `42272226252` (run 11), job `128079410112`: COMPLETED / SUCCESS.
- Pool Contract Validation run `42272226037` (run 248): COMPLETED / SUCCESS.
- Workers Vitest: 1 file passed, 13/13 tests passed.
- The workflow now includes this qualification report in its path filter so report-only updates do not leave the proof CI stale.
- Final lock artifact: `13530245611`, GitHub archive digest `sha256:d5324c94f2cef9d55906c0d6e0319c5dd99bf967dc58b9cece98eb8dcee2b2af`, expires 2026-11-13.
- Downloaded and inspected exact-head lockfile: lockfileVersion 3, 160 packages, SHA-256 `73381e38dbec1ce06c8dcc79dc74b7b6c2008269713b632f6edb0ad18c8f31b0`; plugin 1.4.7, Vitest 4.1.12, Wrangler 4.152.0, Miniflare 5.20261019.2-beta. CI `npm ci` succeeded.
- The lockfile remains an artifact and is NOT committed. Independent security review remains NOT RUN. PR #36 remains draft / not merge-ready.
- This is local-only D1 runtime proof; no cloud resource, deployment, billing change, secret, provider call, dispatch or production integration.


## Follow-up engineering review — 2026-11-06

### Reproducibility artifact integrity

- Retrieved the exact lock artifact `13530006379` from the final successful run and inspected the ZIP contents.
- ZIP SHA-256: `92b2094bc1bc3d6734d7b6709ae58b235d9193245dde89ed9035072027b9d755`.
- Extracted `package-lock.json` SHA-256: `73381e38dbec1ce06c8dcc79dc74b7b6c2008269713b632f6edb0ad18c8f31b0`.
- LockfileVersion 3; 160 package entries; resolved versions match the previously recorded inventory.
- The bytes are verified locally, but this execution path does not provide a supported bridge to write the extracted binary-origin text file into the GitHub Contents API. Therefore the lockfile has NOT been committed; no substitute lockfile was generated or hand-reconstructed.

### Bounded source review (not independent security review)

Reviewed the current source files `consume.mjs`, `worker.mjs`, migration, tests, package manifest and workflow.

Positive observations:
- The consume operation is one conditional SQL UPDATE, binding approval ID, owner/repository IDs, issue, immutable target SHA, profile, envelope digest, ready state, unconsumed state and expiry.
- Only an explicit successful D1 result with exactly one changed row yields `ALLOW_ONCE`; all other outcomes deny.
- Storage exceptions fail closed; dispatch remains hard-coded false.
- Worker HTTP entrypoint is inert (404); no dispatch, provider, GitHub or secret capability is imported.
- CI has contents:read only, pinned action SHAs, checkout credentials disabled, no secrets and no deployment.

Unresolved security/production requirements (blocking; not covered by local proof):
1. This package does not authenticate the caller or establish owner identity. `ownerNumericId` is supplied as a binding field and is not independently derived from a verified GitHub identity.
2. It does not verify an owner-signed approval or prove the provenance of the ledger row. `approvalId` and `envelopeDigest` are matched, not cryptographically authenticated by this adapter.
3. The caller supplies `now`; production must use a trusted server-side clock, not caller-controlled time.
4. No issuance/revocation workflow, durable audit trail, quota reservation, backup/restore test or live account-limit test exists in this proof.
5. The allowlisted profile is a placeholder proof profile and must not be treated as an approved production executor.

Review classification: useful source-level engineering review only; NOT an independent security review and NOT production qualification.

### Current disposition

- Exact-head local Workers-runtime proof remains VERIFIED for `07f555788730f1d67acf3c11013e6d9c85894062`.
- Lockfile content and hashes are VERIFIED; repository commit of lockfile remains BLOCKED by file-transfer/write-path limitation in this session.
- PR #36 remains draft/open and NOT MERGE-READY.
- No cloud resources, deployment, billing changes, secrets, provider calls, GitHub dispatch or production integration.


## Latest exact-head verification after bounded review — 2026-11-06

- Final proof branch HEAD: `16b0bdfec24e761bdeac97936ff9409e7235be45`.
- Exact-head D1 run `42273219768`, job `128082853105`: COMPLETED / SUCCESS; `npm ci`, syntax check, Workers Vitest and artifact upload all succeeded.
- Test result: 1 file passed, 13/13 tests passed.
- Exact-head Pool Contract Validation run `42273219797`, job `128082854898`: COMPLETED / SUCCESS.
- Exact-head generated lock artifact `13531037391`; ZIP digest `sha256:d670f77af00728e2b1a170ff96f73e37d32931d6d89027d7f70ed082d2d3593e`; expires 2026-11-13. Previous downloaded artifact was inspected and its extracted lockfile hash was `73381e38dbec1ce06c8dcc79dc74b7b6c2008269713b632f6edb0ad18c8f31b0` with 160 packages. Current exact-head artifact exists and must be treated as the authoritative artifact if re-downloaded.
- Removed report-only path from workflow trigger. Report/checkpoint updates no longer recursively launch proof CI; code and workflow changes still trigger.
- PR #36 remains open/draft; 0 submitted reviews, 0 inline review threads. Independent security review NOT RUN.
- Lockfile remains NOT COMMITTED. Current tool path verified the artifact bytes locally but does not expose a supported file-to-GitHub-Contents transfer. No hand-built replacement was used.
- Local D1 proof VERIFIED for this exact head only. Source-level review is not independent review. Identity/issuer provenance, owner approval authenticity, trusted clock, issuance/revocation/audit, quotas, backup/restore, live account limits and production executor approval remain blockers.
- No D1 cloud resource, deployment, billing change, secret, provider call, dispatch or production integration.


## Latest branch-head proof and artifact verification — 2026-11-06

- Exact tested PR head: `2fbd3117249e9a6ef26192d08c14d85acbec5247`.
- D1 workflow run `42273436794`, job `128083592087`: COMPLETED / SUCCESS; `npm ci`, syntax check, Workers Vitest and artifact upload all passed.
- Workers Vitest: 1 file, 13/13 tests passed.
- Pool Contract Validation run `42273436799`, job `128083592438`: COMPLETED / SUCCESS.
- Exact-head lock artifact `13533100651`; ZIP SHA-256 `732a7389b7a11c126a01a7039729d91273eeb6e046dbc9d38be915b1389737fc`; downloaded and inspected. Extracted `package-lock.json` SHA-256 `73381e38dbec1ce06c8dcc79dc74b7b6c2008269713b632f6edb0ad18c8f31b0`; lockfileVersion 3; 160 packages. Resolved versions: plugin 1.4.7, Vitest 4.1.12, workerd 1.20261019.1, Miniflare 5.20261019.2-beta, Wrangler 4.152.0.
- Lockfile bytes and artifact provenance are verified but the lockfile remains NOT COMMITTED to the branch. No generated or manually reconstructed replacement was committed.
- PR #36 remains draft/open; review count 0; independent security review NOT RUN. The bounded source review is not a substitute for independent review.
- Production blockers remain: caller/owner identity, issuer and signed-approval provenance, trusted server clock, issuance/revocation/audit, quota accounting, backup/restore, live account limits and production executor approval.
- No cloud D1 resource, deployment, billing change, secret access, provider call, GitHub dispatch or production integration.


## Final PR-head verification after trigger cleanup — 2026-11-06

- Final PR head: `f340bd02bdfb045c3ba242ebe2581511b5a4b5c7` (27 commits ahead / 0 behind immutable base `197ba98d0dc7d8437d759dd25bee8750d02e59ae`).
- D1 workflow run `42273670730`, job `128084381636`: COMPLETED / SUCCESS; 13/13 Workers-runtime tests passed.
- Pool Contract Validation run `42273670766`, job `128084412944`: COMPLETED / SUCCESS.
- Exact-head lock artifact `13532516126`; ZIP SHA-256 `cdce1fe10af044e4481224c528cfbcd43b904a051354109782fd683d80f93dc8`; downloaded and inspected. Extracted `package-lock.json` SHA-256 `73381e38dbec1ce06c8dcc79dc74b7b6c2008269713b632f6edb0ad18c8f31b0`; lockfileVersion 3; 160 packages. Versions: plugin 1.4.7, Vitest 4.1.12, workerd 1.20261019.1, Miniflare 5.20261019.2-beta, Wrangler 4.152.0.
- The workflow no longer triggers on report-only changes; code and workflow changes still trigger. This avoids recursive documentation-triggered runs.
- Lockfile remains NOT COMMITTED. Verified artifact bytes are preserved, but no supported direct file-to-GitHub-Contents transfer was available. Do not merge while absent.
- PR #36 remains OPEN / DRAFT; 0 submitted reviews and 0 inline threads. Independent security review NOT RUN.
- Local proof VERIFIED for this PR head only. Production blockers and exclusions remain unchanged; no cloud resource, deployment, billing change, secret, provider call, dispatch or production integration.


## Current PR head qualification — 2026-11-06

- Exact current PR head at this check: `55c2817119bfd86fb3a19ac842de5af68901e064`.
- D1 workflow run `42274008085`, job `128085530286`: COMPLETED / SUCCESS; 13/13 Workers-runtime tests passed.
- Pool Contract Validation run `42274008111`, job `128085530690`: COMPLETED / SUCCESS.
- Exact-head lock artifact `13531517951`; ZIP SHA-256 `f5472244c7a94a26f0a1be94eca66caf7e9ad223d3187fa7e2516ff8c723241d`; downloaded and inspected. Extracted lockfile SHA-256 `73381e38dbec1ce06c8dcc79dc74b7b6c2008269713b632f6edb0ad18c8f31b0`; lockfileVersion 3; 160 package entries; dependency versions match earlier inventory.
- A verified copy of the exact package-lock is prepared for transfer to `proofs/d1-ledger/package-lock.json`; it is still NOT COMMITTED.
- PR #36 remains draft/open; no submitted reviews or inline threads. Independent security review NOT RUN.
- Production security gaps and exclusions remain unchanged. Local proof only; no cloud resource, deployment, billing change, secret access, provider call, dispatch or production integration.


## Latest exact-head result — 2026-11-06

- PR #36 head tested: `0584c3622a6f7207f62f27a33659e004e278b665`.
- D1 workflow run `42274157731`, job `128086045727`: COMPLETED / SUCCESS; Workers Vitest 13/13 tests passed.
- Pool Contract Validation run `42274157717`, job `128086045594`: COMPLETED / SUCCESS.
- Exact-head lock artifact `13531433351`; ZIP SHA-256 `8b28d83f36e8637f907955ee9bd4b20efa0c9a17af94926a4fb016e82bc14300`; downloaded and inspected. Extracted lockfile SHA-256 `73381e38dbec1ce06c8dcc79dc74b7b6c2008269713b632f6edb0ad18c8f31b0`, lockfileVersion 3, 160 packages; versions match the package inventory. A verified copy is prepared as `/mnt/data/package-lock.json`.
- Lockfile remains NOT COMMITTED. The exact bytes are prepared for a direct branch upload; the available GitHub Contents API action accepts text content but this execution environment does not expose the local artifact file as a text binding. No substitute lockfile was generated.
- PR #36 remains open/draft; 0 submitted reviews, 0 inline threads; independent security review NOT RUN.
- No cloud resources, deployment, billing changes, secret access, provider calls, dispatch or production integration. Production security blockers remain as listed above.


## Current exact-head rerun — 2026-11-06

- Exact tested PR head: `2cd330b7b2965840be15f5e7cd25de349e41ebb4`.
- D1 workflow run `42274318728`, job `128086595671`: COMPLETED / SUCCESS; 13/13 Workers-runtime tests passed.
- Pool Contract Validation run `42274318580`, job `128086594390`: COMPLETED / SUCCESS.
- Exact-head lock artifact `13531931790`; ZIP SHA-256 `8be02144fab30cffb59c8175c3c9b477a586097616afab39366097378f9abfa6`; downloaded and inspected. Extracted lockfile SHA-256 `73381e38dbec1ce06c8dcc79dc74b7b6c2008269713b632f6edb0ad18c8f31b0`; 160 package entries, lockfileVersion 3, resolved dependency inventory unchanged.
- The exact lockfile copy is prepared as `/mnt/data/package-lock.json`, but remains NOT COMMITTED.
- PR #36 remains open/draft; 0 reviews, 0 inline threads; independent security review NOT RUN.
- No cloud resources, deployment, billing changes, secrets, provider calls, dispatch or production integration. Production identity/provenance, trusted clock, issuance/revocation/audit, quotas, backup/restore, account entitlement and executor approval remain blockers.
