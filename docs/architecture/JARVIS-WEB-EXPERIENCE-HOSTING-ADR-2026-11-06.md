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

Select **Cloudflare Workers Static Assets + a small Hono API** as the preferred hosting candidate for a first read-only web console, subject to confirmation of the actual account's Workers Free entitlement and application-session security qualification. Cloudflare Access is not required for this design.

This is a serverless managed runtime, not an owner-operated worker server and not a persistent GitHub Actions runner. It is not yet connected to the account and is not deployed. Selecting it as the preferred candidate does not authorize creating credentials, deploying, or incurring charges.

Reuse the existing graphite HTML/CSS/vanilla-JS dashboard. Do not rewrite the frontend merely to introduce a framework. Use Hono only for the server-side API/router, with same-origin `/api/*` routes and static assets from the existing dashboard.

### Proposed request path

```text
iPhone / Desktop browser
        |
        | HTTPS, application session cookie
        v
Application GitHub OAuth callback (identity gate)
        |
        | server-side validated GitHub OAuth identity
        v
Cloudflare Worker
  - validate OAuth state and callback response
  - resolve GitHub numeric user ID server-side and enforce exact owner allowlist
  - issue a short-lived opaque host-only session cookie
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

No browser-to-GitHub privileged API path exists. The browser never receives a GitHub token, PAT, GitHub App private key, provider key, or workflow token. The initial implementation does not need a Pool task database or parallel task ledger. It does require a dedicated, narrowly scoped D1 database for OAuth transaction state and opaque application-session validity/revocation; GitHub remains the task/evidence source of truth. The session database is a separate security domain and must never be reused as the Pool task ledger.

### Authentication model — application-issued session

Cloudflare Access is **not part of this deployment path**: the owner cannot complete its payment-details onboarding, and the project must not depend on Access or ask for another payment instrument. The application instead uses server-side GitHub OAuth followed by an application-issued opaque session cookie.

Required flow and controls before any protected route is enabled:

1. Generate a cryptographically random, single-use OAuth `state` value; bind it to a short-lived pre-authentication cookie and validate it exactly on callback. Reject missing, mismatched, expired or replayed state.
2. Exchange the authorization code only on the Worker server side. Validate the GitHub response and retrieve the authenticated account's immutable numeric user ID from GitHub; never trust a login name or callback-supplied identity field.
3. Enforce an exact numeric owner-ID allowlist. Deny all other identities; do not provide self-service registration or role escalation in v1.
4. Issue a high-entropy opaque session identifier in a `__Host-jarvis_session` cookie with `Secure; HttpOnly; SameSite=Lax; Path=/` and no `Domain`. Keep session validity, expiry and revocation server-side; never place OAuth access tokens in browser storage or return them to client JavaScript.
5. Validate the session on every protected API request. Expire and revoke sessions server-side, rotate after authentication, and reject missing, malformed, expired or revoked sessions. Do not treat possession of a GitHub OAuth callback URL as an authenticated session.
6. Keep the v1 API GET-only. Enforce same-origin request policy and restrictive CORS (none by default); do not expose mutation, approval, dispatch, or arbitrary proxy endpoints.
7. Protect the OAuth callback against login CSRF and replay; validate exact callback origin/host and redirect destinations. Use fixed GitHub API hosts and repository paths, bounded timeouts, response-size limits, and no caller-controlled upstream URLs.

The Worker must not expose a privileged GitHub token, PAT, GitHub App private key, provider key or workflow token to the browser. OAuth/session implementation is NOT IMPLEMENTED and must remain fail-closed until negative tests and independent security review pass. The session-cookie contract in the OpenAPI document is a target, not evidence of implementation.
## Options considered

| Option | Advantages | Limitations | Disposition |
|---|---|---|---|
| GitHub Pages alone | Free static hosting, easy GitHub integration | Static only; no trusted server-side API, secret isolation or server authorization | REJECT as complete solution; may host a UI-only mock |
| GitHub Pages + separate API | Reuses Pages and separates backend | Two origins/services, CORS/session complexity, separate deployment and security boundary | Viable fallback, more moving parts |
| Workers Static Assets + Hono API + application-level GitHub OAuth | One origin for UI/API; managed HTTPS; no always-on VM; static files and API routes can share one Worker; Hono is portable across runtimes | Provider dependency; Free quotas and application-session controls must be verified; deploy token requires owner-managed setup | PREFERRED CANDIDATE, NOT QUALIFIED |
| Open WebUI | Mature existing web application, authentication and API surface, model-provider integrations | Primarily a model/chat interface; adds a persistent application/data stack and does not replace Pool Bridge, task authority or Jarvis-specific evidence UX | REUSE selectively for later model experimentation, not the primary pool console |
| GitHub Actions runner as web host | No separate host account | Ephemeral job lifecycle, queued/delayed starts, finite runtime; no durable listener or availability | REJECT |
| Owner-operated server / external node | Full control over runtime and storage | Conflicts with the web-first / no-server dependency; adds patching, uptime, network exposure and hardware qualification | DEFER to later external-server phase |

## Free-tier and operational constraints

The current Cloudflare Workers documentation lists the Free plan at 100,000 Worker requests/day, 10 ms CPU time per invocation and 128 MB memory; static asset files have documented per-file and per-version limits. D1 Free currently lists 5 million rows read/day, 100,000 rows written/day and 5 GB total storage. The initial read-only console requires one dedicated D1 session database, not a Pool task ledger. Its usage must remain within the documented Workers Free limits; quota exhaustion is a hard fail-closed outage, never a paid fallback.

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
| Spoofed identity header / forged session | Validate single-use OAuth state and server-side opaque-session lookup; reject missing, malformed, expired or revoked sessions |
| Browser token or secret exfiltration | No provider/GitHub credentials in browser; no tokens in localStorage/sessionStorage; server-side-only secrets if ever approved |
| XSS from issue text, workflow titles, logs or artifacts | Treat all GitHub content as untrusted text; use text nodes, no `innerHTML` for remote data; strict CSP |
| CSRF / cross-origin requests | Same-origin API; GET-only v1; reject unexpected Origin/Host; no permissive CORS; future mutations require CSRF and explicit authorization |
| SSRF / open proxy | Fixed GitHub API host and repository path allowlist; no user-supplied upstream URL or arbitrary fetch target |
| Prompt injection embedded in task/log text | Render as untrusted content; never interpret it as instructions or API routing policy |
| Stale or fabricated status | Timestamp and source SHA on every data group; explicit STALE/UNAVAILABLE/NOT_VERIFIED; never synthesize runner metrics |
| GitHub API exhaustion | Cache, ETag, bounded concurrency, respect 403/429 and reset headers; no aggressive retry |
| Unauthorized task execution | No mutation routes; no Actions dispatch from browser; Pool Bridge remains sole mediator |
| Artifact disclosure | Link-only in v1; no arbitrary download proxy; artifact access requires a separate authorization decision |

Recommended response headers: strict Content-Security-Policy (including `frame-ancestors 'none'`), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and a restrictive Permissions-Policy. Use secure host-only application session cookies issued only after server-side GitHub OAuth and owner-ID authorization. Do not log cookies, JWTs, authorization headers or query-string credentials.

## Deployment and rollback plan

1. Confirm hosting-provider choice, account plan, Workers Free entitlement and OAuth implementation readiness and no-cost entitlement. No deployment before this check.
2. Implement locally with pinned dependencies and fixtures; add OpenAPI validation, OAuth-state/session negative tests, API allowlist tests, XSS/SSRF fixtures and browser smoke tests.
3. Deploy only to a non-production preview with no secrets and synthetic/public data; verify the application session protects both static application entry points and API routes consistently.
4. Complete independent security review and exact-head CI; verify the preview from desktop and iPhone browser.
5. Only then consider production deployment. Deployment credentials must be narrowly scoped, stored only as GitHub Actions secrets, and never exposed to PR code or artifacts. Use an owner-approved environment with deployment protection.
6. Rollback by redeploying the last accepted immutable Worker version and reverting the static asset bundle. Preserve audit metadata; do not alter Pool Bridge or task state during rollback.

No Cloudflare account was accessed, no token/secret was created or read, and no deployment was attempted in this ADR pass.

## Consequences and unresolved gates

- The current HTML/CSS/JS prototype can be retained with minimal adaptation.
- GitHub remains the source of truth for issues and workflow evidence. A dedicated D1 database is required only for OAuth one-time transactions and application sessions; no Pool task ledger is introduced.
- The console is a remote user interface, not the runtime for workers and not a continuous scheduler.
- Cloudflare Workers + application-level GitHub OAuth is only a preferred candidate. Actual account entitlement, application session enforcement across static assets and API, domain availability, free-tier quota and deploy credential scope remain NOT VERIFIED.
- This ADR does not authorize paid resources, secret creation, deployment, production mutations, dispatch, model calls or external worker/server integration.
- If Cloudflare Workers Free + application-level GitHub OAuth cannot meet the no-cost and security requirements, compare the GitHub Pages + separately hosted free API option or defer deployment; do not silently select a paid plan.

## References

- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Cloudflare Workers Static Assets SPA routing](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/)
- [Cloudflare Static Assets bindings and run_worker_first](https://developers.cloudflare.com/workers/static-assets/binding/)
- [Cloudflare Workers routing and Static Assets](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)
- [GitHub OAuth web application flow](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)
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

1. Historical observation at the time of the initial inspection: no `workers.dev` subdomain existed. This prerequisite was later resolved by provisioning and API read-back of `jarvis-developer-cloud-pool` (see Autonomous provisioning result below).
2. Cloudflare Access remains disabled and is not required for the application-level GitHub OAuth design.
3. No custom zone/domain was available in the inspected account; the provisioned `workers.dev` hostname is the current candidate preview origin, subject to qualification.
4. Workers Free entitlement remains NOT VERIFIED because Billing Read is unavailable to the connected OAuth integration. Do not infer entitlement from the namespace's existence.
5. Before deployment, re-run read-only account inspection and verify the exact no-cost entitlement. Do not deploy a public, unauthenticated dashboard as a workaround.

Disposition: Cloudflare account connection VERIFIED; deployment prerequisites BLOCKED / NOT SATISFIED. This is a useful blocker discovery, not a deployed pool.


## Owner payment constraint and no-card authentication alternative — 2026-11-06

Cloudflare Zero Trust onboarding requires payment details even when the Free plan is selected; Cloudflare states that the Free plan is not charged. See https://developers.cloudflare.com/cloudflare-one/setup/ . The owner reports that their card is not accepted. Zero Trust is therefore BLOCKED and must not be treated as a required dependency for the first web-console milestone. Do not request repeated card attempts, alternate payment instruments, or a bypass of billing verification.

Retain Cloudflare Workers Free as a candidate only. The official Workers pricing/limits documentation lists a Free allocation (100,000 requests/day and 10 ms CPU per invocation): https://developers.cloudflare.com/workers/platform/pricing/ and https://developers.cloudflare.com/workers/platform/limits/ . This does not itself prove that this specific account can provision a workers.dev subdomain or deploy without payment details. Cloudflare documents workers.dev provisioning from the Workers & Pages dashboard: https://developers.cloudflare.com/workers/configuration/routing/workers-dev/ .

Candidate alternative to Access: application-level server-side GitHub OAuth, with an exact owner numeric GitHub user-ID allowlist, state/CSRF validation, secure HttpOnly/Secure/SameSite cookies, short-lived signed sessions, and no OAuth token or privileged credential exposed to the browser. This is PLANNED only. Protocol details, OAuth App requirements, callback handling, cookie/session design, abuse controls and negative tests require implementation and independent security review before deployment. The existing API remains GET-only; no mutation or dispatch routes are added.

If Workers Free cannot be provisioned without payment details, stop and compare no-card hosting alternatives using official vendor terms and measured constraints. Never publish an unauthenticated dashboard or introduce a paid fallback.

Evidence and current disposition: [2026-11-06 no-card deployment-path report](../reports/2026-11-06-cloudflare-no-card-deployment-path.md). Zero Trust BLOCKED / NOT REQUIRED; Workers Free CANDIDATE / NOT VERIFIED; GitHub OAuth PLANNED / NOT IMPLEMENTED; deployment NOT RUN.


## Autonomous provisioning result — 2026-11-06

A project-specific workers.dev namespace was provisioned via the Cloudflare API after the owner requested autonomous action: `jarvis-developer-cloud-pool`. Follow-up GET read-back returned the same value. This creates only the account namespace; there is no Worker script or application deployment. The connected OAuth session cannot read account subscriptions (HTTP 403 / error 10000, Billing Read scope unavailable), so Workers Free entitlement remains NOT VERIFIED. Access remains disabled (HTTP 403 / error 9999), and no zone exists. No payment or billing data was accessed. Do not treat workers.dev provisioning as proof of Free-plan entitlement or as authorization to deploy.

Evidence: [Cloudflare no-card deployment path report](../reports/2026-11-06-cloudflare-no-card-deployment-path.md). Current disposition: namespace PROVISIONED / VERIFIED; Workers Free entitlement NOT VERIFIED; application authentication NOT IMPLEMENTED; deployment NOT RUN.


## Authentication contract correction — 2026-11-06

Cloudflare Access is disabled and not required for the first milestone because the owner cannot complete the payment-details onboarding. The OpenAPI security scheme has been changed to the intended application-issued `__Host-jarvis_session` cookie. The cookie must be issued only after server-side GitHub OAuth callback validation, state/CSRF validation and exact numeric GitHub user-ID allowlisting; it must be Secure, HttpOnly, host-only, SameSite=Lax or stricter, Path=/, and bounded by server-side expiry/revocation. OAuth tokens must never reach browser code. This remains a design contract only; OAuth App registration, callback, session store/signing, implementation and negative tests are NOT IMPLEMENTED.

The workers.dev namespace `jarvis-developer-cloud-pool` is now PROVISIONED / VERIFIED by API PUT + GET. Workers scripts remain empty. Workers Free subscription entitlement is NOT VERIFIED because Billing Read is not available to the connected OAuth integration. Deployment remains NOT RUN.


## Runtime framework selection — 2026-11-06

The selected server baseline is the official Hono Cloudflare Workers starter, with Cloudflare Workers Static Assets serving the existing vanilla HTML/CSS/JS dashboard on the same origin. The official Hono guide documents the `create-hono` Cloudflare Workers template, Wrangler local development, Static Assets and Workers runtime testing: https://hono.dev/docs/getting-started/cloudflare-workers . Cloudflare's official Hono guide documents its full-stack React + Hono template and same-origin Static Assets architecture: https://developers.cloudflare.com/workers/framework-guides/web-apps/more-web-frameworks/hono/ .

For this first milestone, do not migrate the existing static dashboard to React solely to adopt the React template. Retain the existing interface and use the lighter Hono Workers starter. Generate the scaffold from the official template, verify the current dependency versions, commit the generated lockfile and pin exact versions; do not hand-author an incomplete dependency tree or float `latest` tags. Hono 4.13.16 and Wrangler 4.158.0 are pinned exactly in the prototype package manifest. PR #25 commits an npm v3 lockfile with 93 package entries (blob SHA `9d0d18ca770ee329d3260ae0503cf0a58ee19ce9`); its workflow installs with `npm ci --ignore-scripts --no-audit --no-fund`. Exact-head CI evidence is recorded in the prototype implementation report. This establishes a reproducible install path on the GitHub Actions runner, not independent dependency/security qualification. Official release references: https://github.com/honojs/hono/releases and https://github.com/cloudflare/workers-sdk/releases .

The first runtime slice must remain fail-closed: no public deployment, no live data endpoints until GitHub OAuth/session validation is implemented and independently reviewed, and no mutations or dispatch routes. The current Hono prototype returns 503 AUTHENTICATION_NOT_CONFIGURED for protected reads while auth is absent; after a qualified session layer is implemented, unauthenticated/unauthorized requests should use the contract's 401/403 semantics. Health must not imply pool health. See [Hono runtime selection report](../reports/2026-11-06-hono-runtime-selection.md).


## Hono prototype implementation — 2026-11-06

An isolated implementation proposal now exists in [PR #25](https://github.com/VlDMlNSh/developer-cloud-pool/pull/25), based on the default branch SHA `64d2636d4500127e635c214ccfb722c6b3fcda80`. It reuses the existing static dashboard, adds Hono API health semantics, fails closed on protected reads and rejects mutation methods. Initial exact-head CI passed syntax, 4 API negative/fail-closed tests and static UI validation. The PR report records run IDs and SHA evidence. The PR now contains the committed lockfile and `npm ci` workflow. The current PR head has exact-head CI evidence recorded in its run history; no OAuth, secrets or deployment are present; independent review and qualification remain outstanding.


## Reproducible dependencies — 2026-11-06

The isolated Hono prototype in [PR #25](https://github.com/VlDMlNSh/developer-cloud-pool/pull/25) now commits an npm v3 lockfile with 93 package entries (blob SHA `9d0d18ca770ee329d3260ae0503cf0a58ee19ce9`). CI now uses `npm ci` rather than resolving packages on every run. Exact-head CI after the lockfile and workflow changes is required before dependency reproducibility is considered qualified. OAuth/session, independent security review and deployment remain incomplete.


## Exact-head CI — 2026-11-06

PR #25 head `21839a314db6c1f72b71dadfb1fadd96d4bc38a7` has 2/2 successful checks: Hono validation (run `42174718716`, job `127750439087`) including `npm ci`, static checks, 4 API tests and static dashboard validation; and workflow/security validation (run `42174718720`, job `127750439342`). This is CI evidence only. PR remains draft/unmerged with no independent review; authentication, deployment and security qualification remain incomplete.


## Session persistence decision — 2026-11-11

**Decision: use a dedicated Cloudflare D1 database for the Experience application's authentication transaction and session records. Do not use Workers KV as an authentication authority, and do not use stateless signed cookies as the primary session mechanism.**

This resolves the earlier conflict between server-side session expiry/revocation and the "no database" statement. The no-database statement is narrowed: the first Experience slice does not need a Pool task database or task ledger, but it does need a dedicated session store.

### Why this option

- Workers KV is eventually consistent; Cloudflare documents that stale values can remain visible for 60 seconds or longer and KV is not an atomic transactional store. It cannot establish immediate global revocation or strict one-use OAuth state consumption.
- Stateless signed cookies can provide integrity and expiry but do not provide immediate per-session revocation without introducing a separate revocation authority. That conflicts with the existing ADR's server-side revocation requirement.
- D1 is available on Workers Free and supports transactional SQL. The published Free limits currently include 5 million rows read/day, 100,000 rows written/day, 5 GB total account storage, up to 10 databases/account and 500 MB per database. Cloudflare began enforcing D1 Free daily row limits on 2026-09-01; when exceeded, queries fail until reset. The connected account's actual Workers Free entitlement remains NOT VERIFIED.

### Required isolation and data model

- Create a dedicated database for Jarvis Experience auth/session records only, with a distinct database ID and binding from every Pool task/attempt/projection database.
- Bind it only to the authenticated Hono Experience Worker. Inventory every Worker and deployment workflow with this binding. Never expose D1 access to browser code, static assets, generic public RPC, task Worker, or Supervisor.
- Do not put task payloads, approvals, provider credentials, OAuth access tokens or Pool task state in this database.
- Store only a cryptographic hash of each high-entropy opaque session identifier; the raw identifier exists only in the Secure/HttpOnly cookie. Store numeric GitHub user ID, created/expiry timestamps and nullable revocation timestamp.
- Store OAuth state/transaction hashes with strict expiry and a consumed marker. Consume a transaction with one conditional database write that succeeds only when the hash matches, it is unconsumed and unexpired. A duplicate/replayed callback must have zero successful consumers.
- Use parameterized SQL, STRICT tables, bounded indexes and explicit retention cleanup. Do not persist OAuth access tokens after the numeric GitHub identity is verified.
- On every protected request, validate the session against the D1 primary state; require both `revoked_at IS NULL` and `expires_at >` trusted current time. Never trust a cookie's claims as the authorization record.
- If read replication is enabled in the future, every auth/session validation must start a D1 Sessions API context with `withSession("first-primary")` so the first lookup sees the latest primary state. Do not accept caller-supplied D1 bookmarks as an authorization freshness guarantee.
- Database errors, unavailable binding, missing rows, malformed rows, expired sessions, revoked sessions and quota exhaustion all fail closed. For infrastructure/quota errors return a generic unavailable response (503); do not downgrade to KV, stateless cookies, cached session decisions, or paid resources.
- Keep the application owner-ID allowlist independent from session persistence. D1 session presence is not a role grant and cannot enable task mutations or dispatch.

### Free-only quota and operational acceptance

- Budget every authenticated API request for a bounded indexed session lookup; avoid per-request session writes.
- Record rows_read/rows_written from D1 result metadata in aggregate operational metrics without logging session IDs, cookies, hashes, OAuth state or tokens.
- Define hard request budgets, stale-session cleanup, maximum database size and explicit stop conditions before provisioning.
- On Free quota exhaustion, preserve data, return unavailable, and wait for reset or stop; no paid upgrade/overage/fallback.
- Before provisioning, independently verify this account's exact Workers Free entitlement, D1 availability and quotas through authorized account metadata. Public plan documentation is not account-specific entitlement proof.

### Required tests before enabling any protected route

1. Concurrent duplicate OAuth callback: exactly one state-consumption winner.
2. State mismatch, expiry, replay and malformed hash: reject.
3. Session creation, rotation, expiry and explicit revocation.
4. Revocation read-after-write from a fresh Worker request; verify no stale authorization result.
5. Database/binding outage and daily quota-exceeded response: fail closed without fallback.
6. SQL injection inputs, malformed cookie, session hash collision handling and user-ID allowlist rejection.
7. Cross-boundary negative tests proving the Pool Worker, Supervisor and browser cannot reach the auth database or its binding.
8. Migration reproducibility, indexed query plans, retention cleanup, Free quota budget and backup/restore procedure.

This is an architecture decision only. No database, binding, migration, secret, Worker, OAuth App, route or deployment was created or changed by this decision. Protected routes remain disabled until implementation, exact-head CI, browser QA and independent security review pass.


## Superseding session-store decision — 2026-11-11

**Decision:** use one dedicated Cloudflare D1 database for Jarvis Experience authentication/session state only. Do not use Workers KV as the authoritative OAuth-state or session-revocation store. Do not use stateless signed cookies as a silent substitute for the existing server-side revocation contract.

This section supersedes earlier statements in this ADR that the first slice needs no database or should avoid D1 entirely. Those statements remain true only for the Pool task/evidence ledger: the Experience Worker must not create a parallel task ledger. The D1 database selected here is a separate, minimal authentication-state store.

### Rationale and boundary

- The existing contract requires one-time OAuth state, replay rejection, bounded session expiry and server-side revocation.
- Cloudflare KV is eventually consistent and cannot provide the immediate, atomic consume/revoke semantics required for these security decisions. KV is therefore rejected as the authentication authority.
- D1 provides transactional SQL semantics suitable for conditional state transitions. It does not provide per-table SQL roles for separate Workers sharing the same binding. Consequently, do not claim database-enforced least privilege between Worker modules or separate Workers that share this binding.
- Keep one Hono Worker as the sole D1 binding holder. Expose only narrow internal repository functions to OAuth/session middleware; no public database proxy or generic SQL route. This is a source-level application boundary, not a D1-enforced role boundary.
- The D1 database must contain only hashed opaque session identifiers, OAuth state/nonce digests, immutable GitHub numeric subject ID, creation/expiry/revocation timestamps and minimal audit metadata. Never store OAuth access tokens in the browser; avoid persisting them at all in v1.
- GitHub remains the source of truth for tasks and workflow evidence. The session database cannot create, authorize, mutate or dispatch Pool work.

### Required transaction contract

1. OAuth state issuance stores only a cryptographic digest, a short expiry, and a nonce/challenge binding. Callback validation must atomically consume the exact unexpired digest; replay, mismatch, expiry and concurrent second consumption fail closed.
2. Session issuance creates a cryptographically random opaque cookie value; only its digest is stored. The cookie is Secure, HttpOnly, host-only, SameSite=Lax or stricter, Path=/, and bounded by a server-side expiry.
3. Every protected request checks the digest, subject allowlist, expiry and revocation state against D1. Database errors, timeout, ambiguous write/readback or unavailable D1 return an unavailable/unauthorized fail-closed result; never fall back to KV or stateless acceptance.
4. Logout/revocation is a conditional update scoped to the exact session digest and active state. The API must not claim revocation until the transaction commits. A failed/ambiguous revocation is surfaced as failure and the session is not reported as revoked.
5. Session rotation revokes the prior session and creates the replacement in one transaction. Concurrent rotation/replay tests must prove only one successor is accepted.
6. Cleanup is bounded, indexed and non-authoritative: expiry checks happen on every request even if cleanup is delayed. Cleanup cannot revive, extend or reissue sessions.

### Free-plan budget and operational controls

- Apply explicit application caps well below the Free ceilings; do not use plan maxima as normal operating targets.
- Budget D1 reads/writes per authenticated request and OAuth transition. Use indexed exact-key lookups, bounded retention cleanup, bounded result sets and request rate limits.
- Set a conservative per-day session-state read/write budget and fail closed with a clear degraded response when the application budget is exhausted. No paid fallback, alternate billable storage or unbounded retries.
- Keep the database dedicated to the Experience session boundary. Do not colocate projection outbox, task claims, supervisor leases or recovery grants.
- Define migration versioning, export/backup, restore drill, retention/deletion, rollback and quota alarms before provisioning.
- D1 Time Travel and export/import behavior must be checked against current documentation before adopting a backup/restore objective; no backup guarantee is assumed by this ADR.

### Required qualification before deployment

Test: OAuth state mismatch, expiry, replay and concurrent consume; wrong GitHub numeric subject; session digest mismatch; expiry; revocation; concurrent logout/rotation; D1 unavailable/timeout; ambiguous write; quota exhaustion; cleanup race; migration rollback; restore; and absence of any Pool/task mutation route. Verify no token/cookie material in logs or artifacts. Verify same-origin and browser security controls independently.

**Status:** architecture choice RECORDED / NOT IMPLEMENTED / NOT QUALIFIED. D1 database NOT PROVISIONED. No secret, migration, Worker deployment, OAuth App setup or dispatch was performed. Provisioning remains gated on exact-head contract tests, security review and a Free-only resource budget.
