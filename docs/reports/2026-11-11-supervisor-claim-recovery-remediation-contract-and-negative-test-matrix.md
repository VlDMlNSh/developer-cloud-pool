# Supervisor Claim / Recovery Remediation Contract and Negative Test Matrix — 2026-11-11

## 1. Scope and immutable source boundary

- Repository: `VlDMlNSh/developer-cloud-pool`.
- Default branch target: `Основной@6fdcedebeba62715122e43a75c6ad6d926321ce7`.
- Documentation branch at start: `docs/recovery-actor-component-fit-2026-11-11@6836cd6a72b306244944ad552fac52d33f81de49`.
- Contract and test-design only. No runtime, schema, workflow, permission, secret, variable, dispatch, deployment or merge changes.
- Primary source blobs: Supervisor `52bf03ca889edd92fd10c71ae96a2e35e106d43f`; Supervisor workflow `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`; Worker workflow `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`; durable claim decision `830a549809d10015d5662da562cff82710c3aa11`.
- Issue #38 remains the acceptance contract for durable single-use claims.

## 2. Non-negotiable protocol invariants

1. **One logical task, one active claim:** at most one current claim generation may be authoritative for a task, regardless of how many approvals or delivery attempts exist.
2. **Single-use grant:** grant consumption, claim creation and outbox insertion commit atomically; the same grant cannot be consumed twice.
3. **Authority before mutation:** verify issuer identity/authorization, audience, subject, task binding, immutable envelope digest, expiry against trusted time, key status/revocation and nonce before consuming the grant.
4. **No ambiguous retry:** unknown dispatch outcome persists as `indeterminate`; never infer rejection from timeout/connection reset and never return directly to `ready`.
5. **Monotonic fencing:** every successful lease acquisition/reclaim increments task generation. Heartbeat, delivery, acknowledgement, terminal report and projection write must match task ID + claim ID + generation + execution ID + envelope digest.
6. **Recovery requires positive evidence:** absence from a bounded Actions run listing, stale Issue `updated_at`, or missing comment is not proof of no execution. Reconcile through authoritative dispatch ledger and run identity.
7. **Projection is not authority:** Issue labels/body/comments are read models, not claim ownership.
8. **Least privilege by job:** untrusted task/runtime jobs receive no broad Issues/Actions write token. Dispatch authority is isolated to a narrowly scoped trusted job/service; claim authority is separate.
9. **Append-only attributable audit:** each transition records actor/issuer, prior/new state, task/claim/execution IDs, generation, envelope digest, trusted timestamp, idempotency key and decision reason.
10. **Fail closed:** missing issuer, clock, revocation, audit, lease or reconciliation evidence prevents claim/dispatch.

## 3. Target transition model (design only)

`ready` → `authorized` → `claimed(g)` → `outbox_pending` → `dispatching` → `running(g, execution_id)` → `terminal`

Exceptional states:
- `indeterminate`: dispatch/commit response ambiguous; only authoritative reconciliation resolves it.
- `retryable`: proven no execution occurred; requires new attempt identity and explicit transition.
- `expired`: grant/lease expired according to trusted time; expiry alone does not release a possibly-running execution.
- `dead_letter`: bounded delivery/retry policy exhausted; operator recovery requires a new authorized decision.
- `revoked`: issuer/key/principal authorization revoked; no new claim or lease extension.

Every transition is a conditional write against expected prior state and generation. A terminal transition is immutable for an execution identity. New attempts cannot overwrite earlier audit history.

## 4. Negative/adversarial test matrix

