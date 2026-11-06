# Isolated D1 single-use ledger proof

This package is a local-only proof of D1 transaction and conditional-consume behavior. It is not mounted in the Hono web console, the production Supervisor/Worker workflows, or any deployed Worker.

## Scope

- Uses the official Cloudflare Workers Vitest integration and local Miniflare/workerd runtime.
- Uses a synthetic D1 binding and local SQL migration.
- Tests concurrent first-consumer-wins, replay, immutable binding checks, expiry, malformed input, unavailable storage, ambiguous storage exceptions, D1 batch rollback, atomic claim-plus-outbox creation, deterministic retry identity, and fail-closed batch errors.
- The consume and claim/outbox adapters return `dispatch: false` even on successful local proofs. The claim/outbox adapter uses one D1 batch to conditionally consume approval, create a durable pending claim, and append one deterministic outbox event. It has no GitHub, provider, dispatch, or secret integrations.

## Dependency policy

Direct development dependencies are exact-pinned in `package.json`:
- `@cloudflare/vitest-plugin@1.4.7`
- `vitest@4.1.12`

The repository includes a committed `package-lock.json` (lockfileVersion 3). The pull-request workflow uses `npm ci --ignore-scripts --no-audit --no-fund` directly against that lockfile; it does not regenerate the dependency graph. CI also uploads the resolved lockfile as a short-retention artifact for independent comparison. Keep the committed lockfile in sync with `package.json`; do not replace `npm ci` with a lockfile-generating install step.

## Run

From this directory, with Node.js 24:

```sh
npm install
npm test
```

## Explicit exclusions

No Cloudflare account API, D1 provisioning, billing, deployment, GitHub dispatch, provider/model call, OAuth, secret access, production integration, or Contour B work.

The migration helper is imported from the package public entrypoint (`@cloudflare/vitest-plugin`), matching the current official D1 Vitest fixture.

Final validation note: D1 proof CI completed successfully with 13/13 tests on the immediately preceding source revision; report metadata is also recorded in `docs/reports/2026-11-06-d1-ledger-proof-implementation.md`.
