# Cloud Pool checkpoint — 2026-11-06 — Durable state candidate

## Resume source

Read first: [GITHUB-CONTEXT-WINDOW.md](../context/GITHUB-CONTEXT-WINDOW.md) on branch `docs/cross-chat-continuation-2026-11-06`.

## Current disposition

Contour A remains BLOCKED / NOT QUALIFIED / NOT ACCEPTED. Contour B remains DEFERRED.

## Latest pass

Official Cloudflare docs were reviewed. SQLite-backed Durable Objects are available on Workers Free, with hard daily limits (100k requests, 13k GB-s, 5m rows read, 100k rows written, 5 GB SQL storage). Free limit exhaustion fails operations; never introduce paid fallback. Local Miniflare/Workers Vitest integration is available for testing Durable Object bindings without production deployment. Reconciled with the prior store assessment: D1 remains the preferred first proof candidate; Durable Objects are secondary.

ADR: [Durable state and single-use authorization](../architecture/2026-11-06-durable-state-and-single-use-authorization-adr.md).

## Immutable references

- Observed default HEAD: `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- ADR blob: `0e20bb8fcc530dff74e5d949d80e681c7316b0de`.
- Context blob: `e295bacc3383ddc77d60bdbbb4e6969d12e63a3c`.
- Context update commit: `e2e7d78e2cc21eaad8a71c727934ab88fe30043d`.

## Boundaries

No DO implementation, D1, resource creation, deployment, account/billing changes, secrets, provider calls, dispatch, DSH, Resource Probe, production integration or Contour B.

## Next action

Inspect existing package/test conventions and pinned dependency policy. Then continue with a local-only D1 adapter/transaction proof on an isolated branch rooted at the exact current default SHA. Keep it unmounted from Hono and production workflows. Consider Durable Objects only if the proof identifies a specific need for per-approval serialized actors. Require exact-head CI and independent review before any integration.
