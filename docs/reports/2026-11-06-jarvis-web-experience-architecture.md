# Engineering report — 2026-11-06: Jarvis Web Experience architecture

## Objective and order

Primary milestone: secure remote web console usable from desktop and iPhone browser. Native iOS Developer Mobile AI is second; external owner-operated server integration is third.

## Immutable baseline

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch: `Основной`
- Target SHA: `64d2636d4500127e635c214ccfb722c6b3fcda80`
- Issue: https://github.com/VlDMlNSh/developer-cloud-pool/issues/22
- Architecture branch: `docs/jarvis-web-experience-adr-2026-11-06`

## Verified source state

- `README.md` blob: `fea44c2485b604432ab9ee20293c3e1f7ee8bdec`. It describes the 20-slot architecture as DESIGN, Supervisor/Worker as scaffold / NOT RUN, and cloud runtime deployment as NOT RUN.
- `docs/architecture/JARVIS-HYBRID-PLATFORM-REFERENCE-ARCHITECTURE.md` blob: `98f84dd24814ca91d4ade45fb3cf57535d8884ba`. It separates Experience, Intelligence, Pool Bridge control, execution, data and evidence planes; it explicitly states that the UI is not a security boundary.
- `docs/architecture/GITHUB-POOL-SUPERVISOR-AND-RECOVERY.md` blob: `3ac28f2f105a20a4eed5d93168bbe84d2d5273b8`. Supervisor is event-driven/best-effort, not an always-on daemon; GitHub Actions jobs are ephemeral.
- Existing dashboard source is on PR #6 branch, not default branch. `app.js` blob `5f66ca7e2a92bcdf78f7fe30e838a4022844baeb` explicitly states static fixtures only/no network/no credentials/no dispatch. `styles.css` blob `0053995a0cfa3ce1b18fe2662bfa93b354a7c040` contains the graphite palette.
- Issue #1 remains OPEN; active repository Ruleset ID `26550182`; `POOL_DISPATCH_ENABLED=false` must remain fail-closed. Do not infer dispatch qualification from CI success.
- Issue #22 is the controlling web-console work item.
- PR #23 (mobile media assistant scope) is OPEN/DRAFT; exact-head status has zero check-runs and zero formal reviews. It remains separate from this web-first task.

## Research and architecture result

A proposed candidate is Cloudflare Workers Static Assets + Hono API + Cloudflare Access, retaining the existing vanilla HTML/CSS/JS dashboard.

Reasons:
- One HTTPS origin can serve static assets and a same-origin `/api/*` API.
- Hono is a small Web-standards framework with Workers support; it does not require a full frontend rewrite.
- The managed Worker is not an owner-operated server and does not depend on an always-running GitHub Actions runner.
- GitHub remains the task/evidence source of truth; no separate database is required for the initial read-only slice.

Important constraints:
- Cloudflare Free limits currently document 100,000 Worker requests/day, 10 ms CPU per invocation and 128 MB memory. Quota exhaustion must degrade closed; no paid fallback.
- Cloudflare Access documentation states that `ctx.access` is not passed through the internal Static Assets router. The API must independently verify the signed `Cf-Access-Jwt-Assertion` header (signature/JWKS, issuer, audience, expiry and not-before) and fail closed.
- GitHub's unauthenticated REST limit for public data is 60 requests/hour. The initial adapter must aggregate requests, use bounded caching/ETags, honor rate-limit headers and back off on 403/429. No aggressive polling.
- No account entitlement, Access setup, custom domain, credentials, secret, deployment or preview was accessed/created.
- GitHub Pages alone is static and is not a trusted API/control plane. Open WebUI is a mature model/chat interface but does not replace Jarvis task/evidence UX or Pool Bridge authority. GitHub Actions runners are ephemeral and rejected as web hosts.
- This is a preferred candidate, not an adopted/qualified deployment decision. Owner approval and account-plan verification are still required before setup.

## Artifacts created

1. `docs/architecture/JARVIS-WEB-EXPERIENCE-HOSTING-ADR-2026-11-06.md`
   - Cloudflare Workers + Hono candidate, alternatives, data flow, authentication nuance, role matrix, threat model, Free-tier constraints and rollback plan.
