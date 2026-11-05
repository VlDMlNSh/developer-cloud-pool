# ADR — Jarvis Web Experience hosting and trust boundary

- **Date:** 2026-11-06
- **Status:** PROPOSED CANDIDATE / NOT DEPLOYED / NOT QUALIFIED
- **Issue:** [#22 — primary secure web console](https://github.com/VlDMlNSh/developer-cloud-pool/issues/22)
- **Immutable baseline:** `Основной` @ `64d2636d4500127e635c214ccfb722c6b3fcda80`

## Context

The current `web/jarvis-dashboard/` is a static, read-only prototype. It contains hard-coded demonstration rows and explicitly states that there is no live API. The Pool Supervisor is an event-driven GitHub Actions workflow, not a daemon; GitHub-hosted runners are ephemeral. Neither the dashboard nor a running Actions job is a persistent web host.

The first product milestone is a remotely accessible console that works in desktop and iPhone browsers. Native iOS Mobile AI and external owner-operated worker/server integration remain later phases.

The web console is an **Experience plane**, not a control plane. The Pool Bridge remains the only authorized mediator for task mutations and dispatch. The UI cannot become an alternate issuer, task ledger, capability authority or dispatcher.

## Decision

Select **Cloudflare Workers Static Assets + a small Hono API** as the preferred hosting candidate for a first read-only web console, subject to owner approval of the hosting provider, confirmation of the actual account's free-plan/Access entitlements, and security qualification.

This is a serverless managed runtime, not an owner-operated worker server and not a persistent GitHub Actions runner. It is not yet connected to the account and is not deployed. Selecting it as the preferred candidate does not authorize creating credentials, deploying, or incurring charges.

Reuse the existing graphite HTML/CSS/vanilla-JS dashboard. Do not rewrite the frontend merely to introduce a framework. Use Hono only for the server-side API/router, with same-origin `/api/*` routes and static assets from the existing dashboard.

### Proposed request path

```text
iPhone / Desktop browser
        |
        | HTTPS, Access session cookie
        v
Cloudflare Access (identity gate)
        |
        | signed Cf-Access-Jwt-Assertion
        v
Cloudflare Worker
  - verify JWT signature, issuer, audience, exp, nbf
  - map authenticated subject to an allowlisted role
  - enforce GET-only API surface
  - fixed GitHub repository/API allowlist
  - bounded cache + rate-limit handling
        |
        | unauthenticated read-only HTTPS GETs for public data
        v
GitHub REST API (public repository metadata, issues, workflow runs)
        |
        v
Typed, minimized API response -> graphite dashboard
```

No browser-to-GitHub privileged API path exists. The browser never receives a GitHub token, PAT, GitHub App private key, provider key, or workflow token. The initial implementation does not need a database: GitHub remains the existing task/evidence source of truth; the Worker must not create a parallel task ledger.

### Authentication nuance

Cloudflare documents that Access can protect a Worker and expose identity through `ctx.access`, but also documents that the internal Static Assets router does **not** pass `ctx.access` to the user Worker. Therefore, the proposed combined Static Assets + API design must not assume `ctx.access` exists. The API must validate the Access-signed `Cf-Access-Jwt-Assertion` header itself (signature using the documented JWKS, exact issuer, configured audience, expiry and not-before) and fail closed on missing/invalid claims. The Access cookie is handled by the Access edge; no custom client-side token storage is introduced.

Before implementation, verify the exact behavior on the chosen Worker deployment configuration with a no-secret test. If Access assertion delivery cannot be proven for the selected route, stop and choose a separately protected API origin or a reviewed alternative; do not silently trust user-supplied identity headers.

## Options considered

| Option | Advantages | Limitations | Disposition |
|---|---|---|---|
| GitHub Pages alone | Free static hosting, easy GitHub integration | Static only; no trusted server-side API, secret isolation or server authorization | REJECT as complete solution; may host a UI-only mock |
| GitHub Pages + separate API | Reuses Pages and separates backend | Two origins/services, CORS/session complexity, separate deployment and security boundary | Viable fallback, more moving parts |
| Workers Static Assets + Hono API + Access | One origin for UI/API; managed HTTPS; no always-on VM; static files and API routes can share one Worker; Hono is portable across runtimes | Provider dependency; Free quotas; Access account/plan and JWT behavior must be verified; deploy token requires owner-managed setup | PREFERRED CANDIDATE, NOT QUALIFIED |
| Open WebUI | Mature existing web application, authentication and API surface, model-provider integrations | Primarily a model/chat interface; adds a persistent application/data stack and does not replace Pool Bridge, task authority or Jarvis-specific evidence UX | REUSE selectively for later model experimentation, not the primary pool console |
| GitHub Actions runner as web host | No separate host account | Ephemeral job lifecycle, queued/delayed starts, finite runtime; no durable listener or availability | REJECT |
| Owner-operated server / external node | Full control over runtime and storage | Conflicts with the web-first / no-server dependency; adds patching, uptime, network exposure and hardware qualification | DEFER to later external-server phase |

## Free-tier and operational constraints

The current Cloudflare Workers documentation lists the Free plan at 100,000 Worker requests/day, 10 ms CPU time per invocation and 128 MB memory; static asset files have documented per-file and per-version limits. D1 Free currently lists 5 million rows read/day, 100,000 rows written/day and 5 GB total storage. The initial read-only console should avoid D1 entirely.

The Free plan is a hard operating boundary, not a reason to silently upgrade. On quota exhaustion, the console must show a degraded/unavailable state and preserve fail-closed behavior. Paid fallback, paid Workers, paid identity features or other billable resources are prohibited without a separate explicit owner decision.

The first data adapter can read only public repository data. GitHub documents 60 unauthenticated REST requests/hour for public data, so the Worker must aggregate requests, use bounded caching/ETags, honor rate-limit headers and back off on 403/429. No tight polling loop. If that proves insufficient, stop and propose a separately reviewed GitHub App read-only adapter; do not insert a PAT or GitHub App key as a shortcut.

## API and data contract

The first version is read-only and defined in [Jarvis Experience API v1](../../contracts/jarvis-experience-api-v1.yaml).

- `GET /api/v1/health`: service health only; no infrastructure detail or secret metadata.
- `GET /api/v1/pool/summary`: repository/default SHA, observed dispatch gate state and explicit runtime/telemetry availability.
- `GET /api/v1/tasks` and `GET /api/v1/tasks/{taskId}`: read-only GitHub issue-backed task view.
- `GET /api/v1/workflow-runs`, `GET /api/v1/workflow-runs/{runId}`, and `GET /api/v1/workflow-runs/{runId}/jobs`: run/job metadata and links to GitHub evidence.
- Logs and artifacts are link-only in v1 unless public read access is independently proven. Do not proxy arbitrary artifact URLs or accept caller-supplied upstream URLs.

All responses carry observation time, source identity/ref/SHA where applicable, and a data availability state. Unknown is not zero. A queued workflow is not a running worker. A planned worker profile is not an available executor. The 20 logical slots are a concurrency ceiling, not a count of live machines.

## Authorization matrix

| Role | v1 read-only views | Task creation/cancel | Approve/dispatch | Role admission |
|---|---|---|---|---|
| Viewer | Yes | No | No | Allowlisted identity only |
| Operator | Yes | No | No | Reserved; not provisioned in v1 |
| Approver | Yes | No | No | Reserved; not provisioned in v1 |

Every HTTP method other than the documented GET/HEAD methods returns 405. There are no mutation endpoints in v1. Future task intake, cancellation or approval requires separate acceptance of the Pool Bridge contract and governance gates; adding a UI button does not grant authority.

## Threat model and mandatory controls

| Threat | Required control |
|---|---|
| Spoofed identity header / forged JWT | Validate Access JWT signature and claims; exact issuer/audience; reject missing/invalid token |
| Browser token or secret exfiltration | No provider/GitHub credentials in browser; no tokens in localStorage/sessionStorage; server-side-only secrets if ever approved |
| XSS from issue text, workflow titles, logs or artifacts | Treat all GitHub content as untrusted text; use text nodes, no `innerHTML` for remote data; strict CSP |
| CSRF / cross-origin requests | Same-origin API; GET-only v1; reject unexpected Origin/Host; no permissive CORS; future mutations require CSRF and explicit authorization |
| SSRF / open proxy | Fixed GitHub API host and repository path allowlist; no user-supplied upstream URL or arbitrary fetch target |
| Prompt injection embedded in task/log text | Render as untrusted content; never interpret it as instructions or API routing policy |
| Stale or fabricated status | Timestamp and source SHA on every data group; explicit STALE/UNAVAILABLE/NOT_VERIFIED; never synthesize runner metrics |
| GitHub API exhaustion | Cache, ETag, bounded concurrency, respect 403/429 and reset headers; no aggressive retry |
| Unauthorized task execution | No mutation routes; no Actions dispatch from browser; Pool Bridge remains sole mediator |
| Artifact disclosure | Link-only in v1; no arbitrary download proxy; artifact access requires a separate authorization decision |

Recommended response headers: strict Content-Security-Policy (including `frame-ancestors 'none'`), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and a restrictive Permissions-Policy. Use secure host-only session cookies as managed by Access. Do not log cookies, JWTs, authorization headers or query-string credentials.

## Deployment and rollback plan

1. Confirm hosting-provider choice, account plan, Access availability and no-cost entitlement. No deployment before this check.
2. Implement locally with pinned dependencies and fixtures; add OpenAPI validation, JWT negative tests, API allowlist tests, XSS/SSRF fixtures and browser smoke tests.
3. Deploy only to a non-production preview with no secrets and synthetic/public data; verify Access protects assets and API separately.
4. Complete independent security review and exact-head CI; verify the preview from desktop and iPhone browser.
5. Only then consider production deployment. Deployment credentials must be narrowly scoped, stored only as GitHub Actions secrets, and never exposed to PR code or artifacts. Use an owner-approved environment with deployment protection.
6. Rollback by redeploying the last accepted immutable Worker version and reverting the static asset bundle. Preserve audit metadata; do not alter Pool Bridge or task state during rollback.

No Cloudflare account was accessed, no token/secret was created or read, and no deployment was attempted in this ADR pass.

## Consequences and unresolved gates

- The current HTML/CSS/JS prototype can be retained with minimal adaptation.
- GitHub remains the source of truth for issues and workflow evidence; no database is required for the first read-only slice.
- The console is a remote user interface, not the runtime for workers and not a continuous scheduler.
- Cloudflare Workers + Access is only a preferred candidate. Actual account entitlement, Access behavior with Static Assets, domain availability, free-tier quota and deploy credential scope remain NOT VERIFIED.
- This ADR does not authorize paid resources, secret creation, deployment, production mutations, dispatch, model calls or external worker/server integration.
- If Cloudflare Free + Access cannot meet the no-cost and security requirements, compare the GitHub Pages + separately hosted free API option or defer deployment; do not silently select a paid plan.

## References

- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Cloudflare Workers Static Assets SPA routing](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/)
- [Cloudflare Static Assets bindings and run_worker_first](https://developers.cloudflare.com/workers/static-assets/binding/)
- [Cloudflare Access with Workers, including ctx.access limitations](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)
- [Cloudflare Access JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)
- [Hono Cloudflare Workers guide](https://hono.dev/docs/getting-started/cloudflare-workers)
- [Hono source repository](https://github.com/honojs/hono)
- [Open WebUI API reference](https://docs.openwebui.com/reference/)
- [GitHub REST API rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)


## Cloudflare account inspection — 2026-11-06

A read-only inspection was performed through the connected Cloudflare account. No account configuration was changed.

Observed state:
- One Cloudflare account is connected to this session.
- Workers Scripts list is empty: no existing Worker deployment was found.
- Workers subdomain lookup returns error 10007: no `workers.dev` subdomain has been provisioned.
- Access applications lookup returns error 9999: Cloudflare Access is not enabled for this account.
- Zones list is empty: no domain/zone is currently available in this account.
- Account type is reported as `standard`; this is not sufficient evidence of the Workers subscription plan. The actual billing/plan entitlement is NOT VERIFIED.
- No Access application, Access policy, identity provider, Worker, DNS record, secret, API token or deployment was created or changed.

### Blocking prerequisites

1. Owner must open the Workers & Pages dashboard once and provision a `workers.dev` subdomain. The account API explicitly reports that no subdomain exists.
2. Owner must decide whether to enable Cloudflare Access. Access is currently disabled. Enabling it is an account-level security configuration and was not performed.
3. No zone/domain exists in the connected account. For a first preview, use the provisioned `workers.dev` hostname only if its security and Access behavior can be qualified; otherwise a domain/zone must be separately provided and approved.
4. Confirm Workers Free plan and any Access entitlement from the account dashboard before any deployment. The account API's `type: standard` does not prove a no-cost Workers plan.
5. Re-run read-only account inspection after prerequisites are completed. Do not deploy a public, unauthenticated dashboard as a workaround.

Disposition: Cloudflare account connection VERIFIED; deployment prerequisites BLOCKED / NOT SATISFIED. This is a useful blocker discovery, not a deployed pool.


## Owner payment constraint and no-card authentication alternative — 2026-11-06

Cloudflare Zero Trust onboarding requires payment details even when the Free plan is selected; Cloudflare states that the Free plan is not charged. See https://developers.cloudflare.com/cloudflare-one/setup/ . The owner reports that their card is not accepted. Zero Trust is therefore BLOCKED and must not be treated as a required dependency for the first web-console milestone. Do not request repeated card attempts, alternate payment instruments, or a bypass of billing verification.

Retain Cloudflare Workers Free as a candidate only. The official Workers pricing/limits documentation lists a Free allocation (100,000 requests/day and 10 ms CPU per invocation): https://developers.cloudflare.com/workers/platform/pricing/ and https://developers.cloudflare.com/workers/platform/limits/ . This does not itself prove that this specific account can provision a workers.dev subdomain or deploy without payment details. Cloudflare documents workers.dev provisioning from the Workers & Pages dashboard: https://developers.cloudflare.com/workers/configuration/routing/workers-dev/ .

Candidate alternative to Access: application-level server-side GitHub OAuth, with an exact owner numeric GitHub user-ID allowlist, state/CSRF validation, secure HttpOnly/Secure/SameSite cookies, short-lived signed sessions, and no OAuth token or privileged credential exposed to the browser. This is PLANNED only. Protocol details, OAuth App requirements, callback handling, cookie/session design, abuse controls and negative tests require implementation and independent security review before deployment. The existing API remains GET-only; no mutation or dispatch routes are added.

If Workers Free cannot be provisioned without payment details, stop and compare no-card hosting alternatives using official vendor terms and measured constraints. Never publish an unauthenticated dashboard or introduce a paid fallback.

Evidence and current disposition: [2026-11-06 no-card deployment-path report](../reports/2026-11-06-cloudflare-no-card-deployment-path.md). Zero Trust BLOCKED / NOT REQUIRED; Workers Free CANDIDATE / NOT VERIFIED; GitHub OAuth PLANNED / NOT IMPLEMENTED; deployment NOT RUN.
