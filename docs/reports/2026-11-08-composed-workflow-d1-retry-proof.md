# Composed Cloudflare Workflow + D1 retry proof — 2026-11-08

## Immutable target and runtime

- Repository: `VlDMlNSh/developer-cloud-pool`
- Branch: `proof/cloudflare-workflows-vitest-2026-11-08`
- Parent proof head: `c108f52957d4ad3964e57e72cda0f5a4fa721721`
- Base PR #25 head: `8f0c0c57cf24d476a27d456e80ffd1d8ced7ab85`
- Pinned official Workers SDK fixtures: `cloudflare/workers-sdk@ab086218678b1bf311b158bcc6cb6b7437a7839`
- Local runtime: Voktors-Mini.Dlink; Node 22.23.3; npm 10.9.9
- Cloudflare test stack: `@cloudflare/vitest-plugin@1.6.0`, Vitest 4.1.12, Wrangler 4.158.0, Miniflare local D1.
- No Cloudflare account, remote D1, secret, credential, provider, model, external side effect, deployment, dispatch or paid resource was used.

## Implementation

- Composed the existing attempt ledger into the synthetic Workflow's actual `step.do` callback.
- The Workflow first claims the exact task/attempt/generation. The step then records invocation count, commits the receipt through the D1 adapter and returns the durable first-writer receipt.
- The step has a bounded retry policy (limit 2) and deterministic name `commit-d1-receipt`.
- A test-only persistent fault row injects one failure **after** the D1 receipt commit. It is consumed through a conditional D1 update, so the fault is one-shot even if the Workflow callback is replayed.
- On retry, the adapter reads/returns the original receipt rather than overwriting it.
- The test asserts:
  - Workflow reaches `complete`.
  - Same named step returns the committed receipt.
  - Callback invocation count is exactly 2 for the injected failure case.
  - Exactly one receipt row exists.
  - Attempt remains completed at the exact lease generation.
  - Fault counter is consumed to zero.
- Added concurrent duplicate-claim and concurrent competing-receipt test. Both calls return the same first-writer receipt and exactly one receipt row remains.
- Added CI coverage for the Workflow/D1 Vitest suite; lockfile install uses the peer-dependency mode already required by this pinned stack.
- Test-only fault injection table is explicitly local-proof infrastructure and is not a production pool schema/authority.

## Local verification

Fresh dependency install and complete local suite:
- `npm ci --legacy-peer-deps --ignore-scripts --no-audit --no-fund`: PASS.
- `npm run check`: PASS.
- `npm test`: 11/11 PASS.
- `npm run validate:ui`: PASS.
- `npm run test:workflow`: 6/6 PASS (4 D1 ledger tests, 2 composed Workflow tests).
- `git diff --check`: PASS.

The injected failure appears as an expected Workflow step exception in Miniflare output; the Workflow then retries and the test passes with two invocations and one durable receipt.

## Qualification boundary

- This is a local Miniflare proof of a Workflow step failing after a durable D1 commit and retrying the same step. It is not a live Cloudflare account test.
- The fault injection is persistent across callback invocations, but no worker-process crash/restart or Cloudflare regional failover was induced.
- The concurrent test uses local D1/Miniflare scheduling, not a distributed production concurrency stress test.
- It proves one logical D1 receipt, not exactly-once arbitrary external side effects. External APIs still require their own idempotency keys, outbox/reconciliation and issuer/capability checks.
- Duplicate Workflow creation/event suppression, real account D1 transaction semantics, external side-effect idempotency, OAuth/session deployment, worker/browser device QA and independent security review remain NOT VERIFIED or NOT RUN.
- The PR remains DRAFT / UNMERGED. No production code is enabled. No Workflow adoption, dispatch authority or Contour A acceptance is claimed.

## Status

- Local Workflow + D1 commit-then-timeout retry: SUCCEEDED / locally VERIFIED.
- Local concurrent duplicate claim + first-writer receipt: SUCCEEDED / locally VERIFIED.
- Full local test suite: SUCCEEDED.
- GitHub exact-head CI for this new head: PENDING until the run and jobs are read back.
- Independent review: NOT RUN.
- Workflow/D1 production qualification: NOT QUALIFIED / NOT ADOPTED.
- Contour A: BLOCKED / NOT QUALIFIED / NOT ACCEPTED.
- Dispatch remains fail-closed; Contour B remains deferred.

## Next bounded action

Push the exact tested head, verify the new GitHub Actions run and all job steps on that exact SHA, then request an independent security/provenance review. Keep the PR draft and unmerged. Next proof gap after CI: duplicate Workflow creation/event suppression and process-restart recovery.
