# Cloud Pool continuation checkpoint — 2026-11-06

Canonical source: `Основной` at `64d2636d4500127e635c214ccfb722c6b3fcda80`.

Latest live report: [2026-11-06 web-console priority and repository recheck](../reports/2026-11-06-web-console-priority-and-repository-recheck.md).

## Owner priority and delivery sequence

1. **First — secure remote web console** for desktop and iPhone browsers, connected to the running pool through an authenticated read-only Experience API.
2. **Second — native iOS Developer Mobile AI** with optional local inference; remains tracked in [Issue #21](https://github.com/VlDMlNSh/developer-cloud-pool/issues/21).
3. **Third — external owner-operated server integration**, only after the web experience and relevant trust boundaries are qualified.

The web console is the primary Experience plane. It must not require the native app or assume that a GitHub Actions runner is a persistent web host.

## Current verified baseline

- Default branch `Основной`: `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Active Ruleset 26550182 selects only `refs/heads/Основной`, blocks deletion/non-fast-forward and requires PRs; approving review count is **0**, CODEOWNERS review is disabled, bypass list is empty. Independent review is therefore not enforced by the ruleset.
- Classic branch protection is NOT VERIFIED by the connected integration.
- `POOL_DISPATCH_ENABLED` was not read in this pass. Keep dispatch fail-closed; do not infer the live variable value.
- PR #6 is OPEN / DRAFT / NOT MERGED. Head `5b8469b3bb691ff48f8be9bda9aea0969d42f537`; base `692025e4a039aaf94c6683bb95da38b4f324fce8`. It is 9 commits ahead and 1 behind current `Основной`, with merge base at its original base. Mergeable=true is not proof of current-base integration or acceptance.
- PR #6 exact-head Jarvis Static UI Validation and Pool Contract Validation both completed SUCCESS at runs 42108498565 and 42108497862. No formal PR reviews; browser/device visual QA NOT VERIFIED.
- PR #6 contains a static graphite dashboard only. Its data are fixtures; there is no authentication, Experience API, live telemetry, task submission or deployment.
- README describes Supervisor/Worker as scaffold / NOT RUN and cloud runtime deployment as NOT RUN.
- Current default-branch Supervisor heartbeat check run 42109516110 completed SUCCESS; this is not a worker dispatch or pool-runtime qualification.
- Main commit status API returned pending with zero status contexts; no exact-head contract validation was found for the current default SHA.
- Open PRs include multiple draft security and worker-boundary changes; none are accepted by this pass.

## New work item

[Issue #22 — Build the primary secure web console for remote Developer Cloud Pool access](https://github.com/VlDMlNSh/developer-cloud-pool/issues/22).

Issue #22 scopes:
- Versioned read-only Experience API and role matrix.
- Server-side authentication/session management; no privileged tokens or provider secrets in browser.
- Hosting decision that accounts for persistent availability; GitHub Actions runners are ephemeral and GitHub Pages alone is static hosting.
- Threat model for sessions, CSRF, XSS, origin policy, rate limits, audit and artifact access.
- Reuse PR #6 graphite UI rather than rewrite it; replace fixtures with provenance-bearing live API responses.
- Read-only pool/task/workflow/evidence views first; task mutations and dispatch are separate later acceptance.
- No native iOS implementation, external owner-operated server connection, model calls, secrets, paid fallback or dispatch in this work item.

## Mandatory independent execution gates

- The integrated reusable Worker authorization boundary remains a prerequisite for production dispatch/runtime qualification; see PRs #12, #18 and the continuation evidence in PR #19.
- Production dispatch remains BLOCKED until caller authorization, race-safe single-use approval, exact-head CI, independent security review and governance requirements are accepted.
- Do not enable `POOL_DISPATCH_ENABLED`, dispatch Worker, run DSH/Resource Probe/browser jobs, access model/provider credentials or use paid fallback in this pass.
- Gemini may only be used through its approved controller after the controller contract and gates are verified. No agent dispatch occurred in this pass.
- External servers and native iOS are later phases, not dependencies for the first web-console design.

## Next bounded engineering unit

Execute Issue #22 Phase A:
1. Compare mature, maintained web/API/auth components before custom implementation.
2. Produce an ADR comparing GitHub Pages/static-only, managed serverless API, and minimal persistent-service options; state the free-tier limits and operational tradeoffs from current authoritative sources.
3. Define versioned read-only Experience API schema, viewer/operator/approver role matrix, data-flow and threat model.
4. Preserve the static prototype as read-only until backend authentication and provenance are qualified.
5. Record exact source and artifact SHAs, CI status and unresolved owner/provider dependencies.

## Status

- Web console: DESIGN TASK OPEN / NOT IMPLEMENTED AS LIVE SERVICE / NOT DEPLOYED.
- PR #6 static UI: IMPLEMENTED / EXACT-HEAD STATIC CI SUCCESS / REVIEW NOT RUN / VISUAL QA NOT VERIFIED.
- Pool runtime: NOT RUN / NOT QUALIFIED.
- Production dispatch: BLOCKED.
- Native iOS: DESIGN ONLY / DEFERRED TO PHASE 2.
- External owner-operated servers: NOT CONNECTED / DEFERRED TO PHASE 3.
