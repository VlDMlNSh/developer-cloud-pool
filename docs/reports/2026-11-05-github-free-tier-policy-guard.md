# 2026-11-05 — GitHub Free-only policy guard implementation

## Summary

Created PR #10 to enforce the zero-paid-execution invariant in CI. The repository is PUBLIC and the workflow runs on standard ubuntu-24.04 only. No larger runner, paid service, provider key, or model route was used.

## Changes

- Added `scripts/validate-free-tier-policy.mjs` to inspect every workflow under `.github/workflows`.
- Added `scripts/validate-free-tier-policy.test.mjs` with nine Node.js tests.
- Added `docs/architecture/GITHUB-FREE-TIER-WORKFLOW-CONTRACT.md`.
- Wired policy validation and regression tests into `pool-contract-validation.yml`.
- Validator permits literal standard Ubuntu/Windows/macOS runner labels, requires job timeouts 1–30 minutes, limits matrix parallelism to 4, rejects dynamic/self-hosted/larger/GPU runner selectors, rejects custom job images/containers, and rejects explicit paid-fallback settings.
- Standard macOS runner labels are intentionally permitted for future ephemeral Xcode/Simulator work in this public repository.

## Exact-head evidence

- PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/10
- Branch: `feat/github-free-tier-policy-guard-2026-11-05`
- Exact head SHA: `fa308f0178fe332851cc8b5a8c43b564912c37a6`
- Workflow run: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/41913465969
- Job: `126866831669`, `COMPLETED / SUCCESS`.
- Steps: checkout, dispatch-disabled assertion, YAML parse, GitHub Free-only policy validation, Node regression tests, existing pool security contract validation — all SUCCESS.
- Runner label recorded by GitHub: `ubuntu-24.04`.
- Independent PR review: NOT RUN. PR remains OPEN / DRAFT / NOT MERGED.

## Initial failure and correction

The first implementation commit used over-escaped regular expressions; the first exact-head CI run failed. The defect was corrected in commit `fa308f0178fe332851cc8b5a8c43b564912c37a6`. The corrected exact-head run above completed successfully. The earlier failed run is retained in GitHub history and is not counted as passing evidence.

## Other live blockers

- PR #7 remains OPEN / DRAFT / NOT MERGED. Static CI passed, but independent security review is absent and Worker standalone `workflow_dispatch` provenance remains unresolved.
- PR #8 remains OPEN / DRAFT / NOT MERGED. Exact-head CI and independent review are NOT VERIFIED / NOT RUN.
- PR #9 remains OPEN / DRAFT / NOT MERGED. Its diff removes only the accidentally committed 115-line report from the default branch. Exact-head CI and independent review are NOT VERIFIED / NOT RUN.
- Active Ruleset `Основной — verified` (ID `26550182`) is scoped to `refs/heads/Основной`, enforcement active, but required approvals are zero. Independent review must therefore be treated as an explicit external gate.
- `POOL_DISPATCH_ENABLED`: NOT VERIFIED in this pass. No attempt was made to read or change the variable.
- No Worker, DSH, Resource Probe, browser, model/provider call, or secret access was performed. Pool remains NOT DEPLOYED.

## Free-tier guarantees and limits

- Current repository visibility was verified PUBLIC.
- CI job used only standard `ubuntu-24.04`; GitHub reported runner group `GitHub Actions`, not a larger runner group.
- No paid model/API or external paid service is part of this implementation.
- Provider free tiers are not GitHub Free entitlements. Keep them disabled until separately verified and guarded against paid fallback.
- If repository visibility changes to private, pause hosted runner execution and revalidate Free allowances before dispatch.

## Next step

Resolve Worker caller provenance and orchestration/recovery design before dispatch qualification. Keep `POOL_DISPATCH_ENABLED` disabled/unmodified. Do not merge PR #10 without independent review and exact-head CI revalidation after any further push.

## Related links

- [Free-tier workflow contract](../architecture/GITHUB-FREE-TIER-WORKFLOW-CONTRACT.md)
- [PR #7](https://github.com/VlDMlNSh/developer-cloud-pool/pull/7) · [PR #8](https://github.com/VlDMlNSh/developer-cloud-pool/pull/8) · [PR #9](https://github.com/VlDMlNSh/developer-cloud-pool/pull/9) · [PR #10](https://github.com/VlDMlNSh/developer-cloud-pool/pull/10)
- [Canonical repository](https://github.com/VlDMlNSh/developer-cloud-pool)