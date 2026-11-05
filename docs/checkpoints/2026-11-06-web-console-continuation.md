# Developer Cloud Pool continuation checkpoint — 2026-11-06

## Priority order

1. Secure remote web console for the running pool, accessible from desktop and iPhone browser.
2. Native iOS Developer Mobile AI and Media Assistant, including media classification and image/video/instruction assistance.
3. External owner-operated server integration.

The web console is the first product-access milestone. Native iOS and external worker/server integration must not displace it.

## Immutable baseline and governance

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch: `Основной`
- Default HEAD: `64d2636d4500127e635c214ccfb722c6b3fcda80`
- Active ruleset: `26550182` / `Основной — verified`.
- Governance issue [#1](https://github.com/VlDMlNSh/developer-cloud-pool/issues/1) remains OPEN. Required approvals are configured as zero; independent review is still required by project acceptance.
- `POOL_DISPATCH_ENABLED=false` is the required fail-closed state. Do not dispatch Worker, DSH, Resource Probe, models or paid fallback.
- Default branch is not changed by this checkpoint branch.

## Web console work

- Controlling issue: [#22 — primary secure web console](https://github.com/VlDMlNSh/developer-cloud-pool/issues/22).
- Existing UI prototype: [PR #6](https://github.com/VlDMlNSh/developer-cloud-pool/pull/6), OPEN/DRAFT/UNMERGED. It is static fixture UI, no API/auth/live telemetry.
- Architecture candidate and API contract: [PR #24](https://github.com/VlDMlNSh/developer-cloud-pool/pull/24), documentation-only, OPEN/DRAFT/UNMERGED.
- ADR: [JARVIS-WEB-EXPERIENCE-HOSTING-ADR-2026-11-06.md](../architecture/JARVIS-WEB-EXPERIENCE-HOSTING-ADR-2026-11-06.md).
- OpenAPI contract: [jarvis-experience-api-v1.yaml](../../contracts/jarvis-experience-api-v1.yaml).
- Dated evidence report: [2026-11-06 Jarvis Web Experience architecture](../reports/2026-11-06-jarvis-web-experience-architecture.md).

## Proposed architecture — not accepted

Cloudflare Workers Static Assets + Hono API + Cloudflare Access is the preferred hosting candidate, subject to:
- explicit owner approval of the provider;
- confirmation of the actual account's free-plan and Access entitlements;
- a no-secret preview test proving Access protects both assets and API;
- independent security review and exact-head CI.

The ADR identifies a critical integration nuance: `ctx.access` is not passed through the internal Static Assets router. The API must validate the signed `Cf-Access-Jwt-Assertion` header itself (signature/JWKS, issuer, audience, exp, nbf), or stop and use a reviewed alternative.

The initial API is GET-only, reads public GitHub repository data, and does not introduce a parallel task database. GitHub remains source of truth. Logs/artifacts are link-only or unavailable in v1. No task mutations, approvals or dispatch are exposed.

GitHub Pages alone is static and is not the trusted API. GitHub Actions runners are ephemeral and cannot be used as a persistent web host. Open WebUI is not the Pool Bridge or task authority.

## Mobile assistant

- [Issue #21](https://github.com/VlDMlNSh/developer-cloud-pool/issues/21) includes the Mobile Media Assistant scope.
- [PR #23](https://github.com/VlDMlNSh/developer-cloud-pool/pull/23) remains OPEN/DRAFT/UNMERGED. Exact-head CI has zero observed check-runs and formal review count is zero.
- Local model, native iOS app, image/video generation adapters remain NOT IMPLEMENTED / NOT QUALIFIED.
- Mobile phase starts after web-console milestone acceptance.

## Current status

- Web architecture: PROPOSED / DOCUMENTED.
- API contract: DRAFTED / PARSER VALIDATION NOT RUN.
- Worker/Hono implementation: NOT STARTED.
- Cloudflare account/Access plan: NOT VERIFIED.
- Preview deployment: NOT RUN.
- Independent security review: NOT RUN.
- Browser/mobile viewport QA: NOT RUN.
- Pool Supervisor/Worker runtime: NOT RUN / NOT QUALIFIED.
- Production dispatch: BLOCKED / FAIL-CLOSED.
- Gemini controller batch: NOT RUN.
- Claude/Alamo local task: NOT RUN.

## Next bounded step

After independent review of PR #24 and explicit hosting-provider approval, implement a local/no-secret Hono Worker fixture reusing the existing graphite UI. Add OpenAPI validation, Access JWT negative tests, fixed GitHub API allowlist tests, XSS/SSRF fixtures and browser smoke tests. Do not deploy or create credentials until free-plan/Access entitlement and owner approval are confirmed.

## Source priority

- [README](../../README.md)
- [Jarvis Hybrid Platform Reference Architecture](../architecture/JARVIS-HYBRID-PLATFORM-REFERENCE-ARCHITECTURE.md)
- [GitHub Pool Supervisor and Recovery Architecture](../architecture/GITHUB-POOL-SUPERVISOR-AND-RECOVERY.md)
- [Issue #22](https://github.com/VlDMlNSh/developer-cloud-pool/issues/22)
- [MediaHub OS canonical map](https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md)
- [MediaHub OS continuation checkpoint](https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/checkpoints/mediahub-next-continuation-checkpoint-2026-10-12-current.md)


## Cloudflare account readiness update — 2026-11-06

Read-only account inspection via connected Cloudflare integration:
- Account connection: AUTHENTICATED.
- Workers scripts: none.
- workers.dev subdomain: NOT PROVISIONED (API error 10007).
- Cloudflare Access: NOT ENABLED (API error 9999).
- Zones/domains: none in account.
- Workers Free/Paid plan and Access billing entitlement: NOT VERIFIED (`standard` account type is not a plan indicator).
- No resource or account configuration was created/changed; no deployment attempted.

Deployment status: BLOCKED / NOT RUN. Do not publish an unauthenticated console to work around the missing Access setup. Owner prerequisites are listed in the ADR. After owner actions, repeat read-only checks, then proceed to a no-secret preview and security tests.
