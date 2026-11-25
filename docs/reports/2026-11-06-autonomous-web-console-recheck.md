# Engineering report — 2026-11-06: autonomous web-console architecture correction

## Scope and immutable target

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch: `Основной`
- Default HEAD observed: `64d2636d4500127e635c214ccfb722c6b3fcda80`
- Documentation work branch: `docs/jarvis-web-experience-adr-2026-11-06`
- Starting PR #24 HEAD: `aa23f833eb843fd9daa213aff03dd967524a5335`
- Work was limited to correcting stale/inconsistent architecture and API authentication documentation. No runtime code, secrets, account billing, dispatch, or deployment was changed.

## Findings

1. PR #6 contains only a static graphite dashboard with fixture values and explicit demo/no-API warnings. It has no package manager, API, auth, or live telemetry. It is based on an older default-branch SHA and remains OPEN/DRAFT/UNMERGED.
2. PR #24 contains a 434-line OpenAPI v1 contract, hosting ADR and checkpoint. The contract still declared Cloudflare Access cookie authentication even though Access is disabled and the owner cannot complete Zero Trust payment-details onboarding. This was a material mismatch between architecture, account state and API contract.
3. The Cloudflare account has a provisioned workers.dev namespace `jarvis-developer-cloud-pool`; a read-back verified it. Workers scripts list remains empty. Cloudflare Access is disabled. The connected OAuth integration cannot read subscriptions (HTTP 403 / error 10000; Billing Read unavailable), so Workers Free entitlement remains NOT VERIFIED.
4. Repository tree at default HEAD does not contain `.github/workflows/gemini-batch-dispatch-controller.yml`. Therefore the project's required Gemini controller is absent from this repository baseline; no Gemini dispatch was attempted. Do not substitute a manual run or other workflow.
5. Existing repository governance ruleset requires PR but zero approvals. Independent review remains a project acceptance requirement even though GitHub rules do not enforce it.

## Changes made

- Updated `contracts/jarvis-experience-api-v1.yaml`: replaced Cloudflare Access cookie security scheme with intended application-issued `__Host-jarvis_session` cookie. Description explicitly requires server-side GitHub OAuth callback validation, exact numeric owner-ID allowlist, bounded server-side expiry/revocation, Secure/HttpOnly/host-only/SameSite cookie and no OAuth tokens in browser. This is a target contract, not implementation.
- Updated hosting ADR: clarified GitHub OAuth as the no-card application authentication candidate and marked it NOT IMPLEMENTED.
- Updated continuation checkpoint: corrected stale workers.dev and Access account facts; marked Workers Free entitlement NOT VERIFIED; documented the GitHub OAuth contract and next safe implementation stage.
- No OAuth App, client secret, Worker script, Access app, DNS zone, API token, deployment, paid resource, or runtime endpoint was created.

## Resulting commits and blob SHAs

- OpenAPI contract commit: `cc44a346706096ddc7c507ac0f5e6af3ef21f83b`; blob: `0f2acc603f0710537aa622c131859ecf093c66ca`.
- Checkpoint commit: `be5ff018c079188ed7b6701768014cba118043f0`; blob: `1e36f0d0a3e6dcf8e4a28c80555becba661a0ab6`.
- ADR commit: `6c5fc6869db5a14f96584f2056ab5a9d67cb711f`; blob: `2ef98f3a6863a6f43a0776926f0950f18535ecbf`.

## Verification and status

- File write operations returned commit and blob SHAs. A separate read-back is required and will be recorded after this report commit.
- PR #24 remains documentation-only, OPEN/DRAFT/UNMERGED. Exact-head CI and independent review are NOT VERIFIED until queried against the final commit.
- Hono/Worker implementation: NOT STARTED.
- OAuth App registration and credentials: NOT CONFIGURED.
- OpenAPI parser/contract tests: NOT RUN.
- Browser/mobile viewport QA: NOT RUN.
- Cloudflare Workers Free entitlement: NOT VERIFIED.
- Worker deployment: NOT RUN.
- Gemini controller: NOT RUN / BLOCKED because the named controller workflow is absent from default-branch tree.
- Production pool dispatch: BLOCKED / FAIL-CLOSED.

## Next bounded step

Before runtime code, independently review the corrected OAuth/session threat model and select a mature maintained Hono + Cloudflare Workers template with pinned dependencies. Then implement a no-secret local fixture and negative tests for OAuth state mismatch, callback replay, non-allowlisted GitHub ID, expired/revoked session, cookie attributes, GET-only routing, fixed upstream allowlist, XSS and SSRF. Do not deploy until Workers Free entitlement is verified, OAuth App credentials are owner-provisioned, exact-head CI passes, and independent security review is recorded.
