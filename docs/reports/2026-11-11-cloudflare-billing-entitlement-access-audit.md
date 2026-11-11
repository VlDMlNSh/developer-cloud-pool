# Cloudflare billing entitlement access audit — 2026-11-11

## Snapshot and project state
- Repository default branch: `Основной`.
- Latest context documentation branch: `docs/cross-chat-continuation-2026-11-06`.
- PR #37, #58, #59 were re-read: all OPEN / DRAFT / UNMERGED.
- Existing context blob before this update: `358f7f1a3cbe3f99102e3a22a4356ed4a7d516c1`.
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md

## Cloudflare billing entitlement probe (read-only)
Using the already-connected Cloudflare account, attempted only GET requests:
- `GET /accounts/{account_id}/subscriptions` → HTTP 403, Authentication error. API response explicitly says no OAuth scope covers this endpoint; API token permission Billing Read or Billing Write is required.
- `GET /accounts/{account_id}/billing/profile` → HTTP 403, same OAuth billing-scope restriction.
- `GET /accounts/{account_id}/billing/history` → HTTP 403, same OAuth billing-scope restriction.
- `GET /accounts/{account_id}/entitlements` → success=true, empty result. This endpoint does not establish Workers Free vs Paid.
- Previously observed `default_usage_model=standard` is not a subscription-tier indicator.
- No credentials, API token values, billing details or payment instruments were read or exposed. No permission changes requested. No resources created or modified.

## Determination
- Account-level Workers Free entitlement: NOT VERIFIED.
- Exact blocker: connected Cloudflare OAuth integration does not carry Billing Read scope; Cloudflare API explicitly states OAuth cannot access subscription/billing endpoints and recommends an API token with Billing Read or Billing Write. Do not create or request a token in this workflow; owner may instead inspect the dashboard.
- The integration cannot be upgraded from this session without owner action. The least-privilege path is owner inspection of the account's Workers plan in the dashboard, or a deliberate reconnection with read-only Billing Read if the owner chooses. Do not request Billing Write.
- Product-level Free plan feasibility remains confirmed by official docs; account eligibility and no-cost operating conditions remain unverified.
- Because no D1 databases or Worker scripts are provisioned, do not deploy, migrate, or enable dispatch until Free plan status, account identity, quota budget and governance are confirmed.

## Project disposition
- Cloudflare billing verification: BLOCKED by missing OAuth Billing Read scope.
- Hosted D1 / Worker: NOT PRESENT in inspected account resources.
- D1 recovery implementation: NOT RUN.
- No Gemini dispatch, model call, paid fallback, secret read, deployment, database migration or merge.
- PR #37/#58/#59 OPEN / DRAFT / UNMERGED.
- Contour A BLOCKED / NOT ACCEPTED; Contour B deferred.

## Next step
Owner can verify the Workers plan in Cloudflare Dashboard → account → Workers & Pages → Workers plans (or Billing → Subscriptions) and provide only the displayed plan label (Free or Paid); do not share billing instruments, tokens or account secrets. After plan confirmation, prepare a Free-only quota/cost envelope and implementation contract. If the account is Paid, stop: no paid fallback.

