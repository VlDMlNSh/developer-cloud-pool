# Checkpoint addendum — 2026-11-05: GitHub Free-only invariant

This addendum supplements 2026-11-04-live-checkpoint-jarvis-mobile-shell.md; it does not replace the Worker authorization blocker or accept any open PR.

## Immutable cost policy

- User constraint: GitHub Free only; zero automatic charges.
- Repository visibility at live check: PUBLIC.
- Standard GitHub-hosted runners in public repositories are free under GitHub's current billing policy. This includes standard macOS hosted jobs; therefore an on-demand standard macOS Xcode/Simulator lane remains allowed when needed.
- Larger hosted runners are billed even in public repositories. Prohibit larger/GPU runner groups, custom images and paid fallback.
- If visibility becomes private, stop and re-evaluate before dispatch.
- Provider API credits are not included in GitHub Free. Provider free tiers are separate, mutable external terms. Keep all model calls disabled until free quota is verified and a hard paid-fallback deny is implemented.
- On quota exhaustion: queue or return BLOCKED_QUOTA; never switch to a paid provider/model.
- Keep job timeouts, concurrency, matrices, artifact size and retention bounded. No paid external storage/compute/browser service.

## Live PR and CI state (2026-11-05)

- PR #9 c0fae34e73180fdf195862036ca8356abad51101: OPEN / DRAFT / NOT MERGED; diff deletes only the accidentally added report (115 lines). Exact-head workflow runs/statuses empty; independent reviews empty. CI NOT VERIFIED; review NOT RUN.
- PR #8 0a8dba68aa12070b3768d6fb834bedf404ed5d99: OPEN / DRAFT / NOT MERGED; exact-head workflow runs/statuses empty; independent review empty. CI NOT VERIFIED; review NOT RUN.
- PR #7 d60d26ae647940e702d646e572c861a8f68f523e: OPEN / DRAFT / NOT MERGED; static CI run 41909811327 SUCCESS, but no combined status contexts and no independent review. Worker provenance gap remains BLOCKING.
- POOL_DISPATCH_ENABLED: NOT VERIFIED. No workflow dispatch, runner probe, secrets, provider API or variable mutation in this pass.

## Correction to prior iOS cost note

The earlier report's illustrative $1.86 calculation for 30 minutes of standard macOS runner time must not be treated as a charge estimate for this public repository. Standard hosted runners in public repositories are free. Larger runner SKUs remain billable and are forbidden.

## Next bounded step

Add static free-tier policy tests and a design-only standard macOS profile contract. Do not activate any workflow or enable dispatch until PR #7's authorization/provenance gap, governance and independent review are resolved.

## Evidence

- [Free-only policy report](../reports/2026-11-05-github-free-only-execution-policy.md)
- [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
- [Actions runner pricing](https://docs.github.com/en/billing/reference/actions-runner-pricing)
- [PR #7](https://github.com/VlDMlNSh/developer-cloud-pool/pull/7) · [PR #8](https://github.com/VlDMlNSh/developer-cloud-pool/pull/8) · [PR #9](https://github.com/VlDMlNSh/developer-cloud-pool/pull/9)