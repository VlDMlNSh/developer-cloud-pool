# 2026-11-10 — native workflow_run binding and claim-retention policy proof

## Immutable refs and scope

- PR #57 final head: `2c263e8a9915f0bc8e0698cde816e87cb2376538`; OPEN / DRAFT / UNMERGED.
- Base `Основной`: `864213e2ff5b4fa956ba405dea8137a44d812f49`.
- PR #57 remains a read-only proof branch. No production Supervisor/Worker workflow, dispatch setting, secret, token, service or deployment changed.

## New pure modules

1. `src/workflow-run-event-binding.mjs` derives an immutable run binding only from a completed native `workflow_run` event payload. It requires deployment-pinned repository ID, workflow ID, exact workflow path and expected originating event; checks event action/status, top-level and run repository IDs, head repository ID (rejects forked/missing head repository), run ID, exact `run_attempt`, 40-hex head SHA and referenced-workflow array.
   - Blob: `793e5dbbf86e18075fc3586ea81a1064d71dd98a`
   - Tests blob: `691d56c6306328efa132a7f50cba5ad301d331ec` is the commit that added the tests; test file blob verified by current branch read-back after commit.
2. `src/workflow-run-reconciliation-policy.mjs` maps lifecycle evidence to a hold-only policy. `STILL_ACTIVE` and `UNRESOLVED` preserve CLAIMED; `TERMINAL_EXECUTOR_ONLY` preserves CLAIMED and requires separate effect reconciliation. Every outcome has `dispatch=false` and `retryAuthorized=false`; there is no release-to-ready outcome.
   - Module commit: `5d4129480fd7e4e6da16c0d28834ae269a61b7bd`
   - Tests commit: `2c263e8a9915f0bc8e0698cde816e87cb2376538`

These are pure contract proofs. The event helper explicitly cannot authenticate the runner or prove `GITHUB_EVENT_PATH` provenance; trusted host composition must source native environment values and pinned config. The policy helper is not wired to the production Supervisor and cannot prove atomic state transitions.

## Exact-head CI

Final PR #57 head `2c263e8a9915f0bc8e0698cde816e87cb2376538`:

- Fixture run `42838193384`, job `129905939447`: COMPLETED / SUCCESS; log confirms 33 tests, 33 passed, 0 failed.
- Pool Contract Validation run `42838193405`, job `129905939738`: COMPLETED / SUCCESS.
- Both runs use the exact final PR head.
- Earlier exact-head intermediate runs for commits `793e5db...` and `691d56c...` passed; final-head evidence is the two runs above.

## Supervisor / Worker integration seam audit

Default branch `Основной` remains at `864213e2ff5b4fa956ba405dea8137a44d812f49`.

- Default Supervisor workflow blob `d4bd23d06c0dc98211cea165cdad30a1861eb3bd` still includes privileged `workflow_run` trigger, `actions: write`, `issues: write`, and run metadata env fields that do not include exact `run_attempt` or complete immutable run identity.
- Default Worker workflow blob `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4` remains a `workflow_dispatch` worker with an issue-writing report job.
- The draft PR #37 proposes a reusable `workflow_call` Worker and removes the Supervisor `workflow_run` trigger. Its exact head `1be8672c1be1a720b6c813dcafff5c020b6456ae` passed its two named PR workflows: `42484039940` and `42484039932`. It remains OPEN/DRAFT and has a formal CHANGES_REQUESTED review recorded on an earlier head; no fresh independent approval is established.
- PR #37 still has a Finalizer that checks only for `pool:claimed` before changing labels. It does not bind the terminal transition to the exact task envelope digest, claim generation/owner and executing run/attempt. This leaves the prior F2 race unresolved. Its label-based intake is not a CAS claim. The PR base is the old `197ba98...`, not current default HEAD `864213e...`; it must not be treated as integrated or merge-ready.

## Disposition

- Native workflow_run event-to-attempt binding: VERIFIED as a pure synthetic contract only.
- Hold-only policy for active, terminal-executor-only and unresolved evidence: VERIFIED as a pure synthetic contract only.
- Runner event provenance / trusted event-file boundary: NOT QUALIFIED.
- Production Supervisor wiring: NOT IMPLEMENTED.
- Atomic claim, fencing and effect reconciliation: NOT QUALIFIED.
- PR #37 finalizer binding and claim CAS: BLOCKED / NOT VERIFIED.
- PR #57 independent review: NOT RUN; reviews and inline threads remain zero.
- Live GitHub API request: NOT RUN.
- No secrets read, dispatch, provider/model call, DSH, Resource Probe, remote D1/Worker provisioning, deployment, merge or paid resource used.
- Contour A: NOT ACCEPTED. Contour B: DEFERRED.

## Next bounded step

Design a single immutable reconciliation envelope linking repository/task ID, envelope digest, issuer/approval provenance, claim ID/generation, run ID/run_attempt, workflow ID/path/ref/SHA, and side-effect receipt. Then prove a compare-and-swap terminal transition and stale-finalizer rejection in the existing local D1/claim proof stack before considering any production integration. Keep dispatch disabled.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
