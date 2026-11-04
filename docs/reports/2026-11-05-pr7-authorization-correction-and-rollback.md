# 2026-11-05 — PR #7 Worker authorization correction and rollback

**Repository:** https://github.com/VlDMlNSh/developer-cloud-pool  
**Canonical branch:** `Основной`  
**Canonical HEAD:** `64d2636d4500127e635c214ccfb722c6b3fcda80`  
**PR #7:** https://github.com/VlDMlNSh/developer-cloud-pool/pull/7  
**PR #7 current head:** `e7a1d20bc123f9f3cc6e6651b6335bebd802e333`  
**Status:** OPEN / DRAFT / NOT ACCEPTED

## Summary

A brief exploratory implementation attempted to make the standalone Worker `workflow_dispatch` validate `github.actor == github-actions[bot]`, bot-authored issue comments and a Supervisor run ID. Re-reading the repository's earlier architecture decision and owner-authored PR comment showed that this is explicitly the wrong trust boundary: actor does not identify the calling workflow, and public issue labels/comments are not secret capabilities.

All five files touched by that experiment were restored byte-for-byte to their exact PR #7 baseline blobs from immutable commit `d60d26ae647940e702d646e572c861a8f68f523e`. The attempted approach is rejected and must not be integrated.

## Rollback evidence

| File | Restored baseline blob SHA |
|---|---|
| `.github/workflows/pool-worker.yml` | `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4` |
| `scripts/pool-approval.mjs` | `9442c413c38dc28c67455362e254ff703bcfedd9` |
| `scripts/pool-approval.test.mjs` | `c7c7499d9d2bb4c123e72b86adb85369023c4284` |
| `scripts/pool-supervisor.mjs` | `b2046dd9671c6bd5491f63a006d10239fbd3d3b1` |
| `scripts/validate-pool-contract.mjs` | `830d6bd5cfbd3f95e9c319e60764c9c5e9cf6def` |

Rollback commit sequence ended at PR #7 head `e7a1d20bc123f9f3cc6e6651b6335bebd802e333`. All five paths were fetched again after the writes and their blob SHAs match the baseline values above.

## CI evidence

- Exploratory exact-head run [41921136505](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/41921136505): COMPLETED / FAILURE; failed at `Test owner-bound approval contract`. This run is rejected exploratory evidence, not an acceptance run.
- Restored exact-head run [41921293708](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/41921293708): COMPLETED / SUCCESS. Job `126894183572`; YAML parsing, owner approval tests and static pool contract validation all completed successfully on restored PR #7 head.
- No Worker, DSH, Resource Probe, browser, model/provider call, or privileged dispatch was run.

## Canonical architecture decision

The existing [Worker authorization architecture decision](https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/continuation-context-2026-11-04/docs/reports/2026-11-04-worker-authorization-architecture-decision.md) remains authoritative:

1. Replace standalone Worker `workflow_dispatch` with a reusable workflow declared using `workflow_call`.
2. Invoke it only as a statically declared job from the protected default-branch Pool Supervisor.
3. In the reusable Worker, verify the caller workflow identity using `github.workflow_ref`, `github.workflow_sha`, `job.workflow_repository`, `job.workflow_file_path` and `job.workflow_sha`.
4. Revalidate the issue envelope, immutable target SHA, profile and owner approval inside the Worker.
5. Refactor Supervisor into a bounded task-planning/matrix-output phase and a downstream reusable-workflow matrix job. Preserve max 20, strict schema validation, idempotency, terminal result collection and recovery.
6. Do not use public labels/comments as capabilities, actor identity as caller identity, or introduce an unreviewed HMAC secret shortcut.

Official GitHub documentation references are included in the architecture decision. No new claim is made here that the proposed reusable workflow has been implemented or qualified.

## Related PR state

- PR #7: OPEN / DRAFT; base SHA `692025e4a039aaf94c6683bb95da38b4f324fce8`; head `e7a1d20bc123f9f3cc6e6651b6335bebd802e333). Compared with current default `64d2636d4500127e635c214ccfb722c6b3fcda80`: 40 ahead, 1 behind, `diverged`. It must not be merged until rebased/reconciled and independently reviewed.
- PR #7 review submissions contain only the author's COMMENTED preliminary finding; independent review NOT RUN.
- PR #8: OPEN / DRAFT; base is PR #7's former head `d60d26a...`, head `0a8dba68aa12070b3768d6fb834bedf404ed5d99`; mergeable false. Its pure matrix builder is bounded to 20 and has nine tests, but accepts a caller-supplied approval object and does not authenticate it. CI NOT VERIFIED; not wired into Supervisor.
- PR #11: OPEN / DRAFT at `7b3bd8d8840e122f03326299444a921e3ba5f425`; exact-head CI [41918209585](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/41918209585) SUCCESS; reviews and review threads empty, independent review NOT RUN.
- Current default branch confirmed by compare: `Основной` is identical to `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- No approved Gemini controller found on default branch in the previous live check; Gemini NOT RUN.

## Safety and execution state

`POOL_DISPATCH_ENABLED` was not changed in this pass. No secrets or repository variables were changed. No PR was merged. No paid service or fallback was used. Runtime dispatch remains NOT RUN and pool qualification remains BLOCKED.

## Next bounded step

Start a separate implementation branch from the current canonical HEAD. First reconcile PR #7's stale base and PR #8's dependency without merging either blindly. Then design and test the pure Supervisor planning contract that emits a validated matrix, including a provenance-safe approval envelope. Only after that should the protected Supervisor workflow be refactored to call a reusable Worker statically. Keep all dispatch disabled and obtain independent security review before integration.
