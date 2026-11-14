# Cloud Pool /next — A0 authority boundary audit — 2026-11-14

## Scope and immutable targets

Read-only audit of the current PR #67 A0 admission contract, its D1 ledger proof boundary, default-branch Supervisor/Worker integration, PR #68 architecture handoff and exact-head Actions evidence. No code, secrets, provider credentials, billing settings, hosted resources, dispatch controls, deployments, or production state were changed.

- Default branch `Основной`: `221f216c00ca7e5596bcc682ba185ad155a10603`.
- PR #67: `a53f6232bd5b50d3e150addf528b8e722002f9dd`, base default SHA above; OPEN/DRAFT/UNMERGED; 47 commits / 40 changed files.
- PR #68: `3fa24a79a1af1bdbf722aacdea367ffdbdf4a26d`, base default SHA above; OPEN/DRAFT/UNMERGED; 79 commits / 14 changed files.
- Formal reviews and inline threads: PR #67 0/0; PR #68 0/0.

## Exact-head CI

PR #67:
- Pool Contract Validation run [43600901063](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43600901063): COMPLETED/SUCCESS, job 132465223656.
- Isolated D1 Ledger Proof run [43600901068](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43600901068): COMPLETED/SUCCESS, job 132465223497.
- Log confirms 6 Vitest files / 84 tests passed; upgrade-binding smoke 1 passed; frozen schema-0010 fixture smoke 2 passed.
- A0 admission contract contributes 14 negative-first tests within the 84. These are mocked authority-adapter contract tests, not cryptographic issuer, hosted D1 or integration qualification.

PR #68:
- Pool Contract Validation run [43602306553](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43602306553): COMPLETED/SUCCESS, job 132469486334. Log confirms pinned Actions, fail-closed Supervisor, manual/read-only probes, 30 matrix records, dispatch disabled.
- Runner Resource Probe run [43602306555](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43602306555): COMPLETED/SUCCESS, job 132469486021. Read-only inventory: Ubuntu 24.04.5, AWS runner image 20261111.127.1, 4 vCPU, 88.46 GiB available workspace. The log explicitly says no agents installed, no secrets accessed and no profile qualified.
- These runs are exact-head evidence for PR #68 at `3fa24a79a1af1bdbf722aacdea367ffdbdf4a26d`; formal reviews remain 0.

## A0 source audit findings

Inspected:
- `proofs/d1-ledger/src/a0-admission-contract.mjs` blob `14c31d66995d6f99ceb6ea5df060ba8e00848464`.
- `proofs/d1-ledger/test/a0-admission-contract.test.ts` blob `0070fffdf0595b5ebd9edced0b0e92bebf3af38c`.
- `proofs/d1-ledger/src/consume.mjs` blob `f71e559a7c13b9a0242a7f619eba998c5906d95e`.
- `proofs/d1-ledger/src/claim-outbox.mjs` blob `37d75e2b31d9214b04398527eb08dce296f1ff27`.
- D1 migrations 0001–0005 and 0010; inert Worker entrypoint blob `214622f6dc94623521070eb9e7fbc2f573fdc2c6`.
- Default-branch `scripts/pool-supervisor.mjs` blob `52bf03ca889edd92fd10c71ae96a2e35e106d43f` and `.github/workflows/pool-worker.yml` blob `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`.

Confirmed gaps:
1. A0 module header explicitly says it is not wired to Supervisor or Worker. It depends on injected `verifyOwnerApproval`, `consumeSingleUseCapability`, and `verifyQuotaEvidence`; no production cryptographic issuer/verifier is implemented in the PR #67 changed-file set.
2. The A0 expected binding currently contains `taskId, attemptId, targetSha, profile, tenantId`, but not the repository numeric ID and issue number that the D1 approval ledger binds. The A0/D1 canonical identity contract needs explicit reconciliation before composition.
3. The A0 cost gate allows only `local` and `free_quota`, but the free-quota route check is a deny-list of three paid API IDs plus an injected quota verifier. This is not yet a production route-registry allowlist or proof of credential/account/quota-domain ownership and entitlement.
4. The D1 `consumeApproval` adapter atomically updates an already-existing `ready` approval row only when owner, repository, issue, target SHA, profile, envelope digest and expiry match. It is local-only, has no issuer, no cryptographic token verification, and is not mounted in the production Hono app.
5. The D1 Worker entrypoint is deliberately inert and returns 404. The default-branch Supervisor exits heartbeat-only when `POOL_DISPATCH_ENABLED` is not true. The default Worker workflow still uses Issue/label-based claim validation and has no A0/D1 integration.
6. The A0 success result is explicitly `ADMITTED_QUEUED` with `dispatch:false`. No task is actually sent to an executor by this contract.
7. Hosted D1 entitlement, durable hosted contention, trusted clock/issuer, production OAuth/session, deployed read-only Jarvis API, actual worker execution and A3 remain NOT VERIFIED / NOT RUN.

