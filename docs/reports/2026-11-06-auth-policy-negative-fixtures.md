# Engineering report — 2026-11-06: secret-free auth policy negative fixtures

## Scope

Add an isolated test-only reference policy and deterministic negative fixtures to PR #25. No production Worker import, OAuth exchange, secret access, network call, live GitHub request, deployment, mutation or dispatch.

## Immutable target and branch

- Starting target: PR #25 exact head `fdda4c143cbb4b65c123b5458e0f8bef5fa5f9a4`.
- Branch: `feat/jarvis-hono-web-prototype-2026-11-06`.
- Latest implementation commit: `f8e9e5c2eb4f7ac354e92b6ea6d8728bfd28b861`.
- PR #25 remains OPEN / DRAFT / UNMERGED; independent reviews and inline threads were 0 / 0 at the last read.

## Changes

- Added `tests/fixtures/auth-policy.js`, a test-only policy module not imported by `src/index.js`.
  - Single-use OAuth state consumption with mismatch and expiry rejection.
  - Exact string comparison for canonical GitHub numeric owner IDs; rejects numeric JS values and noncanonical forms.
  - Server-side session validity conditions: explicit revocation field, issued-at and expiry checks.
  - Host-only `__Host-` session cookie serialization with Secure, HttpOnly, SameSite=Lax, Path=/, positive Max-Age and no Domain.
  - Exact HTTPS Origin equality for CSRF policy.
  - Fixed HTTPS upstream-origin allowlist; rejects arbitrary origins, userinfo, HTTP and nonstandard ports.
- Added `tests/auth-policy.test.js` with seven deterministic test groups and no external dependencies.
- Tightened the fixture to reject missing revocation state and invalid clock values.
- No runtime authentication behavior changed; protected API remains fail-closed with 503 until auth is separately implemented and reviewed.

## Read-back evidence

- Fixture blob SHA: `7b69e79d6c39aac2db861ef3fde12b386ab78a42`.
- Test blob SHA: `9fab2f5aed43057890fd767c6e37ccbaa10d705c`.
- Both files were fetched again from the PR branch after writes; contents matched the intended changes.
- Existing workflow `.github/workflows/jarvis-web-validation.yml` includes `tests/**` in both pull_request and push path filters and runs `npm ci`, `npm run check`, `npm test`, and the static UI validator.
- Exact-head CI for `f8e9e5c2...`: NOT VERIFIED. The available commit-run query returned no runs and combined commit status returned no statuses. Do not infer a pass or a failure from an empty result.
- Local test execution: NOT RUN in this pass.

## Security and authority boundaries

- The fixture is intentionally test-only; it is not an OAuth/session implementation and must not be wired into routes as production auth.
- No credentials, provider keys, owner secrets, tokens, or secret values were read or changed.
- No Gemini controller, Claude host, Cloudflare deploy, paid service, external provider or live OAuth endpoint was invoked.
- No agent dispatch was attempted.

## Next bounded step

Read exact-head GitHub Actions terminal results for this branch and obtain independent review of the negative fixtures. If checks remain unavailable, record NOT VERIFIED and investigate workflow event visibility without weakening branch protections. Only then design the production session adapter and OAuth callback against the existing API contract; keep routes disabled until security review and exact-head tests pass.
