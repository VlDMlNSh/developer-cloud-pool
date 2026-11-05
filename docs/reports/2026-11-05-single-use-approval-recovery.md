# 2026-11-05 — fail-closed recovery for consumed pool claims

## Scope and immutable provenance
- Repository: `VlDMlNSh/developer-cloud-pool`.
- Canonical base: `Основной` at `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- Stacked source: PR #15 head `c57f2ab3f2b91bf6b3e413640f65ec518008b75e`.
- PR: [#18](https://github.com/VlDMlNSh/developer-cloud-pool/pull/18), OPEN / DRAFT / NOT MERGED.
- Current source head at report creation: `b0676ea206cdce07b5d9c90cad3d853236b7f321`.

## Change
- Added pure policy module `scripts/pool-claim-recovery.mjs`.
- Added six regression tests in `scripts/pool-claim-recovery.test.mjs`.
- Integrated policy into Supervisor stale-claim reconciliation:
  - known active Worker states (queued, in_progress, waiting, pending, requested) remain claimed;
  - completed or unknown run state fails closed to needs-review;
  - expired claim without a provable matching run moves to needs-review, not pool:ready.
- Integrated dispatch error policy: once the task is claimed, dispatch failure moves to needs-review; it is not automatically returned to pool:ready.
- Added the regression suite to Pool Contract Validation.

## Read-back evidence
- `scripts/pool-claim-recovery.mjs`: blob `09507d19860005a5888479c871d21762950ded6b`.
- `scripts/pool-claim-recovery.test.mjs`: blob `cfd86482d37f62ac69dc6e2a32fd59cc9cabcfe3`.
- `scripts/pool-supervisor.mjs`: blob `ddf7e7b1a4fa815638de5dde78df793181a1db90`.
- `.github/workflows/pool-contract-validation.yml`: blob `3226a5cac2014e0c65afa433bee2538870565b29`.
- All four files were re-read from the PR branch. Patch inspection confirms both ready-queue rollback paths were removed.

## Verification and limits
- Exact-head CI lookup for `b0676ea206cdce07b5d9c90cad3d853236b7f321` returned no workflow runs and no combined status entries: CI NOT VERIFIED / NOT RUN evidence unavailable.
- Independent PR reviews: empty; review threads: empty; independent security review NOT RUN.
- Runtime Supervisor/Worker execution: NOT RUN.
- No secrets, repository variables, Environments, rulesets, DSH, Resource Probe, browser, model/provider calls or paid fallback accessed/executed.
- `POOL_DISPATCH_ENABLED` not read or changed in this pass; preserve fail-closed state.

## Remaining blockers
This patch is intentionally narrow and does not qualify dispatch:
1. Supervisor still uses REST `workflow_dispatch`.
2. Worker still exposes direct `workflow_dispatch`.
3. PR #12 owner approval and caller-context helpers remain unwired in the production execution path.
4. The Environment gate and deterministic consumed-approval marker are not configured or qualified.
5. Zizmor must pass on the final integrated exact head.
6. Independent security review and repository governance acceptance remain outstanding.

## Decision
The no-requeue recovery behavior is implemented in this proposed branch but is **NOT VERIFIED by CI, NOT REVIEWED, NOT QUALIFIED and NOT ACCEPTED**. Do not merge this PR as a complete authorization solution. Keep dispatch disabled.
