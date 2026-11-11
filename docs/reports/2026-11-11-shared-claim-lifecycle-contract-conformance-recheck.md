# 2026-11-11 — Shared Claim Lifecycle Contract Conformance Recheck

## Scope and immutable targets

Read-only conformance review of:
- Shared contract blob `595da5bdaf832a48e032eb51a283e2456943b248` at `docs/contracts/SHARED-IMMUTABLE-CLAIM-LIFECYCLE-CONTRACT.md`.
- Autonomous-First policy blob `aa0e529ff759af6d4267d02776e1139015377778`.
- PR #37 head `1be8672c1be1a720b6c813dcafff5c020b6456ae`.
- PR #37 Supervisor workflow blob `4a176e5ebb3cf1e7ef29b00164498e34a4f9fafc`.
- PR #37 Worker workflow blob `04d63d815d2f7d15cfa80c932b614d559385ff0a`.
- PR #37 Supervisor script blob `2d0611851ff738b2aeb377f464e5fa7d821f3696`.
- PR #54 local finalization proof head `ec3f3266ca28c4fb5633a9475cc6f396a4677974`.
- PR #39 local claim/outbox proof head `ecc7193cdc7b1e58fdba6c27c1a9fdb51f2bb833`.
- PR #57 native workflow-run evidence proof head `2c263e8a9915f0bc8e0698cde816e87cb2376538`.

No source, schema, workflow, permission, secret, dispatch, deployment, merge or production state was changed. This was a source/document/API read-only pass; no tests were executed in this pass.

## Decision and policy reconciliation

The Shared Immutable Claim Lifecycle Contract is already published as a backend-neutral PROPOSED contract. It explicitly rejects GitHub labels as authoritative CAS, requires immutable authenticated envelopes, monotonic fencing generations, atomic claim+outbox, authenticated worker capability, fenced terminalization, atomic audit/outbox, and real-backend contention/recovery qualification.

Issue #38's latest owner-authored comment confirms:
- Autonomous-First policy supersedes an external APPROVE as a universal prerequisite for every engineering iteration.
- Multi-role self-audits are required after safe activation, but do not establish external independence and cannot self-assign ACCEPTED.
- Backend selection remains deferred; local PR #39 is not remote D1 qualification.
- Dispatch remains disabled.

Therefore this pass does not request an external review as a routine prerequisite. It also does not weaken security/governance gates or final Contour A acceptance.

## PR #37 current-head findings

PR #37 remains OPEN / DRAFT / UNMERGED at `1be8672c1be1a720b6c813dcafff5c020b6456ae`.

Positive correction:
- The prior invalid placement of `job.workflow_repository`, `job.workflow_file_path`, and `job.workflow_sha` was corrected: they now appear in the validation step's `env`, not job-level `env`.
- Exact-head PR CI runs `42484039940` (Reusable Pool Worker Boundary Validation) and `42484039932` (Pool Contract Validation) are COMPLETED / SUCCESS.
- This closes the previously observed workflow-context placement defect for the exact reviewed source. It does not prove a live reusable Worker execution.

Open F2 / authoritative claim gap:
- Supervisor intake still changes Issue labels from ready to claimed and verifies a subsequent read-back. It has no atomic conditional-write claim service, claim ID, immutable claim generation or authoritative lease.
- Worker checks that the Issue is open, has exactly one managed state equal to `pool:claimed`, and that the body SHA/profile match its inputs.
- Finalizer only checks that `pool:claimed` is present before writing a terminal label. It does not bind the terminal transition to the current immutable envelope digest, claim ID/generation, exact Worker run ID + run_attempt, or authenticated worker capability.
- A read before PATCH is not CAS. The Issue may change between read and write; the terminal projection can therefore race with an edit or a competing actor.
- The current PR remains a fail-closed draft boundary, not an authoritative single-use claim implementation.

Open F10 / split terminal evidence:
- Finalizer performs Issue label PATCH/read-back and then a separate comment POST.
- If the comment POST fails or its response is lost after the label mutation, terminal projection and audit evidence can diverge.
- This cannot satisfy the shared contract's atomic terminal state + audit/outbox invariant. Do not attempt to repair this by adding more label/read-back steps; move authoritative finalization to the selected transactional claim store and make GitHub labels/comments recoverable projections.

Review state:
- One formal CHANGES_REQUESTED review exists on an earlier PR #37 revision; it is not a current-head approval.
- No current-head APPROVED review was observed. Review history is evidence of prior findings, not a mandatory blocker for each Autonomous-First iteration.
- Exact-head CI success does not close F2/F10 or establish production qualification.

