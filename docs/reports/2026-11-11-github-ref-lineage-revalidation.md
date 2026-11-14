# GitHub ref and PR lineage revalidation — 2026-11-11

## Immutable observation set

- Repository: `VlDMlNSh/developer-cloud-pool`
- Default branch: `Основной`
- Default HEAD: `221f216c00ca7e5596bcc682ba185ad155a10603` (latest commit search; default ref read-back)
- Documentation audit branch: `docs/projection-stack-reconciliation-2026-11-11`
- PR #66 head: `37c2e90e637a943bce1c3e90cf88cae96e979629`
- PR #66 base: `221f216c00ca7e5596bcc682ba185ad155a10603`

## PR #65 — hosted D1 documentation transplant

- State: OPEN / DRAFT / UNMERGED.
- Head: `3d67783e4da60296f26547174b0bdeae58d9a3f2`.
- Declared base: `c3add54d3409122eedaa697f0af5e7ec43753426`.
- Compare against current default `221f216c00ca7e5596bcc682ba185ad155a10603`: **DIVERGED, 4 ahead / 7 behind**, merge base `c3add54d3409122eedaa697f0af5e7ec43753426`.
- Exact changed paths: four documentation files — hosted D1 qualification plan, clean-transplant report, hosted boundary audit, and Issue #38 backend-fit report. No runtime changes.
- Exact-head combined statuses: 0; PR-triggered workflow runs: 0; formal reviews: 0; inline review threads: 0.
- Disposition: do not merge as-is. Its earlier `mergeable=true` metadata is not sufficient; current compare proves the branch is stale/diverged from current default. Recreate/rebase selectively only after reviewing all four document contents and link targets.

## PR #66 — projection stack reconciliation

- State: OPEN / DRAFT / UNMERGED.
- Head: `37c2e90e637a943bce1c3e90cf88cae96e979629`.
- Base: current default `221f216c00ca7e5596bcc682ba185ad155a10603`.
- Compare: **AHEAD, 40 commits / 0 behind**, merge base equals current default.
- Exact changed paths: 10 documentation-only paths (context, checkpoint, contracts and audit reports). No code, workflow, package, schema, secret, permission, deployment or dispatch changes.
- Exact-head combined statuses: 0; PR-triggered workflow runs: 0; formal reviews: 0; inline review threads: 0.
- Disposition: history is based on current default but contains 40 commits and a broad 10-document diff. Keep draft; no merge. Absence of CI is NOT VERIFIED, not PASS. Independent review NOT RUN.

## Proof PR lineage

- PR #58: OPEN / DRAFT / UNMERGED; head `5caeb60f7a45d836c6ad1eea2fb86e20995da025`; declared base `ec3f3266ca28c4fb5633a9475cc6f396a4677974`.
- PR #59: OPEN / DRAFT / UNMERGED; head `22200226da4f1af30645cf441a639db6893e9310`; declared base `6f7953e4abec3cc564984ee3635cdb7717ae5d5e`.
- The previously verified source issue remains: #58/#59 are sibling proof changes and must not be assumed to be a linear merge stack. The #59 ACK API does not require a projection receipt; receipt-bound ACK remains a blocking implementation requirement.
- Do not transplant either proof branch wholesale into default without a new immutable integration candidate and exact-head validation.

## Issue #38 and qualification boundary

- Issue #38 remains OPEN / NOT QUALIFIED.
- Its body contains historical immutable refs (including default HEAD `197ba98d0dc7d8437d759dd25bee8750d02e59ae`); these are historical evidence, not the current default HEAD.
- Hosted D1 qualification remains NOT AUTHORIZED / NOT RUN. No hosted resource, secret, billing, provider, or dispatch action was performed.
- Dispatch remains FAIL-CLOSED. Contour A BLOCKED / NOT ACCEPTED. Contour B DEFERRED.

## Next bounded step

1. Keep PR #65 and #66 unmerged.
2. Obtain independent review of PR #66's ten-document set and #58/#59 proof contract, including receipt-bound ACK requirements.
3. For hosted D1 docs, selectively recreate PR #65's four files on a fresh branch from current default, preserving only validated content and correcting historical refs; keep it documentation-only.
4. Do not start hosted qualification until account-specific Free eligibility, source reconciliation, exact-head tests, and explicit authorization are all evidenced.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
