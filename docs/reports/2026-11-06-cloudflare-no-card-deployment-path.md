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


## Autonomous account recheck and workers.dev provisioning — 2026-11-06

The owner requested that all checks and actions be performed autonomously where possible. Cloudflare connector authentication was revalidated. Read-only API checks returned:
- `GET /accounts/{account_id}/workers/scripts`: success, empty list; no Worker is deployed.
- `GET /accounts/{account_id}/workers/subdomain`: initially HTTP 404 / error 10007; no subdomain existed.
- `GET /accounts/{account_id}/access/apps`: HTTP 403 / error 9999; Cloudflare Access is not enabled.
- `GET /zones`: success, empty list; no custom zone/domain is attached.
- `GET /accounts/{account_id}/subscriptions`: HTTP 403 / error 10000; the connected OAuth authorization has no Billing Read scope. Actual Workers plan/subscription entitlement therefore remains NOT VERIFIED. No billing profile, payment data, or card details were read.

A project-specific workers.dev namespace was provisioned through the documented Workers Subdomain API:
- `PUT /accounts/{account_id}/workers/subdomain` with `subdomain=jarvis-developer-cloud-pool`: success.
- Follow-up `GET /accounts/{account_id}/workers/subdomain`: success; exact subdomain returned as `jarvis-developer-cloud-pool`.
- Public hostname namespace: `jarvis-developer-cloud-pool.workers.dev` (no Worker script is deployed there, so no application is being served).
- This action creates only the account's workers.dev namespace. It did not create a Worker, Access application, identity provider, zone, DNS record, API token, secret, or paid subscription.

Official documentation says workers.dev is included with Workers accounts and intended for personal/hobby projects: https://developers.cloudflare.com/workers/configuration/routing/workers-dev/ . The official Workers Free pricing/limits docs describe the Free allocation: https://developers.cloudflare.com/workers/platform/pricing/ and https://developers.cloudflare.com/workers/platform/limits/ . This documentation does not prove the connected account's current subscription or card requirements; Billing Read is unavailable to this OAuth connection.

Updated status:
- Cloudflare connector: AUTHENTICATED.
- workers.dev namespace: PROVISIONED / VERIFIED.
- Worker scripts: NONE.
- Workers Free plan entitlement: NOT VERIFIED (billing scope unavailable).
- Cloudflare Access: DISABLED / NOT REQUIRED for the proposed application-level GitHub OAuth alternative.
- GitHub OAuth application credentials: NOT CONFIGURED / NOT AVAILABLE through current GitHub connector.
- Secure application authentication implementation: NOT STARTED.
- Preview/deployment: NOT RUN. No unauthenticated UI published.

## GitHub exact-head and governance recheck

- Repository default branch: `Основной`; target/default HEAD remains `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Active ruleset `26550182` targets `refs/heads/Основной`, enforces PR, deletion and non-fast-forward restrictions; required approving reviews = 0, code-owner review disabled, no bypass actors. Independent review is still a project acceptance requirement; do not merge documentation or implementation branches without it.
- Default HEAD has six completed successful `Reconcile approved task queue` check runs (latest run 42114196331), but combined commit status remains pending with zero statuses; this is not an overall CI qualification.
- Existing UI PR #6 head `5b8469b3bb691ff48f8be9bda9aea0969d42f537`: static UI and workflow validation checks succeeded, but PR is draft/unmerged, based on stale base SHA `692025e4a039aaf94c6683bb95da38b4f324fce8`, and contains fixtures only (no API/auth/live data).
- Architecture PR #24 head `cc2003ec3cd01946df25f783842e54940b30a597`: zero check-runs, zero formal reviews, combined status pending; PR remains draft/unmerged. Exact-head CI and independent review NOT VERIFIED.
- PR #23 mobile scope and several security/worker PRs remain separate open drafts with different base SHAs. Do not combine them blindly.
- Governance issue #1 remains OPEN. Production dispatch stays disabled/fail-closed; no controller or worker dispatch was invoked.

## Next bounded step

Rebase or reconstruct the graphite UI prototype on the current default baseline only after reviewing the PR #6 diff and preserving its exact provenance. Implement a no-secret local Hono/Workers fixture with server-side GitHub OAuth contract and negative tests; do not expose a public app until the OAuth App credentials are explicitly provisioned through the owner's GitHub settings and the secure session implementation has independent review. Before any deploy, verify account plan entitlement through an authorized billing read or dashboard evidence; do not infer Free from account type or workers.dev availability.
