# Fail-closed Provider Quota Ledger correction — 2026-11-15

## Change

- Draft PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/71
- Branch: `fix/quota-ledger-fail-closed-2026-11-15`
- Head: `40a49acabd12aa178d3aa136244fb4f42231fbde`
- PR base observed by GitHub: `Основной` @ `edb3a52809c6ab937c6833c825ab538fdfa052e8`.
- Compare: DIVERGED, 3 ahead / 2 behind, merge base `670ed18460506c5cba6757baf15954215a74cb0a`. The two behind commits are on the base after branch creation; do not merge until current-head CI/protection checks are re-evaluated.

## Immutable source evidence

- Source `scripts/provider-quota-ledger.mjs`: blob `175876505bc3b1b240034a2d523d9ff12a6aa20e`.
- Tests `scripts/provider-quota-ledger.test.mjs`: blob `7e4c73ea66e08a2b3eb31f86b9ec47afe8f5329a`.
- Workflow `.github/workflows/pool-contract-validation.yml`: blob `4e47b8e8850833d930cdd457bea91c2cec507576`.

## Behavior change

`listEligibleRoutes()` now excludes a route unless:
- `quotaEvidence === "provider_verified"`;
- `quotaDomainId` is non-empty;
- requested model and optional billing-class filter match;
- route is not terminal and is not in an active cooldown.

The quota evidence and quota-domain checks apply to every route class, not only free routes. This is deliberately conservative: a route with unknown account/quota-domain identity is not treated as independent usable capacity. A provider-reported reset is still only a pure state transition; this function does NOT authenticate the provider evidence or prove issuer/account authority. That must be enforced by the future qualified-evidence adapter/A0 boundary.

12 Node regression tests cover unknown evidence despite caller billing allowlist, provider-verified quota with known domain, provider-verified route with unknown domain, cooldown, 429 reconciliation, auth/billing terminal state, evidence scope, input validation and immutability.

## CI evidence

- Exact-head Pool Contract Validation run: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/43685547993
- Run ID `43685547993`, commit `40a49acabd12aa178d3aa136244fb4f42231fbde`, COMPLETED / SUCCESS.
- Workflow now executes `node --test scripts/provider-quota-ledger.test.mjs` after the existing pool contract validator.
- Combined commit status returned an empty contexts array; required branch protection/ruleset contexts remain NOT VERIFIED.

## Restrictions and residual work

No merge, deployment, hosted D1, dispatch, provider/model calls, credential/secret reads, or independent acceptance occurred. PR #71 is Draft. PR #29 remains divergent and was not merged/cherry-picked wholesale.

Remaining: implement a qualified route-evidence adapter bound to provider/model/account/issuer/quota-domain/evidence digest/freshness/revocation; compose it with single-use approval and D1 task/attempt/outbox in one atomic admission boundary. Keep production dispatch disabled. Independent review remains deferred until the pool is actually running.

Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
