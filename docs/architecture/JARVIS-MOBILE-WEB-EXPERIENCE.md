# Jarvis Mobile Web Experience

**Status:** ARCHITECTURE PROPOSAL / NOT IMPLEMENTED / NOT DEPLOYED / NOT SECURITY-QUALIFIED
**Date:** 2026-11-04
**Repository:** https://github.com/VlDMlNSh/developer-cloud-pool

## Decision

Jarvis will be remotely accessible from a phone through a responsive HTTPS web application. The first delivery target is a mobile-first Progressive Web App (PWA) that works in Safari on iOS and current Android browsers. Users may optionally add it to the home screen. A native iOS/Android application is not required for the first release.

The web application is an experience surface only. It is not the policy engine, credential store, task scheduler, or execution host.

## Logical architecture

Phone browser / installed PWA
  -> HTTPS edge and authentication
  -> Jarvis Experience API
  -> Pool Bridge (authorization, task envelope, policy, capability and quota checks)
  -> GitHub control plane (issues/task ledger and Actions dispatch)
  -> ephemeral GitHub-hosted runner
  -> evidence/artifact store
  -> status events back to the Experience API

The browser must never call GitHub Actions dispatch APIs with a privileged token, connect directly to a runner, expose a runner's CDP endpoint, or hold provider credentials. All task creation and privileged actions go through Pool Bridge and its policy checks.

## Mobile experience

Initial navigation:
- Chat: submit requests, inspect answers, citations and generated artifacts.
- Tasks: queued, running, waiting-for-approval, succeeded, failed and cancelled states.
- Agents: available capability profiles and current job assignments; no direct unrestricted shell.
- Cloud Pool: aggregate runner availability, queue depth, capacity and health.
- Browser: task-scoped browser sessions and sanitized outputs; no persistent remote desktop or public CDP.
- Approvals: explicit review of the exact action, target, scope, budget and expiry before privileged operations.
- Audit: immutable task provenance, authorization decisions, run/job IDs and output digests.
- Settings: account security, sessions, notification preferences and retention controls.

The interface must be usable at narrow phone widths, support keyboard/screen-reader navigation, show clear task state and failure reasons, and avoid requiring desktop-only controls.

## Authentication and session security

- HTTPS only; secure cookies, HttpOnly, SameSite and CSRF protection for cookie-authenticated mutations.
- Use a maintained identity provider with OIDC authorization-code flow and PKCE; require MFA/passkeys where supported.
- Short session lifetime, rotation, revocation and device/session inventory.
- Apply server-side authorization on every API request; UI hiding is not authorization.
- No long-lived GitHub PAT, cloud provider key, model key or browser cookie in frontend code, local storage, service-worker cache or client logs.
- Use narrowly scoped GitHub App installation tokens or OIDC federation server-side, issued only for a specific authorized operation.
- Rate-limit login, task creation, approvals and artifact access. Audit failed and successful privileged actions.
- Do not expose internal service addresses, runner IPs, environment variables, secrets or raw logs containing credentials.

## Task and approval contract

Each submitted task is converted server-side into an immutable envelope containing requester, task ID, repository, exact target SHA, capability, allowed paths/domains/actions, input references, budget, timeout, expiry, expected outputs and acceptance criteria.

Approval is bound to a specific envelope digest. Any change to target, scope, capability, destination or budget invalidates the previous approval. Approval must not be inferred from chat text, UI navigation or a previous task.

Read-only tasks may proceed only under pre-authorized policy. Mutating repository operations, external account actions, publication and access to protected data require separate explicit capabilities and approval rules.

## Live updates and artifacts

- Use authenticated Server-Sent Events initially for task status; evaluate WebSockets only if bidirectional low-latency interaction is required.
- Status events are derived from authoritative Pool Bridge/GitHub state, not optimistic frontend assumptions.
- Artifacts are fetched through an authorization-checking API using short-lived links; verify task ownership and retention.
- Store large files outside Git history. Keep GitHub Actions artifacts short-lived and do not treat them as durable state.
- Browser screenshots, traces and downloads are bounded, scrubbed and task-scoped.

## Delivery sequence

1. Define API schemas, identity boundary, threat model and authorization matrix.
2. Implement responsive read-only status UI against mocked or non-privileged data.
3. Implement authenticated task intake through Pool Bridge with immutable envelopes and audit events.
4. Add approvals and cancellation with server-side authorization and idempotency.
5. Add live status updates and artifact access.
6. Conduct independent security review, mobile accessibility checks, session/CSRF tests, authorization tests and abuse/rate-limit tests.
7. Deploy behind HTTPS only after secrets, identity, backup, monitoring and incident-response gates pass.

## Non-goals and constraints

- No direct browser-to-runner connection or remote desktop in the initial release.
- No permanent browser host; agent-browser and Chromium remain inside ephemeral GitHub-hosted jobs.
- No privileged secrets or model keys in the PWA.
- No public unauthenticated dashboard.
- No enabling pool dispatch, Worker, DSH, Resource Probe, browser jobs or model calls as a side effect of designing the UI.
- No deployment claim until an exact commit, CI, security review and deployment evidence exist.

## Acceptance criteria

- Responsive and accessible on iOS Safari and Android browsers.
- HTTPS and authenticated sessions; server-side authorization for every protected operation.
- No secrets in client bundles, browser storage, service-worker caches or frontend telemetry.
- Task approvals cryptographically or transactionally bound to immutable envelope digests.
- Status and artifact access are authorized and auditable.
- UI never reports execution success without authoritative terminal evidence.
- Security review and exact-head CI pass before production deployment.

## Related architecture

- [Jarvis Hybrid Platform Reference Architecture](JARVIS-HYBRID-PLATFORM-REFERENCE-ARCHITECTURE.md)
- [Pool Supervisor and Recovery Architecture](GITHUB-POOL-SUPERVISOR-AND-RECOVERY.md)
- [Browser runtime issue #5](https://github.com/VlDMlNSh/developer-cloud-pool/issues/5)
