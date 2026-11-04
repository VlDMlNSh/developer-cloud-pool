# 2026-11-05 — GitHub Free-only execution and cost guardrails

## Decision

The Developer Cloud Pool must operate only within the user's GitHub Free plan and must never incur an automatic charge. This is a hard architectural invariant.

The repository is currently PUBLIC (verified from GitHub repository metadata). GitHub documents standard GitHub-hosted runner usage in public repositories as free. This includes standard Linux, Windows and macOS hosted runners. It does NOT make larger hosted runners free; larger runners are billed even for public repositories.

## Permitted execution envelope

- Standard GitHub-hosted runners only, in this public repository.
- Standard ubuntu-*, windows-* or macos-* labels only when the job genuinely needs that OS. For iOS/Xcode Simulator, a standard macOS hosted runner is an allowed on-demand lane.
- Use ephemeral jobs, bounded timeouts, concurrency groups and small matrices. Start macOS concurrency at 1.
- Keep Actions artifacts small, sanitized and short-lived; do not use artifacts or caches as durable storage.
- Prefer repository Git history for durable text evidence and source-controlled checkpoints.
- If repository visibility changes to private, pause hosted-runner execution until the free allowance and billing guard are revalidated.
- Do not enable paid larger runners, GPU runners, custom images, hosted sandbox compute, paid hosted services or any workflow feature that can generate a charge.

## Explicitly forbidden

- Larger-runner groups, GPU runner labels and custom images.
- Paid fallback or automatic upgrade of a model/provider route.
- Paid model/API usage, subscriptions, external compute, paid storage or paid browser services. Provider free tiers are external to GitHub and require separate verification.
- Any workflow that silently changes runner class, uses a paid fallback, or continues after a quota guard fails.
- Using billing settings or a payment method as a way to make blocked work continue.

## Model/provider policy

GitHub Free does not include Gemini, Anthropic, OpenAI, DeepSeek or other model API credits. Therefore:
1. No provider API keys are required for static validation, pure Node tests, documentation checks, or Simulator tests.
2. Keep provider calls disabled until a specific provider's current free quota, terms, model availability and credential handling are independently verified.
3. Route model calls only through a budget-enforcing gateway with a hard zero-paid-fallback rule, request/token caps, retry ceiling and per-task/day/month limits.
4. When free quota is exhausted, return BLOCKED_QUOTA or queue the task. Never retry through a paid model.
5. Do not store raw provider keys in generic workers, public issues, artifacts, or logs.

## iOS Simulator consequence

Do not install Xcode or Simulator on Linux workers. When iOS tests become necessary, use a standard ephemeral macOS GitHub-hosted runner in this public repository, on demand, with concurrency 1, pinned Xcode/runtime, strict timeout, no signing and no general secrets. This standard macOS lane is within the public-repository standard-runner free policy. It remains subject to GitHub availability and concurrency limits; free does not mean unlimited simultaneous jobs.

Physical-device checks remain a separate acceptance step for hardware-specific behavior.

## Current repository state and blockers (live check 2026-11-05)

- Repository visibility: PUBLIC; default branch name: Основной.
- PR #9: OPEN / DRAFT / NOT MERGED; head c0fae34e73180fdf195862036ca8356abad51101; diff deletes exactly the accidentally added 115-line report from the default branch. Exact-head workflow runs: none; combined statuses: none; independent reviews: none. CI NOT VERIFIED; review NOT RUN.
- PR #8: OPEN / DRAFT / NOT MERGED; head 0a8dba68aa12070b3768d6fb834bedf404ed5d99; exact-head workflow runs/statuses: none; independent reviews: none. CI NOT VERIFIED; review NOT RUN.
- PR #7: OPEN / DRAFT / NOT MERGED; head d60d26ae647940e702d646e572c861a8f68f523e; static workflow run 41909811327 completed SUCCESS. No combined status contexts or independent review submissions. Security/provenance gap remains BLOCKING.
- PR #9 and PR #8 must not be merged on the current evidence. PR #7 static CI is not security acceptance.
- The prior iOS audit's illustrative $1.86 for a 30-minute standard macOS job is NOT applicable to this public repository's standard hosted runner usage. It should not be used as a projected charge. Larger runners remain billable.
- No workflow was dispatched, no runner/resource probe was run, no provider API was called, no secret/variable was read or changed, and no paid service was activated in this pass.
- POOL_DISPATCH_ENABLED: NOT VERIFIED. Pool: NOT DEPLOYED.

## Next bounded work

1. Add static policy tests that reject paid/larger/GPU runner labels, custom images, unbounded matrices and model-provider paid fallback.
2. Add a free-tier-safe macOS profile contract (design-only until governance gates pass).
3. Verify workflow permissions, artifact retention and concurrency are bounded.
4. Keep PR #7 Worker provenance unresolved and dispatch disabled until an independent security review and exact-head checks pass.

## Sources

- GitHub Actions billing: https://docs.github.com/en/billing/concepts/product-billing/github-actions
- Actions runner pricing: https://docs.github.com/en/billing/reference/actions-runner-pricing
- GitHub Free public standard-runner policy and 2026 pricing clarification: https://github.blog/changelog/2026-01-01-reduced-pricing-for-github-hosted-runners-usage/

## Related project records

- [Canonical repository](https://github.com/VlDMlNSh/developer-cloud-pool)
- [PR #7 — Worker approval/provenance](https://github.com/VlDMlNSh/developer-cloud-pool/pull/7)
- [PR #8 — Task Matrix Builder](https://github.com/VlDMlNSh/developer-cloud-pool/pull/8)
- [PR #9 — Restore documentation branch governance](https://github.com/VlDMlNSh/developer-cloud-pool/pull/9)
- [Issue #5 — Ephemeral agent-browser](https://github.com/VlDMlNSh/developer-cloud-pool/issues/5)