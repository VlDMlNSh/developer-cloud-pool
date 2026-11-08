# Cloudflare D1 Free-tier eligibility and account-state check — 2026-11-08

## Result

**D1 is available on Cloudflare Workers Free, with an included free quota. The connected Cloudflare account currently has zero D1 databases. Card-free signup/eligibility is NOT VERIFIED. No resource was provisioned.**

## Evidence

- Connected Cloudflare account identity was resolved to one account; account ID is deliberately not repeated in this report.
- Read-only `GET /accounts` succeeded and returned one standard account.
- Read-only `GET /accounts/{account_id}/d1/database` succeeded: `success=true`, `total_count=0`.
- Cloudflare documentation search returned current official D1 and Workers pricing pages, last updated 2026-10-30 and 2026-10-02 respectively:
  - D1 is explicitly available on Workers Free and Paid.
  - Workers Free D1 included quotas: 5 million rows read/day, 100,000 rows written/day, 5 GB total storage, and 10 databases.
  - D1 documentation states the Workers Free plan always includes the ability to prototype and experiment with D1 for free.
  - Workers Paid has a minimum charge of $5/month; no paid upgrade is required to use the documented Free quota.
- Read-only `GET /accounts/{account_id}/subscriptions` returned HTTP 403 / Cloudflare error 10000 because the connected OAuth connection has no Billing Read or Billing Write scope. No alternate credential was tried and no billing data was accessed.
- Therefore account subscription state and payment-method/card requirement for this specific account remain NOT VERIFIED. Public documentation proves Free-tier D1 availability, not that this account can complete onboarding without a card.

## Governance and implementation state

- Default branch `Основной` remains at `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- Active ruleset `26550182` applies to `refs/heads/Основной`; required approving review count is 0, CODEOWNERS review is false, and no required reviewers are configured. This is an explicit governance gap.
- PR #39 remains OPEN / DRAFT / UNMERGED at `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`, stacked on PR #36's proof branch. Exact-head PR run `42329993548` is COMPLETED / SUCCESS. Independent reviews remain zero on PR #36, #37 and #39.
- PR #37 remains OPEN / DRAFT / UNMERGED at `5587a4e013507b5be330fd0c49ce1fc836faa946`.
- Issue #38 remains OPEN. No dispatch authorization, no Worker/DSH/Resource Probe run, no provider calls, no production integration.
- Voktors-Mini.Dlink is connected and operational; Free host slot limit is 1 and currently occupied. Two other enrolled hosts remain disabled.

## Decision

D1 Free is a valid candidate for the next isolated remote qualification stage. Do not create a database yet: independent security review and governance must be resolved first. Card-free account eligibility is not inferred from Free-tier pricing.

## Next actions

1. Obtain independent review for immutable PR #36/#39 and PR #37.
2. Resolve the default-branch ruleset gap through an approved governance change, requiring at least one independent approval and CODEOWNERS review where applicable.
3. If an authorized billing-read connection becomes available, read only the non-secret subscription/payment metadata to determine whether card-free onboarding is possible. Do not request Billing Write.
4. Only after the review and governance gates pass, create one minimal D1 database under an explicit free-only/no-paid-fallback constraint and run remote contention, rollback, retry, and audit tests.
5. Keep `POOL_DISPATCH_ENABLED` and `POOL_AUTHORIZATION_CONTRACT_ACCEPTED` fail-closed.

## Status

- D1 Free-tier availability: **VERIFIED from official documentation**.
- Current account D1 inventory: **VERIFIED — zero databases**.
- Card-free eligibility for this account: **NOT VERIFIED**.
- Billing subscription read: **BLOCKED — OAuth scope unavailable**.
- Remote D1 qualification: **NOT RUN**.
- Independent review: **NOT RUN**.
- Governance acceptance: **BLOCKED**.
- Cloud Development Pool: **BLOCKED**.
- Contour A: **NOT ACCEPTED**.
- Contour B: **DEFERRED**.

No secrets were read. No paid resources were created. No database, Worker, deployment or dispatch was created or executed.

## References

- [Cloudflare D1 overview](https://developers.cloudflare.com/d1/)
- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Cloudflare D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/)
- [Issue #38](https://github.com/VlDMlNSh/developer-cloud-pool/issues/38)
- [PR #36](https://github.com/VlDMlNSh/developer-cloud-pool/pull/36)
- [PR #37](https://github.com/VlDMlNSh/developer-cloud-pool/pull/37)
- [PR #39](https://github.com/VlDMlNSh/developer-cloud-pool/pull/39)
- [Canonical MediaHub map](https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md)
