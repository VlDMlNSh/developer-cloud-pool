# Cloud Development Pool — isolated D1 proof

This directory contains a local-only Cloudflare Workers/D1 proof. It is not mounted in the product Worker, the Hono web console, production Supervisor/Worker workflows, or any deployed service.

## Current migration baseline

The clean-base candidate starts from the owner-approved CODE capability root and preserves the selected canonical source lineage:

- 0001: CODE approval ledger with exact `jarvis-code-sandbox-v1` profile constraint.
- 0002–0005: historical per-approval tables, logical task identity, immutable attempts and non-authorizing reconciliation.
- 0006–0010: independent terminal-attempt projection outbox, bounded delivery retries, identity immutability and at-most-once comment-post state.

The next forward-only integration stage will retire the legacy per-approval claim/outbox writer and add atomic qualified admission, lease fencing and executor identity binding. Do not infer that those later migrations have been applied.

## Runtime and test boundary

- Exact-pinned development dependencies: `@cloudflare/vitest-plugin@1.4.7`, `vitest@4.1.12`.
- Uses the official Cloudflare Workers Vitest integration and local Miniflare/workerd D1 runtime.
- Uses only synthetic test rows.
- No account API, hosted D1, secrets, provider calls, GitHub writes, workflow dispatch, or external execution.
- The Worker entrypoint is deliberately inert and returns 404.
- Every observed queue and adapter in this proof is non-dispatching. This package does not grant execution authority.

## Run

With Node.js 24:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run check
npm test
```

The tests apply migrations 0001–0010 to a fresh local D1 database and verify the CODE profile constraint, one logical task for multiple approvals, exactly one task-ready outbox row, zero writes to the legacy tables for the task-keyed path, and the independent projection outbox schema.

## Status

This is a candidate proof foundation on a clean branch from a frozen default SHA. It is not a hosted deployment, executor qualification, or Contour A acceptance.
