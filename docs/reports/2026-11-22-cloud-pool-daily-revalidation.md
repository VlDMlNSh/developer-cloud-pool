# Cloud Development Pool — daily revalidation and Pass 41 preflight

Date/time: 2026-11-22 19:36:36 Europe/Vilnius  
Audit status: SUCCEEDED (read-only GitHub revalidation, bounded static source review, documentation-only publication)  
Contour A: BLOCKED / NOT ACCEPTED  
Contour B: DEFERRED

## 1. Immutable repository baseline

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch: Основной
- Default HEAD: 81baadbb5944e11ed41a64bd0190bf2c8edd0c41
- Repository is public and not archived.
- Previous observed default HEAD: 7e76bd2ebba5e3a27ccd32ecf7f52c2d10178250.
- GitHub compare reports 4 commits ahead / 0 behind from the previous baseline. The delta is documentation-only: docs/context/GITHUB-CONTEXT-WINDOW.md and docs/reports/2026-11-22-pass38-exact-head-ci-reconciliation-replay-correction.md.
- Current default HEAD commit message: “docs: close Pass 38 in GitHub Context Window”; parent 9a3aa67c87bceaf7c6b40016953c1676d7cdc5d4. Commit verification reports unsigned. No rule currently requires signed commits, but signed provenance is not established for this HEAD.
- Default combined commit-status response is empty: CI NOT VERIFIED.

## 2. Issues and PR inventory

GitHub search returned 15 open Issues and 100 open-PR results on the first page; the total open-PR count beyond that page is NOT VERIFIED.

Priority Issues:
- #1 Governance — OPEN.
- #22 protected read-only web console — OPEN.
- #26 account-isolated routing and quota ledger — OPEN.
- #94 Cloud Pool-native Gemini controller — OPEN.
- #96 owner-only /next admission control issue — OPEN.
- #140 current-base D1 admission/lease proof chain — OPEN.

Other open Issues returned: #151, #133, #137, #115, #118, #70, #38, #21 and #5.

### Governance / Issue #1

Direct read of repository ruleset 26550182 confirms:
- enforcement active; exact selector refs/heads/Основной;
- pull request required;
- deletion and non-fast-forward prohibited;
- review-thread resolution required;
- required approving reviews = 0;
- CODEOWNERS review disabled;
- last-push approval disabled;
- extra approval for unattributed changes disabled;
- bypass actor list empty; current-user bypass = never.

The ruleset is active but does not enforce an independent approval. Issue #1 remains OPEN. The repository variable POOL_DISPATCH_ENABLED could not be read through the available read-only integration; its current value is NOT VERIFIED. No variable, secret or ruleset was changed.

### Issues #22 and #26

Both remain OPEN. The complete current default-branch tree contains 69 entries and is not truncated. It contains no web application directory, no D1 ledger package and no Gemini controller implementation. The web-console prototype remains on draft PR #25 and is fail-closed: protected reads return 503, mutations return 405; OAuth/session runtime and deployment are not implemented. Account-isolated provider routing and quota enforcement are not present on default. No provider calls or credential reads were performed.

## 3. Priority PRs, branches, exact-head CI and reviews

All PRs below remain OPEN / DRAFT / UNMERGED. GitHub mergeable=true is metadata only, not acceptance.

| PR | Head SHA | Ahead / behind current default | Exact-head associated runs |
|---|---|---:|---|
| #24 | 7d3a34a1956c6a793f0bcc05ffaaf76c65c416e3 | 62 / 153 | Contract and OpenAPI SUCCESS |
| #25 | 8f0c0c57cf24d476a27d456e80ffd1d8ced7ab85 | 29 / 153 | Contract and Hono prototype SUCCESS |
| #30 | ad9f9ac598a2414b5209b6923094b16be64630ae | 35 / 153 | no associated run returned — NOT VERIFIED |
| #31 | 5470fccbc4a5fe80a750f402d70d703757fc4c1d | 36 / 153 | Hono prototype SUCCESS |
| #145 | 721dd06d7b36c0356d9d54306de70906ec11dce8 | 119 / 7 | no associated run returned — NOT VERIFIED |
| #165 | 80dcd602a86ab6df58fb144ecdffaa6266cb9cf0 | 93 / 7 | D1 and Pool Contract SUCCESS; merge-result evidence |
| #167 | c3c48891982d4868f97c328369a9e244cf7b7146 | 7 / 0 | no associated run returned — NOT VERIFIED |