| ID | Finding / attack | Setup and fault injection | Required assertion | Existing evidence / gap |
|---|---|---|---|---|
| N01 | Same task claimed by concurrent Supervisors | 50+ independent requests, same task and same/different grant IDs, synchronized before write | Exactly one active task claim/generation; losers conflict; one authoritative outbox event | PR #54 local contention proof exists; task-wide uniqueness across distinct approvals must be explicitly verified; hosted D1 NOT QUALIFIED |
| N02 | Replay single-use grant | Replay identical grant concurrently and after commit | Exactly one consume, claim and outbox event; all replays denied | PR #36/#39 local consume/outbox proofs; hosted authority not qualified |
| N03 | Two grants for same task | Two distinct valid grants race for one task ID | Unique active task claim; second grant cannot create parallel active execution | Per-approval uniqueness does not prove task-wide uniqueness; mandatory missing regression |
| N04 | Forged/unsigned issuer approval | Wrong issuer, audience, subject, task, digest or invalid signature | Reject before nonce consumption; no state/outbox mutation | Default path lacks accepted operational issuer |
| N05 | Revoked issuer/key/principal | Revoke before use and between claim and dispatch | New consume/dispatch denied according to revocation semantics; reason audited | Revocation authority/operator not evidenced |
| N06 | Caller-controlled or skewed time | Caller supplies time; clock rollback; future-created or expired grant | Ignore caller clock; use trusted time; enforce not-before/expiry boundaries | Trusted-time service/owner not evidenced |
| N07 | Commit succeeds, HTTP response lost | Commit claim+outbox then drop response | Same idempotency key returns same durable result; no duplicate | Local SQLite/Workers proof covers narrow commit/response loss; hosted D1 NOT QUALIFIED |
| N08 | Dispatch accepted, response lost | GitHub accepts dispatch; transport times out before 2xx reaches caller | Persist `indeterminate`; no requeue; reconcile exact execution | Default path returns to ready on exception |
| N09 | Dispatch authoritatively rejected | Inject validated rejection before provider acceptance | Retry only when rejection is proven and new attempt policy allows | Authoritative dispatch adapter not evidenced |
| N10 | Delayed Worker appears after stale scan | Recovery sees no run in first 100 results; delayed run appears later | No requeue from bounded absence; stale worker fenced by generation | Default recovery uses bounded run list and Issue age |
| N11 | Worker crashes at every transition | Kill before consume, after consume, after outbox, after dispatch, after start, before ack and after terminal commit | Deterministic restart/reconcile; no duplicate side effects or lost accepted task | PR #39 proves enqueue, not full consumer/recovery |
| N12 | Stale generation heartbeat/finalizer | Reclaim increments generation; old Worker sends heartbeat/success/failure | Every stale write rejected; new generation unchanged | Default finalizer has no run/generation fencing |
| N13 | Envelope mutation after dispatch | Change issue body/profile/SHA after Worker validation but before finalizer | Finalizer compares stored immutable digest and refuses stale projection update | Default report path not bound to exact envelope |
| N14 | Issue closed/reopened or conflicting labels | Mutate issue and lifecycle labels between claim and finalizer | Projection cannot grant ownership; conditional update rejects conflict | Current state checks do not supply durable authority |
| N15 | Audit actor lost during transition | Clear lease owner in same update as delivered/retryable/dead-letter transition | Event retains previous lease owner or explicit transition actor; never NULL for attributable action | PR #54 head `15a09c910f52553c59796260131a6b5a4a39c15f`, run 43010770730 SUCCESS; local Workers/D1 only |
| N16 | Duplicate outbox delivery / crash before ack | Deliver same event repeatedly; crash after side effect before ack | Idempotent receiver/stable key prevents duplicate side effect; ack is fenced | Integrated delivery/consumer protocol not accepted |
| N17 | Workflow token privilege escalation | Static permission scan and per-job negative capability test | Runtime cannot write Issues, dispatch workflows, edit refs or secrets; trusted dispatch job only gets minimum scope | Default Supervisor has workflow-level `issues:write` + `actions:write` |
| N18 | Secret leakage / account confusion | Untrusted payload and log/error paths use sentinel fixtures | No secret in payload/log/artifact; provider/account identities remain separate; no fallback/key substitution | No live secrets read; isolation not qualified |
| N19 | Audit sink unavailable/full | Deny audit append during claim, dispatch and recovery | Fail closed or durable quarantine; never proceed silently | Audit sink/operator not evidenced |
| N20 | Backup restore/replay rollback | Restore older snapshot and replay outbox/event stream | Generation/nonce/revocation cannot roll back; duplicate events idempotent; stale events rejected | Hosted restore/rollback qualification NOT RUN |

### Required test layers

