# Contour A broad execution plan and legacy dispatch retirement — 2026-11-18

## Owner direction
Independent/external reviews are deferred until the pool is operational enough to perform its own bounded review workflow. No new independent review requests are to be issued during this phase. Current exact-head CI, deterministic tests, source inspection and evidence checks continue; they are not to be mislabeled as independent review or final acceptance.

## Baseline recovered
- Repository default branch: `Основной`.
- Immutable default HEAD: `35208f0ef28f0ac031a7acdf35fc90ccc9b16845`.
- Active ruleset: `26550182`, PR required, review-thread resolution required, zero required approvals, no bypass actors.
- The scheduled `Pool Supervisor` run [44272871545](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44272871545) was SUCCESS but only printed `POOL_DISPATCH_ENABLED: false` and a heartbeat-only message. This is not evidence of an operational pool.
- Default-branch supervisor code still contained a legacy label-driven DSH dispatch path gated only by `POOL_DISPATCH_ENABLED=true`; it could mutate labels and invoke the old DSH worker if the variable were enabled.
- The legacy DSH worker accepted manual `workflow_dispatch`, read issue state with a token and ran DSH. This is not the owner-frozen first CODE executor architecture.
- PR #116: current exact head `754f42b0b7fa84c73e90cececc6f3d8a65877fab`; no-secret Claude Code/ECC/FCC installation and synthetic handoff passed CI, but no provider route/account/quota or live task was qualified.
- PR #114: local Workers-runtime D1 atomic admission proof; head `ab9461eb84b14fe230918391d5212f19ca25592c`; no hosted D1 or live controller.
- PR #125: local GitHub Actions context-to-D1 composition proof; head `69398d497c8e9be3e9fe7241e4dc6d3bc2e4c973`; exact proof CI SUCCESS. It still allowlists legacy `dsh-headless-probe`, and the referenced `cloud-pool-next-controller.yml` is not on the default branch. This is not a deployed controller.
- PR #112: read-only owner-event envelope proof; head `c9a4c0ab2001f01a09632795283071c521e1c99d`; exact-head CI SUCCESS, but not durable admission.
- PR #120: canonical reference architecture documentation consolidation, open/draft/unmerged; not runtime evidence.
- Issue #118: persistent Engineering Workspace remains blocked (no active authorized server #3, no confirmed Access/Tunnel, no backup/restore evidence).

## Critical discrepancy and action in this pass
The default-branch supervisor was a dormant legacy DSH dispatcher, not the D1-backed, owner-approved CODE executor described by the frozen architecture. The repository variable currently keeps it inactive, but enabling that variable would revive a path that bypasses the new D1 admission contract.

This pass retires that path in a proposed PR:
1. Replace the legacy supervisor script with a heartbeat-only fail-closed guard. If the old dispatch variable is ever set to literal `true`, the workflow fails loudly instead of dispatching.
2. Remove `issues:write` and `actions:write` permissions, remove the job-scoped GitHub token, and remove issue/workflow-run/manual dispatch triggers from the legacy supervisor. Retain only the scheduled read-only heartbeat.
3. Replace the legacy DSH worker with an inert manual guard that immediately fails and has no token, checkout, external action, runtime installation, or task inputs.
4. Strengthen Pool Contract Validation to enforce these retirement invariants.
5. Keep the separate no-secret DSH evaluation workflow as a manual, read-only experiment only; it is not a production worker profile.

## Broad, dependency-ordered Contour A plan

### P0 — Retire unsafe/obsolete paths (current pass)
- Ensure the legacy DSH label queue cannot dispatch even if an old variable is accidentally enabled.
- Remove unnecessary write permissions and credential exposure from the retired supervisor.
- Make the old DSH worker inert.
- Verify exact-head CI and publish a dated report.
**Exit:** no legacy label-driven or manual DSH execution path remains active.

### P1 — Qualify the first CODE executor
- Finish PR #116's no-secret installation/runtime qualification and keep the profile isolated.
- Verify trusted PATH directory ownership, HOME/XDG credential search surfaces, installer/binary integrity provenance, and actual egress restrictions.
- Confirm Claude Code hosted-use permissions and ECC/FCC license obligations before any network-exposed or provider-authenticated runtime.
- Do not inspect secret values. Use only metadata-free synthetic tests and approved runtime interfaces.
**Exit:** pinned executable provenance and isolation controls verified; hosted-use and license boundaries cleared.

