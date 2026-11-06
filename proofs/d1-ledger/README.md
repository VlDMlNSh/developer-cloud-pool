# Isolated D1 single-use ledger proof

This package is a local-only proof of D1 transaction and conditional-consume behavior. It is not mounted in the Hono web console, the production Supervisor/Worker workflows, or any deployed Worker.

## Scope

- Uses the official Cloudflare Workers Vitest integration and local Miniflare/workerd runtime.
- Uses a synthetic D1 binding and local SQL migration.
- Tests concurrent first-consumer-wins, replay, immutable binding checks, expiry, malformed input, unavailable storage, ambiguous storage exceptions, and D1 batch rollback.
- The adapter returns `dispatch: false` even on a successful ledger consume. It has no GitHub, provider, dispatch, or secret integrations.

## Dependency policy

Direct development dependencies are exact-pinned in `package.json`:
- `@cloudflare/vitest-plugin@1.4.7`
- `vitest@4.1.12`

The pull-request workflow generates a per-run lockfile and preserves it as a short-retention artifact for review. This is a bootstrap compromise: a committed, reviewed lockfile is still required before this proof can be considered merge-ready or reproducible across runs. Do not merge this branch while `package-lock.json` is absent.

## Run

From this directory, with Node.js 24:

```sh
npm install
npm test
```

## Explicit exclusions

No Cloudflare account API, D1 provisioning, billing, deployment, GitHub dispatch, provider/model call, OAuth, secret access, production integration, or Contour B work.
