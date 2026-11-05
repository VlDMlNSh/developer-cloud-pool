# Engineering report — 2026-11-06: Cloudflare Zero Trust payment prerequisite and no-card path

## Objective

Continue the web-first Developer Cloud Pool deployment without requiring the owner to add a payment card or activate a paid service.

## New authoritative finding

Cloudflare's official Zero Trust onboarding guide explicitly requires selecting a subscription plan and entering payment details even when Zero Trust Free is selected; the documentation says the owner will not be charged on Free. Sources:
- https://developers.cloudflare.com/cloudflare-one/setup/
- https://developers.cloudflare.com/learning-paths/clientless-access/initial-setup/create-zero-trust-org/

Therefore the prior instruction to activate Zero Trust Free is not a no-card path. The owner reports that their card is not accepted. Do not ask the owner to retry, substitute another payment instrument, or bypass Cloudflare's onboarding/payment verification. Treat Zero Trust activation as BLOCKED.

Cloudflare Workers is a separate product and has a default Free plan. Official docs list 100,000 requests/day and 10 ms CPU per invocation on Workers Free:
- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/workers/platform/limits/

The Cloudflare API inspection previously recorded no Worker scripts, no workers.dev subdomain (API error 10007), Access not enabled (API error 9999), and no zones. Error 10007 means a Worker or workers.dev subdomain was not found:
- https://developers.cloudflare.com/workers/observability/errors/
Cloudflare's workers.dev guide says the subdomain can be provisioned from Workers & Pages dashboard:
- https://developers.cloudflare.com/workers/configuration/routing/workers-dev/

## Architecture disposition

- Cloudflare Zero Trust Access: BLOCKED / NOT A REQUIRED DEPENDENCY. Do not attempt activation again as part of this work.
- Cloudflare Workers Free: RETAINED AS A CANDIDATE, entitlement and deployability still require verification.
- Candidate application-level authentication: server-side GitHub OAuth callback, strict owner GitHub numeric user-ID allowlist, one-time state/CSRF validation, secure HttpOnly/Secure/SameSite session cookie, server-side session signing/expiry/rotation, no OAuth token returned to browser, and no client-side privileged credentials.
- GitHub OAuth implementation is NOT STARTED and must receive independent security review before deployment. Confirm current GitHub OAuth App capabilities and exact callback/session design before coding.
- Existing GET-only Experience API contract remains the initial functional boundary.
- If Workers Free cannot be provisioned without payment details, evaluate a no-card static frontend + separately hosted free API only after checking current vendor terms, cold-start behavior, quotas, and security. Do not select a platform from aggregator claims alone.
- No anonymous/public dashboard, no client-side PAT, no secrets in source, no task mutation, no dispatch, no paid fallback.

## Current repo evidence

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch: `Основной`
- Default HEAD: `64d2636d4500127e635c214ccfb722c6b3fcda80`
- Architecture PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/24
- PR branch: `docs/jarvis-web-experience-adr-2026-11-06`
- PR head observed: `2901b23b5d907d703ca6058a867fe729fefa0106`
- PR remains OPEN / DRAFT / UNMERGED; reviews: 0.
- Exact-head check-runs at observed head: 0; commit status: PENDING with 0 statuses. CI is NOT VERIFIED.
- Cloudflare account identity was previously verified, but this pass did not make any Cloudflare configuration changes.
- No Worker, Access app, OAuth app, secret, DNS record, payment method, or deployment was created.
- No Gemini or Claude agent was dispatched.

## Next bounded step

1. Independently review PR #24 and the existing GET-only contract.
2. Verify GitHub OAuth App current protocol requirements and prepare a no-secret local auth fixture with negative tests (state mismatch, wrong user ID, missing/expired cookie, invalid signature, replay, CSRF, cookie flags).
3. In parallel, owner may open Workers & Pages dashboard to see whether a workers.dev subdomain can be provisioned without Zero Trust onboarding; do not activate Access or add payment details.
4. Recheck Workers script/subdomain read-only API state.
5. Do not deploy until a no-card Workers Free path, secure app authentication, exact-head CI, independent review, and owner approval are all verified.

## Status vocabulary

Cloudflare Zero Trust: BLOCKED.
Workers Free: CANDIDATE / NOT VERIFIED.
GitHub OAuth app auth: PLANNED / NOT IMPLEMENTED.
Worker/Hono implementation: NOT STARTED.
Preview/deployment: NOT RUN.
Security qualification: NOT RUN.
Production pool: NOT DEPLOYED / NOT QUALIFIED.
