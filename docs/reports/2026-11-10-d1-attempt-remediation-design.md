# 2026-11-10 — Remediation design for D1 attempt lifecycle findings F-1/F-2/F-3

## Scope and pinned inputs

Design-only pass. No implementation, deployment, resource provisioning or dispatch.

- Issue #38: https://github.com/VlDMlNSh/developer-cloud-pool/issues/38
- PR #37 exact current head: `1be8672c1be1a720b6c813dcafff5c020b6456ae` (OPEN/DRAFT/UNMERGED).
- PR #49 exact head: `b9067dc7d06245893cd4e208f6215438efe5ca64` (OPEN/DRAFT/UNMERGED).
- PR #50 exact head: `65233f57038a9996e4a6e939abde3642a33d467d` (OPEN/DRAFT/UNMERGED).
- PR #51 exact head: `32c88e50e173e6b19bc6c61723ab6474a3c08145` (OPEN/DRAFT/UNMERGED).
- PR #51 local Workers-runtime CI run `42536377720`: COMPLETED / SUCCESS. Local test evidence only.
- Shared lifecycle contract blob `d9ab1515731580dcbeb15aaf14f631ce09ff1b52`.
- Autonomous-First policy blob `aa0e529ff759af6d4267d02776e1139015377778`.

## Correction to backend status

The canonical shared lifecycle contract and the 2026-11-06 Cloudflare account qualification record state that backend selection is deferred, account plan/card-free eligibility is NOT VERIFIED, and the connected account had no D1 database or Worker scripts in the then-read-only inventory. The prior 2026-11-10 architecture comparison described D1 as "selected for qualification"; this wording must be interpreted only as a preferred candidate for future investigation, not a selected/approved production backend. **Authoritative disposition remains: backend NOT SELECTED; D1 is a candidate only.** No hosted D1 qualification or resource entitlement is established. This design does not authorize resource creation.

## F-1 — remove caller-controlled resumability

### Decision

Expired lease is never sufficient evidence that an executor stopped. A caller boolean such as `resumable: true` must not authorize takeover. The default and only currently qualified behavior is DENY + preserve indeterminate state.

### Proposed state and authority model

- `running -> indeterminate`: allowed only after the current lease expires; preserves attempt identity, lease owner, generation and evidence. Existing reconciliation queue records this transition.
- `indeterminate -> resolved`: no automatic transition in the current implementation. A future resolver may accept only an authenticated, separately authorized resolution envelope.
- A resolution envelope must bind: issuer identity/type; approval/decision ID; repository numeric ID; task key; attempt ID; input digest; target SHA; observed lease generation; worker run ID; executor identity; evidence digest; issue/expiry timestamps; policy version; nonce/idempotency key.
- Resolver verifies issuer authentication and capability from a trusted source, revocation/expiry, immutable field binding, and replay uniqueness. User-supplied JSON fields or booleans are not proof.
- The resolver must establish that the prior executor can no longer cause effects. Evidence must be specific to the actual execution boundary (for example, confirmed terminal workflow/job/run identity plus proof that all side-effect credentials/capabilities are revoked or expired and all downstream writes are generation-fenced). A workflow being cancelled, a lease expiring, or a runner no longer reporting active is not alone proof that already-started external effects cannot continue.
- If reliable executor fencing cannot be demonstrated, resolver MUST NOT create a replacement attempt or permit re-execution. Keep `indeterminate` and route to human review/manual resolution without dispatch.
- Any later retry must use a new immutable attempt identity only after the trusted resolution records the old attempt as safely stopped/abandoned. It must not mutate the old attempt's identity.

### Implementation implication

Remove the public `resumable` argument and the expired-running branch from `acquireAttemptLease()`. Lease acquisition may handle only a prepared attempt under its current permitted state. A future resolver entry point must be separate, deny-by-default and not exposed to the Worker. Do not add a permissive fallback.

Acceptance tests:
1. Expired running attempt cannot be leased with any caller-provided field.
2. Unknown, expired, revoked, wrong-issuer, wrong-task, wrong-attempt, wrong-generation, wrong-digest, wrong-run or replayed resolution envelope is denied.
3. Evidence of workflow cancellation alone is denied.
4. Missing external-sink fencing proof leaves attempt indeterminate.
5. A trusted, valid resolution (only if the evidence source is actually implemented and verified) is single-use and atomically records resolution + audit.
6. Old generation cannot mutate task, attempt, outbox or downstream sink after resolution.

## F-2 — idempotent transactional attempt creation

### Decision

Use one D1 transactional batch (if D1 is eventually selected and deployed) for the conditional insert and authoritative readback/projection checks. Never implement a SELECT-then-INSERT race as the authority decision.

