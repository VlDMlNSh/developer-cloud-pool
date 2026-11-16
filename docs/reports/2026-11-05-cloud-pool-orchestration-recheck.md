# 2026-11-05 — Cloud Pool authorization and orchestration recheck

## Immutable source and live refs

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Canonical branch: `Основной`
- Canonical HEAD: `64d2636d4500127e635c214ccfb722c6b3fcda80` (unchanged during this pass)
- Documentation working branch: `docs/2026-11-05-live-pool-recheck`
- Documentation PR: [#19](https://github.com/VlDMlNSh/developer-cloud-pool/pull/19), OPEN / DRAFT / NOT MERGED
- Ruleset: [26550182](https://github.com/VlDMlNSh/developer-cloud-pool/rules/26550182)

## Governance

The active Ruleset selects exactly `refs/heads/Основной` and blocks deletion/non-fast-forward updates. It requires PRs and review-thread resolution, but its live configuration has `required_approving_review_count=0`, `require_code_owner_review=false`, and no bypass actors. Therefore independent approval is not enforced. Classic branch protection remains NOT VERIFIED through the available read path.

The open governance issue [#1](https://github.com/VlDMlNSh/developer-cloud-pool/issues/1) contains earlier evidence and must be reconciled after a ruleset change. The repository variable `POOL_DISPATCH_ENABLED` was NOT READ OR CHANGED in this pass; do not infer its present value.

## PR and CI state

- [PR #20 — bounded Worker matrix planner](https://github.com/VlDMlNSh/developer-cloud-pool/pull/20): OPEN / DRAFT / NOT MERGED; head `5d8d41071fed2f47df9036346932b65d8da53e66`. Exact-head run [42102625914](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42102625914), check `127509096355`, COMPLETED / SUCCESS. Formal reviews: none.
- [PR #19 — documentation recheck](https://github.com/VlDMlNSh/developer-cloud-pool/pull/19): OPEN / DRAFT / NOT MERGED; head before this report update `63604ea72ceca3a229cede9aeb0e72fcbf17cc21`. Formal reviews: none. No exact-head CI run was returned for that head; status NOT VERIFIED.
- PRs #12, #15, #16, #17, #18 remain separate open proposals; their historical exact-head results are not a substitute for verifying a final integrated head. PR #17's previously observed zizmor failure remains unresolved unless a newer exact-head successful audit is demonstrated.

## Production orchestration findings

Canonical `.github/workflows/pool-worker.yml` still exposes direct `workflow_dispatch`. Canonical `.github/workflows/pool-supervisor.yml` still grants `actions: write` and uses a Supervisor REST dispatch path. The canonical `scripts/pool-supervisor.mjs` performs candidate read, label PATCH to `pool:claimed`, then dispatch as separate operations. This is not an atomic compare-and-swap claim.

The Supervisor also has multiple state-changing paths (normal dispatch, failed-run recovery, stale-claim reconciliation). A shared GitHub Actions concurrency group can serialize workflow executions only when every writer participates in the same boundary; it does not itself make GitHub Issues label updates transactional. The current design must not be described as exactly-once or race-safe.

PR #18 proposes fail-closed no-requeue recovery after ambiguous/failed dispatch, but is OPEN / DRAFT / unreviewed and stacked on PR #15. This reduces replay risk but does not make issue claiming atomic or authorize the production caller.

PR #20 adds a pure matrix planner capped at 20. It deliberately does not verify owner approval, consume a single-use marker, claim issues, dispatch jobs, or establish Worker caller authorization. Its successful check verifies the planner and static contract only.

## Runtime and executor status

No Worker dispatch, DSH run, Resource Probe, browser session, model/provider call, secret read, deployment, or merge was performed. `POOL_DISPATCH_ENABLED` was not read or changed. DSH remains NOT QUALIFIED; browser runtime NOT RUN; model routing/renewable quotas DESIGN / NOT QUALIFIED; 20 execution slots DESIGN ONLY; Jarvis live mobile API NOT CONNECTED.

## Next bounded implementation

Build one integrated reusable Worker boundary on a dedicated branch, rather than adding another isolated planner:
1. Worker is `workflow_call` only; remove direct `workflow_dispatch`.
2. Supervisor invokes the reusable Worker statically; remove REST workflow dispatch and unnecessary `actions: write`.
3. Wire the PR #12 caller-context validator before any runtime job.
4. Define one serialized state writer and make all claim/recovery/report transitions use that same boundary.
5. Treat issue labels as state hints, not atomic approval/claim tokens. Select and test a durable single-use mechanism with least privilege; fail closed on ambiguous dispatch.
6. Add adversarial tests for duplicate events, concurrent claim attempts, stale approval, changed target SHA, interrupted dispatch, foreign caller and permission leakage.
7. Require independent security review and a non-zero Ruleset approval gate before merge or runtime qualification.

## Disposition

Production dispatch: BLOCKED. PR #20 planner: IMPLEMENTED / exact-head CI VERIFIED / NOT REVIEWED / NOT ACCEPTED. Integrated authorization boundary: NOT IMPLEMENTED. Runtime qualification and deployment: NOT RUN.
