# Reusable GitHub components assessment — durable orchestration

Date: 2026-11-08
Status: INITIAL MARKET SCAN COMPLETE / CANDIDATE SHORTLISTED / NO ADOPTION OR DEPLOYMENT

## Decision rule

For every Contour A subsystem, search for maintained, tested, documented, license-compatible projects and managed platform primitives before writing new code. Prefer adopting a mature component over recreating its functionality. Build only MediaHub-specific policy, adapters and missing contracts. Re-run this assessment when requirements or provider limits change.

This scan focuses on the current next gap: durable orchestration and indeterminate-attempt reconciliation. It is not a complete audit of every Contour A subsystem.

## GitHub candidates inspected

Metadata sampled 2026-11-08; repository activity and README claims are not substitutes for security, license, compatibility or operational qualification.

| Project | Evidence | Fit / constraints |
|---|---|---|
| Cloudflare Workers SDK / Workflows | https://github.com/cloudflare/workers-sdk; Apache-2.0 repo, active 2026-11-08. Official docs say Workflows is available on Free and Paid Workers plans; durable multi-step execution, persisted state, retries, pauses and observability. | **Best first prototype candidate** because the current proof already targets Cloudflare Workers + D1 and avoids adding a separate orchestration cluster. Workflows billing dimensions include CPU, requests, storage and steps; step/storage charges apply from 2026-08-10. Free-plan limits apply. Workflows is not deployable to Workers for Platforms namespaces. Must not replace D1's authorization/audit ledger or trusted issuer checks. |
| Restate | https://github.com/restatedev/restate; active 2026-11-06; TypeScript SDK linked from upstream README. Upstream site describes durable execution, queues, virtual objects and self-hosting as a single binary. | Strong technical fit for durable services, stateful actors and queues. Core runtime licensing is BSL (upstream site); do not assume OSI/open-source-compatible terms. Adds a separate runtime and operational boundary; compatibility with our exact free GitHub/Cloudflare deployment path not proven. |
| Temporal TypeScript SDK | https://github.com/temporalio/sdk-typescript; MIT SDK, active 2026-11-06. README says Cloudflare Workers client may work but is not regularly tested; official support focuses Node 20/22/24. | Mature, capable workflow engine. Requires a production Temporal Service (self-hosted or managed) plus application Workers; self-hosting introduces database, operations and infrastructure burden. Not the lowest-complexity free-infrastructure choice for this stage. |
| Inngest | https://github.com/inngest/inngest; active 2026-11-08. README describes durable functions, concurrency/flow control, retries and self-hosting. | Potential alternative. Repository API did not provide a machine-detected license identifier; license and exact self-host/Cloudflare constraints need separate verification before adoption. |
| Trigger.dev | https://github.com/triggerdotdev/trigger.dev; Apache-2.0, active 2026-11-03. README describes durable tasks, retries, queues, idempotency and self-hosting. | Strong candidate for AI/task execution and observability, but introduces its own platform/runtime and deployment/operations requirements. Need exact free self-host resource budget and Cloudflare integration verification before selection. |

## Recommended architecture direction (not yet adopted)

1. Keep the D1 Task/Attempt/Lease ledger as the authority for immutable identities, capability checks, evidence digests, fencing and append-only audit.
2. Evaluate Cloudflare Workflows as the orchestration/recovery mechanism around that ledger, because it is native to the existing Workers/D1 target and officially offered on Free and Paid Workers plans.
3. Prototype only after checking current account plan limits, billing dimensions, workflow retries/step semantics, retention, concurrency, idempotency and deployment compatibility.
4. A Workflow retry must never itself authorize a second provider/model side effect. Every transition must consult the D1 authority ledger and preserve the no-blind-retry rule.
5. Keep Restate / Temporal / Inngest / Trigger.dev as alternatives if Cloudflare Workflows fails a measured requirement.

## Explicitly not concluded

- No external candidate has been adopted, installed, deployed or production-qualified.
- This scan does not prove Cloudflare Workflows meets every Contour A requirement.
- A durable orchestration engine does not provide the trusted reconciliation issuer, authorization contract or evidence semantics automatically.
- Existing PR #49–#51 D1 proofs remain isolated proof code; do not discard or merge them on the strength of this scan.

## Current repository evidence

- PR #37 OPEN/DRAFT at `1be8672c1be1a720b6c813dcafff5c020b6456ae`; Supervisor/Worker integration gap remains.
- PR #40 OPEN/DRAFT at `2b7e30aeb8c404d84b2fe8bc16520aaa783520fb`.
- PR #49 OPEN/DRAFT at `4ab0fdc4d649736a171faf95b9ab3a24b17217e8`.
- PR #50 OPEN/DRAFT at `6e6870e5463f3f67e87a305112b208401d95022d`.
- PR #51 OPEN/DRAFT at `4d83a77c3d97dccdac8f87ad0fda9182d4fd3ee7`; exact-head CI run 42495716401 SUCCESS, 35/35 tests. PR #49–#51 have no submitted reviews in this inspection; independent review NOT RUN.
- PR #37 metadata reported mergeable=false at inspection; do not merge.
- No dispatch, remote D1, provider/model calls, secret access or deployment in this pass.

## Next bounded step

Inspect the current Cloudflare Workflows SDK/docs contracts and build a minimal local Workers-runtime compatibility spike that exercises: durable step replay, pause/resume, idempotent D1 ledger interaction and failure/retry boundaries. Compare results against free-plan limits and the current Task/Attempt state machine. No provider calls, dispatch, production secrets or deployment.

Contour A remains BLOCKED / NOT ACCEPTED. Contour B remains DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
