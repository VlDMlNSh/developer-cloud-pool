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


## Cross-project governance read-back

- Canonical MediaHub map content was recovered by fetching blob SHA `75f62685459ec99ebf8be478f4e9096cdb842b1d` (1,204,915 characters). This supersedes the earlier empty Contents API response; the blob is readable and includes the current map inventory through Wave 477. Canonical map link: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md.
- Current default-branch Gemini controller exists at `.github/workflows/gemini-batch-dispatch-controller.yml`, blob `0a1246f6755020faf8b7e48d07bfff790bbaece3`. The earlier 404 was specific to the documentation ref, not the current main branch.
- Controller contract requires workflow_dispatch mode/explicit confirm or a qualifying OWNER `/next` comment on Issue #301, `MEDIAHUB_GEMINI_BATCH_ENABLED=true`, and secrets `MEDIAHUB_GITHUB_TOKEN` + `MEDIAHUB_DISPATCH_HMAC_KEY`. Secret values were not accessed; presence/scope is NOT VERIFIED. This ChatGPT `/next` message is not a GitHub issue_comment event and does not authorize controller dispatch.
- Controller has a first-page `per_page=100` issue-comment history query for duplicate suppression; no pagination/completeness check was found in the inspected code. Treat full-history duplicate suppression as NOT VERIFIED / potential replay-control gap. Issue #301 still lists A0 issuer/ingress/lease/cancel/recovery and R-06 authority gates, runner manifest acceptance, schema meta-validation and independent review as ordered prerequisites.
- Child workflows exist on main: Agent 1 blob `155a02159912ca371e6f826c51325ca269857aad`, Agent 2 `fff1820a6b97d379b23674f36bd62227b7d4dec2`, Agent 3 `781df56e8aa7c75ba453c08378611857862b2e44`. No dispatch was performed.
- PR #437 is merged/closed. PR #441 remains OPEN / non-draft / unmerged at `9f40b90c3106662cfcc337c48f29e4794fa713dc`; its exact-head PR workflow query returned no runs and reviews/threads are 0/0. Do not infer acceptance.
- SentinelX Free plan exposes one operational host `host_5f7264034bdf0b51` (hostname `Voktors-Mini.Dlink`), already occupying the only active slot. It is not identified as Alamo/Server 3; Claude Code and browser work were NOT RUN.
