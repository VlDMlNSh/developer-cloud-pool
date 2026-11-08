# Attempt finalization replay idempotency — implementation and exact-head CI

Date: 2026-11-08
Status: IMPLEMENTED IN ISOLATED PROOF / EXACT-HEAD CI SUCCESS / NOT MERGED / NOT PRODUCTION-QUALIFIED

## Immutable target and PR

- Parent PR #49 head at branch creation: `4ab0fdc4d649736a171faf95b9ab3a24b17217e8`.
- PR #50: https://github.com/VlDMlNSh/developer-cloud-pool/pull/50
- PR #50 head: `6e6870e5463f3f67e87a305112b208401d95022d`.
- PR #50 base: `4ab0fdc4d649736a171faf95b9ab3a24b17217e8` (PR #49 proof branch).
- PR #50 state: OPEN / DRAFT / UNMERGED.
- Changed adapter blob: `cfbce80efbf8e19fd667770ec3a8f86cd17dc865`.
- Changed test blob: `e259ce028eff89448ebd40881f15c7c410877686`.
- Workflow branch-filter blob: `ef37fb2f4e77d5c103445b3135711c7eedd45e89`.

## Change

When the fenced terminal UPDATE affects no row, adapter now reads the existing immutable Attempt projection and terminal audit event. It returns `ATTEMPT_ALREADY_FINALIZED` only when task/attempt identity, status, result digest, provenance digest, terminal reason, completion timestamp, lease generation, audit actor, audit generation and event digest all match. A conflicting replay remains DENY and does not write another event.

The Workers-runtime regression test now verifies exact replay acceptance, conflicting result rejection and exactly one terminal audit event.

The D1 proof workflow did not originally include this stacked branch in its push filter. Added this branch to the explicit isolated-proof branch allowlist; this enables proof CI only and does not enable Supervisor dispatch.

## Exact-head evidence

- GitHub Actions run: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/42495440869
- Run ID: `42495440869`, attempt 1; exact head `6e6870e5463f3f67e87a305112b208401d95022d`; COMPLETED / SUCCESS.
- Job: `128776662958`, Local Workers-runtime D1 adversarial tests, COMPLETED / SUCCESS.
- `npm ci --ignore-scripts --no-audit --no-fund`: success.
- `npm run check`: success.
- `npm test`: 2 files passed, 35/35 tests passed.
- Artifact: `13623411245`, size 18,253 bytes, SHA256 `5c65c1d6663e0f796606e01e2fa799853ffa53592e013b7fbd8fc67cb8175c5c`.

This verifies the isolated local Workers-runtime D1 proof on this exact branch head. It does not qualify remote D1, production execution, Supervisor/Worker integration, provider routing, secrets, deployment, or Contour A.

## Audit correction

The previous gap audit incorrectly stated that historical `createTaskAttempt` replay fails after the current pointer advances. Source reinspection shows the adapter checks an existing `attempt_id` before attempting a new insert or pointer readback, and exact immutable matches already return `ATTEMPT_ALREADY_CREATED`. That finding is withdrawn; no code change was required for it.

Still open:
- Indeterminate attempts have no evidence-authorized reconciliation transition; Task can remain in expired `leased`.
- Supervisor/Worker does not pass or enforce Attempt ID, lease generation, input/envelope digest, run IDs or dispatch idempotency key.
- Finalizer remains GitHub label/comment based, not D1 Attempt-authoritative.
- PR #50 has no independent review/approval; draft remains unmerged.

## Status

- Exact terminal replay: IMPLEMENTED; exact-head local CI VERIFIED.
- Conflicting terminal replay: regression test VERIFIED in same run.
- Indeterminate reconciliation: NOT IMPLEMENTED.
- Supervisor/Worker integration: NOT IMPLEMENTED.
- Independent review: NOT RUN for PR #50.
- Remote D1 / provider execution / deployment: NOT RUN.
- Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