Proposed transaction shape:
1. Conditional insert attempt with immutable identity, protected by existing primary/unique constraints and task-state preconditions.
2. Insert attempt-created audit event through trigger or explicit statement in the same transaction.
3. Read back exact attempt identity and current task pointer in the same batch.
4. Interpret outcomes only from backend transaction results: exact existing row + exact immutable identity returns idempotent-existing; a conflicting identity is DENY; missing/mismatched row or ambiguous batch result is DENY/RECONCILIATION_REQUIRED.
5. No dispatch decision is returned from attempt creation.

A unique conflict must not be treated as generic infrastructure failure when exact replay can be authoritatively read. Conversely, a response lost after commit must be recovered by a subsequent exact read, never by blindly inserting another attempt. Do not rely on a read outside the transaction to establish the winner.

Acceptance tests:
- 20+ simultaneous exact same-ID/same-payload calls yield one durable attempt and one event; every successful response identifies the same row.
- Simultaneous same-ID/different-payload calls yield one winner; all conflicting payloads denied.
- Response loss after commit followed by exact retry returns existing attempt, no duplicate event.
- Failure in any batch statement rolls back attempt, pointer update and event.
- Task pointer and attempt count remain consistent under concurrent distinct IDs.
- Ambiguous storage response never yields dispatch authorization.

## F-3 — align prepared terminal transition contract

### Decision

Remove `prepared -> failed` from the generic attempt status transition matrix. A prepared attempt has not begun execution and must not use the running-executor terminalization path.

If pre-execution cancellation is needed, define a separate explicit `prepared -> abandoned` operation with:
- authenticated cancellation issuer/capability;
- reason and immutable audit event;
- atomic transition and task projection;
- no Worker execution or dispatch;
- replay-safe exact identity and conflict denial.

Do not overload `failed` to represent cancellation. If that separately authorized operation is not in scope, simply reject prepared-to-terminal updates and test the invariant.

Acceptance tests:
- Direct `prepared -> failed` is rejected.
- Direct `prepared -> succeeded` is rejected.
- If cancellation is implemented, only its dedicated authenticated operation can abandon a prepared attempt and must append exactly one audit event.
- Terminal guard and transition matrix agree for every permitted transition.

## Cross-cutting authority and backend constraints

- Keep immutable lifecycle contract backend-neutral until account eligibility, actual backend and real deployment are verified.
- Existing local D1/Miniflare proof does not qualify a hosted backend.
- The previous Cloudflare read-only account audit recorded no D1 databases/Worker scripts and billing entitlement NOT VERIFIED. Do not infer Free-plan entitlement from public pricing.
- No paid fallback; quota exhaustion, storage errors, transaction ambiguity and unavailable issuer all fail closed.
- Supervisor/Worker/Finalizer remain separate authorities. Worker cannot mint approvals, declare itself resumable, resolve indeterminate attempts or finalize outside its fenced capability.
- No provider/model calls, DSH/Resource Probe, deployment, dispatch, secret access or Contour B work.
- No new database, Durable Object, repo, token, permission or workflow trigger is authorized by this design.

## Execution order

1. Implement F-1 first on a new draft branch based on the exact intended stacked source SHA. Add negative tests before changing behavior. Preserve PR #49–51 as immutable proof history.
2. Implement F-3 in the same bounded patch only if the migration/test compatibility impact is clear; otherwise separate it to avoid mixing behavior.
3. Implement F-2 separately with D1 batch tests and deterministic fault injection. Run the existing Workers-runtime suite.
4. Re-read exact source and migrations; run exact-head CI; record artifacts and digests.
5. Only after all local gates pass, design a hosted-backend qualification proposal. Hosted execution still requires account/plan and access qualification; this design does not authorize provisioning.
6. Keep both dispatch gates fail-closed.

## Status

- F-1 remediation design: DEFINED; implementation NOT STARTED.
- F-2 remediation design: DEFINED; implementation NOT STARTED.
- F-3 remediation design: DEFINED; implementation NOT STARTED.
- Backend: NOT SELECTED; D1 CANDIDATE ONLY.
- Hosted backend and real contention: NOT RUN.
- Issue #38: OPEN / NOT QUALIFIED.
- Dispatch: FAIL-CLOSED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

## Next step

Implement the smallest safe F-1 change first, with tests proving expired attempts cannot be reclaimed by any caller-supplied boolean or metadata. Before implementation, verify the current source base and create a separate draft branch/PR; do not modify the existing PR #49–51 proof heads. The future resolver remains disabled until trusted issuer and executor-fencing evidence are concretely available.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
