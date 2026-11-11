# Supervisor cron and D1 recovery architecture audit — 2026-11-11

## Immutable repository snapshot
- Default branch: `Основной`.
- Default HEAD: `864213e2ff5b4fa956ba405dea8137a44d812f49` (commit date 2026-11-08T15:37:49Z).
- Default-HEAD workflow-run lookup returned an empty list; current CI status for this HEAD is NOT VERIFIED.
- Repo Ruleset `26550182` is present and enforcement is active for `refs/heads/Основной`.
- Ruleset requires PRs but `required_approving_review_count=0`; CODEOWNERS review is disabled; review-thread resolution is enabled; bypass actors empty; current-user bypass never.
- Classic branch endpoint reports `protected:false`; this is distinct from the active repository ruleset and must not be misreported as absence of all governance.
- Issue #1 records `POOL_DISPATCH_ENABLED=false` read-back on 2026-11-04. Current variable value could not be freshly read through available GitHub read actions; current value is NOT VERIFIED.

## Existing Supervisor schedule — verified from default branch
- `.github/workflows/pool-supervisor.yml` blob `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`.
- Schedule: `3,8,13,18,23,28,33,38,43,48,53,58 * * * *` (every five minutes).
- Workflow also listens for issue lifecycle events and Pool Worker completion.
- `scripts/pool-supervisor.mjs` blob `52bf03ca889edd92fd10c71ae96a2e35e106d43f`.
- Existing supervisor code returns heartbeat-only before GitHub issue operations when `POOL_DISPATCH_ENABLED` is not literal `true`.
- Existing issue-claim recovery inspects up to 100 `pool:claimed` issues and up to 100 Pool Worker workflow runs; terminal runs move claims to `pool:needs-review`; claims with no matching run older than 15 minutes return to `pool:ready` with an audit comment. This is GitHub Issue label/workflow-run recovery, not D1 projection outbox recovery.
- Workflow permissions include `contents: read`, `issues: write`, `actions: write`; these are broader than a read-only D1 outbox poller needs and must not be inherited by a new recovery component without a separate least-privilege review.

## Candidate Supervisor branch — not accepted
- Branch `feat/reusable-pool-worker-boundary-2026-11-06` HEAD `1be8672c1be1a720b6c813dcafff5c020b6456ae`.
- PR #37 remains OPEN / DRAFT / UNMERGED.
- Its revised Supervisor removes `workflow_run`, `actions: write`, and REST workflow-dispatch; it processes one task and uses a reusable `workflow_call` Worker. It does not contain D1 projection recovery.
- Candidate workflow blob `4a176e5ebb3cf1e7ef29b00164498e34a4f9fafc`; candidate supervisor script blob `2d0611851ff738b2aeb377f464e5fa7d821f3696`.
- The candidate's five-minute cron could be a future scheduling trigger, but it is unmerged and cannot be treated as active default-branch behavior.

## D1 proof deployment boundary
- `proofs/d1-ledger/package.json` blob `26b52ef60613366eaca02191b2d28901415cea5a` defines only local Vitest/check scripts and Cloudflare Vitest plugin.
- `proofs/d1-ledger/wrangler.jsonc` blob `eb683b6bb838cb7a48741f900de6c17be7fdc0fe` uses a zero UUID database ID and explicitly names a proof database; this is not a deployable hosted D1 binding.
- Migration `0007_bound_projection_delivery_retries.sql` labels itself local proof only.
- The local D1 package has no evidence here of a deployed Worker, hosted D1 database, live binding, Cron Trigger, Queue consumer, or production migration application.
- `projection-reconciler.mjs` blob `2f83befc145d39ea60f06fe5b9e9033f89df40c0` does not invoke `deadLetterExpiredProjection()`.

## Architecture decision (bounded)
1. Do not add D1 access to the GitHub Actions Supervisor job. GitHub-hosted runners are ephemeral; the existing job has no D1 binding, and introducing a D1 credential/API path would expand the trust boundary and require new secret handling.
2. Preferred future design, conditional on free-plan entitlement and governance verification: a dedicated Cloudflare Worker bound to hosted D1, using a Cloudflare Cron Trigger to poll a bounded batch of due outbox rows and invoke generation-fenced lease recovery. Keep it separate from task dispatch and GitHub issue intake. It must have only D1 access plus narrowly scoped GitHub projection capability, no task-dispatch authority.
3. GitHub Supervisor's existing five-minute schedule may remain an independent health/coordination signal, but should not be the D1 data-plane poller.
4. Before implementation: verify Cloudflare Workers/D1 free entitlements and quotas, exact account/database identity, deployment and migration process, worker scheduling support, secret isolation, and whether GitHub projection writes can be isolated behind a minimal capability. If no free eligible hosted D1 route exists, keep recovery local proof only and dispatch disabled; no paid fallback.
5. Tests required: bounded due-row batch, concurrent pollers, generation fencing, lease expiry recovery, worker interruption between lease and transition, idempotent repeat, retry budget, append-only audit, GitHub API ambiguous response reconciliation, and no path from recovery into dispatch.

## Governance and issue state
- Issue #1 remains open; its latest body records Ruleset zero required approvals and dispatch disabled at the 2026-11-04 snapshot. Current variable value is NOT VERIFIED in this pass.
- Issue #38 remains open; durable single-use claim protocol is PLANNED / NOT IMPLEMENTED / NOT QUALIFIED.
- Issue #22 remains open; secure web console architecture candidate is NOT APPROVED / NOT DEPLOYED / NOT QUALIFIED.
- PR #37, #58, and #59 remain OPEN / DRAFT / UNMERGED (PR #59 head `5c47cda4394d0381315bc16182799a09bf861797`; PR #58 head `6f7953e4abec3cc564984ee3635cdb7717ae5d5e`).
- No secret values read; no dispatch, worker execution, model calls, deployment, or merge performed.

## Status
- Existing five-minute Supervisor cron: VERIFIED in default-branch source.
- Existing GitHub Issue stale-claim recovery: VERIFIED in default-branch source, subject to current workflow execution not verified.
- D1 projection recovery integration: NOT IMPLEMENTED / NOT VERIFIED.
- Hosted D1 / Cron Trigger: NOT VERIFIED.
- Current default-HEAD CI: NOT VERIFIED (empty workflow-run lookup).
- Contour A: BLOCKED / NOT ACCEPTED. Contour B remains deferred.

## Next bounded step
Inspect the connected Cloudflare account's non-secret product/resource metadata and free entitlement evidence. If the free D1 + Workers Cron path is verifiable, draft the smallest isolated Worker architecture and contract; otherwise document the no-cost fallback boundary without deploying or enabling dispatch.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