Exact run/job evidence:
- #24: Contract run 42982847600 / job 130397061861 SUCCESS; OpenAPI run 42982847694 / job 130397062519 SUCCESS.
- #25: Contract run 42228269689 / job 127927220340 SUCCESS; Hono run 42228269676 / job 127927219846 SUCCESS.
- #30: exact-head workflow lookup empty. Treat CI as NOT VERIFIED.
- #31: Hono run 42229917555 / job 127932882432 SUCCESS.
- #165: D1 run 45032534259 / job 137239043125 SUCCESS; Pool Contract run 45032534262 / job 137239043235 SUCCESS. The run API associates both with head 80dcd602a86ab6df58fb144ecdffaa6266cb9cf0, but the prior job-log inspection records a merge-result checkout (8ab5a07) against the frozen base. Therefore this is PR merge-result CI, not standalone head-only qualification.
- #167: no exact-head run returned; CI NOT VERIFIED.

Review state:
- PRs #24, #25, #30, #31, #145 and #167: zero formal reviews and zero inline threads.
- PR #165: one COMMENTED review, ID 6012744917, authored by repository owner VlDMlNSh; zero approvals and zero inline threads. It is not independent third-party review.
- PR #166 is a validation-only draft for the same Pass 36 head; PR #164 is validation-only for Pass 35. Neither is an acceptance substitute.

## 4. GitHub Read Adapter path-segment fix

Branch fix/github-read-adapter-path-segments-2026-11-06 remains at dee17350864cb49e8c5dd41cf61859d77d3affca, 38 ahead / 153 behind current default. It has no PR and no associated exact-head workflow run. Source blob 9f4f9e5918e1c84fc8ad4b4f1369a92207394c63 and test blob bd8ac8d97cdd673bb170a22d67ce08697cf46789 were previously read; no test execution is established. Do not transplant the 19-file stale branch. If needed, isolate only the narrow path-segment fix on a clean current-default branch and verify its tests.

## 5. Executor/controller and runtime boundary

Read-only inspection of current default files:
- .github/workflows/pool-supervisor.yml blob 3942189fc338b73b39627706ea001e1b87dc0ed8: scheduled heartbeat only; contents permission is read-only; it reads the POOL_DISPATCH_ENABLED variable into the environment.
- scripts/pool-supervisor.mjs blob 2ae99f9efe1f59b22cfac1f5bf4780148228a233: if the legacy dispatch variable is true, it exits with LEGACY_LABEL_DISPATCH_RETIRED; otherwise it emits a heartbeat-only summary and performs no API call or dispatch.
- .github/workflows/pool-worker.yml blob 6833692c45bbb0b6f7bf31c068a30888c53f5471: manual workflow_dispatch only, no permissions, always fails closed because the legacy DSH worker is retired.

The current workflow-run collection endpoints were not available through the connected read interface; live heartbeat freshness and actual runtime state are NOT VERIFIED. No workflow was started. Gemini controller is absent from the complete default tree. No qualified Worker, Gemini executor or production provider route is established.

## 6. Pass 41 bounded static trust-seam review

Immutable target: PR #165 head 80dcd602a86ab6df58fb144ecdffaa6266cb9cf0; frozen base 83b8e9d3b0bdeeb201e24a7a9d2fe042fb00694a.

Read-back source blobs:
- proofs/d1-ledger/package.json: d970b887f52eb1011e3df74b560ad9a35bb25866.
- proofs/d1-ledger/src/record-attempt-reconciliation.mjs: fe4102eae2038b98be3220bb2961fa433bb9b4b0.
- proofs/d1-ledger/migrations/0015_issuer_bound_reconciliation_decisions.sql: 442db58f7c6ff0463e9a391572a1e45ebccc7df3.
- proofs/d1-ledger/test/reconciliation.test.ts: b6cb31bd7e33e5934c005b3268b44de8792e5597.

The package manifest contains only Vitest and the Cloudflare Vitest plugin as development dependencies; jose is not installed. The reconciliation adapter still accepts injected verifyEvidence and trustedClock functions. It does not contain a production OIDC/JWKS verifier or trusted issuer registry.

### New source-level finding: verification-time TOCTOU window

