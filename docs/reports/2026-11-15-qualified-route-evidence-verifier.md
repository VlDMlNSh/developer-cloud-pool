# Qualified Route Evidence verifier proof — 2026-11-15

## Outcome

Implemented an isolated canonical evidence and detached ES256 verifier on a dedicated branch stacked on the existing atomic A0→D1 proof. Exact-head CI is successful. This is a cryptographic component proof, not production route qualification.

## Immutable target and change set

- Default branch snapshot at start of this pass: `Основной` @ `3f3d4a25024f6d3475f16c46bee383c174b5756c`.
- Base branch: `proof/atomic-a0-d1-admission-2026-11-15` @ `a391f5c9b08c7ccfc12d966bf8e085c1966bfb31`.
- Feature branch: `proof/qualified-route-evidence-verifier-2026-11-15`.
- PR #75: https://github.com/VlDMlNSh/developer-cloud-pool/pull/75
- Exact feature HEAD: `f253f68194e65912a91c91f2d158525b97927749`.
- PR #75 is OPEN / DRAFT / UNMERGED; base exact SHA is the A0→D1 PR #72 head above.

Five changed paths:
1. `proofs/d1-ledger/src/qualified-route-evidence.mjs` — blob `0d5b97ad0bc59173fe8c4c7de28c67965bd09ad0`.
2. `proofs/d1-ledger/test/qualified-route-evidence.test.ts` — blob `7624eedcb13884982ae434819e50882163de4cff`.
3. `proofs/d1-ledger/package.json` — blob `e7f9e9967032e94f4d15a1008353e558375a6d52`.
4. `.github/workflows/d1-ledger-proof-validation.yml` — blob `9e40f72298bf07dd7928154eba75b28033ac2ec6`.
5. `proofs/d1-ledger/README.md` — blob `b1d2b092bc9df9d0a0ce2addd64d24f839d8754c`.

## Implemented contract

- Schema v1 exact allowlist; unknown evidence fields fail closed.
- Canonical bytes are UTF-8 JSON for a fixed-position array prefixed by `qualified-route-evidence-v1`; explicit JSON null represents absent quota domain.
- SHA-256 digest has a fixed test vector: `3d409b69df838b6ba0826a950c7d43940b5127aba25fc320b192d9c2b33d43da`.
- Detached ES256 signature verification: ECDSA P-256 / SHA-256 via WebCrypto, with canonical base64url 64-byte signature encoding.
- Exact matching against supplied trusted-route and trusted-issuer snapshots: issuer/key ID, provider, model, accountRef, credentialHandleRef, quotaDomainId, costClass, capability, registry version and revocation version.
- Evidence maximum age is 300 seconds; future observation, expired evidence, expired issuer key, inactive/revoked issuer, route revocation and version mismatch deny.
- The verifier returns an immutable typed success result with the computed evidence digest and `dispatch:false`.

Ten new adversarial tests cover canonical byte/digest vector, valid signature, signature mutation, issuer substitution, key ID mismatch, cross-account replay, cross-quota-domain replay, stale/expired evidence, revocation/watermark mismatch, unknown unsigned fields, missing free-quota domain, and expired issuer key. (The test file has 10 test cases; some cases exercise more than one adversarial binding.)

## Exact-head CI evidence

- Workflow run: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43694628561
- Run ID: `43694628561`; job ID: `132752333196`.
- COMPLETED / SUCCESS at exact feature HEAD `f253f68194e65912a91c91f2d158525b97927749`.
- Syntax checks PASS.
- Workers-runtime suite: 103 passed / 0 failed (includes the 10 new verifier tests).
- Isolated second D1 binding / migration API smoke PASS.
- Frozen schema-0010 fixture smoke PASS.
- Lockfile artifact uploaded: `d1-ledger-proof-package-lock`, artifact ID `14153962592`, size 18,253 bytes.
- GitHub check-runs endpoint returned successful check runs at the exact head. Combined commit-status contexts: 0; required status contexts remain NOT VERIFIED.
- No independent review is recorded.

## Trust boundary and blockers

The verifier receives `trustedRoute` and `trustedIssuer` snapshots as explicit inputs. It verifies their schema, exact binding and cryptographic consistency, but cannot prove that the caller obtained them from an authoritative trust root. This is intentional: a caller-supplied key/registry must not be misrepresented as trusted merely because its signature verifies.

Not implemented / not qualified:
- Pinned, access-controlled issuer trust root and trusted registry loader.
- Issuer key custody, authenticated registry updates and secure key rotation.
- Durable authoritative revocation store and monotonic version writer.
- Atomic D1 re-check of registry/key/revocation version in the same consistency boundary as approval consumption and admission.
- Integration of verifier output into `admitQualifiedTask`.
- Live provider identity, account and quota validation.

No provider login/call, secret access, hosted D1, Worker deployment, executor qualification, dispatch or merge occurred. Synthetic test keys are ephemeral test material only. Dispatch remains disabled.

## Current ancestry / governance snapshot

- At immutable default snapshot `3f3d4a25024f6d3475f16c46bee383c174b5756c`: default → PR #72 was DIVERGED 67 ahead / 50 behind; default → PR #74 was DIVERGED 1 ahead / 5 behind; default → PR #75 was DIVERGED 72 ahead / 50 behind (PR #75 is stacked on #72).
- PR #75 API reports mergeable=true relative to its declared base PR #72; it remains Draft and unmerged.
- Active ruleset `26550182` applies only to default branch; required approving reviews = 0 and no required status contexts are configured. Branch protection API returns 403; further details NOT VERIFIED.
- No independent review on PR #75. Independent audit remains deferred until the pool is operational, per project decision.

## Next bounded step

Implement a trusted registry source and versioned issuer/key lifecycle, then make the D1 admission batch compare the verified evidence digest and exact registry/revocation watermark against that authority under one transaction boundary. Add adversarial key-rotation/revocation-race and rollback tests. Do not wire untrusted snapshots into admission. Keep dispatch disabled. No merge until exact-head CI and governance requirements are evidenced.

Status: verifier component IMPLEMENTED / exact-head CI VERIFIED; trust root and durable registry NOT IMPLEMENTED; Qualified Route Evidence NOT QUALIFIED; Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
