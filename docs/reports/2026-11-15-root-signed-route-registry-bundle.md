# Root-signed Qualified Route Registry bundle proof — 2026-11-15

## Outcome

Added an isolated root-signed registry-bundle verifier on a dedicated branch stacked on PR #75. Exact-head CI is successful. This proves cryptographic bundle authenticity against a configured platform public-key binding; it does not persist or operationally qualify a trusted registry.

## Immutable target and ancestry

- Default branch `Основной` snapshot: `89ff1917b809cd8ed3fc68031c79d0907775046b`.
- Base PR #75 exact head: `f253f68194e65912a91c91f2d158525b97927749`.
- PR #76: https://github.com/VlDMlNSh/developer-cloud-pool/pull/76
- Branch: `proof/root-signed-route-registry-bundle-2026-11-15`.
- Exact PR #76 HEAD: `096737ec5e1a335b367fc7af67c29f7b71541e66`.
- PR #76 OPEN / DRAFT / UNMERGED; base PR #75; API reports mergeable=true relative to that base.
- Default → PR #76 is DIVERGED 89 ahead / 55 behind at the immutable default snapshot above. This is a stacked proof branch, not a merge candidate.

## Changed files and blobs

1. `proofs/d1-ledger/src/trusted-route-registry.mjs` — `9e837c44ed50329930bb393b3bc45bd6cd0f729b`.
2. `proofs/d1-ledger/test/trusted-route-registry.test.ts` — `c7876cdc3b3eff39060d44e2890266374f54da4a`.
3. `proofs/d1-ledger/package.json` — `334011c6b7db5c92cc4c43256d3b43115833b5a9`.
4. `.github/workflows/d1-ledger-proof-validation.yml` — `415d20eb93a34eb231efb3c8f798faa792c1e412`.
5. `proofs/d1-ledger/README.md` — `9fae34fdea63b69784444a359046f8518b81735d`.
6. `docs/contracts/ROOT-SIGNED-ROUTE-REGISTRY-BUNDLE-V1.md` — `e85b664e5d87f54e01a8f78454b4a7b7f29e50a5`.

## Implemented contract

- Root key ID and public JWK are loaded from platform environment bindings `ROUTE_REGISTRY_ROOT_KEY_ID` and `ROUTE_REGISTRY_ROOT_PUBLIC_JWK`; the request and registry bundle cannot supply or override the root key.
- Fixed-position UTF-8 JSON canonical bundle v1, exact field allowlists and ordered unique issuer/route records.
- Root detached ES256 signature authenticates the complete issuer-key set, route evidence and issuer signatures.
- Each route evidence signature is independently verified against the corresponding issuer key in the root-signed bundle.
- Registry age max 300 seconds; lifetime max one hour; maximum 64 issuer keys, 256 routes, 512 KiB canonical bundle and 128 characters per route signature.
- The immutable verified result always sets `dispatch:false`.
- No new dependency. GitHub source discovery reviewed the mature `panva/jose` project; the isolated Worker-runtime proof uses built-in WebCrypto ES256 directly and avoids introducing a dependency for the narrow signature-verification operation.

## Exact-head CI evidence

- Workflow: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43697493628
- Run ID `43697493628`; job ID `132761164474`.
- COMPLETED / SUCCESS at exact HEAD `096737ec5e1a335b367fc7af67c29f7b71541e66`.
- Syntax checks PASS.
- Workers-runtime tests: 114 passed / 0 failed across 9 test files; 11 registry-bundle tests and 10 route-evidence tests included.
- Isolated second D1 binding / migration API smoke PASS.
- Frozen schema-0010 fixture smoke PASS.
- Lockfile artifact: `d1-ledger-proof-package-lock`, artifact ID `14155271322`, 18,253 bytes.
- Exact-head Check Run successful. Combined commit-status contexts remain 0 / pending; required status contexts NOT VERIFIED.
- No independent review recorded for PR #76.

## Critical limits — still NOT QUALIFIED

The verifier authenticates one registry bundle against a public key supplied by platform environment configuration. This proof does not qualify the integrity/permissions of deployment configuration and does not configure a production root key. It does NOT:
- persist accepted registry snapshots or issuer keys in D1;
- enforce monotonic registry epochs across requests;
- prevent durable replay/rollback against an authoritative watermark;
- implement root-key custody, dual-control rotation or authenticated root rotation;
- implement an append-only issuer-key/revocation writer;
- atomically re-check registry epoch, issuer key ID and revocation watermark in the same D1 batch as approval consumption;
- wire the root-verified result into `admitQualifiedTask`;
- prove provider account identity, credential ownership or live quota.

Therefore Qualified Route Evidence remains NOT QUALIFIED. Do not pass this verifier result into production admission.

## Current pool PR / governance snapshot

- PR #67 OPEN / DRAFT / UNMERGED, head `a53f6232bd5b50d3e150addf528b8e722002f9dd`; default comparison DIVERGED 47 ahead / 55 behind.
- PR #72 OPEN / DRAFT / UNMERGED, head `a391f5c9b08c7ccfc12d966bf8e085c1966bfb31`; default comparison DIVERGED 67 ahead / 55 behind.
- PR #74 OPEN / DRAFT / UNMERGED, head `ebcdaeb3421889be0b710a4b6b6e83deeafa0144`; default comparison DIVERGED 1 ahead / 10 behind.
- PR #75 OPEN / DRAFT / UNMERGED, head `f253f68194e65912a91c91f2d158525b97927749`; default comparison DIVERGED 72 ahead / 55 behind.
- PR #76 OPEN / DRAFT / UNMERGED, head `096737ec5e1a335b367fc7af67c29f7b71541e66`; default comparison DIVERGED 89 ahead / 55 behind.
- All five PRs are stacked or independently based as recorded in their PR metadata; do not merge complete divergent stacks.
- Issue #70 remains OPEN.
- Active ruleset `26550182` applies only to default branch; it requires PR and review-thread resolution, but zero approving reviews and no required status contexts. Branch-protection endpoint remains NOT VERIFIED (403). PR #76 has zero independent reviews and zero combined commit-status contexts.

## Executor / dispatch boundary

- MediaHub controller-fix PR #434 is CLOSED / UNMERGED. The controller bridge remains NOT QUALIFIED; no owner `/next` comment was posted and no Gemini dispatch was triggered.
- MediaHub PRs #635/#636/#637 are open but their recorded PR-triggered workflow runs are `action_required`; no formal reviews are recorded. They are not used as independent acceptance evidence.
- SentinelX currently reports zero connected hosts. Voktors-Mini is offline; mh-dev-01 and mh-dev-02 are user-disabled. The required third/Alamo host is not positively identified or online. Claude Code NOT RUN.
- No provider login/call, secret access, hosted D1, Worker deployment, dispatch, executor qualification, merge or independent audit occurred. Independent audit remains deferred until the pool is operational, per project decision.

## Next bounded step

Implement an append-only D1 registry snapshot and issuer-key lifecycle, including a monotonic singleton registry watermark and conditional CAS update. Extend the A0→D1 batch so it checks the exact current registry epoch, issuer key ID and revocation watermark in the same D1 consistency boundary as approval consumption, admission, outbox binding and receipt. Add concurrency tests for stale registry import, revocation racing admission, epoch rollback, key rotation and transaction rollback. Do not wire untrusted snapshots into admission. Keep dispatch false.

Status: root-signed registry bundle verifier IMPLEMENTED / exact-head CI VERIFIED; durable trusted registry NOT IMPLEMENTED; Qualified Route Evidence NOT QUALIFIED; Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
