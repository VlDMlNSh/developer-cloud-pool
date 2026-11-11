# PR #58 Projection Reconciler — Exact-Head and Reuse-First Recheck — 2026-11-11

## Scope and immutable targets

Bounded static review only. No source changes, no package installation, no tests run locally, no real GitHub API mutations, no dispatch, no secrets, no deployment.
- PR #58 head: `6f7953e4abec3cc564984ee3635cdb7717ae5d5e`
- PR #58 base: `ec3f3266ca28c4fb5633a9475cc6f396a4677974`
- PR #59 head: `22200226da4f1af30645cf441a639db6893e9310`, stacked on PR #58.
- PR #60 head: `234fb2ee40265e26fac00c69ac1b6192766602cb`.
- Repository default branch `Основной` HEAD observed: `6fdcedebeba62715122e43a75c6ad6d926321ce7`.
- Canonical project context branch: `docs/cross-chat-continuation-2026-11-06`, HEAD `240621564074ea45de08d35f6cf04c343995a54b`.

## Current PR, CI, review and governance evidence

- PR #58 OPEN / DRAFT / UNMERGED. Exact-head run `42979949181` COMPLETED / SUCCESS. No formal reviews; no inline review threads.
- PR #59 OPEN / DRAFT / UNMERGED. Exact-head run `42981807825` COMPLETED / SUCCESS. No formal reviews; no inline review threads.
- PR #60 OPEN / DRAFT / UNMERGED. Exact-head workflow query returned no runs: CI NOT VERIFIED.
- PR #61 OPEN / DRAFT / UNMERGED. Exact-head run `42991794791` COMPLETED / SUCCESS.
- Active default-branch Ruleset `Основной — verified`, ID `26550182`, exact selector `refs/heads/Основной`, enforcement active; PR required but approval count is 0, code-owner review disabled, thread resolution required. Classic branch-protection endpoint returned 403 to this integration and is NOT VERIFIED. Do not interpret the Ruleset as independent review enforcement.
- Issue #1 remains OPEN; historical body records `POOL_DISPATCH_ENABLED=false`, but its recorded variable readback is dated 2026-11-04 and was not freshly queried in this pass. Dispatch gate live value: NOT REVERIFIED. No dispatch was attempted.
- Issue #38 remains OPEN and labelled security/governance.
- Open PR inventory refreshed: #61–#58 and earlier draft stack remain open; no merge/acceptance of Contour A.

## Mature component search — before considering custom code

