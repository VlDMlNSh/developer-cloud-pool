# Engineering report — 2026-11-06: fail-closed Hono prototype

## Target

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Base branch: `Основной`
- Immutable base SHA: `64d2636d4500127e635c214ccfb722c6b3fcda80`
- Implementation branch: `feat/jarvis-hono-web-prototype-2026-11-06`
- Scope: first bounded Hono Worker scaffold, reusing the existing static UI and its validator. No secrets, OAuth registration, billing, deployment, dispatch or primary-branch changes.

## Reused components and provenance

- Hono's official `cloudflare-workers` starter template: https://github.com/honojs/starter/tree/main/templates/cloudflare-workers
- Official setup guide: https://hono.dev/docs/getting-started/cloudflare-workers
- Official Static Assets integration: https://developers.cloudflare.com/workers/static-assets/
- Existing graphite dashboard, app.js, CSS, HTML and static validator were reused byte-for-byte from PR #6 commit `5b8469b3bb691ff48f8be9bda9aea0969d42f537`.
- Hono `4.13.16` and Wrangler `4.158.0` are exact direct dependency pins. A package-lock v3 was generated on the GitHub Actions ubuntu-24.04 runner using npm `10.9.9`; it contains 93 package entries and is committed as `package-lock.json` (blob SHA `9d0d18ca770ee329d3260ae0503cf0a58ee19ce9`).

## Implemented

- `src/index.js`: Hono Worker with service-only health endpoint, explicit unknown pool state, protected API fail-closed response, mutation method rejection and conservative API response headers.
- `wrangler.jsonc`: Worker entry point and Static Assets mapping to the existing dashboard; only `/api/*` is routed Worker-first.
- `package.json`: exact direct dependency versions and local check/test scripts; no deploy script.
- `tests/api.test.js`: Node test-runner coverage for health semantics, no-store headers, unauthenticated protected read denial, mutation rejection and unknown API paths.
- `.github/workflows/jarvis-web-validation.yml`: PR/push validation with read-only contents permission and pinned checkout action; CI now uses `npm ci` against the committed lockfile.
- `README.md`: local usage and explicit deployment gates.

## Explicit non-goals

No GitHub OAuth routes, OAuth App, credentials, cookies, session store, GitHub API proxy, live telemetry, mutations, approvals, dispatch, provider routing, secrets or deployment. Health status is not pool health. Static dashboard content remains visibly marked as demo fixture data.

## Verification

- Branch creation: SUCCEEDED from immutable base SHA above.
- Local runtime install: NOT RUN (npm registry access timed out in the interactive container).
- GitHub Actions runtime dependency install: PASS; 39 packages installed on ubuntu-24.04.
- Node syntax checks: PASS.
- API negative/fail-closed tests: PASS, 4/4.
- Static UI contract validator: PASS.
- Exact-head PR #25 checks: 3 check runs observed, all SUCCEEDED for head `007c5ce752076933950dfa410bc6c50934790b75`; workflow run `42115866089` completed success. Job `127555208519` completed success. Workflow security/syntax job also completed success (run `42115865996`).
- Lockfile generation succeeded on GitHub Actions; committed lockfile SHA `9d0d18ca770ee329d3260ae0503cf0a58ee19ce9` contains 93 package entries. `npm ci --ignore-scripts --no-audit --no-fund` passed on PR head `460e510ed5fe72edd8e9e857a7ffd55cd1471264`; the same exact-head workflow also passed syntax checks, 4/4 API tests and static UI validation. Workflow run `42174665077`, job `127750287981`; security/syntax workflow run `42174665050`, job `127750261319`. This qualifies the current lockfile installation path on the runner, but not independent security review.
- Independent review: NOT RUN.
- Workers Free entitlement: NOT VERIFIED.
- Worker deployment: NOT RUN.
- Security qualification: NOT RUN.

## Follow-up — secret-free authentication policy fixtures (2026-11-06)

- Added test-only `tests/fixtures/auth-policy.js` and `tests/auth-policy.test.js`; these are not imported by the Worker and do not implement or enable authentication.
- Coverage: single-use OAuth state/mismatch/expiry, exact GitHub numeric owner-ID allowlist, session expiry/revocation, secure host-only cookie attributes, exact HTTPS Origin validation, and fixed HTTPS upstream allowlist.
- Fixture blob: `7b69e79d6c39aac2db861ef3fde12b386ab78a42`; test blob: `9fab2f5aed43057890fd767c6e37ccbaa10d705c`.
- Exact-head CI on `f8e9e5c2eb4f7ac354e92b6ea6d8728bfd28b861`: NOT VERIFIED (no run/status records returned); local tests NOT RUN.
- Detailed evidence: [auth policy negative fixtures report](2026-11-06-auth-policy-negative-fixtures.md).

## Next step

Read exact-head CI terminal results and obtain independent review of the new test fixtures. Only then design production OAuth/session integration. Keep protected routes fail-closed and do not deploy this scaffold.
