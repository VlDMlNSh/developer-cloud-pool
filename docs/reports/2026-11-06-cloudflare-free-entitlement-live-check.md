# Cloudflare Free entitlement and live resource check — 2026-11-06

## Scope
Read-only inspection of the connected Cloudflare account and current public Cloudflare documentation. No resources were created or changed.

## Connected account and live resource inventory
- Cloudflare whoami returned a stable connected profile. Account list returned exactly one account, type `standard`, account ID retained in the connected tool context (not repeated in this report).
- GET account entitlements: success, empty result array.
- GET D1 database list: success, zero databases.
- GET Workers account settings: success; `default_usage_model=standard`, `green_compute=false`.
- GET Worker scripts: success, zero scripts.
- GET account subscriptions: HTTP 403 / Authentication error. The connected OAuth scopes do not cover Billing Read or Billing Write; no billing profile/payment method was read.
- No secret values or API tokens were accessed.

## Public documented Free-plan capability and limits
Current Cloudflare documentation retrieved from the Cloudflare docs connector:
- Workers Free is available by default. Workers Free has 100,000 requests/day and 10 ms CPU per HTTP request; daily limits reset at 00:00 UTC.
- D1 is available on Workers Free. Current D1 Free allowance: 5 million rows read/day, 100,000 rows written/day, 5 GB total storage and 10 databases. Beginning 2026-09-01, queries exceeding daily row-read or row-write limits fail until reset at midnight UTC; stored data is not affected.
- Workflows Free limits documented: 100,000 requests/day shared with Workers, 10 ms CPU per invocation, 1 GB-month storage and 3,000 steps/day. Cloudflare documentation says it will not bill step/storage usage before the announced billing start date; this is not a guarantee that all workflow use is unlimited.
- Queues Free: 10,000 operations/day and 24-hour message retention.
- Browser Run Free is very constrained (10 minutes/day, max 3 concurrent sessions, and crawl limits); do not treat it as the primary development IDE.
- Workers Free remains subject to product-specific quotas; excess D1 daily reads/writes fail rather than transparently receiving paid fallback.

Official sources:
- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/
- https://developers.cloudflare.com/workflows/reference/pricing/
- https://developers.cloudflare.com/queues/platform/pricing/
- https://developers.cloudflare.com/browser-run/limits/

## Qualification decision
- Public product documentation proves that a free D1/Workers development path exists.
- Live account API evidence does NOT yet prove the account's plan/subscription state: entitlements are empty, and the billing subscriptions endpoint is inaccessible through this OAuth connection.
- The live API inventory shows no existing D1 database and no deployed Worker scripts. Therefore no existing D1/Worker runtime is available to test.
- No evidence was found that a payment card is required to create a Free D1 database, but the connected account's exact no-card eligibility has not been tested. Do not claim card-free account qualification yet.
- Candidate C remains bounded qualification only. Do not provision or deploy until a no-cost creation path and spending protections are confirmed. No paid fallback.

## Next bounded step
Use an authorized dashboard-level non-secret check of Workers plan and no-card eligibility, or a least-privilege Cloudflare OAuth scope that can read subscription metadata (Billing Read only). If the UI/API requires adding a payment method or upgrading, stop; do not proceed. Once no-card free eligibility is established, separately approve a disposable isolated D1 test database and Worker only after governance review.

## Actions not taken
No D1 database creation, Worker deployment, billing modification, payment method access, secret/token read, permission grant, provider/model call, GitHub dispatch, production integration or paid fallback.

## Status
- Public Free-plan capability: VERIFIED from current official documentation.
- Connected account: one standard account, live entitlement list empty.
- Live D1/Worker inventory: VERIFIED empty.
- Actual Workers Free subscription status: NOT VERIFIED.
- Card-free eligibility: NOT VERIFIED.
- Production claim store: NOT SELECTED / NOT QUALIFIED.
- Dispatch: BLOCKED / FAIL-CLOSED.
- Contour A: BLOCKED / NOT QUALIFIED / NOT ACCEPTED.
- Contour B: DEFERRED.