2. `contracts/jarvis-experience-api-v1.yaml`
   - OpenAPI 3.1 read-only API contract for health, pool summary, task list/detail, workflow run list/detail and job metadata.
   - No POST/PUT/PATCH/DELETE paths; no dispatch, approval or task mutation endpoint.
   - Every data response carries provenance and explicit availability states. Logs/artifacts are link-only or unavailable in v1.

## Safety boundaries preserved

- Browser has no GitHub token, PAT, GitHub App private key, provider key or privileged workflow token.
- Initial data adapter is limited to public GitHub repository data.
- GitHub issues and workflow runs remain source of truth; no parallel task ledger.
- No database, model calls, provider credentials, media uploads, Worker dispatch, paid services, external servers or production mutation.
- Pool Bridge remains the sole future mutation/dispatch mediator.
- All remote GitHub content is untrusted text; no arbitrary upstream URLs or artifact proxy.
- The web Experience plane cannot issue capabilities or change policy.

## Verification

- Source files and SHAs above were read from the current default branch or identified PR branch.
- ADR and OpenAPI contract were committed to a new branch based on immutable target SHA `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Documentation read-back and blob SHA verification: VERIFIED; ADR blob `8e0171694a567e9d01ea2ec7c9da1625b747b7c4`, OpenAPI blob `3ac992af794f4a3037487e20fd4056d6470aab6b`, report blob before this terminal update `b0147d3d888c3d7514d2ae284e067f77c7955f34`, checkpoint created at commit `f17ee8ac1a0acbecfd3aab8adeb531962c35a7a7`.
- OpenAPI parser/schema validation: NOT RUN.
- Exact-head GitHub CI: NOT RUN / NOT VERIFIED (documentation-only files; existing validation workflow does not trigger on these paths).
- Independent security review: NOT RUN.
- Cloudflare account, plan, Access behavior, domain, deployment and runtime: NOT VERIFIED / NOT RUN.
- No Gemini controller or Claude/Alamo execution was performed. No agent was dispatched.

## Next step

Read back and verify the ADR/OpenAPI blobs, link them from Issue #22, and request independent review. After the design is accepted, build a local/no-secret Worker API fixture and validate JWT negative cases, API schemas, XSS/SSRF defenses and mobile-browser smoke tests. Do not deploy until the provider's actual free-plan/Access entitlements and owner approval are confirmed.


## Terminal update — PR and checkpoint

- Draft PR: https://github.com/VlDMlNSh/developer-cloud-pool/pull/24
- Branch: `docs/jarvis-web-experience-adr-2026-11-06`
- Base: `Основной` @ `64d2636d4500127e635c214ccfb722c6b3fcda80`
- Added continuation checkpoint: `docs/checkpoints/2026-11-06-web-console-continuation.md`, created in commit `f17ee8ac1a0acbecfd3aab8adeb531962c35a7a7`.
- Exact-head CI: NOT RUN / NOT VERIFIED; the current validation workflow does not include docs/contracts paths in its trigger filter.
- Formal independent reviews: NOT RUN.
- PR remains draft and unmerged.


## Cloudflare account inspection — actual result (2026-11-06)

The Cloudflare connector authenticated successfully and exposed one account. Read-only account inspection returned:
- Workers scripts: empty list (no Worker deployed).
- Workers subdomain: HTTP 404, API error 10007 — no `workers.dev` subdomain exists; Cloudflare says opening Workers & Pages dashboard for the first time provisions one.
- Access applications: HTTP 403, API error 9999 — Access is not enabled.
- Zones: empty list — no domain/zone exists in the connected account.
- Account object type: `standard`; Workers Free/Paid plan and Access entitlement remain NOT VERIFIED.

No account settings were changed. No Worker, subdomain, Access app/policy, IdP, zone, DNS record, API token, secret or deployment was created. No billing action was taken.

**Current Cloudflare status:** connector AUTHENTICATED; account inspection READ-ONLY VERIFIED; Worker deployment BLOCKED by missing workers.dev subdomain and disabled Access; free-tier entitlement NOT VERIFIED. A publicly exposed, unauthenticated preview is not an acceptable workaround.

**Required owner prerequisites:** provision the workers.dev subdomain through Workers & Pages dashboard; explicitly decide whether to enable Access; verify Workers Free and Access pricing/entitlement; then request a fresh read-only inspection before any deployment.