## Decision and next bounded pass

Do not expand agent count, turn on dispatch, or provision hosted state based on the local A0 tests. The next implementation must first define one canonical approval envelope across A0 and D1 (owner numeric ID, repository numeric ID, issue number, task ID/key, attempt ID, target SHA, profile, tenant, cost/route/quota domain, issued-at, expiry, nonce/jti, schema version and digest). Then select/reuse a mature signature-verification component compatible with the target Workers runtime, implement a trusted issuer/verifier boundary and atomically consume the single-use capability in the same D1 transaction that creates/attaches the logical task and outbox. Keep all outcomes queue-only and dispatch false. Before writing new cryptographic code, compare mature maintained GitHub components and verify license, release activity, runtime compatibility and test coverage.

No hosted database or issuer may be created until free entitlement and authority ownership are verified. Do not read secret values, dispatch Gemini/Claude, call providers, deploy, or merge draft PRs.

## Current disposition

- Local A0 contract tests: VERIFIED as isolated tests only.
- A0 cryptographic authority: NOT IMPLEMENTED.
- A0/D1 composition: NOT IMPLEMENTED.
- Hosted D1: NOT VERIFIED / NOT RUN.
- Real worker dispatch: NOT RUN; fail-closed.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md


## Post-documentation exact-head refresh — 2026-11-14

The previous audit updated the PR #68 documentation branch (master handoff and session log), which advanced PR #68's head. Re-fetched the live PR after those documentation commits; do not use the earlier `3fa24a79...` head as current.

- PR #68 current exact head: `a4c11582eaf66341eafeec60c3f670bc5e2e53f1`; base `221f216c00ca7e5596bcc682ba185ad155a10603`; OPEN/DRAFT/UNMERGED.
- Exact-head Pool Contract Validation run [43602453650](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43602453650): SUCCESS. Job 132469947494; workflow syntax/security invariants PASS, dispatch gate false, 30 matrix records PASS. Log includes a Node.js 20 deprecation warning for checkout forced to Node.js 24; track but not a current failure.
- Exact-head Runner Resource Probe run [43602453656](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43602453656): SUCCESS. Job 132469947531; Ubuntu 24.04.5 / AWS image 20261111.127.1 / 4 vCPU / 88.46 GiB available workspace; read-only, no agents installed, no secrets accessed, no profile qualified.
- PR #67 remains exact head `a53f6232bd5b50d3e150addf528b8e722002f9dd`, runs 43600901063/43600901068 SUCCESS; 84 tests in 6 files, D1 smoke checks passed. Both PRs still have zero formal reviews / zero inline threads.
- Mature-component discovery: `panva/jose` is a strong candidate for JWS/JWT signature verification: maintained v6 line, MIT, zero runtime dependencies, ESM, Cloudflare Workers/WebCrypto compatibility. This is only a candidate for a controlled local proof, not adopted or installed. It is a cryptographic protocol primitive, not an authorization framework; issuer governance, fixed algorithm allowlist, key rotation/JWKS trust, audience/issuer/subject, tenant/repository binding, clock policy, jti replay prevention, and atomic D1 consumption remain application responsibilities. Sources: https://github.com/panva/jose and https://github.com/panva/jose/security; package metadata surfaced v6.2.12 and JSR v6.2.17 (verify pinned version/tag and security policy before adoption).
- No code/dependency changed. No dispatch, provider calls, secret access, hosted resources, deployment, billing changes or merges. Contour A remains BLOCKED / NOT ACCEPTED; Contour B DEFERRED.