- **Pure unit:** envelope canonicalization, signature claims, state machine, transition guards, idempotency keys and generation comparisons.
- **Workers runtime + local D1:** SQL conditional writes/triggers, rollback, uniqueness, outbox retry and actor attribution. Existing PR #36/#39/#54 are reusable inputs, not acceptance.
- **Concurrency:** 50+ independent HTTP requests, synchronized same-task/same-grant/distinct-grant attempts; assert one active task claim and one authoritative generation.
- **Fault injection:** commit/response loss, dispatch accepted/response loss, worker kill at every transition, delayed Actions visibility, audit outage and clock/revocation changes.
- **Hosted qualification:** target Cloudflare account's real D1/Worker only after approved issuer, ownership, quota/free-tier, secret custody and change authorization. Local Miniflare success is not a substitute.
- **Security review:** authorized separate reviewer checks issuer trust, token/secret scope, confused-deputy resistance, workflow permissions, audit and recovery.

## 5. Reuse and evidence disposition

- PR #36: single-use consume proof; caller-supplied binding/time is not issuer authentication.
- PR #39: atomic consume + claim + outbox enqueue proof; does not yet prove task-wide uniqueness across distinct grants, complete consumer/delivery, lease/reclaim/fencing or hosted D1.
- PR #54: 50-way local contention and projection outbox. Head `15a09c910f52553c59796260131a6b5a4a39c15f`; exact-head run `43010770730` COMPLETED/SUCCESS. Author-side correction preserves actor attribution for retryable/delivered/dead-letter. Local Workers/D1 only; not independent review or hosted qualification.
- PR #37: reusable Worker boundary/reduced dispatch scope candidate; OPEN/DRAFT/UNMERGED; default integration not authorized.
- Extend existing Workers Vitest/D1 stack; do not introduce another queue engine without a demonstrated capability gap.
- Bounded repository search did not return a validated drop-in satisfying issuer-bound single-use authorization, task-wide atomic claim, outbox, fencing and free-tier hosted constraints. This is not proof that no such implementation exists.

## 6. Acceptance gates

1. **Authority:** accepted issuer/Trust Custodian, principal registry, revocation publisher, trusted-time source and key lifecycle with operational owners.
2. **Protocol:** task-wide active-claim invariant, immutable envelope, single-use grant, idempotent outbox and indeterminate dispatch reconciliation approved.
3. **Recovery:** lease owner, expiry, monotonic generation, stale-writer rejection, restore/replay and dead-letter procedures tested.
4. **Audit:** durable append-only sink and on-call owner; transition attribution cannot be null or caller-forged.
5. **Isolation:** job-level least privilege, no untrusted secret exposure, account/quota boundaries and no paid fallback verified.
6. **Tests:** N01–N20 pass at applicable unit/local/hosted layers with exact SHA evidence.
7. **Governance:** independent authorized security review, required approval enforced on every merge path, threads resolved, exact-head CI successful.
8. **Runtime acceptance:** remote web UI, permitted worker execution, routing, quota, persistence/restore, security controls and independent Contour A acceptance evidenced.

Until then, `POOL_DISPATCH_ENABLED` remains false/unset; no manual or alternate dispatch path.

## 7. Live evidence snapshot

- Default: `Основной@6fdcedebeba62715122e43a75c6ad6d926321ce7`.
- Documentation branch at start: `docs/recovery-actor-component-fit-2026-11-11@6836cd6a72b306244944ad552fac52d33f81de49`.
- PR #63/#64 OPEN/DRAFT/UNMERGED; exact-head PR workflow lists and combined statuses empty (NOT VERIFIED).
- Active ruleset #26550182 applies only to `refs/heads/Основной`; PR required, zero required approvals, thread resolution required, no bypass actors.
- Issues #38 and #63 OPEN.
- PR #54 local exact-head run 43010770730 SUCCESS at `15a09c910f52553c59796260131a6b5a4a39c15f`; PR #39 run 42329993548 SUCCESS at `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`; PR #37 runs 42284051309 and 42284051311 SUCCESS at `5587a4e013507b5be330fd0c49ce1fc836faa946`. Historical proof only, not current documentation-branch CI.
- Operational issuer/trust/revocation/time/audit owners NOT EVIDENCED; hosted D1 NOT QUALIFIED; Recovery Actor NOT IMPLEMENTED / NOT QUALIFIED.
- No secrets, provider calls, dispatch, resource creation, deployment, merge or permissions mutation in this pass.
- Contour A BLOCKED / NOT ACCEPTED; Contour B DEFERRED.

## 8. Next bounded step

Map N01–N20 to actual PR #36/#39/#54 source/test files. Identify the smallest missing task-wide uniqueness and consumer/fencing additions, then obtain authorized independent review. No hosted provisioning or live dispatch while authority and free-tier authorization remain unproven.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
