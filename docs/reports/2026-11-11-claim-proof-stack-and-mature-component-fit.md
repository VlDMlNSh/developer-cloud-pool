# Claim proof stack and mature component fit — 2026-11-11

- Status: READ-ONLY SOURCE AUDIT / DESIGN FINDINGS; no code/runtime changes.
- Immutable default snapshot: `Основной@6fdcedebeba62715122e43a75c6ad6d926321ce7`.
- Scope: PR #54 claim/lease/attempt implementation, PR #37 dispatch boundary, and mature GitHub component reuse.
- Related qualification plan: [Contour A hosted D1 plan](../qualification/CONTOUR-A-HOSTED-D1-QUALIFICATION-PLAN.md).
- Related report: [Hosted D1 qualification boundary audit](2026-11-11-hosted-d1-qualification-boundary-audit.md).

## 1. Fresh GitHub state

- PR #37: OPEN / DRAFT / UNMERGED; head `1be8672c1be1a720b6c813dcafff5c020b6456ae`, base `197ba98d0dc7d8437d759dd25bee8750d02e59ae`. Compared with current default: 36 commits ahead / 19 behind, merge base `197ba98d0dc7d8437d759dd25bee8750d02e59ae`. Existing formal review is CHANGES_REQUESTED. Exact-head workflow runs `42484039940` and `42484039932` are SUCCESS; these are static/contract checks and do not prove live reusable Worker execution.
- PR #54: OPEN / DRAFT / UNMERGED; head `15a09c910f52553c59796260131a6b5a4a39c15f`, base `b9067dc7d06245893cd4e208f6215438efe5ca64`. Compared with current default: 132 commits ahead / 19 behind, merge base `197ba98d0dc7d8437d759dd25bee8750d02e59ae`. Exact-head local CI run `43010770730` is SUCCESS. The only formal review returned is COMMENTED, not APPROVED. This source stack is not integrated with current default.
- PR #64: OPEN / DRAFT / UNMERGED; final head `9949e857a0fd8d4ff9bc8836e4c511feac65c50b`, base current default `6fdcedebeba62715122e43a75c6ad6d926321ce7`. Compare: 12 commits ahead / 0 behind. Exact-head PR workflow query returned no runs; reviews = 0; inline threads = 0. CI remains NOT VERIFIED.
- Issue #38 remains OPEN. No hosted D1 or Worker resources exist in the connected Cloudflare account inventory; account-specific Workers Free eligibility remains NOT VERIFIED.

## 2. What PR #54 actually proves

The PR #54 source contains a 50-distinct-approval contention test in `proofs/d1-ledger/test/claim-outbox.test.ts`, which launches 50 concurrent calls to `claimLogicalTask(env.POOL_DB, ...)` and asserts one logical task, 50 approval attachments and one task-level delivery outbox. It is executed by the Workers Vitest test harness and the local CI run `43010770730`. It is **not** 50 independent HTTP requests to a remote hosted D1 service. The hosted plan correctly keeps this as local proof only.

The attempt proof also contains:
- immutable attempt identity and deterministic retry;
- lease generation increments and stale-owner rejection;
- indeterminate state rather than expiry-only blind takeover;
- terminal audit event and exact replay after simulated lost response;
- 50-way logical-task contention;
- projection outbox delivery fencing and append-only event history.

These are meaningful local proof increments. They do not authenticate the issuer, derive trusted time, prove production authority, or qualify remote D1, deployment or external side effects.

## 3. Source-level integration risks requiring resolution

### F1 — two overlapping lease APIs mutate the same task state

The stack exposes both:
- `src/task-lease.mjs`: `acquireTaskLease / renewTaskLease / finalizeTaskLease`;
- `src/task-attempts.mjs`: `acquireAttemptLease / renewAttemptLease / finalizeTaskAttempt`.

Both update `pool_tasks.state`, `lease_owner`, `lease_generation` and expiry. The attempt-aware path additionally binds `lease_attempt_id` to `current_attempt_id` and triggers attempt lifecycle/audit transitions. The legacy task lease path does not set `lease_attempt_id`.

Consequently, a task with a current attempt can be leased through the legacy function without establishing the attempt lease binding required by `finalizeTaskAttempt`; the attempt-aware finalizer then rejects it. Conversely, `finalizeTaskLease` can complete the task row without recording a terminal attempt result. Existing tests exercise both APIs on separate paths but do not prove a single canonical lifecycle or explicitly reject cross-API use.

Required before integration: choose one canonical attempt-aware lease lifecycle for tasks with attempts, deprecate/remove the overlapping legacy API or constrain it at schema/API level, and add negative cross-API tests. Do not deploy both as interchangeable production interfaces.

### F2 — resumability is a caller-supplied boolean

`acquireAttemptLease(..., { resumable = false })` permits expired-lease takeover when the caller passes `resumable: true`. The helper does not itself prove the old executor stopped, prove downstream idempotency, or authenticate who may assert resumability. The comment documents the precondition, but a boolean parameter is not an authority proof.

