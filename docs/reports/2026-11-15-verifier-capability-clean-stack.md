# 2026-11-15 — verifier capability boundary on clean A0→D1 stack

## Objective

Reconcile the root-signed registry persistence authority into the clean D1 proof stack based on the current default branch and the exact-replay hardening in PR #92.

## Immutable provenance

- Default branch `Основной`: `9dbb7a37c3f8601d2b0d7eafd774d2b613bbaecc`.
- Clean proof PR #87: `8cc7b12948865bb0e13ce099386c09f3ae32b4f5`, OPEN/DRAFT/UNMERGED.
- Exact-replay PR #92: `7014961587759b27d2ef6e91c60ce098d077ae83`, OPEN/DRAFT/UNMERGED.
- Capability-boundary PR #93: `99ca50ce11efb380efa6346a1db672585876a8b1`, OPEN/DRAFT/UNMERGED; base is PR #92 head.
- PR #93 branch is four commits ahead / zero behind its declared PR #92 base.
- PR #93 changed blobs: verifier/persistence `916581ca07cf94edb21c8c2daa77a4c45db3d666`; adversarial tests `5736c308e41a0999209702a25eb8341f1f16c4dc`; D1 workflow `60b718775478b0956bed36988643f0a5695ddd1e`.

## Finding and correction

The clean PR #87/#92 stack contained the root-signed registry verifier and D1 writer, but its persistence API accepted caller-supplied `bundle`, `signature`, `env`, and `now` inputs directly. A separate stacked PR #84 had already introduced a verifier-issued capability, but that protection was not present on the clean current-default stack.

PR #93 ports that boundary onto PR #92:

- A successful verifier result is associated with the exact deep-frozen bundle snapshot and detached signature in module-private WeakMaps.
- Persistence accepts only the original verifier result object. Copied, forged, or denied objects fail closed.
- Caller mutation after verification cannot alter the bytes or signature persisted.
- Snapshot acceptance time is the verifier's `verifiedAt`, not a caller-provided persistence timestamp.
- Tests cover copied/forged results, deep immutability, post-verification mutation, exact retry, invalid signatures and rollback collision.
- Workflow push and PR base filters include the clean stacked branch and its parent base.

## Exact-head CI

PR #93 exact head `99ca50ce11efb380efa6346a1db672585876a8b1`:

- Isolated D1 Ledger Proof run [43725400300](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43725400300): COMPLETED / SUCCESS.
- Job `132846119246`: syntax PASS; 11 test files / 120 tests PASS / 0 FAIL; isolated second D1 binding/migration smoke PASS; frozen schema-0010 fixture smoke PASS.
- Artifact `14166093756`, SHA-256 `f46cb4155f861712d1eafa9afb08ee38880d033c841aca9d8c8b1a26154a5d38`.
- Combined commit-status contexts: empty / NOT VERIFIED.
- Formal reviews: 0; inline review threads: 0.
- PR remains OPEN/DRAFT/UNMERGED. No merge attempted.

## Trust and runtime limits

This is local Workers-runtime proof code. The capability prevents a caller from forging or mutating the verifier result between verification and persistence. It does not itself establish production root-key custody or prove that every production call site supplies the actual platform environment binding to the verifier. No trusted runtime entrypoint is exposed; D1 Worker entrypoint remains inert. Hosted D1, production root-key configuration/rotation, provider account/quota evidence, Worker/Supervisor integration, deployment, dispatch and live route qualification remain NOT RUN / NOT QUALIFIED. `dispatch:false` remains invariant.

No secrets were read. No provider/model calls or paid fallback occurred. No production resources were created.

## Next bounded step

1. Inspect all call sites and establish an explicit trusted platform-env/clock boundary for registry verification; reject request-controlled env/time inputs.
2. Add a Worker adapter contract that receives platform bindings from the runtime, not request payloads, and remains inert until governance permits.
3. Test root-key substitution, forged env injection, stale platform clock, key rotation, registry epoch race and rollback.
4. Keep the local proof isolated until the integration and security contracts are independently reviewed. Do not deploy or enable dispatch.

Status: PR #93 code/test slice VERIFIED by exact-head D1 CI; independent review NOT RUN; production trust boundary NOT QUALIFIED; Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