Checked maintained GitHub projects:
- [octokit/plugin-retry.js](https://github.com/octokit/plugin-retry.js), immutable README blob `34c5c76be0091ca50f3a428ff8b0c388ee8479db`: mature HTTP request retry plugin; retries selected HTTP 4xx/5xx except documented non-retry statuses. Useful for transport failures only; does not create durable per-event retry budgets or guarantee idempotent comment POST.
- [octokit/plugin-throttling.js](https://github.com/octokit/plugin-throttling.js), immutable README blob `b0b87c7aac8965c1807ed48985f827741ac0b961`: mature GitHub rate-limit/secondary-rate-limit handling. Useful if/when a real Octokit client is approved; not a comment idempotency or outbox authority solution.
- [actions/github-script](https://github.com/actions/github-script), immutable README blob `bbae14e0c51ff43ec7481124f94d151a4e0ab266`: provides authenticated Octokit in Actions, but README reports contributions are not currently accepted; it is a scripting wrapper, not durable delivery state.
- [probot/probot](https://github.com/probot/probot), immutable README blob `4360a1dcb4ee35d6e47406175cc42c8a280a27df`: established GitHub App framework with granular app permissions and webhooks; requires a GitHub App actor/hosting boundary, not compatible as an unapproved drop-in for the present GitHub Actions-only fake proof.
- [octokit/rest.js](https://github.com/octokit/rest.js): mature REST client; transport/API client only.

Reuse decision: do not build a custom HTTP retry/throttling stack if an approved real sender later uses Octokit. However, none of these libraries supplies the durable D1 attempt/generation authority, event-digest binding, delayed-visibility reconciliation, one-use recovery grant, or canonical issue lifecycle contract. No dependency was added; the current fake adapter has no real HTTP client to replace.

## Source recheck: prior F-01 / F-02 / F-03 remain

PR #58 source blob `2f83befc145d39ea60f06fe5b9e9033f89df40c0`; tests blob `76b144bd067a42455b858345abec5ee3580c8ccf`.

### F-01 — retry permission remains caller-controlled

- `reconcileTerminalProjection(..., { allowPost = false })` still accepts a plain boolean.
- If marker is absent and `allowPost=true`, it can POST without proving a current durable D1 delivery lease.
- The delayed-visibility test proves a single later reconciliation-only pass (`allowPost=false`) and then manually makes the marker visible. It does not test a second delivery attempt after cooldown while the original marker remains delayed.
- PR #59 already adds durable D1 delivery leases, monotonic attempt counts, five-attempt cap, 30/60/120/240s backoff and terminal dead-letter state. This is reusable existing work, not a reason to build another retry engine.
- But PR #59's `acquireProjectionDelivery` / `markProjectionRetryable` state machine is not wired into PR #58's comment POST gate. A durable lease and a plain caller boolean are still separate contracts.
- Next design must bind the exact outbox row, repository, issue, attempt, target SHA, terminal outcome, event digest, lease owner, delivery generation, lease expiry and attempt budget to authorization before any POST. A stale/mismatched lease must fail closed. Document the unavoidable at-least-once ambiguity of GitHub comment POST; do not claim exactly-once.

### F-02 — prefix-wide deletion remains

- Source still selects every label beginning `pool:` and removes all except the desired set.
- PR #37's draft Worker contract contains a narrower lifecycle list: `pool:ready`, `pool:claimed`, `pool:probe-complete`, `pool:needs-review`, `pool:invalid`. Its finalizer removes only those states.
- PR #37 is OPEN / DRAFT / NOT ACCEPTED, so its list is useful evidence but not yet an authoritative accepted contract. PR #58 currently allows `pool:completed` and `pool:failed`, which are not in that PR #37 managed-state list.
- Do not silently choose one vocabulary. Before code changes, reconcile the terminal projection's exact label ownership with the canonical accepted Worker lifecycle contract. At minimum, labels outside an explicit finite ownership set must be preserved, even if their prefix is `pool:`.

### F-03 — terminal label cardinality remains

- `validateEnvelope` still accepts 1–3 distinct managed labels.
- Outcome validation permits multiple success labels or multiple failure/abandoned labels.
- PR #37's finalizer emits exactly one terminal label (`pool:probe-complete` or `pool:needs-review`) and enforces one managed state before Worker execution. But this is still a draft contract and must be reconciled before adopting it.
- Require exactly one canonical terminal label per projection event once the authoritative outcome-to-label mapping is approved. Add negative tests for zero, two, and three labels.

## Decision

- No suitable mature GitHub library replaces the domain-specific D1 outbox/reconciler. Reuse Octokit retry/throttling if a real API client is later approved; do not implement those generic transport features from scratch.
- PR #59's durable D1 retry state machine is already the project-owned durable retry proof; do not create a second retry counter or scheduler.
- PR #58 is NOT READY for qualification: F-01/F-02/F-03 remain in source.
- Do not amend PR #58 until the label lifecycle contract and the exact PR #59 lease-to-POST integration contract are made consistent. This avoids a premature change that would invalidate PR #59's stacked base or encode draft lifecycle semantics as accepted.
- No source/package/workflow/secret/permission changes, no merge, no external API mutation, no deployment, no dispatch.

## Status and next action

- Component discovery: COMPLETED for this pass.
- Octokit retry/throttling reuse: identified, NOT ADOPTED (no live client in scope).
- F-01: OPEN; PR #59 durable state exists but is NOT WIRED to POST authorization.
- F-02: OPEN; finite ownership vocabulary not accepted.
- F-03: OPEN; one-label mapping not accepted.
- PR #58 exact-head CI: VERIFIED (local fake boundary only); protocol qualification INCOMPLETE.
- PR #59 exact-head CI: VERIFIED (local Workers-runtime D1 only); independent recovery NOT QUALIFIED.
- PR #60 exact-head CI: NOT VERIFIED; issuer/trusted-time implementation NOT IMPLEMENTED.
- Dispatch: NOT RUN; current live variable not freshly reverified.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Next bounded step: extract the canonical accepted lifecycle-label contract and PR #59-to-PR #58 delivery authorization interface from the controlling Worker/governance contracts; then make one minimal stacked change with adversarial tests. Keep fake/local, no live GitHub writes, no secrets, and `dispatch:false`.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
