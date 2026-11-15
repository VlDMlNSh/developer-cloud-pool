# PR #93 stale verifier-capability review — 2026-11-15

## Scope and immutable target

Reviewed Cloud Development Pool PR #93 at exact head `99ca50ce11efb380efa6346a1db672585876a8b1`. The PR is OPEN / DRAFT / UNMERGED and stacked on PR #92 head `7014961587759b27d2ef6e91c60ce098d077ae83`.

Relevant source blob read back: `proofs/d1-ledger/src/trusted-route-registry.mjs` at `916581ca07cf94edb21c8c2daa77a4c45db3d666`. Persistence test blob: `5736c308e41a0999209702a25eb8341f1f16c4dc`.

## Positive evidence

- PR #93 exact-head workflow run [43725400300](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43725400300): COMPLETED / SUCCESS.
- Job `132846119246`: dependency install, syntax check, Workers-runtime D1 suite, second local D1 binding/migration smoke, frozen schema-0010 fixture smoke, and lockfile artifact upload all succeeded.
- PR #92 exact-head runs [43718679258](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43718679258) and [43718679251](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43718679251): COMPLETED / SUCCESS.
- No formal reviews or review threads were present on PRs #92/#93. Combined commit-status contexts returned empty arrays; do not report aggregate contexts green.

## Security finding

PR #93 improves provenance by storing verifier-issued results and their immutable snapshot/signature in module-private WeakMaps. Caller-forged copies and post-verification mutation are rejected.

However, `persistTrustedRouteRegistryBundle({ db, verification })` does not re-check freshness against a trusted runtime clock at persistence time:

1. Verification validates freshness at its original `now`.
2. The result retains `verifiedAt`.
3. Persistence uses that historical `verifiedAt` as `acceptedAt` and for registry state timestamps.
4. The capability can be retained and presented after the bundle's `validUntil` or maximum registry-age window; no current-time check rejects it before writes or before the idempotent-success return.

This is a review finding, not a CI failure. It means the freshness boundary is not enforced at the persistence boundary.

## Review action

A review finding was posted on PR #93: [comment 6897189755](https://github.com/VlDMlNSh/developer-cloud-pool/pull/93#issuecomment-6897189755).

Required remediation:
- Re-check verifier capability age and bundle validity immediately before persistence and before returning idempotent success.
- Use a trusted runtime clock, not caller-supplied time.
- Add deterministic coverage: verify, advance time beyond expiry / maximum age, attempt persistence, assert denial and zero snapshot/issuer/route/pointer writes.
- Preserve `dispatch: false` throughout.

## Current disposition

- PR #93: IMPLEMENTED / exact-head CI VERIFIED, but freshness hardening remains OPEN.
- PR #92: exact-replay receipt integrity implementation / exact-head CI VERIFIED; no formal review.
- Durable trusted registry plus atomic admission watermark remains NOT QUALIFIED until stale-capability handling and same-batch admission checks are complete.
- No secret access, provider/model call, hosted D1 provisioning, Worker deployment, dispatch, merge, or production qualification occurred.
- Contour A BLOCKED / NOT ACCEPTED. Contour B DEFERRED.

## Next bounded step

Fix stale verifier-capability reuse on the PR #93 stack, add deterministic expiry/age and no-write regression tests, then re-run exact-head D1 proof and contract validation. Keep dispatch disabled.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
