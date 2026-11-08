# Duplicate Workflow trigger suppression proof — 2026-11-08

## Immutable target

- Repository: `VlDMlNSh/developer-cloud-pool`
- Branch: `proof/cloudflare-workflows-vitest-2026-11-08`
- Previous tested head: `4eb4aea106787c70039cd7110f1ca7a260628b57`
- Current implementation commit: `1b4643fabd59ba68e88110dba8b98b22f9529b83`
- Upstream Workers SDK fixtures remain pinned to `cloudflare/workers-sdk@ab086218678b1bf311b158bcc6cb6b7437a7839`.

## Reuse-first basis

- Reused the official Cloudflare Workflow binding API and the existing pinned Cloudflare Workers Vitest/Miniflare harness.
- Cloudflare documents that Workflow instance IDs are unique and that `create()` throws when an ID is already in use within retention. Official reference: https://developers.cloudflare.com/workflows/build/workers-api/
- No custom Workflow runtime or mock implementation was introduced.

## Change

- The synthetic proof handler now derives a stable Workflow instance ID from the Attempt ID and lease generation: `attempt-<attemptId>-<generation>`.
- It passes that ID to the official `PROOF_WORKFLOW.create({ id, params })` API.
- A duplicate request with the same Attempt ID and generation is rejected by the Workflow binding rather than creating a second instance.

## Verification

- `npm ci --legacy-peer-deps --ignore-scripts --no-audit --no-fund`: PASS.
- `npm run test:workflow`: 7/7 PASS (4 D1 ledger tests, 3 Workflow runtime tests).
- `npm run check`: PASS.
- `npm test`: 11/11 PASS.
- `npm run validate:ui`: PASS.
- `git diff --check`: PASS.
- Duplicate-trigger assertion: first request creates the deterministic instance; second request rejects as `instance.already_exists`; introspector sees exactly one instance; D1 contains exactly one attempt and one receipt.
- The expected duplicate error is emitted in local Miniflare logs. The test verifies fail-closed rejection; it does not claim an HTTP 409 response contract.

## Qualification boundary

- Evidence is local synthetic Miniflare only.
- This does not verify Cloudflare account-side duplicate delivery, process crash/restart, regional failover, distributed concurrency, external side-effect idempotency, or production Workflow retention semantics.
- The deterministic ID format is a proof convention, not yet a production identity contract. Production adoption still needs bounded ID validation, canonical idempotency-key derivation, payload conflict handling, and D1/Workflow reconciliation.
- No remote D1, secrets, provider/model calls, dispatch, deployment, or production mutation was used.

## Status

- Local duplicate Workflow creation suppression: SUCCEEDED / locally VERIFIED.
- Full local checks: SUCCEEDED.
- GitHub exact-head CI for the final pushed head: pending read-back until verified.
- Independent security/provenance review: NOT RUN.
- Workflow/D1 production qualification: NOT QUALIFIED / NOT ADOPTED.
- Contour A: BLOCKED / NOT QUALIFIED / NOT ACCEPTED.

## Next bounded action

Verify exact-head GitHub CI for the final commit, then investigate whether the official Workflow Vitest harness can model process-restart recovery without claiming a real worker-process restart. Keep PR #52 draft and unmerged.
