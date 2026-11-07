# Supervisor / Worker authorization source audit — 2026-11-06

## Scope and immutable source refs
Read-only audit of default branch `Основной` at observed HEAD `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- `.github/workflows/pool-supervisor.yml` blob: `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`.
- `.github/workflows/pool-worker.yml` blob: `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`.
- `scripts/pool-supervisor.mjs` blob: `52bf03ca889edd92fd10c71ae96a2e35e106d43f`.
- PR #31 feature head: `5470fccbc4a5fe80a750f402d70d703757fc4c1d`; exact-head validation run `42229917555` COMPLETED / SUCCESS.
- Documentation branch: `docs/cross-chat-continuation-2026-11-06`; it is not the default branch.

## Findings (static source evidence; no runtime exploit asserted)
1. Supervisor workflow is privileged: triggers include `workflow_run` for Pool Worker completion; workflow permissions are `issues: write` and `actions: write`. The script can mutate queue labels/comments and dispatch Worker workflows.
2. Worker remains directly callable via `workflow_dispatch`. Its validation job checks issue-open state, `pool:claimed`, target SHA and allowlisted profile against issue body. The inspected source does not bind authorization to the dispatching actor, a trusted owner approval event/comment, caller workflow identity, or a cryptographically verified approval envelope.
3. Worker report job has `issues: write` and directly updates queue labels plus comments after validation. This conflicts with a single-writer design in which Supervisor alone owns queue mutations.
4. Supervisor stale-claim recovery returns a claim to `pool:ready` after 15 minutes when no matching Worker run is found. This can permit a later reconciliation to reconsider the task without consuming a durable single-use approval marker. Existing source does not prove race-safe single-use authorization.
5. Supervisor checks `POOL_DISPATCH_ENABLED === "true"` and exits before queue work when false. Current variable value was not exposed by the available read-only GitHub connector in this pass; keep dispatch treated as disabled and do not run the workflow.
6. Current effective ruleset detail and required-check configuration were not available through the connected read-only tool surface in this pass. Historical ruleset evidence is not a substitute for a fresh effective-governance read.

## PR and CI reconciliation
- PR #31 is OPEN / DRAFT / UNMERGED, head `5470fccbc4a5fe80a750f402d70d703757fc4c1d`; exact-head run `42229917555` is SUCCESS. Reviews: 0; inline review threads: 0. Independent review NOT RUN.
- PR #25 and #27 are OPEN / DRAFT / UNMERGED. Formal reviews on both: 0.
- PR #31 published PR body is stale relative to the current report: it still describes earlier 304/pagination/cancellation work and says CI pending. The dated URL-origin hardening report records the current successful exact-head run. PR body was not modified in this pass.
- No PR merged, no workflow dispatched, no Worker/Supervisor execution, no DSH probe, no secret read, no provider/model call, no deployment, and no paid resource action.

## Acceptance decision
Contour A remains NOT ACCEPTED / BLOCKED. PR #31's isolated synthetic adapter must remain unmounted until independent review and governance gates pass. Do not enable dispatch.

## Next bounded work
Resolve the authorization ownership contract and design a fail-closed single-writer path: trusted owner approval provenance, caller identity/workflow binding, durable single-use consumption, stale-claim semantics, and Supervisor-only queue writes. Then add static negative fixtures and obtain independent security review before any runtime dispatch or workflow mutation.
