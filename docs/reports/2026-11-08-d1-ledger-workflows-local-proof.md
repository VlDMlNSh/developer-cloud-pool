# Cloudflare Workflows + D1 local proof — 2026-11-08

## Scope and immutable base

- Repository: `VlDMlNSh/developer-cloud-pool`
- Branch: `proof/cloudflare-workflows-vitest-2026-11-08`
- Base commit: `8e3cd9dd4d2a650c0b37042ff896fb5c0f282f1e`
- Upstream Cloudflare Workers SDK fixture baseline: `ab086218678b1bf311b158bcc6cb6b7437a7839`
- Runtime: Voktors-Mini.Dlink, Node 22.23.3, npm 10.9.9
- Dependencies: `@cloudflare/vitest-plugin@1.6.0`, `vitest@4.1.12`, `wrangler@4.158.0`, existing Hono 4.13.16
- All data is local synthetic Miniflare/D1. No remote D1, provider, model, OAuth credential, secret, workflow dispatch, or deployment was used.

## Implementation

- Added a synthetic-only D1 migration with task-attempt identity, immutable lease generation, and unique durable receipt keyed by attempt + generation.
- Added a bounded D1 adapter:
  - `claimAttempt` uses insert-if-absent and exact task/attempt/generation read-back.
  - `commitAttemptReceipt` uses one D1 batch to persist the first receipt and mark the exact attempt completed; replay returns the first durable receipt and cannot overwrite it.
  - `markAttemptNeedsReview` transitions only the exact currently-claimed attempt and does not authorize retry.
- Added local Vitest tests for commit-then-ambiguous-timeout replay, stale-generation/task mismatch rejection, and needs-review no-retry.
- Retained the separate official Workflow runtime smoke test. This proves Workflow local execution and D1 primitive behavior independently; it does **not** yet prove that a Workflow step and D1 receipt compose safely under a real Cloudflare retry/timeout boundary.

## Verification

- `npm ci --legacy-peer-deps --ignore-scripts --no-audit --no-fund`: PASS (existing local installation from prior proof session; dependency lock updated).
- `npm run check`: PASS.
- `npm test`: 11/11 PASS.
- `npm run validate:ui`: PASS.
- `npm run test:workflow`: 4/4 PASS (1 Workflow runtime test + 3 D1 ledger tests).
- `git diff --check`: PASS.

## Important limits / not yet qualified

- Tests execute against local Miniflare D1, not a deployed Cloudflare account or production D1.
- The Workflow runtime smoke and D1 ledger tests are separate. A composed Workflow test that performs a D1 receipt commit and then injects a timeout/retry around the same Workflow step remains NOT RUN.
- Concurrency stress, actual Cloudflare D1 transaction semantics under account runtime, cross-workflow duplicate trigger, caller identity bridge, external side-effect idempotency, and independent security review remain NOT VERIFIED.
- A D1 receipt is evidence of a recorded result, not proof that arbitrary external side effects are exactly-once. External effects still require their own idempotency/fencing contract.
- No production code, workflow dispatch, authorization gate, deployment, or provider routing was enabled.

## Status

- Local D1 primitives: SUCCEEDED / locally VERIFIED.
- Official Workflow local runtime smoke: SUCCEEDED / locally VERIFIED.
- Composed Workflow+D1 retry proof: NOT RUN.
- GitHub exact-head CI: NOT VERIFIED until branch is pushed and workflow results are read back.
- Independent review: NOT RUN.
- Workflows adoption: NOT QUALIFIED / NOT ADOPTED.
- Contour A: BLOCKED / NOT QUALIFIED / NOT ACCEPTED.
- Dispatch remains fail-closed; Contour B remains deferred.

## Next bounded step

Compose the D1 adapter into a synthetic Workflow step and test replay after commit-then-timeout using official Vitest Workflow mocks. Verify the exact branch head in GitHub CI, then request independent security review before any adoption decision.
