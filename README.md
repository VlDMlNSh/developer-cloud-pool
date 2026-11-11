# Jarvis Web Console — isolated prototype

This branch is a bounded, non-deployable prototype based on the official Hono Cloudflare Workers starter.

## Current behavior

- Cloudflare Workers serves the existing static graphite dashboard from `web/jarvis-dashboard/`.
- Hono owns `/api/*`.
- `GET /api/v1/health` reports only this Worker service's health. It explicitly reports pool status as unknown.
- All protected API reads return HTTP 503 until GitHub OAuth and server-side session validation exist.
- All API mutation methods return HTTP 405.
- No GitHub token, OAuth secret, session secret, provider key, dispatch endpoint, task submission or live telemetry is present.
- No deployment workflow or deploy script is configured.

## Local validation

```sh
npm ci
npm run check
npm test
npm run validate:ui
npm run dev
```

The first dependency versions are pinned exactly in `package.json`. The committed npm v3 lockfile contains 93 package entries. CI installs from it with `npm ci --ignore-scripts --no-audit --no-fund`; dependency reproducibility has passed the exact-head validation recorded in the dated engineering report.

## Deployment gate

Do not deploy this prototype until all of the following are complete:

1. Workers Free entitlement is confirmed without payment details or paid fallback.
2. GitHub OAuth callback, state/CSRF validation and exact numeric owner-ID allowlist are implemented.
3. Opaque host-only session issuance, expiry and revocation are implemented.
4. Protected routes have negative tests and independent security review.
5. The committed lockfile and exact-head CI are verified.
6. Static assets and API share the intended authentication boundary.

This prototype does not represent pool readiness and does not enable dispatch.

## Verification snapshot — 2026-11-06

- Implementation head with executable changes: `3252e9a5e361cc75ecde3991f30193e39c3768dc`.
- Exact-head CI: Pool Contract Validation and Jarvis Web Prototype Validation both SUCCEEDED (2/2); run IDs and job evidence are recorded in [the dated report](docs/reports/2026-11-06-static-header-grammar-guard.md).
- PR #25 remains OPEN / DRAFT / UNMERGED. Independent review: NOT RUN.
- OAuth/session and live GitHub adapter: NOT IMPLEMENTED. Browser/device QA and deployment: NOT RUN.
- The report-only branch head may be newer than the CI-tested implementation head; do not interpret a documentation-only successor as a fresh runtime qualification.
