# Mature GitHub Component Reuse Review — Projection Recovery / Retry — 2026-11-11

## Scope and immutable project targets

Read-only component discovery for the next planned PR #58 protocol hardening pass.
- PR #58 head: `6f7953e4abec3cc564984ee3635cdb7717ae5d5e`; base PR #54 head `ec3f3266ca28c4fb5633a9475cc6f396a4677974`.
- PR #59 head: `22200226da4f1af30645cf441a639db6893e9310`.
- No repository source changes, deployment, credentials, external provider calls or hosted resource provisioning.

## Search inventory

GitHub repository search and official vendor documentation were checked for transactional outbox, D1/Workers-compatible queues, durable workflow execution, idempotency and retry orchestration.

### Reusable projects reviewed

1. [dotnetcore/CAP](https://github.com/dotnetcore/CAP) — established .NET event bus / outbox-style project; not directly reusable in this JavaScript/TypeScript Workers + D1 + GitHub Actions codebase without introducing a .NET service/runtime.
2. [dtm-labs/dtm](https://github.com/dtm-labs/dtm) — distributed transaction manager; a separate service and transaction model, not a drop-in D1 outbox/reconciler. Additional runtime/operations and infrastructure would conflict with current minimal free-GitHub-first contour unless explicitly qualified.
3. [Azure-Samples/transactional-outbox-pattern](https://github.com/Azure-Samples/transactional-outbox-pattern) and [aws-samples/transactional-outbox-pattern](https://github.com/aws-samples/transactional-outbox-pattern) — reference implementations/pattern demonstrations, not a ready-made Cloudflare D1 + GitHub Issues terminal projection adapter.
4. [cloudflare/workers-sdk](https://github.com/cloudflare/workers-sdk) — official, active Workers tooling repository. Search identified first-party Workflow fixtures, Vitest examples, and Queues runtime/Miniflare implementation. Relevant code is tied to an immutable SDK commit in the search results: `877b249292307ae4dd282080e68b1d88c0fd0bb0`.
5. [inngest/inngest](https://github.com/inngest/inngest) and [restatedev/restate](https://github.com/restatedev/restate) — durable execution products/platforms worth considering for a future provider-neutral evaluation, but no evidence from this pass establishes a free, self-hosting-compatible and approved GitHub-only deployment path for this pool.

### First-party Cloudflare primitives (managed services, not GitHub libraries)

- [Cloudflare Workflows overview](https://developers.cloudflare.com/workflows/): available on Free and Paid plans; durable multi-step execution, persisted step state, automatic retries, sleeps and external-event waits. Official rules require idempotent API/binding calls because steps can retry; deterministic step names are important. Official retry defaults documented as 5 attempts with exponential backoff; per-step retry configuration is available.
- [Cloudflare Workflows rules](https://developers.cloudflare.com/workflows/build/rules-of-workflows/): steps should be granular; state outside a step may be lost on hibernation; side effects outside `step.do` may repeat.
- [Cloudflare Queues overview](https://developers.cloudflare.com/queues/): available on Free and Paid; supports retries, delays and dead-letter queues; delivery is at-least-once, not exactly-once.
- [Cloudflare Queues pricing](https://developers.cloudflare.com/queues/platform/pricing/): Free includes 10,000 operations/day; Free message retention is 24 hours. Each message commonly costs write + read + delete, and each retry adds a read.
- [Cloudflare Queues limits](https://developers.cloudflare.com/queues/platform/limits/): maximum message retries 100; message retention up to 14 days on Paid but fixed at 24 hours on Free.

## Fit assessment

| Candidate | Reuse decision | Reason |
|---|---|---|
| CAP | NOT FIT | .NET stack; adds a new runtime/service for a JS Workers/D1 proof |
| DTM | NOT FIT FOR CURRENT CONTOUR | Separate transaction manager; no demonstrated D1/GitHub projection fit or free GitHub-hosted operation |
| Azure/AWS samples | REFERENCE ONLY | Pattern examples, not compatible ready-to-integrate component |
| Cloudflare Workflows | FUTURE CONDITIONAL CANDIDATE | Strong fit for durable retry/sleep orchestration if Cloudflare runtime is explicitly approved; not a substitute for issuer, grant validation, exact resource binding, or idempotent GitHub side effects |
| Cloudflare Queues | FUTURE CONDITIONAL CANDIDATE | Could transport notifications, but at-least-once delivery and 24h free retention mean it cannot replace durable D1 outbox, replay controls or idempotent reconciliation |
| Inngest / Restate | NOT ADOPTED | Requires separate free-tier/self-hosting, governance, operational and deployment qualification; no basis to add another platform now |

## Decision

No mature GitHub project found in this search is a drop-in replacement for the current D1 projection outbox plus fake GitHub reconciler under the project's GitHub-free-first and least-authority constraints.

Do not build a generic workflow engine or message queue. Keep the existing narrow local proof only while correcting its three identified contract gaps. Before implementing retry/cooldown, first determine whether native Cloudflare Workflows/Queues are allowed and economically/operationally acceptable for the eventual runtime; do not introduce either implicitly. The free-tier availability is not proof that the project is authorized to use an external hosted dependency.

Most importantly:
- Workflow retries do not make GitHub side effects exactly-once.
- A queue's at-least-once delivery does not replace event deduplication or one-use authority.
- Neither Workflows nor Queues provides the missing Security Issuer Authority, trusted-time authority, revocation governance, or Recovery Actor identity.
- Existing D1 state remains the candidate durable source of truth; any transport remains subordinate to it.

## Status and next step

- Component discovery: COMPLETED for this bounded pass.
- Reusable drop-in component: NOT FOUND.
- Cloudflare Workflows/Queues: EVALUATE ONLY; NOT ADOPTED / NOT PROVISIONED.
- PR #58 hardening: PLANNED; no source implementation performed.
- PR #60 issuer/trusted-time prerequisite: unresolved.
- Dispatch: keep fail-closed.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Next bounded action: update the PR #58 design/tests only after the runtime boundary decision is explicit. If the project remains GitHub-only, implement only the minimal protocol controls in the existing proof; if Cloudflare becomes an approved runtime, first run a compatibility and free-quota proof using synthetic data, with no provider secrets or real GitHub writes.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
