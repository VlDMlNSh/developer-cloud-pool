# Projection Recovery reuse crosswalk and implementation gap — 2026-11-11

## Scope and immutable evidence

- Status: SOURCE-TO-CONTRACT RECONCILIATION / DESIGN ONLY / NOT IMPLEMENTED / NOT QUALIFIED.
- Implementation candidate: PR #67 `dea09ffe94059f446c74fada37971087ec4878eb`, base `Основной@221f216c00ca7e5596bcc682ba185ad155a10603`.
- Existing Recovery Actor design: PR #60 `234fb2ee40265e26fac00c69ac1b6192766602cb`, based on `864213e2ff5b4fa956ba405dea8137a44d812f49`, OPEN / DRAFT / UNMERGED, exact-head workflow query empty.
- Existing issuer/component audit: PR #63 `4d2f6ac2d96980f28ecbab53b46b2984d7dda9f6`, based on `6fdcedebeba62715122e43a75c6ad6d926321ce7`, OPEN / DRAFT / UNMERGED, exact-head workflow query empty.
- This is a source/documentation crosswalk only. No code, migration, workflow, permission, secret, hosted resource, dispatch or deployment changes.

## 1. Reuse finding: the current outbox is the correct state substrate, not an authority issuer

The existing implementation already provides a strong projection-delivery state machine:
- immutable outbox identity and event digest (migration 0009);
- bounded five-attempt delivery and terminal dead-letter constraints (migration 0007);
- owner + monotonic delivery-generation + expiry fencing for acquire/retry/ack;
- private ACK inside the orchestrator after GitHub marker/label read-back;
- deterministic event marker and digest conflict/duplicate detection;
- no mutation of finalized task/attempt state during projection delivery.

Source blobs at PR #67:
- `projection-outbox.mjs`: `cd27ba98c5716ef568c0672250b652d68e714ea5`
- `projection-delivery.mjs`: `3ddb3fd8e56dd9c85f3160aba066a25ba4f13dad`
- `projection-reconciler.mjs`: `2f83befc145d39ea60f06fe5b9e9033f89df40c0`
- migration 0007: `767d95a30fa0a14c79e88c8c58392bfec9cdddc2`
- migration 0009: `86919425f498dc634329bb783a3ca6ae7a0ff6a1`
- projection integration contract: `f7bf604f5d68ed5a7ec037afdfeb18aae01f61cd`
- projection delivery tests: `602fb9aec4aca161f0065df16d9c4b428cbbf11f`

Do not replace this with another queue, database engine, scheduler or projection reconciler. The missing feature is a separately authenticated orphan-lease recovery authority, not a new delivery system.

## 2. Exact gap in the current dead-letter helper

The current exported helper is:

`deadLetterExpiredProjection(db, outboxId, workerId, generation, now)`

Its SQL predicate requires:
- `status = 'leased'`;
- the exact current `lease_owner = workerId`;
- exact `lease_generation_delivery`;
- `lease_expires_at <= now`;
- `delivery_attempts >= MAX_PROJECTION_DELIVERY_ATTEMPTS`.

It then clears lease owner/expiry, marks dead-letter and reads back terminal fields. This is useful same-owner expiry handling, but it does not independently recover an orphaned worker: the caller must still supply the original lease owner. The function accepts caller-provided `workerId`, `generation` and `now`; those are storage predicates/test inputs, not authenticated actor identity or a qualified production clock.

It also does not accept or verify:
- Recovery Grant / issuer / subject / audience / operation;
- exact repository/outbox/attempt/generation/event-digest capability tuple;
- nonce or grant replay state;
- revocation/policy epoch;
- trusted-time provenance;
- Recovery Actor-specific immutable audit attribution.

Migration 0007's status trigger attributes the transition with `COALESCE(NEW.lease_owner, OLD.lease_owner)`. Since the dead-letter update clears `NEW.lease_owner`, the recorded actor resolves to the old delivery worker. This preserves lease-owner history but cannot distinguish an independent Recovery Actor. A future migration must add explicit verified recovery attribution without rewriting the original lease-owner evidence.

No direct test invoking `deadLetterExpiredProjection` or proving independent Recovery Actor authorization was found in the inspected PR #67 test paths. Existing delivery tests prove normal delivery, stale generation rejection, concurrent lease acquisition and immutable identity—not the orphan-worker recovery grant flow. Do not claim the Recovery Actor path tested.

## 3. Contract reuse crosswalk

