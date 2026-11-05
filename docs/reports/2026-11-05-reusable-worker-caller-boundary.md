# 2026-11-05 — reusable Worker caller-boundary implementation pass

## Scope and immutable target
- Canonical branch: `Основной`, HEAD `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Working branch: `feat/reusable-worker-call-boundary-2026-11-05`.
- Working branch compare: 4 commits ahead, 0 behind; merge base is exactly canonical HEAD.
- Latest implementation commit: `056f2f43d007a29b3893c4a26e6658ba7cb394ca`.
- This branch is NOT canonical and has no acceptance/merge status.

## Live source findings
- Default Worker blob `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4` still exposes `workflow_dispatch` and validates public issue state/labels/body only.
- Default Supervisor workflow blob `d4bd23d06c0dc98211cea165cdad30a1861eb3bd` still starts the script-based Supervisor; Supervisor script blob `52bf03ca889edd92fd10c71ae96a2e35e106d43f` still calls the REST workflow-dispatch endpoint.
- Default contract validator blob `cfffb77905406d54505c711504a72ae1fafd3f06` does not enforce reusable caller identity.
- The Gemini batch controller file is absent from the default branch (file lookup returned 404); Gemini NOT RUN.
- Current governance variable/ruleset remain NOT VERIFIED. Historical Issue #1 evidence is not current proof.

## Official GitHub semantics checked
- The current GitHub Actions Contexts reference documents `github.workflow_ref` and `github.workflow_sha` as caller workflow properties, and `job.workflow_ref`, `job.workflow_sha`, `job.workflow_repository`, and `job.workflow_file_path` as the workflow defining the current job. In a reusable workflow these identify the called workflow. Source: https://docs.github.com/en/actions/reference/workflows-and-actions/contexts
- GitHub's reusable workflow reference confirms the call is a job-level static `uses`, not a step/API dispatch; the called workflow's `github` context remains associated with the caller. Source: https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations
- The four `job.workflow_*` properties were announced for reusable workflows in September 2026. Source: https://github.blog/changelog/2026-09-03-github-actions-early-september-2026-updates/
- The implementation therefore checks caller identity via `github.workflow_ref`/repository and reusable Worker identity via `job.workflow_repository`/file path, and requires caller and reusable workflow SHAs to match for a same-repository local reusable call. This assumption still requires independent security review and a controlled non-privileged fixture workflow before qualification.

## Implementation performed
Added `scripts/pool-worker-caller.mjs` on the working branch only.
- Commit: `056f2f43d007a29b3893c4a26e6658ba7cb394ca`.
- Read-back blob SHA: `88d79d74691431ead14f29426d214833c0086183`.
- Validator fails closed on missing context, wrong caller repository/ref, wrong reusable workflow repository/path, malformed SHAs, or differing caller/reusable workflow SHAs.
- It deliberately does not accept actor identity, labels, comments, or caller-supplied approval fields as authority.
- The helper is not yet wired into the Worker workflow or the contract-validation workflow.

## Verification and status
- GitHub read-back of the helper and blob SHA: VERIFIED.
- Branch ancestry: VERIFIED (4 ahead / 0 behind canonical).
- Tests: NOT RUN. Creation of the test file was blocked by the tool security layer; no test file was committed.
- Exact-head CI for `056f2f43d007a29b3893c4a26e6658ba7cb394ca`: NOT VERIFIED; associated PR workflow runs empty and combined status has no statuses.
- Independent security review: NOT RUN.
- No PR created or merged; no canonical files changed.
- No secrets/variables read or changed; Worker, DSH, Resource Probe, browser, model/provider calls and privileged dispatch NOT RUN.
- Gemini NOT RUN (controller absent); Claude Code NOT RUN (no verified third host/free route in this pass); paid fallback NOT USED.
- Runtime NOT QUALIFIED; no dispatch enablement.

## Open PR snapshot
- PR #7 remains open/draft; latest review submission is a COMMENTED finding authored by the owner, not independent review. It correctly identifies direct Worker dispatch as a bypass.
- PR #8 remains open/draft; review submissions empty. Its approval-shaped input is not an authenticated capability.
- PR #10 and #11 remain open/draft according to the repository PR search. PR #11's historical run `41918209585` was success for its then-current head; it is not evidence for this working branch.
- PR #11 review submissions empty. No merge performed.

## Next bounded step
1. Add and run unit tests for `pool-worker-caller.mjs` plus static YAML contract tests.
2. Wire fail-closed caller validation into Worker and convert Worker to `workflow_call`; remove `workflow_dispatch`.
3. Refactor Supervisor into a planner/matrix output job plus a statically declared reusable Worker job; remove REST dispatch.
4. Preserve approval consumption/replay safety and bounded 0..20 matrix behavior; do not treat a public marker or a planner input as authority.
5. Keep dispatch disabled; require exact-head CI, independent review, current governance evidence, and separately authorized read-only probe before any runtime.
