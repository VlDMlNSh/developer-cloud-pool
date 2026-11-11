# Free-tier first runtime slice architecture audit

- Date: 2026-11-11
- Status: ARCHITECTURE REVIEW COMPLETE / DEPLOYMENT NOT AUTHORIZED
- Immutable references: PR #24 head `d9a7389d4bb5562bb6f2a1e853ebc818659e2cd6`; PR #6 head `5b8469b3bb691ff48f8be9bda9aea0969d42f537`; default branch baseline previously observed `Основной@864213e2ff5b4fa956ba405dea8137a44d812f49`.
- Documentation branch: `docs/cross-chat-continuation-2026-11-06`.

## 1. Decision: separate the Experience plane from the Pool runtime

Do not combine the first remote web console deployment with the Supervisor/D1 task runtime.

The existing Issue #22 architecture and PR #24 ADR select Cloudflare Workers Static Assets + Hono API, reusing the existing graphite HTML/CSS/vanilla-JS dashboard. The first API is read-only and obtains public GitHub task/workflow evidence. It must not dispatch work, mutate tasks, become a task ledger, or claim that a runner is live.

The Pool runtime is a separate workstream: Supervisor/Worker lifecycle, task claims, durable task state, projection outbox and recovery authority. It remains gated by PR #37/#58/#59/#60 and Issues #1/#38. Do not provision a D1 task ledger as a prerequisite for serving static UI.

## 2. Mature-component reuse and current evidence

- PR #6 contains the static graphite dashboard prototype. It is a fixture-only UI, with no live API/authentication/telemetry. PR #6 is OPEN / DRAFT / UNMERGED. Workflow runs associated with its inspected head: #42108497862 and #42108498565, both COMPLETED / SUCCESS; no independent review or browser/device QA was demonstrated.
- PR #24 contains the hosting/trust-boundary ADR and Experience API v1 OpenAPI contract. It selects Workers Static Assets + Hono, retains vanilla JS rather than introducing a frontend rewrite, and specifies same-origin GET-only API routes. PR #24 is OPEN / DRAFT / UNMERGED. Workflow runs associated with inspected head: #42188894226 (OpenAPI validation) and #42188894227 (Pool Contract Validation), both COMPLETED / SUCCESS. These are contract checks, not implementation/deployment evidence.
- The ADR rejects GitHub Pages alone as a trusted API/control plane, ephemeral GitHub Actions runners as a persistent web host, and Open WebUI as the primary Jarvis console. Open WebUI remains a possible later model-experiment UI, not a replacement for Pool Bridge.
- Issue #22 requires HTTPS desktop/iPhone access, server-side authentication, live provenance-bearing data, fail-closed unknown states, no browser secrets, no browser-side dispatch, and security/browser QA before deployment.

## 3. Newly identified authentication-storage inconsistency

The ADR requires opaque server-side sessions with expiry and revocation, but also states that the first read-only console does not need a database. Those statements are not yet reconciled.

Workers KV is available on Free, with limits of 100,000 reads/day, 1,000 writes/day, 1,000 deletes/day and 1 GB storage. However, Cloudflare documents KV as eventually consistent: changes may take 60 seconds or more to propagate to other locations, and KV is not suitable for operations requiring atomicity or transactional read/write semantics. Therefore, KV alone cannot be treated as immediate global session revocation or a strict single-use/atomic session authority.

Potential design paths (not selected or implemented):
1. A dedicated, narrowly scoped D1 database for web-session records, separate from the Pool task ledger, with hashed opaque session identifiers, expiry/revocation fields and bounded reads/writes. This adds a database dependency to the web console and requires D1 consistency, migration, backup, binding isolation and quota tests.
2. A deliberately bounded stateless session design with short expiry and explicitly accepted non-immediate revocation semantics. This would require changing the current ADR security contract and independently reviewing the residual risk; it must not be silently substituted.
3. Another mature session-store primitive only if its Free entitlement, consistency, revocation and cost properties are demonstrated.

Do not provision KV or D1 before selecting and testing one of these paths. A Workers KV namespace must not be created simply because it is free.

## 4. Free-only quota implications

Official Cloudflare documentation checked 2026-11-11:
- Workers Free: 100,000 requests/day, 10 ms CPU/invocation, 128 MB memory, 50 subrequests/request, 5 Cron Triggers/account, 20,000 static files/Worker version, 25 MiB per file.
- Workers KV Free: 100,000 reads/day; 1,000 writes/day; 1,000 deletes/day; 1,000 list requests/day; 1 GB storage. Limits reset daily at 00:00 UTC; exceeding an operation limit causes further operations of that type to fail.
- Workers KV consistency: eventual; old values can remain visible for 60 seconds or longer depending on cache TTL.

The read-only Experience API should use bounded GitHub API aggregation, ETags/cache, bounded response sizes, backoff on 403/429, and no tight polling. It should return UNKNOWN/UNAVAILABLE with provenance when data is absent. Free quota exhaustion must produce an explicit degraded state; no paid fallback or overage.

## 5. Account and governance snapshot

- Owner supplied plan label: Free. Treat as owner-reported operational input, not independent billing API verification; billing API scope remains unavailable.
- Fresh Cloudflare read-only inventory: D1 databases `[]`; Worker scripts `[]`; `default_usage_model=standard` is not plan evidence. No resource creation/deployment performed.
- PR #37, #58, #59 and #60 remain OPEN / DRAFT / UNMERGED at inspection. PR #60 recovery authority is design-only; current head was `94c41364d50c2746c1e72874701637ea3ec54def`. PR #60 exact-head workflow/review evidence was not established in this audit.
- Issue #1 governance, Issue #22 web console, and Issue #38 durable task claims remain open.
- Dispatch remains FAIL-CLOSED. No task dispatch, provider/model call, secrets access, migration, resource provisioning or deployment.

## 6. Required next bounded step

Revise the Issue #22 ADR/session design to make an explicit choice between (a) a dedicated Free D1 session store with exact isolation and consistency proof, or (b) a stateless short-lived session model with a clearly accepted revocation limitation. Then define the first deployable slice as static assets + Hono GET-only API + server-side GitHub OAuth/session boundary. Keep the Pool D1 ledger, Supervisor and dispatch out of this first web-console deployment. Run exact-head auth-negative tests, OpenAPI validation, browser smoke tests and independent security review before any deployment.

## Evidence links

- Issue #22: https://github.com/VlDMlNSh/developer-cloud-pool/issues/22
- PR #24: https://github.com/VlDMlNSh/developer-cloud-pool/pull/24
- PR #6: https://github.com/VlDMlNSh/developer-cloud-pool/pull/6
- PR #37: https://github.com/VlDMlNSh/developer-cloud-pool/pull/37
- PR #58: https://github.com/VlDMlNSh/developer-cloud-pool/pull/58
- PR #59: https://github.com/VlDMlNSh/developer-cloud-pool/pull/59
- PR #60: https://github.com/VlDMlNSh/developer-cloud-pool/pull/60
- Cloudflare Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- Cloudflare Workers KV limits: https://developers.cloudflare.com/kv/platform/limits/
- Cloudflare KV consistency: https://developers.cloudflare.com/kv/concepts/how-kv-works/
- Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
