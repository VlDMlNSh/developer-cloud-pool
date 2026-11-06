# Cloudflare Free-tier account qualification — 2026-11-06

## Scope

Read-only account qualification for the conditional-write D1 claim-store candidate. No provisioning, deployment, billing mutation, secret access, or runtime dispatch.

## Account API evidence

Cloudflare connector identity resolved successfully and listed exactly one accessible account. Account identifiers and personal billing/profile data are intentionally omitted.

Read-only calls:
- `GET /accounts`: SUCCESS; one accessible account, type `standard`.
- `GET /accounts/{account_id}/entitlements`: SUCCESS; empty entitlement array.
- `GET /accounts/{account_id}/d1/database`: SUCCESS; zero D1 databases.
- `GET /accounts/{account_id}/workers/account-settings`: SUCCESS; `default_usage_model=standard`, `green_compute=false`.
- `GET /accounts/{account_id}/workers/scripts`: SUCCESS; zero Worker scripts.
- `GET /accounts/{account_id}/subscriptions`: BLOCKED / NOT VERIFIED. OAuth connection lacks Billing Read/Billing Write scope; Cloudflare returned HTTP 403. No attempt was made to inspect payment method or billing profile.

Interpretation:
- This confirms that the connected account is reachable and has no existing D1 database or deployed Worker scripts visible through the current API authority.
- Empty entitlements do not establish plan eligibility or payment-card status.
- `default_usage_model=standard` is a Workers account setting, not proof of a paid subscription or proof that an account is Free.
- Account subscription/billing state and whether Cloudflare accepts a card-free setup remain NOT VERIFIED due to OAuth scope limitation.
- No Cloudflare resource was created.

## Current public Cloudflare Free-plan documentation reviewed

Cloudflare's current docs state that Workers Free is the default plan and D1 is available on Workers Free. Published limits relevant to this design:

| Resource | Workers Free published allowance |
|---|---:|
| D1 rows read | 5 million/day |
| D1 rows written | 100,000/day |
| D1 storage | 5 GB total |
| D1 databases | 10 |
| Workers requests | 100,000/day |
| Worker CPU per HTTP request | 10 ms |
| Workflows steps | 3,000/day |
| Workflows storage | 1 GB-month |
| Workflows CPU per invocation | 10 ms |
| Queues operations | 10,000/day |
| Queues per account | 10,000 |
| Queue retention | 24 hours |

Sources:
- Workers pricing and default Free access: https://developers.cloudflare.com/workers/platform/pricing/ (last updated 2026-10-02).
- D1 pricing and quotas: https://developers.cloudflare.com/d1/platform/pricing/ (last updated 2026-10-30).
- D1 Free-tier daily limit enforcement effective 2026-09-01: https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/.
- Workers Free request and CPU limits: https://developers.cloudflare.com/workers/platform/limits/.
- Workflows Free limits: https://developers.cloudflare.com/workflows/reference/pricing/.
- Queues Free limits: https://developers.cloudflare.com/queues/platform/pricing/.

Important: since 2026-09-01, D1 queries exceeding the daily row-read or row-write Free limits fail until midnight UTC; data remains stored. Do not assume overage is silently billed or that the workload can continue past the limit.

## Feasibility assessment

- Public product eligibility: D1 is available on Workers Free — VERIFIED from current Cloudflare documentation.
- Public quotas: documented and recorded above — VERIFIED.
- This connected account's exact subscription plan: NOT VERIFIED.
- Card-free enrollment/payment-method requirement: NOT VERIFIED.
- Actual account D1 quota usage / remaining daily allowance: NOT VERIFIED.
- Existing D1 resource: none visible.
- Existing Worker scripts: none visible.
- Isolated least-privilege D1/Worker identity: NOT IMPLEMENTED / NOT QUALIFIED.
- Production D1 conditional-write behavior: NOT TESTED.

The local Miniflare/workerd proof remains useful but cannot be represented as a live Cloudflare service test.

## Decision

Do not provision D1 or deploy a Worker in this pass. Candidate C remains the strongest technical candidate but is not production-selected. The account API did not prove card-free eligibility; no paid fallback is allowed. The current Cloudflare OAuth connector cannot read subscription/billing state because Billing Read/Billing Write scopes are absent. Do not request or inspect billing profile/payment method through this connector as part of this read-only pass.

Before provisioning, the account must be independently shown to be on Workers Free and usable without adding a payment method. If this cannot be established, keep the candidate local-only and fail-closed.

## Actions not taken

No D1 database, Worker, Queue, Workflow, API token, OAuth scope, billing profile, payment method, secret, domain, or deployment was created or modified. No provider/model call or GitHub dispatch occurred.

## Status

- Public Workers Free / D1 product availability: VERIFIED.
- Public quotas: VERIFIED.
- Account API connectivity: VERIFIED.
- Account plan: NOT VERIFIED.
- Card-free eligibility: NOT VERIFIED.
- Live D1 resource: NOT PRESENT.
- Production D1 claim backend: NOT QUALIFIED.
- Dispatch: BLOCKED / FAIL-CLOSED.
- Contour A: BLOCKED / NOT QUALIFIED / NOT ACCEPTED.
- Contour B: DEFERRED.

Canonical context window (working documentation branch, unmerged): https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/github-context-window-2026-11-06/docs/context/GITHUB-CONTEXT-WINDOW.md
Canonical MediaHub map (reference only): https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
