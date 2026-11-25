# Cloud Pool engineering pass — 2026-11-05: production caller boundary readiness

## Immutable target and scope
- Repository: `VlDMlNSh/developer-cloud-pool`.
- Canonical branch: `Основной`, HEAD `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Working branch: `feat/reusable-worker-call-boundary-2026-11-05`, observed PR #12 HEAD `2bf299336bec8cbf55d8785eef0e00bb7a6ec411`.
- PR #12: OPEN / DRAFT / NOT MERGED; merge base is canonical HEAD.
- Branch comparison: 30 commits ahead / 0 behind; total commits 30.
- Scope: read-only verification of current Worker/Supervisor boundary, CI, governance, and correction of stale README governance wording. No runtime dispatch or privileged execution.

## Exact-head CI evidence
- Pool Contract Validation run [42023879350](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42023879350), job `127233125033`: COMPLETED / SUCCESS; head SHA `2bf299336bec8cbf55d8785eef0e00bb7a6ec411`.
- Reusable Worker Context Fixture Caller run [42023879543](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42023879543), job `127233126401`: COMPLETED / SUCCESS; same head SHA.
- Contract job steps completed successfully: dispatch-disabled assertion, YAML parse, caller authorization tests, static pool contract validation.
- Fixture completed successfully and records caller/callee identity fields. Fixture evidence does not establish production authorization.
- Validator blob SHA: `a69714d87553d14b00cd0c0c3e3df89586136960`.
- Worker workflow blob SHA: `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`.
- Supervisor workflow blob SHA: `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`.
- Caller validator blob SHA: `88d79d74691431ead14f29426d214833c0086183`.
- Supervisor implementation blob SHA: `52bf03ca889edd92fd10c71ae96a2e35e106d43f`.

## Production boundary findings
- `.github/workflows/pool-worker.yml` still exposes `workflow_dispatch`; it does not expose `workflow_call`.
- `.github/workflows/pool-supervisor.yml` still grants `actions: write` and runs the supervisor script, which POSTs to the Actions workflow dispatch REST endpoint.
- `scripts/pool-worker-caller.mjs` validates caller repository/ref, reusable workflow repository/path, and SHA consistency, but it is not imported or invoked by the production Worker workflow.
- Existing local reusable-workflow fixture is static, read-only and secret-free. It proves selected context fields are populated for the fixture invocation only.
- Existing Worker report job has issue-write authority. The DSH probe job itself has contents-read and no repository secrets; no execution was triggered in this pass.
- The production Supervisor/Worker path therefore remains a REST-dispatch design and does not yet consume the reusable caller validation boundary.

## Governance
- Active Ruleset [26550182](https://github.com/VlDMlNSh/developer-cloud-pool/rules/26550182), enforcement ACTIVE, selector exactly `refs/heads/Основной`.
- Ruleset requires PRs, deletion/non-fast-forward restrictions, and review-thread resolution; required approving review count is 0; CODEOWNERS review disabled; bypass actors empty.
- PR #12 review submissions and review threads both returned empty arrays. Independent security review: NOT RUN.
- Issue #1 remains OPEN. Its recorded `POOL_DISPATCH_ENABLED=false` evidence is historical; a current repository-variable API read-back was not performed. Current variable state: NOT VERIFIED.
- README previously claimed the default branch was unprotected. Corrected wording now distinguishes the active Ruleset from its missing independent-approval requirement.

## Status
- Static exact-head CI: VERIFIED PASS for the two listed runs.
- Production caller authorization: BLOCKED / NOT IMPLEMENTED.
- Independent security review: NOT RUN.
- Current dispatch variable: NOT VERIFIED.
- Worker, DSH, Resource Probe, browser, Gemini, Claude, provider/model calls and privileged dispatch: NOT RUN.
- Runtime qualification: NOT QUALIFIED.
- PR #12: OPEN / DRAFT / NOT MERGED.
- Canonical branch unchanged by this pass; all documentation changes target the working branch only.
- No paid fallback or secrets were used.

## Next bounded step
Design and implement the production transition only after specifying the approval/provenance contract: reusable Worker with `workflow_call` only; Supervisor static local reusable invocation; no REST workflow dispatch; immutable target SHA; single-use owner approval; bounded matrix; least-privilege token permissions; replay and failure/recovery tests. Keep dispatch disabled. Require independent security review and exact-head CI before any runtime test.
