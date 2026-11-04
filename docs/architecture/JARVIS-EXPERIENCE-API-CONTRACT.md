# Jarvis Experience API contract

Status: DESIGN ONLY / NOT IMPLEMENTED / NOT DEPLOYED.

The mobile PWA is an untrusted client. All authorization and policy checks are server-side. The frontend must never hold GitHub tokens, provider keys, runner credentials or dispatch authority. It must never call GitHub Actions dispatch APIs or connect directly to a runner.

Initial API scope is read-only: authenticated session metadata, sanitized pool status, task list/detail and authorized artifact retrieval. Authentication uses OIDC authorization-code with PKCE and server-side sessions. Cookies are Secure, HttpOnly and SameSite; state-changing requests require CSRF and Origin validation. Every endpoint enforces server-side capabilities.

Task submission, approvals, cancellation, browser control and model calls are deferred until Pool Bridge task envelopes, capability policy, idempotency, audit and independent security review are accepted.

Unknown or stale upstream state must display as unknown/stale, never healthy or enabled. Authenticated responses and artifacts are not cached by the service worker. No public deployment before HTTPS, identity, session/CSRF, authorization, rate-limit and security tests pass.

Related: [Mobile web architecture](JARVIS-MOBILE-WEB-EXPERIENCE.md).