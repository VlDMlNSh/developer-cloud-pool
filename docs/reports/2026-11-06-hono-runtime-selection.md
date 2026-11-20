# Engineering report — 2026-11-06: Hono runtime and static UI integration decision

## Target and scope

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch: `Основной`
- Default HEAD observed: `64d2636d4500127e635c214ccfb722c6b3fcda80`
- Documentation branch: `docs/jarvis-web-experience-adr-2026-11-06`
- PR #24 starting HEAD: `3c990866b72cf67dbdc38d781b6f801692ff14ca`
- Scope: inspect existing UI and contract, compare maintained official framework starters, record a bounded implementation choice. No runtime files, dependencies, credentials, workflows, account resources or deployment were changed.

## Current repository evidence

- Default-branch tree contains no web app, package.json, lockfile, Hono, Wrangler or OAuth implementation.
- PR #6 contributes a plain HTML/CSS/JavaScript static dashboard. Its JS only manages mobile navigation through IntersectionObserver. It explicitly contains demo values, no API, no network calls, no persistent browser storage and no dispatch.
- PR #6 includes a useful zero-dependency Node validation script and a PR validation workflow pinned to actions/checkout SHA `11bd71901bbe5b1630ceea73d27597364c9af683`. These files exist only on PR #6's branch and have not been integrated.
- PR #24 is still documentation-only; its API contract defines GET-only read routes and an application-issued `__Host-jarvis_session` security scheme. OAuth/session issuance is not implemented.
- The default branch currently has no `.github/workflows/gemini-batch-dispatch-controller.yml`; required Gemini dispatch remains unavailable and NOT RUN.

## Mature component research

1. Hono's official Cloudflare Workers guide documents the maintained `create-hono` Cloudflare Workers starter, local development with Wrangler, Workers Static Assets, and recommends Cloudflare's Workers Vitest integration for runtime tests: https://hono.dev/docs/getting-started/cloudflare-workers
2. Cloudflare's official Hono framework guide recommends its `cloudflare/templates/vite-react-template` for a full-stack React SPA + Hono Worker, and explains that Workers Static Assets can combine a SPA and Hono API on one origin: https://developers.cloudflare.com/workers/framework-guides/web-apps/more-web-frameworks/hono/
3. Hono's current release page shows v4.13.16 as the latest release observed in this research window: https://github.com/honojs/hono/releases
4. Cloudflare Workers SDK release page shows Wrangler 4.157.0 and @cloudflare/vitest-plugin 1.5.1 in the latest observed release: https://github.com/cloudflare/workers-sdk/releases

## Decision

Use the official Hono Cloudflare Workers starter as the server baseline, with Workers Static Assets serving the existing vanilla HTML/CSS/JS dashboard. Do not migrate the current dashboard to React solely to adopt the official React template; that template is a valid option for a later substantial SPA rewrite, but it adds a framework migration without current product benefit.

Use the official Workers runtime test integration supported by the selected starter. Generate the initial project using the official template tooling, then commit the generated lockfile and exact dependency versions. Do not hand-author a partial dependency tree or use floating `latest` dependencies. Before adoption, verify the generated starter's current package versions and compatibility in a PR CI run.

Keep the first runtime slice deliberately fail-closed:
- `GET /api/v1/health` may report service health but must not imply pool health.
- All protected read endpoints return 401/403 until application session validation is implemented and qualified.
- No mock data may be presented as live telemetry.
- No mutation, approval, dispatch, secrets, task submission or provider routing endpoints.
- GitHub OAuth callback, state/CSRF, exact numeric owner-ID allowlist, opaque session storage, expiry/revocation, secure cookie attributes and abuse/rate controls are separate gates before any live data endpoint.
- No public deployment until Workers Free entitlement, authentication, tests, independent security review and exact-head CI are verified.

## Verification status

- Research and source review: COMPLETED.
- Framework selection: DECIDED (design only).
- Runtime scaffold: NOT STARTED.
- Dependency lockfile: NOT CREATED.
- OAuth/session implementation: NOT STARTED.
- Tests: NOT RUN.
- Cloudflare Workers Free entitlement: NOT VERIFIED.
- Deployment: NOT RUN.
- PR #24 exact-head CI and independent review: NOT VERIFIED.

## Next bounded step

Create a separate implementation branch from the current default HEAD, bring the existing PR #6 static UI and its validation script into that branch without rewriting the design, then add the official Hono Workers scaffold with pinned dependencies/lockfile and runtime tests. Keep OAuth/session routes absent or fail-closed until the auth implementation and independent review are ready. Do not merge PR #6 or PR #24 as a substitute for that integrated review.