| Existing component/contract | Reusable invariant | Recovery Actor use | Missing qualification |
|---|---|---|---|
| Immutable outbox identity (migration 0009) | Event identity, repository/issue/attempt binding and digest cannot be rewritten | Bind grant to exact immutable outbox row and event digest | Grant verification and actor authority |
| Delivery lease generation | Stale owner/generation cannot ACK or retry | Recheck current delivery generation in the recovery transaction | Orphan recovery must not impersonate prior worker |
| Five-attempt budget + terminal trigger (0007) | Dead-letter only after exhaustion; terminal row cannot be mutated | Preserve exact configured ceiling and database terminal guard | Explicit recovery actor attribution and nonce |
| Projection marker/read-back | Duplicate or conflicting event markers deny; ambiguous external write reconciles before another POST | Reuse as projection proof; Recovery Actor itself must never POST to GitHub | No GitHub write permission for Recovery Actor |
| Shared Immutable Claim Lifecycle / Trusted Reconciliation Authority references in PR #60 issuer contract | PR #60 says these backend-neutral contracts specify authenticated issuer, scoped capabilities, revocation, policy version, one-use grants, immutable bindings and trusted time | Reuse those *patterns* only through the projection-specific audience and operation | Canonical documents were not located by exact title/path in the current Cloud Pool default branch or the checked MediaHub main source snapshot; direct source read-back NOT VERIFIED. Do not assume an exact interface or import a cross-domain authority |
| MediaHub Wave 486/487 Security Issuer Authority target | Separately governed issuer, distinct from Jarvis, ASTRA A0, executors and Product State Authority | Potential future upstream issuer, if owner-approved policy explicitly admits this consumer | PR #599/#600 remain DRAFT; no deployed issuer, key custodian or operational ownership |
| SOPS + age | Selected encrypted configuration/secret-file primitives in MediaHub architecture | Potentially protect static issuer trust configuration if Cloud Pool cross-repository adoption is separately approved | Not an online grant issuer, revocation service or nonce ledger; no Cloud Pool deployment evidenced |
| Cosign | Selected artifact provenance mechanism | May verify signed Recovery Actor build artifact | Does not authorize an outbox transition or issue runtime grants |
| OpenBao / immudb | Research candidates for key custody / tamper-evident audit mechanics | No adoption in this pass | OpenBao remains FUTURE-GATED; immudb not selected; neither creates authority/ownership by itself |

## 4. Required target transaction — reuse, do not duplicate

A future implementation should be a narrowly scoped Recovery Actor composition function over the existing outbox state. Its one allowed operation remains `dead_letter_expired_projection`.

The transaction must atomically:
1. verify/recheck exact outbox ID, immutable repository/attempt/event digest and current delivery generation;
2. require `leased`, expired lease and exhausted delivery attempt budget;
3. validate the already-authenticated grant descriptor against exact subject/audience/operation/resource and current issuer/policy/revocation epoch;
4. evaluate grant validity and lease expiry using one qualified trusted-time boundary;
5. consume a unique nonce/grant ID under a DB uniqueness constraint;
6. mark only the outbox row dead-letter, clear lease owner/expiry, and persist explicit Recovery Actor identity, grant digest/ID and bounded reason;
7. append exactly one immutable `delivery.dead_letter` event with actor type `recovery_actor` and recovery principal ID;
8. read back the exact row and event before returning success.

If the D1 transaction semantics cannot make nonce consumption, dead-letter transition and audit event all-or-nothing, keep the actor disabled. Do not use an in-memory lock, GitHub Actions concurrency group or sequential writes as a substitute.

## 5. Negative-first additions required beyond existing tests

- RA01: original delivery worker gone; no caller may impersonate its `workerId`; valid Recovery Grant succeeds once.
- RA02: missing/forged issuer, subject, audience or operation denies without state mutation.
- RA03: wrong repository/outbox/attempt/generation/event digest denies.
- RA04: expired/not-yet-valid grant, revoked key/principal or stale revocation state denies.
- RA05: replayed nonce/grant ID and two concurrent uses yield at most one transition/event.
- RA06: live lease, non-exhausted attempts, wrong status or stale generation denies.
- RA07: audit trigger records the Recovery Actor, not the expired worker; original lease owner remains preserved separately.
- RA08: attempt to alter task/attempt tables, requeue, retry, dispatch or GitHub-write from recovery path is impossible.
- RA09: transaction rollback on audit/nonce/transition failure leaves all three unchanged.
- RA10: ambiguous commit/read-back returns NOT VERIFIED and does not blindly repeat.
- RA11: exact successful dead-letter read-back proves only outbox changed; task and attempt rows are byte-for-byte/state-for-state unchanged.

Existing N01–N22 from the corrected Capability v1 contract remain applicable. These RA cases add source-specific assertions; they do not replace the generic negative matrix.

## 6. Governance and source availability caveat

PR #60 issuer contract references Shared Immutable Claim Lifecycle and Trusted Reconciliation Authority contracts, but their canonical file paths and immutable blob IDs are not included in PR #60's two-file change set. Exact-title search against the current Cloud Pool default branch and the checked MediaHub main snapshot returned no direct source file. Therefore:
- the existence and described contents are recorded as a statement made by PR #60;
- exact contract text, status, version, owner and compatibility are NOT VERIFIED in this pass;
- do not claim the Recovery Actor already implements or is conformant with those contracts;
- next source pass should resolve their canonical repository/path/ref from the PR #60 source authorship/context before relying on them.

Operational issuer, trust anchor/key custody, principal registry, revocation publisher, trusted time, private audit sink, privacy/legal retention owner and recovery quorum remain NOT EVIDENCED in accepted Cloud Pool governance. Wave 486/487 issuer authority remains draft target only.

## 7. Status and next step

- Existing projection outbox substrate: LOCAL PROOF / useful reuse candidate.
- Same-owner expired-lease dead-letter helper: LOCAL PROOF only.
- Independent orphan-worker Recovery Actor: NOT IMPLEMENTED / NOT QUALIFIED.
- Issuer, revocation and trusted time: NOT QUALIFIED.
- Hosted D1: NOT QUALIFIED.
- Dispatch: FAIL-CLOSED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
- No code/tests/workflows/secrets/hosted resources/dispatch/deployment changed in this pass.
- Independent review remains deferred until after actual Cloud Pool launch per owner direction.

Next: identify the canonical source refs for the Shared Immutable Claim Lifecycle and Trusted Reconciliation Authority contracts; then confirm their issuer/time/revocation interface without widening the projection-specific scope.

Canonical MediaHub map: https://github.com/VlDMlNSh/mediahub-os/blob/docs/mediahub-chat-tree-map-20261012/docs/architecture/MEDIAHUB-CHAT-TREE-MAP.md