Required before production: derive resumability from a durable, authenticated reconciliation decision tied to the immutable attempt, generation and execution idempotency contract. The public Worker/API must not let a caller select `resumable=true` directly. If reconciliation evidence is absent or ambiguous, retain indeterminate state and deny takeover.

### F3 — trusted time and issuer remain outside the helper boundary

Lease/attempt methods accept `now` from their caller. The claim/consume path also accepts time and identity data as function arguments. This is acceptable only for deterministic local fixtures. A production adapter must inject trusted service time and derive actor/owner/repository/approval fields from authenticated, verified provenance. Caller-supplied timestamps or actor strings cannot authorize expiry, lease renewal or terminal attribution.

### F4 — projection outbox is not proof of exactly-once remote effects

The projection delivery lease and append-only event history prove local state transitions only. The external projection call may be accepted while its response is lost. Delivery must remain at-least-once with a stable idempotency key and authoritative remote reconciliation; do not claim exactly-once GitHub side effects. GitHub Issue labels/comments remain a projection, not the authoritative lock.

## 4. Mature component reuse assessment

The following public upstream repositories were inspected at their current default-branch README blobs:

| Upstream | Observed capability | Fit decision |
|---|---|---|
| [Cloudflare Workflows starter](https://github.com/cloudflare/workflows-starter) | Official Apache-2.0 starter for Cloudflare's durable execution engine on Workers | Strong candidate for long-running workflow orchestration if account product/plan and service fit are verified. It is a starter for a Cloudflare product, not a standalone OSS database/issuer; it does not replace the task-specific approval ledger or establish free eligibility. |
| [Cloudflare Actors](https://github.com/cloudflare/actors) | Official framework for Durable Objects; README explicitly says active development; offers SQLite persistence, migrations, alarms and retry utilities | Not selected as a mature default. Could be evaluated for per-task serialized actor state only if D1 cannot meet a proven requirement; DO free quota and account eligibility remain unverified. |
| [Trigger.dev](https://github.com/triggerdotdev/trigger.dev) | Apache-2.0 open-source durable task platform with queues, retries, observability and self-hosting path | Not a drop-in Cloudflare Workers/D1 component. Self-hosting introduces its own infrastructure and operational footprint; no evidence it satisfies the GitHub-free-infrastructure and no-paid-fallback constraints. |
| [Inngest](https://github.com/inngest/inngest) | Open-source durable functions with self-hosted server and Dev Server, concurrency controls and step execution | Mature alternative to bespoke general-purpose workflow orchestration, but adds a separate service and storage/deployment requirements. Not selected without a verified free-only hosting fit and an explicit architecture decision. |
| [Cloudflare Workers OAuth Provider](https://github.com/cloudflare/workers-oauth-provider) | OAuth 2.1 provider/resource-server framework for Workers, with KV binding and token validation | Candidate for the OAuth provider/resource boundary, not a Recovery Actor, task claim CAS or owner-approval authority. KV/service account fit and free quota still require verification. |
| [oauth4webapi](https://github.com/panva/oauth4webapi) | Low-level OAuth/OIDC client routines, PKCE, metadata, token validation/introspection/revocation; zero dependencies; OIDC certification statements in upstream README | Preferred protocol library for a future OAuth client/callback integration rather than implementing OAuth primitives. It does not provide sessions, account policy, owner allowlists, claim transactions or secret custody. |

No new component is selected or added as a dependency in this pass. Cloudflare Workflows is the strongest orchestration candidate to evaluate before building a general workflow engine, but its account eligibility and fit with the current GitHub-native dispatch/security model must be proven first. The task-specific single-use approval/claim invariant remains separate from workflow orchestration.

## 5. Next bounded work

1. Keep PR #37 and PR #54 unmerged while they remain based on a common ancestor 19 commits behind current default.
2. Reconcile the claim proof stack onto a fresh branch based on `6fdcedebeba62715122e43a75c6ad6d926321ce7`; preserve provenance and rerun exact-head CI. Do not force-push or rewrite the existing PR branches as part of this audit.
3. Before hosted D1, resolve the dual lease API, caller-controlled resumability and trusted-time/issuer adapter boundary with negative tests.
4. Evaluate Cloudflare Workflows as a reuse candidate against exact account free entitlement, quota, cost/no-paid-fallback and dispatch authority constraints. Do not provision or deploy during this evaluation.

## 6. Status

- Local D1 proof CI: SUCCESS for exact PR #54 head; local Workers Vitest scope only.
- Hosted D1 contention: NOT RUN.
- Claim/lease implementation: DESIGN / LOCAL PROOF ONLY; production qualification NOT VERIFIED.
- PR #37: OPEN / DRAFT; historical CHANGES_REQUESTED; live Worker path NOT QUALIFIED.
- PR #54: OPEN / DRAFT; 132 ahead / 19 behind; not integrated.
- PR #64: OPEN / DRAFT; final head `9949e857a0fd8d4ff9bc8836e4c511feac65c50b`, 12 ahead / 0 behind; exact-head CI NOT VERIFIED; reviews 0; threads 0.
- Cloudflare free entitlement: NOT VERIFIED; no resources created.
- Dispatch: FAIL-CLOSED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
