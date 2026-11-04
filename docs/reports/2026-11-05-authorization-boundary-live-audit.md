# 2026-11-05 Authorization boundary live audit

## Snapshot
- Canonical branch `Основной`: `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Repository is public. Current default workflow tree has five workflows; the approved Gemini batch controller is absent.

## Findings
- Default Worker blob `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4` still exposes `workflow_dispatch`. Its validation checks open issue state, `pool:claimed`, target SHA and profile, but does not prove the caller is the protected Supervisor. Worker authorization remains BLOCKED.
- Default Supervisor blob `d4bd23d06c0dc98211cea165cdad30a1861eb3bd` uses REST workflow dispatch. Reusable Worker migration therefore requires a Supervisor orchestration refactor.
- PR #7 is OPEN/DRAFT at `e7a1d20bc123f9f3cc6e6651b6335bebd802e333`, 40 ahead / 1 behind default; exact-head CI run [41921293708](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/41921293708) SUCCESS, independent review NOT RUN.
- PR #8 is OPEN/DRAFT at `0a8dba68aa12070b3768d6fb834bedf404ed5d99`, based on stale PR #7 head `d60d26a...`, 19 ahead / 1 behind default; CI NOT VERIFIED, review NOT RUN. Its matrix helper accepts caller-supplied approval data and is not wired into Supervisor.
- PR #11 is OPEN/DRAFT at `7b3bd8d8840e122f03326299444a921e3ba5f425`; exact-head CI run [41918209585](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/41918209585) SUCCESS; review NOT RUN.

## Decision
Do not merge PR #7 or #8. Start a fresh branch from the current default HEAD. Implement a trusted pure Supervisor planner, bounded strict matrix (max 20), static reusable Worker `workflow_call`, caller identity checks using `github.workflow_ref`, `github.workflow_sha`, `job.workflow_repository`, `job.workflow_file_path`, and `job.workflow_sha`, plus atomic approval consumption and terminal recovery. Do not treat actor identity, public labels/comments, or caller-supplied approval objects as capabilities.

## Execution state
No implementation code changed. No secrets or repository variables accessed/changed; `POOL_DISPATCH_ENABLED` NOT VERIFIED. No Worker, DSH, Resource Probe, browser, model/provider calls, Gemini or privileged dispatch. Paid fallback NOT USED. Runtime NOT QUALIFIED.

## Next
Implement the reusable-Worker authorization transition on a fresh branch from `64d2636d4500127e635c214ccfb722c6b3fcda80`. Keep dispatch disabled and require exact-head CI plus independent security review.

Canonical implementation branch: https://github.com/VlDMlNSh/developer-cloud-pool/tree/%D0%9E%D1%81%D0%BD%D0%BE%D0%B2%D0%BD%D0%BE%D0%B9
Architecture decision: https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/continuation-context-2026-11-04/docs/reports/2026-11-04-worker-authorization-architecture-decision.md