In record-attempt-reconciliation.mjs:
- lines 113–119 sample trustedNow before verification;
- lines 123–128 await verifyEvidence and pass that earlier timestamp;
- line 132 normalizes expiry/observation claims against the same earlier timestamp;
- the insert stores that timestamp as verified_at.

If the production verifier resolves a remote JWKS asynchronously and validates against the supplied pre-fetch time, a token that expires during the JWKS fetch could pass the adapter's subsequent checks. The current interface does not prove that a fresh trusted time is checked after verification. This is a design-level blocker to production integration, not evidence of a deployed exploit: the package is not mounted in the product runtime.

Required correction before integration:
1. Keep the issuer verifier private to a trusted server-side composition root; never accept verifier/configuration from request input.
2. Re-read the trusted clock after cryptographic verification and reject clock rollback/unavailable time.
3. Revalidate exp/iat/nbf and the bounded token lifetime against the post-verification time; store that post-verification value as verified_at.
4. Add a deterministic test where a fake asynchronous verifier advances time across exp, plus clock rollback, not-before, timeout and JWKS failure cases.

### Upstream JOSE API contract rechecked

- panva/jose v6.2.18 release published 2026-11-18; MIT, ESM and Cloudflare Workers-compatible package metadata. Release: https://github.com/panva/jose/releases/tag/v6.2.18
- jwtVerify options document explicit algorithms, issuer, audience, clockTolerance, currentDate, maxTokenAge and typ: https://github.com/panva/jose/blob/v6.2.18/docs/jwt/verify/interfaces/JWTVerifyOptions.md
- Remote JWKS options document customFetch, cacheMaxAge, cooldownDuration and timeoutDuration: https://github.com/panva/jose/blob/v6.2.18/docs/jwks/remote/interfaces/RemoteJWKSetOptions.md
- createRemoteJWKSet documents key selection by alg/kid/use/key_ops and cooldown-limited refresh: https://github.com/panva/jose/blob/v6.2.18/docs/jwks/remote/functions/createRemoteJWKSet.md

The future adapter must use a fixed server-owned HTTPS JWKS URL, explicit algorithm allowlist, exact issuer/audience, required token profile/claims, bounded lifetime and clock tolerance. Its fetch policy must reject redirects and unexpected origins, enforce timeout/response-size limits, and define cache invalidation and emergency key revocation. Never derive issuer discovery or JWKS URLs from token claims. Keep Pool capability and task/attempt/generation binding checks after cryptographic verification.

Pass 41 result: static source review VERIFIED; code change NOT RUN; tests NOT RUN; production verifier NOT IMPLEMENTED; runtime NOT QUALIFIED.

## 7. Actions and non-actions

Completed:
- Read current documentation Context Window, Pass 39/40 checkpoint, Pass 39 source-review report and Pass 40 JOSE/JWKS report.
- Re-read current GitHub repository metadata, default ref/commit, complete default tree, priority Issues, open PR inventory, target PR metadata, branch comparisons, workflow runs/jobs, review submissions, ruleset details and selected source files.
- Rechecked official jose v6.2.18 release and API documentation.
- Completed one bounded static security review and identified the pre-verification clock sampling gap.

Not performed:
- No code, schema, runtime or security-boundary changes.
- No tests or workflows started.
- No dispatch, agents, DSH, Resource Probe, provider/model calls, hosted D1, deployment, production writes, merge, secret/token/API-key reads, or variable/ruleset changes.

Documentation is published only on working branch docs/pass39-reconciliation-review-2026-11-22. It is not canonical and must not be merged without provenance review, exact-head CI, effective protections and independent approval.

## 8. Next bounded step

Pass 42: create a test-only, no-secret verifier prototype around pinned jose, after confirming the existing package toolchain. Use deterministic synthetic keys/JWKS and a custom fetch harness; cover signature, issuer/audience, algorithm, exp/nbf/iat, delayed JWKS fetch crossing exp, JTI replay, key rollover/revocation with warm cache, redirect, timeout, oversized/malformed JWKS and unavailable trust configuration. Run only local tests if a local environment is available; do not trigger GitHub workflows. Do not mount the verifier in Worker/Supervisor or authorize retry/dispatch. Keep PR #165 Draft until independent review.

Contour A remains BLOCKED / NOT ACCEPTED. Contour B remains DEFERRED.