## Local D1 proof conformance

PR #39:
- Exact local Workers/D1 CI run `42329993548` / job `128274072508` previously recorded SUCCESS.
- Its local conditional consume + claim + task outbox proof is useful transaction evidence only. It does not authenticate the issuer, establish trusted time, or qualify hosted D1.

PR #54:
- Exact local Workers/D1 CI run `42537241204` / job `128904147572` previously recorded SUCCESS.
- It demonstrates bounded local attempt/finalization/projection-outbox behavior, not hosted state authority.
- Existing conformance review identifies F-01: stored terminal event digest is `COALESCE(result_digest, provenance_digest, input_digest)`, not a versioned canonical digest binding the complete immutable finalization event.
- Existing conformance review identifies F-02: migration 0006 uses `NEW.lease_owner` for transition actor, while retryable/delivered updates clear that field; resulting append-only events lose actor attribution.
- The unresolved PR #54 inline review thread on migration 0006 line 89 remains relevant. Tests do not currently assert actor retention for retryable/delivered transitions.
- Do not choose canonical serialization or actor semantics implicitly in implementation. A versioned finalization event schema, canonical byte representation, digest version/compatibility rule, and actor identity semantics must be explicitly selected first, then covered by golden vectors and adversarial tests.

PR #57:
- Current PR head observed as `2c263e8a9915f0bc8e0698cde816e87cb2376538`, OPEN / DRAFT / UNMERGED.
- The read-only native Actions attempt evidence proof does not itself supply an authenticated Resolver capability, authoritative claim store, trusted clock, or side-effect reconciliation authority. Treat executor terminal status as evidence only, not authorization to retry.

## Consolidated gap matrix

| Contract invariant | Current evidence | Status |
|---|---|---|
| Immutable owner/issuer-authenticated envelope | Contract defined; live issuer not qualified | NOT QUALIFIED |
| Atomic single-use claim + outbox | PR #39 local D1 proof | VERIFIED locally only |
| Hosted conditional-write backend | No selected/qualified hosted backend | NOT VERIFIED |
| Monotonic claim/lease fencing | Contract defined; PR #37 labels are non-CAS | NOT IMPLEMENTED as authoritative service |
| Native run + run_attempt binding | PR #57 synthetic/read-only proof | VERIFIED within fixture scope only |
| Authenticated Worker capability | Contract target; production issuer absent | NOT IMPLEMENTED |
| Canonical full-field terminal event digest | PR #54 uses result-first coalesce | FAILS contract conformance |
| Durable terminal audit attribution | PR #54 retryable/delivered actor may be NULL | OPEN finding |
| Atomic terminal state + audit/outbox | Local D1 trigger pattern exists, but digest/actor gaps remain | NOT QUALIFIED |
| GitHub label/comment projection recovery | Fake projection proof exists; no hosted integration | NOT QUALIFIED |
| Trusted production time and revocation | Caller-supplied test time remains | NOT QUALIFIED |
| Free-tier entitlement, quotas, isolation | No hosted backend qualification | NOT VERIFIED |

## Next bounded step

Keep dispatch disabled. The next engineering slice should be a design-only, versioned finalization-event schema decision:
1. Define the complete immutable event field set and canonical serialization/version.
2. Define authenticated actor identity for worker terminalization and projection delivery transitions; do not use a mutable/cleared lease field as an implicit actor.
3. Define digest recomputation, compatibility/replay policy and golden vectors.
4. Map the schema to PR #54 migrations 0004/0006 and adapter semantics before editing code.
5. Then make a proof-branch-only correction with conflicting-field replay, actor-retention, transaction rollback, concurrency and exactly-one-event/outbox tests.

Do not deploy or provision hosted D1 until entitlement, issuer, trusted time, access isolation, quotas, backup/recovery and no-cost guarantees are separately verified. Do not enable either dispatch gate.

## Status

- PR #37 F1 context-placement correction: VERIFIED by source read-back and exact-head CI.
- PR #37 F2 authoritative claim/finalizer fencing: NOT IMPLEMENTED.
- PR #37 F10 atomic terminal audit: NOT IMPLEMENTED.
- PR #39 local claim/outbox proof: VERIFIED within synthetic local D1 scope only.
- PR #54 finalization digest: FAILS target contract conformance.
- PR #54 delivery actor attribution: OPEN finding.
- Hosted claim service / issuer / trusted time / free-tier entitlement: NOT VERIFIED / NOT QUALIFIED.
- Dispatch: DISABLED / fail-closed.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
