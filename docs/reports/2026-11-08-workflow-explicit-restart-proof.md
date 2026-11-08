# Explicit Workflow restart and durable receipt proof — 2026-11-08

## Immutable target

- Repository: `VlDMlNSh/developer-cloud-pool`
- Branch: `proof/cloudflare-workflows-vitest-2026-11-08`
- Parent tested head: `784a2288fe3c42deb53c6e585c9180264c16b91b`
- Scope: local-only extension of the Workflow runtime proof; no production integration.

## Official API findings

- Cloudflare Workers Vitest test APIs expose Workflow introspection and modifiers (instance status/output/error, mock events/sleeps/retry delays and test isolation).
- The documented test API does not expose a way to kill/restart the underlying Worker process.
- The separate official Workflow instance API exposes `instance.restart()`. Cloudflare documents that it cancels in-progress steps, erases intermediate Workflow state and treats the Workflow as a first run.
- Therefore explicit Workflow restart is not evidence of recovery after an unexpected Worker-process crash/restart.

References:
- https://developers.cloudflare.com/workers/testing/vitest-integration/test-apis/
- https://developers.cloudflare.com/workflows/build/trigger-workflows/

## Test added

- Creates and completes a synthetic Workflow instance.
- Calls the official `env.PROOF_WORKFLOW.get(id).restart()` API.
- Waits for the restarted Workflow to complete.
- Verifies the D1 receipt still exists exactly once and its JSON is unchanged.
- Verifies the Attempt remains completed at the same generation.
- Verifies the step callback invocation counter is 2 (initial execution + explicit restart).
- Verifies the Workflow output is the original committed receipt.

This test exercises explicit Workflow restart semantics only. It does not kill a Worker process, restart Miniflare, recreate the D1 database, or simulate Cloudflare infrastructure failure.

## Local verification

- `npm ci --legacy-peer-deps --ignore-scripts --no-audit --no-fund`: PASS.
- `npm run check`: PASS.
- `npm test`: 11/11 PASS.
- `npm run validate:ui`: PASS.
- `npm run test:workflow`: 8/8 PASS (4 D1 ledger tests, 4 Workflow runtime tests).
- `git diff --check`: PASS.
- The Workflow runtime test output includes the expected synthetic post-commit timeout and duplicate-instance rejection logs from prior tests. The explicit restart emits a Workerd `outputGateBroken` cancellation diagnostic (`User called restart`); the test completes successfully and all D1/output assertions pass. This is recorded rather than suppressed.

## PR #51 reconciliation-chain inspection

- PR #51 exact head: `4d83a77c3d97dccdac8f87ad0fda9182d4fd3ee7`; base PR #50 exact head: `6e6870e5463f3f67e87a305112b208401d95022d`.
- PR #51 migration 0005 adds a unique pending reconciliation row on the running -> indeterminate transition, preserving task key, attempt ID, input digest, lease generation, expired lease owner and timestamp.
- Trigger checks that the task still points to the same current attempt and generation; it does not clear the lease, create a retry, or authorize terminalization.
- PR #51 also includes exact terminal-finalization replay recognition from PR #50; conflicting replay remains denied and no second terminal event is appended.
- This is a useful fail-closed persistence boundary, but it is not an authority resolver. It has no trusted evidence/capability verification and no retry/lease-takeover permission.
- PR #51 exact-head Actions run could not be found through the available PR-triggered run lookup; CI is NOT VERIFIED. Both PR #50 and #51 remain DRAFT / UNMERGED. No independent review exists.
- Migration 0005 depends on prior task/attempt tables; this pass inspected the added migration and relevant application logic but did not run the separate PR #51 suite against its exact head.

## Qualification boundary

- Workflow restart + durable local D1 receipt: SUCCEEDED / locally VERIFIED.
- Worker-process restart recovery: NOT VERIFIED.
- Real Cloudflare account D1/Workflow semantics, regional failover, distributed concurrency, external side-effect idempotency and authority bridge: NOT VERIFIED.
- No secrets, provider/model calls, dispatch, deployment, remote D1 or paid fallback.

## Next bounded action

Verify the exact-head CI and migration chain for PR #51 using its pinned proof repository workflow; if the exact-head workflow is absent or untriggered, run the documented tests locally against an immutable checkout and keep the CI status NOT VERIFIED. Do not implement an authority resolver until its issuer/capability contract is approved.
