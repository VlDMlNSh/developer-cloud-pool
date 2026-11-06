# Engineering report — 2026-11-06: hosting ADR/prototype contract reconciliation

## Scope

Reconcile the hosting ADR with the current Hono prototype, OpenAPI contract, dependency lockfile, and current Cloudflare account facts. No OAuth secrets, session implementation, deployment, paid resources, dispatch or provider calls.

## Verified current state

- PR #24 head before this pass: `bb674bc63ac0b286b0a167c990ee6ad702098438`; 46 ahead / 0 behind base `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- PR #25 current head: `fdda4c143cbb4b65c123b5458e0f8bef5fa5f9a4`; 20 ahead / 0 behind base.
- PR #24 and PR #25 remain OPEN / DRAFT / UNMERGED. Reviews / inline threads: 0 / 0 on each.
- PR #24 exact-head checks on `bb674bc...`: Pool Contract Validation run `42179227251` and Jarvis Experience OpenAPI Validation run `42179227232`, both SUCCEEDED.
- PR #25 exact-head checks on `fdda4c...`: Pool Contract Validation run `42178033386` and Jarvis Web Prototype Validation run `42178033062`, both SUCCEEDED. The Hono job steps read back as successful: checkout without persisted credentials, runtime check, `npm ci --ignore-scripts --no-audit --no-fund`, static checks, API negative/fail-closed tests, and static dashboard contract.
- PR #25 dependency lockfile is npm v3, 93 package entries, blob `9d0d18ca770ee329d3260ae0503cf0a58ee19ce9`; package manifest pins Hono `4.13.16` and Wrangler `4.158.0`. README accurately uses `npm ci`.

## ADR corrections

Updated `docs/architecture/JARVIS-WEB-EXPERIENCE-HOSTING-ADR-2026-11-06.md`:

1. Removed stale claim that no lockfile exists; documented committed lockfile, 93 entries, and the exact `npm ci` CI install command. Clarified this is runner reproducibility evidence, not independent security qualification.
2. Reconciled runtime behavior: current protected reads return `503 AUTHENTICATION_NOT_CONFIGURED` while auth is absent; future qualified-session behavior uses 401/403 semantics in the target API contract.
3. Replaced JWT-specific design language with opaque server-side session lookup and OAuth state validation, consistent with the chosen session model.
4. Updated deployment gate wording from JWT tests to OAuth-state/session negative tests.
5. Marked the original missing-workers.dev prerequisite as historical and superseded by the later API PUT/GET provisioning evidence. Access remains disabled/not required; Workers Free entitlement remains NOT VERIFIED.

ADR blob after read-back: `b5fbb978f6e61e91e2ebcff41dc9bb4f7de6d3ee`.

## Current Cloudflare and deployment status

- workers.dev namespace `jarvis-developer-cloud-pool`: PROVISIONED / VERIFIED by prior API PUT + GET read-back.
- Workers scripts: NONE.
- Access: DISABLED / NOT REQUIRED.
- Custom zone/domain: NONE observed.
- Workers Free entitlement: NOT VERIFIED (Billing Read unavailable).
- Worker deployment: NOT RUN.
- No card workaround, paid fallback, credentials, secrets or deployment attempted.

## Current MediaHub governance / executors

- Issue #301 remains OPEN. Its stated next steps include A0 issuer/ingress/lease/cancel/recovery and R-06 authority gates, runner manifest acceptance, Draft 2020-12 schema meta-validation and negative fixtures, then independently reviewed worker slice.
- Canonical MediaHub map fetch returned an empty body despite blob SHA `75f62685459ec99ebf8be478f4e9096cdb842b1d`; map content therefore NOT VERIFIED. Bootstrap, checkpoint and roadmap were read. The bootstrap explicitly says to stop at safe reading if the map is unavailable/stale.
- The controller path `.github/workflows/gemini-batch-dispatch-controller.yml` was not found at the requested documentation ref (404). No Gemini dispatch.
- PR #437 is CLOSED; PR #441 is OPEN but its own body says independent CI/review is still required.
- SentinelX reports only one connected operational host `host_5f7264034bdf0b51`, hostname `Voktors-Mini.Dlink`, plan Free, one active slot occupied. It is not identified as Alamo/Server 3. No Claude/browser execution; do not use it for that route.
- No Gemini/Claude tasks, secrets, model calls, dispatch or local commands were run.

## CI status for this ADR update

- ADR update commit: `753f692475e19c0b041a7155af0aa6ae8b1d49c2`; final report/checkpoint snapshot: `c84b5aed0a306ea92c8d9919564a0803acc56aef`, 49 ahead / 0 behind base.
- Exact latest-head checks on `c84b5aed...`: Pool Contract Validation run `42187467083` SUCCEEDED; Jarvis Experience OpenAPI Validation run `42187467194` SUCCEEDED. Both jobs and all steps were read back as completed/success.
- No executable runtime or API contract file changed in this ADR-only update; exact-head checks nevertheless completed successfully.

## Next bounded step

After CI completes, add isolated, secret-free authentication policy tests on the Hono branch (OAuth state single-use/expiry, exact numeric owner ID normalization, opaque session expiry/revocation, cookie flags, Origin/CSRF and fixed upstream allowlist). Do not wire real OAuth credentials or enable protected routes until independent security review and exact-head tests pass.