### P2 — Qualify one free provider route
- Select only an explicitly allowlisted route compatible with the FCC/Claude Code contract.
- Establish account identity, issuer, quota domain, reset semantics, rate limits, free-tier eligibility and cost class without exposing key values.
- Keep one credential handle/account per isolated profile. No cross-account fallback, key cycling, paid fallback or quota-domain merging.
- First live provider smoke must be narrowly bounded and separately authorized; no live call is part of this pass.
**Exit:** one route/account/quota tuple is evidence-backed and can be reserved/settled safely.

### P3 — Finish A0/D1 admission and task authority
- Reconcile PR #112 event validation with PR #114 atomic D1 receipt/approval/task/outbox and PR #125 GitHub Actions context binding.
- Replace the legacy DSH profile in the admission allowlist with the owner-frozen CODE profile only after P1/P2 qualification; do not admit tasks for an unqualified executor.
- Add the actual trusted default-branch `issue_comment` controller workflow. GitHub documents that this event uses the default branch SHA/ref and the workflow file must exist on the default branch; a PR-only workflow cannot receive the live event.
- Bind source comment ID, repository/owner IDs, workflow ref/SHA, run ID/attempt and target SHA. Independently re-read relevant GitHub state via the least-privilege token before admission.
- Provision a real hosted D1 database only after the local proof, migration, free-tier and data-retention checks pass. Seed one-shot approval through an owner-only, envelope-bound path.
**Exit:** live exact-owner `/next` on Issue #96 yields one durable receipt and one task/outbox; replay, stale SHA and ambiguous outcomes reconcile without duplicate tasks. Dispatch remains disabled until lease/worker gates pass.

### P4 — Lease, worker, outbox and recovery
- Implement atomic claim, lease expiry/renewal, fencing token, attempt ledger, cancellation and idempotent finalization.
- Deliver outbox entries with durable deduplication and reconcile ambiguous GitHub dispatch responses before retry.
- Worker receives one immutable task envelope, no authority to alter admission/approval/quota, and only the one qualified profile's required secret handle.
- Verify bounded workspace paths, commands, egress, time, disk/RAM and output limits.
- Publish result branch/PR/artifact with exact SHA, attempt identity and digests; recover failures without blind retries.
**Exit:** repeated multi-wave qualification demonstrates no duplicate execution, stale worker mutation, cross-account fallback or lost task state.

### P5 — Jarvis Web Experience
- Reuse the existing UI prototype and mature components; do not build a new agent framework or IDE.
- Start with an authenticated read-only status view: tasks, exact SHAs, workflow/job state, evidence, health and timestamps. Render UNKNOWN/UNAVAILABLE instead of invented telemetry.
- Static hosting may serve assets only. Browser must never receive PATs, App private keys, provider keys or privileged workflow tokens.
- Add server-side session/auth/API only after a no-cost, persistent backend is verified. Do not treat Actions runners or GitHub Pages as a persistent API server.
- Add mobile/desktop browser smoke tests and accessibility checks.
**Exit:** phone and desktop can securely view real pool state; control mutations remain disabled until authorization/dispatch acceptance.

### P6 — Persistent Engineering Workspace and operational acceptance
- Resolve Issue #118's host #3, owner authorization, Zero Trust, persistent storage, worktree isolation, backup/restore and free-cost blockers.
- Reuse a mature browser IDE such as code-server only after host, auth and marketplace constraints are qualified; no deployment to an unapproved host.
- Integrate desktop VS Code and browser workspace against one persistent filesystem with per-task worktrees, fenced leases and auditable cleanup.
- Qualify recovery, restore, observability, incident response, retention, resource budgets and repeated end-to-end operation.
**Exit:** all Contour A acceptance gates have immutable evidence; then owner accepts Contour A. Contour B remains prohibited before that point.

## Explicit non-goals
- No independent/external review request until the pool can perform its own review workflow.
- No production dispatch, provider call, secret read, paid fallback, Gemini dispatch, external server deployment or Contour B work in this pass.
- No merge is performed by this change; it remains a proposed safety patch pending exact-head CI and owner-controlled integration.

## Evidence and sources
- Scheduled supervisor heartbeat run: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44272871545
- PR #116 runner qualification: https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/44273710771
- PR #114 D1 atomic admission: https://github.com/VlDMlNSh/developer-cloud-pool/pull/114
- PR #125 GitHub Actions context proof: https://github.com/VlDMlNSh/developer-cloud-pool/pull/125
- PR #112 read-only event controller: https://github.com/VlDMlNSh/developer-cloud-pool/pull/112
- Issue #96 owner-only control surface: https://github.com/VlDMlNSh/developer-cloud-pool/issues/96
- Issue #118 persistent workspace: https://github.com/VlDMlNSh/developer-cloud-pool/issues/118
- GitHub issue_comment event semantics: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- Cloudflare SQLite Durable Objects storage reference (alternative for later comparison, not selected here): https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/
